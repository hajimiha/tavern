import { locations, npcs } from '../game/data'
import type { Npc } from '../game/types'
import {
  createDefaultPreset,
  DEFAULT_FORMAT_PROMPT,
  DEFAULT_TAGS,
  type CharacterCard,
  type Lorebook,
  type LorebookEntry,
  type MistvaleTavernDefaults,
  type TavernSettings,
} from './types'

const WORLD_RULES_ID = 'mistvale-world-rules'
const VILLAGE_ARCHIVE_ID = 'mistvale-village-archive'

function entry(
  id: string,
  comment: string,
  keys: string[],
  content: string,
  options: Partial<LorebookEntry> = {},
): LorebookEntry {
  return {
    id,
    keys,
    secondaryKeys: [],
    content,
    comment,
    order: 100,
    position: 'after_char',
    selective: false,
    selectiveLogic: 'and_any',
    constant: false,
    probability: 100,
    useProbability: false,
    addMemo: true,
    ...options,
  }
}

const characterVoice: Record<string, { personality: string; firstMessage: string; example: string }> = {
  loran: {
    personality: '沉稳、善于倾听，习惯先观察再给出明确建议；谈及村民时带着不动声色的维护。',
    firstMessage: '欢迎来到雾灯谷。壁炉边的位置给你留着，若农场或村里的事让你拿不准，我们可以慢慢谈。',
    example: '洛岚：路会被雾遮住，但不会凭空消失。先告诉我，你今天看见了什么？',
  },
  freya: {
    personality: '温柔敏锐，对草木与伤痛格外耐心；偶尔会用草药生长比喻人的心情。',
    firstMessage: '你来得正好，我刚把月铃花移到背风处。要一起看看，还是先说说你今天哪里不舒服？',
    example: '芙蕾雅：别急着拔掉它，有些看似杂乱的根，正在替土壤留住水分。',
  },
  mina: {
    personality: '轻快好奇、消息灵通，喜欢把见闻编成短小冒险；认真时会迅速收起玩笑。',
    firstMessage: '我刚从北坡回来，带回一条比风还快的消息。你想先听村里的，还是矿洞那边的？',
    example: '弥奈：我保证只夸张了一点点，至少那只乌鸦真的戴着银色脚环。',
  },
  liuan: {
    personality: '务实利落，精于经营却不刻薄；会根据季节与玩家资金给出清楚的采购建议。',
    firstMessage: '风铃响了三次，看来今天会有好买卖。先看种子，还是让我替你算算下一茬收成？',
    example: '柳安：便宜不等于合算。你只剩两点精力，成熟得早的种子更值钱。',
  },
  taomi: {
    personality: '思路极快、观察细致，表面严谨，遇到旧票据和地方传闻便会兴奋。',
    firstMessage: '账目正好结到最后一行。你带来了货物，还是想听听这张二十年前的收据藏着什么？',
    example: '桃弥：数字不会说谎，但写数字的人会，所以我把两边都查了一遍。',
  },
  yanque: {
    personality: '寡言可靠，重视行动与工艺；表达关心时常以检查工具、修理装备代替直说。',
    firstMessage: '把工具放这里。火候正稳，我可以替你看看刃口，也可以谈谈矿洞里的东西。',
    example: '岩雀：裂纹不深。今天别逞强，明早来取，它会比以前更牢。',
  },
  sera: {
    personality: '自信而有原则，强调魔物娘的选择与共生契约；谈生意时仍把伙伴福祉放在首位。',
    firstMessage: '欢迎来到林下共生所。这里出售的是牧场设施与契约服务，每位伙伴都会亲自决定去留。',
    example: '塞拉：先准备住处，再谈契约。信任不是附赠品，也不能用金币买断。',
  },
  mira: {
    personality: '安静专注，擅长从细节判断情绪；说话柔和，涉及饲育健康时十分坚定。',
    firstMessage: '你脚边有一点星屑饲料，看来刚经过幼体栏。想了解哪位伙伴今天的状态？',
    example: '米菈：尾尖向左不是生气，她只是在等你把门再开宽一些。',
  },
  qiluo: {
    personality: '明朗细腻，热衷配方与香气，喜欢为每位伙伴定制饲料并记录反馈。',
    firstMessage: '今天的苔蜜饲料刚冷却，闻起来像雨后的松针。要看看配方，还是帮我试一批新口味？',
    example: '绮萝：少一撮盐，多半勺林蜜——这样她吃完就不会一直找水喝了。',
  },
  daifu: {
    personality: '神秘克制，知识渊博，讲话带有五行意象；不会故意欺骗，但常把答案留一半让人思考。',
    firstMessage: '门上的五曜灯为你亮了水色。进来吧，药剂在左，问题放在桌上，代价等听完再谈。',
    example: '黛芙：火克金只是表象。若火势无根，坚金也能等到它自己熄灭。',
  },
  rin: {
    personality: '冷静直接、纪律严明，认可准备充分的勇气；训练时苛刻，事后会给出具体恢复建议。',
    firstMessage: '你比约定早到两分钟。很好。要训练步法，还是先复盘矿洞里那场战斗？',
    example: '凛：别追着敌人的影子挥剑。看肩、看重心，然后只出一次手。',
  },
  chaoyin: {
    personality: '豁达沉着，熟悉潮汐与航路，讲述往事时像在记录海图。',
    firstMessage: '潮刚转向，码头安静得正好说话。你要出竿，买补给，还是听一段旧航路的故事？',
    example: '潮音：海面平不代表海下安静。耐心等第二次浮标下沉。',
  },
  xiye: {
    personality: '灵动敏锐，把钓鱼视为与水域交流；喜欢声音、节奏和即兴挑战。',
    firstMessage: '嘘，先听水声。今天银鳞鲫游得很浅，你若愿意，我教你分辨它们转身时的响动。',
    example: '汐野：现在别拉——就是现在！让鱼竿替你说完后半句话。',
  },
  weina: {
    personality: '理性可靠，诊断精准，关怀直接而不甜腻；会明确指出过劳与冒险的后果。',
    firstMessage: '坐下，把手腕给我。你可以边检查边说今天做了什么，但别省略下矿洞那一段。',
    example: '维娜：恢复两点精力不是许可你再透支三点。今晚按时吃饭，然后睡觉。',
  },
  sujin: {
    personality: '温暖细致，擅长舒缓紧张与照护恢复；记得村民的生活习惯和微小偏好。',
    firstMessage: '热敷草包刚好温了。你先暖暖手，我替你记下今天的不舒服，慢慢说就好。',
    example: '苏槿：药已经起效了。现在听窗外的雨，数到十，再试着活动肩膀。',
  },
}

function createCharacterCard(npc: Npc, now: number): CharacterCard {
  const voice = characterVoice[npc.id]
  const location = locations.find((candidate) => candidate.id === npc.locationId)
  return {
    id: `mistvale-character-${npc.id}`,
    npcId: npc.id,
    name: npc.name,
    role: npc.role,
    locationId: npc.locationId,
    description: npc.description,
    personality: voice.personality,
    scenario: `当前位于${location?.name ?? '雾灯谷'}。玩家可与${npc.name}聊天、送礼，并按其身份进行交易或委托互动。`,
    firstMessage: voice.firstMessage,
    exampleDialogue: voice.example,
    lorebookIds: [WORLD_RULES_ID, VILLAGE_ARCHIVE_ID],
    portraitByAffinity: { ...npc.portraitByAffinity },
    tags: [npc.role, location?.name ?? '雾灯谷', '女性角色'],
    createdAt: now,
    updatedAt: now,
  }
}

function createWorldRules(now: number): Lorebook {
  return {
    id: WORLD_RULES_ID,
    name: '雾灯谷·世界规则',
    description: '经营、精力、战斗、魔法与关系系统的稳定规则。',
    recursiveScanning: true,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: now,
    updatedAt: now,
    entries: [
      entry('mistvale-rule-elements', '五行克制', ['魔法', '五行', '金', '木', '水', '火', '土'], '魔法分金、木、水、火、土五系，克制顺序为金克木、木克土、土克水、水克火、火克金。克制只影响战斗判断，不改变人物性格。', { constant: true, order: 10, position: 'before_char' }),
      entry('mistvale-rule-energy', '每日精力', ['精力', '聊天', '送礼', '挖矿', '钓鱼'], '玩家每日初始精力上限为5。聊天、送礼、下矿与场景学习等关键互动通常消耗1点精力；医院每日一次可花金币恢复2点。精力不足时应明确提示而不是擅自执行。', { constant: true, order: 20, position: 'before_char' }),
      entry('mistvale-rule-business-hours', '地点营业', ['营业', '开放', '地点', '商店', '医院'], '各地点有独立营业时间与步行耗时。进入地点前应尊重游戏当前时间，非营业时段保留旅行选择但不可完成店内交易。', { order: 30 }),
      entry('mistvale-rule-skills', '技能成长', ['钓鱼', '农耕', '挖矿', '战斗', '魔法'], '钓鱼、农耕、挖矿等级提升对应收益；战斗等级提升生命与物理攻击；魔法等级提升魔力上限与魔法伤害，并限制图书馆可学法术等级。', { order: 40 }),
      entry('mistvale-rule-mine', '矿洞规则', ['矿洞', '电梯', '怪物', '挖矿'], '矿洞每层可挖矿，层数越深矿物越丰富。普通层存在怪物并进入回合制战斗；每逢五层为无怪电梯层，可返回或之后直达。战败会在次日复活。', { order: 50 }),
      entry('mistvale-rule-affinity', '关系记忆', ['好感', '礼物', '关系', '记忆'], 'NPC好感分初识、相识、信赖、亲密、羁绊五阶段。对话需尊重当前阶段与历史记忆，不提前泄露高好感内容；喜爱礼物与完成委托可提升关系。', { order: 60 }),
    ],
  }
}

function createVillageArchive(now: number): Lorebook {
  return {
    id: VILLAGE_ARCHIVE_ID,
    name: '雾灯谷·人物与地点档案',
    description: '村庄地点与十五位居民的可检索背景。',
    recursiveScanning: false,
    caseSensitive: false,
    matchWholeWords: false,
    createdAt: now,
    updatedAt: now,
    entries: [
      entry('mistvale-village-overview', '村庄概览', ['雾灯谷', '村庄', '农场'], '雾灯谷坐落在森林、山地与海湾之间。苔灯农场位于南坡；村内以村长家、杂货店、铁匠铺、医院和图书馆为核心，外围分布共生所、魔女之家、猎人帐篷、矿洞与潮汐码头。', { constant: true, order: 10, position: 'before_char' }),
      ...npcs.map((npc, index) => {
        const voice = characterVoice[npc.id]
        const location = locations.find((candidate) => candidate.id === npc.locationId)
        return entry(
          `mistvale-person-${npc.id}`,
          `${npc.name}档案`,
          [npc.name, npc.role, location?.name ?? npc.locationId],
          `${npc.name}是${npc.role}，常在${location?.name ?? '雾灯谷'}活动。${npc.description}性格与话语基调：${voice.personality}`,
          { order: 100 + index * 5, position: 'after_char' },
        )
      }),
    ],
  }
}

export function createMistvaleDefaults(): MistvaleTavernDefaults {
  const now = Date.now()
  const presetSeed = createDefaultPreset()
  const presetId = 'mistvale-preset-narrative'
  const lorebooks = [createWorldRules(now), createVillageArchive(now)]
  const settings: TavernSettings = {
    key: 'mistvale-settings',
    api: {
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      contextLength: 32000,
      maxResponseLength: 1200,
      streaming: true,
      temperature: 0.8,
      frequencyPenalty: 0,
      presencePenalty: 0,
      topP: 0.9,
      rememberKey: false,
      providerOptions: {},
    },
    activePresetId: presetId,
    activeLorebookIds: lorebooks.map((book) => book.id),
    activeCharacterId: null,
    activeSessionId: null,
    userName: '旅行者',
    customTags: [...DEFAULT_TAGS],
    formatPromptTemplate: DEFAULT_FORMAT_PROMPT,
    thinkingDisplay: 'fold',
    updatedAt: now,
  }

  return {
    lorebooks,
    presets: [{ ...presetSeed, id: presetId, createdAt: now, updatedAt: now }],
    characters: npcs.map((npc) => createCharacterCard(npc, now)),
    sessions: [],
    settings,
  }
}

export const MISTVALE_LOREBOOK_IDS = [WORLD_RULES_ID, VILLAGE_ARCHIVE_ID] as const
