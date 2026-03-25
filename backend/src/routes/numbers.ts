import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/crypto';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const pid = (p: string | string[]): string => Array.isArray(p) ? p[0] : p;

// POST /api/numbers — register a number (per user)
router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const workspaceId = (req.user as any).workspaceId;
        const { phoneNumber, phoneId, wabaId, accessToken, verifyToken } = req.body;

        if (!phoneNumber || !phoneId || !wabaId || !accessToken)
            return res.status(400).json({ error: 'phoneNumber, phoneId, wabaId, accessToken required' });

        const encToken = encrypt(accessToken);

        const number = await prisma.number.upsert({
            where: { phoneId },
            create: { userId, workspaceId, phoneNumber, phoneId, wabaId, accessToken: encToken, verifyToken },
            update: { phoneNumber, wabaId, accessToken: encToken, verifyToken }
        });

        // Init health record
        await prisma.numberHealth.upsert({
            where: { numberId: number.id },
            create: { numberId: number.id, quality: number.quality, tier: number.tier, dailyLimit: number.dailyLimit },
            update: {}
        });

        // Init api config
        await prisma.apiConfig.upsert({
            where: { numberId: number.id },
            create: { numberId: number.id, verifyToken },
            update: { verifyToken }
        });

        res.json({ success: true, number: { ...number, accessToken: '***' } });
    } catch (e) { next(e); }
});

// GET /api/numbers — list user's numbers
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const numbers = await prisma.number.findMany({
            where: { userId },
            include: { health: true, apiConfig: true },
            orderBy: { createdAt: 'desc' }
        });
        // Never expose raw token
        const safe = numbers.map(n => ({ ...n, accessToken: '***' }));
        res.json({ numbers: safe });
    } catch (e) { next(e); }
});

// GET /api/numbers/:id/health — number health
router.get('/:id/health', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const number = await prisma.number.findFirst({ where: { id: req.params.id as string, userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });
        res.json({ quality: number.quality, tier: number.tier, dailyLimit: number.dailyLimit, sentToday: number.sentToday });
    } catch (e) { next(e); }
});

// POST /api/numbers/:id/sync-health — pull quality from Meta API
router.post('/:id/sync-health', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const number = await prisma.number.findFirst({ where: { id: pid(req.params.id), userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });

        const token = decrypt(number.accessToken);
        let quality = 'HIGH', tier = 'TIER_1', dailyLimit = 250;

        try {
            const resp = await axios.get(
                `https://graph.facebook.com/v18.0/${number.phoneId}?fields=quality_rating,throughput`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            quality = resp.data.quality_rating || quality;
            const t = resp.data.throughput?.level;
            if (t === 'STANDARD') { tier = 'TIER_1'; dailyLimit = 250; }
            else if (t === 'HIGH') { tier = 'TIER_2'; dailyLimit = 1000; }
            else if (t === 'NOT_APPLICABLE') { tier = 'UNLIMITED'; dailyLimit = 100000; }
        } catch (err: any) {
            console.warn('[HEALTH SYNC] Meta API call failed:', err.message);
        }

        const [updatedNumber, updatedHealth] = await Promise.all([
            prisma.number.update({ where: { id: number.id }, data: { quality, tier, dailyLimit, lastSync: new Date() } }),
            prisma.numberHealth.update({ where: { numberId: number.id }, data: { quality, tier, dailyLimit, lastSync: new Date() } })
        ]);

        res.json({ success: true, quality, tier, dailyLimit });
    } catch (e) { next(e); }
});

// GET /api/numbers/:id/profile — fetch Meta Business Profile
router.get('/:id/profile', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const number = await prisma.number.findFirst({ where: { id: pid(req.params.id), userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });

        const token = decrypt(number.accessToken);
        const resp = await axios.get(
            `https://graph.facebook.com/v18.0/${number.phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        res.json({ profile: resp.data.data?.[0] || {} });
    } catch (e: any) {
        res.status(400).json({ error: e.response?.data?.error?.message || e.message });
    }
});

// POST /api/numbers/:id/profile — update Meta Business Profile
router.post('/:id/profile', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const number = await prisma.number.findFirst({ where: { id: pid(req.params.id), userId } });
        if (!number) return res.status(404).json({ error: 'Number not found' });

        const { about, address, description, email, vertical, websites, profile_picture_url } = req.body;
        const token = decrypt(number.accessToken);

        // Update Text Metadata
        const payload: any = { messaging_product: "whatsapp" };
        if (about) payload.about = about;
        if (address) payload.address = address;
        if (description) payload.description = description;
        if (email) payload.email = email;
        if (vertical) payload.vertical = vertical;
        if (websites) payload.websites = Array.isArray(websites) ? websites : [websites];

        await axios.post(
            `https://graph.facebook.com/v18.0/${number.phoneId}/whatsapp_business_profile`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Optional: Update Profile Picture (If handle is provided)
        if (profile_picture_url) {
            await axios.post(
                `https://graph.facebook.com/v18.0/${number.phoneId}/whatsapp_business_profile`,
                { messaging_product: "whatsapp", profile_picture_handle: profile_picture_url },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        }

        res.json({ success: true, message: "Profile updated on Meta servers." });
    } catch (e: any) {
        res.status(400).json({ error: e.response?.data?.error?.message || e.message });
    }
});

export default router;
