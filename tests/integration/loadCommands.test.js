import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));
vi.mock("node:path", () => ({
  default: {
    join: vi.fn((...args) => args.join("/")),
    dirname: vi.fn(() => "/fake/dir"),
  },
}));
vi.mock("node:url", () => ({
  pathToFileURL: vi.fn((p) => ({ href: `file://${p}` })),
  fileURLToPath: vi.fn(() => "/fake/dir/loadCommands.js"),
}));
vi.mock("../logger.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    custom: vi.fn(),
    section: vi.fn(),
  },
}));

const importMock = vi.fn();

import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import logger from "../logger.js";
import { loadCommands } from "../../bot/handlers/loadCommands.js";

describe("loadCommands", () => {
  let client;
  beforeEach(() => {
    vi.clearAllMocks();
    client = { commands: new Map() };
  });

  it("charge les commandes valides", async () => {
    fs.default.existsSync.mockReturnValue(true);
    fs.default.readdirSync.mockReturnValue(["ping.js"]);
    importMock.mockResolvedValueOnce({
      default: { data: { name: "ping" }, execute: vi.fn() },
    });
    const res = await loadCommands(client, importMock);
    expect(res.loaded).toContain("ping");
    expect(res.failed).toHaveLength(0);
    expect(client.commands.has("ping")).toBe(true);
  });

  it("gère les commandes invalides", async () => {
    fs.default.existsSync.mockReturnValue(true);
    fs.default.readdirSync.mockReturnValue(["bad.js"]);
    importMock.mockResolvedValueOnce({ default: {} });
    const res = await loadCommands(client, importMock);
    expect(res.loaded).toHaveLength(0);
    expect(res.failed).toContain("bad.js");
  });

  it("gère les erreurs d'import", async () => {
    fs.default.existsSync.mockReturnValue(true);
    fs.default.readdirSync.mockReturnValue(["fail.js"]);
    importMock.mockRejectedValueOnce(new Error("fail"));
    const res = await loadCommands(client, importMock);
    expect(res.loaded).toHaveLength(0);
    expect(res.failed).toContain("fail.js");
  });

  it("gère le dossier manquant", async () => {
    fs.default.existsSync.mockReturnValue(false);
    const res = await loadCommands(client, importMock);
    expect(res.loaded).toHaveLength(0);
    expect(res.failed).toHaveLength(0);
    expect(res.total).toBe(0);
  });
});
