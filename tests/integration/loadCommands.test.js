import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import fs from 'node:fs';
import path from 'node:path';
import { loadCommands } from "../../bot/handlers/loadCommands.js";

// Mocks
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:url', () => ({
  pathToFileURL: vi.fn((filePath) => ({ href: `file://${filePath}` })),
  fileURLToPath: vi.fn(() => '/mock/handlers')
}));

vi.mock('../../bot/logger.js', () => ({
  default: {
    warn: vi.fn(),
    info: vi.fn(),
    section: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn(),
  },
}));
import logger from '../../bot/logger.js';

describe('loadCommands', () => {
  let mockClient;
  let mockImportFn;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock client Discord
    mockClient = {
      commands: new Map()
    };

    // Mock import function
    mockImportFn = vi.fn();

    // Mock path.join pour retourner un chemin prévisible
    path.join.mockImplementation((...args) => args.filter(Boolean).join('/'));
    path.dirname.mockReturnValue('/mock/handlers');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cas de succès basique', () => {
    it('charge une commande simple avec succès', async () => {
      // Setup - dossier existe avec un fichier
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'ping.js', isDirectory: () => false, isFile: () => true }
      ]);

      // Mock de la commande
      const mockCommand = {
        default: {
          data: { name: 'ping' },
          execute: vi.fn()
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(1);
      expect(result.loaded[0]).toEqual({
        name: 'ping',
        file: 'ping.js',
        category: 'general'
      });
      expect(result.failed).toHaveLength(0);
      expect(result.total).toBe(1);
      expect(mockClient.commands.has('ping')).toBe(true);
      expect(logger.success).toHaveBeenCalledWith('1 commandes chargées avec succès');
    });

    it('charge des commandes dans des sous-dossiers', async () => {
      // Setup - structure avec sous-dossiers
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync
        .mockReturnValueOnce([
          { name: 'moderation', isDirectory: () => true, isFile: () => false },
          { name: 'ping.js', isDirectory: () => false, isFile: () => true }
        ])
        .mockReturnValueOnce([
          { name: 'ban.js', isDirectory: () => false, isFile: () => true }
        ]);

      const mockPingCommand = {
        default: {
          data: { name: 'ping' },
          execute: vi.fn()
        }
      };
      const mockBanCommand = {
        default: {
          data: { name: 'ban' },
          execute: vi.fn()
        }
      };

      // L'ordre d'exécution : d'abord moderation (sous-dossier), puis ping.js
      mockImportFn
        .mockResolvedValueOnce(mockBanCommand)  // ban.js dans moderation/
        .mockResolvedValueOnce(mockPingCommand); // ping.js dans racine

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(2);
      expect(result.categories).toEqual({
        'moderation': ['ban'],
        'general': ['ping']
      });
      expect(logger.custom).toHaveBeenCalledWith('CMD', 'ban (moderation)');
      expect(logger.custom).toHaveBeenCalledWith('CMD', 'ping (general)');
    });
  });

  describe('cas d\'erreur - validation des modules', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'invalid.js', isDirectory: () => false, isFile: () => true }
      ]);
    });

    it('rejette un module sans export default', async () => {
      mockImportFn.mockResolvedValue({});

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        file: 'invalid.js',
        error: 'Pas d\'export default dans invalid.js'
      });
      expect(logger.warn).toHaveBeenCalledWith('Pas d\'export default dans invalid.js');
    });

    it('rejette un module sans data.name', async () => {
      const mockCommand = {
        default: {
          execute: vi.fn()
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.failed[0].error).toBe('Pas de data.name dans invalid.js');
    });

    it('rejette un module sans fonction execute', async () => {
      const mockCommand = {
        default: {
          data: { name: 'test' }
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.failed[0].error).toBe('Pas de fonction execute dans invalid.js');
    });

    it('rejette un module avec data.setName invalide', async () => {
      const mockCommand = {
        default: {
          data: { 
            name: 'test',
            setName: 'not-a-function'
          },
          execute: vi.fn()
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.failed[0].error).toBe('data.setName invalide dans invalid.js');
    });
  });

  describe('gestion des doublons', () => {
    it('détecte et rejette les commandes dupliquées', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'ping1.js', isDirectory: () => false, isFile: () => true },
        { name: 'ping2.js', isDirectory: () => false, isFile: () => true }
      ]);

      const mockCommand1 = {
        default: {
          data: { name: 'ping' },
          execute: vi.fn()
        }
      };
      const mockCommand2 = {
        default: {
          data: { name: 'ping' }, // Même nom!
          execute: vi.fn()
        }
      };

      mockImportFn
        .mockResolvedValueOnce(mockCommand1)
        .mockResolvedValueOnce(mockCommand2);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('déjà enregistrée (doublon dans ping2.js)');
    });
  });

  describe('gestion des erreurs d\'import', () => {
    it('gère les erreurs lors de l\'import des modules', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'broken.js', isDirectory: () => false, isFile: () => true }
      ]);

      mockImportFn.mockRejectedValue(new Error('Syntax error'));

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toEqual({
        file: 'broken.js',
        error: 'Syntax error'
      });
      expect(logger.error).toHaveBeenCalledWith('Erreur lors du chargement de broken.js: Syntax error');
    });
  });

  describe('cas limites', () => {
    it('gère un dossier commands inexistant', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result).toEqual({
        loaded: [],
        failed: [],
        total: 0,
        categories: {}
      });
      expect(logger.warn).toHaveBeenCalledWith('Dossier commands introuvable:', expect.stringContaining('commands'));
    });

    it('gère un dossier commands vide', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result).toEqual({
        loaded: [],
        failed: [],
        total: 0,
        categories: {}
      });
      expect(logger.warn).toHaveBeenCalledWith('Aucun fichier de commande trouvé');
    });

    it('ignore les fichiers non-.js', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true },
        { name: 'config.json', isDirectory: () => false, isFile: () => true },
        { name: 'ping.js', isDirectory: () => false, isFile: () => true }
      ]);

      const mockCommand = {
        default: {
          data: { name: 'ping' },
          execute: vi.fn()
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.total).toBe(1); // Seulement le .js
      expect(result.loaded).toHaveLength(1);
      expect(mockImportFn).toHaveBeenCalledTimes(1);
    });

    it('gère les erreurs critiques', async () => {
      // Simuler une erreur lors de la lecture du dossier
      fs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result).toEqual({
        loaded: [],
        failed: [],
        total: 0,
        categories: {},
        criticalError: 'Permission denied'
      });
      expect(logger.error).toHaveBeenCalledWith('Erreur critique lors du chargement des commandes: Permission denied');
    });
  });

  describe('affichage des statistiques', () => {
    it('affiche correctement les statistiques de chargement', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync
        .mockReturnValueOnce([
          { name: 'admin', isDirectory: () => true, isFile: () => false },
          { name: 'ping.js', isDirectory: () => false, isFile: () => true },
          { name: 'invalid.js', isDirectory: () => false, isFile: () => true }
        ])
        .mockReturnValueOnce([
          { name: 'ban.js', isDirectory: () => false, isFile: () => true }
        ]);

      const mockPingCommand = {
        default: {
          data: { name: 'ping' },
          execute: vi.fn()
        }
      };
      const mockBanCommand = {
        default: {
          data: { name: 'ban' },
          execute: vi.fn()
        }
      };

      mockImportFn
        .mockResolvedValueOnce(mockPingCommand)
        .mockResolvedValueOnce({}) // Module invalide
        .mockResolvedValueOnce(mockBanCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(logger.section).toHaveBeenCalledWith('Chargement des commandes');
      expect(logger.info).toHaveBeenCalledWith('3 fichiers de commandes détectés');
      expect(logger.success).toHaveBeenCalledWith('2 commandes chargées avec succès');
      expect(logger.info).toHaveBeenCalledWith('Répartition par catégorie:');
      expect(logger.custom).toHaveBeenCalledWith('CAT', 'general: 1 commande(s)');
      expect(logger.custom).toHaveBeenCalledWith('CAT', 'admin: 1 commande(s)');
      expect(logger.warn).toHaveBeenCalledWith('1 commandes en échec:');
    });
  });

  describe('validation approfondie', () => {
    it('accepte un module avec data.setName valide', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        { name: 'valid.js', isDirectory: () => false, isFile: () => true }
      ]);

      const mockCommand = {
        default: {
          data: { 
            name: 'test',
            setName: vi.fn() // Fonction valide
          },
          execute: vi.fn()
        }
      };
      mockImportFn.mockResolvedValue(mockCommand);

      const result = await loadCommands(mockClient, mockImportFn);

      expect(result.loaded).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });
  });
});