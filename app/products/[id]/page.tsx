'use client'

import React, { use, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { COUNTRIES, CURRENCIES, PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../components/options'
import {
  ArrowRight, Info, ShieldCheck, Truck, Scale, Award,
  Package, AlertCircle, FileText, Globe, Edit3, Save,
  X, Send, Check, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── الألوان ──
const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#152A52',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.12)',goldB:'rgba(201,168,76,0.25)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.08)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.12)',
  red:'#EF4444',redB:'rgba(239,68,68,0.12)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.12)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.12)',
  card:'rgba(255,255,255,0.04)',card2:'rgba(255,255,255,0.07)',
}

const inp: React.CSSProperties = {
  width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${S.border}`,
  padding:'10px 14px',borderRadius:'10px',color:S.white,fontFamily:'Tajawal, sans-serif',
  outline:'none',fontSize:'13px',direction:'rtl',textAlign:'right',boxSizing:'border-box',
}

function getCountryLabel(val:string){
  if(!val) return '—'
  const found=COUNTRIES.find(c=>c.id===val||c.value===val||c.label===val||c.label.includes(val))
  return found?.label||val
}

// ════════════════════════════════════════════════
// مكون حقل قابل للتعديل
// ════════════════════════════════════════════════
function EditableField({label,value,icon,editMode,fieldKey,onChange,type='text',options}:{
  label:string;value:string;icon?:React.ReactNode;editMode:boolean;fieldKey:string;
  onChange:(k:string,v:string)=>void;type?:string;options?:{value:string;label:string}[]
}){
  return(
    <div style={{padding:'16px 18px',background:S.card,borderRadius:'14px',border:`1px solid ${editMode?S.gold+'40':S.border}`,transition:'border-color .2s'}}>
      <div style={{display:'flex',alignItems:'center',gap:7,color:S.muted,fontSize:11,fontWeight:700,marginBottom:7}}>
        {icon} {label}
      </div>
      {editMode?(
        type==='select'&&options?(
          <select value={value} onChange={e=>onChange(fieldKey,e.target.value)}
            style={{...inp,fontSize:13,padding:'8px 12px',cursor:'pointer'}}>
            <option value="">اختر...</option>
            {options.map(o=><option key={o.value} value={o.value} style={{background:S.navy2}}>{o.label}</option>)}
          </select>
        ):type==='textarea'?(
          <textarea value={value} onChange={e=>onChange(fieldKey,e.target.value)} rows={3}
            style={{...inp,resize:'none',lineHeight:'1.6'} as React.CSSProperties}/>
        ):(
          <input type={type} value={value} onChange={e=>onChange(fieldKey,e.target.value)} style={inp}/>
        )
      ):(
        <div style={{fontSize:15,fontWeight:600,color:S.white,lineHeight:'1.4'}}>{value||'—'}</div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════
// مكون الشارة
// ════════════════════════════════════════════════
function Badge({text,color}:{text:string;color?:string}){
  const c=color||S.gold
  return(
    <span style={{border:`1px solid ${c}60`,color:c,padding:'5px 12px',borderRadius:'20px',fontSize:11,fontWeight:700,background:`${c}10`}}>
      {text}
    </span>
  )
}

// ════════════════════════════════════════════════
// Modal إرسال العرض الداخلي
// ════════════════════════════════════════════════
function SendOfferModal({product,currentUser,onClose,onSent}:{
  product:any;currentUser:any;onClose:()=>void;onSent:()=>void;
}){
  const [search,    setSearch]    = useState('')
  const [users,     setUsers]     = useState<any[]>([])
  const [selUser,   setSelUser]   = useState<any>(null)
  const [price,     setPrice]     = useState(product?.price_range||product?.reference_price||'')
  const [currency,  setCurr]      = useState('USD')
  const [validDays, setValidDays] = useState('7')
  const [note,      setNote]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [step,      setStep]      = useState<'select'|'details'>('select')

useEffect(() => {
  // 1. لن نبدأ البحث إلا إذا كتب المستخدم إيميل يبدو منطقياً (مثلاً يحتوي على @)
  if (!search.includes('@') || search.length < 5) { 
    setUsers([]); 
    return; 
  }
  
  const t = setTimeout(async () => {
    // 2. استخدام .eq بدلاً من .ilike للمطابقة الصارمة
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, username')
      .eq('email', search.trim()) // .trim() لإزالة أي مسافات زائدة قد يضعها المستخدم بالخطأ
      .neq('id', currentUser?.id)
      .limit(1); // إظهار مستخدم واحد فقط لأنه إيميل فريد

    if (profilesData && profilesData.length > 0) {
      setUsers(profilesData);
    } else {
      setUsers([]);
    }
  }, 500); // زيادة المهلة قليلاً لإعطاء المستخدم فرصة لإنهاء الكتابة

  return () => clearTimeout(t);
}, [search]);

  async function handleSend(){
    if(!selUser||!product) return
    setSending(true)
    const expiresAt=new Date()
    expiresAt.setDate(expiresAt.getDate()+parseInt(validDays||'7'))
    const {error}=await supabase.from('product_offers').insert([{
      product_id:product.id,product_name:product.name,product_data:product,
      sender_id:currentUser?.id,receiver_id:selUser.id,
      offered_price:price||null,currency,note,status:'pending',
      expires_at:expiresAt.toISOString(),
    }])
    setSending(false)
    if(error){alert('خطأ: '+error.message);return}
    onSent();onClose()
    alert(`✅ تم إرسال العرض لـ ${selUser.full_name||selUser.email}`)
  }

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000,backdropFilter:'blur(14px)',padding:16}}
      onClick={onClose}>
      <div style={{background:S.navy2,width:'100%',maxWidth:480,borderRadius:22,border:`1px solid ${S.goldB}`,direction:'rtl',overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.7)'}}
        onClick={e=>e.stopPropagation()}>

        <div style={{background:S.gold3,borderBottom:`1px solid ${S.goldB}`,padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button onClick={onClose} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}><X size={18}/></button>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:14,fontWeight:800,color:S.gold2}}>📤 إرسال عرض منتج</div>
            <div style={{fontSize:11,color:S.muted,marginTop:2}}>📦 {product?.name}</div>
          </div>
        </div>

        <div style={{padding:22}}>
          {step==='select'?(
            <>
              <div style={{fontSize:12,color:S.muted,marginBottom:10,textAlign:'right'}}>ابحث بالاسم أو الإيميل أو كود المستخدم</div>
              <input type="text" placeholder="ابحث عن مستخدم..." value={search}
                onChange={e=>setSearch(e.target.value)} style={{...inp,marginBottom:12}}/>
              {users.length>0&&(
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                  {users.map(u=>(
                    <div key={u.id} onClick={()=>{setSelUser(u);setStep('details')}}
                      style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all .15s'}}>
                      <div style={{display:'flex',gap:6}}>
                        {u.user_code&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:S.blueB,color:S.blue,fontWeight:700}}>{u.user_code}</span>}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:700,color:S.white}}>{u.full_name||'—'}</div>
                        <div style={{fontSize:11,color:S.muted}}>{u.email}</div>
                        {u.company_name&&<div style={{fontSize:10,color:S.gold}}>{u.company_name}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {search.length>=2&&users.length===0&&<div style={{textAlign:'center',color:S.muted,padding:'20px 0',fontSize:12}}>لم يُعثر على مستخدم</div>}
            </>
          ):(
            <>
              <div style={{background:S.greenB,border:`1px solid ${S.green}30`,borderRadius:10,padding:'12px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <button onClick={()=>{setStep('select');setSelUser(null)}} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:11}}>تغيير</button>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11,color:S.green,fontWeight:700}}>✓ سيُرسل إلى</div>
                  <div style={{fontSize:13,fontWeight:700,color:S.white}}>{selUser?.full_name||selUser?.email}</div>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>السعر المعروض</label>
                  <div style={{display:'flex',gap:8}}>
                    <select value={currency} onChange={e=>setCurr(e.target.value)} style={{...inp,width:'auto',flexShrink:0,cursor:'pointer'}}>
                      {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{c.id}</option>)}
                    </select>
                    <input type="text" placeholder="السعر..." value={price} onChange={e=>setPrice(e.target.value)} style={inp}/>
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>مدة صلاحية العرض</label>
                  <div style={{display:'flex',gap:6}}>
                    {[3,7,14,30].map(d=>(
                      <button key={d} onClick={()=>setValidDays(String(d))}
                        style={{flex:1,padding:'8px 0',borderRadius:8,border:`1px solid ${validDays===String(d)?S.gold:S.border}`,background:validDays===String(d)?S.gold3:'transparent',color:validDays===String(d)?S.gold2:S.muted,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                        {d} يوم
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>ملاحظة (اختياري)</label>
                  <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
                    placeholder="شروط تفاوض، تفاصيل إضافية..."
                    style={{...inp,resize:'none',lineHeight:'1.6'} as React.CSSProperties}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:16}}>
                <button onClick={onClose} style={{background:'transparent',color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                <button onClick={handleSend} disabled={sending}
                  style={{background:sending?S.muted:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,border:'none',padding:11,borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  {sending?'⏳ جاري الإرسال...':<><Send size={15}/> إرسال العرض</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// FIX 3: مكون المواصفات التقنية — المستخدم يضيف صفوفه بنفسه
// ════════════════════════════════════════════════
function TechnicalSpecsEditor({editData,editMode,onChange}:{editData:any;editMode:boolean;onChange:(k:string,v:string)=>void}){
  // نخزن الصفوف كـ JSON في حقل tech_specs
  const rows: {param:string;result:string;limit:string}[] = (() => {
    try { return JSON.parse(editData.tech_specs||'[]') } catch { return [] }
  })()

  function updateRows(newRows:any[]){
    onChange('tech_specs', JSON.stringify(newRows))
  }
  function addRow(){ updateRows([...rows,{param:'',result:'',limit:''}]) }
  function removeRow(i:number){ updateRows(rows.filter((_,idx)=>idx!==i)) }
  function updateRow(i:number,field:string,val:string){
    const updated=[...rows]
    updated[i]={...updated[i],[field]:val}
    updateRows(updated)
  }

  if(rows.length===0&&!editMode) return null

  return(
    <section style={{background:S.card,borderRadius:14,padding:'18px 20px',border:`1px solid ${editMode?S.gold+'40':S.border}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <FileText size={15} color={S.gold}/>
          <div style={{fontSize:13,fontWeight:800,color:S.gold}}>المواصفات التقنية (Technical Specs)</div>
        </div>
        {editMode&&(
          <button onClick={addRow}
            style={{background:S.gold3,border:`1px solid ${S.goldB}`,color:S.gold2,padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            + إضافة معامل
          </button>
        )}
      </div>
      {rows.length===0&&editMode&&(
        <div style={{textAlign:'center',color:S.muted,padding:'16px 0',fontSize:12}}>
          اضغط "+ إضافة معامل" لإضافة مواصفة تقنية
        </div>
      )}
      {rows.length>0&&(
        <div style={{background:S.navy3,borderRadius:10,overflow:'hidden',border:`1px solid ${S.border}`}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'rgba(255,255,255,0.04)'}}>
                {['المعامل','النتيجة','الحد المسموح',editMode?'':''].map((h,i)=>h&&(
                  <th key={i} style={{padding:'9px 14px',textAlign:'right',fontSize:10,color:S.muted,fontWeight:700}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row,i)=>(
                <tr key={i} style={{borderTop:`1px solid ${S.border}`}}>
                  <td style={{padding:'8px 14px'}}>
                    {editMode?<input value={row.param} onChange={e=>updateRow(i,'param',e.target.value)} style={{...inp,padding:'6px 10px',fontSize:12}} placeholder="مثال: FFA"/>
                      :<span style={{fontSize:12,color:S.white}}>{row.param||'—'}</span>}
                  </td>
                  <td style={{padding:'8px 14px'}}>
                    {editMode?<input value={row.result} onChange={e=>updateRow(i,'result',e.target.value)} style={{...inp,padding:'6px 10px',fontSize:12}} placeholder="مثال: 0.08%"/>
                      :<span style={{fontSize:13,fontWeight:700,color:S.green}}>{row.result||'—'}</span>}
                  </td>
                  <td style={{padding:'8px 14px'}}>
                    {editMode?<input value={row.limit} onChange={e=>updateRow(i,'limit',e.target.value)} style={{...inp,padding:'6px 10px',fontSize:12}} placeholder="مثال: Max 0.1%"/>
                      :<span style={{fontSize:11,color:S.muted}}>{row.limit||'—'}</span>}
                  </td>
                  {editMode&&<td style={{padding:'8px 10px'}}>
                    <button onClick={()=>removeRow(i)} style={{background:'none',border:'none',color:S.red,cursor:'pointer',fontSize:14}}>✕</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ════════════════════════════════════════════════
// FIX 4: مكون اللوجستيات — اختياري ومرن
// ════════════════════════════════════════════════
const LOGISTICS_FIELDS = [
  {k:'min_order',          label:'أقل كمية (MOQ)',     icon:'📦', placeholder:'مثال: 1 × 40FT Container'},
  {k:'loading_port',       label:'ميناء التصدير/الشحن', icon:'🚢', placeholder:'مثال: Semarang Port'},
  {k:'packaging_options',  label:'خيارات التغليف',      icon:'🗃️', placeholder:'مثال: 20L Jerry Can، Bulk Flexi Tank'},
  {k:'shipping_time',      label:'مدة الشحن',           icon:'⏱️', placeholder:'مثال: 20-30 يوم'},
  {k:'incoterms',          label:'Incoterms',           icon:'📋', placeholder:'مثال: CIF Dammam، FOB'},
  {k:'payment_terms',      label:'شروط الدفع',          icon:'💳', placeholder:'مثال: 50% TT + 50% BL'},
  {k:'shelf_life',         label:'مدة الصلاحية',        icon:'📅', placeholder:'مثال: 24 Months'},
  {k:'quality_grade',      label:'درجة الجودة',         icon:'🏅', placeholder:'مثال: Premium A+ Export'},
  {k:'private_label',      label:'Private Label',       icon:'🏷️', placeholder:'متاح عند الطلب'},
]

function LogisticsEditor({editData,editMode,onChange,product}:{editData:any;editMode:boolean;onChange:(k:string,v:string)=>void;product:any}){
  // المستخدم يختار أي حقول يريد إظهارها
  const stored: string[] = (() => {
    try { return JSON.parse(editData.logistics_visible||'null') || LOGISTICS_FIELDS.map(f=>f.k) } catch { return LOGISTICS_FIELDS.map(f=>f.k) }
  })()

  function toggleField(k:string){
    const updated = stored.includes(k) ? stored.filter(x=>x!==k) : [...stored,k]
    onChange('logistics_visible', JSON.stringify(updated))
  }

  const visibleFields = LOGISTICS_FIELDS.filter(f=>stored.includes(f.k))
  const hasData = visibleFields.some(f=>(editData as any)[f.k])

  if(!hasData&&!editMode) return null

  return(
    <section>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Truck size={15} color={S.gold}/>
          <div style={{fontSize:13,fontWeight:800,color:S.gold}}>اللوجستيات والشحن</div>
        </div>
        {editMode&&(
          <div style={{fontSize:11,color:S.muted}}>اختر الحقول المناسبة لنوع شركتك</div>
        )}
      </div>

      {/* اختيار الحقول في وضع التعديل */}
      {editMode&&(
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,padding:'12px 14px',background:S.card,borderRadius:10,border:`1px solid ${S.border}`}}>
          {LOGISTICS_FIELDS.map(f=>(
            <button key={f.k} onClick={()=>toggleField(f.k)}
              style={{padding:'4px 12px',borderRadius:20,border:`1px solid ${stored.includes(f.k)?S.gold:S.border}`,background:stored.includes(f.k)?S.gold3:'transparent',color:stored.includes(f.k)?S.gold2:S.muted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',transition:'all .15s'}}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {visibleFields.map(f=>{
          const val = (editData as any)[f.k]||''
          if(!editMode&&!val) return null
          return(
            <div key={f.k} style={{background:S.card,borderRadius:12,padding:'14px 16px',border:`1px solid ${editMode?S.gold+'30':S.border}`}}>
              <div style={{fontSize:10,color:S.muted,marginBottom:6,fontWeight:700}}>{f.icon} {f.label}</div>
              {editMode?(
                <input value={val} onChange={e=>onChange(f.k,e.target.value)}
                  style={{...inp,padding:'7px 10px',fontSize:12}} placeholder={f.placeholder}/>
              ):(
                <div style={{fontSize:13,fontWeight:600,color:S.white}}>{val||'—'}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════
export default function ProductDetailPage({params}:{params:Promise<{id:string}>}){
  const router   = useRouter()
  const resolved = use(params)
  const productId= decodeURIComponent(resolved.id)

  const [product,      setProduct]      = useState<any>(null)
  const [supplier,     setSupplier]     = useState<any>(null)
  const [currentUser,  setCurrentUser]  = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [editMode,     setEditMode]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [activeTab,    setActiveTab]    = useState<'details'|'offer'>('details')
  const [showSendOffer,setShowSendOffer]= useState(false)
  const [editData,     setEditData]     = useState<any>({})
  const [offersSent,   setOffersSent]   = useState(0)
  const isOwner = currentUser && product && currentUser.id === product.user_id

  // ── التحميل ──
  useEffect(()=>{
    async function load(){
      setLoading(true)
      const {data:{user}}=await supabase.auth.getUser()
      setCurrentUser(user)

      // نحاول نجيب بالـ id أولاً، وإلا بالاسم
      let pd:any=null
      const {data:byId}=await supabase.from('supplier_products').select('*').eq('id',productId).single()
      if(byId){ pd=byId }
      else {
        const {data:byName}=await supabase.from('supplier_products').select('*').eq('name',productId).limit(1).single()
        pd=byName
      }
      if(pd){
        setProduct(pd)
        setEditData({...pd})
        if(pd.supplier_id){
          const {data:sup}=await supabase.from('suppliers').select('*').eq('id',pd.supplier_id).single()
          setSupplier(sup)
        }
        // عدد العروض المُرسلة لهذا المنتج
        const {count}=await supabase.from('product_offers').select('*',{count:'exact',head:true}).eq('product_id',pd.id)
        setOffersSent(count||0)
      }
      setLoading(false)
    }
    load()
  },[productId])

  function handleFieldChange(k:string,v:string){ setEditData((p:any)=>({...p,[k]:v})) }

  async function handleSave(){
    if(!product) return
    setSaving(true)
    const {error}=await supabase.from('supplier_products').update({
      name:editData.name, category:editData.category, price_range:editData.price_range,
      currency:editData.currency, min_order:editData.min_order, incoterms:editData.incoterms,
      loading_port:editData.loading_port, shipping_time:editData.shipping_time,
      shelf_life:editData.shelf_life, stock_quantity:editData.stock_quantity,
      origin_country:editData.origin_country, market_country:editData.market_country,
      certifications:editData.certifications, notes:editData.notes,
      packaging_options:editData.packaging_options,
      ffa:editData.ffa, moisture:editData.moisture, peroxide:editData.peroxide,
      iodine:editData.iodine, color_lovibond:editData.color_lovibond, appearance:editData.appearance,
      payment_terms:editData.payment_terms, quality_grade:editData.quality_grade,
      private_label:editData.private_label,
      tech_specs:editData.tech_specs||null,
      logistics_visible:editData.logistics_visible||null,
    }).eq('id',product.id)
    setSaving(false)
    if(error){alert('خطأ: '+error.message);return}
    setProduct({...product,...editData})
    setEditMode(false)
    alert('✅ تم حفظ التعديلات')
  }

  if(loading) return(
    <div style={{background:S.navy,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:S.muted,fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>📦</div>
        <div>جاري تحميل بيانات المنتج...</div>
      </div>
    </div>
  )

  if(!product) return(
    <div style={{background:S.navy,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:S.muted,fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
        <div style={{color:S.white,fontSize:16,marginBottom:8}}>المنتج غير موجود</div>
        <button onClick={()=>router.back()} style={{background:S.gold,color:S.navy,border:'none',padding:'10px 24px',borderRadius:10,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>رجوع</button>
      </div>
    </div>
  )

  const certs=(editData.certifications||'').split(/[،,]/).map((c:string)=>c.trim()).filter(Boolean)
  const specs=[
    {label:'Free Fatty Acid (FFA)', val:editData.ffa||'—',     std:'Max 0.1%'},
    {label:'Moisture & Impurities', val:editData.moisture||'—', std:'Max 0.1%'},
    {label:'Peroxide Value',        val:editData.peroxide||'—', std:'Max 10'},
    {label:'Iodine Value',          val:editData.iodine||'—',   std:'50–60'},
    {label:'Color (Lovibond)',       val:editData.color_lovibond||'—',std:'Max 3'},
    {label:'Appearance',            val:editData.appearance||'—',std:'Clear'},
  ]

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:S.navy,color:S.white,direction:'rtl',fontFamily:'Tajawal, sans-serif',overflow:'hidden'}}>

      {/* ═══ شريط الأدوات الثابت (متناسق مع باقي الصفحات) ═══ */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'flex-start',gap:20,flexShrink:0}}>
        {/* الأزرار من اليمين */}
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>router.back()}
            style={{background:'none',border:`1px solid ${S.border}`,color:S.muted,padding:'8px 12px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',gap:6}}>
            <ArrowRight size={15}/> رجوع
          </button>
          {isOwner&&(editMode?(
            <>
              <button onClick={()=>{setEditMode(false);setEditData({...product})}}
                style={{background:'transparent',border:`1px solid ${S.red}50`,color:S.red,padding:'9px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
                <X size={14}/> إلغاء
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
                <Save size={14}/> {saving?'جاري الحفظ...':'حفظ التعديلات'}
              </button>
            </>
          ):(
            <>
              <button onClick={()=>setEditMode(true)}
                style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
                <Edit3 size={14}/> تعديل المنتج
              </button>
              <button onClick={()=>setShowSendOffer(true)}
                style={{background:'rgba(232,201,122,0.1)',color:S.gold2,border:`1px solid ${S.gold}`,padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
                <Send size={14}/> تصدير المنتج
              </button>
            </>
          ))}
        </div>
        {/* اسم المنتج في المنتصف */}
        <div style={{flex:1,textAlign:'center'}}>
          {editMode?(
            <input value={editData.name} onChange={e=>handleFieldChange('name',e.target.value)}
              style={{...inp,fontSize:14,fontWeight:700,padding:'5px 12px',width:'auto',minWidth:220,textAlign:'center'}}/>
          ):(
            <span style={{fontSize:15,fontWeight:700,color:S.gold}}>📦 {product.name}</span>
          )}
        </div>
        {/* مؤشر الحالة يسار */}
        <div style={{background:S.greenB,border:`1px solid ${S.green}33`,padding:'6px 14px',borderRadius:30,display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          <div style={{width:7,height:7,background:S.green,borderRadius:'50%',boxShadow:`0 0 8px ${S.green}`}}/>
          <span style={{fontSize:11,fontWeight:800,color:S.green}}>جاهز للتوريد</span>
        </div>
      </div>

      {/* ═══ التبويبات الثابتة ═══ */}
      <div style={{display:'flex',background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'0 24px',flexShrink:0}}>
        {([
          {key:'details',label:'📋 تفاصيل المنتج'},
          {key:'offer',  label:`📤 تقديم عرض سعر${offersSent>0?` (${offersSent})`:''}`},
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{padding:'12px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',borderBottom:activeTab===t.key?`2px solid ${S.gold}`:'2px solid transparent',background:'transparent',color:activeTab===t.key?S.gold2:S.muted,transition:'all .15s',whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ المحتوى القابل للتمرير ═══ */}
      <div style={{flex:1,overflowY:'auto'}}>
      <main style={{padding:'28px 24px',maxWidth:1320,margin:'0 auto'}}>

        {/* ══ تبويب: تفاصيل المنتج ══ */}
        {activeTab==='details'&&(
          <div style={{display:'grid',gridTemplateColumns:'1.7fr 1fr',gap:36,alignItems:'start'}}>

            {/* العمود الأيمن */}
            <div style={{display:'flex',flexDirection:'column',gap:24}}>

              {/* صور المنتج */}
              {product.images&&product.images.length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:S.muted,marginBottom:10}}>صور المنتج</div>
                  <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:4}}>
                    {product.images.map((img:string,i:number)=>(
                      <img key={i} src={img} alt={product.name} style={{width:160,height:110,objectFit:'cover',borderRadius:12,flexShrink:0,border:`1px solid ${S.border}`}}/>
                    ))}
                  </div>
                </div>
              )}

              {/* المواصفات الأساسية */}
              <section>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                  <Info size={17} color={S.gold}/>
                  <h2 style={{fontSize:15,fontWeight:800,color:S.gold,margin:0}}>المواصفات الفنية</h2>
                  {editMode&&<span style={{fontSize:10,color:S.amber,background:S.amberB,padding:'2px 8px',borderRadius:20}}>وضع التعديل</span>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <EditableField label="دولة المنشأ" fieldKey="origin_country" value={editData.origin_country||''} editMode={editMode} onChange={handleFieldChange} icon={<Globe size={13}/>}
                    type="select" options={COUNTRIES.map(c=>({value:c.label,label:c.label}))}/>
                  <EditableField label="السوق المستهدف" fieldKey="market_country" value={editData.market_country||''} editMode={editMode} onChange={handleFieldChange} icon={<Globe size={13}/>}
                    type="select" options={COUNTRIES.map(c=>({value:c.label,label:c.label}))}/>
                  <EditableField label="الفئة" fieldKey="category" value={editData.category||''} editMode={editMode} onChange={handleFieldChange} icon={<Package size={13}/>}
                    type="select" options={PRODUCT_CATEGORIES.map(c=>({value:c.label,label:c.label}))}/>
                  <EditableField label="درجة الجودة" fieldKey="quality_grade" value={editData.quality_grade||''} editMode={editMode} onChange={handleFieldChange} icon={<Award size={13}/>}/>
                  <EditableField label="مدة الصلاحية" fieldKey="shelf_life" value={editData.shelf_life||''} editMode={editMode} onChange={handleFieldChange} icon={<Clock size={13}/>}/>
                  <EditableField label="الكمية المتاحة" fieldKey="stock_quantity" value={editData.stock_quantity||''} editMode={editMode} onChange={handleFieldChange} icon={<Scale size={13}/>}/>
                </div>
              </section>

              {/* الوصف */}
              <section style={{background:S.card,borderRadius:14,padding:'18px 20px',border:`1px solid ${editMode?S.gold+'40':S.border}`}}>
                <div style={{fontSize:12,fontWeight:700,color:S.gold,marginBottom:10}}>📋 وصف المنتج</div>
                {editMode?(
                  <textarea value={editData.notes||''} onChange={e=>handleFieldChange('notes',e.target.value)} rows={4}
                    style={{...inp,resize:'none',lineHeight:'1.8'} as React.CSSProperties}/>
                ):(
                  <div style={{fontSize:13,color:S.white,lineHeight:'1.9'}}>{product.notes||'لا يوجد وصف مضاف.'}</div>
                )}
              </section>

              {/* الاعتمادات */}
              <section style={{background:S.card,borderRadius:14,padding:'18px 20px',border:`1px solid ${editMode?S.gold+'40':S.border}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <ShieldCheck size={15} color={S.gold}/>
                  <div style={{fontSize:13,fontWeight:800,color:S.gold}}>الاعتمادات والشهادات</div>
                </div>
                {editMode?(
                  <div>
                    <div style={{fontSize:11,color:S.muted,marginBottom:6}}>أدخل الشهادات مفصولة بـ ،</div>
                    <input value={editData.certifications||''} onChange={e=>handleFieldChange('certifications',e.target.value)} style={inp} placeholder="ISO، HACCP، Halal، ..."/>
                  </div>
                ):(
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {certs.length>0?certs.map((c:string,i:number)=><Badge key={i} text={c}/>):<span style={{color:S.muted,fontSize:12}}>لا توجد شهادات</span>}
                  </div>
                )}
              {/* ══ FIX 3: المواصفات التقنية — المستخدم يضيفها بنفسه ══ */}
              </section>

              <TechnicalSpecsEditor editData={editData} editMode={editMode} onChange={handleFieldChange}/>

              {/* ══ FIX 4: اللوجستيات — اختيارية ══ */}
              <LogisticsEditor editData={editData} editMode={editMode} onChange={handleFieldChange} product={product}/>

              </div>

            {/* ══ Sidebar ══ */}
            <aside style={{position:'sticky',top:10,display:'flex',flexDirection:'column',gap:16}}>

              {/* بطاقة السعر */}
              <div style={{background:`linear-gradient(145deg,${S.navy2},${S.navy})`,borderRadius:22,padding:24,border:`1px solid ${S.gold}`,boxShadow:`0 16px 40px rgba(0,0,0,0.4),0 0 30px ${S.gold}15`}}>
                <div style={{fontSize:11,color:S.muted,marginBottom:6,textAlign:'right'}}>السعر المرجعي</div>
                {editMode?(
                  <div style={{display:'flex',gap:8,marginBottom:6}}>
                    <select value={editData.currency||'USD'} onChange={e=>handleFieldChange('currency',e.target.value)}
                      style={{...inp,width:'auto',padding:'7px 10px',cursor:'pointer',fontSize:12}}>
                      {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{c.id}</option>)}
                    </select>
                    <input value={editData.price_range||''} onChange={e=>handleFieldChange('price_range',e.target.value)}
                      style={{...inp,fontSize:18,fontWeight:900}} placeholder="السعر..."/>
                  </div>
                ):(
                  <div style={{fontSize:32,fontWeight:900,color:S.white,textAlign:'right',marginBottom:6}}>
                    {product.price_range||'—'}
                    <span style={{fontSize:14,color:S.gold,marginRight:6}}>/ {product.currency||'USD'}</span>
                  </div>
                )}
                <div style={{margin:'16px 0',padding:'14px 0',borderTop:`1px solid ${S.border}`,borderBottom:`1px solid ${S.border}`,display:'flex',flexDirection:'column',gap:10}}>
                  {[
                    {l:'Lead Time', v:product.shipping_time||'14–21 يوم'},
                    {l:'نظام الدفع', v:product.payment_terms||'LC / TT 30-70'},
                    {l:'المورد',     v:supplier?.company_name||'—'},
                    {l:'Incoterms', v:product.incoterms||'CIF'},
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                      <span style={{fontWeight:700,color:S.white}}>{r.v}</span>
                      <span style={{color:S.muted}}>{r.l}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setShowSendOffer(true)}
                  style={{width:'100%',background:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,padding:'13px',borderRadius:12,fontWeight:900,fontSize:14,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:`0 4px 16px ${S.gold}40`,marginBottom:10}}>
                  <Send size={16}/> إرسال لمستخدم آخر
                </button>
                <button onClick={()=>setActiveTab('offer')}
                  style={{width:'100%',background:'transparent',color:S.gold,padding:'11px',borderRadius:12,fontWeight:700,fontSize:13,border:`1px solid ${S.gold}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  📋 تقديم عرض سعر مخصص
                </button>
              </div>

              {/* معلومات المورد */}
              {supplier&&(
                <div style={{background:S.card,borderRadius:16,padding:'16px 18px',border:`1px solid ${S.border}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:S.muted,marginBottom:10}}>🏭 معلومات المورد</div>
                  {[{l:'الشركة',v:supplier.company_name||'—'},{l:'الدولة',v:getCountryLabel(supplier.country)||'—'},{l:'المدينة',v:supplier.city||'—'},{l:'التقييم',v:`${supplier.rating||0}/10 ⭐`}]
                    .map((f,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:i<3?`1px solid ${S.border}`:'none'}}>
                        <span style={{fontWeight:600,color:S.white}}>{f.v}</span>
                        <span style={{color:S.muted}}>{f.l}</span>
                      </div>
                    ))}
                </div>
              )}

              <div style={{background:S.amberB,padding:'14px 16px',borderRadius:14,border:`1px solid ${S.amber}40`,display:'flex',gap:10}}>
                <AlertCircle size={18} color={S.amber} style={{flexShrink:0,marginTop:2}}/>
                <p style={{fontSize:11,color:S.amber,lineHeight:'1.7',margin:0}}>
                  <strong>تنبيه:</strong> الأسعار مرجعية وتتغير وفق تكاليف الشحن وأسعار الصرف.
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* ══ تبويب: تقديم عرض سعر ══ */}
        {activeTab==='offer'&&(
          <div style={{maxWidth:720,margin:'0 auto'}}>
            <OfferTab product={product} currentUser={currentUser}/>
          </div>
        )}

      </main>
      </div>{/* end scrollable */}

      {showSendOffer&&(
        <SendOfferModal product={product} currentUser={currentUser}
          onClose={()=>setShowSendOffer(false)} onSent={()=>setOffersSent(p=>p+1)}/>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════
// تبويب: تقديم عرض سعر
// ════════════════════════════════════════════════
function OfferTab({product,currentUser}:{product:any;currentUser:any}){
  const [form,      setForm]      = useState({price:'',currency:'USD',quantity:'',unit:'MT',validDays:'7',paymentTerms:'LC',deliveryPort:'',note:''})
  const [search,    setSearch]    = useState('')
  const [users,     setUsers]     = useState<any[]>([])
  const [selUser,   setSelUser]   = useState<any>(null)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [myOffers,  setMyOffers]  = useState<any[]>([])
  const [showSent,  setShowSent]  = useState(false)

  // جلب العروض المُرسلة لهذا المنتج
  useEffect(()=>{
    if(!currentUser||!product) return
    supabase.from('product_offers').select('*').eq('product_id',product.id).eq('sender_id',currentUser.id)
      .order('created_at',{ascending:false}).then(({data})=>setMyOffers(data||[]))
  },[currentUser,product,sent])

  useEffect(()=>{
    if(search.length<2){setUsers([]);return}
    const t=setTimeout(async()=>{
      const {data:profilesData} = await supabase.from('profiles').select('id,full_name,email,user_code,company_name')
        .or(`email.ilike.%${search}%,user_code.ilike.%${search}%,full_name.ilike.%${search}%,company_name.ilike.%${search}%`)
        .neq('id',currentUser?.id).limit(8)
      if(profilesData&&profilesData.length>0){ setUsers(profilesData) }
      else {
        const {data:custData}=await supabase.from('customers').select('id,full_name,email,company_name')
          .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`).limit(6)
        setUsers((custData||[]).map(c=>({id:c.id,full_name:c.full_name,email:c.email||'',user_code:'',company_name:c.company_name||''})))
      }
    },300)
    return()=>clearTimeout(t)
  },[search])

  async function handleSend(){
    if(!selUser){alert('اختر المستخدم المُرسَل إليه');return}
    if(!form.price){alert('أدخل السعر المعروض');return}
    setSending(true)
    const expires=new Date()
    expires.setDate(expires.getDate()+parseInt(form.validDays||'7'))
    const {error}=await supabase.from('product_offers').insert([{
      product_id:product.id, product_name:product.name, product_data:product,
      sender_id:currentUser?.id, receiver_id:selUser.id,
      offered_price:`${form.price} ${form.currency} / ${form.quantity||'—'} ${form.unit}`,
      currency:form.currency, note:`شروط الدفع: ${form.paymentTerms} | ميناء التسليم: ${form.deliveryPort||'—'}\n${form.note}`,
      status:'pending', expires_at:expires.toISOString(),
    }])
    setSending(false)
    if(error){alert('خطأ: '+error.message);return}
    setSent(true)
    setTimeout(()=>setSent(false),4000)
  }

  const statusColor:Record<string,string>={pending:S.amber,accepted:S.green,rejected:S.red,expired:S.muted}
  const statusLabel:Record<string,string>={pending:'قيد الانتظار',accepted:'✅ مقبول',rejected:'❌ مرفوض',expired:'منتهي'}

  return(
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      {sent&&(
        <div style={{background:S.greenB,border:`1px solid ${S.green}40`,borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',gap:12,textAlign:'right'}}>
          <Check size={22} color={S.green}/>
          <div>
            <div style={{fontWeight:700,color:S.green}}>تم إرسال العرض بنجاح!</div>
            <div style={{fontSize:12,color:S.muted,marginTop:3}}>إلى {selUser?.full_name||selUser?.email}</div>
          </div>
        </div>
      )}

      {/* فورم العرض */}
      <div style={{background:S.navy2,borderRadius:20,padding:26,border:`1px solid ${S.border}`}}>
        <div style={{fontSize:15,fontWeight:800,color:S.gold2,marginBottom:20,textAlign:'right'}}>📋 تفاصيل عرض السعر</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

          {/* السعر */}
          <div style={{gridColumn:'span 2'}}>
            <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>السعر المعروض *</label>
            <div style={{display:'flex',gap:8}}>
              <select value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))}
                style={{...inp,width:'auto',flexShrink:0,cursor:'pointer'}}>
                {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{c.id}</option>)}
              </select>
              <input type="text" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))}
                placeholder="مثال: 980 – 1050" style={{...inp,fontSize:16,fontWeight:700}}/>
            </div>
          </div>

          {/* الكمية */}
          <div>
            <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>الكمية المطلوبة</label>
            <div style={{display:'flex',gap:8}}>
              <select value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}
                style={{...inp,width:'auto',cursor:'pointer'}}>
                {['MT','KG','TON','Container','Unit'].map(u=><option key={u} value={u} style={{background:S.navy2}}>{u}</option>)}
              </select>
              <input type="text" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}
                placeholder="الكمية" style={inp}/>
            </div>
          </div>

          {/* مدة الصلاحية */}
          <div>
            <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>مدة صلاحية العرض</label>
            <div style={{display:'flex',gap:6}}>
              {[3,7,14,30].map(d=>(
                <button key={d} onClick={()=>setForm(p=>({...p,validDays:String(d)}))}
                  style={{flex:1,padding:'9px 0',borderRadius:8,border:`1px solid ${form.validDays===String(d)?S.gold:S.border}`,background:form.validDays===String(d)?S.gold3:'transparent',color:form.validDays===String(d)?S.gold2:S.muted,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  {d}ي
                </button>
              ))}
            </div>
          </div>

          {/* شروط الدفع */}
          <div>
            <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>شروط الدفع</label>
            <select value={form.paymentTerms} onChange={e=>setForm(p=>({...p,paymentTerms:e.target.value}))}
              style={{...inp,cursor:'pointer'}}>
              {['LC','TT','TT 30-70','CAD','Open Account','Advance Payment'].map(t=><option key={t} value={t} style={{background:S.navy2}}>{t}</option>)}
            </select>
          </div>

          {/* ميناء التسليم */}
          <div>
            <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>ميناء التسليم</label>
            <input type="text" value={form.deliveryPort} onChange={e=>setForm(p=>({...p,deliveryPort:e.target.value}))}
              placeholder="مثال: CIF Dammam" style={inp}/>
          </div>

          {/* ملاحظات */}
          <div style={{gridColumn:'span 2'}}>
            <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>ملاحظات إضافية</label>
            <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} rows={3}
              placeholder="تفاصيل تفاوضية، شروط خاصة، ملاحظات للمستلم..."
              style={{...inp,resize:'none',lineHeight:'1.7'} as React.CSSProperties}/>
          </div>
        </div>
      </div>

      {/* اختيار المستلم */}
      <div style={{background:S.navy2,borderRadius:20,padding:26,border:`1px solid ${S.border}`}}>
        <div style={{fontSize:15,fontWeight:800,color:S.gold2,marginBottom:16,textAlign:'right'}}>👤 إرسال إلى مستخدم</div>
        <input type="text" placeholder="ابحث بالاسم أو الإيميل أو الكود..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{...inp,marginBottom:12}}/>
        {users.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
            {users.map(u=>(
              <div key={u.id} onClick={()=>setSelUser(selUser?.id===u.id?null:u)}
                style={{background:selUser?.id===u.id?S.goldB:S.card,border:`1px solid ${selUser?.id===u.id?S.gold:S.border}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all .15s'}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  {selUser?.id===u.id&&<Check size={14} color={S.green}/>}
                  {u.user_code&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:S.blueB,color:S.blue,fontWeight:700}}>{u.user_code}</span>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:700,color:S.white}}>{u.full_name||'—'}</div>
                  <div style={{fontSize:11,color:S.muted}}>{u.email}</div>
                  {u.company_name&&<div style={{fontSize:10,color:S.gold}}>{u.company_name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {selUser&&(
          <div style={{background:S.greenB,border:`1px solid ${S.green}30`,borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button onClick={()=>setSelUser(null)} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:11}}>إلغاء الاختيار</button>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:S.green,fontWeight:700}}>✓ المستلم المختار</div>
              <div style={{fontSize:13,fontWeight:700,color:S.white}}>{selUser.full_name||selUser.email}</div>
            </div>
          </div>
        )}
        <button onClick={handleSend} disabled={sending||!selUser||!form.price}
          style={{width:'100%',background:sending||!selUser||!form.price?S.muted:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,border:'none',padding:'15px',borderRadius:14,fontWeight:900,fontSize:15,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .2s'}}>
          <Send size={18}/>{sending?'جاري الإرسال...':'إرسال عرض السعر'}
        </button>
      </div>

      {/* العروض المُرسلة سابقاً */}
      {myOffers.length>0&&(
        <div style={{background:S.navy2,borderRadius:20,padding:26,border:`1px solid ${S.border}`}}>
          <button onClick={()=>setShowSent(!showSent)}
            style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',fontFamily:'Tajawal, sans-serif',padding:0}}>
            {showSent?<ChevronUp size={16} color={S.muted}/>:<ChevronDown size={16} color={S.muted}/>}
            <div style={{fontSize:13,fontWeight:700,color:S.muted}}>العروض المُرسلة لهذا المنتج ({myOffers.length})</div>
          </button>
          {showSent&&(
            <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:10}}>
              {myOffers.map(o=>(
                <div key={o.id} style={{background:S.card,borderRadius:12,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:`${statusColor[o.status]||S.muted}18`,color:statusColor[o.status]||S.muted,fontWeight:700}}>
                      {statusLabel[o.status]||o.status}
                    </span>
                    <span style={{fontSize:11,color:S.muted}}>
                      {o.expires_at&&`ينتهي: ${new Date(o.expires_at).toLocaleDateString('ar-EG')}`}
                    </span>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13,fontWeight:700,color:S.white}}>{o.offered_price||'—'}</div>
                    <div style={{fontSize:10,color:S.muted}}>{new Date(o.created_at).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
