# 碰一碰评价表达助手

面向餐饮堂食场景的配置化 H5 工具。消费者通过商家专属二维码或 NFC 入口进入页面，记录真实体验，获得可编辑的评价草稿，再自行复制到评价平台。

> 本工具非商家、美团或大众点评官方产品，不代表任何合作或背书。产品不读取平台账号，不自动填写或提交评价，也不以奖励诱导正向评价。

- GitHub：[Yezz47/peng-assistant](https://github.com/Yezz47/peng-assistant)
- 公网地址：待 Vercel 部署完成后补充

## 主要功能

- 通过 `/m/[merchantId]?entry=qr|nfc` 加载对应商家档案。
- 确认当前门店，避免评价错店。
- 输入 1—5 星、分维度体验、预设或自定义菜品及一句话感受。
- 根据商家上下文和用户真实输入生成评价草稿。
- 支持编辑、复制，并在复制后跳转大众点评。
- AI 未配置、超时或调用失败时自动切换到本地表达模板。

## 使用流程

1. 扫描二维码或使用 NFC 进入商家专属页面。
2. 确认门店并填写本次真实体验。
3. 生成并检查评价草稿。
4. 按需编辑和复制。
5. 自主前往评价平台粘贴并提交。

## 生成与安全规则

- **商家上下文配置化：** 一套程序通过 `merchantId` 加载商家、品类、地址、招牌菜和平台入口。
- **事实白名单：** 只使用商家档案以及用户选择或输入的信息，不虚构菜品、服务和促销。
- **倾向一致性：** 星级和体验描述明显矛盾时提示用户确认。
- **隐私提示：** 对手机号、邮箱、证件号等风险内容进行提示和脱敏。
- **人在回路：** 草稿始终可编辑，产品不会自动填写或提交评价。
- **故障降级：** AI 未配置、超时或返回异常时，本地模板仍可完成主要流程。

## AI API 接入

服务端调用 OpenAI-compatible `POST /chat/completions` 接口。三项变量必须同时配置才会启用 AI：

```env
AI_API_KEY=服务商生成的密钥
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
```

DeepSeek 示例配置对应的完整请求地址为：

```text
https://api.deepseek.com/chat/completions
```

项目会自动在 `AI_BASE_URL` 后拼接 `/chat/completions`，因此不要把该路径重复写入环境变量。密钥只能保存在本地 `.env.local` 或 Vercel Environment Variables 中，不能提交到 GitHub，也不能使用 `NEXT_PUBLIC_` 前缀。

Vercel 配置步骤：

1. 打开项目的 **Settings → Environment Variables**。
2. 添加 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。
3. 勾选 Production；需要预览分支使用时同时勾选 Preview。
4. 保存后重新部署，再生成一次草稿确认页面显示真实模型名称。

未配置上述变量时，应用默认使用 `truthful-template-v1` 本地生成器。

## 技术结构

- Next.js 15、React 19、TypeScript、Zod
- 服务端生成与校验 API
- 本地商家种子与可选 Supabase 仓储适配
- Vitest、ESLint、TypeScript 检查
- GitHub + Vercel 部署

## 本地运行

```bash
pnpm install
pnpm dev
```

打开：

- 首页：`http://localhost:3000`
- 江南禧樽：`http://localhost:3000/m/jnxz_huhehaote_001?entry=qr`
- 重庆小面：`http://localhost:3000/m/cqxm_xingguang_001?entry=qr`

如需本地启用 AI，将 `.env.example` 复制为 `.env.local`，填写三项 AI 变量后重新启动开发服务。

## 接口

- `GET /api/merchants/[merchantId]`：读取商家档案。
- `POST /api/reviews/generate`：校验输入并生成评价草稿。
- `POST /api/events`：可选匿名事件记录；未配置数据库时不影响主要流程。
- `POST /api/research-consents`：可选研究授权记录；未配置数据库时不影响主要流程。

## 验证

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

自动测试覆盖输入校验、本地生成、隐私脱敏、事实约束、诱导评价检测与星级倾向一致性。

## 界面预览

| 江南禧樽商家确认页 | 重庆小面商家确认页 |
| --- | --- |
| ![江南禧樽移动尺寸预览](./artifacts/screenshots/mobile-390x844.png) | ![重庆小面移动尺寸预览](./artifacts/screenshots/mobile-412x915.png) |

真机触控、剪贴板权限和外部 App 跳转需在公网部署后继续验证。
