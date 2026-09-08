import { MERCHANT_SEEDS } from "@/data/merchants";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/db/supabaseRest";
import type { Dish, Merchant, ReviewTarget } from "@/types/domain";

export interface MerchantRepository {
  findById(merchantId: string): Promise<Merchant | null>;
  listActive(): Promise<Merchant[]>;
}

class SeedMerchantRepository implements MerchantRepository {
  async findById(merchantId: string): Promise<Merchant | null> {
    return MERCHANT_SEEDS.find((merchant) => merchant.id === merchantId) ?? null;
  }

  async listActive(): Promise<Merchant[]> {
    return MERCHANT_SEEDS.filter((merchant) => merchant.status === "active");
  }
}

interface DishRow {
  dish_id: string;
  merchant_id: string;
  name: string;
  is_signature: boolean;
  status: "active" | "inactive";
  sort_order: number;
}

interface MerchantRow {
  merchant_id: string;
  name: string;
  branch_name: string | null;
  category: string;
  address: string;
  logo_url: string | null;
  theme_color: string;
  status: "active" | "inactive";
  source: string;
  updated_at: string;
  review_targets: unknown;
  dishes?: DishRow[];
}

function safeReviewTargets(value: unknown): ReviewTarget[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const row = candidate as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.label !== "string" || typeof row.url !== "string") return [];
    try {
      const url = new URL(row.url);
      if (url.protocol !== "https:") return [];
      return [{ id: row.id, label: row.label, url: url.toString() }];
    } catch {
      return [];
    }
  });
}

function mapDish(row: DishRow): Dish {
  return {
    id: row.dish_id,
    merchantId: row.merchant_id,
    name: row.name,
    isSignature: row.is_signature,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

function mapMerchant(row: MerchantRow): Merchant {
  return {
    id: row.merchant_id,
    name: row.name,
    branchName: row.branch_name ?? undefined,
    category: row.category,
    address: row.address,
    logoUrl: row.logo_url ?? undefined,
    themeColor: row.theme_color,
    status: row.status,
    source: row.source,
    updatedAt: row.updated_at,
    reviewTargets: safeReviewTargets(row.review_targets),
    dishes: (row.dishes ?? []).map(mapDish).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

const MERCHANT_SELECT = [
  "merchant_id",
  "name",
  "branch_name",
  "category",
  "address",
  "logo_url",
  "theme_color",
  "status",
  "source",
  "updated_at",
  "review_targets",
  "dishes(dish_id,merchant_id,name,is_signature,status,sort_order)",
].join(",");

class SupabaseMerchantRepository implements MerchantRepository {
  async findById(merchantId: string): Promise<Merchant | null> {
    const rows = await supabaseRequest<MerchantRow[]>(
      `merchants?merchant_id=eq.${encodeURIComponent(merchantId)}&select=${encodeURIComponent(MERCHANT_SELECT)}&limit=1`,
    );
    return rows[0] ? mapMerchant(rows[0]) : null;
  }

  async listActive(): Promise<Merchant[]> {
    const rows = await supabaseRequest<MerchantRow[]>(
      `merchants?status=eq.active&select=${encodeURIComponent(MERCHANT_SELECT)}&order=name.asc`,
    );
    return rows.map(mapMerchant);
  }
}

class FallbackMerchantRepository implements MerchantRepository {
  private readonly seed = new SeedMerchantRepository();
  private readonly cloud = new SupabaseMerchantRepository();

  async findById(merchantId: string): Promise<Merchant | null> {
    if (!isSupabaseConfigured()) return this.seed.findById(merchantId);
    try {
      return await this.cloud.findById(merchantId);
    } catch {
      return this.seed.findById(merchantId);
    }
  }

  async listActive(): Promise<Merchant[]> {
    if (!isSupabaseConfigured()) return this.seed.listActive();
    try {
      return await this.cloud.listActive();
    } catch {
      return this.seed.listActive();
    }
  }
}

export const merchantRepository: MerchantRepository = new FallbackMerchantRepository();
