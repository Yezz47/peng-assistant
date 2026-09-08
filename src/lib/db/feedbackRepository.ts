import { isSupabaseConfigured, supabaseRequest } from "@/lib/db/supabaseRest";
import { redactSensitiveText } from "@/lib/validation/feedback";
import type {
  DraftQualityResult,
  FeedbackInput,
  FunnelEventName,
  GenerationProvider,
} from "@/types/domain";

interface FunnelEventInput {
  sessionId: string;
  merchantId: string;
  entryType: FeedbackInput["entryType"];
  eventName: FunnelEventName;
  eventResult?: string;
  durationMs?: number;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface SaveGenerationInput {
  input: FeedbackInput;
  draft: string;
  provider: GenerationProvider;
  model: string;
  quality: DraftQualityResult;
}

async function ensureSession(input: Pick<FunnelEventInput, "sessionId" | "merchantId" | "entryType">, lastStep: string) {
  await supabaseRequest("sessions?on_conflict=session_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({
      session_id: input.sessionId,
      merchant_id: input.merchantId,
      entry_type: input.entryType,
      last_step: lastStep,
    }),
  });
}

export async function recordFunnelEvent(input: FunnelEventInput): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    await ensureSession(input, input.eventName);
    await supabaseRequest("events", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        session_id: input.sessionId,
        event_name: input.eventName,
        event_result: input.eventResult ?? null,
        duration_ms: input.durationMs ?? null,
        error_code: input.errorCode ?? null,
        metadata: input.metadata ?? {},
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function saveGenerationSample({
  input,
  draft,
  provider,
  model,
  quality,
}: SaveGenerationInput): Promise<"stored" | "not_requested" | "unavailable"> {
  if (!input.researchConsent) return "not_requested";
  if (!isSupabaseConfigured()) return "unavailable";
  try {
    await ensureSession(input, "generation_completed");
    await supabaseRequest("feedback_samples?on_conflict=session_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        session_id: input.sessionId,
        merchant_id: input.merchantId,
        rating: input.rating,
        selected_tags: input.tags,
        selected_dish_ids: input.dishIds,
        custom_dish_text_redacted: redactSensitiveText(input.customDish),
        input_text_redacted: redactSensitiveText(input.text),
        generated_draft_redacted: redactSensitiveText(draft),
        model_version: model,
        generation_provider: provider,
        generation_style: input.style,
        validation_result: quality,
      }),
    });
    return "stored";
  } catch {
    return "unavailable";
  }
}

export async function finalizeResearchSample(input: {
  sessionId: string;
  finalDraft: string;
  reviewTarget?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    await supabaseRequest(`feedback_samples?session_id=eq.${encodeURIComponent(input.sessionId)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        final_draft_redacted: redactSensitiveText(input.finalDraft),
        review_target: input.reviewTarget ?? null,
      }),
    });
    return true;
  } catch {
    return false;
  }
}
