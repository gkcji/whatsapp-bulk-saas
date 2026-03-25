import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { decrypt } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/inbox — Contact list with unread count ──
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const search = String(req.query.search || '');

        const contacts = await prisma.contact.findMany({
            where: {
                userId,
                ...(search ? {
                    OR: [
                        { name: { contains: search } },
                        { phone: { contains: search } },
                    ]
                } : {})
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                tags: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Attach unread count
        const withUnread = await Promise.all(contacts.map(async (c) => {
            const unread = await prisma.message.count({
                where: { contactId: c.id, userId, direction: 'INBOUND' }
            });
            return { ...c, unreadCount: unread };
        }));

        res.json({ contacts: withUnread });
    } catch (e) { next(e); }
});

// ── GET /api/inbox/:contactId/messages — Full message thread ──
router.get('/:contactId/messages', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const contactId = String(req.params.contactId);

        const contact = await prisma.contact.findFirst({ where: { id: contactId, userId } });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const messages = await prisma.message.findMany({
            where: { contactId, userId },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });

        res.json({ messages, contact });
    } catch (e) { next(e); }
});

// ── POST /api/inbox/:contactId/send — Send a manual reply ──
router.post('/:contactId/send', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const contactId = String(req.params.contactId);
        const { body, numberId, templateId, templateName, language } = req.body;

        const contact = await prisma.contact.findFirst({ where: { id: contactId, userId } });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const number = numberId
            ? await prisma.number.findFirst({ where: { id: String(numberId), userId } })
            : await prisma.number.findFirst({ where: { userId, status: 'ACTIVE' } }) || await prisma.number.findFirst({ where: { userId } });

        if (!number) return res.status(400).json({ error: 'No WhatsApp number found. Add one in API Config.' });

        const token = decrypt(number.accessToken);
        let metaMsgId = `manual_${Date.now()}`;
        let success = false;

        const payload: any = templateId
            ? {
                messaging_product: 'whatsapp', to: contact.phone, type: 'template',
                template: { name: templateName, language: { code: language || 'en' } }
            }
            : { messaging_product: 'whatsapp', to: contact.phone, type: 'text', text: { body } };

        try {
            const resp = await axios.post(
                `https://graph.facebook.com/v18.0/${number.phoneId}/messages`,
                payload,
                { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
            );
            metaMsgId = resp.data?.messages?.[0]?.id || metaMsgId;
            success = true;
        } catch (apiErr: any) {
            console.warn('[INBOX SEND]', apiErr?.response?.data?.error?.message || apiErr.message);
        }

        const msg = await prisma.message.create({
            data: {
                userId,
                contactId,
                numberId: number.id,
                templateId: templateId ? String(templateId) : null,
                metaMessageId: metaMsgId,
                body: body || `Template: ${templateName}`,
                direction: 'OUTBOUND',
                status: success ? 'SENT' : 'FAILED',
                cost: 0.14,
            }
        });

        res.json({ success, message: msg });
    } catch (e) { next(e); }
});

// ── POST /api/inbox/:contactId/note — Add internal note ──
router.post('/:contactId/note', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { body } = req.body;
        const contact = await prisma.contact.findFirst({ where: { id: req.params.contactId as string, userId } });
        if (!contact) return res.status(404).json({ error: 'Not found' });
        const msg = await prisma.message.create({
            data: { userId, contactId: req.params.contactId as string, body, direction: 'NOTE', status: 'SENT' }
        });
        res.json({ message: msg });
    } catch (e) { next(e); }
});

export default router;
