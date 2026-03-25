import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to get workspace safely
const getWorkspaceId = async (userId: string) => {
    const wu = await prisma.workspaceUser.findFirst({ 
        where: { userId },
        include: { workspace: true }
    });
    if (!wu || !wu.workspace) return null; // Prevent orphaned foreign keys
    return wu.workspaceId;
};

// POST /api/campaigns — create campaign + queue records
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = await getWorkspaceId(userId);
        const { name, numberId, templateId, audienceId, scheduledAt } = req.body;

        if (!name || !numberId || !templateId)
            return res.status(400).json({ error: 'name, numberId, templateId required' });

        // ── 🚨 SaaS SAFETY: Wallet Balance Check ──────────
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { wallet: true } });
        if (!user || user.wallet < 0) {
            return res.status(403).json({ 
                error: 'Insufficient Balance. Your wallet is empty. Please recharge to launch campaigns.',
                code: 'LOW_BALANCE'
            });
        }

        // Validate number belongs to user
        const number = await prisma.number.findFirst({ where: { id: numberId, userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });

        // Validate template — fallback to ID-only if userId not set (synced via workspace flow)
        let template = await prisma.template.findFirst({ where: { id: templateId, userId } });
        if (!template) {
            // Try finding by ID alone (template may have been synced without userId)
            template = await prisma.template.findFirst({ where: { id: templateId } });
            if (template) {
                // Auto-link this template to the current user
                await prisma.template.update({ where: { id: templateId }, data: { userId } });
            }
        }
        if (!template) return res.status(404).json({ error: 'Template not found. Please sync templates first.' });

        // Sanitize audienceId to prevent Prisma SQLite internal query crashes on malformed strings
        const safeAudienceId = (
            audienceId && 
            typeof audienceId === 'string' && 
            audienceId.trim() !== '' && 
            audienceId !== 'undefined' && 
            audienceId !== 'null' && 
            audienceId !== 'All My Contacts'
        ) ? audienceId : null;

        // Resolve contacts
        let contacts: { id: string }[];
        if (safeAudienceId) {
            try {
                const aud = await prisma.audience.findFirst({ 
                    where: { id: safeAudienceId, userId }, 
                    include: { contacts: { select: { id: true } } } 
                });
                contacts = aud?.contacts || [];
            } catch (err: any) {
                console.log("[CAMPAIGN DEBUG] Swallowing audience fetch error:", err.message);
                contacts = await prisma.contact.findMany({ where: { userId }, select: { id: true } });
            }
        } else {
            contacts = await prisma.contact.findMany({ where: { userId }, select: { id: true } });
        }

        if (contacts.length === 0)
            return res.status(400).json({ error: 'No contacts found for this campaign' });

        // Check daily limit
        if (number.sentToday + contacts.length > number.dailyLimit) {
            return res.status(429).json({ error: `Daily limit exceeded. Limit: ${number.dailyLimit}, Sent today: ${number.sentToday}` });
        }

        // Create campaign
        const payload = {
            userId, 
            workspaceId: workspaceId || null, 
            numberId: numberId || null, 
            templateId: templateId || null, 
            audienceId: safeAudienceId,
            name, status: scheduledAt ? 'SCHEDULED' : 'RUNNING',
            totalContacts: contacts.length,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        };

        let campaign: any;
        try {
            campaign = await prisma.campaign.create({
                data: payload
            });
        } catch (dbErr: any) {
            console.error("[CAMPAIGN DB ERROR]", dbErr.message);
            console.error("Payload was:", JSON.stringify(payload, null, 2));
            return res.status(500).json({ error: 'Database FK Error on Campaign. Payload: ' + JSON.stringify(payload) });
        }

        // Create queue records (one per contact)
        try {
            await prisma.queue.createMany({
                data: contacts.map(c => ({
                    userId,
                    campaignId: campaign.id,
                    contactId: c.id,
                    numberId,
                    templateId,
                    status: 'PENDING'
                }))
            });
        } catch (queueErr: any) {
            console.error("[QUEUE DB ERROR]", queueErr.message);
            return res.status(500).json({ error: 'Database FK Error on Queue' });
        }

        res.json({ success: true, campaign, queued: contacts.length });
    } catch (e) { next(e); }
});

// GET /api/campaigns
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const campaigns = await prisma.campaign.findMany({
            where: { userId },
            include: { number: { select: { phoneNumber: true } }, template: { select: { templateName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ campaigns });
    } catch (e) { next(e); }
});

// GET /api/campaigns/:id — single campaign with message stats
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const campaign = await prisma.campaign.findFirst({
            where: { id: req.params.id as string, userId },
            include: {
                number: { select: { phoneNumber: true, quality: true } },
                template: { select: { templateName: true, language: true } },
                _count: { select: { messages: true, queue: true } }
            }
        });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // Queue progress summary
        const queueStats = await prisma.queue.groupBy({
            by: ['status'],
            where: { campaignId: campaign.id },
            _count: true
        });

        // Detailed contact-level breakdown
        const messages = await prisma.message.findMany({
            where: { campaignId: campaign.id },
            include: {
                contact: { select: { id: true, name: true, phone: true } },
                clickLogs: { select: { id: true, url: true, clickedAt: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Replies to this campaign's contacts
        const contactIds = messages.map(m => m.contactId);
        const replies = await prisma.message.findMany({
            where: { direction: 'INBOUND', contactId: { in: contactIds }, campaignId: null },
            include: { contact: { select: { id: true, name: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const sent     = messages.filter(m => ['SENT','DELIVERED','READ'].includes(m.status));
        const delivered= messages.filter(m => ['DELIVERED','READ'].includes(m.status));
        const read     = messages.filter(m => m.status === 'READ');
        const failed   = messages.filter(m => m.status === 'FAILED');
        const clicked  = messages.filter(m => m.clickLogs.length > 0);

        res.json({ campaign, queueStats, breakdown: { sent, delivered, read, failed, clicked, replies } });
    } catch (e) { next(e); }
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        await prisma.campaign.updateMany({ where: { id: req.params.id as string, userId }, data: { status: 'PAUSED' } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

// POST /api/campaigns/:id/resume
router.post('/:id/resume', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        await prisma.campaign.updateMany({ where: { id: req.params.id as string, userId }, data: { status: 'RUNNING' } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
