import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const getWorkspaceId = async (userId: string) => {
    const wu = await prisma.workspaceUser.findFirst({ where: { userId } });
    return wu?.workspaceId || null;
};

// GET /api/billing/summary — wallet + transaction + campaign cost
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { wallet: true, plan: true }
        });

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const workspaceId = await getWorkspaceId(userId);
        const campaignCosts = workspaceId
            ? await prisma.campaign.findMany({
                where: { workspaceId },
                select: { id: true, name: true, totalCost: true, createdAt: true, status: true }
            })
            : [];

        const totalSpend = campaignCosts.reduce((s, c) => s + (c.totalCost || 0), 0);

        res.json({ wallet: user?.wallet || 0, plan: user?.plan, transactions, campaignCosts, totalSpend });
    } catch (e) { next(e); }
});

// POST /api/billing/recharge — add credits to wallet
router.post('/recharge', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        await prisma.user.update({ where: { id: userId }, data: { wallet: { increment: amount } } });
        await prisma.transaction.create({ data: { amount, status: 'SUCCESS', userId } });

        const updated = await prisma.user.findUnique({ where: { id: userId }, select: { wallet: true } });
        res.json({ success: true, newBalance: updated?.wallet });
    } catch (e) { next(e); }
});

// POST /api/billing/admin/adjust — admin deduct/credit (requires ADMIN role)
router.post('/admin/adjust', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if ((req.user as any)?.role !== 'ADMIN') return res.status(403).json({ error: 'Admins only' });
        const { targetUserId, amount } = req.body;

        await prisma.user.update({ where: { id: targetUserId }, data: { wallet: { increment: amount } } });
        await prisma.transaction.create({ data: { amount, status: 'SUCCESS', userId: targetUserId } });

        res.json({ success: true, adjusted: amount });
    } catch (e) { next(e); }
});

export default router;
