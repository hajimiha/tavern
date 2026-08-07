# 《雾灯谷纪事》本地优先酒馆化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不连接任何 LLM 的前提下，为现有像素经营游戏加入可替换 API 契约、SillyTavern 本地核心、世界书、预设、15 张角色卡、持久会话、变量快照和酒馆化管理界面。

**Architecture:** API 使用只能生成请求预览、不能联网的禁用适配器；SillyTavern 数据与解析核心存于 `src/sillytavern/`，Dexie 负责浏览器持久化，React Context 提供单一酒馆状态。NPC 对话和远程适配器共享六标签事件模型，本阶段只有现有本地剧情 Provider 可以产出事件。

**Tech Stack:** React 18、TypeScript 5.6、Vite 5、Vitest、Testing Library、Dexie、Phosphor Icons、IndexedDB。

## Global Constraints

- 纯前端；不得创建服务端、密钥代理或可达的 LLM 网络请求。
- `TavernApiAdapter` 默认且唯一实现为 `disabled`，任何发送尝试返回 `TAVERN_API_DISABLED`。
- 不读取、创建、保存或导出 API 密钥。
- 游戏模式启用；默认标签为 `maintext`、`option`、`sum`、`vars`、`thinking`、`think`。
- 次 API 关闭；schema-first 关闭。
- 用户可见文案中文化；禁止 emoji；图标统一使用 Phosphor SVG。
- 删除/覆盖/放弃修改必须使用应用内确认，禁止 `alert`、`confirm`、`prompt`。
- 保留现有深苔绿、夜蓝黑、铜金和羊皮纸视觉，不复制模板白底内联样式。
- 所有交互元素使用唯一描述性 ID；主要操作和图标按钮不小于 44×44px。
- 当前目录不是 Git 仓库；各任务使用测试、构建和 `progress.md` 作为检查点，不执行 commit。

---

### Task 1: 禁用 API 适配接口

**Files:**
- Create: `src/sillytavern/api-adapter.ts`
- Test: `src/sillytavern/api-adapter.test.ts`
- Create: `src/sillytavern/types.ts`

**Interfaces:**
- Produces `TavernRequest`、`TavernPreparedRequest`、`TavernStreamEvent`、`TavernApiAdapter`。
- Produces `createDisabledTavernApi(): TavernApiAdapter`。
- Produces `TavernApiDisabledError` with `code: 'TAVERN_API_DISABLED'`。

- [x] **Step 1: 写失败测试，证明接口不存在且未来实现不得触发 fetch**

```ts
it('只生成请求预览且不会发出网络请求', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const api = createDisabledTavernApi()
  const preview = api.prepare({ task: 'story', messages: [{ role: 'user', content: '你好' }] })
  expect(preview.status).toBe('preview')
  await expect(collect(api.stream(preview))).rejects.toMatchObject({ code: 'TAVERN_API_DISABLED' })
  expect(fetchSpy).not.toHaveBeenCalled()
})
```

- [x] **Step 2: 运行红灯**

Run: `pnpm exec vitest run src/sillytavern/api-adapter.test.ts`

Expected: FAIL，原因是 `api-adapter` 模块不存在。

- [x] **Step 3: 实现最小禁用适配器**

```ts
export function createDisabledTavernApi(): TavernApiAdapter {
  return {
    mode: 'disabled',
    label: '接口已预留 · 模型未接入',
    prepare: (request) => ({ id: crypto.randomUUID(), request, status: 'preview', createdAt: Date.now() }),
    async *stream() { throw new TavernApiDisabledError() },
  }
}
```

- [x] **Step 4: 运行定向测试至通过，并搜索生产代码确认没有新增 `/chat/completions` 或 `Authorization`**

Run: `pnpm exec vitest run src/sillytavern/api-adapter.test.ts`

Run: `rg -n "/chat/completions|Authorization.*Bearer" src`

Expected: 测试 PASS；搜索无新增结果。

---

### Task 2: 安装 Dexie 并接入 SillyTavern 纯核心

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create/adapt: `src/sillytavern/lorebook-engine.ts`
- Create/adapt: `src/sillytavern/prompt-assembler.ts`
- Create/adapt: `src/sillytavern/importer.ts`
- Create/adapt: `src/sillytavern/variables.ts`
- Create/adapt: `src/sillytavern/stream-parser.ts`
- Create/adapt: `src/sillytavern/vars-merger.ts`
- Create/adapt: `src/sillytavern/editor-utils.ts`
- Create: corresponding `*.test.ts`

**Interfaces:**
- Consumes types from Task 1 and extends them with `Lorebook`、`LorebookEntry`、`ChatPreset`、`ChatMessage`、`ChatSession`、`ParsedTags`。
- Produces `assemblePrompt`、`StreamTagParser`、`aggregateEvents`、`applyVarsPatch`、`importLorebook`、`exportLorebook` and editor utilities。

- [x] **Step 1: 安装运行时依赖**

Run: `pnpm add dexie`

Expected: `dexie` 出现在 dependencies，锁文件更新。

- [x] **Step 2: 从已安装技能复制纯核心测试，先运行红灯**

Source: `C:/Users/qixin/.codex/skills/tavernlike/templates/react/sillytavern/*.test.ts`

Run: `pnpm exec vitest run src/sillytavern`

Expected: FAIL，缺少核心模块。

- [x] **Step 3: 复制并适配纯核心源码**

只复制 `lorebook-engine`、`prompt-assembler`、`importer`、`variables`、`stream-parser`、`vars-merger`、`editor-utils`；不复制含真实 `fetch` 的 `api-router.ts` 和 `api-tools.ts`。

- [x] **Step 4: 将模板默认货币变量从“金钱”映射为游戏现有 `money/金币` 展示，不改 GameState 字段**

```ts
export const gameVariableLabels = { money: '金币', energy: '精力', affinity: '好感' } as const
```

- [x] **Step 5: 运行核心测试至通过**

Run: `pnpm exec vitest run src/sillytavern`

Expected: 所有 parser、变量、导入、提示词和编辑器测试 PASS。

---

### Task 3: 雾灯谷默认内容与 Dexie 持久化

**Files:**
- Create: `src/sillytavern/defaults.ts`
- Test: `src/sillytavern/defaults.test.ts`
- Create: `src/sillytavern/database.ts`
- Create: `src/sillytavern/repository.ts`
- Create: `src/sillytavern/index.ts`

**Interfaces:**
- Produces `CharacterCard`、`TavernSettings`、`MistvaleTavernDefaults`。
- Produces `createMistvaleDefaults(): MistvaleTavernDefaults`。
- Produces `TavernRepository` CRUD for lorebooks, presets, characters, sessions and settings。

- [x] **Step 1: 写默认数据失败测试**

```ts
it('创建完整的雾灯谷酒馆种子', () => {
  const defaults = createMistvaleDefaults()
  expect(defaults.characters).toHaveLength(15)
  expect(defaults.lorebooks.flatMap(book => book.entries).map(entry => entry.comment))
    .toEqual(expect.arrayContaining(['五行克制', '每日精力', '地点营业']))
  expect(defaults.settings.api.enabled).toBe(false)
  expect(defaults.settings.customTags).toEqual(['maintext','option','sum','vars','thinking','think'])
})
```

- [x] **Step 2: 运行红灯后实现两册世界书、一套预设、15 张角色卡和禁用设置**

角色卡 ID 使用 `mistvale-character-${npc.id}`，绑定 `npcId`、`locationId`、首句、性格、示例对白和世界书 ID。

- [x] **Step 3: 实现 Dexie 数据库与仓储边界**

```ts
export interface TavernRepository {
  initialize(): Promise<void>
  listLorebooks(): Promise<Lorebook[]>
  saveLorebook(value: Lorebook): Promise<void>
  listSessions(): Promise<ChatSession[]>
  saveSession(value: ChatSession): Promise<void>
  // presets / characters / settings 对称 CRUD
}
```

数据库仅在各表为空时种入默认数据；已有数据不得覆盖。

- [x] **Step 4: 运行默认数据测试和 TypeScript 检查**

Run: `pnpm exec vitest run src/sillytavern/defaults.test.ts`

Run: `pnpm exec tsc -b --pretty false`

Expected: PASS。

---

### Task 4: 单一 TavernProvider 与本地楼层状态

**Files:**
- Create: `src/tavern/TavernContext.tsx`
- Create: `src/tavern/local-story-engine.ts`
- Test: `src/tavern/local-story-engine.test.ts`
- Create: `src/hooks/useTavern.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes `TavernRepository`、`createDisabledTavernApi`、`mockDialogueProvider`。
- Produces `useTavern()` with initialize, CRUD, `openNpcSession`, `sendLocalTurn`, `branchSession`, `truncateSession`, `updateVariables`。

- [x] **Step 1: 写本地楼层失败测试**

```ts
it('把本地回复解析成正文、选项、总结和变量快照', async () => {
  const turn = await createLocalTurn({ npcId: 'mayor', playerText: '问候', variables: { affinity: 8 } })
  expect(turn.parsed.maintext).not.toBe('')
  expect(turn.parsed.options.length).toBeGreaterThanOrEqual(2)
  expect(turn.variablesAfter.affinity).toBe(8)
})
```

- [x] **Step 2: 实现本地引擎，将现有 mock 流包装成六标签事件并通过同一 parser 聚合**

- [x] **Step 3: 实现 Context，确保整个 App 只有一个仓储状态实例**

```tsx
return <GameProvider><TavernProvider><AppContent /></TavernProvider></GameProvider>
```

- [x] **Step 4: 实现会话分支和截断时的 `variablesAfter` 恢复，运行测试至通过**

Run: `pnpm exec vitest run src/tavern`

Expected: PASS。

---

### Task 5: NPC 酒馆化剧情界面

**Files:**
- Create: `src/components/SillyTavern/TavernDialogue.tsx`
- Test: `src/components/SillyTavern/TavernDialogue.test.tsx`
- Create: `src/components/SillyTavern/HistoryDrawer.tsx`
- Modify: `src/components/npc/DialogueView.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes `useTavern()` and current `Npc`/relationship/game context。
- Produces an embedded dialogue with main text, options, free input, memory/lore/variables and history actions。

- [x] **Step 1: 写失败组件测试**

```tsx
expect(screen.getByRole('heading', { name: /与洛岚的酒馆会话/ })).toBeVisible()
expect(screen.getByRole('button', { name: '查看会话历史' })).toBeVisible()
expect(screen.getByText('接口已预留 · 当前使用本地叙事')).toBeVisible()
await user.click(screen.getByRole('button', { name: /选择行动/ }))
expect(await screen.findByText(/洛岚/)).toBeVisible()
```

- [x] **Step 2: 运行红灯，确认新组件缺失**

- [x] **Step 3: 实现四区会话布局和结构化选项**

保留原 `dialogue-close-*`、`dialogue-send-*`、`dialogue-stop-*` ID；新增历史/分支/变量按钮 ID，禁止 emoji。

- [x] **Step 4: 实现历史抽屉的跳转、删后续和分支，使用应用内确认状态**

- [x] **Step 5: 运行 NPC、对话和既有交互测试**

Run: `pnpm exec vitest run src/components/npc src/components/SillyTavern/TavernDialogue.test.tsx`

Expected: PASS。

---

### Task 6: 六标签酒馆中枢与编辑器

**Files:**
- Create: `src/components/SillyTavern/TavernHubModal.tsx`
- Test: `src/components/SillyTavern/TavernHubModal.test.tsx`
- Create: `src/components/SillyTavern/panels/ApiPanel.tsx`
- Create: `src/components/SillyTavern/panels/LorebookPanel.tsx`
- Create: `src/components/SillyTavern/panels/PresetPanel.tsx`
- Create: `src/components/SillyTavern/panels/CharacterPanel.tsx`
- Create: `src/components/SillyTavern/panels/SessionPanel.tsx`
- Create: `src/components/SillyTavern/panels/VariablesPanel.tsx`
- Create/adapt: `src/components/SillyTavern/editors/EntryForm.tsx`, `PromptOrderEditor.tsx`
- Create: `src/styles/sillytavern.css`
- Modify: `src/game/types.ts`, `src/game/reducer.ts`
- Modify: `src/components/modals/ModalHost.tsx`

**Interfaces:**
- Adds modal type `'tavern'`。
- Tab IDs: `tavern-tab-api`, `tavern-tab-lorebooks`, `tavern-tab-presets`, `tavern-tab-characters`, `tavern-tab-sessions`, `tavern-tab-variables`。

- [x] **Step 1: 写失败组件测试，断言六标签和禁用接口状态**

```tsx
expect(screen.getAllByRole('tab')).toHaveLength(6)
expect(screen.getByRole('tab', { name: '接口' })).toHaveAttribute('id', 'tavern-tab-api')
expect(screen.getByText('不会发送网络请求')).toBeVisible()
expect(screen.queryByLabelText('API 密钥')).not.toBeInTheDocument()
```

- [x] **Step 2: 运行红灯，新增 `'tavern'` modal 类型和入口**

- [x] **Step 3: 实现中枢壳、键盘标签切换、懒加载面板和内部确认层**

- [x] **Step 4: 按 tavernlike 编辑器逻辑实现世界书、预设和 prompt order；所有表单使用 `value + onChange(patch)`，落盘只在面板层发生**

- [x] **Step 5: 实现角色卡、会话和变量面板；变量页区分只读游戏镜像与可编辑会话变量**

- [x] **Step 6: 实现 API 页的适配器契约、禁用状态和请求预览，不呈现密钥输入或测试连接按钮**

- [x] **Step 7: 运行中枢和 ModalHost 测试**

Run: `pnpm exec vitest run src/components/SillyTavern src/components/modals`

Expected: PASS；无浏览器原生对话调用。

---

### Task 7: 全量联调、性能与视觉验收

**Files:**
- Modify: `src/App.tsx`, `src/styles/global.css`, `README.md`
- Modify: `task_plan.md`, `findings.md`, `progress.md`
- Create: `work/tavern-verification-report.md`
- Modify/create: `work/visual-check.mjs`

**Interfaces:**
- Production build lazy-loads TavernHub panels。
- Verification report records tests, bundle sizes, viewport bounds, unique IDs and network behavior。

- [x] **Step 1: 运行静态安全搜索**

Run: `rg -n "alert\(|confirm\(|prompt\(|/chat/completions|Authorization.*Bearer|apiKey" src/components/SillyTavern src/tavern src/sillytavern`

Expected: 无原生对话、网络 endpoint、Bearer 或持久化密钥实现。

- [x] **Step 2: 运行全量测试与生产构建**

Run: `pnpm test:run`

Run: `pnpm build`

Expected: 全部 PASS，Vite 构建成功。

- [x] **Step 3: 启动本地预览并执行四视口脚本**

视口：1440×900、1024×768、768×1024、375×812。检查无水平溢出、六标签可达、NPC 会话与历史抽屉不出屏、地图仍可拖动。

- [x] **Step 4: 捕获所有浏览器请求，确认没有模型/API 请求；控制台错误为 0**

- [x] **Step 5: 更新 README 与验证报告，记录 API 为禁用接口、世界书等功能的入口和以后替换适配器的位置**

- [x] **Step 6: 更新计划文件，只有在全部验证证据存在时标记 Phase 6 complete**

## Plan Self-Review

- 规格的 API 禁用契约、SillyTavern 核心、Dexie、默认内容、NPC 会话、六标签中枢、安全、可访问性和四视口验收均映射到独立任务。
- `TavernApiAdapter`、`TavernRepository`、`createMistvaleDefaults`、`TavernProvider`、`useTavern` 和六个 tab ID 在生产者与消费者中保持一致。
- 没有把真实 API router、`fetch` endpoint、密钥输入或浏览器原生警告框带入实现范围。
- 当前项目非 Git 仓库，未包含无法执行的提交步骤。
