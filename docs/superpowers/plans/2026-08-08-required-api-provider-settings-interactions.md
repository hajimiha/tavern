# 强制模型叙事、多供应商、玩法规则台与核心交互修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除本地叙事回退，按官方协议接入参考清单中的模型供应商，实现真实生效的玩法规则设置，并修复地图出行与农田播种入口。

**Architecture:** 模型层使用“供应商元数据注册表 + 协议适配器 + 公共网络错误层”；游戏层把规则作为 `GameState.rules`，由纯倍率函数在 reducer 边界应用；设置仅持久化规则子树。地图保留共享世界层拖动，只延迟指针捕获；播种通过新 reducer 动作驱动。

**Tech Stack:** React 18、TypeScript、Vite、Vitest、Testing Library、Dexie、原生 Fetch/ReadableStream、localStorage、Phosphor Icons、Edge/Playwright 兼容浏览器脚本。

## Global Constraints

- 纯前端，不创建后端、代理或云端凭据服务。
- 不提交真实密钥；默认只用 sessionStorage，明确选择后才保存到 IndexedDB。
- 不使用本地假叙事、浏览器原生 alert/confirm/prompt 或 emoji。
- 新交互必须有唯一 ID、可见焦点、44px 触控目标和 reduced-motion 降级。
- 每个功能先运行能证明旧行为错误的测试，再做最小实现；最终执行全量、构建、静态和真实浏览器验证。

---

### Task 1: 供应商注册表与设置迁移

**Files:**
- Create: `src/sillytavern/provider-registry.ts`
- Create: `src/sillytavern/provider-registry.test.ts`
- Modify: `src/sillytavern/types.ts`
- Modify: `src/sillytavern/api-config.ts`
- Modify: `src/sillytavern/api-config.test.ts`
- Modify: `src/sillytavern/defaults.ts`
- Modify: `src/sillytavern/defaults.test.ts`

**Interfaces:**
- Produces: `TAVERN_PROVIDERS`、`getTavernProvider(id)`、`getTavernApiPreset(id)`、`normalizeTavernSettings(value)`。
- Consumes: 官方端点、协议族与现有 Dexie 设置结构。

- [ ] 写失败测试：注册表包含 21 个参考供应商、OpenAI、自定义项；ID 唯一；地址/协议/额外字段符合设计矩阵。
- [ ] 写失败测试：旧 `adapterMode: local` 设置迁移后不再暴露模式；旧 DeepSeek/自定义配置仍保留玩家地址和模型。
- [ ] 运行 `npm run test:run -- src/sillytavern/provider-registry.test.ts src/sillytavern/api-config.test.ts src/sillytavern/defaults.test.ts`，确认旧联合类型与默认值失败。
- [ ] 扩展 `TavernApiProvider`、`TavernApiProtocol`、`TavernApiConfig.providerOptions`，实现冻结注册表和规范化迁移。
- [ ] 把格式提示和默认预设文案改为“模型叙事”，删除“本地剧情引擎/当前不会发送”的说明。
- [ ] 重跑定向测试并通过。

### Task 2: 多协议远程适配器

**Files:**
- Create: `src/sillytavern/protocol-adapters.ts`
- Create: `src/sillytavern/protocol-adapters.test.ts`
- Modify: `src/sillytavern/api-adapter.ts`
- Modify: `src/sillytavern/api-adapter.test.ts`

**Interfaces:**
- Produces: `buildProviderRequest(config, key, request, stream)`、`extractProviderText(protocol, payload)`、`extractProviderSseDelta(protocol, payload)`。
- Consumes: `TavernRequest`、provider registry、Fetch API。

- [ ] 写表驱动失败测试覆盖 OpenAI/Azure headers 和 URL、Claude body/SSE、Gemini body/JSON、Vertex URL/body、Cohere JSON/SSE、Cloudflare URL/JSON。
- [ ] 保留现有 OpenAI SSE 跨 chunk、JSON、401、429、Abort/CORS 测试并添加供应商 label 断言。
- [ ] 运行 `npm run test:run -- src/sillytavern/protocol-adapters.test.ts src/sillytavern/api-adapter.test.ts`，确认专用协议尚未实现。
- [ ] 实现协议构建/解析模块；公共适配器统一 Fetch、错误和流生命周期。
- [ ] 连接测试对可列模型供应商调用目录；其余发送 `max_tokens: 1` 的最小非流式请求并返回空模型数组。
- [ ] 重跑定向测试并通过。

### Task 3: 移除本地叙事运行路径

**Files:**
- Modify: `src/tavern/TavernContext.tsx`
- Modify: `src/tavern/remote-story-engine.test.ts`
- Delete: `src/tavern/local-story-engine.ts`
- Delete: `src/tavern/local-story-engine.test.ts`
- Modify: `src/components/SillyTavern/TavernDialogue.tsx`
- Modify: `src/components/SillyTavern/TavernDialogue.test.tsx`
- Modify: `src/components/SillyTavern/TavernHubModal.tsx`
- Modify: `src/components/SillyTavern/TavernHubModal.test.tsx`

**Interfaces:**
- `sendTurn` 始终调用 `createRemoteTurn`；`apiLabel` 始终来自供应商注册表。

- [ ] 写失败测试：未配置密钥时发送被拒绝且不会新增 assistant 消息；配置 mock API 后新消息为 `apiUsed: remote`。
- [ ] 写失败测试：对话与酒馆顶部不再出现 `LOCAL`、`本地叙事` 或离线生成文案。
- [ ] 运行相关 Context/Dialogue/Hub 测试并确认失败。
- [ ] 删除本地分支/import/文件，首次会话角色卡首句不声明生成来源；错误区增加打开接口页的动作入口。
- [ ] 重跑定向测试并通过；`rg -n "createLocalTurn|本地叙事|LOCAL TAVERN|LLM LOCAL" src` 返回 0。

### Task 4: 多供应商 API 控制台

**Files:**
- Modify: `src/components/SillyTavern/panels/ApiPanel.tsx`
- Modify: `src/components/SillyTavern/panels/ApiPanel.test.tsx`
- Modify: `src/styles/sillytavern.css`

**Interfaces:**
- Consumes: provider registry metadata、`testTavernApiConnection`、Tavern settings。

- [ ] 写失败测试：下拉包含全部供应商；切换 Claude/Cloudflare/Vertex 显示正确动态字段；页面没有本地模式。
- [ ] 写失败测试：缺少 Account ID/Project ID/Location/模型/密钥时就地报错；保存后 provider options 进入设置。
- [ ] 运行 `npm run test:run -- src/components/SillyTavern/panels/ApiPanel.test.tsx` 并确认失败。
- [ ] 重构面板为注册表驱动分组下拉、供应商说明、官方文档链接、动态字段和恢复官方地址按钮。
- [ ] 保留密钥显隐、会话保存、本机记忆、模型选择、温度/输出长度、测试与保存反馈；测试按钮说明最小请求可能产生费用。
- [ ] 完成桌面/手机响应式 CSS 后重跑面板与可访问性测试。

### Task 5: 玩法规则模型、倍率函数与持久化

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/rules.ts`
- Modify: `src/game/rules.test.ts`
- Modify: `src/game/reducer.ts`
- Modify: `src/game/reducer.test.ts`
- Modify: `src/game/GameContext.tsx`
- Create: `src/game/game-settings-storage.ts`
- Create: `src/game/game-settings-storage.test.ts`

**Interfaces:**
- Produces: `DEFAULT_GAME_RULES`、`normalizeGameRules`、`scaleReward`、`scaleDamage`、`scaleGrowthHours`、`getEnergyCost`、`UPDATE_GAME_RULES`、`RESET_GAME_RULES`。

- [ ] 写失败测试验证倍率边界、四舍五入/最小值、成长时间反比、三档精力成本和无效 localStorage 回退。
- [ ] 写 reducer 失败测试：聊天好感、送礼、任务金币、训练/钓鱼/采矿/战斗经验、矿物/收获掉落、出售金币、玩家/敌人伤害、治疗恢复、精力消耗分别受规则影响。
- [ ] 运行 `npm run test:run -- src/game/rules.test.ts src/game/game-settings-storage.test.ts src/game/reducer.test.ts` 并确认失败。
- [ ] 实现默认规则、规范化、版本化 localStorage、Provider 初始化合并和保存 effect。
- [ ] 在 reducer 所有既有奖励/消耗边界调用纯函数，提示文字使用实际结果；购买成本不乘金币倍率。
- [ ] 重跑定向测试并通过。

### Task 6: 真实玩法设置面板

**Files:**
- Create: `src/components/modals/SettingsModal.tsx`
- Create: `src/components/modals/SettingsModal.test.tsx`
- Modify: `src/components/modals/ModalHost.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/components/icons/GameIcon.tsx`（仅在现有图标语义不足时）

**Interfaces:**
- Consumes: `state.rules`；dispatches `UPDATE_GAME_RULES` / `RESET_GAME_RULES`。

- [ ] 写失败测试：九项设置可见、修改草稿不立即生效、应用后更新状态、恢复标准规则需应用内确认、每项有实时示例。
- [ ] 运行 `npm run test:run -- src/components/modals/SettingsModal.test.tsx` 并确认设置仍为静态占位。
- [ ] 实现三组规则卡、难度倾向仪表、受控 range/number、精力模式、脏状态、应用与恢复确认。
- [ ] 在 `ModalHost` 替换 settings 的 `FutureFeature`；添加桌面/窄屏样式、焦点与 reduced-motion。
- [ ] 重跑设置、ModalHost 与可访问性测试。

### Task 7: 农田播种与新手季节一致性

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/data.ts`
- Modify: `src/game/reducer.ts`
- Modify: `src/game/reducer.test.ts`
- Modify: `src/components/stage/FarmStage.tsx`
- Modify: `src/components/stage/FarmStage.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Adds: `PLANT_PLOT { plotId, seedId }`。

- [ ] 写 reducer 失败测试：合法播种扣一个种子、写入作物与倍率后的小时；已种地/无库存/非种子不改变状态并给出内部反馈。
- [ ] 写组件失败测试：空地显示持有种子卡和唯一播种按钮，点击后切换为作物成长详情。
- [ ] 运行 `npm run test:run -- src/game/reducer.test.ts src/components/stage/FarmStage.test.tsx`，确认当前无动作/按钮。
- [ ] 把两种新手种子和对应作物改为春季，补全 `itemDisplayNames`；实现播种动作与 UI。
- [ ] 重跑定向测试并用 `work/phase8-baseline.mjs` 验证 `plantingButtonCount > 0`。

### Task 8: 地图真实指针点击回归

**Files:**
- Modify: `src/components/shell/VillageMap.tsx`
- Modify: `src/components/shell/VillageMap.test.tsx`
- Modify: `work/phase8-baseline.mjs`（仅本地诊断，目录被忽略）

**Interfaces:**
- pointer capture 只在跨越 6px 阈值后发生；普通热点 click 直接设置 destination。

- [ ] 写组件失败测试：pointerdown 不调用 capture；小幅移动/抬起不进入拖动态；跨阈值调用 capture 并抑制合成 click。
- [ ] 运行 `npm run test:run -- src/components/shell/VillageMap.test.tsx` 并确认旧实现失败。
- [ ] 移动捕获时机，使用 `hasPointerCapture` 守卫 release，保持键盘、拖动、定位、重置与移动地点列表。
- [ ] 重跑地图测试；启动本地预览，以真实 Edge 鼠标点击热点，断言 `#travel-confirm-general-store` 可见且点击后 HUD 为杂货店。

### Task 9: 全量验收、审计与推送

**Files:**
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`
- Modify: `README.md`（仅当运行/API说明需同步）

- [ ] 运行 `npm run test:run`，要求全部通过且无未处理 React 警告。
- [ ] 运行 `npm run build`，确认 TypeScript 与 Vite 构建成功。
- [ ] 运行 `git diff --check`。
- [ ] 静态扫描真实密钥、原生对话框、本地叙事运行路径、重复 ID 与“金叶”。
- [ ] Edge 验证 1440×900 与 375×812：API 面板、设置页、空地播种、地图行程、NPC 缺 API 引导；记录 console/page errors 与横向溢出。
- [ ] 更新持久计划文件，提交明确 commit 并推送 `main` 到 `origin`。
