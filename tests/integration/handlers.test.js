import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getCurrentTrack, getPlaylist } from "../../utils/playlistManager.js";
import { formatDuration, formatTimestamp } from "../../utils/formatters.js";
import { getWallpaper } from "../../commands/getwallpaper.js";
import { postToSocialChannel } from "../../utils/socialChannel.js";
import { validateURL } from "../../utils/validateURL.js";
import { genres } from "../../utils/genres.js";
import config from "../../core/config.js";
import logger from "../../utils/centralizedLogger.js";

// Mock simple de discord.js
vi.mock("discord.js", () => ({
  EmbedBuilder: vi.fn(() => ({
    setColor: vi.fn().mockReturnThis(),
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    setFooter: vi.fn().mockReturnThis(),
    setTimestamp: vi.fn().mockReturnThis(),
  })),
  ActionRowBuilder: vi.fn(() => ({
    addComponents: vi.fn().mockReturnThis(),
  })),
  ButtonBuilder: vi.fn(() => ({
    setCustomId: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
  })),
  ButtonStyle: { Success: 1, Danger: 2, Primary: 3 },
}));

vi.mock("../../utils/centralizedLogger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    logSuccess: vi.fn(),
    custom: vi.fn(),
    logCommand: vi.fn(),
  },
}));

vi.mock("../../utils/errorHandler.js", () => ({
  default: {
    handleInteractionError: vi.fn(),
  },
}));

// Imports après les mocks
import handlePlaylistSelect from "../../handlers/handlePlaylistSelect.js";
import errorHandler from "../../utils/errorHandler.js";

describe("handlePlaylistSelect", () => {
  let mockInteraction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInteraction = {
      values: ["Test Playlist"],
      user: { id: "user123", tag: "User#1234" },
      update: vi.fn().mockResolvedValue(),
    };
  });

  it("met à jour l'interface de playlist et log le succès", async () => {
    await handlePlaylistSelect(mockInteraction);

    // Vérifier que les logs sont appelés
    expect(logger.info).toHaveBeenCalledWith(
      "Playlist sélectionnée par User#1234: Test Playlist"
    );
    expect(logger.success).toHaveBeenCalledWith(
      "Interface de playlist mise à jour pour User#1234"
    );

    // Vérifier que interaction.update est appelé
    expect(mockInteraction.update).toHaveBeenCalled();
  });

  it("gère les erreurs et appelle errorHandler", async () => {
    const error = new Error("update fail");
    mockInteraction.update.mockRejectedValueOnce(error);

    await expect(handlePlaylistSelect(mockInteraction)).rejects.toThrow(
      "update fail"
    );
    expect(errorHandler.handleInteractionError).toHaveBeenCalledWith(
      error,
      mockInteraction
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Erreur dans handlePlaylistSelect:",
      error
    );
  });
});

