import Link from "next/link";

import type { Merchant } from "@/types/domain";

export function MerchantUnavailable({ merchant }: { merchant: Merchant }) {
  return (
    <main className="shell state-shell">
      <section className="state-card" role="status">
        <span className="state-icon" style={{ backgroundColor: merchant.themeColor }} aria-hidden="true">
          {merchant.name.slice(0, 1)}
        </span>
        <span className="eyebrow">{merchant.name}</span>
        <h1>该门店暂未开放此服务</h1>
        <p>请稍后再试，或向店员了解最新情况。</p>
        <Link className="button button-secondary" href="/">返回演示首页</Link>
      </section>
    </main>
  );
}
