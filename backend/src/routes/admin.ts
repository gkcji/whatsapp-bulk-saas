import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware: Verify Admin
const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Super Admin access required' });
        }
        next();
    } catch (e) {
        next(e);
    }
};

router.use(requireAuth, requireSuperAdmin);

// -----------------------------
// USER MANAGEMENT
// -----------------------------
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });
        
        // Add basic stats per user securely
        const enhancedUsers = await Promise.all(users.map(async u => {
            const msgs = await prisma.message.count({ where: { userId: u.id } });
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                wallet: u.wallet,
                createdAt: u.createdAt,
                plan: u.plan?.name || 'Starter',
                totalMessagesSent: msgs
            };
        }));
        
        res.json({ users: enhancedUsers });
    } catch (e) { next(e); }
});

router.post('/users/:id/suspend', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.user.update({
            where: { id: String(req.params.id) },
            data: { role: 'SUSPENDED' }
        });
        res.json({ success: true, message: "User suspended successfully." });
    } catch (e) { next(e); }
});

// -----------------------------
// PACKAGE / PLAN CONTROL
// -----------------------------
router.get('/plans', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
        res.json({ plans });
    } catch (e) { next(e); }
});

router.post('/plans', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, price, msgLimit } = req.body;
        const plan = await prisma.plan.create({
            data: { name, price: parseFloat(price), msgLimit: parseInt(msgLimit, 10) }
        });
        res.json({ success: true, plan });
    } catch (e) { next(e); }
});

router.delete('/plans/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.plan.delete({ where: { id: String(req.params.id) } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
