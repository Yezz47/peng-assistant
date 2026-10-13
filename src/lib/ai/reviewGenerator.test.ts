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

  it("uses the customer's concrete detail without repeating the same dish or taste tag", async () => {
    const result = await generateReviewDraft({ merchant, input: baseInput, facts, forceLocal: true });
    expect(result.draft).toContain("重庆豌杂拌面很香");
    expect(result.draft.match(/重庆豌杂拌面/g)).toHaveLength(1);
    expect(result.draft).not.toContain("口味挺合我意");
    expect(result.draft).not.toContain("整体体验");
  });

  it("keeps a negative tag negative and changes the wording when regenerated", async () => {
    const input: FeedbackInput = {
      ...baseInput,
      rating: 2,
      tags: [{ aspect: "serving_speed", optionId: "speed_slow" }],
      dishIds: [],
      text: "",
    };
    const first = await generateReviewDraft({ merchant, input, facts, forceLocal: true });
    const second = await generateReviewDraft({ merchant, input: { ...input, variant: 1 }, facts, forceLocal: true });
    expect(first.draft).toContain("上菜有点慢");
    expect(second.draft).toContain("上菜有点慢");
    expect(first.draft).not.toBe(second.draft);
  });
});
