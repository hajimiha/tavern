# 《雾灯谷纪事》前端原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可运行、可交互、纯前端、全中文的精细像素风 LLM 农场经营剧情游戏原型。

**Architecture:** React 单页应用以 `useReducer` 驱动唯一 `GameState`，所有消耗检查由纯函数返回统一的允许状态、原因和数值预览。像素地图/场景是优化位图，HTML 语义热区覆盖其上；地点功能通过统一模态层打开。LLM 对话依赖 `DialogueProvider` 接口，当前使用本地流式模拟实现。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library、Phosphor Icons、CSS Design Tokens、原生 WebP/PNG 资产。

## Global Constraints

- 只实现前端和本地模拟状态，禁止加入 API、数据库、鉴权或服务端代码。
- 所有用户可见文案为中文；Logo 的装饰性英文副标题除外。
- 禁止使用 emoji，通用图标统一使用 Phosphor，游戏专属符号使用同风格 SVG。
- 主体验为 1440px 桌面横屏；必须适配 1024px、768px 和 375px，页面不得出现意外横向滚动。
- 地图必须是一张连续的像素画，禁止用地点卡片网格替代。
- NPC 人数固定为 15 且全部女性；不生成 NPC 人物立绘，使用可替换的 `portraitByAffinity` 结构与高级剪影降级态。
- 每个交互元素必须拥有唯一、描述性 ID；最小点击区域为 44×44px。
- 所有反馈必须是应用内 Toast、内联消息或确认模态，禁止 `alert`、`confirm` 和 `prompt`。
- 动画只使用 transform/opacity，支持 `prefers-reduced-motion`。
- 关键图片声明尺寸并按需加载；其他地点场景不得阻塞首屏。
- 当前目录不是 Git 仓库；每个任务以测试结果和 progress.md 记录作为检查点，不执行 Git 提交。

## File Structure

```text
package.json / vite.config.ts / tsconfig.json / index.html
src/main.tsx / src/App.tsx
src/styles/tokens.css / src/styles/global.css
src/game/types.ts / data.ts / rules.ts / reducer.ts / GameContext.tsx
src/dialogue/provider.ts / mockProvider.ts
src/components/icons/GameIcon.tsx
src/components/shell/TopHud.tsx / StoryRail.tsx / ContextRail.tsx / VillageMap.tsx
src/components/stage/GameStage.tsx / FarmStage.tsx / LocationStage.tsx
src/components/npc/NpcPortrait.tsx / NpcPanel.tsx / DialogueView.tsx
src/components/modals/ModalHost.tsx / TradeModal.tsx / QuestModal.tsx / RanchModal.tsx
src/components/modals/LibraryModal.tsx / HunterModal.tsx / HospitalModal.tsx
src/components/modals/MineModal.tsx / BattleModal.tsx / FishingModal.tsx / InventoryModal.tsx
src/components/feedback/ToastRegion.tsx
src/assets/pixel/village-map.webp / farm-dusk.webp / location-atlas.webp
src/**/*.test.ts(x)
```

---

### Task 1: 项目骨架与游戏规则内核

**Files:** Create `package.json`, Vite/TS config, `src/game/*`; test `src/game/rules.test.ts`, `reducer.test.ts`。

**Interfaces:** Produces `GameState`, `GameAction`, `LocationId`, `Npc`, `Plot`, `canSpendEnergy`, `calculateTradeTotal`, `elementAdvantage`, `gameReducer`。

- [x] 创建 React/Vite/Vitest 依赖和 jsdom 测试配置，脚本为 `dev`、`build`、`test`、`test:run`、`preview`。
- [x] 写失败测试：`canSpendEnergy({ energy: 0 }, 1)` 返回 `{ allowed:false, reason:'精力不足' }`；`calculateTradeTotal(65,3)` 为 195；水攻火为 1.5，火攻水为 0.75。
- [x] Run `npm run test:run -- src/game/rules.test.ts`，预期因模块不存在而 FAIL。
- [x] 定义完整 `GameState`；在 `data.ts` 写入 15 NPC、10 地点、6 作物、12 商品、4 委托、10 法术，不使用空数组代替内容。
- [x] 写 reducer 失败测试：合法 `SPEND_ENERGY` 将 5 变 4；精力为 0 时不变并产生中文错误 Toast。
- [x] 实现纯函数、reducer、initialGameState 和 GameContext。
- [x] Run `npm run test:run -- src/game/rules.test.ts src/game/reducer.test.ts`，预期 PASS；在 `progress.md` 记录结果。

### Task 2: 设计令牌、应用外壳与内部反馈

**Files:** Create `src/styles/*`, `src/App.tsx`, `GameIcon.tsx`, shell components, `ToastRegion.tsx` and tests。

**Interfaces:** Consumes `GameContext`; produces `<TopHud />`, `<StoryRail />`, `<ContextRail />`, `<ToastRegion />`。

- [x] 写 HUD 失败测试，验证“苔灯农场”“4 / 5”和 ID `hud-open-inventory`。
- [x] 在 `tokens.css` 固定规格主题色、4/8px 间距、12–32px 字号、44px 控件、阴影和 160/220/300ms 动效。
- [x] `App.tsx` 使用 header/main/aside/nav 与跳到主内容链接；实现完整日期、精力、金钱、五技能。
- [x] Toast 使用 `aria-live="polite"`，通知 ID `toast-{id}`，关闭 ID `toast-dismiss-{id}`。
- [x] Run `npm run test:run -- src/components/shell src/components/feedback && npm run build`，预期 PASS。

### Task 3: 像素资产、村庄地图和旅行流程

**Files:** Create three `src/assets/pixel/*.webp`, `VillageMap.tsx`, test。

**Interfaces:** Consumes locations/current location; produces 10 buttons `map-location-{locationId}`。

- [x] 使用 imagegen 生成：16:9 连续鸟瞰村庄地图（道路、河流、海岸、山体、10 地点、无文字/UI/水印）、可叠加 4×6 DOM 地块的暮色农场、包含商店街/魔女屋/矿洞/海岸的场景图集。
- [x] 用 `view_image` 检查连续性、无伪文字和非卡片网格；复制到 workspace 并转 WebP，不合格时只做一次针对性迭代。
- [x] 写失败测试，验证 10 个“前往”按钮和 `map-location-mine`。
- [x] 实现完整 `<img>` + 透明语义热区；hover/focus 才显示轮廓与浮签；移动端生成等价地点列表。
- [x] 实现旅行确认：路程、到达时间、营业、NPC；确认 ID `travel-confirm-{locationId}`，取消 ID `travel-cancel-{locationId}`。
- [x] Run `npm run test:run -- src/components/shell/VillageMap.test.tsx`，预期 PASS。

### Task 4: 农田舞台与作物操作

**Files:** Create `GameStage.tsx`, `FarmStage.tsx`, test。

**Interfaces:** Consumes `Plot[]`; produces 24 buttons `farm-plot-{row}-{column}` and plot dialog。

- [x] 写失败测试：24 个地块；点击“月铃萝卜，1日8小时”打开“地块详情”。
- [x] 实现 4×6 像素农田，每格显示作物、剩余时间、浇水 SVG、成熟文字或空地；禁止 emoji。
- [x] 实现代价预览：“浇水：0精力”“施肥：1份苔肥”“收获：预计3个”；不可执行时紧邻显示原因。
- [x] 实现 `WATER_PLOT`、`FERTILIZE_PLOT`、`HARVEST_PLOT` 状态更新。
- [x] Run `npm run test:run -- src/components/stage/FarmStage.test.tsx`，预期 PASS；reduced-motion 禁用成熟扫光。

### Task 5: NPC 关系、五类互动与 LLM 对话

**Files:** Create `LocationStage.tsx`, NPC components, dialogue provider/mock and tests。

**Interfaces:** `DialogueProvider.streamReply(input, signal): AsyncGenerator<DialogueChunk>`；portrait 使用 `portraitByAffinity[stage]`。

- [x] 写失败测试：`npc-action-chat-loran` 打开“与洛岚的灵犀对话”。
- [x] 实现立绘剪影降级态与交谈、赠礼、交易、提交任务、查看档案；不适用操作禁用并解释，不隐藏。
- [x] mock provider 为洛岚、黛芙、凛、潮音等提供不同中文语气，每 28ms 流出字符，支持 AbortSignal。
- [x] 聊天消耗 1 精力并记录当日好感；重复聊天不重复加好感。
- [x] 实现具体赠礼选择、任务物品检查和“她记得”标签；失败在面板内部展示。
- [x] Run `npm run test:run -- src/components/npc`，预期 PASS；停止流式回复后输入立即可用。

### Task 6: 统一模态与经营地点

**Files:** Create `ModalHost.tsx`, trade/quest/ranch/hunter/hospital/inventory modals and tests。

**Interfaces:** Consumes `activeModal`; produces root `modal-{type}` and focus return。

- [x] 写失败测试：打开“村民委托板”，按 Escape 关闭，焦点回到触发按钮。
- [x] ModalHost 实现标题、关闭、遮罩策略、Escape、焦点锁定、`aria-modal`、焦点归还。
- [x] TradeModal 实现购买/出售、数量步进、持有数、季节/成熟信息、总价/余额预览；QuestModal 填入 4 个具体委托。
- [x] RanchModal 先展示 2,800 金叶牧场合同，再展示史莱姆娘、蜂娘、岩羊娘、蘑菇娘与能力。
- [x] HunterModal 消耗 1 精力增加战斗经验；HospitalModal 每日一次花 180 金叶恢复 2 精力。
- [x] InventoryModal 实现道具筛选、技能收益、三类任务标签；任务物品不可出售并解释。
- [x] Run `npm run test:run -- src/components/modals/economy.test.tsx src/components/modals/locationActions.test.tsx`，预期 PASS。

### Task 7: 图书馆、矿洞、电梯和回合制战斗

**Files:** Create library/mine/battle modals; modify rules/reducer; tests。

**Interfaces:** Produces `LEARN_SPELL`, `ENTER_MINE_FLOOR`, `MINE_ORE`, `START_BATTLE`, `BATTLE_ACTION`, `PLAYER_DEFEATED`。

- [x] 写失败测试：当前等级可学“流火矢”，不可学“金雷裁决”；第5层电梯可用，第10层禁用。
- [x] 实现每系两个法术，显示等级、魔力、效果、克制和已学；学习消耗 1 精力。
- [x] 实现 5/10/15 安全电梯层、普通层怪物、全层挖矿、深层更高收益；进入消耗 1 精力。
- [x] 战斗显示双方状态、行动序列、物攻、五行法术、道具、防御、逃跑与具体日志；倍率固定 1.5/0.75。
- [x] 战败将日期加1、时间设06:30、精力恢复、回农场、医院次数重置，并显示“翌日苏醒”。
- [x] Run `npm run test:run -- src/components/modals/LibraryModal.test.tsx src/components/modals/MineModal.test.tsx src/components/modals/BattleModal.test.tsx`，预期 PASS。

### Task 8: 钓鱼、铁匠与魔女商店

**Files:** Create `FishingModal.tsx`; modify TradeModal; tests。

**Interfaces:** Produces `START_FISHING`, `CATCH_FISH`, `UPGRADE_TOOL`, `REFINE_ORE`。

- [x] 写失败测试：点击“开始钓鱼，消耗1精力”后能得到“银鳞鲫”和钓鱼经验反馈。
- [x] 实现水域/鱼饵选择与三段节奏条；命中绿色区得银鳞鲫，其他区得水草或空钩；reduced-motion 用静态时机选择。
- [x] 铁匠显示铜制锄、潮汐钓竿、矿镐升级树与精炼；魔女显示永久上限、恢复、五行伤害药剂。
- [x] Run `npm run test:run -- src/components/modals/FishingModal.test.tsx src/components/modals/specialShops.test.tsx`，预期 PASS。

### Task 9: 响应式、无障碍、性能和最终验证

**Files:** Modify global styles/App/all controls; create `src/accessibility.test.tsx`, `work/verification-report.md`。

**Interfaces:** Consumes all components; produces passing build/tests and visual report。

- [x] 写失败测试：收集全部 `[id]` 并验证唯一；spy 验证 `alert`/`confirm` 从未调用。
- [x] 1024px 保留三栏；768px 侧栏变抽屉；375px HUD 保留时间/精力/金钱/角色，地图有地点列表；全部主操作至少44px。
- [x] 完成 aria-label、模态焦点归还、地图 Tab 与 reduced-motion 下关闭位移/扫光/字符延迟。
- [x] Run `npm run test:run && npm run build`，预期全 PASS 和 production build 成功。
- [x] 在 1440×900、1024×768、768×1024、375×812 截图检查：无水平溢出、模态不出屏、地图连续、中文不裁切。
- [x] 运行 UI/UX Pro Max `--domain ux "animation accessibility z-index loading"`，将发现和修复写入验证报告。
- [x] 最终核对 10 地点、15 NPC、五技能、精力、双好感任务、五层电梯、全层挖矿、五行、图书馆、训练、钓鱼、医院、魔女和魔物娘牧场。

## Plan Self-Review

- 设计规格 1–13 节均映射到任务；没有遗漏地图位图、NPC 外部立绘、LLM 抽象或地点规则。
- 未出现 TBD、TODO、“稍后实现”或无内容模态。
- `GameState`、`DialogueProvider`、`elementAdvantage`、地点 ID 和 action 命名在生产/消费任务中一致。
- 子系统共享同一状态内核和舞台；拆为独立项目会破坏核心循环，因此以九个可独立测试任务作为边界。
