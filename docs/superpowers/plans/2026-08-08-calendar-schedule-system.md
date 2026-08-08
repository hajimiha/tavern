# 雾灯谷日历、人物行程与消磨时间 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一年 365 天、十五位 NPC 动态行程、十二个节日、角色生日、世界书联动和精确消磨时间 UI。

**Architecture:** `src/game/calendar.ts` 是日期、节日和人物行程的唯一真相源；reducer 只通过中央时间推进函数改变年份、日序、分钟与每日状态。场景、HUD、岁时手册、存档和酒馆变量使用同一组纯函数，避免展示与模型叙事不一致。

**Tech Stack:** React 18、TypeScript 5.6、Vite 5、Vitest、Testing Library、Dexie、Phosphor Icons、现有纯 CSS 像素设计系统。

## Global Constraints

- 保持纯前端，不新增后端、服务器数据库或网络日历依赖。
- 一年固定 365 天；`year >= 1`、`day` 为 1–365、`minutes` 为 0–1439。
- 雾灯谷春季开年：1–3 月春、4–6 月夏、7–9 月秋、10–12 月冬。
- 所有结构图标使用 Phosphor SVG，不使用 emoji。
- 桌面与 390px 手机端都必须可用；触摸目标至少 44px，禁止横向页面溢出。
- 所有新增行为先写失败测试并确认红灯，再写生产代码。
- 每个独立任务完成后提交并推送 GitHub `main`。

---

### Task 1: 中央日历、生日、节日与人物行程领域模型

**Files:**
- Create: `src/game/calendar.ts`
- Create: `src/game/calendar.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/data.ts`

**Interfaces:**
- Produces: `MONTH_LENGTHS`, `festivals`, `npcSchedules`。
- Produces: `getCalendarDate(year, day)`, `getDayOfYear(month, date)`, `getSeasonForDay(day)`, `getWeekday(year, day)`, `formatGameDate(year, day)`, `getFestivalOnDay(day)`, `isNpcBirthday(npcId, day)`, `getNpcSchedule(npcId, year, day)`, `getNpcPresence(npcId, year, day, minutes)`, `getNpcsAtLocation(locationId, year, day, minutes)`。
- `Npc` 新增 `birthday: { month: number; day: number }`。
- Adds `ScheduleSegment`, `FestivalActivity`, `Festival`, `NpcDailySchedule` 类型。

- [x] **Step 1: 写日期换算和季节失败测试**

```ts
expect(getCalendarDate(1, 1)).toMatchObject({ year: 1, month: 1, date: 1, season: '春', weekday: '周一' })
expect(getCalendarDate(1, 60)).toMatchObject({ month: 3, date: 1, season: '春' })
expect(getCalendarDate(2, 1).weekday).toBe('周二')
expect(getDayOfYear(12, 31)).toBe(365)
```

- [x] **Step 2: 运行 `pnpm vitest run src/game/calendar.test.ts --environment jsdom` 并确认因模块不存在失败**

- [x] **Step 3: 实现日期纯函数与类型**

```ts
export const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export function getSeasonForDay(day: number): Season {
  const { month } = getMonthAndDate(day)
  if (month <= 3) return '春'
  if (month <= 6) return '夏'
  if (month <= 9) return '秋'
  return '冬'
}
```

- [x] **Step 4: 写十二节日、十五生日和动态行程失败测试**

```ts
expect(festivals).toHaveLength(12)
expect(festivals.every((festival) => festival.activities.length === 3)).toBe(true)
expect(new Set(npcs.map((npc) => `${npc.birthday.month}-${npc.birthday.day}`)).size).toBe(15)
expect(getNpcPresence('liuan', 1, 1, 10 * 60).locationId).toBe('general-store')
expect(getNpcPresence('liuan', 1, 1, 19 * 60).locationId).toBe('library')
const festivalDay = getDayOfYear(1, 12)
expect(getNpcPresence('loran', 1, festivalDay, 19 * 60).locationId).toBe('mayor-home')
```

- [x] **Step 5: 实现十五份日程与十二份节日数据**

每份日程必须覆盖 0–1440，无重叠、无空洞；柳安傍晚去图书馆，芙蕾雅有医院草药照护变体，弥奈有猎人帐篷递信变体，桃弥去图书馆查旧账，岩雀去矿洞验矿，塞拉、米菈和绮萝在共生所与农场间移动，黛芙去图书馆研究，凛去矿洞巡查，潮音与汐野在码头和图书馆间移动，维娜与苏槿在医院和村长家间移动。

节日固定为：1/12 迎岁灯会、2/18 潮信祭、3/20 播种祭、4/16 林铃花会、5/12 风筝讯使节、6/21 长昼渔火祭、7/7 星河许愿夜、8/15 月穗丰收会、9/9 羽火锻造祭、10/31 薄雾巡游、11/16 回声矿灯祭、12/31 守夜落雪宴。

- [x] **Step 6: 运行日历测试并确认全部通过**

- [x] **Step 7: 提交并推送**

```powershell
git add src/game/calendar.ts src/game/calendar.test.ts src/game/types.ts src/game/data.ts
git commit -m "feat: 建立雾灯谷日历与人物行程"
git push origin main
```

### Task 2: 统一时间推进、跨日状态与存档迁移

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/reducer.ts`
- Modify: `src/game/reducer.test.ts`
- Modify: `src/game/game-save-storage.ts`
- Modify: `src/game/game-save-storage.test.ts`

**Interfaces:**
- Consumes: Task 1 日期函数。
- Produces: `GameState.year`、`ADVANCE_TIME` action。
- Produces: `advanceGameClock(state, elapsedMinutes)`，供旅行、消磨时间与战败复苏复用。

- [x] **Step 1: 写旅行跨午夜和多日推进失败测试**

```ts
const crossed = gameReducer({ ...initialGameState, minutes: 23 * 60 + 50 }, { type: 'TRAVEL_TO_LOCATION', location: 'library', minutes: 20 })
expect(crossed).toMatchObject({ year: 1, day: 2, minutes: 10, weekday: '周二', energy: 5 })

const later = gameReducer({ ...initialGameState, energy: 1, hospitalUsedToday: true }, { type: 'ADVANCE_TIME', minutes: 2 * 1440 + 90, reason: '整理农场手记' })
expect(later).toMatchObject({ day: 3, minutes: 480, energy: 5, hospitalUsedToday: false })
expect(later.relationships.loran.chattedToday).toBe(false)
```

- [x] **Step 2: 运行 reducer 定向测试并确认红灯**

- [x] **Step 3: 实现中央推进并让旅行、战败调用它**

```ts
function advanceGameClock(state: GameState, elapsedMinutes: number): GameState {
  const total = state.minutes + elapsedMinutes
  const crossedDays = Math.floor(total / 1440)
  const absoluteDay = (state.year - 1) * 365 + (state.day - 1) + crossedDays
  const year = Math.floor(absoluteDay / 365) + 1
  const day = absoluteDay % 365 + 1
  return { ...state, year, day, minutes: total % 1440, season: getSeasonForDay(day), weekday: getWeekday(year, day) }
}
```

跨日时重置 `chattedToday`、`giftedToday`、`hospitalUsedToday`，恢复精力，并保持作物按 `elapsedMinutes` 推进。`ADVANCE_TIME` 成功只添加一条“时间流逝”通知。

- [x] **Step 4: 写生日赠礼与非生日赠礼失败测试**

```ts
const birthday = getDayOfYear(npcs.find((npc) => npc.id === 'liuan')!.birthday.month, npcs.find((npc) => npc.id === 'liuan')!.birthday.day)
const result = gameReducer({ ...seededGiftState, day: birthday }, { type: 'GIVE_GIFT', npcId: 'liuan', itemId: 'amber-tea', affinity: 14 })
expect(result.relationships.liuan.affinity).toBe(28)
```

- [x] **Step 5: 实现生日双倍收益和通知文案**

- [x] **Step 6: 写旧存档迁移与异常日期净化失败测试**

```ts
expect(parseGameSave(JSON.stringify({ schemaVersion: 1, savedAt: 1, state: initialGameState }))?.state.year).toBe(1)
expect(sanitizeGameState({ ...initialGameState, year: -2, day: 999, minutes: 99999 })).toMatchObject({ year: 1, day: 365, minutes: 1439 })
```

- [x] **Step 7: 实现 `year` 迁移、日期钳制和派生字段修复**

- [x] **Step 8: 运行 reducer 与存档测试并确认通过**

- [x] **Step 9: 提交并推送**

```powershell
git add src/game/types.ts src/game/reducer.ts src/game/reducer.test.ts src/game/game-save-storage.ts src/game/game-save-storage.test.ts
git commit -m "feat: 统一跨日时间推进与存档迁移"
git push origin main
```

### Task 3: 动态 NPC 在场、HUD 日历入口与生日档案

**Files:**
- Modify: `src/components/stage/LocationStage.tsx`
- Modify: `src/components/shell/ContextRail.tsx`
- Modify: `src/components/shell/TopHud.tsx`
- Modify: `src/components/npc/NpcPanel.tsx`
- Create: `src/components/stage/LocationStage.test.tsx`
- Modify: `src/components/npc/NpcPanel.test.tsx`
- Modify: `src/components/shell/TopHud.test.tsx`
- Modify: `src/components/icons/GameIcon.tsx`

**Interfaces:**
- Consumes: `getNpcsAtLocation`, `getCalendarDate`, `getNpcPresence`, `isNpcBirthday`。
- Produces: HUD `calendar` modal opener and correct live presence rendering。

- [x] **Step 1: 写非工作时段 NPC 不在常驻地点、休闲地点可见的失败组件测试**

```tsx
renderAt({ location: 'general-store', minutes: 19 * 60 })
expect(screen.queryByText('柳安')).not.toBeInTheDocument()
renderAt({ location: 'library', minutes: 19 * 60 })
expect(screen.getByText('柳安')).toBeInTheDocument()
```

- [x] **Step 2: 运行场景定向测试并确认静态 `npcIds` 导致失败**

- [x] **Step 3: 替换 `LocationStage` 与 `ContextRail` 的静态在场判断**

- [x] **Step 4: 写 HUD 日历入口与人物生日档案失败测试**

```tsx
expect(screen.getByRole('button', { name: /打开岁时手册/ })).toHaveTextContent('06:30')
expect(screen.getByText(/生日/)).toHaveTextContent('4月12日')
```

- [x] **Step 5: 把 HUD 时钟改为按钮，增加 `calendar`、`birthday`、`festival`、`hourglass` 和 `location` 图标映射，并在人物档案展示生日、当前行程和生日赠礼加成**

- [x] **Step 6: 运行 `pnpm vitest run src/components/stage/LocationStage.test.tsx src/components/npc/NpcPanel.test.tsx src/components/shell/TopHud.test.tsx --environment jsdom` 并确认通过**

- [ ] **Step 7: 提交并推送**

```powershell
git add src/components/stage/LocationStage.tsx src/components/stage/LocationStage.test.tsx src/components/shell/ContextRail.tsx src/components/shell/TopHud.tsx src/components/shell/TopHud.test.tsx src/components/npc/NpcPanel.tsx src/components/npc/NpcPanel.test.tsx src/components/icons/GameIcon.tsx
git commit -m "feat: 让人物按日程动态出现在村庄"
git push origin main
```

### Task 4: 岁时手册月历、人物行程与消磨时间 UI

**Files:**
- Create: `src/components/modals/CalendarModal.tsx`
- Create: `src/components/modals/CalendarModal.test.tsx`
- Modify: `src/components/modals/ModalHost.tsx`
- Modify: `src/game/types.ts`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Task 1 calendar API and Task 2 `ADVANCE_TIME`。
- Produces: `calendar` managed modal with tabs `month`, `schedule`, `pass-time`。

- [ ] **Step 1: 写月历事件、生日标记和标签切换失败测试**

```tsx
expect(screen.getByRole('heading', { name: '岁时手册' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /1月12日.*迎岁灯会/ })).toBeInTheDocument()
expect(screen.getByText('洛岚的生日')).toBeInTheDocument()
await user.click(screen.getByRole('tab', { name: '人物行程' }))
expect(screen.getByText('当前所在')).toBeInTheDocument()
```

- [ ] **Step 2: 运行组件测试并确认模态不存在**

- [ ] **Step 3: 实现月历和人物行程标签**

月历使用语义化 `table`/`grid` 结构、七列星期标题、日期按钮和文字型事件详情；人物行程使用角色选择器与完整纵向时间轴，当前段设置 `aria-current="time"`。

- [ ] **Step 4: 写两种时间推进表单失败测试**

```tsx
await user.click(screen.getByRole('tab', { name: '消磨时间' }))
await user.clear(screen.getByLabelText('目标时间'))
await user.type(screen.getByLabelText('目标时间'), '08:15')
expect(screen.getByText(/目标：第一年1月2日 08:15/)).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: '确认消磨时间' }))
expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'ADVANCE_TIME', minutes: expect.any(Number) }))
```

- [ ] **Step 5: 实现指定时刻和持续时长受控表单**

指定时刻早于或等于当前时间时跳到次日；持续时长支持 0–365 天、0–23 小时、0–59 分钟且总时长必须大于零。战斗存在时按钮禁用并显示原因。日期详情在节日当天提供“前往会场”按钮。

- [ ] **Step 6: 添加精细像素月历样式与响应式布局**

桌面双栏、手机单列；所有日期按钮、标签和提交按钮高度至少 44px；事件、生日和今天同时存在时用图标加文字/边框区分，不只依赖颜色；动效只使用 `opacity` 与 `transform`。

- [ ] **Step 7: 运行 CalendarModal、ModalHost 与 TopHud 测试并确认通过**

- [ ] **Step 8: 提交并推送**

```powershell
git add src/components/modals/CalendarModal.tsx src/components/modals/CalendarModal.test.tsx src/components/modals/ModalHost.tsx src/game/types.ts src/styles/global.css
git commit -m "feat: 添加岁时手册与消磨时间界面"
git push origin main
```

### Task 5: 岁时世界书与实时酒馆时间上下文

**Files:**
- Modify: `src/sillytavern/defaults.ts`
- Modify: `src/sillytavern/defaults.test.ts`
- Modify: `src/sillytavern/prompt-assembler.ts`
- Modify: `src/sillytavern/prompt-assembler.test.ts`
- Modify: `src/components/SillyTavern/TavernDialogue.tsx`
- Modify: `src/components/SillyTavern/TavernDialogue.test.tsx`

**Interfaces:**
- Consumes: festivals, birthdays, schedule summaries and live presence functions。
- Produces: third default lorebook `mistvale-calendar-festivals` and expanded dialogue variables。

- [ ] **Step 1: 写默认岁时世界书失败测试**

```ts
const defaults = createMistvaleDefaults()
const calendarBook = defaults.lorebooks.find((book) => book.id === 'mistvale-calendar-festivals')
expect(calendarBook?.entries.filter((entry) => entry.id.startsWith('mistvale-festival-'))).toHaveLength(12)
expect(calendarBook?.entries.find((entry) => entry.comment === '迎岁灯会')?.content).toContain('点灯祈愿')
expect(defaults.characters.find((card) => card.npcId === 'liuan')?.lorebookIds).toContain('mistvale-calendar-festivals')
```

- [ ] **Step 2: 运行 defaults 测试确认红灯**

- [ ] **Step 3: 生成岁时世界书并把生日、行程摘要写入人物档案**

- [ ] **Step 4: 写变量值触发节日世界书的失败测试**

```ts
const result = assemblePrompt({ ...baseOptions, userInput: '今天有什么安排？', extraVariables: { currentFestival: '迎岁灯会' } })
expect(result.matchedEntries.some((match) => match.entry.comment === '迎岁灯会')).toBe(true)
```

- [ ] **Step 5: 把 `variables` 与 `extraVariables` 的字符串值加入 `scanText`，保持唯一条目与既有排序逻辑**

- [ ] **Step 6: 扩展 TavernDialogue 变量**

每次打开与发送都注入 `year`、`dayOfYear`、`date`、`time`、`weekday`、`season`、`weather`、`currentFestival`、`npcLocation`、`npcActivity`，同时保留现有金币、精力、好感和位置变量。

- [ ] **Step 7: 运行 defaults、prompt assembler 与 dialogue 测试并确认通过**

- [ ] **Step 8: 提交并推送**

```powershell
git add src/sillytavern/defaults.ts src/sillytavern/defaults.test.ts src/sillytavern/prompt-assembler.ts src/sillytavern/prompt-assembler.test.ts src/components/SillyTavern/TavernDialogue.tsx src/components/SillyTavern/TavernDialogue.test.tsx
git commit -m "feat: 将岁时庆典接入世界书与模型上下文"
git push origin main
```

### Task 6: 通知队列、全量回归和桌面/手机验收

**Files:**
- Modify: `src/components/feedback/ToastRegion.tsx`
- Modify: `src/components/feedback/ToastRegion.test.tsx`
- Modify: `src/game/reducer.ts`
- Modify: `src/game/reducer.test.ts`
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Interfaces:**
- Produces: 最多三条可见通知、每条挂载后 2 秒独立自动关闭、连续同内容去重。

- [ ] **Step 1: 写通知可见上限、自动关闭与 reducer 去重失败测试**

```tsx
expect(screen.getAllByRole('article')).toHaveLength(3)
vi.advanceTimersByTime(2000)
expect(dispatch).toHaveBeenCalledWith({ type: 'DISMISS_TOAST', id: 'notice-1' })
```

```ts
const once = gameReducer(state, repeatedToastAction)
const twice = gameReducer(once, repeatedToastAction)
expect(twice.toasts).toHaveLength(1)
```

- [ ] **Step 2: 运行通知测试并确认截图中的无限堆叠问题可复现**

- [ ] **Step 3: 实现去重、最多三条渲染和 2 秒自动退出**

为每条 toast 使用独立的子组件计时器，计时 effect 只依赖该 toast 的 `id` 与稳定 `dispatch`；新 toast 加入时不能重新启动已显示 toast 的 2 秒计时器。组件卸载时清理自己的 timeout。

- [ ] **Step 4: 运行定向测试、`pnpm test:run`、`pnpm build` 和 `git diff --check`**

- [ ] **Step 5: 启动本地 Vite，使用真实 Edge/Playwright 验证 1440×1000 与 390×844**

验收操作：打开岁时手册、切换三标签、查看节日和生日、选择 NPC 行程、精确跳到下一天 08:15、刷新确认日期保留；记录页面错误、横向溢出、重复 ID 和不可达控件，结果必须全部为零。

- [ ] **Step 6: 更新 README 与计划文档，记录测试数量和浏览器结果**

- [ ] **Step 7: 请求代码审查并修复所有 Critical/Important 问题**

- [ ] **Step 8: 最终提交并推送**

```powershell
git add README.md task_plan.md findings.md progress.md src/components/feedback/ToastRegion.tsx src/components/feedback/ToastRegion.test.tsx src/game/reducer.ts src/game/reducer.test.ts
git commit -m "feat: 完成日历行程系统与通知体验"
git push origin main
```
