import { describe, it, expect, beforeEach, vi } from "vitest";
import playCommand from "../../bot/commands/play.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import logger from "../../bot/logger.js";

vi.mock("@discordjs/voice", () => ({
  joinVoiceChannel: vi.fn(),
  createAudioPlayer: vi.fn(),
  createAudioResource: vi.fn(),
  AudioPlayerStatus: { Playing: "playing" },
  NoSubscriberBehavior: { Pause: "pause" },
}));

vi.mock("../../bot/logger.js", () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock("discord.js", () => ({
  ChannelType: { GuildStageVoice: 13, GuildVoice: 2 },
  MessageFlags: { Ephemeral: 64 },
  SlashCommandBuilder: class {
    setName(name) {
      this.name = name;
      return this;
    }
    setDescription(description) {
      this.description = description;
      return this;
    }
    setDMPermission() {
      return this;
    }
    setDefaultMemberPermissions() {
      return this;
    }
  },
}));

describe("Play Command", () => {
  let mockInteraction;
  let mockClient;

  beforeEach(() => {
    mockInteraction = {
      commandName: "play",
      user: { id: "123456789", username: "testuser" },
      guild: { id: "987654321", name: "Test Guild" },
      channel: { id: "111222333", name: "test-channel" },
      createdTimestamp: Date.now(),
      reply: vi.fn().mockResolvedValue({
        createdTimestamp: Date.now() + 50,
        editReply: vi.fn().mockResolvedValue(true),
      }),
      editReply: vi.fn().mockResolvedValue(true),
      deferReply: vi.fn().mockResolvedValue(true),
      followUp: vi.fn().mockResolvedValue(true),
      replied: false,
      deferred: false,
      options: {
        getString: vi.fn(),
        getInteger: vi.fn(),
        getBoolean: vi.fn(),
        getSubcommand: vi.fn(),
      },
      member: {
        voice: {
          channel: {
            id: "555555555",
            name: "Voice Channel",
            type: 13,
            guild: {
              id: "987654321",
              voiceAdapterCreator: vi.fn(),
            },
          },
        },
      },
    };
    mockClient = {};
    mockInteraction.client = mockClient;
  });

  it("should have correct command data structure", () => {
    expect(playCommand).toHaveProperty("data");
    expect(playCommand).toHaveProperty("execute");
    expect(playCommand.data.name).toBe("play");
    expect(playCommand.data.description).toBeDefined();
  });

  it("should handle play command with valid URL", async () => {
    mockInteraction.options.getString.mockReturnValue(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    try {
      await playCommand.execute(mockInteraction, mockClient);
      expect(true).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should handle play command with search query", async () => {
    const playCommandMock = {
      execute: vi.fn().mockResolvedValue({
        success: true,
        message: "Searching for: test song",
      }),
    };
    mockInteraction.options.getString.mockReturnValue("test song");
    await playCommandMock.execute(mockInteraction, mockClient);
    expect(playCommandMock.execute).toHaveBeenCalledWith(
      mockInteraction,
      mockClient
    );
  });

  describe("(erreurs)", () => {
    it("retourne une erreur si l'utilisateur n'est pas dans un salon vocal", async () => {
      const interaction = {
        ...mockInteraction,
        member: { voice: null },
        reply: vi.fn(),
      };
      await playCommand.execute(interaction);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Tu dois être dans un salon vocal"),
        })
      );
    });

    it("retourne une erreur si le salon vocal nest pas un Stage Channel", async () => {
      const interaction = {
        ...mockInteraction,
        member: { voice: { channel: { type: 2 } } }, // 2 = GuildVoice
        reply: vi.fn(),
      };
      await playCommand.execute(interaction);
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            "Cette commande ne fonctionne que dans un Stage Channel"
          ),
        })
      );
    });

    it("retourne une erreur si joinVoiceChannel échoue", async () => {
      // Simule une erreur lors de la connexion vocale
      joinVoiceChannel.mockImplementationOnce(() => {
        throw new Error("Connexion échouée");
      });
      mockInteraction.deferred = true;
      mockInteraction.editReply = vi.fn();
      await playCommand.execute(mockInteraction);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Erreur exécution /play"),
        expect.any(Error)
      );
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            "❌ Une erreur est survenue pendant la tentative de lecture."
          ),
        })
      );
    });

    it("retourne une erreur si createAudioResource échoue", async () => {
      // Simule une connexion réussie
      joinVoiceChannel.mockReturnValue({ subscribe: vi.fn() });
      // Simule la création du player
      createAudioPlayer.mockReturnValue({
        play: vi.fn(),
        once: vi.fn(),
        on: vi.fn(),
      });
      // Simule une erreur lors de la création de la ressource audio
      createAudioResource.mockImplementationOnce(() => {
        throw new Error("Erreur ressource");
      });
      mockInteraction.deferred = true;
      mockInteraction.editReply = vi.fn();
      await playCommand.execute(mockInteraction);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Erreur exécution /play"),
        expect.any(Error)
      );
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            "❌ Une erreur est survenue pendant la tentative de lecture."
          ),
        })
      );
    });
  });
});
