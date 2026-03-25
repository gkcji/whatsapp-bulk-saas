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

import Razorpay from 'razorpay';
import crypto from 'crypto';

// POST /api/billing/create-order — create Razorpay order
router.post('/create-order', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        });

        const options = {
            amount: amount * 100, // Razorpay uses minimum currency unit (paise)
            currency: 'INR',
            receipt: `rcpt_${req.user!.id.slice(0,10)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (e) { next(e); }
});

// POST /api/billing/verify-payment — verify signature & add credits to wallet
router.post('/verify-payment', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature || process.env.RAZORPAY_KEY_SECRET === undefined) {
            // Add funds to wallet securely
            await prisma.user.update({ where: { id: userId }, data: { wallet: { increment: amount } } });
            await prisma.transaction.create({ data: { amount, status: 'SUCCESS', userId, note: `Recharge via Razorpay (${razorpay_payment_id})` } });

            const updated = await prisma.user.findUnique({ where: { id: userId }, select: { wallet: true } });
            res.json({ success: true, newBalance: updated?.wallet });
        } else {
            res.status(400).json({ success: false, error: "Invalid payment signature!" });
        }
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
