import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  it("should log error messages with custom format", async () => {
    const message = "Test error message";
    await logger.error(message);
    expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR]", message);
  });

  it("should log warning messages with custom format", async () => {
    const message = "Test warning message";
    await logger.warn(message);
    expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN]", message);
  });

  it("should log success messages with custom format", async () => {
    const message = "Test success message";
    await logger.success(message);
    expect(consoleSpy.log).toHaveBeenCalledWith("[INFO]", `✅ ${message}`);
  });

  it("should log custom messages with custom format", async () => {
    const label = "CUSTOM";
    const message = "Test custom message";
    await logger.custom(label, message);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[INFO]",
      `[${label}] ${message}`
    );
  });

  it("should log section headers", async () => {
    const sectionName = "Test Section";
    await logger.section(sectionName);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[INFO]",
      expect.stringContaining("━")
    );
  });

  it("should log section start headers", async () => {
    const sectionName = "Test Section Start";
    await logger.sectionStart(sectionName);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "[INFO]",
      expect.stringContaining("┏")
    );
  });

  it("should log info messages", async () => {
    const message = "Test CMD message";
    await logger.info(message);
    expect(consoleSpy.log).toHaveBeenCalledWith("[INFO]", message);
  });
});

