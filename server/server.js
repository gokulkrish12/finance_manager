import 'dotenv/config';
import connectDB from './config/db.js';
import { createApp } from './app.js';
import { startScheduler } from './utils/scheduler.js';

await connectDB();

const app = createApp();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✔ Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  startScheduler();
});
