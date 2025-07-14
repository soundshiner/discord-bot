// utils/yoda-config.js
import fs from 'fs';
const PATH = './data/yodaConfig.json';

export function isYodaEnabled (guildId) {
  if (!fs.existsSync(PATH)) return false;
  const config = JSON.parse(fs.readFileSync(PATH));
  return config[guildId]?.enabled ?? false;
}

export function setYodaMode (guildId, enabled) {
  let config = {};
  if (fs.existsSync(PATH)) {
    config = JSON.parse(fs.readFileSync(PATH));
  }

  config[guildId] = { enabled };
  fs.writeFileSync(PATH, JSON.stringify(config, null, 2));
}
