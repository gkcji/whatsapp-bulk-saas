import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeFlow } from '../workers/campaignWorker';

const router = Router();
const prisma = new PrismaClient();

router.post('/whatsapp', async (req: Request, res: Response) => {
    res.sendStatus(200); // Respond to Meta immediately

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const value = change.value;
                const phoneId = value.metadata?.phone_number_id;

                // Find number record → get userId + workspaceId
                const numberRecord = phoneId
                    ? await prisma.number.findUnique({ where: { phoneId } })
                    : null;
                const userId = numberRecord?.userId || null;
                const workspaceId = numberRecord?.workspaceId || null;

                // ── STATUS RECEIPTS: update messages + campaign counters ──
                for (const s of value.statuses || []) {
                    const metaMessageId = s.id;
                    const raw = (s.status || '').toUpperCase();
                    const statusMap: Record<string, string> = { SENT: 'SENT', DELIVERED: 'DELIVERED', READ: 'READ', FAILED: 'FAILED' };
                    const status = statusMap[raw] || raw;

                    const updated = await prisma.message.updateMany({ where: { metaMessageId }, data: { status } });

                    if (updated.count > 0) {
                        const msg = await prisma.message.findFirst({ where: { metaMessageId } });
                        if (msg?.campaignId) {
                            const update: any = {};
                            if (status === 'DELIVERED') update.delivered = { increment: 1 };
                            if (status === 'READ') update.read = { increment: 1 };
                            if (status === 'FAILED') update.failed = { increment: 1 };
                            if (Object.keys(update).length) await prisma.campaign.update({ where: { id: msg.campaignId }, data: update });
                        }
                    }
                }

                // ── INBOUND MESSAGES: inbox + flow engine ──
                for (const msgObj of value.messages || []) {
                    const phone = msgObj.from;
                    const metaMessageId = msgObj.id;
                    const type = msgObj.type;

                    // Upsert contact (filtered by userId)
                    let contact = await prisma.contact.findFirst({
                        where: { phone, userId: userId || '' }
                    });

                    if (!contact) {
                        contact = await prisma.contact.create({
                            data: {
                                phone,
                                name: value.contacts?.[0]?.profile?.name || 'Unknown',
                                userId: userId || '',
                                workspaceId
                            }
                        });
                    }

                    // Upsert chat thread
                    let chat = await prisma.chat.findFirst({ where: { contactId: contact.id } });
                    if (!chat) {
                        chat = await prisma.chat.create({ data: { contactId: contact.id, userId, numberId: numberRecord?.id, workspaceId, status: 'OPEN' } });
                    } else {
                        await prisma.chat.update({ where: { id: chat.id }, data: { status: 'OPEN', updatedAt: new Date() } });
                    }

                    // Parse message body
                    let bodyText = '';
                    let buttonPayload: string | null = null;

                    if (type === 'text') {
                        bodyText = msgObj.text?.body || '';
                    } else if (type === 'interactive') {
                        const iType = msgObj.interactive?.type;
                        if (iType === 'button_reply') {
                            buttonPayload = msgObj.interactive.button_reply.id;
                            bodyText = `[Button] ${msgObj.interactive.button_reply.title}`;

                            // Find original outbound message to link button log
                            const origMsg = await prisma.message.findFirst({
                                where: { contactId: contact.id, direction: 'OUTBOUND' },
                                orderBy: { createdAt: 'desc' }
                            });
                            if (origMsg) {
                                await prisma.buttonLog.create({
                                    data: {
                                        messageId: origMsg.id,
                                        campaignId: origMsg.campaignId,
                                        contactId: contact.id,
                                        userId,
                                        payload: buttonPayload,
                                        buttonText: msgObj.interactive.button_reply.title
                                    }
                                });
                            }
                        } else if (iType === 'list_reply') {
                            bodyText = `[List] ${msgObj.interactive.list_reply.title}`;
                        }
                    } else {
                        bodyText = `[${type}]`;
                    }

                    // Save inbound message
                    await prisma.message.create({
                        data: {
                            metaMessageId,
                            body: bodyText,
                            direction: 'INBOUND',
                            status: 'DELIVERED',
                            contactId: contact.id,
                            chatId: chat.id,
                            numberId: numberRecord?.id,
                            userId,
                            reply: bodyText,
                            buttonPayload
                        }
                    });

                    // Trigger unified flow engine
                    const trigger = buttonPayload ? 'BUTTON' : 'INBOUND';
                    const flows = await prisma.flow.findMany({
                        where: {
                            isActive: true,
                            OR: [
                                { workspaceId: workspaceId || undefined },
                                { userId: userId || undefined }
                            ],
                            trigger: { in: [trigger, 'INBOUND'] }
                        }
                    });

                    for (const flow of flows) {
                        await executeFlow(flow, contact.id, userId, workspaceId, trigger, bodyText);
                    }
                }
            }
        }
    } catch (e) {
        console.error('[WEBHOOK ERROR]', e);
    }
});

// Meta verification
router.get('/whatsapp', (req: Request, res: Response) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

export default router;
