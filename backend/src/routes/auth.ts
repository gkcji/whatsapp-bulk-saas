import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-fallback';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'name, email, password required' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { name, email, password: hashed } });

        // Auto-create workspace
        const workspace = await prisma.workspace.create({ data: { name: `${name}'s Workspace` } });
        await prisma.workspaceUser.create({ data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' } });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, workspaceId: workspace.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const wu = await prisma.workspaceUser.findFirst({ where: { userId: user.id } });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, workspaceId: wu?.workspaceId }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, wallet: user.wallet } });
    } catch (e) { next(e); }
});

// GET /api/auth/me
import { requireAuth, AuthRequest } from '../middleware/auth';
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { id: true, name: true, email: true, role: true, wallet: true, plan: true }
        });
        res.json({ user });
    } catch (e) { next(e); }
});

export default router;
