import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import numberRoutes from './routes/numbers';
import templateRoutes from './routes/templates';
import campaignRoutes from './routes/campaigns';
import webhookRoutes from './routes/webhooks';
import inboxRoutes from './routes/inbox';
import trackingRoutes from './routes/tracking';
import audienceRoutes from './routes/audience';
import analyticsRoutes from './routes/analytics';
import billingRoutes from './routes/billing';
import flowRoutes from './routes/flows';
import dashboardRoutes from './routes/dashboard';
import linkRoutes from './routes/links';
import contactRoutes from './routes/contacts';
import adminRoutes from './routes/admin';

import { requireAuth, AuthRequest } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { startWorker } from './workers/campaignWorker';
import './workers/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 }));

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/numbers',   numberRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/webhooks',  webhookRoutes);
app.use('/api/inbox',     inboxRoutes);
app.use('/api/tracking',  trackingRoutes);
app.use('/api/audience',  audienceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing',   billingRoutes);
app.use('/api/flows',     flowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/l',         linkRoutes);
app.use('/api/contacts',  contactRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`\n🚀 Backend running on port ${PORT}`);
    console.log(`📦 DB: SQLite local (schema v3 — all tables with userId)`);
    startWorker();
});
