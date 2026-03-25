import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const getWorkspaceId = async (userId: string) => {
    const wu = await prisma.workspaceUser.findFirst({ where: { userId } });
    return wu?.workspaceId || null;
};

// POST /api/audience/build — build audience from filters
router.post('/build', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = await getWorkspaceId(userId);
        
        const { name, filters } = req.body;

        // Start with all contacts of the user
        let contactIds: string[] = (await prisma.contact.findMany({
            where: { userId },
            select: { id: true }
        })).map(c => c.id);

        if (filters?.noReply) {
            const replied = await prisma.message.findMany({
                where: { direction: 'INBOUND', userId },
                select: { contactId: true },
                distinct: ['contactId']
            });
            const repliedIds = new Set(replied.map(m => m.contactId));
            contactIds = contactIds.filter(id => !repliedIds.has(id));
        }

        if (filters?.hasReplied) {
            const replied = await prisma.message.findMany({
                where: { direction: 'INBOUND', contactId: { in: contactIds }, userId },
                select: { contactId: true },
                distinct: ['contactId']
            });
            contactIds = replied.map(m => m.contactId);
        }

        if (filters?.clickedLink) {
            const clickers = await prisma.clickLog.findMany({
                where: { contactId: { in: contactIds }, userId },
                select: { contactId: true },
                distinct: ['contactId']
            });
            contactIds = clickers.map(c => c.contactId).filter(Boolean) as string[];
        }

        if (filters?.pressedButton) {
            const pressers = await prisma.buttonLog.findMany({
                where: { contactId: { in: contactIds }, userId },
                select: { contactId: true },
                distinct: ['contactId']
            });
            contactIds = pressers.map(c => c.contactId).filter(Boolean) as string[];
        }

        if (filters?.tagId) {
            const tagged = await prisma.contact.findMany({
                where: { id: { in: contactIds }, tags: { some: { id: filters.tagId } }, userId },
                select: { id: true }
            });
            contactIds = tagged.map(c => c.id);
        }

        contactIds = [...new Set(contactIds)];

        if (name) {
            const audience = await prisma.audience.create({
                data: {
                    name,
                    workspaceId: workspaceId || null,
                    userId,
                    contacts: { connect: contactIds.map(id => ({ id })) }
                }
            });
            return res.json({ success: true, audience, count: contactIds.length, contactIds });
        }

        res.json({ success: true, count: contactIds.length, contactIds });
    } catch (e) { next(e); }
});

// GET /api/audience — list audiences
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const audiences = await prisma.audience.findMany({
            where: { userId },
            include: { _count: { select: { contacts: true } } }
        });
        res.json({ audiences });
    } catch (e) { next(e); }
});

export default router;
