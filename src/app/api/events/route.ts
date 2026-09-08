import { NextResponse } from "next/server";
import { z } from "zod";

import { recordFunnelEvent } from "@/lib/db/feedbackRepository";
import { merchantRepository } from "@/lib/db/merchantRepository";
import { checkRateLimit } from "@/lib/security/rateLimit";

const eventSchema = z.object({
  sessionId: z.string().uuid(),
  merchantId: z.string().regex(/^[a-z0-9_-]{3,32}$/),
  entryType: z.enum(["nfc", "qr", "direct"]),
  eventName: z.enum([
    "merchant_opened",
    "merchant_confirmed",
    "generation_started",
    "generation_completed",
    "generation_failed",
    "draft_regenerated",
    "draft_copied",
    "review_target_clicked",
  ]),
  eventResult: z.string().max(50).optional(),
  durationMs: z.number().int().min(0).max(600_000).optional(),
  errorCode: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.union([z.string().max(100), z.number(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ accepted: false }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ accepted: false }, { status: 422 });
  const rateLimit = checkRateLimit(`event:${parsed.data.sessionId}`, 30, 60_000);
  if (!rateLimit.allowed) return NextResponse.json({ accepted: false }, { status: 429 });
  const merchant = await merchantRepository.findById(parsed.data.merchantId);
  if (!merchant) return NextResponse.json({ accepted: false }, { status: 404 });
  const persisted = await recordFunnelEvent(parsed.data);
  return NextResponse.json({ accepted: true, persisted }, { status: 202 });
}
