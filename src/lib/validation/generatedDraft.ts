import { redactSensitiveText } from "@/lib/validation/feedback";
import type {
  DraftQualityCheck,
  DraftQualityResult,
  FeedbackInput,
  Merchant,
} from "@/types/domain";

interface DraftQualityOptions {
  draft: string;
  merchant: Merchant;
  input: FeedbackInput;
  allowedFactLabels: string[];
  claimedFactLabels: string[];
  fallbackUsed?: boolean;
}

const POSITIVE_PATTERN = /满意|喜欢|不错|很好|好吃|舒适|热情|很快|推荐/u;
const NEGATIVE_PATTERN = /不满意|不喜欢|不太理想|难吃|失望|很慢|太慢|不舒适|差距|提升空间/u;
const INCENTIVE_PATTERN = /返现|免单|赠品|送礼|五星好评|好评有礼|刷单/u;

export function checkGeneratedDraft({
  draft,
  merchant,
  input,
  allowedFactLabels,
  claimedFactLabels,
  fallbackUsed = false,
}: DraftQualityOptions): DraftQualityResult {
  const normalized = draft.trim();
  const selectedDishIds = new Set(input.dishIds);
  const unselectedDish = merchant.dishes.find(
    (dish) => dish.status === "active"
      && dish.name !== merchant.name
      && !selectedDishIds.has(dish.id)
      && normalized.includes(dish.name),
  );
  const allowedFacts = new Set(allowedFactLabels);
  const unknownClaim = claimedFactLabels.find((label) => !allowedFacts.has(label));
  const oppositeSentiment = input.rating >= 4
    ? NEGATIVE_PATTERN.test(normalized) && !POSITIVE_PATTERN.test(normalized)
    : input.rating <= 2
      ? POSITIVE_PATTERN.test(normalized) && !NEGATIVE_PATTERN.test(normalized)
      : false;

  const checks: DraftQualityCheck[] = [
    {
      code: "LENGTH_SAFE",
      passed: normalized.length >= 15 && normalized.length <= 300,
      message: "草稿长度应在15—300字之间。",
    },
    {
      code: "MERCHANT_MATCH",
      passed: normalized.includes(merchant.name),
      message: "草稿需要对应当前商家。",
    },
    {
      code: "NO_PRIVATE_DATA",
      passed: redactSensitiveText(normalized) === normalized,
      message: "草稿不能包含手机号、邮箱、证件号或银行卡号。",
    },
    {
      code: "NO_INCENTIVE_LANGUAGE",
      passed: !INCENTIVE_PATTERN.test(normalized),
      message: "草稿不能包含返现、赠品或诱导好评表达。",
    },
    {
      code: "DISH_GROUNDED",
      passed: !unselectedDish,
      message: unselectedDish ? `草稿提到了未选择的菜品“${unselectedDish.name}”。` : "菜品信息来自用户选择。",
    },
    {
      code: "FACT_REFERENCES_GROUNDED",
      passed: !unknownClaim,
      message: unknownClaim ? "AI声明使用了事实白名单之外的信息。" : "AI使用的事实均在白名单内。",
    },
    {
      code: "RATING_SENTIMENT_MATCH",
      passed: !oppositeSentiment,
      message: "草稿语气需要与用户星级一致。",
    },
  ];

  return {
    passed: checks.every((check) => check.passed),
    fallbackUsed,
    checks,
  };
}
