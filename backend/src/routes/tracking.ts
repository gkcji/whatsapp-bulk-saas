import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const getWorkspaceId = async (userId: string) => {
    const wu = await prisma.workspaceUser.findFirst({ where: { userId } });
    return wu?.workspaceId || null;
};

// POST /api/tracking/click — record a link click
router.post('/click', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { url, messageId, campaignId, contactId } = req.body;

        if (!url || !messageId) return res.status(400).json({ error: 'url and messageId required' });

        const log = await prisma.clickLog.create({
            data: { url, messageId, campaignId, contactId, userId }
        });

        res.json({ success: true, log });
    } catch (e) { next(e); }
});

// GET /api/tracking/clicks — get all click logs for workspace
router.get('/clicks', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(403).json({ error: 'No workspace' });

        const logs = await prisma.clickLog.findMany({
            where: { userId },
            orderBy: { clickedAt: 'desc' },
            include: { message: { select: { campaignId: true, contactId: true } } }
        });
        res.json({ logs });
    } catch (e) { next(e); }
});

// POST /api/tracking/button — record a button click
router.post('/button', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { payload, buttonText, messageId, campaignId, contactId } = req.body;

        if (!payload || !messageId) return res.status(400).json({ error: 'payload and messageId required' });

        const log = await prisma.buttonLog.create({
            data: { payload, buttonText, messageId, campaignId, contactId, userId }
        });

        res.json({ success: true, log });
    } catch (e) { next(e); }
});

// GET /api/tracking/buttons — get all button logs
router.get('/buttons', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const logs = await prisma.buttonLog.findMany({
            where: { userId },
            orderBy: { clickedAt: 'desc' },
            include: { message: { select: { campaignId: true, contactId: true } } }
        });
        res.json({ logs });
    } catch (e) { next(e); }
});

// GET /api/tracking/stats — campaign click/button stats
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const campaignId = req.query.campaignId as string;

        const clickWhere: any = { userId };
        const buttonWhere: any = { userId };
        if (campaignId) { clickWhere.campaignId = campaignId; buttonWhere.campaignId = campaignId; }

        const [totalClicks, uniqueClickers, totalButtons] = await Promise.all([
            prisma.clickLog.count({ where: clickWhere }),
            prisma.clickLog.groupBy({ by: ['contactId'], where: clickWhere }),
            prisma.buttonLog.count({ where: buttonWhere })
        ]);

        res.json({ totalClicks, uniqueClickers: uniqueClickers.length, totalButtons });
    } catch (e) { next(e); }
});

export default router;
