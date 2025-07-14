import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import logger from "../bot/logger.js";

let outputBuffer;
let stdoutSpy;

describe("Logger", () => {
  beforeEach(() => {
    outputBuffer = [];
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((msg) => {
      outputBuffer.push(msg);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    outputBuffer = [];
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
    expect(outputBuffer.join("")).toContain("[ERROR]");
    expect(outputBuffer.join("")).toContain(message);
  });

  it("should log warning messages with custom format", async () => {
    const message = "Test warning message";
    await logger.warn(message);
    expect(outputBuffer.join("")).toContain("[WARN]");
    expect(outputBuffer.join("")).toContain(message);
  });

  it("should log success messages with custom format", async () => {
    const message = "Test success message";
    await logger.success(message);
    expect(outputBuffer.join("")).toContain("[INFO]");
    expect(outputBuffer.join("")).toContain(`✅ ${message}`);
  });

  it("should log custom messages with custom format", async () => {
    const label = "CUSTOM";
    const message = "Test custom message";
    await logger.custom(label, message);
    expect(outputBuffer.join("")).toContain("[INFO]");
    expect(outputBuffer.join("")).toContain(`[${label}] ${message}`);
  });

  it("should log section headers", async () => {
    const sectionName = "Test Section";
    await logger.section(sectionName);
    expect(outputBuffer.join("")).toContain("[INFO]");
    expect(outputBuffer.join("")).toMatch(/━/);
  });

  it("should log section start headers", async () => {
    const sectionName = "Test Section Start";
    await logger.sectionStart(sectionName);
    expect(outputBuffer.join("")).toContain("[INFO]");
    expect(outputBuffer.join("")).toMatch(/┏/);
  });

  it("should log info messages", async () => {
    const message = "Test CMD message";
    await logger.info(message);
    expect(outputBuffer.join("")).toContain("[INFO]");
    expect(outputBuffer.join("")).toContain(message);
  });
});

