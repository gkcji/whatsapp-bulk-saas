import { Router, Response, NextFunction } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { decrypt } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// Middleware to load workspace tools safely isolating users to their own keys
const requireWorkspaceKeys = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const wu = await prisma.workspaceUser.findFirst({ where: { userId: req.user!.id }});
        if (!wu) return res.status(403).json({ error: 'No workspace linked.' });
        
        const numberId = req.body.numberId || req.query.numberId;
        let numberFilter: any = { workspaceId: wu.workspaceId };
        if (numberId) numberFilter.id = numberId;

        const number = await prisma.number.findFirst({ where: numberFilter });
        if (!number || !number.accessToken) {
             return res.status(400).json({ error: 'No Meta Number natively configured for this workspace or number_id.' });
        }
        
        const rawToken = decrypt(number.accessToken);
        if (!rawToken) return res.status(500).json({ error: 'Decryption payload failure.' });

        (req as any).meta = { 
           workspaceId: wu.workspaceId,
           numberId: number.id, 
           wabaId: number.wabaId, 
           phoneId: number.phoneId, 
           token: rawToken 
        };
        next();
    } catch(e) { next(e); }
};

router.post('/test', requireAuth, requireWorkspaceKeys, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { phoneId, token } = (req as any).meta;
        const testPhone = req.body.phone;

        const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            to: testPhone,
            type: "text",
            text: { body: "🔔 *SendWA Test Alert*\n\nYour API connection is 100% active and working!" }
        };

        const response = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
        res.json({ success: true, metaResponse: response.data });
    } catch(e: any) {
        res.status(400).json({ success: false, error: e.response?.data?.error?.message || 'Connection failed' });
    }
});

router.post('/message', requireAuth, requireWorkspaceKeys, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workspaceId, phoneId, token } = (req as any).meta;
        const { to, message } = req.body;

        const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
        const payload = { messaging_product: "whatsapp", to, type: "text", text: { body: message } };
        
        const response = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
        res.json({ success: true, messageId: response.data?.messages?.[0]?.id });
    } catch(e: any) { next(e); }
});

router.get('/templates/sync', requireAuth, requireWorkspaceKeys, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workspaceId, wabaId, token } = (req as any).meta;
        
        const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?limit=100`;
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        
        const templates = response.data.data;
        let syncedCount = 0;

        for (const t of templates) {
            await prisma.template.upsert({
               where: { id: t.id },
               update: { templateName: t.name, status: t.status, components: JSON.stringify(t.components) },
               create: { id: t.id, templateName: t.name, language: t.language, category: t.category, components: JSON.stringify(t.components), status: t.status, workspaceId }
            });
            syncedCount++;
        }

        res.json({ success: true, syncedCount, templates });
    } catch(e: any) { next(e); }
});

router.post('/templates', requireAuth, requireWorkspaceKeys, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workspaceId, wabaId, token } = (req as any).meta;
        const { name, category, language, header, body, footer, buttons } = req.body;
        
        const components: any[] = [];
        
        if (header) components.push({ type: "HEADER", format: "TEXT", text: header });
        if (body) components.push({ type: "BODY", text: body });
        if (footer) components.push({ type: "FOOTER", text: footer });
        
        if (buttons && buttons.length > 0) {
            components.push({ type: "BUTTONS", buttons: buttons.map((b: any) => {
                if (b.type === "URL") return { type: "URL", text: b.text, url: b.url };
                if (b.type === "QUICK_REPLY") return { type: "QUICK_REPLY", text: b.text };
                return null;
            }).filter(Boolean) });
        }

        const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates`;
        const payload = { name, category: category || "MARKETING", allow_category_change: true, language: language || "en_US", components };
        
        const response = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
        
        await prisma.template.create({
            data: { id: response.data.id, templateName: name, language: language || "en_US", category: category || "MARKETING", components: JSON.stringify(components), status: response.data.status || "PENDING", workspaceId }
        });

        res.json({ success: true, metaTemplate: response.data });
    } catch(e: any) { 
        res.status(400).json({ success: false, error: e.response?.data?.error?.error_user_msg || e.response?.data?.error?.message || 'Failed creating template' });
    }
});

router.delete('/templates/:name', requireAuth, requireWorkspaceKeys, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workspaceId, wabaId, token } = (req as any).meta;
        const name = req.params.name;
        
        const url = `https://graph.facebook.com/v19.0/${wabaId}/message_templates?name=${name}`;
        await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
        
        // @ts-ignore
        await prisma.template.deleteMany({ where: { name: name as string, workspaceId } as any });
        
        res.json({ success: true, deleted: name });
    } catch(e: any) { next(e); }
});

router.get('/templates', requireAuth, async (req: AuthRequest, res, next: NextFunction) => {
    try {
        const workspaceId = (req.user as any).workspaceId || 'undefined';
        const status = req.query.status as string;

        const filter: any = { workspaceId };
        // @ts-ignore
        if (status && status !== 'ALL') filter.status = status;

        const templates = await prisma.template.findMany({
            // @ts-ignore
            where: filter as any,
            orderBy: { id: 'desc' }
        });
        res.json({ success: true, templates });
    } catch(e) { next(e); }
});

export default router;
