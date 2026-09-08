import Link from "next/link";

import { merchantRepository } from "@/lib/db/merchantRepository";

export default async function HomePage() {
  const merchants = await merchantRepository.listActive();

  return (
    <main className="shell landing-shell">
      <section className="landing-hero">
        <span className="eyebrow">AI产品经理作品集 · 可交互原型</span>
        <h1>碰一碰评价表达助手</h1>
        <p>从商家专属入口记录真实体验，生成可编辑评价草稿，再由消费者自行复制到目标平台。</p>
        <div className="portfolio-notice">
          <strong>演示模式</strong>
          <span>当前默认使用本地忠实表达模板；配置兼容AI接口后可自动切换为真实模型生成，并保留本地降级能力。</span>
        </div>
      </section>

      <section className="demo-panel" aria-labelledby="demo-title">
        <div className="section-heading">
          <div>
            <span className="step-number">演示入口</span>
            <h2 id="demo-title">选择一家测试门店</h2>
          </div>
        </div>
        <div className="merchant-list">
          {merchants.map((merchant) => (
            <Link className="merchant-link" href={`/m/${merchant.id}?entry=direct`} key={merchant.id}>
              <span className="merchant-avatar" style={{ backgroundColor: merchant.themeColor }}>
                {merchant.name.slice(0, 1)}
              </span>
              <span>
                <strong>{merchant.name}{merchant.branchName ? ` · ${merchant.branchName}` : ""}</strong>
                <small>{merchant.category} · {merchant.address}</small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="portfolio-disclaimer">个人作品集原型，非商家、美团或大众点评官方产品，不代表任何合作或背书。</p>
    </main>
  );
}
