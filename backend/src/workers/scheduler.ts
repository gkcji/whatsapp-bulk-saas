import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { campaignQueue } from './campaignWorker';

const prisma = new PrismaClient();

// ==========================================
// MODULE 13: Global SaaS Cron Scheduler
// Runs every 1 minute to check for Scheduled Jobs
// ==========================================

cron.schedule('* * * * *', async () => {
    try {
        console.log(`[SCHEDULER] Checking for delayed jobs at ${new Date().toISOString()}`);

        const now = new Date();

        // 1. CAMPAIGN RUN / DELAY SEND: 
        // Find Campaigns scheduled in the past that haven't run yet
        const pendingCampaigns = await prisma.campaign.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: now }
            }
        });

        for (const camp of pendingCampaigns) {
            console.log(`[SCHEDULER] Deploying Scheduled Campaign: ${camp.name}`);
            
            // Mark as RUNNING immediately to prevent duplicate cron pickups
            await prisma.campaign.update({ where: { id: camp.id }, data: { status: 'RUNNING' }});
            
            const contacts = await prisma.contact.findMany({ where: { workspaceId: camp.workspaceId }});
            let jobsAdded = 0;
            const baseDelayMs = 2000;
            
            for (const contact of contacts) {
                await campaignQueue.add('send-message', {
                     contactId: contact.id,
                     phone: contact.phone,
                     templateName: camp.templateId, // assuming templateId stores name for simplicity
                     workspaceId: camp.workspaceId,
                     campaignId: camp.id,
                     delayMs: jobsAdded * baseDelayMs
                }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true });
                jobsAdded++;
            }
        }

        // 2. RETARGET RUN & FOLLOWUP:
        // Find SystemJobs of type 'FOLLOWUP' or 'RETARGET'
        const pendingJobs = await prisma.systemJob.findMany({
            where: {
                status: 'SCHEDULED',
                createdAt: { lte: now } // In a real app, this would use a 'runAt' column
            }
        });

        for (const job of pendingJobs) {
            console.log(`[SCHEDULER] Executing Background Job: ${job.type}`);
            await prisma.systemJob.update({ where: { id: job.id }, data: { status: 'PROCESSING' } });
            
            // ... Execute Followup/Retarget logic pushing to bullmq ...
            
            await prisma.systemJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
        }
        
    } catch (e) {
        console.error('[SCHEDULER ERROR]', e);
    }
});

console.log('✅ Global Cron Scheduler Online. Checking every minute.');
