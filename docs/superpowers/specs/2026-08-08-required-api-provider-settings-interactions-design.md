# 强制模型叙事、多供应商、玩法规则台与核心交互修复设计

## 目标

本轮将“可选本地叙事 + DeepSeek/自定义接口 + 静态设置图 + 两个不可达交互”收束为可实际游玩的纯前端酒馆原型：NPC 对话只允许由玩家配置的模型 API 生成；参考界面中的模型供应商全部进入可用注册表；游戏设置真正影响经验、好感、掉落、金币、成长、战斗和精力规则；地图建筑点击稳定显示行程并可抵达；空农田可直接选择背包种子播种。

## 范围与安全边界

- 保持纯前端架构，不创建应用服务器、代理、云函数或数据库后端。
- API 密钥由玩家在浏览器中填写并直接发送给所选供应商；默认仅保存到当前 `sessionStorage`，只有玩家主动开启“记住密钥”时才写入本机 IndexedDB。
- 源码、测试、请求预览、控制台日志、提交记录和构建产物都不得包含真实密钥。
- API 缺失、配置无效或请求失败时必须阻止 NPC 生成并显示可执行的中文错误；不得静默回退到本地伪叙事。
- 旧会话中的 `apiUsed: local` 仅作为历史兼容数据保留；新会话首句标记为角色卡内容，新生成楼层一律标记 `remote`。
- 继续使用应用内弹层、提示条和 Toast，不使用浏览器原生 `alert`、`confirm` 或 `prompt`。

## 强制在线叙事

`TavernSettings` 不再保存 `adapterMode`。迁移旧数据时无论旧值是 `local` 还是 `remote`，都规范化为只有一个在线模型配置。接口面板删除“本地叙事/模型 API”选择；状态区只有“未配置、待验证、可用、失败”四种连接语义。

`TavernContext.sendTurn` 始终执行以下流程：

1. 解析角色卡、当前预设、启用的世界书、最近会话和游戏变量。
2. 校验供应商、端点、模型与密钥；缺失时抛出可识别的 `TAVERN_API_KEY_MISSING` 或配置错误。
3. 创建远程适配器并生成六标签响应。
4. 将正文、选项、摘要、变量快照、命中世界书和 `apiUsed: remote` 写入当前会话。

本地剧情引擎从运行路径和 UI 文案中移除。已有角色卡首句仍可在打开会话时立即显示，因为它是玩家可编辑的角色卡内容，并非假装来自模型的生成结果。

对话页在未配置时保留输入框但禁用发送，显示“前往接口设置”的内联操作；已配置但未测试时允许玩家主动测试或保存，真正发送仍以实时请求结果为准。任何 401、403、429、网络/CORS、格式异常都在当前对话内显示，不消耗 NPC 互动的游戏结算。

## 供应商注册表

新增元数据驱动的 `provider-registry.ts`，每项声明显示名、协议族、官方基础地址、默认模型、文档地址、鉴权方式、是否支持模型目录、额外字段与端点构造方式。UI、校验、连接测试和请求适配都从同一注册表读取，避免下拉框与网络实现分叉。

协议族分为：

- `openai-chat`：OpenAI、DeepSeek、Chutes、Electron Hub、Fireworks AI、Groq、MistralAI、MiniMax、Moonshot AI、NanoGPT、OpenRouter、Perplexity、Pollinations、SiliconFlow、xAI、Z.AI 与自定义兼容接口。
- `azure-openai`：OpenAI 消息/响应形状，但使用 Azure v1 路径与 `api-key` 请求头。
- `anthropic-messages`：Claude `POST /v1/messages`、`x-api-key`、`anthropic-version`、独立 SSE 事件。
- `gemini`：Google AI Studio 原生 `contents/parts`，使用 `x-goog-api-key`。
- `vertex-gemini`：Google Vertex AI 原生 Gemini 请求，使用项目 ID、区域和 OAuth access token。
- `cohere-v2`：Cohere `/v2/chat` 与专用内容/流事件解析。
- `cloudflare-workers-ai`：Account ID + 模型构造 `/accounts/{id}/ai/run/{model}`，解析 `result.response`。

### 官方配置矩阵

| 显示名 | 官方基础地址/路径 | 协议与必要配置 |
|---|---|---|
| Azure OpenAI | `{endpoint}/openai/v1` | `api-key`；模型字段填写部署名 |
| Chutes | `https://llm.chutes.ai/v1` | OpenAI Chat；Bearer；可列模型 |
| Claude | `https://api.anthropic.com/v1/messages` | `x-api-key` + `anthropic-version: 2023-06-01` |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/{model}` | Bearer；需要 Account ID |
| Cohere | `https://api.cohere.ai/v2/chat` | Bearer；Cohere v2 |
| DeepSeek | `https://api.deepseek.com` | OpenAI Chat；Bearer |
| Electron Hub | `https://api.electronhub.ai/v1` | OpenAI Chat；Bearer |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | OpenAI Chat；Bearer |
| Groq | `https://api.groq.com/openai/v1` | OpenAI Chat；Bearer；可列模型 |
| Google AI Studio | `https://generativelanguage.googleapis.com/v1beta` | Gemini；`x-goog-api-key` |
| Google Vertex AI | `https://aiplatform.googleapis.com/v1` | Gemini；Bearer access token；项目 ID + 区域 |
| MistralAI | `https://api.mistral.ai/v1` | OpenAI Chat；Bearer；可列模型 |
| MiniMax | `https://api.minimax.io/v1` | OpenAI Chat；Bearer |
| Moonshot AI | `https://api.moonshot.ai/v1` | OpenAI Chat；Bearer；可列模型 |
| NanoGPT | `https://nano-gpt.com/api/v1` | OpenAI Chat；Bearer；可列模型 |
| OpenRouter | `https://openrouter.ai/api/v1` | OpenAI Chat；Bearer；附带应用标题请求头 |
| Perplexity | `https://api.perplexity.ai` | OpenAI Chat；Bearer；聊天路径不额外加 `/v1` |
| Pollinations | `https://gen.pollinations.ai/v1` | OpenAI Chat；Bearer；可列模型 |
| SiliconFlow | `https://api.siliconflow.cn/v1` | OpenAI Chat；Bearer；可列模型 |
| xAI (Grok) | `https://api.x.ai/v1` | OpenAI Chat；Bearer；可列模型 |
| Z.AI (GLM) | `https://api.z.ai/api/paas/v4` | OpenAI Chat；Bearer |
| 自定义（兼容 OpenAI） | 玩家填写 | OpenAI Chat；Bearer；路径模式可编辑 |

默认模型只在官方文档有稳定示例时预填；聚合平台优先通过模型目录读取，不硬编码易过期 ID。玩家始终可以手动修改模型名。

### 请求适配

公共网络层统一负责：密钥检查、AbortSignal、HTTP 错误映射、CORS/网络提示、流读取和最终 `done` 事件。各协议适配器只负责构造 URL/headers/body 以及从 JSON/SSE 中提取文本。

- OpenAI 族读取 `choices[0].delta.content` 或 `choices[0].message.content`。
- Claude 非流式读取 `content[type=text].text`；流式读取 `content_block_delta` 的 `text_delta`。
- Gemini/Vertex 把 system 文本放进 `systemInstruction`，其余角色映射到 `contents`，读取 `candidates[].content.parts[].text`。
- Cohere 读取 `message.content[].text`，流式读取 `content-delta` 文本。
- Cloudflare 发送标准 `messages` 给指定模型，读取 `result.response`；若模型返回 OpenAI 风格流则兼容处理。

连接测试优先读取官方模型目录；没有安全目录接口的供应商执行最小生成请求，并在按钮旁明确“可能产生极少量调用费用”。模型列表只作为辅助，不阻止手动输入。

## API 控制台体验

接口页继续沿用深苔绿、铜金与精细像素控制台风格，重组为六个区块：连接状态、供应商、地址与专属参数、密钥、模型、生成参数与操作。供应商按“官方模型、聚合网关、云平台、自定义”分组，并提供搜索过滤，避免 22 项长列表造成定位困难。

切换供应商时只替换该供应商的官方默认字段，保留温度、最大输出和记住密钥选项。地址字段可编辑，以兼容区域域名和企业代理；“恢复官方地址”按钮可单独重置。Azure 显示部署提示，Cloudflare 显示 Account ID，Vertex 显示 Project ID 与 Location。所有动态字段都有唯一 ID、就地说明和 `role=alert` 校验。

## 玩法规则设置

新增 `GameRuleSettings` 并作为 `GameState.rules` 子树：

```ts
interface GameRuleSettings {
  experienceMultiplier: number
  affinityMultiplier: number
  dropMultiplier: number
  moneyMultiplier: number
  cropGrowthMultiplier: number
  playerDamageMultiplier: number
  enemyDamageMultiplier: number
  recoveryMultiplier: number
  energyCostMode: 'free' | 'normal' | 'double'
}
```

默认倍率均为 `1`，精力消耗为 `normal`。允许倍率范围 `0.5–3`，步进 `0.25`；作物成长倍率越高，所需小时越少。精力使用离散模式，避免整数精力中 0.5 倍取整造成没有实际差异。

规则通过纯函数生效：

- `scaleReward`：经验、好感、掉落数量、金币收益与恢复量按倍率四舍五入且正奖励至少为 1。
- `scaleDamage`：玩家/敌人伤害按倍率四舍五入且至少为 1。
- `scaleGrowthHours`：基础生长小时除以成长倍率，至少为 1 小时。
- `getEnergyCost`：免费为 0、正常为基础值、双倍为基础值两倍。

应用边界覆盖聊天、送礼、任务报酬、收获、出售、训练、学习、挖矿、战斗胜利、钓鱼、治疗/药剂与所有已有精力消耗。购买花费不受金币收益倍率影响，避免经济设置同时改变收入和成本。

设置面板采用“规则控制台”而不是裸滑杆：顶部显示当前难度倾向和本地持久化状态；三组卡片分别管理成长经济、战斗生存、节奏体力；每个字段显示当前倍率、基础示例和实际结果；底部提供“应用更改”和应用内二次确认的“恢复标准规则”。设置仅以版本化键 `mistvale-game-rules-v1` 保存到 localStorage，不持久化整份游戏进度。

## 播种流程

新增 `PLANT_PLOT { plotId, seedId }` 动作。规则校验目标地块为空、种子属于商店种子且背包数量大于 0。成功后扣除一包种子，按 `seedId` 去掉 `-seed` 得到作物，设置 `plantedAt`、倍率换算后的 `remainingHours`、`ready=false`、`watered=false`、`fertilized=false`，并显示应用内成功通知。

空地详情显示“选择种子”卡组，直接列出玩家当前持有的种子、季节、基础天数和倍率后的成熟时间。不可用种子保留可读状态但按钮禁用；没有种子时显示前往杂货店的说明。新手发放的月铃萝卜与雾荚豆改为春季作物/种子，确保第 1 天可种。

所有播种按钮使用 `plot-plant-{plotId}-{seedId}` 唯一 ID。播种后详情原位切换到成长信息，玩家可继续浇水或关闭，不额外消耗精力。

## 地图点击修复

`pointerdown` 只记录候选拖动，不调用 `setPointerCapture`，也不进入拖动视觉态。`pointermove` 首次超过 6px 阈值时才捕获当前指针并设置 `isDragging=true`，随后更新共享世界层偏移。`pointerup/cancel` 仅在视口确实持有捕获时释放；只有实际移动过的手势才短暂抑制合成 click。

普通点击因此完整落到语义化建筑按钮，设置 `destination` 并显示地图容器内的行程预览。桌面与手机都保留现有地点列表作为键盘/触控后备入口；右下仅保留定位当前地点和重置视野两个辅助按钮。

## 可访问性、性能与反馈

- 所有新增输入、按钮和弹层都有唯一描述性 ID、可见焦点和 44px 触控目标。
- 范围输入同时提供数字读数和键盘可操作控件；错误靠近字段并使用 `role=alert`。
- 供应商面板由元数据渲染，不复制 22 份 JSX；专用适配器按协议拆分，减少重复与主包复杂度。
- 地图平移继续用 `requestAnimationFrame + translate3d`；设置更新仅触发局部 reducer 状态变化。
- 过渡保持 150–300ms，并在 `prefers-reduced-motion` 下关闭非必要动画。

## 官方资料

- Azure OpenAI: https://learn.microsoft.com/zh-cn/rest/api/microsoft-foundry/azureopenai/chat
- Claude Messages: https://platform.claude.com/docs/en/api/messages/create
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/get-started/rest-api/
- Cohere v2 Chat: https://docs.cohere.com/v2/reference/chat
- Google AI Studio: https://ai.google.dev/api/generate-content
- Google Vertex AI: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart
- Kimi/Moonshot: https://platform.kimi.ai/docs/api/overview
- NanoGPT: https://docs.nano-gpt.com/
- Pollinations: https://github.com/pollinations/pollinations/blob/main/APIDOCS.md
- SiliconFlow: https://docs.siliconflow.cn/cn/userguide/capabilities/text-generation
- xAI: https://api.x.ai/docs/
- Z.AI: https://docs.z.ai/api-reference/llm/chat-completion

## 验收标准

- UI、默认值、迁移和运行路径中不再存在可选择或可触发的本地叙事；缺少 API 时 NPC 消息不会生成，并能一键进入接口页。
- 参考图中的 21 个命名供应商全部可选，额外保留 OpenAI 与自定义兼容项；每项使用正确的地址、鉴权、额外字段和协议解析。
- OpenAI SSE/JSON、Claude SSE/JSON、Gemini、Vertex、Cohere、Cloudflare 与 HTTP 错误均有独立自动化测试。
- 设置面板可修改、应用、恢复并跨刷新恢复九项规则；每项都至少有一个 reducer 行为测试证明真实生效。
- 空农田能选择初始种子播种，背包扣减且成熟时间受规则影响；春季初始种子不会被季节阻止。
- 真实浏览器鼠标点击地图建筑能看到并点击“确认出发”，位置更新；轻点不捕获指针，拖动仍可用。
- 全量 Vitest、TypeScript/Vite 构建、静态安全扫描以及桌面/手机 Edge 验收全部通过。
