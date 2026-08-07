# 新手开局、真实模型 API 与地图出行修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将演示存档重置为新手开局，提供真实可配置的模型 NPC 对话，并修复拖动地图后建筑点击被误吞的问题。

**Architecture:** 游戏初始化仍由纯函数常量负责；模型接入拆成配置规范化、密钥存储、OpenAI-compatible 适配器与远程剧情引擎四层；React Context 只编排本地或远程回合。地图保持现有 translate3d 拖动架构，只缩短点击抑制生命周期并精简控件。

**Tech Stack:** React 18、TypeScript、Vite、Vitest、Testing Library、Dexie、原生 Fetch/ReadableStream、Phosphor Icons。

## Global Constraints

- 纯前端，不创建应用后端或代理。
- API 密钥默认只在当前浏览器会话保存；只有明确选择后才写入 IndexedDB。
- 不提交真实 API 密钥，不使用浏览器原生 alert/confirm/prompt，不使用 emoji。
- 交互元素使用唯一描述性 ID，触控目标至少 44px，支持键盘与 reduced motion。
- 每个功能先写失败测试，完成后运行相关测试；最终运行全量测试与生产构建。

---

### Task 1: 新手开局状态

**Files:**
- Modify: `src/game/data.ts`
- Modify: `src/game/reducer.ts`
- Test: `src/game/reducer.test.ts`

**Interfaces:**
- Consumes: `GameState`、`Plot`、NPC 与委托静态数据。
- Produces: `createInitialPlots(): Plot[]` 返回 24 块空地；`initialGameState` 返回新手状态。

- [ ] **Step 1: 写初始化失败测试**

```ts
it('以刚抵达小镇的新手数据开始游戏', () => {
  expect(initialGameState).toMatchObject({ day: 1, season: '春', money: 500, energy: 5, maxEnergy: 5 })
  expect(initialGameState.inventory).toEqual({ 'moon-radish-seed': 8, 'mist-bean-seed': 4 })
  expect(initialGameState.plots.every((plot) => !plot.cropId)).toBe(true)
  expect(Object.values(initialGameState.relationships).every((item) => item.affinity === 0 && item.memoryTags.length === 0)).toBe(true)
})
```

- [ ] **Step 2: 运行测试并确认旧演示数据导致失败**

Run: `npm run test:run -- src/game/reducer.test.ts`

Expected: FAIL，显示 day、money、inventory 或 plots 与新手预期不符。

- [ ] **Step 3: 最小化修改初始化数据**

将 `createInitialPlots` 改为空地生成器，把技能统一为 1 级 0 经验，清空关系记忆、已知法术和电梯，将所有委托复制为 `available`，仅保留种子与基础工具状态。

- [ ] **Step 4: 运行 reducer 测试**

Run: `npm run test:run -- src/game/reducer.test.ts`

Expected: PASS。

### Task 2: API 配置、迁移与密钥存储

**Files:**
- Modify: `src/sillytavern/types.ts`
- Modify: `src/sillytavern/defaults.ts`
- Create: `src/sillytavern/api-config.ts`
- Create: `src/sillytavern/api-credentials.ts`
- Modify: `src/sillytavern/repository.ts`
- Test: `src/sillytavern/api-config.test.ts`
- Test: `src/sillytavern/api-credentials.test.ts`
- Modify: `src/sillytavern/repository.test.ts`

**Interfaces:**
- Produces: `TavernApiConfig`、`normalizeTavernSettings(value)`、`getSessionApiKey()`、`setSessionApiKey(value)`、`resolveApiKey(settings)`。
- Consumes: `createMistvaleDefaults().settings` 和浏览器 `sessionStorage`。

- [ ] **Step 1: 写默认配置、旧设置迁移和密钥生命周期测试**

```ts
expect(normalizeTavernSettings(legacy).api).toMatchObject({ provider: 'deepseek', model: 'deepseek-v4-flash' })
setSessionApiKey('sk-session')
expect(resolveApiKey(settings)).toBe('sk-session')
setSessionApiKey('')
expect(resolveApiKey({ ...settings, api: { ...settings.api, persistedApiKey: 'saved' } })).toBe('saved')
```

- [ ] **Step 2: 运行相关测试确认类型与函数尚不存在**

Run: `npm run test:run -- src/sillytavern/api-config.test.ts src/sillytavern/api-credentials.test.ts src/sillytavern/repository.test.ts`

Expected: FAIL，缺少新模块或旧设置仍返回 `disabled`。

- [ ] **Step 3: 实现默认值、深度合并与会话密钥存储**

公开设置存入 Dexie；`rememberKey=false` 时保存设置前删除 `persistedApiKey`。`getSettings()` 总是返回规范化后的完整结构，并在发现旧结构时回写一次。

- [ ] **Step 4: 运行配置与仓储测试**

Run: `npm run test:run -- src/sillytavern/api-config.test.ts src/sillytavern/api-credentials.test.ts src/sillytavern/repository.test.ts`

Expected: PASS。

### Task 3: OpenAI-compatible 真实适配器

**Files:**
- Modify: `src/sillytavern/api-adapter.ts`
- Test: `src/sillytavern/api-adapter.test.ts`

**Interfaces:**
- Produces: `createRemoteTavernApi(config, apiKey, fetchImpl?)`、`testTavernApiConnection(config, apiKey, fetchImpl?)`、`TavernApiRequestError`。
- Consumes: `TavernApiConfig`、`TavernRequest`、标准 Fetch API。

- [ ] **Step 1: 写 SSE、普通 JSON、模型列表和错误映射测试**

```ts
const response = new Response('data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: [DONE]\n\n', {
  headers: { 'content-type': 'text/event-stream' },
})
const api = createRemoteTavernApi(config, 'secret', vi.fn().mockResolvedValue(response))
expect(await collect(api.stream(api.prepare(request)))).toContainEqual({ type: 'delta', text: '你好' })
```

- [ ] **Step 2: 运行适配器测试确认远程工厂不存在**

Run: `npm run test:run -- src/sillytavern/api-adapter.test.ts`

Expected: FAIL。

- [ ] **Step 3: 实现 URL 规范化、鉴权、模型测试、SSE 解析和中文错误**

POST body 使用 `model`、`messages`、`temperature`、`max_tokens`、`stream: true`；流式分片只发出 `choices[0].delta.content`，最后发出 `{ type: 'done' }`。

- [ ] **Step 4: 运行适配器测试**

Run: `npm run test:run -- src/sillytavern/api-adapter.test.ts`

Expected: PASS。

### Task 4: 远程剧情引擎与 Context 编排

**Files:**
- Create: `src/tavern/remote-story-engine.ts`
- Test: `src/tavern/remote-story-engine.test.ts`
- Modify: `src/tavern/TavernContext.tsx`
- Test: `src/components/SillyTavern/TavernDialogue.test.tsx`

**Interfaces:**
- Produces: `createRemoteTurn(input): Promise<RemoteTurnResult>` 和 Context 的 `sendTurn(input): Promise<ChatSession>`。
- Consumes: `assemblePrompt`、角色卡、预设、世界书、`TavernApiAdapter.stream`、六标签解析器与变量补丁。

- [ ] **Step 1: 写远程提示组装和模型正文落库测试**

```ts
expect(adapter.prepare).toHaveBeenCalledWith(expect.objectContaining({ task: 'story' }))
expect(result.parsed.maintext).toBe('洛岚把委托簿推到你面前。')
expect(result.matchedEntryIds).toContain('relevant-lore-entry')
```

- [ ] **Step 2: 运行测试确认 Context 只有 sendLocalTurn**

Run: `npm run test:run -- src/tavern/remote-story-engine.test.ts src/components/SillyTavern/TavernDialogue.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现远程引擎并将 Context 改为 sendTurn**

远程模式解析设置与密钥后创建适配器；本地模式调用 `createLocalTurn`。远程失败直接抛出可读错误，成功消息标记 `apiUsed: 'remote'` 并记录命中的世界书条目。

- [ ] **Step 4: 运行引擎与对话测试**

Run: `npm run test:run -- src/tavern/remote-story-engine.test.ts src/components/SillyTavern/TavernDialogue.test.tsx`

Expected: PASS。

### Task 5: 酒馆 API 控制台

**Files:**
- Modify: `src/components/SillyTavern/panels/ApiPanel.tsx`
- Create: `src/components/SillyTavern/panels/ApiPanel.test.tsx`
- Modify: `src/components/SillyTavern/TavernDialogue.tsx`
- Modify: `src/styles/sillytavern.css`

**Interfaces:**
- Consumes: `useTavern().settings`、`updateSettings`、密钥函数与 `testTavernApiConnection`。
- Produces: 可编辑、可测试、可保存的全中文 API 控制台与动态对话状态条。

- [ ] **Step 1: 写表单语义、显隐密钥、保存和连接反馈测试**

```ts
expect(screen.getByLabelText('API 密钥')).toHaveAttribute('type', 'password')
await user.click(screen.getByRole('button', { name: '显示 API 密钥' }))
expect(screen.getByLabelText('API 密钥')).toHaveAttribute('type', 'text')
expect(screen.getByRole('button', { name: '测试连接' })).toHaveAttribute('id', 'tavern-api-test')
```

- [ ] **Step 2: 运行 API 面板测试确认静态禁用页失败**

Run: `npm run test:run -- src/components/SillyTavern/panels/ApiPanel.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现表单与高端连接状态 UI**

使用受控表单、本地内联校验、密钥显隐、保存与测试 loading 状态；显示“浏览器直连”安全卡和 CORS 说明。复用 Phosphor 图标，不引入新图标依赖。

- [ ] **Step 4: 运行面板和酒馆模态测试**

Run: `npm run test:run -- src/components/SillyTavern/panels/ApiPanel.test.tsx src/components/SillyTavern/TavernHubModal.test.tsx src/components/SillyTavern/TavernDialogue.test.tsx`

Expected: PASS。

### Task 6: 地图点击抑制与控件精简

**Files:**
- Modify: `src/components/shell/VillageMap.tsx`
- Modify: `src/components/shell/VillageMap.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: 只抑制拖动手势尾随 click 的计时器逻辑，以及包含定位/重置的双按钮控制组。
- Consumes: 现有 pointer handlers、键盘导航和地图热点。

- [ ] **Step 1: 写浏览器时序回归测试与控件测试**

```ts
fireEvent.pointerDown(viewport, { pointerId: 7, button: 0, clientX: 320, clientY: 180 })
fireEvent.pointerMove(viewport, { pointerId: 7, clientX: 260, clientY: 130 })
fireEvent.pointerUp(viewport, { pointerId: 7, clientX: 260, clientY: 130 })
fireEvent.click(fishingHouse)
expect(screen.queryByRole('dialog', { name: '前往渔家' })).not.toBeInTheDocument()
await vi.runAllTimersAsync()
fireEvent.click(fishingHouse)
expect(screen.getByRole('dialog', { name: '前往渔家' })).toBeVisible()
```

- [ ] **Step 2: 运行地图测试确认主动点击仍被旧 ref 吞掉或旧方向按钮仍存在**

Run: `npm run test:run -- src/components/shell/VillageMap.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 增加自动解除计时器并移除四个方向按钮**

拖动结束时设置抑制标记并安排 `setTimeout(..., 0)`；新拖动和卸载时清除旧计时器。保留方向键、C、Home、定位按钮、重置按钮和移动地点列表。

- [ ] **Step 4: 运行地图测试**

Run: `npm run test:run -- src/components/shell/VillageMap.test.tsx`

Expected: PASS。

### Task 7: 全量验证、视觉检查与发布

**Files:**
- Modify: `task_plan.md`
- Modify: `progress.md`
- Modify: `findings.md`

**Interfaces:**
- Consumes: 全部实现与测试。
- Produces: 可复现验证记录和推送到 `origin/main` 的提交。

- [ ] **Step 1: 运行全量测试与生产构建**

Run: `npm run test:run`

Expected: 全部测试 PASS。

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功。

- [ ] **Step 2: 在桌面与窄屏进行浏览器视觉检查**

检查 API 表单、对话状态、地图拖动/点击/确认、按钮触控尺寸、无横向溢出和内部错误反馈；不使用真实密钥发请求。

- [ ] **Step 3: 更新持久计划并检查变更范围**

Run: `git status --short` 与 `git diff --check`

Expected: 只有本轮目标文件，无空白错误，无密钥模式字符串。

- [ ] **Step 4: 提交并推送 main**

Run: `git add <本轮文件> && git commit -m "完善新手开局与真实酒馆 API" && git push origin main`

Expected: 推送成功，远端 `main` 指向新提交。
