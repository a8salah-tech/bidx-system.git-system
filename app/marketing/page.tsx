'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ===== نظام الألوان =====
const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#0C1A32',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.10)',goldB:'rgba(201,168,76,0.20)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.07)',borderG:'rgba(201,168,76,0.20)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.10)',
  red:'#EF4444',redB:'rgba(239,68,68,0.10)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.10)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.10)',
  purple:'#8B5CF6',purpleB:'rgba(139,92,246,0.10)',
  teal:'#14B8A6',
  card:'rgba(255,255,255,0.03)',card2:'rgba(255,255,255,0.07)',
}

const DEFAULT_STAGES = [
  { id:'awareness',      label:'الوعي',       icon:'👁️', color:S.blue,   desc:'عملاء تم التعرف عليهم' },
  { id:'interest',       label:'مهتم',         icon:'💡', color:S.purple, desc:'أبدوا تفاعلاً أولياً' },
  { id:'followup',       label:'متابعة',       icon:'🔄', color:S.amber,  desc:'يحتاجون تواصلاً دورياً' },
  { id:'decision',       label:'القرار',       icon:'⚖️', color:S.gold,   desc:'يدرسون العرض المالي' },
  { id:'action',         label:'عميل جاهز',   icon:'🚀', color:S.green,  desc:'قبل إغلاق الصفقة' },
  { id:'not_interested', label:'غير مهتم',    icon:'🗃️', color:S.muted,  desc:'أرشيف المستبعدين' },
]

const CHANNELS: Record<string,{label:string;icon:string;color:string}> = {
  whatsapp: {label:'واتساب',   icon:'📱',color:S.green},
  email:    {label:'إيميل',    icon:'✉️',color:S.blue},
  call:     {label:'اتصال',    icon:'📞',color:S.amber},
  visit:    {label:'زيارة',    icon:'🏢',color:S.purple},
  linkedin: {label:'لينكد إن', icon:'💼',color:'#0A66C2'},
  facebook: {label:'فيسبوك',   icon:'📘',color:'#1877F2'},
  instagram:{label:'انستقرام', icon:'📸',color:'#E4405F'},
}

const SOURCES = ['فيسبوك','لينكد إن','انستقرام','واتساب','زيارة ميدانية','إحالة','موقع إلكتروني','أخرى']

const inp: React.CSSProperties = {
  width:'100%',background:S.navy3,border:`1px solid ${S.border}`,
  borderRadius:'8px',padding:'9px 12px',fontSize:'12px',color:S.white,
  outline:'none',fontFamily:'Tajawal, sans-serif',
  boxSizing:'border-box',direction:'rtl',textAlign:'right',
}

function todayISO() { return new Date().toISOString().split('T')[0] }
function timeAgo(date:string) {
  if (!date) return '—'
  const diff = Math.floor((Date.now()-new Date(date).getTime())/60000)
  if (diff<60) return `منذ ${diff} دقيقة`
  if (diff<1440) return `منذ ${Math.floor(diff/60)} ساعة`
  return `منذ ${Math.floor(diff/1440)} يوم`
}
function urgencyColor(date:string) {
  if (!date) return S.muted
  const h=(Date.now()-new Date(date).getTime())/3600000
  if (h>48) return S.red
  if (h>24) return S.amber
  return S.green
}
function urgencyLabel(date:string) {
  if (!date) return '—'
  const h=(Date.now()-new Date(date).getTime())/3600000
  if (h>48) return '🔴 عاجل'
  if (h>24) return '🟡 متأخر'
  return '🟢 نشط'
}

// ===================================================
// بطاقة العميل
// ===================================================
function LeadCard({lead,stage,stages,templates,onMove,onDelete,onAddNote}:{
  lead:any;stage:any;stages:any[];templates:any[];
  onMove:(id:string,s:string)=>void;
  onDelete:(id:string)=>void;
  onAddNote:(id:string,note:string)=>void;
}) {
  const [showDetail,  setShowDetail]  = useState(false)
  const [showTpl,     setShowTpl]     = useState(false)
  const [selTpl,      setSelTpl]      = useState<any>(templates[0] || null)
  const [copied,      setCopied]      = useState(false)
  const [newNote,     setNewNote]     = useState('')
  const [savingNote,  setSavingNote]  = useState(false)

  const ch = CHANNELS[lead.channel] || CHANNELS.whatsapp
  const urgColor   = urgencyColor(lead.last_action_at)
  const isDecision = stage?.id === 'decision'

  // تحديث selTpl لو تغيرت القوالب
  useEffect(()=>{ if(templates.length>0 && !selTpl) setSelTpl(templates[0]) },[templates])

  function copyTemplate() {
    if (!selTpl) return
    navigator.clipboard.writeText(selTpl.text)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  async function saveNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    await onAddNote(lead.id, newNote.trim())
    setNewNote('')
    setSavingNote(false)
  }

  return (
    <>
      {/* ── البطاقة ── */}
      <div onClick={()=>setShowDetail(true)} style={{
        background:S.card2,
        border:`1px solid ${isDecision?S.gold+'60':S.border}`,
        borderRight:isDecision?`3px solid ${S.gold}`:`1px solid ${S.border}`,
        borderRadius:10,padding:'12px 14px',marginBottom:8,
        cursor:'pointer',transition:'all .15s',
        boxShadow:isDecision?`0 0 12px ${S.gold}15`:'none',
      }}>
        {/* الاسم + النبض */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{position:'relative',width:10,height:10,flexShrink:0}}>
              <div style={{position:'absolute',inset:0,borderRadius:'50%',background:urgColor,opacity:.7,animation:urgColor===S.red?'ping 1.5s infinite':'none'}}/>
              <div style={{position:'absolute',inset:0,borderRadius:'50%',background:urgColor}}/>
            </div>
            <span style={{fontSize:9,color:urgColor,fontWeight:700}}>{urgencyLabel(lead.last_action_at)}</span>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,fontWeight:700,color:isDecision?S.gold2:S.white}}>{lead.name}</div>
            {lead.company&&<div style={{fontSize:10,color:S.muted,marginTop:1}}>{lead.company}</div>}
          </div>
        </div>
        {/* القناة + المصدر */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,color:S.muted}}>{lead.source||'—'}</span>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:10,color:ch.color,fontWeight:600}}>{ch.label}</span>
            <span style={{fontSize:14}}>{ch.icon}</span>
          </div>
        </div>
        {/* التواريخ */}
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <div style={{fontSize:9,color:S.muted}}>
            {lead.next_followup_at&&<span style={{color:S.amber}}>📅 {new Date(lead.next_followup_at).toLocaleDateString('ar-EG',{month:'short',day:'numeric'})}</span>}
          </div>
          <div style={{fontSize:9,color:S.muted}}>آخر إجراء: {timeAgo(lead.last_action_at)}</div>
        </div>
        {/* الأزرار */}
        <div style={{display:'flex',gap:6,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setShowTpl(true)}
            style={{background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'4px 10px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            🎯 أدوات الإقناع
          </button>
          <select defaultValue="" onChange={e=>{if(e.target.value){onMove(lead.id,e.target.value);e.target.value=''}}}
            style={{background:S.card,border:`1px solid ${S.border}`,color:S.muted,borderRadius:6,fontSize:10,padding:'4px 6px',cursor:'pointer',fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
            <option value="">نقل ←</option>
            {stages.filter(s=>s.id!==stage.id).map(s=>(
              <option key={s.id} value={s.id} style={{background:S.navy2}}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Modal التفاصيل ── */}
      {showDetail&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}
          onClick={()=>setShowDetail(false)}>
          <div style={{background:S.navy2,width:'100%',maxWidth:520,borderRadius:18,border:`1px solid ${S.borderG}`,direction:'rtl',maxHeight:'88vh',overflowY:'auto'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>setShowDetail(false)} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:isDecision?S.gold2:S.white}}>{lead.name}</div>
                {lead.company&&<div style={{fontSize:11,color:S.muted}}>{lead.company}</div>}
              </div>
            </div>
            <div style={{padding:20}}>
              {/* معلومات */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                {[
                  {label:'المرحلة',  val:`${stage?.icon} ${stage?.label}`},
                  {label:'القناة',   val:`${ch.icon} ${ch.label}`},
                  {label:'الهاتف',   val:lead.phone||'—'},
                  {label:'المصدر',   val:lead.source||'—'},
                  {label:'آخر إجراء',val:timeAgo(lead.last_action_at)},
                  {label:'المتابعة', val:lead.next_followup_at?new Date(lead.next_followup_at).toLocaleDateString('ar-EG'):'—'},
                ].map((f,i)=>(
                  <div key={i} style={{background:S.card,borderRadius:8,padding:'9px 12px',textAlign:'right'}}>
                    <div style={{fontSize:9,color:S.muted,fontWeight:700,marginBottom:3}}>{f.label}</div>
                    <div style={{fontSize:12,fontWeight:600,color:S.white}}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* النبض */}
              <div style={{background:`${urgColor}15`,border:`1px solid ${urgColor}30`,borderRadius:8,padding:'9px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,fontWeight:900,color:urgColor}}>{urgencyLabel(lead.last_action_at)}</span>
                <span style={{fontSize:11,color:S.muted}}>النبض التشغيلي</span>
              </div>

              {/* الملاحظات الموجودة */}
              {lead.notes&&(
                <div style={{background:S.card,borderRadius:8,padding:'12px 14px',marginBottom:14}}>
                  <div style={{fontSize:10,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>📝 الملاحظات</div>
                  <div style={{fontSize:12,color:S.white,lineHeight:'1.8',textAlign:'right',whiteSpace:'pre-wrap'}}>{lead.notes}</div>
                </div>
              )}

              {/* إضافة ملاحظة جديدة */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>✏️ إضافة ملاحظة</div>
                <textarea value={newNote} onChange={e=>setNewNote(e.target.value)}
                  placeholder="اكتب ملاحظتك هنا..." rows={3}
                  style={{...inp,resize:'none',marginBottom:8} as React.CSSProperties}/>
                <button onClick={saveNote} disabled={savingNote||!newNote.trim()}
                  style={{background:savingNote?S.muted:S.gold,color:S.navy,border:'none',padding:'8px 20px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',float:'left'}}>
                  {savingNote?'⏳...':'💾 حفظ الملاحظة'}
                </button>
                <div style={{clear:'both'}}/>
              </div>

              {/* سجل النشاط */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:S.muted,marginBottom:8,textAlign:'right'}}>📋 سجل النشاط</div>
                {(lead.activity_log||[]).length===0?(
                  <div style={{textAlign:'center',color:S.muted,padding:'16px 0',fontSize:12}}>لا يوجد سجل نشاط بعد</div>
                ):(lead.activity_log||[]).map((act:any,i:number)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:8,flexDirection:'row-reverse'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:S.gold,flexShrink:0,marginTop:5}}/>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:S.white}}>{act.note}</div>
                      <div style={{fontSize:10,color:S.muted,marginTop:2}}>{act.by} • {timeAgo(act.at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{onDelete(lead.id);setShowDetail(false)}}
                  style={{background:S.redB,border:`1px solid ${S.red}30`,color:S.red,padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  حذف
                </button>
                <button onClick={()=>{setShowDetail(false);setShowTpl(true)}}
                  style={{flex:1,background:S.gold,color:S.navy,border:'none',padding:'8px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  🎯 أدوات الإقناع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal أدوات الإقناع ── */}
      {showTpl&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1001,backdropFilter:'blur(8px)',padding:16}}
          onClick={()=>setShowTpl(false)}>
          <div style={{background:S.navy2,width:'100%',maxWidth:540,borderRadius:18,border:`1px solid ${S.borderG}`,direction:'rtl',maxHeight:'88vh',overflowY:'auto'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:S.gold3}}>
              <button onClick={()=>setShowTpl(false)} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:14,fontWeight:800,color:S.gold2}}>🎯 أدوات الإقناع — {lead.name}</div>
            </div>
            <div style={{padding:20}}>
              {templates.length===0?(
                <div style={{textAlign:'center',color:S.muted,padding:'40px 0'}}>
                  <div style={{fontSize:32,marginBottom:12}}>📝</div>
                  <div style={{fontSize:13}}>لا توجد قوالب بعد</div>
                  <div style={{fontSize:11,marginTop:6}}>اذهب لتبويب "القوالب" لإضافة قوالبك</div>
                </div>
              ):(
                <>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:16}}>
                    {templates.map((t:any)=>(
                      <button key={t.id} onClick={()=>setSelTpl(t)}
                        style={{padding:'10px 12px',borderRadius:9,border:`1px solid ${selTpl?.id===t.id?S.gold:S.border}`,background:selTpl?.id===t.id?S.gold3:'transparent',color:selTpl?.id===t.id?S.gold2:S.muted,fontSize:12,fontWeight:selTpl?.id===t.id?700:400,cursor:'pointer',fontFamily:'Tajawal, sans-serif',textAlign:'right',transition:'all .15s'}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {selTpl&&(
                    <div style={{background:S.navy3,border:`1px solid ${S.border}`,borderRadius:10,padding:16,marginBottom:14,fontSize:12,color:S.white,lineHeight:'2',whiteSpace:'pre-wrap',fontFamily:'Tajawal, sans-serif',direction:'rtl',textAlign:'right'}}>
                      {selTpl.text}
                    </div>
                  )}
                  <div style={{display:'flex',gap:8}}>
                    {lead.phone&&(
                      <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                        style={{flex:1,background:S.greenB,border:`1px solid ${S.green}30`,color:S.green,padding:'10px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                        📱 واتساب
                      </a>
                    )}
                    <button onClick={copyTemplate}
                      style={{flex:1,background:copied?S.greenB:S.gold,color:copied?S.green:S.navy,border:copied?`1px solid ${S.green}30`:'none',padding:'10px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',transition:'all .2s'}}>
                      {copied?'✅ تم النسخ':'📋 نسخ القالب'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes ping{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0}}`}</style>
    </>
  )
}

// ===================================================
// عمود الكانبان
// ===================================================
function KanbanColumn({stage,leads,stages,templates,currentUser,onMove,onDelete,onAddNote,onAddLead}:{
  stage:any;leads:any[];stages:any[];templates:any[];currentUser:any;
  onMove:(id:string,s:string)=>void;
  onDelete:(id:string)=>void;
  onAddNote:(id:string,note:string)=>void;
  onAddLead:(stageId:string,data:any)=>void;
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [form, setForm] = useState({
    name:'',company:'',phone:'',channel:'whatsapp',
    source:'',next_followup_at:todayISO(),notes:'',template:'',
  })

  const urgentCount = leads.filter(l=>{
    const h=(Date.now()-new Date(l.last_action_at||0).getTime())/3600000
    return h>48
  }).length

  async function addLead() {
    if (!form.name) { alert('أدخل اسم العميل'); return }
    setSaving(true)
    await onAddLead(stage.id,{...form})
    setForm({name:'',company:'',phone:'',channel:'whatsapp',source:'',next_followup_at:todayISO(),notes:'',template:''})
    setShowForm(false)
    setSaving(false)
    // إظهار علامتي الصح
    setJustAdded(true)
    setTimeout(()=>setJustAdded(false),3000)
  }

  return (
    <div style={{minWidth:270,maxWidth:270,display:'flex',flexDirection:'column',flexShrink:0}}>

      {/* رأس العمود */}
      <div style={{background:S.navy2,borderRadius:'12px 12px 0 0',padding:'10px 12px',border:`1px solid ${S.border}`,borderBottom:`2px solid ${stage.color}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {urgentCount>0&&(
              <span style={{background:S.red,color:S.white,borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{urgentCount}</span>
            )}
            <span style={{background:`${stage.color}20`,color:stage.color,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{leads.length}</span>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
              <span style={{fontSize:13,fontWeight:800,color:S.white}}>{stage.label}</span>
              <span style={{fontSize:16}}>{stage.icon}</span>
            </div>
            <div style={{fontSize:9,color:S.muted,marginTop:1}}>{stage.desc}</div>
          </div>
        </div>
      </div>

      {/* البطاقات */}
      <div style={{background:`${stage.color}05`,border:`1px solid ${S.border}`,borderTop:'none',borderRadius:'0 0 12px 12px',padding:'10px',flex:1,minHeight:100,maxHeight:'calc(100vh - 320px)',overflowY:'auto'}}>
        {leads.length===0?(
          <div style={{textAlign:'center',color:S.muted,padding:'24px 0',fontSize:11}}>
            <div style={{fontSize:20,marginBottom:6,opacity:.4}}>{stage.icon}</div>
            <div>لا يوجد عملاء</div>
          </div>
        ):leads.map(lead=>(
          <LeadCard key={lead.id} lead={lead} stage={stage} stages={stages}
            templates={templates} onMove={onMove} onDelete={onDelete} onAddNote={onAddNote}/>
        ))}

        {/* علامتا الصح عند الإضافة */}
        {justAdded&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'10px 0',animation:'fadeIn .3s ease'}}>
            <span style={{fontSize:20,color:S.green}}>✅</span>
            <span style={{fontSize:20,color:S.green}}>✅</span>
            <div style={{fontSize:11,color:S.green,fontWeight:700,marginTop:2}}>تمت الإضافة بنجاح</div>
          </div>
        )}

        {/* فورم الإضافة */}
        {!showForm?(
          <button onClick={()=>setShowForm(true)}
            style={{width:'100%',background:'transparent',border:`1px dashed ${stage.color}40`,color:stage.color,padding:'8px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',marginTop:4,opacity:.7}}>
            + إضافة عميل
          </button>
        ):(
          <div style={{background:S.navy3,border:`1px solid ${S.borderG}`,borderRadius:10,padding:12,marginTop:4}}>
            <div style={{fontSize:11,fontWeight:700,color:S.gold,marginBottom:8,textAlign:'right'}}>+ عميل جديد</div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              <input type="text" placeholder="اسم العميل *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{...inp,fontSize:11}}/>
              <input type="text" placeholder="اسم الشركة" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} style={{...inp,fontSize:11}}/>
              <input type="text" placeholder="رقم الهاتف / واتساب" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} style={{...inp,fontSize:11}}/>
              <select value={form.channel} onChange={e=>setForm(p=>({...p,channel:e.target.value}))} style={{...inp,fontSize:11,cursor:'pointer'}}>
                {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
              </select>
              <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))} style={{...inp,fontSize:11,cursor:'pointer'}}>
                <option value="">المصدر...</option>
                {SOURCES.map(s=><option key={s} value={s} style={{background:S.navy2}}>{s}</option>)}
              </select>
              <div>
                <label style={{display:'block',fontSize:9,color:S.muted,marginBottom:3,textAlign:'right'}}>موعد المتابعة (تاريخ اليوم افتراضي)</label>
                <input type="date" value={form.next_followup_at} onChange={e=>setForm(p=>({...p,next_followup_at:e.target.value}))} style={{...inp,fontSize:11,colorScheme:'dark' as any}}/>
              </div>
              <textarea placeholder="ملاحظات..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{...inp,fontSize:11,resize:'none'} as React.CSSProperties}/>
            </div>
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <button onClick={()=>setShowForm(false)} style={{flex:1,background:'transparent',border:`1px solid ${S.border}`,color:S.muted,padding:'7px',borderRadius:7,fontSize:11,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={addLead} disabled={saving} style={{flex:2,background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:'7px',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'...':'+ إضافة'}
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
  const [view,         setView]        = useState<'kanban'|'social'|'tasks'|'templates'>('kanban')
  const [leads,        setLeads]       = useState<any[]>([])
  const [stages,       setStages]      = useState(DEFAULT_STAGES)
  const [templates,    setTemplates]   = useState<any[]>([])
  const [tasks,        setTasks]       = useState<any[]>([])
  const [loading,      setLoading]     = useState(true)
  const [search,       setSearch]      = useState('')
  const [filterCh,     setFilterCh]    = useState('')
  const [showAddStage, setShowAddStage]= useState(false)
  const [newStageLabel,setNewStageLabel]= useState('')
  const [tasksDone,    setTasksDone]   = useState<string[]>([])
  const [currentUser,  setCurrentUser] = useState<any>(null)

  // ── قوالب: إدارة ──
  const [showTplForm,  setShowTplForm] = useState(false)
  const [tplForm,      setTplForm]     = useState({label:'',text:''})
  const [savingTpl,    setSavingTpl]   = useState(false)

  // ── مهام: إدارة ──
  const [showTaskForm, setShowTaskForm]= useState(false)
  const [taskForm,     setTaskForm]    = useState({icon:'📌',label:'',desc:'',priority:'medium'})
  const [savingTask,   setSavingTask]  = useState(false)

  // ── Social stats (قابلة للتعديل اليدوي) ──
  const [socialStats, setSocialStats] = useState<any>({
    linkedin:  {sent:0,replied:0,rate:0},
    facebook:  {comments:0,responded:0,rate:0},
    instagram: {comments:0,responded:0,rate:0},
    whatsapp:  {converted:0,pending:0},
  })
  const [editSocial, setEditSocial] = useState(false)

  // ── تحميل البيانات ──
  const loadAll = useCallback(async()=>{
    setLoading(true)
    try {
      const {data:{user}} = await supabase.auth.getUser()
      setCurrentUser(user)

      const [leadsR, tplsR, tasksR, statsR] = await Promise.all([
        // ① فقط عملاء هذا المستخدم
        supabase.from('marketing_leads').select('*')
          .eq('created_by', user?.id)
          .order('created_at',{ascending:false}),
        // ② قوالب هذا المستخدم
        supabase.from('marketing_templates').select('*')
          .eq('created_by', user?.id)
          .order('created_at',{ascending:true}),
        // ③ مهام هذا المستخدم
        supabase.from('marketing_tasks').select('*')
          .eq('created_by', user?.id)
          .order('created_at',{ascending:true}),
        // ④ إحصائيات السوشيال
        supabase.from('marketing_social_stats').select('*')
          .eq('created_by', user?.id)
          .limit(1).single(),
      ])

      setLeads(leadsR.data||[])
      setTemplates(tplsR.data||[])
      setTasks(tasksR.data||[])
      if (statsR.data) setSocialStats(statsR.data.stats)
    } catch(e){ console.error(e) }
    setLoading(false)
  },[])

  useEffect(()=>{ loadAll() },[loadAll])

  // ── إضافة عميل (مرتبط بالمستخدم) ──
  async function addLead(stageId:string, data:any) {
    const {data:res} = await supabase.from('marketing_leads').insert([{
      stage_id:stageId, name:data.name, company:data.company,
      phone:data.phone, channel:data.channel, source:data.source,
      next_followup_at:data.next_followup_at||null,
      notes:data.notes, last_action_at:new Date().toISOString(),
      activity_log:[], created_by:currentUser?.id,
    }]).select().single()
    if (res) setLeads(prev=>[res,...prev])
  }

  // ── نقل بطاقة ──
  async function moveLead(id:string, newStage:string) {
    await supabase.from('marketing_leads').update({stage_id:newStage,last_action_at:new Date().toISOString()}).eq('id',id)
    setLeads(prev=>prev.map(l=>l.id===id?{...l,stage_id:newStage,last_action_at:new Date().toISOString()}:l))
  }

  // ── حذف عميل ──
  async function deleteLead(id:string) {
    if (!window.confirm('حذف العميل نهائياً؟')) return
    await supabase.from('marketing_leads').delete().eq('id',id)
    setLeads(prev=>prev.filter(l=>l.id!==id))
  }

  // ── إضافة ملاحظة للعميل ──
  async function addNote(leadId:string, note:string) {
    const lead = leads.find(l=>l.id===leadId)
    if (!lead) return
    const updatedNotes = (lead.notes?lead.notes+'\n\n':'')+`[${new Date().toLocaleDateString('ar-EG')}] ${note}`
    const newLog = [...(lead.activity_log||[]),{note,by:'أنت',at:new Date().toISOString()}]
    await supabase.from('marketing_leads').update({notes:updatedNotes,activity_log:newLog}).eq('id',leadId)
    setLeads(prev=>prev.map(l=>l.id===leadId?{...l,notes:updatedNotes,activity_log:newLog}:l))
  }

  // ── إضافة قالب ──
  async function addTemplate() {
    if (!tplForm.label||!tplForm.text) { alert('أدخل العنوان والنص'); return }
    setSavingTpl(true)
    const {data:res} = await supabase.from('marketing_templates').insert([{
      ...tplForm, created_by:currentUser?.id,
    }]).select().single()
    if (res) setTemplates(prev=>[...prev,res])
    setTplForm({label:'',text:''})
    setShowTplForm(false)
    setSavingTpl(false)
  }

  async function deleteTemplate(id:string) {
    if (!window.confirm('حذف القالب؟')) return
    await supabase.from('marketing_templates').delete().eq('id',id)
    setTemplates(prev=>prev.filter(t=>t.id!==id))
  }

  // ── إضافة مهمة ──
  async function addTask() {
    if (!taskForm.label) { alert('أدخل اسم المهمة'); return }
    setSavingTask(true)
    const {data:res} = await supabase.from('marketing_tasks').insert([{
      ...taskForm, created_by:currentUser?.id,
    }]).select().single()
    if (res) setTasks(prev=>[...prev,res])
    setTaskForm({icon:'📌',label:'',desc:'',priority:'medium'})
    setShowTaskForm(false)
    setSavingTask(false)
  }

  async function deleteTask(id:string) {
    await supabase.from('marketing_tasks').delete().eq('id',id)
    setTasks(prev=>prev.filter(t=>t.id!==id))
  }

  // ── حفظ إحصائيات السوشيال ──
  async function saveSocialStats() {
    const {data:existing} = await supabase.from('marketing_social_stats').select('id').eq('created_by',currentUser?.id).single()
    if (existing?.id) {
      await supabase.from('marketing_social_stats').update({stats:socialStats}).eq('id',existing.id)
    } else {
      await supabase.from('marketing_social_stats').insert([{stats:socialStats,created_by:currentUser?.id}])
    }
    setEditSocial(false)
    alert('✅ تم حفظ الإحصائيات')
  }

  // ── إضافة مرحلة مخصصة ──
  function addStage() {
    if (!newStageLabel) return
    setStages(prev=>[...prev,{id:`custom_${Date.now()}`,label:newStageLabel,icon:'📌',color:S.teal,desc:'مرحلة مخصصة'}])
    setNewStageLabel(''); setShowAddStage(false)
  }

  const filteredLeads = leads.filter(l=>{
    const ms = !search||l.name?.includes(search)||l.company?.includes(search)
    const mc = !filterCh||l.channel===filterCh
    return ms&&mc
  })

  const totalLeads  = leads.length
  const hotLeads    = leads.filter(l=>l.stage_id==='action').length
  const urgentLeads = leads.filter(l=>(Date.now()-new Date(l.last_action_at||0).getTime())/3600000>48).length
  const todayLeads  = leads.filter(l=>{ const d=new Date(l.created_at),t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth() }).length

  const TABS = [
    {key:'kanban',    label:'📋 لوحة المبيعات'},
    {key:'templates', label:'🎯 قوالب الإقناع'},
    {key:'tasks',     label:'✅ المهام اليومية'},
    {key:'social',    label:'📡 منصات التواصل'},
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal, sans-serif',direction:'rtl',background:S.navy}}>

      {/* ── الهيدر ── */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'12px 24px',flexShrink:0}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
          {[
            {icon:'👥',label:'إجمالي العملاء',val:totalLeads,  color:S.blue},
            {icon:'🚀',label:'جاهزون للإغلاق', val:hotLeads,   color:S.green},
            {icon:'🔴',label:'تواصل عاجل',      val:urgentLeads,color:S.red},
            {icon:'✨',label:'مضافون اليوم',    val:todayLeads, color:S.gold},
          ].map((s,i)=>(
            <div key={i} style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:9,padding:'9px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:18}}>{s.icon}</span>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:18,fontWeight:900,color:s.color,fontFamily:'monospace'}}>{s.val}</div>
                <div style={{fontSize:9,color:S.muted}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <input type="text" placeholder="🔍 ابحث عن عميل أو شركة..." value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{...inp,flex:1,background:S.navy3,fontSize:12}}/>
          <select value={filterCh} onChange={e=>setFilterCh(e.target.value)}
            style={{...inp,width:'auto',fontSize:12,cursor:'pointer'}}>
            <option value="">كل القنوات</option>
            {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── التبويبات ── */}
      <div style={{display:'flex',background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'0 24px',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setView(t.key as any)}
            style={{padding:'11px 18px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',borderBottom:view===t.key?`2px solid ${S.gold}`:'2px solid transparent',background:'transparent',color:view===t.key?S.gold2:S.muted,whiteSpace:'nowrap',transition:'all .15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{flex:1,overflow:'hidden',position:'relative'}}>

        {/* ══ الكانبان ══ */}
        {view==='kanban'&&(
          <div style={{display:'flex',gap:12,padding:'16px 24px',overflowX:'auto',height:'100%',alignItems:'flex-start'}}>
            {stages.map(stage=>(
              <KanbanColumn key={stage.id} stage={stage}
                leads={filteredLeads.filter(l=>l.stage_id===stage.id)}
                stages={stages} templates={templates} currentUser={currentUser}
                onMove={moveLead} onDelete={deleteLead} onAddNote={addNote} onAddLead={addLead}/>
            ))}
            <div style={{minWidth:160,flexShrink:0}}>
              {!showAddStage?(
                <button onClick={()=>setShowAddStage(true)}
                  style={{width:'100%',background:S.card,border:`1px dashed ${S.border}`,color:S.muted,padding:'14px',borderRadius:12,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <span style={{fontSize:18}}>+</span><span>مرحلة جديدة</span>
                </button>
              ):(
                <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:12,padding:12}}>
                  <input type="text" placeholder="اسم المرحلة..." value={newStageLabel}
                    onChange={e=>setNewStageLabel(e.target.value)}
                    style={{...inp,marginBottom:8,fontSize:12}}/>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setShowAddStage(false)} style={{flex:1,background:'transparent',border:`1px solid ${S.border}`,color:S.muted,padding:'7px',borderRadius:7,fontSize:11,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                    <button onClick={addStage} style={{flex:2,background:S.gold,color:S.navy,border:'none',padding:'7px',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>+ إضافة</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ القوالب ══ */}
        {view==='templates'&&(
          <div style={{padding:'20px 24px',overflowY:'auto',height:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <button onClick={()=>setShowTplForm(true)}
                style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                + إضافة قالب جديد
              </button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>🎯 قوالب الإقناع</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>قوالب رسائل مخصصة لشركتك — {templates.length} قالب</div>
              </div>
            </div>

            {showTplForm&&(
              <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:14,padding:20,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:S.gold2,marginBottom:14,textAlign:'right'}}>قالب جديد</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>عنوان القالب *</label>
                    <input type="text" placeholder="مثال: 👋 رسالة الترحيب" value={tplForm.label}
                      onChange={e=>setTplForm(p=>({...p,label:e.target.value}))} style={inp}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>نص القالب *</label>
                    <textarea value={tplForm.text} onChange={e=>setTplForm(p=>({...p,text:e.target.value}))}
                      placeholder="اكتب نص الرسالة هنا... يمكنك استخدام [اسم العميل] كمتغير" rows={8}
                      style={{...inp,resize:'vertical'} as React.CSSProperties}/>
                  </div>
                </div>
                <div style={{display:'flex',gap:10,marginTop:14,justifyContent:'flex-start'}}>
                  <button onClick={()=>setShowTplForm(false)}
                    style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'9px 18px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                  <button onClick={addTemplate} disabled={savingTpl}
                    style={{background:savingTpl?S.muted:S.gold,color:S.navy,border:'none',padding:'9px 24px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                    {savingTpl?'⏳...':'💾 حفظ القالب'}
                  </button>
                </div>
              </div>
            )}

            {templates.length===0?(
              <div style={{textAlign:'center',color:S.muted,padding:'60px 0'}}>
                <div style={{fontSize:48,marginBottom:16}}>📝</div>
                <div style={{fontSize:16,fontWeight:700,color:S.white,marginBottom:8}}>لا توجد قوالب بعد</div>
                <div style={{fontSize:13}}>أضف قوالب رسائل مخصصة لشركتك لاستخدامها مع العملاء</div>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
                {templates.map((t:any)=>(
                  <div key={t.id} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:12,padding:18,borderRight:`3px solid ${S.gold}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <button onClick={()=>deleteTemplate(t.id)}
                        style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:14}}>✕</button>
                      <div style={{fontSize:13,fontWeight:700,color:S.gold2,textAlign:'right'}}>{t.label}</div>
                    </div>
                    <div style={{fontSize:12,color:S.muted,lineHeight:'1.8',textAlign:'right',whiteSpace:'pre-wrap',background:S.navy3,borderRadius:8,padding:'10px 12px'}}>
                      {t.text.slice(0,200)}{t.text.length>200?'...':''}
                    </div>
                    <button
                      onClick={()=>{ navigator.clipboard.writeText(t.text); alert('✅ تم نسخ القالب') }}
                      style={{marginTop:10,width:'100%',background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'7px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                      📋 نسخ القالب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ المهام اليومية ══ */}
        {view==='tasks'&&(
          <div style={{padding:'20px 24px',overflowY:'auto',height:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowTaskForm(true)}
                  style={{background:S.gold,color:S.navy,border:'none',padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  + إضافة مهمة
                </button>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>✅ المهام اليومية</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>محددة من صاحب الشركة — {tasksDone.length}/{tasks.length} مكتملة</div>
              </div>
            </div>

            {/* شريط التقدم */}
            <div style={{background:S.border,borderRadius:4,height:6,marginBottom:18,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${tasks.length?( tasksDone.length/tasks.length)*100:0}%`,background:`linear-gradient(90deg,${S.gold},${S.green})`,borderRadius:4,transition:'width .4s'}}/>
            </div>

            {/* فورم إضافة مهمة */}
            {showTaskForm&&(
              <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:14,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:S.gold2,marginBottom:12,textAlign:'right'}}>مهمة جديدة</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>الأيقونة</label>
                    <input type="text" value={taskForm.icon} onChange={e=>setTaskForm(p=>({...p,icon:e.target.value}))} style={{...inp,fontSize:14}} placeholder="📌"/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>الأولوية</label>
                    <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="high"   style={{background:S.navy2}}>عالي</option>
                      <option value="medium" style={{background:S.navy2}}>متوسط</option>
                      <option value="low"    style={{background:S.navy2}}>عادي</option>
                    </select>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>اسم المهمة *</label>
                  <input type="text" placeholder="اسم المهمة" value={taskForm.label} onChange={e=>setTaskForm(p=>({...p,label:e.target.value}))} style={inp}/>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>التفاصيل والتوجيهات</label>
                  <textarea value={taskForm.desc} onChange={e=>setTaskForm(p=>({...p,desc:e.target.value}))}
                    placeholder="اشرح للموظف كيفية تنفيذ المهمة..." rows={3}
                    style={{...inp,resize:'none'} as React.CSSProperties}/>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-start'}}>
                  <button onClick={()=>setShowTaskForm(false)}
                    style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'8px 16px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                  <button onClick={addTask} disabled={savingTask}
                    style={{background:savingTask?S.muted:S.gold,color:S.navy,border:'none',padding:'8px 20px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                    {savingTask?'⏳...':'+ إضافة المهمة'}
                  </button>
                </div>
              </div>
            )}

            {tasks.length===0?(
              <div style={{textAlign:'center',color:S.muted,padding:'60px 0'}}>
                <div style={{fontSize:48,marginBottom:16}}>📋</div>
                <div style={{fontSize:16,fontWeight:700,color:S.white,marginBottom:8}}>لا توجد مهام بعد</div>
                <div style={{fontSize:13}}>أضف المهام اليومية التي تريد من موظفيك تنفيذها</div>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {tasks.map((task:any)=>{
                  const done = tasksDone.includes(task.id)
                  const prioColor = task.priority==='high'?S.red:task.priority==='medium'?S.amber:S.muted
                  return (
                    <div key={task.id}
                      style={{background:done?S.greenB:S.navy2,border:`1px solid ${done?S.green+'40':S.border}`,borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all .2s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <button onClick={()=>deleteTask(task.id)}
                          style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:12,flexShrink:0}}>✕</button>
                        <div onClick={()=>setTasksDone(prev=>done?prev.filter(id=>id!==task.id):[...prev,task.id])}
                          style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${done?S.green:S.border}`,background:done?S.green:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',transition:'all .2s'}}>
                          {done&&<span style={{color:S.navy,fontSize:12,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${prioColor}18`,color:prioColor,fontWeight:700}}>
                          {task.priority==='high'?'عالي':task.priority==='medium'?'متوسط':'عادي'}
                        </span>
                      </div>
                      <div style={{textAlign:'right',cursor:'pointer'}} onClick={()=>setTasksDone(prev=>done?prev.filter(id=>id!==task.id):[...prev,task.id])}>
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end',marginBottom:4}}>
                          <div style={{fontSize:13,fontWeight:700,color:done?S.green:S.white,textDecoration:done?'line-through':'none'}}>{task.label}</div>
                          <span style={{fontSize:18}}>{task.icon}</span>
                        </div>
                        {task.desc&&<div style={{fontSize:11,color:S.muted,lineHeight:'1.6'}}>{task.desc}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ منصات التواصل ══ */}
        {view==='social'&&(
          <div style={{padding:'20px 24px',overflowY:'auto',height:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <button onClick={editSocial?saveSocialStats:()=>setEditSocial(true)}
                style={{background:editSocial?S.gold:S.card2,color:editSocial?S.navy:S.white,border:`1px solid ${editSocial?S.gold:S.border}`,padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {editSocial?'💾 حفظ الإحصائيات':'✏️ تحديث الأرقام'}
              </button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>📡 منصات التواصل الاجتماعي</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>أدخل الأرقام يدوياً من كل منصة</div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>

              {/* LinkedIn */}
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20,borderTop:'3px solid #0A66C2'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexDirection:'row-reverse'}}>
                  <span style={{fontSize:26}}>💼</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:'#0A66C2'}}>LinkedIn</div>
                    <div style={{fontSize:11,color:S.muted}}>المحرك الرئيسي للـ B2B</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[
                    {label:'رسائل مرسلة',key:'sent',   color:S.blue},
                    {label:'تم الرد',    key:'replied', color:S.green},
                    {label:'معدل الرد', key:'rate',    color:S.gold,suffix:'%'},
                  ].map(f=>(
                    <div key={f.key} style={{background:S.card,borderRadius:8,padding:'10px',textAlign:'center'}}>
                      {editSocial?(
                        <input type="number" value={(socialStats.linkedin as any)[f.key]}
                          onChange={e=>setSocialStats((p:any)=>({...p,linkedin:{...p.linkedin,[f.key]:parseInt(e.target.value)||0}}))}
                          style={{...inp,textAlign:'center',fontSize:16,fontWeight:900,padding:'4px',marginBottom:4}}/>
                      ):(
                        <div style={{fontSize:20,fontWeight:900,color:f.color,fontFamily:'monospace'}}>{(socialStats.linkedin as any)[f.key]}{f.suffix||''}</div>
                      )}
                      <div style={{fontSize:9,color:S.muted,marginTop:2}}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facebook */}
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20,borderTop:'3px solid #1877F2'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexDirection:'row-reverse'}}>
                  <span style={{fontSize:26}}>📘</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:'#1877F2'}}>Facebook</div>
                    <div style={{fontSize:11,color:S.muted}}>الرد خلال 30 دقيقة = عميل محتمل</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  {[
                    {label:'تعليقات',  key:'comments',   color:'#1877F2'},
                    {label:'تم الرد',  key:'responded',  color:S.green},
                  ].map(f=>(
                    <div key={f.key} style={{background:S.card,borderRadius:8,padding:'10px',textAlign:'center'}}>
                      {editSocial?(
                        <input type="number" value={(socialStats.facebook as any)[f.key]}
                          onChange={e=>setSocialStats((p:any)=>({...p,facebook:{...p.facebook,[f.key]:parseInt(e.target.value)||0,rate:Math.round(((f.key==='responded'?parseInt(e.target.value)||0:p.facebook.responded)/Math.max(1,f.key==='comments'?parseInt(e.target.value)||1:p.facebook.comments))*100)}}))}
                          style={{...inp,textAlign:'center',fontSize:16,fontWeight:900,padding:'4px',marginBottom:4}}/>
                      ):(
                        <div style={{fontSize:20,fontWeight:900,color:f.color,fontFamily:'monospace'}}>{(socialStats.facebook as any)[f.key]}</div>
                      )}
                      <div style={{fontSize:9,color:S.muted}}>{f.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:S.card,borderRadius:8,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:16,fontWeight:900,color:socialStats.facebook.rate>80?S.green:S.red,fontFamily:'monospace'}}>{socialStats.facebook.rate}%</span>
                  <span style={{fontSize:11,color:S.muted}}>معدل الرد</span>
                </div>
                <div style={{height:5,background:S.border,borderRadius:3,marginTop:8,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${socialStats.facebook.rate}%`,background:socialStats.facebook.rate>80?S.green:S.red,borderRadius:3,transition:'width .4s'}}/>
                </div>
              </div>

              {/* Instagram */}
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20,borderTop:'3px solid #E4405F'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexDirection:'row-reverse'}}>
                  <span style={{fontSize:26}}>📸</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:'#E4405F'}}>Instagram</div>
                    <div style={{fontSize:11,color:S.muted}}>بناء الثقة وعرض المنتجات</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  {[
                    {label:'تعليقات', key:'comments',  color:'#E4405F'},
                    {label:'تم الرد', key:'responded', color:S.green},
                  ].map(f=>(
                    <div key={f.key} style={{background:S.card,borderRadius:8,padding:'10px',textAlign:'center'}}>
                      {editSocial?(
                        <input type="number" value={(socialStats.instagram as any)[f.key]}
                          onChange={e=>setSocialStats((p:any)=>({...p,instagram:{...p.instagram,[f.key]:parseInt(e.target.value)||0,rate:Math.round(((f.key==='responded'?parseInt(e.target.value)||0:p.instagram.responded)/Math.max(1,f.key==='comments'?parseInt(e.target.value)||1:p.instagram.comments))*100)}}))}
                          style={{...inp,textAlign:'center',fontSize:16,fontWeight:900,padding:'4px',marginBottom:4}}/>
                      ):(
                        <div style={{fontSize:20,fontWeight:900,color:f.color,fontFamily:'monospace'}}>{(socialStats.instagram as any)[f.key]}</div>
                      )}
                      <div style={{fontSize:9,color:S.muted}}>{f.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:S.card,borderRadius:8,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:16,fontWeight:900,color:socialStats.instagram.rate>80?S.green:S.red,fontFamily:'monospace'}}>{socialStats.instagram.rate}%</span>
                  <span style={{fontSize:11,color:S.muted}}>معدل الرد</span>
                </div>
              </div>

              {/* WhatsApp */}
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20,borderTop:`3px solid ${S.green}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexDirection:'row-reverse'}}>
                  <span style={{fontSize:26}}>📱</span>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:800,color:S.green}}>WhatsApp Business</div>
                    <div style={{fontSize:11,color:S.muted}}>قناة الإغلاق الذهبية</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    {label:'محوّلون لـ "جاهز"',key:'converted',color:S.green},
                    {label:'قيد المتابعة',    key:'pending',  color:S.amber},
                  ].map(f=>(
                    <div key={f.key} style={{background:S.card,borderRadius:9,padding:12,textAlign:'center'}}>
                      {editSocial?(
                        <input type="number" value={(socialStats.whatsapp as any)[f.key]}
                          onChange={e=>setSocialStats((p:any)=>({...p,whatsapp:{...p.whatsapp,[f.key]:parseInt(e.target.value)||0}}))}
                          style={{...inp,textAlign:'center',fontSize:20,fontWeight:900,padding:'4px',marginBottom:4}}/>
                      ):(
                        <div style={{fontSize:28,fontWeight:900,color:f.color,fontFamily:'monospace'}}>{(socialStats.whatsapp as any)[f.key]}</div>
                      )}
                      <div style={{fontSize:9,color:S.muted,marginTop:4}}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* قمع المبيعات */}
            <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:14,padding:20,marginTop:14}}>
              <div style={{fontSize:13,fontWeight:800,color:S.gold2,marginBottom:14,textAlign:'right'}}>📊 قمع المبيعات</div>
              {stages.slice(0,5).map(stage=>{
                const count=leads.filter(l=>l.stage_id===stage.id).length
                const pct=totalLeads?Math.round((count/totalLeads)*100):0
                return (
                  <div key={stage.id} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:11,fontFamily:'monospace',color:stage.color,fontWeight:700}}>{count}</span>
                      <span style={{fontSize:11,color:S.muted}}>{stage.icon} {stage.label}</span>
                    </div>
                    <div style={{height:6,background:S.border,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:stage.color,borderRadius:3,transition:'width .4s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      `}</style>
    </div>
  )
}
