import { useGame } from '../../game/GameContext'

const partners = [
  { id: 'slime', name: '史莱姆娘', price: 900, ability: '每天产出黏液凝胶，可替代基础肥料材料。' },
  { id: 'bee', name: '蜂娘', price: 1280, ability: '为相邻作物授粉，收获数量有概率增加。' },
  { id: 'rock-goat', name: '岩羊娘', price: 1600, ability: '每两日寻回随机矿石，挖矿等级提高稀有度。' },
  { id: 'mushroom', name: '蘑菇娘', price: 1180, ability: '雨后培育药用菌菇，适合制作恢复药剂。' },
]

export function RanchModal() {
  const { state, dispatch } = useGame()
  return <div className="ranch-content">{!state.ownsMonsterRanch ? <section className="ranch-contract"><span>林下共生协议 · 第一阶段</span><h3>雾苔共生牧场</h3><p>解锁独立饲育区、伙伴起居室与每日产物记录。购买牧场后才能邀请魔物娘经营伙伴。</p><dl><div><dt>合同价格</dt><dd>2,800 金币</dd></div><div><dt>初始栏位</dt><dd>4 位伙伴</dd></div><div><dt>维护费用</dt><dd>每日 0 金币</dd></div></dl><button id="ranch-buy-contract" className="primary-button" type="button" disabled={state.money < 2800} onClick={() => dispatch({ type: 'BUY_RANCH' })}>签署牧场合同</button>{state.money < 2800 && <div className="inline-warning">还差 {2800 - state.money} 金币。</div>}</section> : <p className="ranch-owned-banner">牧场合同已经生效，可以邀请经营伙伴。</p>}<div className="partner-grid">{partners.map((partner) => <article key={partner.id}><span className="partner-sigil" aria-hidden="true"><i /></span><h3>{partner.name}</h3><p>{partner.ability}</p><footer><strong>{partner.price} 金币</strong><button id={`ranch-partner-${partner.id}`} type="button" disabled={!state.ownsMonsterRanch}>{state.ownsMonsterRanch ? '邀请伙伴' : '需先购买牧场'}</button></footer></article>)}</div></div>
}
