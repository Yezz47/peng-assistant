# 08｜GitHub与Vercel操作清单

## A. 公开前门禁

- [x] 确认真实商家允许公开展示名称、地址、菜品和大众点评链接；否则先匿名化，并避免让真实数据留在公开Git历史。
- [ ] 确认仓库中没有 `.env.local`、API Key、个人联系方式、`node_modules`、`.next`、临时文件和无关求职材料。
- [ ] 执行 `pnpm test`、`pnpm lint`、`pnpm typecheck`、`pnpm build`。
- [ ] 确认README中的“已完成/待完成”与实际状态一致。

## B. GitHub

1. 在GitHub新建公开仓库，建议名称：`peng-review-assistant`；不要勾选自动生成README。
2. 在本项目根目录初始化Git，检查 `git status` 只包含需要公开的源码和文档。
3. 首次提交建议说明：`feat: publish interactive review assistant`。
4. 绑定GitHub远端并推送主分支。
5. 打开仓库网页，复查文件列表和README，不以本地检查替代公开页面检查。
6. 将仓库URL回填到 `01_项目步骤记录.md`、`06_项目案例一页纸.md` 和 `career-claim-ledger.json`。

## C. Vercel

1. 使用GitHub登录Vercel，选择 Add New → Project。
2. 导入 `peng-review-assistant`，框架保持自动识别的Next.js。
3. 首次部署不配置AI和Supabase变量，使用本地模板确保演示稳定。
4. 部署完成后依次检查首页、两个商家入口和生成接口。
5. 在手机浏览器验证输入、生成、编辑、复制和大众点评跳转。
6. 将Vercel URL回填到README和项目步骤记录。

## D. 公网验收

- [ ] 本地电脑关闭开发服务后，Vercel地址仍可访问。
- [ ] `/m/cqxm_xingguang_001?entry=qr` 与 `/m/jnxz_huhehaote_001?entry=qr` 不串商家。
- [ ] 消极、一般、积极输入得到一致倾向草稿。
- [ ] 自定义菜品能够进入草稿。
- [ ] 复制前平台按钮不可用，复制后可以打开正确链接。
- [ ] 页面明确显示非官方声明。

## E. 后续真实AI接入

使用DeepSeek时，在Vercel Project Settings → Environment Variables配置：

- `AI_API_KEY`：在DeepSeek控制台创建的密钥
- `AI_BASE_URL`：`https://api.deepseek.com`
- `AI_MODEL`：`deepseek-v4-flash`

应用会在基础地址后自动拼接 `/chat/completions`。配置后重新部署，并分别验证正常调用、超时、错误响应和本地降级。不得把密钥填写到代码、README、聊天消息或以 `NEXT_PUBLIC_` 开头的变量中。
