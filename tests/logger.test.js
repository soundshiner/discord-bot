import { describe, it, expect, beforeEach, vi } from "vitest";
import logger from "../bot/logger.js";

// Mock Winston
vi.mock("winston", () => ({
  default: {
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
    format: {
      printf: vi.fn(),
      combine: vi.fn(),
      colorize: vi.fn(),
      timestamp: vi.fn(),
      simple: vi.fn(),
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
    },
  },
}));

vi.mock("path", () => ({
  default: {
    resolve: vi.fn((...args) => args.join("/")),
    join: vi.fn((...args) => args.join("/")),
  },
  resolve: vi.fn((...args) => args.join("/")),
  join: vi.fn((...args) => args.join("/")),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}));

describe("Logger", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have all required methods", () => {
    expect(logger).toHaveProperty("info");
    expect(logger).toHaveProperty("error");
    expect(logger).toHaveProperty("warn");
    expect(logger).toHaveProperty("success");
    expect(logger).toHaveProperty("custom");
    expect(logger).toHaveProperty("section");
  });

  it("should log error messages with custom format", () => {
    const message = "Test error message";
    logger.error(message);

    expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR]", message);
  });

  it("should log warning messages with custom format", () => {
    const message = "Test warning message";
    logger.warn(message);

    expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN]", message);
  });

  it("should log success messages with custom format", () => {
    const message = "Test success message";
    logger.success(message);

    expect(consoleSpy.log).toHaveBeenCalledWith("[SUCCESS]", message);
  });

  it("should log custom messages with custom format", () => {
    const label = "CUSTOM";
    const message = "Test custom message";
    logger.custom(label, message);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(`[${label}]`),
      expect.stringContaining(message)
    );
  });

  it("should log section headers", () => {
    const sectionName = "Test Section";
    logger.section(sectionName);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("━".repeat(30))
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(sectionName)
    );
  });

  it("should log section start headers", () => {
    const sectionName = "Test Section Start";
    logger.section(sectionName);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("━".repeat(30))
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(sectionName)
    );
  });

  it("should log info messages", () => {
    const message = "Test CMD message";
    logger.info(message);

    expect(consoleSpy.log).toHaveBeenCalledWith("[INFO]", message);
  });
});

