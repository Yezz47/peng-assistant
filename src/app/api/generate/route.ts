import { NextResponse } from "next/server";

import { generateReviewDraft } from "@/lib/ai/reviewGenerator";
import { recordFunnelEvent, saveGenerationSample } from "@/lib/db/feedbackRepository";
import { merchantRepository } from "@/lib/db/merchantRepository";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  normalizeValidatedFeedbackInput,
  validateFeedbackInput,
} from "@/lib/validation/feedback";
import { checkGeneratedDraft } from "@/lib/validation/generatedDraft";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({
      valid: false,
      issues: [{ field: "input", code: "PAYLOAD_TOO_LARGE", message: "提交内容过长，请精简后重试。" }],
      warnings: [],
      facts: [],
    }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      valid: false,
      issues: [{ field: "input", code: "INVALID_JSON", message: "提交内容格式不正确。" }],
      warnings: [],
      facts: [],
    }, { status: 400 });
  }

  const merchantId = typeof body === "object" && body !== null && "merchantId" in body
    ? String(body.merchantId)
    : "";
  const merchant = await merchantRepository.findById(merchantId);
  const result = validateFeedbackInput(body, merchant);

  if (!result.valid) {
    return NextResponse.json({ ...result, message: "请检查标记内容后再继续。" }, { status: 422 });
  }
  if (!merchant) {
    return NextResponse.json({ ...result, message: "未找到当前商家。" }, { status: 404 });
  }

  const input = normalizeValidatedFeedbackInput(body);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`${forwardedFor}:${input.sessionId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json({
      valid: false,
      issues: [{ field: "input", code: "RATE_LIMITED", message: "生成次数过于频繁，请稍后再试。" }],
      warnings: result.warnings,
      facts: result.facts,
      message: "生成次数过于频繁，请稍后再试。",
    }, {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const startedAt = Date.now();
  let candidate = await generateReviewDraft({ merchant, input, facts: result.facts });
  let quality = checkGeneratedDraft({
    draft: candidate.draft,
    merchant,
    input,
    allowedFactLabels: result.facts.map((fact) => fact.label),
    claimedFactLabels: candidate.usedFactLabels,
    fallbackUsed: Boolean(candidate.providerWarning),
  });

  if (!quality.passed && candidate.provider === "openai-compatible") {
    candidate = await generateReviewDraft({ merchant, input, facts: result.facts, forceLocal: true });
    quality = checkGeneratedDraft({
      draft: candidate.draft,
      merchant,
      input,
      allowedFactLabels: result.facts.map((fact) => fact.label),
      claimedFactLabels: candidate.usedFactLabels,
      fallbackUsed: true,
    });
  }

  if (!quality.passed) {
    await recordFunnelEvent({
      sessionId: input.sessionId,
      merchantId: input.merchantId,
      entryType: input.entryType,
      eventName: "generation_failed",
      eventResult: "quality_rejected",
      durationMs: Date.now() - startedAt,
      errorCode: "DRAFT_QUALITY_REJECTED",
    });
    return NextResponse.json({
      valid: false,
      issues: [{ field: "input", code: "DRAFT_QUALITY_REJECTED", message: "草稿未通过真实性检查，请稍后重试。" }],
      warnings: result.warnings,
      facts: result.facts,
      message: "草稿未通过真实性检查，请稍后重试。",
    }, { status: 503 });
  }

  const warnings = candidate.providerWarning
    ? [...result.warnings, { code: "AI_PROVIDER_FALLBACK", message: candidate.providerWarning }]
    : result.warnings;
  const retentionState = await saveGenerationSample({
    input,
    draft: candidate.draft,
    provider: candidate.provider,
    model: candidate.model,
    quality,
  });
  await recordFunnelEvent({
    sessionId: input.sessionId,
    merchantId: input.merchantId,
    entryType: input.entryType,
    eventName: input.variant > 0 ? "draft_regenerated" : "generation_completed",
    eventResult: candidate.provider,
    durationMs: Date.now() - startedAt,
    metadata: { style: input.style, variant: input.variant },
  });

  return NextResponse.json({
    ...result,
    warnings,
    stage: "draft_generated",
    message: "评价草稿已生成，请确认内容真实后再复制。",
    draft: candidate.draft,
    provider: candidate.provider,
    model: candidate.model,
    quality,
    retentionState,
  });
}
