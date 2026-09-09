"use client";

import { useEffect, useMemo, useState } from "react";

import { DishSelector } from "@/components/DishSelector";
import { ExperienceTags } from "@/components/ExperienceTags";
import { MerchantHeader } from "@/components/MerchantHeader";
import { RatingSelector } from "@/components/RatingSelector";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import type {
  DraftStyle,
  EntryType,
  ExperienceAspectId,
  FeedbackValidationResult,
  FunnelEventName,
  GenerationSuccessResponse,
  Merchant,
  ValidationIssue,
} from "@/types/domain";

interface FeedbackFlowProps {
  merchant: Merchant;
  entryType: EntryType;
}

type FieldErrors = Partial<Record<ValidationIssue["field"], string>>;
type GenerateResponse = FeedbackValidationResult
  & Partial<GenerationSuccessResponse>
  & { message?: string };

const STYLE_OPTIONS: Array<{ id: DraftStyle; label: string; help: string }> = [
  { id: "natural", label: "自然", help: "像日常表达" },
  { id: "concise", label: "简洁", help: "只保留重点" },
  { id: "detailed", label: "详细", help: "包含更多细节" },
];

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "00000000-0000-4000-8000-000000000000";
}

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const helper = document.createElement("textarea");
  helper.value = value;
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

export function FeedbackFlow({ merchant, entryType }: FeedbackFlowProps) {
  const [merchantConfirmed, setMerchantConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<Partial<Record<ExperienceAspectId, string>>>({});
  const [dishIds, setDishIds] = useState<string[]>([]);
  const [customDish, setCustomDish] = useState("");
  const [text, setText] = useState("");
  const [style, setStyle] = useState<DraftStyle>("natural");
  const [aiProcessingConsent, setAiProcessingConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<GenerationSuccessResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    const nextSessionId = createSessionId();
    setSessionId(nextSessionId);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: nextSessionId,
        merchantId: merchant.id,
        entryType,
        eventName: "merchant_opened",
      }),
      keepalive: true,
    });
  }, [entryType, merchant.id]);

  const selectedTags = useMemo(
    () => Object.entries(tags).map(([aspect, optionId]) => ({
      aspect: aspect as ExperienceAspectId,
      optionId,
    })),
    [tags],
  );

  function trackEvent(
    eventName: FunnelEventName,
    options: { eventResult?: string; errorCode?: string; metadata?: Record<string, string | number | boolean> } = {},
  ) {
    if (!sessionId) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, merchantId: merchant.id, entryType, eventName, ...options }),
      keepalive: true,
    });
  }

  function resetGeneratedResult() {
    setResult(null);
    setDraft("");
    setCopied(false);
    setVariant(0);
  }

  function updateTag(aspect: ExperienceAspectId, optionId: string) {
    setTags((current) => ({
      ...current,
      [aspect]: current[aspect] === optionId ? undefined : optionId,
    }));
    setErrors((current) => ({ ...current, tags: undefined, input: undefined }));
    resetGeneratedResult();
  }

  function updateDish(dishId: string) {
    setDishIds((current) => {
      if (current.includes(dishId)) return current.filter((id) => id !== dishId);
      if (current.length >= 3) {
        setErrors((existing) => ({ ...existing, dishIds: "最多选择3道本次吃过的菜品。" }));
        return current;
      }
      setErrors((existing) => ({ ...existing, dishIds: undefined }));
      return [...current, dishId];
    });
    resetGeneratedResult();
  }

  function mapIssues(issues: ValidationIssue[]): FieldErrors {
    return issues.reduce<FieldErrors>((accumulator, issue) => {
      accumulator[issue.field] ??= issue.message;
      return accumulator;
    }, {});
  }

  async function requestGeneration(nextVariant: number) {
    setSubmitting(true);
    setRequestError("");
    setErrors({});
    setCopied(false);
    trackEvent("generation_started", { metadata: { style, variant: nextVariant } });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          rating,
          tags: selectedTags,
          dishIds,
          customDish,
          text,
          style,
          variant: nextVariant,
          aiProcessingConsent,
          researchConsent,
          entryType,
          sessionId,
        }),
      });
      const payload = await response.json() as GenerateResponse;
      if (!response.ok || !payload.valid || !payload.draft || payload.stage !== "draft_generated") {
        setResult(null);
        setErrors(mapIssues(payload.issues ?? []));
        setRequestError(payload.message ?? "请检查标记内容后再继续。");
        trackEvent("generation_failed", {
          eventResult: String(response.status),
          errorCode: payload.issues?.[0]?.code ?? "UNKNOWN_GENERATION_ERROR",
        });
        return;
      }
      setResult(payload as GenerationSuccessResponse);
      setDraft(payload.draft);
      setVariant(nextVariant);
    } catch {
      setRequestError("网络连接不稳定，当前内容仍保留在页面中，请稍后重试。");
      trackEvent("generation_failed", { errorCode: "NETWORK_ERROR" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestGeneration(0);
  }

  async function finalizeDraft(reviewTarget?: string) {
    if (!researchConsent || !draft.trim()) return;
    void fetch("/api/feedback/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        finalDraft: draft.trim(),
        researchConsent: true,
        reviewTarget,
      }),
      keepalive: true,
    });
  }

  async function copyDraft() {
    try {
      await copyToClipboard(draft.trim());
      setCopied(true);
      trackEvent("draft_copied", { eventResult: result?.provider });
      await finalizeDraft();
    } catch {
      setRequestError("复制失败，请长按草稿文字手动复制。");
    }
  }

  function confirmMerchant() {
    setMerchantConfirmed(true);
    trackEvent("merchant_confirmed");
  }

  function appendTranscript(transcript: string) {
    setText((current) => `${current}${current.trim() ? "，" : ""}${transcript}`.slice(0, 200));
    setErrors((current) => ({ ...current, text: undefined, input: undefined }));
    resetGeneratedResult();
  }

  if (!merchantConfirmed) {
    return (
      <main className="shell merchant-confirm-shell">
        <section className="surface confirm-card">
          <MerchantHeader merchant={merchant} />
          <div className="confirmation-copy">
            <h2>请确认当前消费门店</h2>
            <p>确认后再记录真实体验，避免把反馈写到错误门店。</p>
          </div>
          <div className="portfolio-notice compact-notice">
            <strong>生成说明</strong>
            <span>系统会根据你的真实体验整理草稿，内容仍需由你确认和编辑。</span>
          </div>
          <button className="button button-primary" onClick={confirmMerchant} type="button">
            这是我消费的门店
          </button>
          <details className="wrong-merchant">
            <summary>门店信息不符</summary>
            <p>请关闭页面并告知店员检查NFC或二维码。本版本不允许手动切换门店。</p>
          </details>
          <p className="portfolio-disclaimer">非商家或评价平台官方产品，不自动填写或提交评价。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell feedback-shell">
      <section className="surface feedback-card">
        <MerchantHeader merchant={merchant} />
        <button className="text-button" onClick={() => setMerchantConfirmed(false)} type="button">重新确认门店</button>

        {result ? (
          <section className="result-panel" aria-live="polite">
            <div className="result-heading">
              <span className="success-mark" aria-hidden="true">✓</span>
              <span className="eyebrow">评价草稿已生成</span>
              <h2>请确认每句话都符合真实体验</h2>
              <p>你可以直接修改。产品只负责表达，不会自动提交到任何评价平台。</p>
            </div>

            <label className="draft-label" htmlFor="generated-draft">可编辑评价草稿</label>
            <textarea
              className="draft-editor"
              id="generated-draft"
              maxLength={300}
              onChange={(event) => { setDraft(event.target.value); setCopied(false); }}
              rows={7}
              value={draft}
            />
            <div className="field-footer">
              <span className="generation-method">
                {result.provider === "local-demo" ? "本地演示生成" : `AI生成 · ${result.model}`}
              </span>
              <span className="character-count">{draft.length}/300</span>
            </div>

            {result.warnings.length > 0 && (
              <div className="warning-box">
                {result.warnings.map((warning) => <p key={warning.code}>{warning.message}</p>)}
              </div>
            )}
            {result.retentionState === "unavailable" && researchConsent && (
              <p className="retention-note">草稿已正常生成；当前未连接云端，研究样本未保存。</p>
            )}
            {requestError && <p className="form-error" role="alert">{requestError}</p>}

            <div className="result-actions">
              <button className="button button-primary" disabled={!draft.trim()} onClick={copyDraft} type="button">
                {copied ? "已复制评价" : "复制评价"}
              </button>
              <button
                className="button button-secondary"
                disabled={submitting}
                onClick={() => requestGeneration((variant + 1) % 6)}
                type="button"
              >
                {submitting ? "正在重新生成…" : "换一种表达"}
              </button>
              <button className="text-button result-back" onClick={() => setResult(null)} type="button">返回修改体验</button>
            </div>

            <section className="review-target-panel">
              <h3>{copied ? "已复制，选择评价平台" : "复制后再前往评价平台"}</h3>
              <p>首轮不预先指定平台，由消费者自行选择；仍需在平台内确认门店并手动粘贴。</p>
              {merchant.reviewTargets.length > 0 ? (
                <div className="review-targets">
                  {merchant.reviewTargets.map((target) => (
                  <a
                    aria-disabled={!copied}
                    className="button review-target-link"
                    href={copied ? target.url : undefined}
                    key={target.id}
                    onClick={(event) => {
                      if (!copied) {
                        event.preventDefault();
                        return;
                      }
                      trackEvent("review_target_clicked", { eventResult: target.id });
                      void finalizeDraft(target.id);
                    }}
                    rel="noreferrer"
                    tabIndex={copied ? 0 : -1}
                    target="_blank"
                  >
                    {target.label}
                  </a>
                  ))}
                </div>
              ) : (
                <p className="review-target-empty">当前未配置平台商家页，请复制后手动返回美团或大众点评完成粘贴。</p>
              )}
            </section>
          </section>
        ) : (
          <form noValidate onSubmit={submitFeedback}>
            <div className="form-intro">
              <span className="step-number">1分钟内完成</span>
              <h2>记录这次真实体验</h2>
              <p>不预设好评，正面、一般和负面体验都可以表达。</p>
            </div>

            <RatingSelector
              error={errors.rating}
              onChange={(value) => { setRating(value); setErrors((current) => ({ ...current, rating: undefined })); resetGeneratedResult(); }}
              value={rating}
            />
            <ExperienceTags onChange={updateTag} selections={tags} />
            {errors.tags && <p className="field-error standalone-error">{errors.tags}</p>}

            <DishSelector
              customDish={customDish}
              dishes={merchant.dishes}
              error={errors.dishIds ?? errors.customDish}
              onChange={updateDish}
              onCustomDishChange={(value) => {
                setCustomDish(value);
                setErrors((current) => ({ ...current, customDish: undefined }));
                resetGeneratedResult();
              }}
              selected={dishIds}
            />

            <div className="field-group">
              <label htmlFor="experience-text">补充一句真实感受 <span className="optional">选填</span></label>
              <p className="field-help">可以输入文字；支持的浏览器也可以直接说一句。</p>
              <textarea
                aria-describedby={errors.text ? "text-error" : "text-count"}
                id="experience-text"
                maxLength={200}
                onChange={(event) => {
                  setText(event.target.value);
                  setErrors((current) => ({ ...current, text: undefined, input: undefined }));
                  resetGeneratedResult();
                }}
                placeholder="例如：牛肉比较嫩，不过上菜有点慢。"
                rows={4}
                value={text}
              />
              <div className="field-footer">
                {errors.text ? <p className="field-error" id="text-error">{errors.text}</p> : <span />}
                <span className="character-count" id="text-count">{text.length}/200</span>
              </div>
              <VoiceInputButton onTranscript={appendTranscript} />
            </div>

            <fieldset className="field-group style-field">
              <legend>希望草稿怎么表达</legend>
              <div className="style-options">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    aria-pressed={style === option.id}
                    className={`style-option${style === option.id ? " selected" : ""}`}
                    key={option.id}
                    onClick={() => { setStyle(option.id); resetGeneratedResult(); }}
                    type="button"
                  >
                    <strong>{option.label}</strong>
                    <small>{option.help}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            {errors.input && <p className="form-error">{errors.input}</p>}

            <section className="consent-panel">
              <label className="check-row">
                <input
                  checked={aiProcessingConsent}
                  onChange={(event) => {
                    setAiProcessingConsent(event.target.checked);
                    setErrors((current) => ({ ...current, consent: undefined }));
                  }}
                  type="checkbox"
                />
                <span><strong>AI处理说明（必选）</strong>我的输入将用于生成可编辑草稿；产品不读取美团或大众点评账号。</span>
              </label>
              {errors.consent && <p className="field-error">{errors.consent}</p>}
              <label className="check-row check-row-optional">
                <input checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} type="checkbox" />
                <span><strong>研究留存（选填）</strong>同意将脱敏后的原文、生成稿和最终稿保存90天，用于改进质量。</span>
              </label>
            </section>

            {requestError && <p className="form-error" role="alert">{requestError}</p>}

            <button className="button button-primary button-submit" disabled={submitting || !sessionId} type="submit">
              {submitting ? "正在生成…" : "生成评价草稿"}
            </button>
            <p className="boundary-note">只生成可编辑草稿，不会自动填写或提交任何平台评价。</p>
          </form>
        )}
      </section>
    </main>
  );
}
