import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

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
            
            // Fetch contacts for the campaign and push INTO THE QUEUE TABLE
            const contacts = await prisma.contact.findMany({ where: { userId: camp.userId }});
            
            if (contacts.length > 0) {
              await prisma.queue.createMany({
                data: contacts.map((c: any) => ({
                  userId: camp.userId,
                  campaignId: camp.id,
                  contactId: c.id,
                  numberId: camp.numberId,
                  templateId: camp.templateId,
                  status: 'PENDING'
                }))
              });
            }
        }

        // 2. FOLLOWUP JOBS:
        const pendingJobs = await prisma.systemJob.findMany({
            where: {
                status: 'SCHEDULED',
                createdAt: { lte: now }
            }
        });

        for (const job of pendingJobs) {
            console.log(`[SCHEDULER] Executing Background Job: ${job.type}`);
            await prisma.systemJob.update({ where: { id: job.id }, data: { status: 'PROCESSING' } });
            // Followup logic would go here
            await prisma.systemJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
        }
        
    } catch (e) {
        console.error('[SCHEDULER ERROR]', e);
    }
});

console.log('✅ Global Cron Scheduler Online. Checking every minute.');
