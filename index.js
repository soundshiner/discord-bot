// index.js (ESM)
import 'dotenv/config';
import './core/config.js'; // validation env etc
import { start } from './core/startup.js';
import { registerProcessHandlers } from './core/lifecycle.js';

(async () => {
  await start();
  registerProcessHandlers();
})();
