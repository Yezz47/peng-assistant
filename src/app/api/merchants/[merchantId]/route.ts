import { NextResponse } from "next/server";

import { merchantRepository } from "@/lib/db/merchantRepository";

interface RouteContext {
  params: Promise<{ merchantId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { merchantId } = await params;
  if (!/^[a-z0-9_-]{3,32}$/.test(merchantId)) {
    return NextResponse.json({ code: "M001", message: "商家入口格式不正确。" }, { status: 400 });
  }

  const merchant = await merchantRepository.findById(merchantId);
  if (!merchant) {
    return NextResponse.json({ code: "M002", message: "未找到该门店。" }, { status: 404 });
  }
  if (merchant.status !== "active") {
    return NextResponse.json({ code: "M003", message: "该门店暂未开放此服务。" }, { status: 410 });
  }

  return NextResponse.json({ merchant });
}
