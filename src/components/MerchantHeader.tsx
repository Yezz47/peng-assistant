import type { Merchant } from "@/types/domain";

export function MerchantHeader({ merchant }: { merchant: Merchant }) {
  return (
    <header className="merchant-header">
      <span className="merchant-avatar merchant-avatar-large" style={{ backgroundColor: merchant.themeColor }} aria-hidden="true">
        {merchant.name.slice(0, 1)}
      </span>
      <div className="merchant-copy">
        <span className="eyebrow">当前门店</span>
        <h1>{merchant.name}{merchant.branchName ? ` · ${merchant.branchName}` : ""}</h1>
        <p>{merchant.category} · {merchant.address}</p>
      </div>
    </header>
  );
}
