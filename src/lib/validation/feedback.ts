import { z } from "zod";

import { EXPERIENCE_ASPECT_MAP } from "@/config/experienceAspects";
import type {
  ExperienceAspectId,
  FeedbackInput,
  FeedbackValidationResult,
  Merchant,
  NormalizedFact,
  Sentiment,
  ValidationIssue,
  ValidationWarning,
} from "@/types/domain";

const merchantIdSchema = z
  .string()
  .regex(/^[a-z0-9_-]{3,32}$/, "商家入口信息格式不正确。");

const experienceTagSchema = z.object({
  aspect: z.enum(["taste", "serving_speed", "service", "environment"]),
  optionId: z.string().min(1),
});

export const feedbackInputSchema = z.object({
  merchantId: merchantIdSchema,
  rating: z.number().int().min(1).max(5),
  tags: z.array(experienceTagSchema).max(4),
  dishIds: z.array(z.string().min(1)).max(3),
  customDish: z.string().max(40).default(""),
  text: z.string().max(200),
  aiProcessingConsent: z.boolean(),
  researchConsent: z.boolean(),
  entryType: z.enum(["nfc", "qr", "direct"]),
  sessionId: z.string().uuid(),
  style: z.enum(["natural", "concise", "detailed"]).default("natural"),
  variant: z.number().int().min(0).max(5).default(0),
});

const TEXT_SENTIMENT_PATTERNS: Record<Exclude<Sentiment, "neutral">, RegExp> = {
  positive: /喜欢|满意|好吃|不错|很快|舒适|推荐|新鲜|热情|干净/,
  negative: /不喜欢|不满意|难吃|不好|很慢|太慢|不舒适|失望|不新鲜|冷淡|脏|凉了|偏咸|偏淡/,
};

const SENSITIVE_PATTERNS: Array<{ code: string; pattern: RegExp; message: string }> = [
  { code: "PHONE_DETECTED", pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/, message: "内容可能包含手机号，建议删除后再继续。" },
  { code: "EMAIL_DETECTED", pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/, message: "内容可能包含邮箱地址，建议删除后再继续。" },
  { code: "ID_NUMBER_DETECTED", pattern: /(?<!\d)\d{17}[\dXx](?!\d)/, message: "内容可能包含身份证号，建议删除后再继续。" },
  { code: "BANK_NUMBER_DETECTED", pattern: /(?<!\d)\d{16,19}(?!\d)/, message: "内容可能包含银行卡号，建议删除后再继续。" },
];

export function redactSensitiveText(text: string): string {
  return SENSITIVE_PATTERNS.reduce((current, sensitive) => {
    const flags = sensitive.pattern.flags.includes("g")
      ? sensitive.pattern.flags
      : `${sensitive.pattern.flags}g`;
    return current.replace(new RegExp(sensitive.pattern.source, flags), "[已脱敏]");
  }, text);
}

export function normalizeValidatedFeedbackInput(rawInput: unknown): FeedbackInput {
  const input = feedbackInputSchema.parse(rawInput);
  return { ...input, customDish: input.customDish.trim(), text: input.text.trim() };
}

function isMeaningfulText(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text.trim());
}

function fieldFromPath(path: PropertyKey[]): ValidationIssue["field"] {
  const first = path[0];
  if (first === "merchantId") return "merchantId";
  if (first === "rating") return "rating";
  if (first === "tags") return "tags";
  if (first === "dishIds") return "dishIds";
  if (first === "customDish") return "customDish";
  if (first === "text") return "text";
  if (first === "aiProcessingConsent") return "consent";
  return "input";
}

function resolveTag(aspectId: ExperienceAspectId, optionId: string) {
  const aspect = EXPERIENCE_ASPECT_MAP.get(aspectId);
  const option = aspect?.options.find((candidate) => candidate.id === optionId);
  return aspect && option ? { aspect, option } : null;
}

function detectTextSentiment(text: string): Sentiment | null {
  const hasPositive = TEXT_SENTIMENT_PATTERNS.positive.test(text);
  const hasNegative = TEXT_SENTIMENT_PATTERNS.negative.test(text);
  if (hasPositive === hasNegative) return null;
  return hasPositive ? "positive" : "negative";
}

export function validateFeedbackInput(
  rawInput: unknown,
  merchant: Merchant | null,
): FeedbackValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const facts: NormalizedFact[] = [];
  const parsed = feedbackInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        field: fieldFromPath(issue.path),
        code: `INVALID_${String(issue.path[0] ?? "INPUT").toUpperCase()}`,
        message: issue.message,
      });
    }
    return { valid: false, issues, warnings, facts };
  }

  const input: FeedbackInput = {
    ...parsed.data,
    customDish: parsed.data.customDish.trim(),
    text: parsed.data.text.trim(),
  };

  if (!merchant || merchant.id !== input.merchantId) {
    issues.push({ field: "merchantId", code: "MERCHANT_NOT_FOUND", message: "未找到当前商家，请重新进入。" });
    return { valid: false, issues, warnings, facts };
  }
  if (merchant.status !== "active") {
    issues.push({ field: "merchantId", code: "MERCHANT_INACTIVE", message: "该门店暂未开放此服务。" });
  }

  if (!input.aiProcessingConsent) {
    issues.push({ field: "consent", code: "AI_CONSENT_REQUIRED", message: "请先确认AI处理说明。" });
  }

  const meaningfulText = isMeaningfulText(input.text);
  if (input.tags.length === 0 && !meaningfulText) {
    issues.push({ field: "input", code: "EXPERIENCE_REQUIRED", message: "请至少选择一个体验标签，或补充一句真实感受。" });
  }
  if (input.text.length > 0 && !meaningfulText) {
    issues.push({ field: "text", code: "TEXT_NOT_MEANINGFUL", message: "文字内容不能只有空格、标点或表情。" });
  }

  const seenAspects = new Set<ExperienceAspectId>();
  const sentiments: Sentiment[] = [];
  for (const selection of input.tags) {
    if (seenAspects.has(selection.aspect)) {
      issues.push({ field: "tags", code: "DUPLICATE_ASPECT", message: "同一个体验维度只能选择一个感受。" });
      continue;
    }
    seenAspects.add(selection.aspect);
    const resolved = resolveTag(selection.aspect, selection.optionId);
    if (!resolved) {
      issues.push({ field: "tags", code: "INVALID_TAG", message: "存在无效体验标签，请重新选择。" });
      continue;
    }
    sentiments.push(resolved.option.sentiment);
    facts.push({
      aspect: selection.aspect,
      label: `${resolved.aspect.label}：${resolved.option.label}`,
      sentiment: resolved.option.sentiment,
      source: "selected_tag",
    });
  }

  const activeDishIds = new Set(
    merchant.dishes.filter((dish) => dish.status === "active").map((dish) => dish.id),
  );
  for (const dishId of input.dishIds) {
    if (!activeDishIds.has(dishId)) {
      issues.push({ field: "dishIds", code: "INVALID_DISH", message: "存在不属于当前门店的菜品，请重新选择。" });
      continue;
    }
    const dish = merchant.dishes.find((candidate) => candidate.id === dishId);
    if (dish) {
      facts.push({ aspect: "dish", label: `本次吃过：${dish.name}`, source: "selected_dish" });
    }
  }

  if (input.customDish) {
    if (!isMeaningfulText(input.customDish)) {
      issues.push({ field: "customDish", code: "CUSTOM_DISH_NOT_MEANINGFUL", message: "其他菜品不能只有空格、标点或表情。" });
    } else {
      facts.push({ aspect: "dish", label: `本次吃过：${input.customDish}`, source: "selected_dish" });
      for (const sensitive of SENSITIVE_PATTERNS) {
        if (sensitive.pattern.test(input.customDish)) {
          warnings.push({ code: sensitive.code, message: sensitive.message });
        }
      }
    }
  }

  if (meaningfulText) {
    const textSentiment = detectTextSentiment(input.text);
    if (textSentiment) sentiments.push(textSentiment);
    facts.push({
      aspect: "free_text",
      label: input.text,
      sentiment: textSentiment ?? undefined,
      source: "user_text",
    });
    for (const sensitive of SENSITIVE_PATTERNS) {
      if (sensitive.pattern.test(input.text)) {
        warnings.push({ code: sensitive.code, message: sensitive.message });
      }
    }
  }

  const positiveCount = sentiments.filter((sentiment) => sentiment === "positive").length;
  const negativeCount = sentiments.filter((sentiment) => sentiment === "negative").length;
  if (input.rating >= 4 && negativeCount > 0 && positiveCount === 0) {
    issues.push({ field: "rating", code: "RATING_SENTIMENT_CONFLICT", message: "星级和文字或标签感受似乎不一致，请确认后再继续。" });
  }
  if (input.rating <= 2 && positiveCount > 0 && negativeCount === 0) {
    issues.push({ field: "rating", code: "RATING_SENTIMENT_CONFLICT", message: "星级和文字或标签感受似乎不一致，请确认后再继续。" });
  }

  return { valid: issues.length === 0, issues, warnings, facts };
}
