import { describe, it, expect } from "vitest";
import { buildSystemInstruction, DORARA_ROLE, DAILYENG_CONTEXT, DoraraUserInfo } from "./dorara-context";

describe("buildSystemInstruction", () => {
  it("should build instruction with complete user info", () => {
    const userInfo: DoraraUserInfo = {
      name: "Alice",
      level: "B2",
      currentPage: "/speaking",
    };

    const result = buildSystemInstruction(userInfo);

    expect(result).toContain(DORARA_ROLE);
    expect(result).toContain(DAILYENG_CONTEXT);
    expect(result).toContain("- Name: Alice");
    expect(result).toContain("- English Level: B2");
    expect(result).toContain("- Current Page: /speaking");
    expect(result).toContain("Adjust your explanations to match the user's level.");
  });

  it("should handle null name by defaulting to 'User'", () => {
    const userInfo: DoraraUserInfo = {
      name: null,
      level: "B1",
      currentPage: "/vocab",
    };

    const result = buildSystemInstruction(userInfo);

    expect(result).toContain("- Name: User");
    expect(result).toContain("- English Level: B1");
    expect(result).toContain("- Current Page: /vocab");
  });

  it("should handle null level by defaulting to 'Not determined'", () => {
    const userInfo: DoraraUserInfo = {
      name: "Bob",
      level: null,
      currentPage: "/grammar",
    };

    const result = buildSystemInstruction(userInfo);

    expect(result).toContain("- Name: Bob");
    expect(result).toContain("- English Level: Not determined");
    expect(result).toContain("- Current Page: /grammar");
  });

  it("should handle both null name and null level", () => {
    const userInfo: DoraraUserInfo = {
      name: null,
      level: null,
      currentPage: "/home",
    };

    const result = buildSystemInstruction(userInfo);

    expect(result).toContain("- Name: User");
    expect(result).toContain("- English Level: Not determined");
    expect(result).toContain("- Current Page: /home");
  });

  it("should include important rules", () => {
    const userInfo: DoraraUserInfo = {
      name: "Alice",
      level: "B2",
      currentPage: "/speaking",
    };

    const result = buildSystemInstruction(userInfo);

    expect(result).toContain("IMPORTANT RULES:");
    expect(result).toContain("1. NEVER use markdown formatting in responses");
    expect(result).toContain("5. DETECT the language of the user's question");
  });
});
