/**
 * Browser-Safe Cron Scheduler Service
 * 
 * Handles client-side job scheduling with server-side rendering compatibility.
 * Only runs in browser environment to avoid SSR/SSG errors.
 */

interface CronJob {
  id: string;
  schedule: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  timeoutId?: number;
}

interface CronJobStatus {
  id: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  schedule: string;
}

class CronScheduler {
  private jobs: Map<string, CronJob> = new Map();
  private isClient: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Detect if we're in browser environment
    this.isClient = typeof window !== 'undefined';
    
    if (this.isClient) {
      console.log('⏰ CronScheduler - Initializing cron scheduler (client-side)...');
      this.initializeJobs();
    } else {
      console.log('⏰ CronScheduler - Server-side detected, scheduler disabled');
    }
  }

  /**
   * Check if we can safely run browser-specific code
   */
  private canExecute(): boolean {
    return this.isClient && typeof window !== 'undefined';
  }

  /**
   * Initialize predefined jobs (only on client)
   */
  private initializeJobs(): void {
    if (!this.canExecute()) {
      console.log('⏰ CronScheduler - Skipping job initialization (server-side)');
      return;
    }

    console.log('⏰ CronScheduler - Setting up daily test assignment job...');
    
    // Register the daily test assignment job
    this.registerJob(
      'daily-test-assignment',
      '0 0 * * *', // Daily at midnight
      async () => {
        try {
          // Only import and run if we're in client environment
          if (this.canExecute()) {
            // Call the API endpoint for daily assignment
            const response = await fetch('/api/tests/assign-daily', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
            });
            
            if (!response.ok) {
              throw new Error(`Daily assignment failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Daily test assignment completed:', result);
          }
        } catch (error) {
          console.error('❌ Daily test assignment failed:', error);
        }
      }
    );

    this.initialized = true;
    console.log('⏰ CronScheduler - Initialization complete');
  }

  /**
   * Register a new cron job
   */
  registerJob(id: string, schedule: string, handler: () => Promise<void>): void {
    if (!this.canExecute()) {
      console.log(`⏰ CronScheduler - Job registration skipped (server-side): ${id}`);
      return;
    }

    console.log(`⏰ CronScheduler - 📝 Registering job: ${id} with schedule: ${schedule}`);

    const job: CronJob = {
      id,
      schedule,
      handler,
      enabled: true
    };

    this.jobs.set(id, job);
    this.scheduleJob(job);
  }

  /**
   * Schedule a job using browser setTimeout (client-side only)
   */
  private scheduleJob(job: CronJob): void {
    if (!this.canExecute()) {
      console.log(`⏰ CronScheduler - Job scheduling skipped (server-side): ${job.id}`);
      return;
    }

    if (!job.enabled) {
      return;
    }

    // Clear existing timeout if any
    if (job.timeoutId) {
      window.clearTimeout(job.timeoutId);
    }

    const nextRun = this.getNextRunTime(job.schedule);
    job.nextRun = nextRun;

    const delay = nextRun.getTime() - Date.now();
    const delayMinutes = Math.round(delay / (1000 * 60));

    console.log(`⏰ CronScheduler - ⏲️ Scheduling ${job.id} to run in ${delayMinutes} minutes`);

    job.timeoutId = window.setTimeout(async () => {
      if (job.enabled && this.canExecute()) {
        console.log(`⏰ CronScheduler - 🚀 Executing job: ${job.id}`);
        job.lastRun = new Date();
        
        try {
          await job.handler();
          console.log(`⏰ CronScheduler - ✅ Job completed successfully: ${job.id}`);
        } catch (error) {
          console.error(`⏰ CronScheduler - ❌ Job failed: ${job.id}`, error);
        }

        // Schedule next run
        this.scheduleJob(job);
      }
    }, delay);
  }

  /**
   * Parse cron schedule and calculate next run time
   * Simplified parser for basic schedules like "0 0 * * *"
   */
  private getNextRunTime(schedule: string): Date {
    const now = new Date();
    const [minute, hour] = schedule.split(' ').map(Number);
    
    const nextRun = new Date(now);
    nextRun.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Manually trigger a job execution
   */
  async runJobNow(jobId: string): Promise<void> {
    if (!this.canExecute()) {
      throw new Error('Cannot execute jobs on server-side');
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    console.log(`⏰ CronScheduler - 🚀 Manual execution: ${jobId}`);
    job.lastRun = new Date();
    
    try {
      await job.handler();
      console.log(`⏰ CronScheduler - ✅ Manual execution completed: ${jobId}`);
    } catch (error) {
      console.error(`⏰ CronScheduler - ❌ Manual execution failed: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Get job status information
   */
  getJobStatus(jobId: string): CronJobStatus | null {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      schedule: job.schedule
    };
  }

  /**
   * Enable or disable a job
   */
  toggleJob(jobId: string, enabled: boolean): void {
    if (!this.canExecute()) {
      console.log(`⏰ CronScheduler - Job toggle skipped (server-side): ${jobId}`);
      return;
    }

    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = enabled;
      if (enabled) {
        this.scheduleJob(job);
      } else if (job.timeoutId) {
        window.clearTimeout(job.timeoutId);
        job.timeoutId = undefined;
      }
      console.log(`⏰ CronScheduler - Job ${jobId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get all registered jobs
   */
  getAllJobs(): CronJobStatus[] {
    return Array.from(this.jobs.values()).map(job => ({
      id: job.id,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      schedule: job.schedule
    }));
  }

  /**
   * Check if scheduler is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized && this.canExecute();
  }

  /**
   * Get environment info
   */
  getEnvironmentInfo() {
    return {
      isClient: this.isClient,
      isInitialized: this.initialized,
      canExecute: this.canExecute(),
      hasWindow: typeof window !== 'undefined',
      jobCount: this.jobs.size
    };
  }
}

// Create singleton instance with server-safe initialization
let cronSchedulerInstance: CronScheduler | null = null;

export const cronScheduler = new Proxy({} as CronScheduler, {
  get(target, prop) {
    // Lazy initialization - only create instance when first accessed
    if (!cronSchedulerInstance) {
      cronSchedulerInstance = new CronScheduler();
    }
    
    // Return the property from the actual instance
    const instance = cronSchedulerInstance;
    const value = instance[prop as keyof CronScheduler];
    
    // Bind methods to maintain context
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    
    return value;
  }
});

export default cronScheduler;