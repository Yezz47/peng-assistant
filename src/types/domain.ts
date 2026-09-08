export type MerchantStatus = "active" | "inactive";
export type Sentiment = "positive" | "neutral" | "negative";
export type EntryType = "nfc" | "qr" | "direct";
export type DraftStyle = "natural" | "concise" | "detailed";

export interface ReviewTarget {
  id: "meituan" | "dianping" | string;
  label: string;
  url: string;
}

export interface Dish {
  id: string;
  merchantId: string;
  name: string;
  isSignature: boolean;
  status: "active" | "inactive";
  sortOrder: number;
}

export interface Merchant {
  id: string;
  name: string;
  branchName?: string;
  category: string;
  address: string;
  logoUrl?: string;
  themeColor: string;
  status: MerchantStatus;
  source: string;
  updatedAt: string;
  dishes: Dish[];
  reviewTargets: ReviewTarget[];
}

export type ExperienceAspectId =
  | "taste"
  | "serving_speed"
  | "service"
  | "environment";

export interface ExperienceTagOption {
  id: string;
  label: string;
  sentiment: Sentiment;
}

export interface ExperienceAspect {
  id: ExperienceAspectId;
  label: string;
  options: ExperienceTagOption[];
}

export interface ExperienceTagSelection {
  aspect: ExperienceAspectId;
  optionId: string;
}

export interface FeedbackInput {
  merchantId: string;
  rating: number;
  tags: ExperienceTagSelection[];
  dishIds: string[];
  customDish: string;
  text: string;
  aiProcessingConsent: boolean;
  researchConsent: boolean;
  entryType: EntryType;
  sessionId: string;
  style: DraftStyle;
  variant: number;
}

export interface NormalizedFact {
  aspect: ExperienceAspectId | "free_text" | "dish";
  label: string;
  sentiment?: Sentiment;
  source: "selected_tag" | "user_text" | "selected_dish";
}

export interface ValidationIssue {
  field: "merchantId" | "rating" | "tags" | "dishIds" | "customDish" | "text" | "consent" | "input";
  code: string;
  message: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export interface FeedbackValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  facts: NormalizedFact[];
}

export interface DraftQualityCheck {
  code: string;
  passed: boolean;
  message: string;
}

export interface DraftQualityResult {
  passed: boolean;
  fallbackUsed: boolean;
  checks: DraftQualityCheck[];
}

export type GenerationProvider = "openai-compatible" | "local-demo";

export interface GenerationSuccessResponse extends FeedbackValidationResult {
  valid: true;
  stage: "draft_generated";
  message: string;
  draft: string;
  provider: GenerationProvider;
  model: string;
  quality: DraftQualityResult;
  retentionState: "stored" | "not_requested" | "unavailable";
}

export type FunnelEventName =
  | "merchant_opened"
  | "merchant_confirmed"
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "draft_regenerated"
  | "draft_copied"
  | "review_target_clicked";
