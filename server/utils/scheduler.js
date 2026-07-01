import cron from 'node-cron';
import { processDueRecurring } from './recurring.js';

/**
 * Start background jobs. Currently: materialize due recurring expenses.
 * Runs every hour on the hour; also runs once at startup to catch up.
 */
export const startScheduler = () => {
  const run = async () => {
    try {
      const created = await processDueRecurring();
      if (created > 0) console.log(`⏱  Recurring job created ${created} expense(s)`);
    } catch (err) {
      console.error('Recurring job failed:', err.message);
    }
  };

  run(); // catch-up on boot
  cron.schedule('0 * * * *', run); // top of every hour
  console.log('✔ Scheduler started (recurring expenses)');
};
