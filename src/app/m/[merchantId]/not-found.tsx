import Link from "next/link";

export default function MerchantNotFound() {
  return (
    <main className="shell state-shell">
      <section className="state-card" role="alert">
        <span className="state-icon" aria-hidden="true">?</span>
        <span className="eyebrow">入口无效</span>
        <h1>未找到该门店</h1>
        <p>请使用桌面上的二维码重新进入，或告知店员检查NFC入口。</p>
        <Link className="button button-secondary" href="/">返回演示首页</Link>
      </section>
    </main>
  );
}
