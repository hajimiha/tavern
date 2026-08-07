import { useGame } from '../../game/GameContext'

const tools = [
  { id: 'hoe' as const, name: '农耕锄', base: 720, benefit: '浇灌范围与耕作效率提升' },
  { id: 'rod' as const, name: '潮汐钓竿', base: 860, benefit: '绿色收竿区域进一步扩大' },
  { id: 'pickaxe' as const, name: '矿镐', base: 920, benefit: '深层矿脉产量与稀有率提升' },
]

export function SpecialShopPanel() {
  const { state, dispatch } = useGame()
  if (state.location === 'smithy') return <section className="special-shop forge-panel"><header><div><span>羽火熔炉</span><h3>工具升级与矿石精炼</h3></div><small>岩雀会保留原工具的使用痕迹</small></header><div className="upgrade-tree">{tools.map((tool) => { const level = state.tools[tool.id]; const price = tool.base + (level - 1) * 280; return <article key={tool.id}><span>等级 {level}</span><strong>{tool.name}</strong><p>{tool.benefit}</p><button id={`forge-upgrade-${tool.id}`} type="button" aria-label={`升级${tool.name}到等级${level + 1}，花费${price}金币`} disabled={level >= 4 || state.money < price} onClick={() => dispatch({ type: 'UPGRADE_TOOL', tool: tool.id, price })}>{level >= 4 ? '已经满级' : `${price} 金币升级`}</button></article>})}<article className="refine-card"><span>3 : 1</span><strong>铜矿精炼</strong><p>将 3 块铜矿石精炼为 1 块铁矿石。</p><button id="forge-refine-copper" type="button" aria-label="精炼铜矿石，消耗3块铜矿石" disabled={(state.inventory['copper-ore'] ?? 0) < 3} onClick={() => dispatch({ type: 'REFINE_ORE' })}>精炼 · 持有 {state.inventory['copper-ore'] ?? 0}</button></article></div></section>
  if (state.location === 'witch-home') return <section className="special-shop witch-panel"><header><div><span>五曜药庐 · 永久药剂</span><h3>扩展身体与灵脉的容器</h3></div><small>永久药剂可以重复购买，价格保持不变</small></header><div className="permanent-potions"><article><span className="potion-bottle energy" aria-hidden="true"><i /></span><div><strong>金盏恒息药</strong><p>最大精力永久 +1，同时恢复 1 点精力。</p><small>当前上限 {state.maxEnergy}</small></div><button id="witch-buy-max-energy" type="button" aria-label="购买金盏恒息药，花费1200金币" disabled={state.money < 1200} onClick={() => dispatch({ type: 'BUY_PERMANENT_UPGRADE', upgrade: 'energy', price: 1200 })}>1,200 金币</button></article><article><span className="potion-bottle mana" aria-hidden="true"><i /></span><div><strong>蓝雾扩容药</strong><p>最大魔力永久 +3，同时恢复 3 点魔力。</p><small>当前上限 {state.stats.maxMana}</small></div><button id="witch-buy-max-mana" type="button" aria-label="购买蓝雾扩容药，花费1050金币" disabled={state.money < 1050} onClick={() => dispatch({ type: 'BUY_PERMANENT_UPGRADE', upgrade: 'mana', price: 1050 })}>1,050 金币</button></article></div></section>
  return null
}
