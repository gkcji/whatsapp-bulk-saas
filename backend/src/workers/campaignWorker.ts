import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { decrypt } from '../utils/crypto';

const prisma = new PrismaClient();

// ── India message costs in INR (per Meta pricing) ──────────
const MSG_COST_INR: Record<string, number> = {
    MARKETING:      0.58,   // ₹0.58 per marketing message
    UTILITY:        0.14,   // ₹0.14 per utility message
    AUTHENTICATION: 0.14,   // ₹0.14 per auth message
    SERVICE:        0.00,   // Free
};
const getMessageCost = (category?: string) => MSG_COST_INR[category?.toUpperCase() || 'MARKETING'] ?? 0.58;

// ============================================================
// UNIFIED FLOW ENGINE
// Handles: INBOUND reply, BUTTON click, CLICK trigger, TAG, CAMPAIGN
// ============================================================
export async function executeFlow(
    flow: any,
    contactId: string,
    userId: string | null,
    workspaceId: string | null,
    trigger: string,
    triggerBody: string
) {
    try {
        const nodes: any[] = JSON.parse(flow.nodes || '[]');
        let logResult = 'executed';

        for (const node of nodes) {
            const type = (node.data?.type || node.type || '').toUpperCase();

            if (type === 'SEND') {
                await prisma.message.create({
                    data: {
                        body: node.data?.message || 'Auto-reply from flow',
                        direction: 'OUTBOUND',
                        status: 'SENT',
                        contactId,
                        userId,
                        cost: MSG_COST_INR['UTILITY']
                    }
                });
            }

            if (type === 'TAG') {
                const tagName = node.data?.tag;
                if (tagName && (userId || workspaceId)) {
                    let tag = await prisma.tag.findFirst({ where: { name: tagName, userId: userId || undefined } });
                    if (!tag) tag = await prisma.tag.create({ data: { name: tagName, userId: userId || '', workspaceId } });
                    await prisma.contact.update({ where: { id: contactId }, data: { tags: { connect: { id: tag.id } } } });
                }
            }

            if (type === 'CONDITION') {
                const keyword = (node.data?.keyword || '').toLowerCase();
                if (keyword && !triggerBody.toLowerCase().includes(keyword)) {
                    logResult = 'condition_failed';
                    break;
                }
            }

            if (type === 'DELAY') continue; // skip in dev

            if (type === 'STOP') break;
        }

        // Write flow log
        await prisma.flowLog.create({
            data: { flowId: flow.id, userId, contactId, trigger, result: logResult }
        });

    } catch (e) {
        console.error('[FLOW ENGINE]', e);
    }
}

// ============================================================
// CAMPAIGN WORKER — polls Queue table every 5s
// ============================================================
export const startWorker = () => {
    console.log('✅ Campaign Worker polling Queue table every 5s');

    setInterval(async () => {
        try {
            // Pick up to 10 PENDING queue jobs whose campaign is RUNNING
            const jobs = await prisma.queue.findMany({
                where: {
                    status: 'PENDING',
                    campaign: { status: 'RUNNING' }
                },
                include: {
                    campaign: { include: { template: true } }
                },
                take: 10
            });

            if (jobs.length === 0) return;

            console.log(`[WORKER] Processing ${jobs.length} queue jobs`);

            for (const job of jobs) {
                // Mark processing
                await prisma.queue.update({ where: { id: job.id }, data: { status: 'PROCESSING', attempts: { increment: 1 } } });

                try {
                    // Fetch contact + number separately (safe post-schema)
                    const [contact, number] = await Promise.all([
                        prisma.contact.findUnique({ where: { id: job.contactId } }),
                        job.numberId ? prisma.number.findUnique({ where: { id: job.numberId } }) : null
                    ]);

                    if (!contact || !number) {
                        await prisma.queue.update({ where: { id: job.id }, data: { status: 'FAILED' } });
                        continue;
                    }

                    // Check daily limit
                    if (number.sentToday >= number.dailyLimit) {
                        console.warn(`[WORKER] Daily limit reached for number ${number.phoneNumber}`);
                        await prisma.queue.update({ where: { id: job.id }, data: { status: 'PENDING' } }); // put back
                        continue;
                    }

                    const token = decrypt(number.accessToken);
                    const template = job.campaign?.template;

                    // Build payload
                    const payload: any = {
                        messaging_product: 'whatsapp',
                        to: contact.phone,
                        type: template ? 'template' : 'text'
                    };

                    if (template) {
                        payload.template = {
                            name: template.templateName,
                            language: { code: template.language }
                        };
                    } else {
                        payload.text = { body: `Campaign: ${job.campaign.name}` };
                    }

                    // Send via Meta API
                    let metaMessageId = `mock_${Date.now()}`;
                    let success = false;

                    try {
                        const resp = await axios.post(
                            `https://graph.facebook.com/v18.0/${number.phoneId}/messages`,
                            payload,
                            { headers: { Authorization: `Bearer ${token}` }, timeout: 12000 }
                        );
                        metaMessageId = resp.data?.messages?.[0]?.id || metaMessageId;
                        success = true;
                    } catch (apiErr: any) {
                        console.warn(`[WORKER] Meta rejected: ${apiErr.response?.data?.error?.message || apiErr.message}`);
                    }

                    const status = success ? 'SENT' : 'FAILED';

                    const msgCost = getMessageCost(template?.category);

                    // Save message record
                    await prisma.message.create({
                        data: {
                            userId: job.userId,
                            campaignId: job.campaignId,
                            contactId: contact.id,
                            numberId: number.id,
                            templateId: job.templateId,
                            metaMessageId,
                            body: template?.templateName || 'campaign',
                            direction: 'OUTBOUND',
                            status,
                            cost: msgCost
                        }
                    });

                    // Update queue record
                    await prisma.queue.update({ where: { id: job.id }, data: { status } });

                    // Update campaign counters
                    if (success) {
                        await prisma.campaign.update({
                            where: { id: job.campaignId },
                            data: { sent: { increment: 1 }, cost: { increment: msgCost } }
                        });
                        await prisma.number.update({
                            where: { id: number.id },
                            data: { sentToday: { increment: 1 } }
                        });
                        await prisma.numberHealth.update({
                            where: { numberId: number.id },
                            data: { sentToday: { increment: 1 } }
                        });
                    } else {
                        await prisma.campaign.update({ where: { id: job.campaignId }, data: { failed: { increment: 1 } } });
                    }

                    // Deduct from user wallet + log transaction (INR)
                    if (job.userId) {
                        await prisma.user.update({ where: { id: job.userId }, data: { wallet: { decrement: msgCost } } });
                        await prisma.transaction.create({ data: { userId: job.userId, amount: -msgCost, type: 'DEBIT', note: `Campaign: ${job.campaign.name} (INR)`, status: 'SUCCESS' } });
                    }

                } catch (innerErr) {
                    console.error('[WORKER] Job error:', innerErr);
                    await prisma.queue.update({ where: { id: job.id }, data: { status: 'FAILED' } });
                    await prisma.campaign.update({ where: { id: job.campaignId }, data: { failed: { increment: 1 } } });
                }
            }

            // Mark campaigns COMPLETED when queue is fully processed
            const running = await prisma.campaign.findMany({ where: { status: 'RUNNING' } });
            for (const c of running) {
                const pending = await prisma.queue.count({ where: { campaignId: c.id, status: { in: ['PENDING', 'PROCESSING'] } } });
                if (pending === 0) {
                    await prisma.campaign.update({
                        where: { id: c.id },
                        data: { status: 'COMPLETED', completedAt: new Date() }
                    });
                }
            }

            // Reset sentToday at midnight IST (IST = UTC+5:30)
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);
            if (istNow.getUTCHours() === 0 && istNow.getUTCMinutes() < 1) {
                await prisma.number.updateMany({ data: { sentToday: 0 } });
                await prisma.numberHealth.updateMany({ data: { sentToday: 0 } });
                console.log('[WORKER] Daily counters reset at midnight IST');
            }

        } catch (e) {
            console.error('[WORKER] Fatal loop error:', e);
        }
    }, 5000);
};

export { MSG_COST_INR, getMessageCost };
