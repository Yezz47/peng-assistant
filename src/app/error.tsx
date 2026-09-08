"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell state-shell">
      <section className="state-card" role="alert">
        <span className="state-icon" aria-hidden="true">!</span>
        <span className="eyebrow">加载失败</span>
        <h1>页面暂时没有准备好</h1>
        <p>你的输入尚未提交，可以检查网络后重新加载。</p>
        <button className="button button-primary" onClick={reset} type="button">重新加载</button>
      </section>
    </main>
  );
}
