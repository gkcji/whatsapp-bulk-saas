import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/analytics/overview — reads from messages + campaigns by userId
router.get('/overview', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const [
            totalContacts,
            totalCampaigns,
            totalMessages,
            sentMessages,
            deliveredMessages,
            readMessages,
            failedMessages,
            repliedMessages,
            totalCost
        ] = await Promise.all([
            prisma.contact.count({ where: { userId } }),
            prisma.campaign.count({ where: { userId } }),
            prisma.message.count({ where: { userId } }),
            prisma.message.count({ where: { userId, status: 'SENT', direction: 'OUTBOUND' } }),
            prisma.message.count({ where: { userId, status: 'DELIVERED' } }),
            prisma.message.count({ where: { userId, status: 'READ' } }),
            prisma.message.count({ where: { userId, status: 'FAILED' } }),
            prisma.message.count({ where: { userId, direction: 'INBOUND' } }),
            prisma.message.aggregate({ where: { userId, direction: 'OUTBOUND' }, _sum: { cost: true } })
        ]);

        // Last 7 days daily breakdown
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const dailyStats = await Promise.all(days.map(async (day) => {
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            const [sent, replied] = await Promise.all([
                prisma.message.count({ where: { userId, direction: 'OUTBOUND', status: { not: 'PENDING' }, createdAt: { gte: day, lt: next } } }),
                prisma.message.count({ where: { userId, direction: 'INBOUND', createdAt: { gte: day, lt: next } } })
            ]);
            return { date: day.toISOString().split('T')[0], sent, replied };
        }));

        // Campaign stats (use userId)
        const campaigns = await prisma.campaign.findMany({
            where: { userId },
            include: {
                _count: { select: { messages: true } },
                template: { select: { templateName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const campaignStats = await Promise.all(campaigns.map(async (c) => {
            const [sent, delivered, read, failed, replied] = await Promise.all([
                prisma.message.count({ where: { campaignId: c.id, status: 'SENT' } }),
                prisma.message.count({ where: { campaignId: c.id, status: 'DELIVERED' } }),
                prisma.message.count({ where: { campaignId: c.id, status: 'READ' } }),
                prisma.message.count({ where: { campaignId: c.id, status: 'FAILED' } }),
                prisma.message.count({ where: { campaignId: c.id, direction: 'INBOUND' } })
            ]);
            return { ...c, sent, delivered, read, failed, replied };
        }));

        res.json({
            totalContacts,
            totalCampaigns,
            totalMessages,
            sentMessages,
            deliveredMessages,
            readMessages,
            failedMessages,
            repliedMessages,
            totalSpend: totalCost._sum.cost || 0,
            dailyStats,
            campaignStats
        });
    } catch (e) { next(e); }
});

export default router;
