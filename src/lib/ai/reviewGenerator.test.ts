import { describe, expect, it } from "vitest";

import { MERCHANT_SEEDS } from "@/data/merchants";
import { generateReviewDraft } from "@/lib/ai/reviewGenerator";
import type { FeedbackInput, NormalizedFact } from "@/types/domain";

const merchant = MERCHANT_SEEDS[0];
const baseInput: FeedbackInput = {
  merchantId: merchant.id,
  rating: 4,
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
const facts: NormalizedFact[] = [
  { aspect: "taste", label: "口味：喜欢", sentiment: "positive", source: "selected_tag" },
  { aspect: "dish", label: "本次吃过：重庆豌杂拌面", source: "selected_dish" },
  { aspect: "free_text", label: "豌杂拌面很香", source: "user_text" },
];

describe("generateReviewDraft local fallback", () => {
  it("only uses configured merchant and selected dish context", async () => {
    const result = await generateReviewDraft({ merchant, input: baseInput, facts, forceLocal: true });
    expect(result.draft).toContain("重庆小面");
    expect(result.draft).toContain("重庆豌杂拌面");
    expect(result.draft).not.toContain("重庆酸辣粉");
  });

  it("redacts sensitive text from the generated draft", async () => {
    const result = await generateReviewDraft({
      merchant,
      input: { ...baseInput, text: "联系电话13800138000" },
      facts,
      forceLocal: true,
    });
    expect(result.draft).not.toContain("13800138000");
    expect(result.draft).toContain("[已脱敏]");
  });
});
