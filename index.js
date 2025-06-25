// root/index.js (ESM)
// ===================

import 'dotenv/config'; // Charge les variables d'env dès le début
import './core/env.js'; // Vérifie que tout est bien défini
import { start } from './core/startup.js';
import { registerProcessHandlers } from './core/lifecycle.js';

// 🚀 Lancement
await start();

// 🧼 Gestion du cycle de vie (SIGINT, exceptions...)
registerProcessHandlers();