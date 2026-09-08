import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizeResearchSample } from "@/lib/db/feedbackRepository";

const finalizeSchema = z.object({
  sessionId: z.string().uuid(),
  finalDraft: z.string().min(1).max(300),
  researchConsent: z.literal(true),
  reviewTarget: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ stored: false }, { status: 400 });
  }
  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ stored: false }, { status: 422 });
  const stored = await finalizeResearchSample(parsed.data);
  return NextResponse.json({ stored }, { status: stored ? 200 : 202 });
}
