import { describe, it, expect } from "vitest";
import { cn, toTitleCase } from "./utils";

describe("cn()", () => {
  it("merges multiple class names", () => {
    const result = cn("bg-red-500", "text-white", "p-4");
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
    expect(result).toContain("p-4");
  });

  it("handles conditional classes", () => {
    const result = cn("base", true && "active", false && "hidden");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  it("resolves Tailwind conflicts (later class wins)", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("toTitleCase()", () => {
  it("converts lowercase to title case", () => {
    expect(toTitleCase("hello")).toBe("Hello");
  });

  it("converts multiple words", () => {
    expect(toTitleCase("hello world")).toBe("Hello World");
  });

  it("converts uppercase to title case", () => {
    expect(toTitleCase("HELLO WORLD")).toBe("Hello World");
  });

  it("handles empty string", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("handles mixed case", () => {
    expect(toTitleCase("hElLo WoRlD")).toBe("Hello World");
  });
});
