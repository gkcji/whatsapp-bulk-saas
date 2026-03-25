import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const contacts = await prisma.contact.findMany({
            where: { userId },
            include: { tags: { select: { id: true, name: true } }, _count: { select: { messages: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ contacts });
    } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = (req.user as any).workspaceId;
        const { phone, name, attributes } = req.body;
        if (!phone) return res.status(400).json({ error: 'phone required' });
        const contact = await prisma.contact.upsert({
            where: { phone },
            update: { name, attributes },
            create: { phone, name, attributes, userId, workspaceId }
        });
        res.json({ success: true, contact });
    } catch (e) { next(e); }
});

router.post('/bulk', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = (req.user as any).workspaceId;
        const { contacts } = req.body; // [{phone, name}]
        if (!Array.isArray(contacts)) return res.status(400).json({ error: 'contacts array required' });

        let created = 0;
        for (const c of contacts) {
            if (!c.phone) continue;
            await prisma.contact.upsert({ where: { phone: c.phone }, update: { name: c.name }, create: { phone: c.phone, name: c.name, userId, workspaceId } });
            created++;
        }
        res.json({ success: true, created });
    } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        await prisma.contact.deleteMany({ where: { id: req.params.id as string, userId } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
