/* eslint-disable comma-dangle */
// utils/presence.js
import RPC from 'discord-rpc';

const clientId = 'TON_CLIENT_ID_DISCORD'; // à créer dans Discord Developer Portal
const rpc = new RPC.Client({ transport: 'ipc' });

let isConnected = false;

rpc.on('ready', () => {
  // eslint-disable-next-line no-console
  console.log('✅ Rich Presence connecté à Discord.');
  isConnected = true;
});

function startPresence(title = 'soundSHINE Radio') {
  // eslint-disable-next-line no-console
  if (!isConnected) return console.warn('Discord RPC pas prêt.');

  rpc.setActivity({
    details: '🎧 Écoute : soundSHINE Radio',
    state: title,
    largeImageKey: 'soundshine', // correspond à l'asset uploadé sur Discord Dev Portal
    largeImageText: 'La vitamine D du tympan',
    startTimestamp: Date.now(),
    instance: false,
    type: 2,
  });
}

function connectRPC() {
  // eslint-disable-next-line no-console
  rpc.login({ clientId }).catch(console.error);
}

export { connectRPC, startPresence };
