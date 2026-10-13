import { describe, expect, it } from "vitest";

import { MERCHANT_SEEDS } from "@/data/merchants";
import { validateFeedbackInput } from "@/lib/validation/feedback";

const merchant = MERCHANT_SEEDS[0];
const baseInput = {
  merchantId: merchant.id,
  rating: 4,
  tags: [{ aspect: "taste" as const, optionId: "taste_like" }],
  dishIds: ["cqxm_pea_noodles"],
  customDish: "",
  text: "豌杂拌面很香，不过上菜有点慢",
  aiProcessingConsent: true,
  researchConsent: false,
  entryType: "direct" as const,
  sessionId: "4c619f4a-96f7-4fc0-b6df-0ab5440f2dcc",
};

describe("validateFeedbackInput", () => {
  it("accepts a valid merchant experience", () => {
    const result = validateFeedbackInput(baseInput, merchant);
    expect(result.valid).toBe(true);
    expect(result.facts).toHaveLength(3);
  });

  it("requires at least a tag or meaningful text", () => {
    const result = validateFeedbackInput(
      { ...baseInput, tags: [], dishIds: [], text: "  ！！！" },
      merchant,
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "EXPERIENCE_REQUIRED")).toBe(true);
  });

  it("asks for a concrete detail when tags alone cannot support a 30–50 character review", () => {
    const result = validateFeedbackInput({ ...baseInput, text: "" }, merchant);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "DETAIL_REQUIRED")).toBe(true);
  });

  it("accepts five effective characters and rejects four", () => {
    const short = validateFeedbackInput({ ...baseInput, text: "味道不错" }, merchant);
    const enough = validateFeedbackInput({ ...baseInput, text: "味道还不错" }, merchant);
    expect(short.issues.some((issue) => issue.code === "DETAIL_REQUIRED")).toBe(true);
    expect(enough.valid).toBe(true);
  });

  it("rejects a dish that is not configured for the merchant", () => {
    const result = validateFeedbackInput(
      { ...baseInput, dishIds: ["another_merchant_dish"] },
      merchant,
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_DISH")).toBe(true);
  });

  it("accepts each newly added Jiangnan Xizun dish as a selected fact", () => {
    const jiangnan = MERCHANT_SEEDS.find((candidate) => candidate.id === "jnxz_huhehaote_001")!;
    const addedDishes = [
      ["jnxz_supreme_lion_head", "至尊狮子头"],
      ["jnxz_kung_fu_fish", "功夫鱼"],
      ["jnxz_three_dice_bun", "三丁包"],
      ["jnxz_luyangchun", "绿杨春"],
      ["jnxz_crab_roe_soup_dumpling", "蟹粉汤包"],
    ];
    for (const [dishId, name] of addedDishes) {
      const result = validateFeedbackInput(
        { ...baseInput, merchantId: jiangnan.id, dishIds: [dishId] },
        jiangnan,
      );
      expect(result.valid).toBe(true);
      expect(result.facts.some((fact) => fact.label === `本次吃过：${name}`)).toBe(true);
    }
  });

  it("blocks a clear rating and sentiment conflict", () => {
    const result = validateFeedbackInput(
      {
        ...baseInput,
        rating: 5,
        tags: [{ aspect: "service" as const, optionId: "service_unsatisfied" }],
        text: "服务很慢，让人失望",
      },
      merchant,
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "RATING_SENTIMENT_CONFLICT")).toBe(true);
  });

  it("warns about personal information without inventing identity data", () => {
    const result = validateFeedbackInput(
      { ...baseInput, text: "如需联系我请拨打13800138000" },
      merchant,
    );
    expect(result.warnings.some((warning) => warning.code === "PHONE_DETECTED")).toBe(true);
  });

  it("requires explicit AI processing consent", () => {
    const result = validateFeedbackInput(
      { ...baseInput, aiProcessingConsent: false },
      merchant,
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "AI_CONSENT_REQUIRED")).toBe(true);
  });
});
