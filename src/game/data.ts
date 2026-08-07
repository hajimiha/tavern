import type { Crop, Location, Npc, Plot, Quest, ShopItem, Spell } from './types'

export const itemDisplayNames: Record<string, string> = {
  'moon-radish-seed': '月铃萝卜种子',
  'mist-bean-seed': '雾荚豆种子',
  'sun-wheat-seed': '夕照麦种子',
  'moon-radish': '月铃萝卜',
  'mist-bean': '雾荚豆',
  'sun-wheat': '夕照麦',
  moonflower: '月铃花',
  'silver-carp': '银鳞鲫',
  honey: '林蜜',
  mushroom: '月影菇',
  'slime-gel': '史莱姆凝胶',
  'berry-tart': '莓果挞',
}

export const affinityStageNames = {
  stranger: '初识', acquainted: '相识', trusted: '信赖', intimate: '亲密', bonded: '羁绊',
} as const

export const npcs: Npc[] = [
  { id: 'loran', name: '洛岚', role: '村长', locationId: 'mayor-home', description: '语气从容的村长，熟知雾灯谷每一条旧路。', availableActions: ['chat','gift','quest','profile'], preferredGifts: ['moonflower','amber-tea'], portraitByAffinity: {} },
  { id: 'freya', name: '芙蕾雅', role: '草药师', locationId: 'mayor-home', description: '负责村里的草药园，也会悄悄照料受伤的魔物。', availableActions: ['chat','gift','quest','profile'], preferredGifts: ['moss-herb','moonflower'], portraitByAffinity: {} },
  { id: 'mina', name: '弥奈', role: '风信使', locationId: 'mayor-home', description: '村长家的女儿，总是第一个听到远方的新鲜事。', availableActions: ['chat','gift','quest','profile'], preferredGifts: ['silver-carp','berry-tart'], portraitByAffinity: {} },
  { id: 'liuan', name: '柳安', role: '杂货店主', locationId: 'general-store', description: '擅长从每一枚铜板里找出最好用的种子。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['amber-tea','sun-wheat'], portraitByAffinity: {} },
  { id: 'taomi', name: '桃弥', role: '账房', locationId: 'general-store', description: '算盘快得像雨点，喜欢收集奇怪的旧票据。', availableActions: ['chat','gift','trade','profile'], preferredGifts: ['berry-tart','copper-ore'], portraitByAffinity: {} },
  { id: 'yanque', name: '岩雀', role: '铁匠', locationId: 'smithy', description: '沉默而可靠，打造的工具会留下羽纹火花。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['iron-ore','fire-potion'], portraitByAffinity: {} },
  { id: 'sera', name: '塞拉', role: '共生牧场店主', locationId: 'monster-market', description: '主张把魔物娘当作经营伙伴而非商品。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['moonflower','slime-gel'], portraitByAffinity: {} },
  { id: 'mira', name: '米菈', role: '育种师', locationId: 'monster-market', description: '能从脚印判断每一位伙伴今天的心情。', availableActions: ['chat','gift','trade','profile'], preferredGifts: ['moss-herb','honey'], portraitByAffinity: {} },
  { id: 'qiluo', name: '绮萝', role: '饲育员', locationId: 'monster-market', description: '会为不同种族调配带有星屑香味的饲料。', availableActions: ['chat','gift','trade','profile'], preferredGifts: ['amber-tea','mushroom'], portraitByAffinity: {} },
  { id: 'daifu', name: '黛芙', role: '五行魔女', locationId: 'witch-home', description: '住在林雾深处，出售药剂，也收藏失传法术。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['moonflower','mana-potion'], portraitByAffinity: {} },
  { id: 'rin', name: '凛', role: '猎人', locationId: 'hunter-camp', description: '负责标记魔物迁徙路线，训练从不拖泥带水。', availableActions: ['chat','gift','quest','profile'], preferredGifts: ['iron-ore','silver-carp'], portraitByAffinity: {} },
  { id: 'chaoyin', name: '潮音', role: '船主', locationId: 'fisher-home', description: '记得海湾里每一道潮汐的名字。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['amber-tea','moss-herb'], portraitByAffinity: {} },
  { id: 'xiye', name: '汐野', role: '钓师', locationId: 'fisher-home', description: '相信最好的鱼竿应该听得见水下的歌。', availableActions: ['chat','gift','trade','profile'], preferredGifts: ['silver-carp','honey'], portraitByAffinity: {} },
  { id: 'weina', name: '维娜', role: '医师', locationId: 'hospital', description: '诊断精准，但更在意病人有没有按时吃饭。', availableActions: ['chat','gift','trade','quest','profile'], preferredGifts: ['moss-herb','sun-wheat'], portraitByAffinity: {} },
  { id: 'sujin', name: '苏槿', role: '护理师', locationId: 'hospital', description: '准备的热敷草包能驱走矿洞最深处的寒气。', availableActions: ['chat','gift','profile'], preferredGifts: ['moonflower','berry-tart'], portraitByAffinity: {} },
]

export const locations: Location[] = [
  { id:'farm', name:'苔灯农场', subtitle:'南坡田区', description:'被旧石墙围住的初始农场，暮色里总有萤火贴着麦梢飞。', hours:'全天', travelMinutes:12, npcIds:[], mapPosition:{x:3,y:54,w:21,h:31}, category:'home' },
  { id:'mayor-home', name:'村长家', subtitle:'壁炉议事厅', description:'村民委托与季节会议的中心。', hours:'08:00–20:00', travelMinutes:20, npcIds:['loran','freya','mina'], mapPosition:{x:39,y:21,w:15,h:25}, category:'village' },
  { id:'general-store', name:'杂货店', subtitle:'风铃商行', description:'出售种子、材料并回收农产品。', hours:'09:00–18:00', travelMinutes:18, npcIds:['liuan','taomi'], mapPosition:{x:27,y:37,w:11,h:17}, category:'village' },
  { id:'smithy', name:'铁匠铺', subtitle:'羽火熔炉', description:'工具升级、精炼与装备修理。', hours:'10:00–19:00', travelMinutes:24, npcIds:['yanque'], mapPosition:{x:56,y:31,w:14,h:20}, category:'village' },
  { id:'monster-market', name:'魔物娘商店', subtitle:'林下共生所', description:'购买共生牧场、经营伙伴和饲料。', hours:'10:00–21:00', travelMinutes:28, npcIds:['sera','mira','qiluo'], mapPosition:{x:72,y:22,w:15,h:23}, category:'forest' },
  { id:'witch-home', name:'魔女之家', subtitle:'五曜药庐', description:'购买永久药剂、恢复药水和五行战斗道具。', hours:'12:00–23:00', travelMinutes:35, npcIds:['daifu'], mapPosition:{x:4,y:31,w:17,h:24}, category:'forest' },
  { id:'hunter-camp', name:'猎人帐篷', subtitle:'北林哨站', description:'消耗精力进行战斗训练与怪物研究。', hours:'06:00–22:00', travelMinutes:30, npcIds:['rin'], mapPosition:{x:29,y:5,w:12,h:16}, category:'forest' },
  { id:'mine', name:'矿洞', subtitle:'回声竖井', description:'逐层探索、挖矿并与魔物进行回合制战斗。', hours:'全天', travelMinutes:40, npcIds:[], mapPosition:{x:59,y:3,w:14,h:17}, category:'mountain' },
  { id:'fisher-home', name:'渔家', subtitle:'潮汐码头', description:'钓鱼并购买鱼竿和鱼饵。', hours:'05:30–20:00', travelMinutes:32, npcIds:['chaoyin','xiye'], mapPosition:{x:71,y:53,w:17,h:22}, category:'coast' },
  { id:'library', name:'图书馆', subtitle:'无声书塔', description:'学习不高于当前魔法等级的五行法术。', hours:'08:00–21:00', travelMinutes:22, npcIds:[], mapPosition:{x:25,y:53,w:12,h:23}, category:'village' },
  { id:'hospital', name:'医院', subtitle:'白槿诊所', description:'每日一次花钱恢复两点精力。', hours:'07:00–22:00', travelMinutes:19, npcIds:['weina','sujin'], mapPosition:{x:47,y:57,w:12,h:16}, category:'village' },
]

export const crops: Crop[] = [
  { id:'moon-radish', name:'月铃萝卜', season:'春', growthHours:56, sellPrice:90, color:'#b5a5d6', description:'成熟时根须会发出风铃般的轻响。' },
  { id:'sun-wheat', name:'夕照麦', season:'秋', growthHours:96, sellPrice:135, color:'#d5a64a', description:'麦芒会储存傍晚最后一束光。' },
  { id:'mist-bean', name:'雾荚豆', season:'春', growthHours:72, sellPrice:110, color:'#86b86d', description:'雨天收成更好的攀藤豆。' },
  { id:'ember-berry', name:'余烬莓', season:'秋', growthHours:120, sellPrice:185, color:'#c95d5d', description:'用于制作火属性药剂。' },
  { id:'tide-lotus', name:'潮汐莲', season:'夏', growthHours:144, sellPrice:220, color:'#5fa8bc', description:'只在浇水充足的地块开花。' },
  { id:'stone-pumpkin', name:'岩纹南瓜', season:'秋', growthHours:168, sellPrice:260, color:'#c07a42', description:'表皮坚硬，是铁匠喜爱的礼物。' },
]

export const shopItems: ShopItem[] = [
  { id:'moon-radish-seed', name:'月铃萝卜种子', category:'seed', price:38, sellPrice:18, description:'春季种子，成熟迅速。', season:'春', growthDays:3 },
  { id:'sun-wheat-seed', name:'夕照麦种子', category:'seed', price:62, sellPrice:30, description:'秋季谷物种子。', season:'秋', growthDays:4 },
  { id:'mist-bean-seed', name:'雾荚豆种子', category:'seed', price:55, sellPrice:26, description:'春季攀藤作物。', season:'春', growthDays:3 },
  { id:'moss-fertilizer', name:'苔肥', category:'material', price:80, sellPrice:35, description:'令作物提前八小时成熟。' },
  { id:'copper-ore', name:'铜矿石', category:'material', price:120, sellPrice:55, description:'工具升级的基础材料。' },
  { id:'iron-ore', name:'铁矿石', category:'material', price:210, sellPrice:95, description:'锻造可靠工具的矿石。' },
  { id:'reed-bait', name:'苇心鱼饵', category:'bait', price:25, sellPrice:10, description:'适合河湾常见鱼类。' },
  { id:'tide-rod', name:'潮汐钓竿', category:'tool', price:980, sellPrice:420, description:'扩大钓鱼时机判定区域。' },
  { id:'energy-tonic', name:'金盏恢复剂', category:'potion', price:260, sellPrice:110, description:'战斗中恢复生命。' },
  { id:'mana-potion', name:'蓝雾魔力剂', category:'potion', price:320, sellPrice:140, description:'战斗中恢复魔力。', element:'water' },
  { id:'fire-potion', name:'流火瓶', category:'potion', price:380, sellPrice:165, description:'造成火属性伤害。', element:'fire' },
  { id:'amber-tea', name:'琥珀茶', category:'gift', price:145, sellPrice:65, description:'多数村民都喜欢的温暖饮品。' },
]

export const quests: Quest[] = [
  { id:'q-mist-beans', title:'雾后新芽', issuerId:'freya', description:'为草药园带来三份雾荚豆。', requiredItemId:'mist-bean', requiredAmount:3, rewardMoney:420, rewardAffinity:18, mayorAffinity:6, expiresInDays:3, status:'active' },
  { id:'q-copper', title:'羽火试炉', issuerId:'yanque', description:'收集五块铜矿石测试新熔炉。', requiredItemId:'copper-ore', requiredAmount:5, rewardMoney:560, rewardAffinity:16, mayorAffinity:5, expiresInDays:4, status:'available' },
  { id:'q-carp', title:'逆潮的银光', issuerId:'chaoyin', description:'钓到两条银鳞鲫用于潮汐记录。', requiredItemId:'silver-carp', requiredAmount:2, rewardMoney:480, rewardAffinity:20, mayorAffinity:5, expiresInDays:2, status:'available' },
  { id:'q-moonflower', title:'月下回信', issuerId:'mina', description:'寻找一朵月铃花装进远行信件。', requiredItemId:'moonflower', requiredAmount:1, rewardMoney:300, rewardAffinity:24, mayorAffinity:8, expiresInDays:5, status:'available' },
]

export const spells: Spell[] = [
  { id:'metal-edge', name:'白锋术', element:'metal', requiredLevel:1, manaCost:3, power:7, kind:'damage', description:'凝聚一道金属薄刃。' },
  { id:'metal-thunder', name:'金雷裁决', element:'metal', requiredLevel:5, manaCost:9, power:22, kind:'damage', description:'召来金雷重击木属性目标。' },
  { id:'wood-vine', name:'缚根藤', element:'wood', requiredLevel:1, manaCost:3, power:6, kind:'damage', description:'藤根破土并削弱目标。' },
  { id:'wood-renew', name:'青芽回生', element:'wood', requiredLevel:3, manaCost:6, power:12, kind:'heal', description:'恢复生命并留下木灵护持。' },
  { id:'water-needle', name:'雨针', element:'water', requiredLevel:1, manaCost:2, power:5, kind:'damage', description:'凝结急速水针。' },
  { id:'water-tide', name:'逆潮环', element:'water', requiredLevel:4, manaCost:8, power:17, kind:'guard', description:'以水幕抵挡火焰。' },
  { id:'fire-arrow', name:'流火矢', element:'fire', requiredLevel:2, manaCost:4, power:10, kind:'damage', description:'发射燃烧的火矢。' },
  { id:'fire-bloom', name:'赤花燃', element:'fire', requiredLevel:4, manaCost:8, power:19, kind:'damage', description:'让火焰如花瓣依次绽开。' },
  { id:'earth-shield', name:'厚土盾', element:'earth', requiredLevel:1, manaCost:3, power:8, kind:'guard', description:'升起可吸收伤害的土墙。' },
  { id:'earth-fall', name:'坠岩印', element:'earth', requiredLevel:3, manaCost:7, power:15, kind:'damage', description:'召来压制水属性的岩印。' },
]

export const createInitialPlots = (): Plot[] => Array.from({ length: 24 }, (_, index) => {
  return {
    id:`plot-${Math.floor(index / 6) + 1}-${(index % 6) + 1}`,
    row:Math.floor(index / 6) + 1,
    column:(index % 6) + 1,
    watered:false,
    fertilized:false,
    ready:false,
  }
})
