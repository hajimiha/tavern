# 《雾灯谷纪事》可拖拽地图与 SillyTavern 酒馆化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复地图热点错位、统一金币文案，并将 SillyTavern 世界书/预设/角色卡/持久会话/变量/分支能力完整嵌入现有像素经营游戏。

**Architecture:** 地图使用同一可平移世界层承载底图和热点；酒馆系统按 feature 目录隔离 Dexie 数据、世界书匹配、提示组装、流解析、React 状态与管理 UI。NPC 对话消费酒馆上下文并保留本地模拟回退，现有 GameState 只提供经营状态镜像，不与 IndexedDB 相互耦合。

**Tech Stack:** React 18、TypeScript、Vite 5、Vitest、Testing Library、Dexie、Pointer Events、ResizeObserver、Phosphor Icons。

## Global Constraints

- 只做前端；禁止创建服务端、数据库服务、鉴权或密钥代理。
- 所有新用户文案中文化；艺术性英文眉题除外；禁止 emoji。
- SillyTavern 采用游戏模式、默认六标签、单主 API、非 schema-first。
- API 未配置或失败时必须提供本地剧情模拟，不阻断 NPC 互动。
- 地图底图和热点必须共享同一 transform；拖拽不能成为唯一操作路径。
- 主操作与图标按钮至少 44×44px，支持键盘、触控、可见焦点和 reduced-motion。
- 当前目录不是 Git 仓库；以测试、构建、截图和 progress.md 作为检查点，不执行 Git 提交。

## File Structure

```text
src/components/shell/VillageMap.tsx             可拖拽地图视图
src/components/shell/mapViewport.ts              地图偏移/钳制纯函数
src/sillytavern/types.ts                          酒馆类型
src/sillytavern/database.ts                       Dexie 持久化与默认种子
src/sillytavern/lorebook-engine.ts                世界书匹配
src/sillytavern/prompt-assembler.ts               提示词组装
src/sillytavern/importer.ts                       SillyTavern JSON 导入导出
src/sillytavern/variables.ts                      变量提取
src/sillytavern/stream-parser.ts                  六标签流解析
src/sillytavern/vars-merger.ts                    变量合并
src/sillytavern/api-router.ts                     主 API/本地回退路由
src/sillytavern/editor-utils.ts                   编辑器纯函数
src/sillytavern/defaults.ts                       雾灯谷世界书/预设/15 角色卡
src/sillytavern/index.ts                          公共导出
src/hooks/useSillytavern.ts                       持久会话状态
src/hooks/useStreamParser.ts                      流式标签状态
src/hooks/useApiRouter.ts                         发送与回退
src/components/SillyTavern/TavernHubModal.tsx     六标签酒馆中枢
src/components/SillyTavern/TavernDialogue.tsx     NPC 游戏模式对话
src/components/SillyTavern/*Editor*.tsx           世界书/预设/角色卡/变量编辑
src/styles/sillytavern.css                        像素酒馆视觉
```

---

### Task 1: 地图同坐标画布与拖拽

**Files:**
- Create: `src/components/shell/mapViewport.ts`
- Create: `src/components/shell/mapViewport.test.ts`
- Modify: `src/components/shell/VillageMap.tsx`
- Modify: `src/components/shell/VillageMap.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces `clampMapOffset(offset, viewport, world): MapOffset`、`offsetForPoint(point, viewport, world): MapOffset`。
- `VillageMap` 使用 Pointer Events、方向键、Home 和 C，并设置 `data-offset-x/y` 供浏览器验证。

- [ ] 写纯函数失败测试：世界 1200×675、视口 600×320 时 `{x:100,y:-500}` 钳制为 `{x:0,y:-355}`；中心点定位后仍在范围内。
- [ ] 运行 `pnpm test:run -- src/components/shell/mapViewport.test.ts`，确认因模块缺失而失败。
- [ ] 实现 `clampMapOffset` 与 `offsetForPoint` 最小代码并运行测试至通过。
- [ ] 扩展组件失败测试：存在 `map-pan-left`、`map-reset-view`；聚焦视口按 ArrowLeft 后 `data-offset-x` 改变；拖动超过 6px 后不打开地点弹窗。
- [ ] 运行 `pnpm test:run -- src/components/shell/VillageMap.test.tsx`，确认控件/行为缺失失败。
- [ ] 将图片和热点移入 `village-map-world`，统一 transform；实现 Pointer Capture、6px 阈值、rAF 更新、ResizeObserver 钳制、四向/当前地点/重置控件和 aria-live 状态。
- [ ] 运行两个地图测试文件，确认通过；检查 Tab 顺序仍可到达 10 个地点。

### Task 2: “金叶”全局替换为“金币”

**Files:**
- Create: `src/currency-copy.test.tsx`
- Modify: `src/components/**/*.tsx`
- Modify: `src/game/reducer.ts`
- Modify: `src/**/*.test.tsx`

**Interfaces:** 保留 `GameState.money: number`，只改变用户可见文案与测试期望。

- [ ] 写失败测试，渲染 `App` 并断言页面出现“金币”且 `document.body.textContent` 不包含“金叶”。
- [ ] 运行 `pnpm test:run -- src/currency-copy.test.tsx`，确认当前“金叶”导致失败。
- [ ] 将生产源码与测试中的 21 处“金叶”替换为“金币”；同步 aria-label 和 Toast。
- [ ] 运行货币测试和全量既有测试，确认通过。

### Task 3: 安装并校验 SillyTavern 核心引擎

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/sillytavern/types.ts`, `database.ts`, `lorebook-engine.ts`, `prompt-assembler.ts`, `importer.ts`, `variables.ts`, `stream-parser.ts`, `vars-merger.ts`, `api-router.ts`, `api-tools.ts`, `editor-utils.ts`, `index.ts`
- Create tests copied/adapted from `C:/Users/qixin/.codex/skills/sillytavern-web/templates/react/sillytavern/*.test.ts`

**Interfaces:** 复用技能模板的 `Lorebook`、`ChatPreset`、`AppSettings`、`ChatSession`、`ChatMessage`、`assemblePrompt`、`parseTaggedContent`、`mergeVariables`、`routeApiRequest`。

- [ ] 完整读取 React 核心模板与其测试，确认 Dexie、浏览器 API 和导入格式假设。
- [ ] 执行 `pnpm add dexie`，确认依赖安装成功。
- [ ] 先复制核心模板测试到 `src/sillytavern/`，运行并确认生产模块缺失造成红灯。
- [ ] 使用 apply_patch 将技能模板核心源码复制到项目，保持类型/函数签名不变。
- [ ] 运行 `pnpm test:run -- src/sillytavern`，修复项目 TS/DOM 环境差异直到模板测试全部通过。

### Task 4: 雾灯谷默认世界书、预设与角色卡

**Files:**
- Create: `src/sillytavern/defaults.ts`
- Create: `src/sillytavern/defaults.test.ts`
- Modify: `src/sillytavern/database.ts`

**Interfaces:**
- Produces `createMistvaleDefaults(npcs, locations): { lorebooks; presets; characterCards; settings }`。
- 默认角色卡 ID 为 `mistvale-character-{npc.id}`，绑定 NPC ID 和地点世界书。

- [ ] 写失败测试：生成 15 张角色卡；公共世界书含“五行克制”“精力规则”“地点营业”条目；设置为 game 模式和六默认标签。
- [ ] 运行测试确认 `defaults.ts` 缺失红灯。
- [ ] 实现具体默认数据：一册公共世界书、一册地点世界书、一套“暮色叙事”预设、15 张角色卡及安全空 API 设置。
- [ ] 数据库初始化仅在表为空时写入默认项；不覆盖已有用户数据。
- [ ] 运行默认数据与数据库相关测试至通过。

### Task 5: React 酒馆状态、API 回退与 NPC 会话

**Files:**
- Create: `src/hooks/useSillytavern.ts`, `useStreamParser.ts`, `useApiRouter.ts`
- Create: `src/components/SillyTavern/TavernDialogue.tsx`
- Create: `src/components/SillyTavern/TavernDialogue.test.tsx`
- Modify: `src/components/stage/LocationStage.tsx`
- Modify: `src/components/npc/DialogueView.tsx`

**Interfaces:**
- `useSillytavern()` 提供初始化、会话 CRUD、消息编辑/截断/分支、变量更新、世界书/预设/角色卡 CRUD。
- `TavernDialogue` 接收 `npc`、`relationship`、`gameContext`，未配置 API 时调用现有 `mockDialogueProvider`。

- [ ] 完整读取技能的三个 hooks 与 GameView/HistoryDrawer/MainTextPane/OptionList/ThinkingFold 模板。
- [ ] 写失败组件测试：打开洛岚对话后显示“世界书”“会话分支”“变量”；点击一个 option 会发送对应文本；本地模式生成正文。
- [ ] 运行测试确认组件缺失红灯。
- [ ] 按模板实现 hooks；增加 `TavernProvider`，避免每个组件创建独立数据库状态。
- [ ] 实现 `TavernDialogue`：持久消息、标签正文、选项、思考折叠、历史抽屉、编辑重生成、删除后续、分支和本地回退。
- [ ] 用 `TavernDialogue` 替换原 `DialogueView` 内容但保留原关闭/精力/好感流程。
- [ ] 运行 NPC、酒馆和既有对话测试至通过。

### Task 6: 六标签酒馆中枢与编辑器

**Files:**
- Create: `src/components/SillyTavern/TavernHubModal.tsx`
- Create/adapt: `SettingsModal.tsx`, `LorebookModal.tsx`, `LorebookEditorModal.tsx`, `EntryForm.tsx`, `PresetModal.tsx`, `PromptOrderEditor.tsx`, `CharacterCardPanel.tsx`, `SessionPanel.tsx`, `VariablesModal.tsx`
- Create: `src/components/SillyTavern/TavernHubModal.test.tsx`
- Modify: `src/components/modals/ModalHost.tsx`
- Modify: `src/game/types.ts`
- Modify: `src/styles/global.css`
- Create: `src/styles/sillytavern.css`

**Interfaces:** 新 modal 类型 `tavern`；设置按钮打开 `tavern`；六个 tab ID 为 `tavern-tab-connection/lorebooks/presets/characters/sessions/variables`。

- [ ] 完整读取技能编辑器模板及 editor-utils，列出需要从默认样式改造成中文像素 UI 的类名和交互。
- [ ] 写失败测试：设置按钮打开“酒馆中枢”；六标签均存在；世界书可启停；新建会话后出现在会话列表；API 密钥输入为 password。
- [ ] 运行测试确认 modal 类型和中枢缺失红灯。
- [ ] 使用模板逻辑实现六标签中枢，所有按钮补充唯一描述性 ID、中文 aria-label 和应用内确认层。
- [ ] 将酒馆样式映射到现有 token：深苔表面、铜金选中、紫雾变量/思考层；375px 改为顶部横向可滚动标签与单列面板。
- [ ] 运行中枢、无障碍和既有 ModalHost 测试至通过。

### Task 7: 最终联调、性能和视觉验证

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `src/styles/global.css`, `README.md`, `progress.md`, `task_plan.md`
- Create/modify: `work/visual-check.mjs`, `work/tavern-verification-report.md`

**Interfaces:** 生产构建包含懒加载酒馆管理组件；浏览器脚本输出地图 transform、热点/底图共同矩阵、模态边界和控制台错误。

- [ ] 为 `TavernHubModal` 使用 `React.lazy`/`Suspense`，加载时显示应用内骨架，不增加首屏阻塞。
- [ ] 运行 `pnpm test:run`，期望全部通过且无未处理 warning。
- [ ] 运行 `pnpm build`，记录 JS/CSS gzip 大小和 Dexie chunk。
- [ ] 扩展浏览器脚本：拖动地图 160px 后确认图片与 `map-location-mine` 的 transform 相同；点击重置恢复；打开酒馆中枢并切换六标签。
- [ ] 在 1440×900、1024×768、768×1024、375×812 检查无水平溢出、地图可达、弹窗不出屏、中文不裁切、控制台零错误。
- [ ] 运行 UI/UX Pro Max `--domain ux "animation accessibility z-index loading"` 最终审计并记录修复。
- [ ] 更新 README 运行/酒馆说明、验证报告和计划状态。

## Plan Self-Review

- 规格中的地图、货币、Dexie、世界书、预设、角色卡、会话、变量、六标签、API 回退、错误与可访问性均映射到任务。
- 无 TBD、TODO、“稍后处理”或无内容模态。
- `TavernDialogue`、`TavernHubModal`、`createMistvaleDefaults`、地图纯函数与 modal 类型在生产者/消费者中命名一致。
- 当前目录非 Git 仓库，因此计划中的检查点使用测试和进度文件，不包含提交步骤。
