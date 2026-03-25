import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', requireAuth, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;

        const [totalContacts, totalCampaigns, totalNumbers, totalTemplates,
               messagesSent, messagesDelivered, messagesRead, messagesFailed, messagesReplied,
               walletBalance, pendingQueue, recentCampaigns, numbers] = await Promise.all([
            prisma.contact.count({ where: { userId } }),
            prisma.campaign.count({ where: { userId } }),
            prisma.number.count({ where: { userId } }),
            prisma.template.count({ where: { userId } }),
            prisma.message.count({ where: { userId, direction: 'OUTBOUND', status: { in: ['SENT','DELIVERED','READ'] } } }),
            prisma.message.count({ where: { userId, status: 'DELIVERED' } }),
            prisma.message.count({ where: { userId, status: 'READ' } }),
            prisma.message.count({ where: { userId, status: 'FAILED' } }),
            prisma.message.count({ where: { userId, direction: 'INBOUND' } }),
            prisma.user.findUnique({ where: { id: userId }, select: { wallet: true } }),
            prisma.queue.count({ where: { userId, status: 'PENDING' } }),
            prisma.campaign.findMany({
                where: { userId },
                include: { number: { select: { phoneNumber: true } }, template: { select: { templateName: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.number.findMany({
                where: { userId },
                include: { health: true },
                select: { id: true, phoneNumber: true, quality: true, tier: true, sentToday: true, dailyLimit: true, status: true, health: true }
            })
        ]);

        const totalSpend = await prisma.message.aggregate({ where: { userId, direction: 'OUTBOUND' }, _sum: { cost: true } });

        res.json({
            success: true,
            stats: {
                totalContacts, totalCampaigns, totalNumbers, totalTemplates,
                messagesSent, messagesDelivered, messagesRead, messagesFailed, messagesReplied,
                pendingQueue,
                walletBalance: walletBalance?.wallet || 0,
                totalSpend: totalSpend._sum.cost || 0,
            },
            recentCampaigns,
            numbers
        });
    } catch (e) { next(e); }
});

export default router;
