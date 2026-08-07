import { useMemo } from 'react'
import { createDisabledTavernApi } from '../../../sillytavern/api-adapter'
import { GameIcon } from '../../icons/GameIcon'

export function ApiPanel() {
  const preview = useMemo(() => createDisabledTavernApi().prepare({ task: 'story', messages: [{ role: 'user', content: '示例：询问洛岚今日的村民委托。' }], context: { character: '洛岚', lorebooks: 2, mode: 'local' } }), [])
  return <section className="tavern-panel api-panel" aria-labelledby="api-panel-title">
    <header className="tavern-panel-heading"><div><span>ADAPTER CONTRACT</span><h3 id="api-panel-title">接口边界</h3><p>为未来模型接入保留稳定契约，本阶段只生成预览。</p></div><div className="adapter-state is-disabled"><i /><span>DISABLED</span><strong>模型未接入</strong></div></header>
    <div className="api-bento">
      <article className="api-guard-card"><GameIcon name="warning" size={23} /><div><span>硬性安全边界</span><h4>不会发送网络请求</h4><p>当前唯一适配器会在发送阶段返回 <code>TAVERN_API_DISABLED</code>，项目中没有模型地址、密钥输入或连接测试。</p></div></article>
      <article><span className="panel-kicker">接口能力</span><h4>TavernApiAdapter</h4><dl><div><dt>prepare</dt><dd>创建可审阅请求预览</dd></div><div><dt>stream</dt><dd>禁用并返回类型化错误</dd></div><div><dt>mode</dt><dd>disabled</dd></div></dl></article>
      <article><span className="panel-kicker">任务通道</span><h4>三类请求已定义</h4><div className="api-task-chips"><span>剧情 STORY</span><span>摘要 SUMMARY</span><span>变量 VARS</span></div><p>次 API 与 schema-first 均未启用。</p></article>
      <article className="api-flow-card"><span className="panel-kicker">本地执行链</span><h4>角色卡 → 世界书 → 楼层解析</h4><ol><li><b>01</b><span>收集角色、好感与游戏变量</span></li><li><b>02</b><span>本地剧情模拟器组织回应</span></li><li><b>03</b><span>六标签解析并写入 IndexedDB</span></li></ol></article>
      <article className="api-preview-card"><div><span className="panel-kicker">请求预览</span><strong>{preview.id.slice(0, 8).toUpperCase()}</strong></div><pre>{JSON.stringify(preview.request, null, 2)}</pre></article>
    </div>
  </section>
}
