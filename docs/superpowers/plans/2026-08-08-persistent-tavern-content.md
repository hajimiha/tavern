# Persistent Tavern Content Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展模型参数，修复农场出行与会话滚动，并加入仓库内容包、导入导出、全屏和版本化自动存档。

**Architecture:** 游戏小状态使用版本化 localStorage；酒馆大对象继续使用 Dexie；仓库默认内容通过 public JSON 分发，本机编辑通过 JSON 导入导出与仓库协作。协议适配器负责供应商参数映射，组件只维护受控表单。

**Tech Stack:** React 18、TypeScript、Vite、Vitest/Testing Library、Dexie、Playwright Core、Phosphor Icons。

---

### Task 1: 扩展 API 参数与迁移

**Files:**
- Modify: `src/sillytavern/types.ts`
- Modify: `src/sillytavern/defaults.ts`
- Modify: `src/sillytavern/api-config.ts`
- Modify: `src/sillytavern/protocol-adapters.ts`
- Modify: `src/sillytavern/api-adapter.ts`
- Modify: `src/components/SillyTavern/panels/ApiPanel.tsx`
- Test: `src/sillytavern/api-config.test.ts`
- Test: `src/sillytavern/protocol-adapters.test.ts`
- Test: `src/components/SillyTavern/panels/ApiPanel.test.tsx`

- [ ] 写失败测试：旧 `maxTokens` 迁移、无上限回复长度、完整参数协议映射、真实流式开关、重置按钮消失。
- [ ] 实现类型、默认值、验证、历史裁剪和协议映射。
- [ ] 重构 API 控制台为完整参数矩阵并运行定向测试。

### Task 2: 修复农场热区和当前地点状态

**Files:**
- Modify: `src/game/data.ts`
- Modify: `src/components/shell/VillageMap.tsx`
- Modify: `src/components/shell/VillageMap.test.tsx`
- Modify: `src/styles/global.css`

- [ ] 写失败测试：位于村长家时能选择并前往农场，手机地点列表也包含农场。
- [ ] 为农场配置地图坐标并移除过滤；处理当前地点禁用态。
- [ ] 运行地图组件测试和真实指针浏览器回归。

### Task 3: 建立版本化自动存档

**Files:**
- Create: `src/game/game-save-storage.ts`
- Create: `src/game/game-save-storage.test.ts`
- Modify: `src/game/GameContext.tsx`
- Modify: `src/game/types.ts`
- Modify: `src/components/modals/SettingsModal.tsx`
- Modify: `src/components/modals/SettingsModal.test.tsx`

- [ ] 写失败测试：状态净化、刷新恢复、损坏存档回退、导出/导入/重置。
- [ ] 实现存储迁移和 Provider 控制方法。
- [ ] 在设置中加入自动存档控制台与应用内确认。

### Task 4: 修复会话滚动与编辑器可达性

**Files:**
- Modify: `src/components/SillyTavern/TavernDialogue.tsx`
- Modify: `src/components/SillyTavern/TavernDialogue.test.tsx`
- Modify: `src/styles/global.css`

- [ ] 写失败结构测试：单一滚动主体包含消息和选项，编辑器位于滚动主体之后且不收缩。
- [ ] 重组 DOM，新增末尾锚点和自动滚动。
- [ ] 在桌面、375px 手机和横屏检查滚轮/触控行为。

### Task 5: 世界书、预设、角色立绘与仓库内容包

**Files:**
- Create: `public/content/mistvale-content-pack.json`
- Create: `src/sillytavern/content-pack.ts`
- Create: `src/sillytavern/content-pack.test.ts`
- Modify: `src/sillytavern/repository.ts`
- Modify: `src/tavern/TavernContext.tsx`
- Modify: `src/components/SillyTavern/panels/LorebookPanel.tsx`
- Modify: `src/components/SillyTavern/panels/PresetPanel.tsx`
- Modify: `src/components/SillyTavern/panels/CharacterPanel.tsx`
- Modify: `src/styles/sillytavern.css`

- [ ] 写失败测试：内容包校验/合并、SillyTavern 世界书与预设导入导出、角色立绘体积校验。
- [ ] 实现内容包服务和仓库初始化覆盖层。
- [ ] 接入三个编辑器的导入/导出/来源说明及内部反馈。

### Task 6: 全屏控制与响应式完善

**Files:**
- Create: `src/hooks/useFullscreen.ts`
- Create: `src/hooks/useFullscreen.test.tsx`
- Modify: `src/components/icons/GameIcon.tsx`
- Modify: `src/components/shell/TopHud.tsx`
- Modify: `src/components/shell/TopHud.test.tsx`
- Modify: `src/styles/global.css`

- [ ] 写失败测试：进入/退出全屏、事件同步和不支持状态。
- [ ] 加入 HUD 按钮与图标，完善桌面/手机动作坞布局。
- [ ] 检查焦点、触控尺寸和 reduced-motion。

### Task 7: 全量验证与发布

- [ ] 运行定向测试、全量 Vitest、TypeScript/Vite 构建。
- [ ] 运行唯一 ID、占位/emoji/裸警告扫描。
- [ ] 用 Edge 在 1440×900、1024×768、375×812 和手机横屏复现完整流程。
- [ ] 更新计划、发现、进度和验证报告。
- [ ] 提交并推送 GitHub `main`。
