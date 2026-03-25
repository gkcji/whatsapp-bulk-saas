import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { decrypt } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/templates/refresh/:id — Refresh a single template status from Meta
router.get('/refresh/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const tmplId = String(req.params.id);

        const tmpl = await prisma.template.findFirst({
            where: { id: tmplId, userId }
        });

        if (!tmpl || !tmpl.numberId) {
            return res.status(404).json({ error: 'Template or Number connection not found' });
        }

        const number = await prisma.number.findUnique({ where: { id: tmpl.numberId } });
        if (!number) return res.status(404).json({ error: 'Linked WhatsApp account not found' });

        const token = decrypt(number.accessToken);
        const resp = await axios.get(
            `https://graph.facebook.com/v18.0/${number.wabaId}/message_templates?name=${tmpl.templateName}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const meta = resp.data.data?.[0];
        if (meta) {
            const updated = await prisma.template.update({
                where: { id: tmpl.id },
                data: { status: meta.status }
            });
            return res.json({ success: true, status: updated.status });
        }
        res.json({ success: false, error: 'Template not found on Meta servers' });
    } catch (e: any) {
        res.status(400).json({ error: e.response?.data?.error?.message || e.message });
    }
});

// ── POST /api/templates/sync — pull from Meta WABA
router.post('/sync', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { numberId } = req.body;
        if (!numberId) return res.status(400).json({ error: 'numberId required' });

        const number = await prisma.number.findFirst({ where: { id: numberId, userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });

        const token = decrypt(number.accessToken);
        const resp = await axios.get(
            `https://graph.facebook.com/v18.0/${number.wabaId}/message_templates?limit=200`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const metas: any[] = resp.data.data || [];
        let synced = 0;

        for (const t of metas) {
            await prisma.template.upsert({
                where: { id: t.id },
                create: {
                    id: t.id,
                    userId,
                    numberId,
                    templateName: t.name,
                    language: t.language,
                    category: t.category,
                    status: t.status,
                    metaTemplateId: t.id,
                    components: JSON.stringify(t.components || [])
                },
                update: {
                    status: t.status,
                    components: JSON.stringify(t.components || [])
                }
            });
            synced++;
        }

        res.json({ success: true, synced });
    } catch (e: any) {
        res.status(400).json({ error: e.response?.data?.error?.message || e.message });
    }
});

// ── GET /api/templates
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { numberId, status } = req.query;
        const where: any = { userId };
        if (numberId) where.numberId = String(numberId);
        if (status && status !== 'ALL') where.status = String(status);
        const templates = await prisma.template.findMany({ where, orderBy: { templateName: 'asc' } });
        res.json({ templates });
    } catch (e) { next(e); }
});

// ── POST /api/templates — create on Meta + save locally
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { numberId, templateName, language, category, header, body, footer, buttons } = req.body;

        if (!numberId || !templateName || !body)
            return res.status(400).json({ error: 'numberId, templateName, body are required' });

        const number = await prisma.number.findFirst({ where: { id: numberId, userId } });
        if (!number) return res.status(404).json({ error: 'Number not found or unauthorized' });

        const token = decrypt(number.accessToken);

        // ── BUILD COMPONENTS ──────────────────────────────
        const components: any[] = [];

        // Header
        if (header && header.type !== 'NONE') {
            const hComp: any = { type: 'HEADER' };
            if (header.type === 'TEXT') {
                hComp.format = 'TEXT';
                hComp.text = header.text || '';
            } else {
                hComp.format = header.type;
                hComp.example = { header_handle: ['https://example.com/sample.jpg'] };
            }
            components.push(hComp);
        }

        // Body
        const bodyComp: any = { type: 'BODY', text: body };
        const vars = body.match(/\{\{(\d+)\}\}/g);
        if (vars && vars.length > 0) {
            bodyComp.example = { body_text: [vars.map(() => 'example_value')] };
        }
        components.push(bodyComp);

        // Footer
        if (footer) components.push({ type: 'FOOTER', text: footer });

        // Buttons
        if (buttons && buttons.length > 0) {
            const builtBtns: any[] = buttons.map((b: any) => {
                if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text };
                if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url };
                if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone_number || b.phone };
                if (b.type === 'COPY_CODE') return { type: 'COPY_CODE', example: b.example || b.code || '123456' };
                return b;
            });
            components.push({ type: 'BUTTONS', buttons: builtBtns });
        }

        // ── SUBMIT TO META ──────────────────────────────
        const payload = {
            name: templateName,
            category: category || 'MARKETING',
            language: language || 'en_US',
            components,
            allow_category_change: true
        };

        let metaId = '';
        let metaStatus = 'PENDING';

        try {
            const resp = await axios.post(
                `https://graph.facebook.com/v18.0/${number.wabaId}/message_templates`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            metaId = resp.data.id || '';
            metaStatus = resp.data.status || 'PENDING';
        } catch (apiErr: any) {
            const errMsg = apiErr.response?.data?.error?.message || apiErr.message;
            return res.status(400).json({ error: `Meta API Error: ${errMsg}` });
        }

        // ── SAVE TO DB ──────────────────────────────
        const saved = await prisma.template.upsert({
            where: { id: metaId || `local_${Date.now()}` },
            create: {
                ...(metaId ? { id: metaId } : {}),
                userId,
                numberId,
                templateName,
                language: language || 'en_US',
                category: category || 'MARKETING',
                status: metaStatus,
                metaTemplateId: metaId,
                components: JSON.stringify(components)
            },
            update: { status: metaStatus }
        });

        res.json({ success: true, template: saved });
    } catch (e) { next(e); }
});

// ── DELETE /api/templates/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const tmplId = String(req.params.id);
        const tmpl = await prisma.template.findFirst({
            where: { id: tmplId, userId }
        });
        if (!tmpl) return res.status(404).json({ error: 'Template not found' });

        if (tmpl.numberId) {
            const number = await prisma.number.findUnique({ where: { id: tmpl.numberId } });
            if (number) {
              const token = decrypt(number.accessToken);
              try {
                  await axios.delete(
                      `https://graph.facebook.com/v18.0/${number.wabaId}/message_templates?name=${tmpl.templateName}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                  );
              } catch { /* ignore Meta error */ }
            }
        }

        await prisma.template.delete({ where: { id: tmplId } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export default router;
