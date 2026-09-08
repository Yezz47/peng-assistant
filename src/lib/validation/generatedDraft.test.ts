import { describe, expect, it } from "vitest";

import { MERCHANT_SEEDS } from "@/data/merchants";
import { checkGeneratedDraft } from "@/lib/validation/generatedDraft";
import type { FeedbackInput } from "@/types/domain";

const merchant = MERCHANT_SEEDS[0];
const input: FeedbackInput = {
  merchantId: merchant.id,
  rating: 5,
  tags: [{ aspect: "taste", optionId: "taste_like" }],
  dishIds: ["cqxm_pea_noodles"],
  customDish: "",
  text: "豌杂拌面很香",
  aiProcessingConsent: true,
  researchConsent: false,
  entryType: "direct",
  sessionId: "4c619f4a-96f7-4fc0-b6df-0ab5440f2dcc",
  style: "natural",
  variant: 0,
};
const facts = ["口味：喜欢", "本次吃过：重庆豌杂拌面", "豌杂拌面很香"];

describe("checkGeneratedDraft", () => {
  it("accepts a grounded draft", () => {
    const result = checkGeneratedDraft({
      draft: "在重庆小面，这次整体体验很好。重庆豌杂拌面口味不错，吃起来很香。",
      merchant,
      input,
      allowedFactLabels: facts,
      claimedFactLabels: facts,
    });
    expect(result.passed).toBe(true);
  });

  it("rejects an unselected dish hallucination", () => {
    const result = checkGeneratedDraft({
      draft: "在重庆小面，这次整体体验很好，重庆酸辣粉也非常好吃。",
      merchant,
      input,
      allowedFactLabels: facts,
      claimedFactLabels: facts,
    });
    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.code === "DISH_GROUNDED")?.passed).toBe(false);
  });

  it("rejects incentive language and private data", () => {
    const result = checkGeneratedDraft({
      draft: "在重庆小面五星好评可以返现，请联系13800138000。",
      merchant,
      input,
      allowedFactLabels: facts,
      claimedFactLabels: facts,
    });
    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.code === "NO_INCENTIVE_LANGUAGE")?.passed).toBe(false);
    expect(result.checks.find((check) => check.code === "NO_PRIVATE_DATA")?.passed).toBe(false);
  });
});
