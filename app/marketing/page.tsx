'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { COUNTRIES } from '../components/options';

const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#0C1A32',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.10)',goldB:'rgba(201,168,76,0.20)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.07)',borderG:'rgba(201,168,76,0.20)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.10)',
  red:'#EF4444',redB:'rgba(239,68,68,0.10)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.10)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.10)',
  purple:'#8B5CF6',
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
function timeAgo(d:string) {
  if (!d) return '—'
  const m=Math.floor((Date.now()-new Date(d).getTime())/60000)
  if (m<60) return `منذ ${m} دقيقة`
  if (m<1440) return `منذ ${Math.floor(m/60)} ساعة`
  return `منذ ${Math.floor(m/1440)} يوم`
}
function urgColor(d:string) {
  if (!d) return S.muted
  const h=(Date.now()-new Date(d).getTime())/3600000
  return h>48?S.red:h>24?S.amber:S.green
}
function urgLabel(d:string) {
  if (!d) return '—'
  const h=(Date.now()-new Date(d).getTime())/3600000
  return h>48?'🔴 عاجل':h>24?'🟡 متأخر':'🟢 نشط'
}

// ======================================================
// بطاقة العميل
// ======================================================
function LeadCard({lead,stage,stages,templates,onMove,onDelete,onAddNote,onMarkContacted,onTransfer}:{
  lead:any;stage:any;stages:any[];templates:any[];
  onMove:(id:string,s:string)=>void;
  onDelete:(id:string)=>void;
  onAddNote:(id:string,note:string)=>void;
  onMarkContacted:(id:string)=>void;
  onTransfer:(lead:any)=>void;
}) {
  const [showDetail,setShowDetail]=useState(false)
  const [showTpl,   setShowTpl]   =useState(false)
  const [showEdit,  setShowEdit]  =useState(false)
  const [selTpl,    setSelTpl]    =useState<any>(templates[0]||null)
  const [copied,    setCopied]    =useState(false)
  const [newNote,   setNewNote]   =useState('')
  const [savingN,   setSavingN]   =useState(false)
  const [savingE,   setSavingE]   =useState(false)
  const [editData,  setEditData]  =useState({
    name:lead.name||'', company:lead.company||'', phone:lead.phone||'',
    email:lead.email||'', website:lead.website||'', source:lead.source||'',
    channel:lead.channel||'whatsapp', next_followup_at:lead.next_followup_at||'',
  })

  const ch        = CHANNELS[lead.channel]||CHANNELS.whatsapp
  const uc        = urgColor(lead.last_action_at)
  const isDecision= stage?.id==='decision'
  const isAction  = stage?.id==='action'
  const contacted = !!lead.contacted_at

  useEffect(()=>{ if(templates.length>0&&!selTpl) setSelTpl(templates[0]) },[templates])

  function copyTpl() {
    if (!selTpl) return
    navigator.clipboard.writeText(selTpl.text)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  // FIX 1: الملاحظة تُضاف لـ activity_log فقط، لا تُكرر في notes
  async function saveNote() {
    if (!newNote.trim()) return
    setSavingN(true)
    await onAddNote(lead.id, newNote.trim())
    setNewNote(''); setSavingN(false)
  }

  async function saveEdit() {
    if (!editData.name.trim()) return
    setSavingE(true)
    await supabase.from('marketing_leads').update({
      name:editData.name, company:editData.company||null,
      phone:editData.phone||null, email:editData.email||null,
      website:editData.website||null, source:editData.source||null,
      channel:editData.channel,
      next_followup_at:editData.next_followup_at||null,
    }).eq('id',lead.id)
    // تحديث محلي
    Object.assign(lead, editData)
    setShowEdit(false); setSavingE(false)
  }

  return (
    <>
      {/* ── البطاقة ── */}
      <div onClick={()=>setShowDetail(true)} style={{
        background:S.card2,
        border:`1px solid ${isDecision?S.gold+'60':S.border}`,
        borderRight:isDecision?`3px solid ${S.gold}`:`1px solid ${S.border}`,
        borderRadius:10,padding:'11px 13px',marginBottom:8,cursor:'pointer',
        boxShadow:isDecision?`0 0 10px ${S.gold}15`:'none',
        position:'relative',transition:'all .15s',
      }}>

        {/* FIX: مؤشر التواصل من بره على كل بطاقة */}
        <div style={{position:'absolute',top:7,left:8}}>
          <span style={{
            fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:20,
            background:contacted?S.greenB:S.card,
            color:contacted?S.green:S.muted,
            border:`1px solid ${contacted?S.green+'30':S.border}`,
          }}>
            {contacted?'✓ تواصلنا':'لم نتواصل'}
          </span>
        </div>

{/* مؤشر التواصل + النبض + الاسم — صف واحد مرتب */}
<div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7, marginTop:0, paddingTop:4, minHeight:40}}>

  <div style={{textAlign:'right', flex:1, marginRight:8, display:'flex', flexDirection:'column'}}>

    {/* اسم العميل */}
    <div style={{fontSize:13, fontWeight:700, color:isDecision?S.gold2:S.white, lineHeight:1.4}}>
      {lead.name}
    </div>

    {/* اسم الشركة */}
    {lead.company && (
      <div style={{fontSize:10, color:S.muted, lineHeight:1, marginTop:10}}>
        {lead.company}
      </div>
    )}

  </div>

  {/* حالة المتابعة */}
  <div style={{
    display:'flex',
    alignItems:'center',
    gap:4,
    flexShrink:0,
    marginTop:18,
    alignSelf:'flex-start'
  }}>
    <span style={{fontSize:9, color:uc, fontWeight:700}}>
      {urgLabel(lead.last_action_at)}
    </span>
  </div>

</div>

        {/* القناة + المصدر */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
          <span style={{fontSize:10,color:S.muted}}>{lead.source||'—'}</span>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{fontSize:10,color:ch.color,fontWeight:600}}>{ch.label}</span>
            <span style={{fontSize:13}}>{ch.icon}</span>
          </div>
        </div>

        {/* التاريخ */}
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:9}}>
          <div style={{fontSize:9,color:S.muted}}>
            {lead.next_followup_at&&<span style={{color:S.amber}}>📅 {new Date(lead.next_followup_at).toLocaleDateString('ar-EG',{month:'short',day:'numeric'})}</span>}
          </div>
          <div style={{fontSize:9,color:S.muted}}>آخر إجراء: {timeAgo(lead.last_action_at)}</div>
        </div>

        {/* FIX 2: الأزرار — واتساب + أدوات الإقناع + نقل */}
        <div style={{display:'flex',gap:5,justifyContent:'flex-end',flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
          {lead.phone&&(
            <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{background:S.greenB,border:`1px solid ${S.green}30`,color:S.green,padding:'4px 8px',borderRadius:6,fontSize:10,fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:3}}>
               واتساب
            </a>
          )}
          <button onClick={()=>setShowTpl(true)}
            style={{background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'4px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
             إقناع
          </button>      
          <select defaultValue="" onChange={e=>{if(e.target.value){onMove(lead.id,e.target.value);e.target.value=''}}}
            style={{background:S.card,border:`1px solid ${S.border}`,color:S.muted,borderRadius:6,fontSize:10,padding:'4px 5px',cursor:'pointer',fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
            <option value="">نقل←</option>
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
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>setShowDetail(false)} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:isDecision?S.gold2:S.white}}>{lead.name}</div>
                {lead.company&&<div style={{fontSize:11,color:S.muted}}>{lead.company}</div>}
              </div>
            </div>
            <div style={{padding:18}}>

              {/* معلومات */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                {[
                  {l:'المرحلة',v:`${stage?.icon} ${stage?.label}`},
                  {l:'القناة',  v:`${ch.icon} ${ch.label}`},
                  {l:'الهاتف',  v:lead.phone||'—'},
                  {l:'الإيميل', v:lead.email||'—'},
                  {l:'الموقع',  v:lead.website||'—'},
                  {l:'المصدر',  v:lead.source||'—'},
                  {l:'آخر إجراء',v:timeAgo(lead.last_action_at)},
                  {l:'المتابعة',v:lead.next_followup_at?new Date(lead.next_followup_at).toLocaleDateString('ar-EG'):'—'},
                ].map((f,i)=>(
                  <div key={i} style={{background:S.card,borderRadius:7,padding:'8px 10px',textAlign:'right'}}>
                    <div style={{fontSize:8,color:S.muted,fontWeight:700,marginBottom:2}}>{f.l}</div>
                    <div style={{fontSize:11,fontWeight:600,color:S.white,wordBreak:'break-all'}}>{f.v}</div>
                  </div>
                ))}
              </div>

              {/* مؤشر التواصل */}
              <button onClick={()=>{ onMarkContacted(lead.id); setShowDetail(false) }}
                style={{width:'100%',background:contacted?S.greenB:S.card,border:`1px solid ${contacted?S.green+'40':S.border}`,borderRadius:8,padding:'9px 14px',cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{fontSize:13}}>{contacted?'✓':'📞'}</span>
                <span style={{fontSize:12,fontWeight:700,color:contacted?S.green:S.muted}}>
                  {contacted?`تم التواصل — ${timeAgo(lead.contacted_at)}`:'اضغط لتسجيل التواصل'}
                </span>
              </button>

              {/* ملاحظات التسجيل */}
              {lead.notes&&(
                <div style={{background:S.card,borderRadius:7,padding:'10px 12px',marginBottom:12}}>
                  <div style={{fontSize:8,color:S.muted,fontWeight:700,marginBottom:4,textAlign:'right'}}>📌 ملاحظات التسجيل</div>
                  <div style={{fontSize:11,color:S.white,lineHeight:'1.8',textAlign:'right',whiteSpace:'pre-wrap'}}>{lead.notes}</div>
                </div>
              )}

              {/* FIX 1: سجل النشاط — الملاحظات اللاحقة فقط (لا تكرار) */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,fontWeight:700,color:S.muted,marginBottom:7,textAlign:'right'}}>📋 سجل النشاط ({(lead.activity_log||[]).length})</div>
                {(lead.activity_log||[]).length===0?(
                  <div style={{textAlign:'center',color:S.muted,padding:'10px',fontSize:11}}>لا يوجد نشاط مسجل بعد</div>
                ):(lead.activity_log||[]).map((act:any,i:number)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:7,flexDirection:'row-reverse'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:S.gold,flexShrink:0,marginTop:5}}/>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:S.white}}>{act.note}</div>
                      <div style={{fontSize:9,color:S.muted,marginTop:2}}>{act.by} • {timeAgo(act.at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* إضافة ملاحظة */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>✏️ إضافة للسجل</div>
                <textarea value={newNote} onChange={e=>setNewNote(e.target.value)}
                  placeholder="اكتب ملاحظتك..." rows={2}
                  style={{...inp,resize:'none',marginBottom:7,fontSize:11} as React.CSSProperties}/>
                <button onClick={saveNote} disabled={savingN||!newNote.trim()}
                  style={{background:savingN||!newNote.trim()?S.muted:S.gold,color:S.navy,border:'none',padding:'7px 16px',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',float:'left'}}>
                  {savingN?'⏳...':'💾 حفظ'}
                </button>
                <div style={{clear:'both'}}/>
              </div>

              {/* FIX 8: ترحيل للعملاء عندما يكون جاهزاً */}
              {isAction&&(
                <div style={{background:S.greenB,border:`1px solid ${S.green}30`,borderRadius:10,padding:'12px 14px',marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:S.green,marginBottom:5,textAlign:'right'}}>🚀 هذا العميل جاهز للإغلاق!</div>
                  <button onClick={()=>{ onTransfer(lead); setShowDetail(false) }}
                    style={{width:'100%',background:S.green,color:S.navy,border:'none',padding:'9px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                    ✅ ترحيل لإدارة العملاء
                  </button>
                </div>
              )}
              {/* أزرار الأسفل */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button onClick={()=>{ onDelete(lead.id); setShowDetail(false) }}
                  style={{background:S.redB,border:`1px solid ${S.red}30`,color:S.red,padding:'8px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🗑️ حذف</button>
                <button onClick={()=>setShowEdit(!showEdit)}
                  style={{background:showEdit?S.amberB:S.card2,border:`1px solid ${showEdit?S.amber+'40':S.border}`,color:showEdit?S.amber:S.muted,padding:'8px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>✏️ تعديل</button>
                {lead.phone&&(
                  <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                    style={{background:S.greenB,border:`1px solid ${S.green}30`,color:S.green,padding:'8px 12px',borderRadius:8,fontSize:11,fontWeight:700,fontFamily:'Tajawal, sans-serif',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                    📱 واتساب
                  </a>
                )}
<button onClick={() => { setShowDetail(false); setShowTpl(true); }}
  style={{flex:1,background:S.gold,color:S.navy,border:'none',padding:'8px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',minWidth:100}}>
  🎯 أدوات الإقناع
</button>
              </div>

              {/* فورم التعديل */}
              {showEdit&&(
                <div style={{background:S.navy3,border:`1px solid ${S.borderG}`,borderRadius:10,padding:14,marginTop:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:S.gold,marginBottom:10,textAlign:'right'}}>✏️ تعديل بيانات العميل</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    {[
                      {l:'الاسم *',  k:'name',    t:'text'},
                      {l:'الشركة',   k:'company', t:'text'},
                      {l:'الهاتف',   k:'phone',   t:'text'},
                      {l:'الإيميل',  k:'email',   t:'email'},
                      {l:'الموقع',   k:'website', t:'text'},
                      {l:'المصدر',   k:'source',  t:'text'},
                    ].map(f=>(
                      <div key={f.k}>
                        <label style={{display:'block',fontSize:8,color:S.muted,marginBottom:3,textAlign:'right'}}>{f.l}</label>
                        <input type={f.t} value={(editData as any)[f.k]} onChange={e=>setEditData(p=>({...p,[f.k]:e.target.value}))} style={{...inp,fontSize:11,padding:'7px 10px'}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <label style={{display:'block',fontSize:8,color:S.muted,marginBottom:3,textAlign:'right'}}>القناة</label>
                      <select value={editData.channel} onChange={e=>setEditData(p=>({...p,channel:e.target.value}))} style={{...inp,fontSize:11,padding:'7px 10px',cursor:'pointer'}}>
                        {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:8,color:S.muted,marginBottom:3,textAlign:'right'}}>موعد المتابعة</label>
                      <input type="date" value={editData.next_followup_at} onChange={e=>setEditData(p=>({...p,next_followup_at:e.target.value}))} style={{...inp,fontSize:11,padding:'7px 10px',colorScheme:'dark' as any}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowEdit(false)} style={{flex:1,background:'transparent',border:`1px solid ${S.border}`,color:S.muted,padding:'8px',borderRadius:8,fontSize:11,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                    <button onClick={saveEdit} disabled={savingE} style={{flex:2,background:savingE?S.muted:S.gold,color:S.navy,border:'none',padding:'8px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                      {savingE?'⏳...':'💾 حفظ التعديلات'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes ping{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0}}`}</style>
    </>
  )
}

// ======================================================
// عمود الكانبان — FIX 5: + في الهيدر | FIX 7: تعديل/حذف العمود
// ======================================================
function KanbanColumn({stage,leads,stages,templates,onMove,onDelete,onAddNote,onAddLead,onMarkContacted,onTransfer,onRename,onDeleteStage}:{
  stage:any;leads:any[];stages:any[];templates:any[];
  onMove:(id:string,s:string)=>void;onDelete:(id:string)=>void;
  onAddNote:(id:string,note:string)=>void;onAddLead:(stageId:string,data:any)=>void;
  onMarkContacted:(id:string)=>void;onTransfer:(lead:any)=>void;
  onRename:(id:string,label:string,desc:string)=>void;
  onDeleteStage:(id:string)=>void;
}) {
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [editMode,  setEditMode]  = useState(false)
  const [eLabel,    setELabel]    = useState(stage.label)
  const [eDesc,     setEDesc]     = useState(stage.desc||'')
const [form, setForm] = useState({
    name:'', company:'', phone:'', country:'', email:'', website:'',
    channel:'whatsapp', source:'', next_followup_at:todayISO(), notes:'',
  })

 const urgentCnt = leads.filter(l=>(Date.now()-new Date(l.last_action_at||0).getTime())/3600000>48).length
  const isDefault = DEFAULT_STAGES.some(d=>d.id===stage.id)

async function addLead() {
    if (!form.name) { alert('أدخل اسم العميل'); return }
    setSaving(true)
    await onAddLead(stage.id,{...form})
    
    // 2. تصفير الحقول مع إضافة country لضمان نظافة النموذج
    setForm({
      name:'', company:'', phone:'', country:'', email:'', website:'',
      channel:'whatsapp', source:'', next_followup_at:todayISO(), notes:''
    })
    
    setShowForm(false); setSaving(false)
  }

  return (
    <div style={{minWidth:270,maxWidth:270,display:'flex',flexDirection:'column',flexShrink:0,textAlign: 'right'}}>

      {/* رأس العمود */}
      <div style={{background:S.navy2,borderRadius:'12px 12px 0 0',padding:'10px 12px',border:`1px solid ${S.border}`,borderBottom:`2px solid ${stage.color}`,direction: 'rtl'}}>
        {editMode?(
          /* FIX 7: تعديل اسم العمود */
          <div>
            <input value={eLabel} onChange={e=>setELabel(e.target.value)} style={{...inp,fontSize:12,marginBottom:5}}/>
            <input value={eDesc} onChange={e=>setEDesc(e.target.value)} placeholder="وصف العمود..." style={{...inp,fontSize:11,marginBottom:7}}/>
            <div style={{display:'flex',gap:5}}>
              <button onClick={()=>setEditMode(false)} style={{flex:1,background:'transparent',border:`1px solid ${S.border}`,color:S.muted,padding:'5px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              {!isDefault&&(
                <button onClick={()=>{ if(window.confirm('حذف العمود؟')) onDeleteStage(stage.id) }}
                  style={{background:S.redB,border:`1px solid ${S.red}30`,color:S.red,padding:'5px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🗑️</button>
              )}
              <button onClick={()=>{ if(eLabel.trim()) { onRename(stage.id,eLabel.trim(),eDesc.trim()); setEditMode(false) } }}
                style={{flex:2,background:S.gold,color:S.navy,border:'none',padding:'5px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>حفظ</button>
            </div>
          </div>
        ):(
             <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
              {/* FIX 5: زر + في الهيدر */}
              <button onClick={()=>setShowForm(true)} title="إضافة عميل"
                style={{background:`${stage.color}22`,border:`1px solid ${stage.color}40`,color:stage.color,width:21,height:21,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,cursor:'pointer',lineHeight:1,flexShrink:0}}>+</button>
              {urgentCnt>0&&(
                <span style={{background:S.red,color:S.white,borderRadius:'50%',width:17,height:17,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{urgentCnt}</span>
              )}
              <span style={{background:`${stage.color}18`,color:stage.color,fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20}}>{leads.length}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,textAlign:'right',direction:'rtl'}}>
              <button onClick={()=>setEditMode(true)} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:11,padding:2}}>✏️</button>
              <div style={{textAlign:'right',direction:'rtl',display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                  <span style={{fontSize:12,fontWeight:800,color:S.white}}>{stage.label}</span>
                  <span style={{fontSize:14}}>{stage.icon}</span>
                </div>
                <div style={{fontSize:9,color:S.muted,marginTop:1}}>{stage.desc}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* البطاقات */}
      <div style={{background:`${stage.color}05`,border:`1px solid ${S.border}`,borderTop:'none',borderRadius:'0 0 12px 12px',padding:'10px',flex:1,minHeight:100,maxHeight:'calc(100vh - 310px)',overflowY:'auto'}}>
        {leads.length===0?(
          <div style={{textAlign:'center',color:S.muted,padding:'22px 0',fontSize:11}}>
            <div style={{fontSize:18,marginBottom:5,opacity:.4}}>{stage.icon}</div>
            <div>لا يوجد عملاء</div>
          </div>
        ):leads.map(lead=>(
          <LeadCard key={lead.id} lead={lead} stage={stage} stages={stages}
            templates={templates} onMove={onMove} onDelete={onDelete}
            onAddNote={onAddNote} onMarkContacted={onMarkContacted} onTransfer={onTransfer}/>
        ))}

        {/* FIX 5: فورم الإضافة يفتح عند الضغط على + في الهيدر */}
{showForm && (
  /* 1. الحاوية الخلفية (Overlay) لتغطية الشاشة ومنع التشتت */
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)', // تعتيم خلفية الشاشة
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // لضمان الظهور فوق كل شيء
    padding: 20
  }}>
    
    {/* 2. جسم النموذج (Modal Body) في وسط الشاشة */}
    <div style={{
      background: S.navy2, // تغيير لـ navy2 ليبرز فوق التعتيم
      border: `1px solid ${S.borderG}`,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 400, // عرض مناسب للهواتف والشاشات
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      direction: 'rtl'
    }}>
      
      <div style={{fontSize: 14, fontWeight: 700, color: S.gold, marginBottom: 15, textAlign: 'center', borderBottom: `1px solid ${S.border}`, paddingBottom: 10}}>
        + إضافة عميل في {stage.label}
      </div>

<div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
  <input type="text" placeholder="اسم العميل *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{...inp, fontSize: 13, padding: '10px'}}/>
  <input type="text" placeholder="اسم الشركة" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} style={{...inp, fontSize: 13, padding: '10px'}}/>
  <input type="text" placeholder="رقم الهاتف / واتساب" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} style={{...inp, fontSize: 13, padding: '10px'}}/>
  
<select 
  value={form.country} 
  onChange={e => setForm(p => ({ ...p, country: e.target.value }))} 
  style={{ 
    ...inp, 
    fontSize: 13, 
    padding: '10px 10px 10px 35px', // زيادة الحشو من اليسار للسهم
    backgroundColor: 'transparent', 
    color: 'inherit',
    appearance: 'none',
    textAlign: 'right', // ضمان بداية النص من اليمين
    direction: 'rtl',   // ضبط الاتجاه من اليمين لليسار
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left 10px center', // السهم في أقصى اليسار
    backgroundSize: '16px',
    border: inp.border || '1px solid #444',
    cursor: 'pointer',
    width: '100%'
  }}
>
  <option value="" style={{backgroundColor: '#1a1a1a', color: '#fff'}}>اختر الدولة</option>
  {COUNTRIES.map(c => (
    <option key={c.id} value={c.value} style={{backgroundColor: '#1a1a1a', color: '#fff'}}>
      {c.label}
    </option>
  ))}
</select>
        <div style={{display: 'flex', gap: 8}}>
          <input type="email" placeholder="الإيميل" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={{...inp, fontSize: 13, flex: 1, padding: '10px'}}/>
          <input type="text" placeholder="الموقع" value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))} style={{...inp, fontSize: 13, flex: 1, padding: '10px'}}/>
        </div>

        <select value={form.channel} onChange={e=>setForm(p=>({...p,channel:e.target.value}))} style={{...inp, fontSize: 13, cursor: 'pointer', padding: '10px'}}>
          {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
        </select>

        <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))} style={{...inp, fontSize: 13, cursor: 'pointer', padding: '10px'}}>
          <option value="">المصدر...</option>
          {SOURCES.map(s=><option key={s} value={s} style={{background:S.navy2}}>{s}</option>)}
        </select>

        <div style={{display:'flex', flexDirection:'column', gap:4}}>
          <label style={{fontSize:10, color:S.muted, paddingRight:5}}>تاريخ المتابعة القادم</label>
          <input type="date" value={form.next_followup_at} onChange={e=>setForm(p=>({...p,next_followup_at:e.target.value}))} style={{...inp, fontSize: 13, colorScheme: 'dark' as any, padding: '10px'}}/>
        </div>

        <textarea placeholder="ملاحظات التسجيل..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} style={{...inp, fontSize: 13, resize: 'none', padding: '10px'} as React.CSSProperties}/>
      </div>

      <div style={{display: 'flex', gap: 10, marginTop: 20}}>
        <button onClick={()=>setShowForm(false)} style={{flex: 1, background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, padding: '12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'}}>إلغاء</button>
        <button onClick={addLead} disabled={saving} style={{flex: 2, background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'}}>
          {saving ? '⏳ جاري الحفظ...' : 'إضافة العميل الآن'}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  )
}

// ======================================================
// الصفحة الرئيسية
// ======================================================
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
  const [newStageLbl,  setNewStageLbl] = useState('')
  const [tasksDone,    setTasksDone]   = useState<string[]>([])
  const [currentUser,  setCurrentUser] = useState<any>(null)

  const [showTplForm, setShowTplForm] = useState(false)
  const [tplForm,     setTplForm]     = useState({label:'',text:''})
  const [savingTpl,   setSavingTpl]   = useState(false)

  // FIX 6: حقل description في state (كان desc من قبل)
  const [showTaskForm, setShowTaskForm]= useState(false)
  const [taskForm,     setTaskForm]    = useState({icon:'📌',label:'',description:'',priority:'medium'})
  const [savingTask,   setSavingTask]  = useState(false)

  const [socialStats, setSocialStats] = useState<any>({
    linkedin:{sent:0,replied:0,rate:0},
    facebook:{comments:0,responded:0,rate:0},
    instagram:{comments:0,responded:0,rate:0},
    whatsapp:{converted:0,pending:0},
  })
  const [editSocial, setEditSocial] = useState(false)

  const loadAll = useCallback(async()=>{
    setLoading(true)
    try {
      const {data:{user}} = await supabase.auth.getUser()
      setCurrentUser(user)
      const [lR,tR,kR,sR] = await Promise.all([
        supabase.from('marketing_leads').select('*').eq('created_by',user?.id).order('created_at',{ascending:false}),
        supabase.from('marketing_templates').select('*').eq('created_by',user?.id).order('created_at',{ascending:true}),
        supabase.from('marketing_tasks').select('*').eq('created_by',user?.id).order('created_at',{ascending:true}),
        supabase.from('marketing_social_stats').select('*').eq('created_by',user?.id).limit(1).single(),
      ])
      setLeads(lR.data||[])
      setTemplates(tR.data||[])
      setTasks(kR.data||[])
      if (sR.data) setSocialStats(sR.data.stats)
    } catch(e){ console.error(e) }
    setLoading(false)
  },[])

  useEffect(()=>{ loadAll() },[loadAll])

  async function addLead(stageId:string, data:any) {
    const {data:res} = await supabase.from('marketing_leads').insert([{
      stage_id:stageId, name:data.name, company:data.company||null,
      phone:data.phone||null, email:data.email||null, website:data.website||null,
      channel:data.channel, source:data.source||null,
      next_followup_at:data.next_followup_at||null, notes:data.notes||null,
      last_action_at:new Date().toISOString(), activity_log:[], created_by:currentUser?.id,
    }]).select().single()
    if (res) setLeads(prev=>[res,...prev])
  }

  async function moveLead(id:string, newStage:string) {
    await supabase.from('marketing_leads').update({stage_id:newStage,last_action_at:new Date().toISOString()}).eq('id',id)
    setLeads(prev=>prev.map(l=>l.id===id?{...l,stage_id:newStage,last_action_at:new Date().toISOString()}:l))
  }

  async function deleteLead(id:string) {
    if (!window.confirm('حذف العميل نهائياً؟')) return
    await supabase.from('marketing_leads').delete().eq('id',id)
    setLeads(prev=>prev.filter(l=>l.id!==id))
  }

  // FIX 1: ملاحظة → activity_log فقط، لا تُكرر في notes
  async function addNote(leadId:string, note:string) {
    const lead = leads.find(l=>l.id===leadId)
    if (!lead) return
    const newLog = [...(lead.activity_log||[]),{note,by:'أنت',at:new Date().toISOString()}]
    await supabase.from('marketing_leads').update({
      activity_log:newLog, last_action_at:new Date().toISOString(),
    }).eq('id',leadId)
    setLeads(prev=>prev.map(l=>l.id===leadId?{...l,activity_log:newLog,last_action_at:new Date().toISOString()}:l))
  }

  async function markContacted(id:string) {
    const now = new Date().toISOString()
    await supabase.from('marketing_leads').update({contacted_at:now,last_action_at:now}).eq('id',id)
    setLeads(prev=>prev.map(l=>l.id===id?{...l,contacted_at:now,last_action_at:now}:l))
  }

  // FIX 8: ترحيل العميل الجاهز لإدارة العملاء
  async function transferToCustomers(lead:any) {
    if (!window.confirm(`ترحيل "${lead.name}" لإدارة العملاء؟`)) return
    const {error} = await supabase.from('customers').insert([{
      full_name:lead.name, company_name:lead.company||null,
      phone:lead.phone||null, email:lead.email||null,
      website:lead.website||null, status:'new',
      notes:`محوّل من التسويق — ${lead.source||''}`,
      created_by:currentUser?.id, last_contact_date:new Date().toISOString(),
    }])
    if (error) { alert('خطأ في الترحيل: '+error.message); return }
    // نقله لـ not_interested بعد الترحيل
    await supabase.from('marketing_leads').update({stage_id:'not_interested'}).eq('id',lead.id)
    setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,stage_id:'not_interested'}:l))
    alert(`✅ تم ترحيل ${lead.name} بنجاح!`)
  }

  // FIX 7: تعديل/حذف العمود
  function renameStage(id:string, label:string, desc:string) {
    setStages(prev=>prev.map(s=>s.id===id?{...s,label,desc}:s))
  }
  function deleteStage(id:string) {
    const cnt = leads.filter(l=>l.stage_id===id).length
    if (cnt>0) leads.filter(l=>l.stage_id===id).forEach(l=>moveLead(l.id,'not_interested'))
    setStages(prev=>prev.filter(s=>s.id!==id))
  }

  async function addTemplate() {
    if (!tplForm.label||!tplForm.text) { alert('أدخل العنوان والنص'); return }
    setSavingTpl(true)
    const {data:res} = await supabase.from('marketing_templates').insert([{...tplForm,created_by:currentUser?.id}]).select().single()
    if (res) setTemplates(prev=>[...prev,res])
    setTplForm({label:'',text:''}); setShowTplForm(false); setSavingTpl(false)
  }

  async function deleteTemplate(id:string) {
    if (!window.confirm('حذف القالب؟')) return
    await supabase.from('marketing_templates').delete().eq('id',id)
    setTemplates(prev=>prev.filter(t=>t.id!==id))
  }

  // FIX 6: حقل description (كان desc في الـ textarea onChange)
  async function addTask() {
    if (!taskForm.label) { alert('أدخل اسم المهمة'); return }
    setSavingTask(true)
    const {data:res,error} = await supabase.from('marketing_tasks').insert([{
      icon:taskForm.icon, label:taskForm.label,
      description:taskForm.description, priority:taskForm.priority,
      created_by:currentUser?.id,
    }]).select().single()
    if (error) { console.error(error); alert('خطأ: '+error.message) }
    else if (res) setTasks(prev=>[...prev,res])
    setTaskForm({icon:'📌',label:'',description:'',priority:'medium'})
    setShowTaskForm(false); setSavingTask(false)
  }

  async function deleteTask(id:string) {
    await supabase.from('marketing_tasks').delete().eq('id',id)
    setTasks(prev=>prev.filter(t=>t.id!==id))
  }

  async function saveSocialStats() {
    const {data:ex} = await supabase.from('marketing_social_stats').select('id').eq('created_by',currentUser?.id).single()
    if (ex?.id) await supabase.from('marketing_social_stats').update({stats:socialStats}).eq('id',ex.id)
    else await supabase.from('marketing_social_stats').insert([{stats:socialStats,created_by:currentUser?.id}])
    setEditSocial(false); alert('✅ تم الحفظ')
  }

  function addStage() {
    if (!newStageLbl) return
    setStages(prev=>[...prev,{id:`custom_${Date.now()}`,label:newStageLbl,icon:'📌',color:S.teal,desc:'مرحلة مخصصة'}])
    setNewStageLbl(''); setShowAddStage(false)
  }

  const filteredLeads = leads.filter(l=>{
    const ms=!search||l.name?.includes(search)||l.company?.includes(search)
    const mc=!filterCh||l.channel===filterCh
    return ms&&mc
  })

  const totalLeads  = leads.length
  const hotLeads    = leads.filter(l=>l.stage_id==='action').length
  const urgentLeads = leads.filter(l=>(Date.now()-new Date(l.last_action_at||0).getTime())/3600000>48).length
  const todayLeads  = leads.filter(l=>{ const d=new Date(l.created_at),t=new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth() }).length

  const TABS=[
    {key:'kanban',    label:'📋 لوحة المبيعات'},
    {key:'templates', label:'🎯 قوالب الإقناع'},
    {key:'tasks',     label:'✅ المهام اليومية'},
    {key:'social',    label:'📡 منصات التواصل'},
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal, sans-serif',direction:'rtl',background:S.navy}}>

      {/* الهيدر */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'12px 24px',flexShrink:0}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
          {[
            {label:'إجمالي العملاء', val:totalLeads,  color:S.blue},
            {label:'جاهزون للإغلاق',val:hotLeads,    color:S.green},
            {label:'تواصل عاجل',     val:urgentLeads, color:S.red},
            {label:'مضافون اليوم',   val:todayLeads,  color:S.gold},
          ].map((s,i)=>(
             <div key={i} style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:9,padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>    
                  <div style={{fontSize:11,color:S.muted,fontWeight:900}}>{s.label}</div>
                <div style={{fontSize:18,color:s.color,fontFamily:'monospace'}}>{s.val}</div>
              </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <input type="text" placeholder="🔍 ابحث عن عميل أو شركة..." value={search}
            onChange={e=>setSearch(e.target.value)} style={{...inp,flex:1,background:S.navy3,fontSize:12}}/>
          <select value={filterCh} onChange={e=>setFilterCh(e.target.value)}
            style={{...inp,width:'auto',fontSize:12,cursor:'pointer'}}>
            <option value="">كل القنوات</option>
            {Object.entries(CHANNELS).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
          </select>
        </div>
      </div>

      {/* التبويبات */}
      <div style={{display:'flex',background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'0 24px',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setView(t.key as any)}
            style={{padding:'11px 18px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',borderBottom:view===t.key?`2px solid ${S.gold}`:'2px solid transparent',background:'transparent',color:view===t.key?S.gold2:S.muted,whiteSpace:'nowrap',transition:'all .15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div style={{flex:1,overflow:'hidden',position:'relative'}}>

        {/* ══ الكانبان ══ */}
        {view==='kanban'&&(
          <div style={{display:'flex',gap:12,padding:'16px 24px',overflowX:'auto',height:'100%',alignItems:'flex-start'}}>
            {stages.map(stage=>(
              <KanbanColumn key={stage.id} stage={stage}
                leads={filteredLeads.filter(l=>l.stage_id===stage.id)}
                stages={stages} templates={templates}
                onMove={moveLead} onDelete={deleteLead} onAddNote={addNote}
                onAddLead={addLead} onMarkContacted={markContacted}
                onTransfer={transferToCustomers}
                onRename={renameStage} onDeleteStage={deleteStage}/>
            ))}
            <div style={{minWidth:155,flexShrink:0}}>
              {!showAddStage?(
                <button onClick={()=>setShowAddStage(true)}
                  style={{width:'100%',background:S.card,border:`1px dashed ${S.border}`,color:S.muted,padding:'14px',borderRadius:12,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <span style={{fontSize:18}}>+</span><span>مرحلة جديدة</span>
                </button>
              ):(
                <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:12,padding:12}}>
                  <input type="text" placeholder="اسم المرحلة..." value={newStageLbl}
                    onChange={e=>setNewStageLbl(e.target.value)} style={{...inp,marginBottom:8,fontSize:12}}/>
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
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>مخصصة لشركتك — {templates.length} قالب</div>
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
                      placeholder="اكتب نص الرسالة... يمكن استخدام [اسم العميل] كمتغير" rows={8}
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
                <div style={{fontSize:13}}>أضف قوالب رسائل مخصصة لشركتك</div>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
                {templates.map((t:any)=>(
                  <div key={t.id} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:12,padding:18,borderRight:`3px solid ${S.gold}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <button onClick={()=>deleteTemplate(t.id)} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:14}}>✕</button>
                      <div style={{fontSize:13,fontWeight:700,color:S.gold2,textAlign:'right'}}>{t.label}</div>
                    </div>
                    <div style={{fontSize:12,color:S.muted,lineHeight:'1.8',textAlign:'right',whiteSpace:'pre-wrap',background:S.navy3,borderRadius:8,padding:'10px 12px'}}>
                      {t.text.slice(0,200)}{t.text.length>200?'...':''}
                    </div>
                    <button onClick={()=>{ navigator.clipboard.writeText(t.text); alert('✅ تم نسخ القالب') }}
                      style={{marginTop:10,width:'100%',background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'7px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                      📋 نسخ القالب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ المهام ══ */}
        {view==='tasks'&&(
          <div style={{padding:'20px 24px',overflowY:'auto',height:'100%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <button onClick={()=>setShowTaskForm(true)}
                style={{background:S.gold,color:S.navy,border:'none',padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                + إضافة مهمة
              </button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>✅ المهام اليومية</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>محددة من صاحب الشركة — {tasksDone.length}/{tasks.length} مكتملة</div>
              </div>
            </div>
            <div style={{background:S.border,borderRadius:4,height:6,marginBottom:18,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${tasks.length?(tasksDone.length/tasks.length)*100:0}%`,background:`linear-gradient(90deg,${S.gold},${S.green})`,borderRadius:4,transition:'width .4s'}}/>
            </div>

            {/* FIX 6: فورم المهمة */}
            {showTaskForm&&(
              <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:14,padding:18,marginBottom:16,direction: 'rtl'}}>
                <div style={{fontSize:13,fontWeight:700,color:S.gold2,marginBottom:12,textAlign:'right'}}>مهمة جديدة</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10, direction: 'rtl'}}>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5}}>الأيقونة</label>
                    <input type="text" value={taskForm.icon} onChange={e=>setTaskForm(p=>({...p,icon:e.target.value}))} style={{...inp,fontSize:14}} placeholder="📌"/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>الأولوية</label>
                    <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="high" style={{background:S.navy2}}>عالي</option>
                      <option value="medium" style={{background:S.navy2}}>متوسط</option>
                      <option value="low" style={{background:S.navy2}}>عادي</option>
                    </select>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>اسم المهمة *</label>
                  <input type="text" placeholder="اسم المهمة" value={taskForm.label} onChange={e=>setTaskForm(p=>({...p,label:e.target.value}))} style={inp}/>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:10,color:S.muted,fontWeight:700,marginBottom:5,textAlign:'right'}}>التفاصيل والتوجيهات</label>
                  {/* FIX 6: onChange يحدث description وليس desc */}
                  <textarea value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))}
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
    const pc=task.priority==='high'?S.red:task.priority==='medium'?S.amber:S.muted
    const done=tasksDone.includes(task.id)

    return (
      <div key={task.id}
        style={{
          background:done?S.greenB:S.navy2,
          border:`1px solid ${done?S.green+'40':S.border}`,
          borderRadius:12,
          padding:'14px 18px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          transition:'all .2s'
        }}>

        {/* اسم المهمة أولا */}
        <div style={{textAlign:'right',cursor:'pointer'}}
          onClick={()=>setTasksDone(prev=>done?prev.filter(id=>id!==task.id):[...prev,task.id])}>

          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:18}}>{task.icon}</span>

            <div style={{
              fontSize:13,
              fontWeight:700,
              color:done?S.green:S.white,
              textDecoration:done?'line-through':'none'
            }}>
              {task.label}
            </div>

<span style={{marginLeft:8,fontSize:10,padding:'2px 8px',borderRadius:20,background:`${pc}18`,color:pc,fontWeight:700
            }}>
              {task.priority==='high'?'عالي':task.priority==='medium'?'متوسط':'عادي'}
            </span>
          </div>

          {task.description &&
            <div style={{fontSize:11,color:S.muted,lineHeight:'1.6'}}>
              {task.description}
            </div>
          }
        </div>

        {/* الحالة + زر الحذف */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>

          <div
            onClick={()=>setTasksDone(prev=>done?prev.filter(id=>id!==task.id):[...prev,task.id])}
            style={{
              width:24,
              height:24,
              borderRadius:'50%',
              border:`2px solid ${done?S.green:S.border}`,
              background:done?S.green:'transparent',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer',
              transition:'all .2s'
            }}>
            {done && <span style={{color:S.navy,fontSize:12,fontWeight:900}}>✓</span>}
          </div>

          <button
            onClick={()=>{
              if(window.confirm('هل ترغب في حذف هذه المهمة؟')){
                deleteTask(task.id)
              }
            }}
            style={{
              background:'none',
              border:'none',
              color:S.muted,
              cursor:'pointer',
              fontSize:12
            }}>
            ✕
          </button>

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
                {editSocial?'💾 حفظ':'✏️ تحديث الأرقام'}
              </button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>📡 منصات التواصل الاجتماعي</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>أدخل الأرقام يدوياً من كل منصة</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>

              {[
                {key:'linkedin', label:'LinkedIn', icon:'💼', color:'#0A66C2', fields:[{l:'مرسلة',k:'sent',c:'#0A66C2'},{l:'تم الرد',k:'replied',c:S.green},{l:'معدل',k:'rate',c:S.gold,s:'%'}]},
                {key:'facebook', label:'Facebook', icon:'📘', color:'#1877F2', fields:[{l:'تعليقات',k:'comments',c:'#1877F2'},{l:'تم الرد',k:'responded',c:S.green}]},
                {key:'instagram',label:'Instagram',icon:'📸', color:'#E4405F', fields:[{l:'تعليقات',k:'comments',c:'#E4405F'},{l:'تم الرد',k:'responded',c:S.green}]},
                {key:'whatsapp', label:'WhatsApp', icon:'📱', color:S.green,    fields:[{l:'محوّلون',k:'converted',c:S.green},{l:'قيد المتابعة',k:'pending',c:S.amber}]},
              ].map(platform=>(
                <div key={platform.key} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20,borderTop:`3px solid ${platform.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexDirection:'row-reverse'}}>
                    <span style={{fontSize:26}}>{platform.icon}</span>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:14,fontWeight:800,color:platform.color}}>{platform.label}</div>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${platform.fields.length},1fr)`,gap:8}}>
                    {platform.fields.map((f:any)=>(
                      <div key={f.k} style={{background:S.card,borderRadius:8,padding:'10px',textAlign:'center'}}>
                        {editSocial?(
                          <input type="number" value={(socialStats[platform.key] as any)[f.k]}
                            onChange={e=>setSocialStats((p:any)=>({...p,[platform.key]:{...p[platform.key],[f.k]:parseInt(e.target.value)||0}}))}
                            style={{...inp,textAlign:'center',fontSize:16,fontWeight:900,padding:'4px',marginBottom:4}}/>
                        ):(
                          <div style={{fontSize:18,fontWeight:900,color:f.c,fontFamily:'monospace'}}>{(socialStats[platform.key] as any)[f.k]}{f.s||''}</div>
                        )}
                        <div style={{fontSize:9,color:S.muted}}>{f.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
      `}</style>
    </div>
  )
}