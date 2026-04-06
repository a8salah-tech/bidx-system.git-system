'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AppShell from "../components/AppShell";

// ===== نظام الألوان =====
const S = {
  navy:    '#0A1628', navy2: '#0F2040', navy3: '#0C1A32',
  gold:    '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.10)',
  goldB:   'rgba(201,168,76,0.20)',
  white:   '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.20)',
  green:   '#22C55E', greenB: 'rgba(34,197,94,0.10)',
  red:     '#EF4444', redB:   'rgba(239,68,68,0.10)',
  amber:   '#F59E0B', amberB: 'rgba(245,158,11,0.10)',
  blue:    '#3B82F6', blueB:  'rgba(59,130,246,0.10)',
  purple:  '#8B5CF6', purpleB:'rgba(139,92,246,0.10)',
  teal:    '#14B8A6', tealB:  'rgba(20,184,166,0.10)',
  card:    'rgba(255,255,255,0.03)', card2: 'rgba(255,255,255,0.07)',
}

// ===== مراحل الكانبان =====
const DEFAULT_STAGES = [
  { id: 'awareness',      label: 'الوعي',        icon: '👁️',  color: S.blue,   desc: 'عملاء تم التعرف عليهم' },
  { id: 'interest',       label: 'مهتم',          icon: '💡',  color: S.purple, desc: 'أبدوا تفاعلاً أولياً' },
  { id: 'followup',       label: 'متابعة',        icon: '🔄',  color: S.amber,  desc: 'يحتاجون تواصلاً دورياً' },
  { id: 'decision',       label: 'القرار',        icon: '⚖️',  color: S.gold,   desc: 'يدرسون العرض المالي' },
  { id: 'action',         label: 'عميل جاهز',    icon: '🚀',  color: S.green,  desc: 'قبل إغلاق الصفقة' },
  { id: 'not_interested', label: 'غير مهتم',     icon: '🗃️',  color: S.muted,  desc: 'أرشيف المستبعدين' },
]

// ===== القنوات =====
const CHANNELS: Record<string, { label: string; icon: string; color: string }> = {
  whatsapp:  { label: 'واتساب',    icon: '📱', color: S.green  },
  email:     { label: 'إيميل',     icon: '✉️', color: S.blue   },
  call:      { label: 'اتصال',     icon: '📞', color: S.amber  },
  visit:     { label: 'زيارة',     icon: '🏢', color: S.purple },
  linkedin:  { label: 'لينكد إن',  icon: '💼', color: '#0A66C2' },
  facebook:  { label: 'فيسبوك',    icon: '📘', color: '#1877F2' },
  instagram: { label: 'انستقرام',  icon: '📸', color: '#E4405F' },
}

// ===== المصادر =====
const SOURCES = ['فيسبوك', 'لينكد إن', 'انستقرام', 'واتساب', 'زيارة ميدانية', 'إحالة', 'موقع إلكتروني', 'أخرى']

// ===== قوالب الرسائل =====
const MSG_TEMPLATES = [
  {
    id: 'welcome', label: '👋 رسالة الترحيب',
    text: `السلام عليكم ورحمة الله،

أتواصل معكم من شركة BidLX للتجارة الدولية.

تخصصنا في [المنتج/الخدمة] وقد لفت انتباهنا اهتمامكم بالمجال.

يسعدنا تقديم عرض مفصل يتناسب مع احتياجاتكم.

هل يمكننا تحديد موعد مناسب للتواصل؟

مع خالص التقدير`,
  },
  {
    id: 'quote', label: '💰 عرض السعر',
    text: `السلام عليكم،

استكمالاً لتواصلنا السابق، يسعدنا تقديم عرضنا التفصيلي:

📦 المنتج: [اسم المنتج]
📊 الكمية: [الكمية]
💵 السعر: [السعر] لكل وحدة
🚢 الشحن: [تفاصيل الشحن]
⏳ مدة التسليم: [المدة]

هذا العرض ساري حتى [تاريخ الانتهاء].

نتطلع لتعاون ناجح معكم.`,
  },
  {
    id: 'followup', label: '🔄 رسالة المتابعة',
    text: `السلام عليكم،

أتواصل معكم للاطمئنان على مراجعتكم لعرضنا السابق.

إن كان لديكم أي استفسار أو رغبة في تعديل الشروط، يسعدنا مناقشة ذلك.

نحرص دائماً على تقديم أفضل الحلول التجارية لشركاء النجاح.

في انتظار ردكم الكريم.`,
  },
  {
    id: 'closing', label: '🤝 إغلاق الصفقة',
    text: `السلام عليكم،

يسعدنا إبلاغكم بأن كل التفاصيل جاهزة لإتمام الصفقة:

✅ تم الاتفاق على السعر
✅ شروط الشحن واضحة
✅ طريقة الدفع محددة

نرجو التأكيد للمضي قدماً. فريقنا جاهز لاستيفاء كل الإجراءات.

شكراً لثقتكم بنا.`,
  },
]

// ===== المهام اليومية =====
const DAILY_TASKS = [
  { id: 1, icon: '🔍', label: 'التنقيب',            desc: 'إضافة 10 عملاء محتملين لعمود الوعي',              priority: 'high' },
  { id: 2, icon: '🔔', label: 'المتابعة الذكية',     desc: 'مراجعة Follow-up ومن مر على آخر إجراء +48 ساعة', priority: 'high' },
  { id: 3, icon: '📢', label: 'إدارة المحتوى',       desc: 'نشر محتوى يعكس قوة الشركة على المنصات',           priority: 'medium' },
  { id: 4, icon: '🎯', label: 'تحديث الرادار',       desc: 'نقل البطاقات بين الأعمدة بناءً على نتائج اليوم',  priority: 'medium' },
  { id: 5, icon: '🏢', label: 'الزيارات الميدانية',  desc: 'زيارة واحدة أسبوعياً لكبار العملاء وتوثيقها',     priority: 'low' },
]

function timeAgo(date: string) {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 60) return `منذ ${diff} دقيقة`
  if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`
  return `منذ ${Math.floor(diff / 1440)} يوم`
}

function urgencyColor(date: string) {
  if (!date) return S.muted
  const hours = (Date.now() - new Date(date).getTime()) / 3600000
  if (hours > 48) return S.red
  if (hours > 24) return S.amber
  return S.green
}

function urgencyLabel(date: string) {
  if (!date) return '—'
  const hours = (Date.now() - new Date(date).getTime()) / 3600000
  if (hours > 48) return '🔴 عاجل'
  if (hours > 24) return '🟡 متأخر'
  return '🟢 نشط'
}

const inp: React.CSSProperties = {
  width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
  borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

// ===================================================
// مكون بطاقة العميل
// ===================================================
function LeadCard({
  lead, stage, stages, onMove, onUpdate, onDelete
}: {
  lead: any; stage: any; stages: any[];
  onMove: (id: string, newStage: string) => void
  onUpdate: () => void
  onDelete: (id: string) => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(MSG_TEMPLATES[0])
  const [copied, setCopied] = useState(false)

  const ch = CHANNELS[lead.channel] || CHANNELS.whatsapp
  const urgColor = urgencyColor(lead.last_action_at)
  const isDecision = stage?.id === 'decision'

  function copyTemplate() {
    navigator.clipboard.writeText(selectedTemplate.text.replace('[', '').replace(']', ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        style={{
          background: S.card2,
          border: `1px solid ${isDecision ? S.gold + '60' : S.border}`,
          borderRight: isDecision ? `3px solid ${S.gold}` : `1px solid ${S.border}`,
          borderRadius: 10, padding: '12px 14px', marginBottom: 8,
          cursor: 'pointer', transition: 'all .15s',
          boxShadow: isDecision ? `0 0 12px ${S.gold}15` : 'none',
        }}>

        {/* الصف الأول: الاسم + النبض */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* نبض تشغيلي */}
            <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: urgColor, opacity: .7, animation: urgColor === S.red ? 'ping 1.5s infinite' : 'none' }}/>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: urgColor }}/>
            </div>
            <span style={{ fontSize: 9, color: urgColor, fontWeight: 700 }}>{urgencyLabel(lead.last_action_at)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isDecision ? S.gold2 : S.white }}>{lead.name}</div>
            {lead.company && <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>{lead.company}</div>}
          </div>
        </div>

        {/* الصف الثاني: القناة + المصدر */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: S.muted }}>{lead.source || '—'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: ch.color, fontWeight: 600 }}>{ch.label}</span>
            <span style={{ fontSize: 14 }}>{ch.icon}</span>
          </div>
        </div>

        {/* التواريخ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: S.muted, textAlign: 'left' }}>
            {lead.next_followup_at && (
              <span style={{ color: S.amber }}>📅 {new Date(lead.next_followup_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
            )}
          </div>
          <div style={{ fontSize: 9, color: S.muted, textAlign: 'right' }}>
            آخر إجراء: {timeAgo(lead.last_action_at)}
          </div>
        </div>

        {/* الأزرار */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowTemplate(true)}
            style={{ background: S.gold3, border: `1px solid ${S.borderG}`, color: S.gold2, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            🎯 أدوات الإقناع
          </button>
          {/* نقل سريع */}
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { onMove(lead.id, e.target.value); e.target.value = '' } }}
            style={{ background: S.card, border: `1px solid ${S.border}`, color: S.muted, borderRadius: 6, fontSize: 10, padding: '4px 6px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
            <option value="">نقل ←</option>
            {stages.filter(s => s.id !== stage.id).map(s => (
              <option key={s.id} value={s.id} style={{ background: S.navy2 }}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Modal التفاصيل ── */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}
          onClick={() => setShowDetail(false)}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 500, borderRadius: 18, border: `1px solid ${S.borderG}`, direction: 'rtl', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isDecision ? S.gold2 : S.white }}>{lead.name}</div>
                {lead.company && <div style={{ fontSize: 11, color: S.muted }}>{lead.company}</div>}
              </div>
            </div>
            <div style={{ padding: 22 }}>
              {/* معلومات أساسية */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'المرحلة',      val: `${stage?.icon} ${stage?.label}` },
                  { label: 'القناة',       val: `${ch.icon} ${ch.label}` },
                  { label: 'الهاتف',       val: lead.phone || '—' },
                  { label: 'المصدر',       val: lead.source || '—' },
                  { label: 'آخر إجراء',   val: timeAgo(lead.last_action_at) },
                  { label: 'المتابعة',     val: lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString('ar-EG') : '—' },
                ].map((f, i) => (
                  <div key={i} style={{ background: S.card, borderRadius: 8, padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: S.muted, fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: S.white }}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* النبض */}
              <div style={{ background: `${urgColor}15`, border: `1px solid ${urgColor}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: urgColor, fontFamily: 'monospace' }}>{urgencyLabel(lead.last_action_at)}</span>
                <span style={{ fontSize: 11, color: S.muted, textAlign: 'right' }}>النبض التشغيلي</span>
              </div>

              {/* الملاحظات */}
              {lead.notes && (
                <div style={{ background: S.card, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>📝 الملاحظات</div>
                  <div style={{ fontSize: 12, color: S.white, lineHeight: '1.8', textAlign: 'right' }}>{lead.notes}</div>
                </div>
              )}

              {/* سجل النشاط */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 10, textAlign: 'right' }}>📋 سجل النشاط</div>
                {(lead.activity_log || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: S.muted, padding: '20px 0', fontSize: 12 }}>لا يوجد سجل نشاط بعد</div>
                ) : (lead.activity_log || []).map((act: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, flexDirection: 'row-reverse' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: S.gold, flexShrink: 0, marginTop: 5 }}/>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: S.white }}>{act.note}</div>
                      <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{act.by} • {timeAgo(act.at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { onDelete(lead.id); setShowDetail(false) }}
                  style={{ background: S.redB, border: `1px solid ${S.red}30`, color: S.red, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  حذف
                </button>
                <button onClick={() => { setShowDetail(false); setShowTemplate(true) }}
                  style={{ flex: 1, background: S.gold, color: S.navy, border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  🎯 أدوات الإقناع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal أدوات الإقناع ── */}
      {showTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(8px)', padding: 16 }}
          onClick={() => setShowTemplate(false)}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 540, borderRadius: 18, border: `1px solid ${S.borderG}`, direction: 'rtl', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: S.gold3 }}>
              <button onClick={() => setShowTemplate(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 14, fontWeight: 800, color: S.gold2 }}>🎯 أدوات الإقناع — {lead.name}</div>
            </div>
            <div style={{ padding: 22 }}>
              {/* اختيار القالب */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
                {MSG_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t)}
                    style={{ padding: '10px 12px', borderRadius: 9, border: `1px solid ${selectedTemplate.id === t.id ? S.gold : S.border}`, background: selectedTemplate.id === t.id ? S.gold3 : 'transparent', color: selectedTemplate.id === t.id ? S.gold2 : S.muted, fontSize: 12, fontWeight: selectedTemplate.id === t.id ? 700 : 400, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', transition: 'all .15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* القالب */}
              <div style={{ background: S.navy3, border: `1px solid ${S.border}`, borderRadius: 10, padding: 16, marginBottom: 14, textAlign: 'right', fontSize: 12, color: S.white, lineHeight: '2', whiteSpace: 'pre-wrap', fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
                {selectedTemplate.text}
              </div>

              {/* أزرار */}
              <div style={{ display: 'flex', gap: 8 }}>
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, background: S.greenB, border: `1px solid ${S.green}30`, color: S.green, padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    📱 واتساب
                  </a>
                )}
                <button onClick={copyTemplate}
                  style={{ flex: 1, background: copied ? S.greenB : S.gold, color: copied ? S.green : S.navy, border: copied ? `1px solid ${S.green}30` : 'none', padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', transition: 'all .2s' }}>
                  {copied ? '✅ تم النسخ' : '📋 نسخ القالب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ===================================================
// مكون عمود الكانبان
// ===================================================
function KanbanColumn({
  stage, leads, stages, allLeads, onMove, onUpdate, onDelete, onAddLead
}: {
  stage: any; leads: any[]; stages: any[]; allLeads: any[]
  onMove: (id: string, stg: string) => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onAddLead: (stageId: string, data: any) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', phone: '', channel: 'whatsapp',
    source: '', next_followup_at: '', notes: '', template: '',
  })

  const urgentCount = leads.filter(l => {
    const h = (Date.now() - new Date(l.last_action_at || 0).getTime()) / 3600000
    return h > 48
  }).length

  async function addLead() {
    if (!form.name) { alert('أدخل اسم العميل'); return }
    setSaving(true)
    await onAddLead(stage.id, { ...form, stage_id: stage.id, last_action_at: new Date().toISOString() })
    setForm({ name: '', company: '', phone: '', channel: 'whatsapp', source: '', next_followup_at: '', notes: '', template: '' })
    setShowAddForm(false)
    setSaving(false)
  }

  return (
    <div style={{ minWidth: 270, maxWidth: 270, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* رأس العمود */}
      <div style={{ background: S.navy2, borderRadius: '12px 12px 0 0', padding: '12px 14px', border: `1px solid ${S.border}`, borderBottom: `2px solid ${stage.color}`, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {urgentCount > 0 && (
              <span style={{ background: S.red, color: S.white, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{urgentCount}</span>
            )}
            <span style={{ background: `${stage.color}20`, color: stage.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{leads.length}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: S.white }}>{stage.label}</span>
              <span style={{ fontSize: 16 }}>{stage.icon}</span>
            </div>
            <div style={{ fontSize: 9, color: S.muted, marginTop: 2 }}>{stage.desc}</div>
          </div>
        </div>
      </div>

      {/* البطاقات */}
      <div style={{ background: `${stage.color}05`, border: `1px solid ${S.border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '10px', flex: 1, minHeight: 120, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
        {leads.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 11 }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: .4 }}>{stage.icon}</div>
            <div>لا يوجد عملاء</div>
          </div>
        ) : leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} stage={stage} stages={stages} onMove={onMove} onUpdate={onUpdate} onDelete={onDelete}/>
        ))}

        {/* زر الإضافة */}
        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)}
            style={{ width: '100%', background: 'transparent', border: `1px dashed ${stage.color}40`, color: stage.color, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginTop: 4, opacity: .7, transition: 'opacity .15s' }}>
            + إضافة عميل
          </button>
        ) : (
          <div style={{ background: S.navy3, border: `1px solid ${S.borderG}`, borderRadius: 10, padding: 12, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginBottom: 10, textAlign: 'right' }}>+ عميل جديد</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="اسم العميل *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ ...inp, fontSize: 11 }}/>
              <input type="text" placeholder="اسم الشركة" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} style={{ ...inp, fontSize: 11 }}/>
              <input type="text" placeholder="رقم الهاتف / واتساب" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ ...inp, fontSize: 11 }}/>
              <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))} style={{ ...inp, fontSize: 11, cursor: 'pointer' }}>
                {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k} style={{ background: S.navy2 }}>{v.icon} {v.label}</option>)}
              </select>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={{ ...inp, fontSize: 11, cursor: 'pointer' }}>
                <option value="">المصدر...</option>
                {SOURCES.map(s => <option key={s} value={s} style={{ background: S.navy2 }}>{s}</option>)}
              </select>
              <select value={form.template} onChange={e => setForm(p => ({ ...p, template: e.target.value }))} style={{ ...inp, fontSize: 11, cursor: 'pointer' }}>
                <option value="">القالب المقترح (اختياري)</option>
                {MSG_TEMPLATES.map(t => <option key={t.id} value={t.id} style={{ background: S.navy2 }}>{t.label}</option>)}
              </select>
              <input type="date" value={form.next_followup_at} onChange={e => setForm(p => ({ ...p, next_followup_at: e.target.value }))} style={{ ...inp, fontSize: 11, colorScheme: 'dark' as any }} title="موعد المتابعة القادمة"/>
              <textarea placeholder="ملاحظات..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inp, fontSize: 11, resize: 'none' } as React.CSSProperties}/>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, padding: '7px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={addLead} disabled={saving} style={{ flex: 2, background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: '7px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '...' : '+ إضافة'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================================
// الصفحة الرئيسية
// ===================================================
export default function MarketingPage() {
  const [view, setView]         = useState<'kanban' | 'social' | 'tasks'>('kanban')
  const [leads, setLeads]       = useState<any[]>([])
  const [stages, setStages]     = useState(DEFAULT_STAGES)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStageLabel, setNewStageLabel] = useState('')
  const [tasksDone, setTasksDone] = useState<number[]>([])

  // ── Social Media Mock Data ──
  const [socialStats] = useState({
    linkedin: { sent: 24, replied: 8, rate: 33 },
    facebook: { comments: 156, responded: 142, rate: 91 },
    instagram: { comments: 89, responded: 78, rate: 87 },
    whatsapp: { converted: 12, pending: 5 },
  })

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('marketing_leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  // ── نقل بطاقة ──
  async function moveLead(id: string, newStage: string) {
    await supabase.from('marketing_leads').update({ stage_id: newStage, last_action_at: new Date().toISOString() }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage_id: newStage, last_action_at: new Date().toISOString() } : l))
  }

  // ── حذف بطاقة ──
  async function deleteLead(id: string) {
    if (!window.confirm('حذف العميل نهائياً؟')) return
    await supabase.from('marketing_leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  // ── إضافة عميل ──
  async function addLead(stageId: string, data: any) {
    const { data: res } = await supabase.from('marketing_leads').insert([{
      stage_id: stageId, name: data.name, company: data.company,
      phone: data.phone, channel: data.channel, source: data.source,
      next_followup_at: data.next_followup_at || null,
      notes: data.notes, last_action_at: new Date().toISOString(),
      activity_log: [],
    }]).select().single()
    if (res) setLeads(prev => [res, ...prev])
  }

  // ── إضافة مرحلة ──
  function addStage() {
    if (!newStageLabel) return
    const newStage = {
      id: `custom_${Date.now()}`,
      label: newStageLabel,
      icon: '📌',
      color: S.teal,
      desc: 'مرحلة مخصصة',
    }
    setStages(prev => [...prev, newStage])
    setNewStageLabel('')
    setShowAddStage(false)
  }

  // ── الفلترة ──
  const filteredLeads = leads.filter(l => {
    const matchSearch = !search || l.name?.includes(search) || l.company?.includes(search)
    const matchChannel = !filterChannel || l.channel === filterChannel
    return matchSearch && matchChannel
  })

  // ── إحصائيات ──
  const totalLeads    = leads.length
  const hotLeads      = leads.filter(l => l.stage_id === 'action').length
  const urgentLeads   = leads.filter(l => { const h = (Date.now() - new Date(l.last_action_at || 0).getTime()) / 3600000; return h > 48 }).length
  const todayLeads    = leads.filter(l => { const d = new Date(l.created_at); const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() }).length

  const TABS = [
    { key: 'kanban', label: '📋 لوحة المبيعات (Kanban)' },
    { key: 'social', label: '📡 منصات التواصل' },
    { key: 'tasks',  label: '✅ المهام اليومية' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy }}>

      {/* ── الهيدر ── */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '12px 24px', flexShrink: 0 }}>

        {/* إحصائيات سريعة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { icon: '👥', label: 'إجمالي العملاء المحتملين', val: totalLeads,  color: S.blue  },
            { icon: '🚀', label: 'جاهزون للإغلاق',           val: hotLeads,   color: S.green },
            { icon: '🔴', label: 'يحتاجون تواصلاً عاجلاً',   val: urgentLeads, color: S.red   },
            { icon: '✨', label: 'مضافون اليوم',              val: todayLeads,  color: S.gold  },
          ].map((s, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 9, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: S.muted }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* شريط البحث */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="text" placeholder="🔍 ابحث عن عميل أو شركة..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp, flex: 1, background: S.navy3, fontSize: 12 }}/>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
            style={{ ...inp, width: 'auto', fontSize: 12, cursor: 'pointer' }}>
            <option value="">كل القنوات</option>
            {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k} style={{ background: S.navy2 }}>{v.icon} {v.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── التبويبات ── */}
      <div style={{ display: 'flex', background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setView(t.key as any)}
            style={{ padding: '11px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', borderBottom: view === t.key ? `2px solid ${S.gold}` : '2px solid transparent', background: 'transparent', color: view === t.key ? S.gold2 : S.muted, whiteSpace: 'nowrap', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ══ لوحة الكانبان ══ */}
        {view === 'kanban' && (
          <div style={{ display: 'flex', gap: 12, padding: '16px 24px', overflowX: 'auto', height: '100%', alignItems: 'flex-start' }}>
            {stages.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.stage_id === stage.id)
              return (
                <KanbanColumn
                  key={stage.id} stage={stage} leads={stageLeads}
                  stages={stages} allLeads={leads}
                  onMove={moveLead} onUpdate={loadLeads}
                  onDelete={deleteLead} onAddLead={addLead}
                />
              )
            })}

            {/* زر إضافة مرحلة */}
            <div style={{ minWidth: 180, flexShrink: 0 }}>
              {!showAddStage ? (
                <button onClick={() => setShowAddStage(true)}
                  style={{ width: '100%', background: S.card, border: `1px dashed ${S.border}`, color: S.muted, padding: '14px', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>+</span>
                  <span>مرحلة جديدة</span>
                </button>
              ) : (
                <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 12, padding: 14 }}>
                  <input type="text" placeholder="اسم المرحلة..." value={newStageLabel}
                    onChange={e => setNewStageLabel(e.target.value)}
                    style={{ ...inp, marginBottom: 10, fontSize: 12 }}/>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setShowAddStage(false)} style={{ flex: 1, background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, padding: '7px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                    <button onClick={addStage} style={{ flex: 2, background: S.gold, color: S.navy, border: 'none', padding: '7px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>+ إضافة</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ منصات التواصل ══ */}
        {view === 'social' && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>

              {/* LinkedIn */}
              <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 22, borderTop: '3px solid #0A66C2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexDirection: 'row-reverse' }}>
                  <span style={{ fontSize: 28 }}>💼</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0A66C2' }}>LinkedIn</div>
                    <div style={{ fontSize: 11, color: S.muted }}>المحرك الرئيسي للـ B2B</div>
                  </div>
                </div>
                <div style={{ marginBottom: 14, textAlign: 'right', background: S.blueB, border: `1px solid ${S.blue}20`, borderRadius: 9, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>الهدف: بناء علاقات مع مدراء المشتريات وأصحاب القرار</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'رسائل مرسلة', val: socialStats.linkedin.sent,    color: S.blue  },
                    { label: 'تم الرد',      val: socialStats.linkedin.replied,  color: S.green },
                    { label: 'معدل الرد',    val: `${socialStats.linkedin.rate}%`, color: S.gold  },
                  ].map((s, i) => (
                    <div key={i} style={{ background: S.card, borderRadius: 9, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: S.muted, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facebook & Instagram */}
              <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 22, borderTop: '3px solid #1877F2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexDirection: 'row-reverse' }}>
                  <span style={{ fontSize: 28 }}>📘</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1877F2' }}>Facebook & Instagram</div>
                    <div style={{ fontSize: 11, color: S.muted }}>التواجد الجماهيري وبناء الثقة</div>
                  </div>
                </div>
                <div style={{ marginBottom: 14, background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: 9, padding: '10px 14px', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: S.muted }}>⚡ العميل الذي لا يجد رداً خلال 30 دقيقة هو عميل ضائع</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div style={{ background: S.card, borderRadius: 9, padding: 12, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>Facebook</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1877F2', fontFamily: 'monospace' }}>{socialStats.facebook.rate}%</div>
                    <div style={{ fontSize: 9, color: S.muted }}>معدل الرد</div>
                    <div style={{ height: 4, background: S.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${socialStats.facebook.rate}%`, background: '#1877F2', borderRadius: 2 }}/>
                    </div>
                  </div>
                  <div style={{ background: S.card, borderRadius: 9, padding: 12, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>Instagram</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#E4405F', fontFamily: 'monospace' }}>{socialStats.instagram.rate}%</div>
                    <div style={{ fontSize: 9, color: S.muted }}>معدل الرد</div>
                    <div style={{ height: 4, background: S.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${socialStats.instagram.rate}%`, background: '#E4405F', borderRadius: 2 }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Business */}
              <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 22, borderTop: `3px solid ${S.green}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexDirection: 'row-reverse' }}>
                  <span style={{ fontSize: 28 }}>📱</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: S.green }}>WhatsApp Business</div>
                    <div style={{ fontSize: 11, color: S.muted }}>قناة الإغلاق الذهبية</div>
                  </div>
                </div>
                <div style={{ marginBottom: 14, background: S.greenB, border: `1px solid ${S.green}20`, borderRadius: 9, padding: '10px 14px', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: S.muted }}>الهدف: تحويل العملاء من السوشيال إلى "عميل جاهز"</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'محوَّلون لـ "جاهز"', val: socialStats.whatsapp.converted, color: S.green },
                    { label: 'قيد المتابعة',        val: socialStats.whatsapp.pending,   color: S.amber },
                  ].map((s, i) => (
                    <div key={i} style={{ background: S.card, borderRadius: 9, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: S.muted, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ملخص القمع التسويقي */}
              <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: S.gold2, marginBottom: 16, textAlign: 'right' }}>📊 قمع المبيعات</div>
                {stages.slice(0, 5).map((stage, i) => {
                  const count = leads.filter(l => l.stage_id === stage.id).length
                  const pct   = totalLeads ? Math.round((count / totalLeads) * 100) : 0
                  return (
                    <div key={stage.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: stage.color, fontWeight: 700 }}>{count}</span>
                        <span style={{ fontSize: 11, color: S.muted }}>{stage.icon} {stage.label}</span>
                      </div>
                      <div style={{ height: 6, background: S.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: 3, transition: 'width .4s' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ المهام اليومية ══ */}
        {view === 'tasks' && (
          <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: S.muted }}>{tasksDone.length}/{DAILY_TASKS.length} مكتملة</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: S.white }}>✅ مهام موظف التسويق اليومية</div>
            </div>

            {/* شريط التقدم */}
            <div style={{ background: S.border, borderRadius: 4, height: 6, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(tasksDone.length / DAILY_TASKS.length) * 100}%`, background: `linear-gradient(90deg,${S.gold},${S.green})`, borderRadius: 4, transition: 'width .4s' }}/>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DAILY_TASKS.map(task => {
                const done = tasksDone.includes(task.id)
                const prioColor = task.priority === 'high' ? S.red : task.priority === 'medium' ? S.amber : S.muted
                return (
                  <div key={task.id}
                    onClick={() => setTasksDone(prev => done ? prev.filter(id => id !== task.id) : [...prev, task.id])}
                    style={{ background: done ? S.greenB : S.navy2, border: `1px solid ${done ? S.green + '40' : S.border}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${done ? S.green : S.border}`, background: done ? S.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                        {done && <span style={{ color: S.navy, fontSize: 12, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${prioColor}18`, color: prioColor, fontWeight: 700 }}>
                        {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: done ? S.green : S.white, textDecoration: done ? 'line-through' : 'none' }}>{task.label}</div>
                        <span style={{ fontSize: 18 }}>{task.icon}</span>
                      </div>
                      <div style={{ fontSize: 11, color: S.muted, lineHeight: '1.6' }}>{task.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* نصائح التسويق */}
            <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 14, padding: 20, marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: S.gold2, marginBottom: 14, textAlign: 'right' }}>💡 قواعد مهندس الفرص</div>
              {[
                { icon: '⚡', text: 'العميل الذي لم يُرد خلال 48 ساعة — تواصل فوراً قبل فقدانه.' },
                { icon: '🎯', text: 'كل بطاقة في "القرار" تستحق مكالمة شخصية، ليس رسالة نصية.' },
                { icon: '📊', text: 'الهدف اليومي: 10 عملاء جدد في "الوعي" + نقل 3 بطاقات للأمام.' },
                { icon: '🏆', text: '"العميل الحوت" يستحق زيارة ميدانية — لا تكتفِ بالواتساب.' },
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                  <div style={{ fontSize: 12, color: S.muted, lineHeight: '1.7', textAlign: 'right' }}>{tip.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS للنبض */}
      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: .7; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
