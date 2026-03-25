import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const getWorkspaceId = async (userId: string) => {
    const wu = await prisma.workspaceUser.findFirst({ where: { userId } });
    return wu?.workspaceId || null;
};

// GET /api/flows — list flows
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const workspaceId = await getWorkspaceId(req.user!.id);
        if (!workspaceId) return res.status(403).json({ error: 'No workspace' });
        const flows = await prisma.flow.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
        res.json({ flows });
    } catch (e) { next(e); }
});

// POST /api/flows — create/save flow
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = await getWorkspaceId(userId);
        if (!workspaceId) return res.status(403).json({ error: 'No workspace' });
        const { name, nodes, edges } = req.body;
        const flow = await prisma.flow.create({
            data: { name, nodes: JSON.stringify(nodes || []), edges: JSON.stringify(edges || []), workspaceId, userId }
        });
        res.json({ success: true, flow });
    } catch (e) { next(e); }
});

// PUT /api/flows/:id — update flow
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, nodes, edges, isActive } = req.body;
        const flow = await prisma.flow.update({
            where: { id: req.params.id as string },
            data: { name, nodes: JSON.stringify(nodes || []), edges: JSON.stringify(edges || []), isActive }
        });
        res.json({ success: true, flow });
    } catch (e) { next(e); }
});

// DELETE /api/flows/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await prisma.flow.delete({ where: { id: req.params.id as string } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
