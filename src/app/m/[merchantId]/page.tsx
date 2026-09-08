import { notFound } from "next/navigation";

import { FeedbackFlow } from "@/components/FeedbackFlow";
import { MerchantUnavailable } from "@/components/MerchantUnavailable";
import { merchantRepository } from "@/lib/db/merchantRepository";
import type { EntryType } from "@/types/domain";

interface MerchantPageProps {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{ entry?: string }>;
}

function normalizeEntryType(value?: string): EntryType {
  if (value === "nfc" || value === "qr") return value;
  return "direct";
}

export default async function MerchantPage({ params, searchParams }: MerchantPageProps) {
  const { merchantId } = await params;
  const query = await searchParams;
  if (!/^[a-z0-9_-]{3,32}$/.test(merchantId)) notFound();

  const merchant = await merchantRepository.findById(merchantId);
  if (!merchant) notFound();
  if (merchant.status !== "active") return <MerchantUnavailable merchant={merchant} />;

  return <FeedbackFlow merchant={merchant} entryType={normalizeEntryType(query.entry)} />;
}
