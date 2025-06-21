import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules at the top level - BEFORE imports
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn()
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn()
}));

vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args) => ['/fake/dir', ...args.slice(2)].join('/')),
    dirname: vi.fn(() => '/fake/dir')
  },
  join: vi.fn((...args) => ['/fake/dir', ...args.slice(2)].join('/')),
  dirname: vi.fn(() => '/fake/dir')
}));

vi.mock('node:url', () => ({
  default: {
    pathToFileURL: vi.fn(p => ({ href: p })),
    fileURLToPath: vi.fn(() => '/fake/dir')
  },
  pathToFileURL: vi.fn(p => ({ href: p })),
  fileURLToPath: vi.fn(() => '/fake/dir')
}));

// Now import modules
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
  custom: vi.fn(),
  section: vi.fn()
};

const mockClient = {
  commands: { set: vi.fn() },
  on: vi.fn(),
  once: vi.fn()
};

const mockApp = { use: vi.fn() };

// Helper pour mocker import dynamique
const importMock = vi.fn();

let loadFiles;
let fsExistsSync;
let fsReaddirSync;

beforeEach(async () => {
  vi.clearAllMocks();
  importMock.mockReset();

  // Get the mocked functions using vi.mocked()
  fsExistsSync = vi.mocked(fs.existsSync);
  fsReaddirSync = vi.mocked(fs.readdirSync);

  // Dynamically import loadFiles after mocks are set up
  ({ loadFiles } = await import('../core/loadFiles.js'));
});

describe('loadFiles', () => {
  it('retourne vide si le dossier est manquant', async () => {
    fsExistsSync.mockReturnValue(false);
    const res = await loadFiles('commands', 'command', mockClient, null, mockLogger, importMock);
    expect(res).toEqual({ loaded: [], failed: [], total: 0 });
    expect(mockLogger.warn).toHaveBeenCalledWith('Dossier commands introuvable.');
  });

  it('charge une commande valide', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['ping.js']);

    importMock.mockResolvedValue({
      default: {
        data: { name: 'ping' },
        execute: vi.fn()
      }
    });

    const client = { commands: { set: vi.fn() } };
    const res = await loadFiles('commands', 'command', client, null, mockLogger, importMock);
    expect(res.loaded).toContain('ping');
    expect(client.commands.set).toHaveBeenCalledWith('ping', expect.any(Object));
    expect(mockLogger.custom).toHaveBeenCalledWith('CMD', expect.stringContaining('ping'));
  });

  it('signale une commande invalide', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['bad.js']);
    importMock.mockResolvedValue({ default: {} });
    const res = await loadFiles('commands', 'command', mockClient, null, mockLogger, importMock);
    expect(res.failed).toContain('bad.js');
    expect(mockLogger.warn).toHaveBeenCalledWith('Commande invalide dans bad.js');
  });

  it('charge un event valide', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['ready.js']);
    importMock.mockResolvedValue({
      default: {
        name: 'ready',
        execute: vi.fn()
      }
    });
    const client = { on: vi.fn(), once: vi.fn() };
    const res = await loadFiles('events', 'event', client, null, mockLogger, importMock);
    expect(res.loaded).toContain('ready');
    expect(mockLogger.custom).toHaveBeenCalledWith('EVENTS', expect.stringContaining('ready'));
  });

  it('charge une tâche valide', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['task.js']);
    importMock.mockResolvedValue({
      default: {
        name: 'task',
        execute: vi.fn(),
        interval: 1
      }
    });
    const res = await loadFiles('tasks', 'task', mockClient, null, mockLogger, importMock);
    expect(res.loaded).toContain('task');
    expect(mockLogger.custom).toHaveBeenCalledWith('TASKS', expect.stringContaining('task'));
  });

  it('charge un utilitaire', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['util.js']);
    importMock.mockResolvedValue({});
    const res = await loadFiles('utils', 'util', mockClient, null, mockLogger, importMock);
    expect(res.loaded).toContain('util.js');
    expect(mockLogger.custom).toHaveBeenCalledWith('UTILS', expect.stringContaining('util.js'));
  });

  it('charge une route Express', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['route.js']);
    importMock.mockResolvedValue({
      default: vi.fn(() => (req, res) => res.send('ok'))
    });
    const app = { use: vi.fn() };
    const res = await loadFiles('api', 'route', mockClient, app, mockLogger, importMock);
    expect(res.loaded).toContain('route');
    expect(app.use).toHaveBeenCalledWith('/v1/route', expect.any(Function));
    expect(mockLogger.custom).toHaveBeenCalledWith('ROUTE', expect.stringContaining('route'));
  });

  it('signale une erreur de chargement', async () => {
    fsExistsSync.mockReturnValue(true);
    fsReaddirSync.mockReturnValue(['fail.js']);
    importMock.mockRejectedValue(new Error('fail!'));
    const res = await loadFiles('commands', 'command', mockClient, null, mockLogger, importMock);
    expect(res.failed).toContain('fail.js');
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('fail.js'));
  });
});
