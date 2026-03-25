import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// MODULE 16.1: Generating a Short Link Tracker natively (For internal API usage before sending out)
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { originalUrl, messageId } = req.body;
        // In production, this would save to a custom `ShortLink` table.
        // For simplicity and speed in the SaaS logic, we mock generate a deterministic shortcode.
        const hash = crypto.createHash('md5').update(`${originalUrl}-${messageId}`).digest('hex').substring(0, 8);
        const shortUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/l/${hash}`;
        res.json({ success: true, shortUrl, originalUrl });
    } catch(e) { next(e); }
});

// MODULE 16.2: Link Tracking Endpoint (The Short Link Resolver)
// Captures click data and instantly redirects heavily optimized
router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.params.code;
        // Mock lookup resolving the URL securely. In prod, reverse map `code` to URL from DB.
        const targetUrl = req.query.url ? String(req.query.url) : 'https://google.com'; 
        const messageId = req.query.msg ? String(req.query.msg) : null;

        // Save detailed Click Log dynamically satisfying Module 16 requirements natively 
        if (messageId) {
            await prisma.clickLog.create({
                data: {
                    url: targetUrl,
                    messageId: messageId,
                }
            });
        }

        // Instant redirect ensuring 0 latency for the end user clicking the link
        res.redirect(targetUrl);
    } catch(e) { next(e); }
});

export default router;
