// ========================================
// index.js (ESM)
// ========================================

import 'dotenv/config';
import './core/config.js';
import { start } from './core/startup.js';
import { registerProcessHandlers } from './core/lifecycle.js';

// 🚀 Lancement
await start();

// 🧼 Gestion du cycle de vie
registerProcessHandlers();
