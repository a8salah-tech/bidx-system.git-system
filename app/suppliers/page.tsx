'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { COUNTRIES } from '@/app/components/options';

// ── نظام الألوان ──
const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#0C1A32',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.12)',goldB:'rgba(201,168,76,0.22)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.08)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.12)',
  red:'#EF4444',redB:'rgba(239,68,68,0.12)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.12)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.12)',
  card:'rgba(255,255,255,0.04)',card2:'rgba(255,255,255,0.08)',
  purple:'#8B5CF6',
}

const inp: React.CSSProperties = {
  width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.10)',
  borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#fff',
  outline:'none',fontFamily:'Tajawal, sans-serif',boxSizing:'border-box',
  direction:'rtl',textAlign:'right',transition:'border-color .2s',
}

interface Supplier {
  id:string; created_at:string; supplier_number:number; company_name:string;
  country:string; city:string; status:string; rating:number; completion_pct:number;
  contact_name:string; contact_whatsapp:string; contact_email:string; contact_phone:string;
  annual_sales:string; notes:string; total_deals:number; total_amount:number;
  main_products:string; last_contact_date:string; last_contact_method:string;
  website:string; certifications:string; quality_rating:number; delivery_rating:number;
  comm_rating:number; price_rating:number; flex_rating:number; user_id:string;
}

// ── دوال مساعدة ──
function timeAgo(date:string){
  if(!date) return null
  const diff=Math.floor((Date.now()-new Date(date).getTime())/86400000)
  if(diff===0) return 'اليوم'
  if(diff===1) return 'منذ يوم'
  if(diff<7) return `منذ ${diff} أيام`
  if(diff<30) return `منذ ${Math.floor(diff/7)} أسابيع`
  return `منذ ${Math.floor(diff/30)} شهر`
}
function formatSupNum(n:number){ return `SUP-${String(n).padStart(5,'0')}` }
function initials(name:string){ return name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'??' }
function ratingColor(r:number){ return r>=7?S.green:r>=5?S.amber:S.red }

// ── نجوم التقييم ──
function Stars({rating,max=10,size=10}:{rating:number;max?:number;size?:number}){
  const stars=Math.round((rating/max)*5)
  return(
    <div style={{display:'flex',gap:2,alignItems:'center'}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 16 16" style={{fill:i<=stars?S.gold:'rgba(201,168,76,0.2)'}}>
          <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
        </svg>
      ))}
      <span style={{fontSize:size-2,color:S.muted,marginRight:3}}>{rating||0}/10</span>
    </div>
  )
}
// ════════════════════════════════════════════════
// Modal إضافة مورد — تصميم جديد متعدد الخطوات
// ════════════════════════════════════════════════
function AddSupplierModal({onClose,onSaved,existingSuppliers}:{
  onClose:()=>void; onSaved:()=>void; existingSuppliers:Supplier[];
}){
  const [step,       setStep]       = useState(1) // خطوات 1,2,3
  const [aiLoading,  setAiLoading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({
    company_name:'',country:'',city:'',
    contact_name:'',contact_whatsapp:'',contact_email:'',contact_phone:'',
    annual_sales:'',main_products:'',notes:'',website:'',certifications:'',
  })


  function set(k:string,v:string){ setForm(p=>({...p,[k]:v})) }
  function calcCompletion(){
    const fields=['company_name','country','city','contact_name','contact_whatsapp','contact_email','annual_sales','main_products','notes']
    return Math.round(fields.filter(k=>(form as any)[k]?.trim()).length/fields.length*100)
  }

  async function fillWithAI(){
    if(!form.company_name){alert('اكتب اسم الشركة أولاً');return}
    setAiLoading(true)
    try{
      const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company_name:form.company_name})})
      const data=await res.json()
      const parsed=JSON.parse((data?.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim())
setForm(p => ({ ...p, ...parsed, main_products: Array.isArray(parsed.main_products) ? parsed.main_products.join('، ') : (parsed.main_products || p.main_products) }));    }catch{ alert('تعذر الاتصال بالذكاء الاصطناعي') }
    finally{ setAiLoading(false) }
  }

  async function handleSave(){
    if(!form.company_name){alert('يرجى إدخال اسم الشركة');return}
    setSaving(true)
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){alert('جلسة الدخول انتهت');return}

      const rawProducts = form.main_products || ''
      const productsArray = rawProducts
        .split(/[،,]/)
        .map(p => p.trim())
        .filter(Boolean)

      // --- 🚀 FIX: تنظيف البيانات ومنع خطأ malformed array literal ---
      const cleanedForm = { ...form };
      
      // التأكد من أن حقل certifications إما مصفوفة أو NULL (وليس نصاً فارغاً)
      if (cleanedForm.certifications === "") {
        (cleanedForm as any).certifications = null;
      }
      // -------------------------------------------------------------

      // حفظ المورد أولاً باستخدام cleanedForm
const {data:suppData,error:suppErr}=await supabase.from('suppliers').insert([{
        ...cleanedForm,
        main_products: productsArray.join('، '), // تحويل المصفوفة لنص نظيف قبل الحفظ
        status:'active',rating:0,
        completion_pct:calcCompletion(),
        user_id:user.id,
      }]).select().single()

      if(suppErr) throw suppErr

      // حفظ المنتجات في الربط (supplier_products)
if (productsArray.length > 0 && suppData) {
  for (const name of productsArray) {
    // 1. شيك هل المنتج موجود بالاسم ده؟
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (!existing) {
      // 2. لو مش موجود: انشئه واربطه بالمورد فوراً في نفس السطر
      await supabase
        .from('products')
        .insert([{ 
          name: name.trim(), 
          user_id: user.id,
          supplier_id: suppData.id, // الربط المباشر هنا هو السر
          status: 'active',
          origin_country: cleanedForm.country // المنشأ عشان يظهر في الفلاتر
        }]);
    } else {
      // 3. لو موجود: حدث بياناته وخليه يرتبط بالمورد ده (أو سيبه لو ده السيستم بتاعك)
      await supabase
        .from('products')
        .update({ supplier_id: suppData.id })
        .eq('id', existing.id);
    }
  }
}

      onSaved()
      onClose()
    }catch(err:any){
      alert('خطأ: '+err.message)
    }finally{setSaving(false)}
  }

  const completion=calcCompletion()
  const steps=[
    {n:1,label:'البيانات الأساسية'},
    {n:2,label:'التواصل'},
    {n:3,label:'المنتجات والملاحظات'},
  ]

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(12px)',padding:16}}>
      <div style={{background:S.navy2,width:'100%',maxWidth:620,borderRadius:24,border:`1px solid ${S.goldB}`,direction:'rtl',overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,0.7)',display:'flex',flexDirection:'column',maxHeight:'92vh'}}>

        {/* هيدر */}
        <div style={{background:`linear-gradient(135deg,${S.navy},${S.navy2})`,padding:'22px 26px',borderBottom:`1px solid ${S.goldB}`,flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <button onClick={onClose} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:17,fontWeight:800,color:S.gold2,marginBottom:2}}>➕ إضافة مورد جديد</div>
              <div style={{fontSize:11,color:S.muted}}>اكتمال الملف: <span style={{color:completion>=80?S.green:completion>=50?S.amber:S.red,fontWeight:700}}>{completion}%</span></div>
            </div>
          </div>

          {/* شريط الخطوات */}
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {steps.map((s,i)=>(
              <div key={s.n} style={{display:'flex',alignItems:'center',gap:6,flex:1}}>
                <div onClick={()=>setStep(s.n)}
                  style={{display:'flex',alignItems:'center',gap:7,cursor:'pointer',flex:1,padding:'7px 10px',borderRadius:10,background:step===s.n?S.gold3:'transparent',border:`1px solid ${step===s.n?S.gold:S.border}`,transition:'all .2s'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:step>s.n?S.green:step===s.n?S.gold:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:S.navy,flexShrink:0}}>
                    {step>s.n?'✓':s.n}
                  </div>
                  <div style={{fontSize:10,color:step===s.n?S.gold2:S.muted,fontWeight:step===s.n?700:400}}>{s.label}</div>
                </div>
                {i<2&&<div style={{width:16,height:1,background:S.border,flexShrink:0}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* المحتوى */}
        <div style={{flex:1,overflowY:'auto',padding:'22px 26px'}}>

          {/* زر AI */}
          <button onClick={fillWithAI} disabled={aiLoading}
            style={{width:'100%',background:S.gold3,color:S.gold2,border:`1px solid ${S.goldB}`,padding:'10px',borderRadius:10,fontSize:12,fontWeight:700,cursor:aiLoading?'not-allowed':'pointer',fontFamily:'Tajawal, sans-serif',marginBottom:18,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {aiLoading?'⏳ جاري البحث...':'✨ إملأ البيانات بالذكاء الاصطناعي'}
          </button>

          {/* ── الخطوة 1: البيانات الأساسية ── */}
          {step===1&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اسم الشركة *</label>
                <input value={form.company_name} onChange={e=>set('company_name',e.target.value)} style={inp} placeholder="مثال: Wilmar International"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>الدولة </label>
                <select 
                  style={{...inp, cursor:'pointer', backgroundColor: '#0F2040', color: '#fff'}} 
                  value={form.country} // 
                  onChange={e => set('country', e.target.value)} 
                >
                  <option value="" style={{background: S.blueB, color: '#fff'}}>اختر...</option>
                  {COUNTRIES.map(c => (
                    <option key={c.id || c.value} value={c.value} style={{background: '#0F2040', color: '#fff'}}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>المدينة</label>
                  <input value={form.city} onChange={e=>set('city',e.target.value)} style={inp} placeholder="مثال: جاكرتا"/>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>الموقع الإلكتروني</label>
                <input value={form.website} onChange={e=>set('website',e.target.value)} style={inp} placeholder="www.company.com"/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>حجم المبيعات السنوية</label>
                <input value={form.annual_sales} onChange={e=>set('annual_sales',e.target.value)} style={inp} placeholder="مثال: $10M"/>
              </div>
            </div>
          )}

          {/* ── الخطوة 2: بيانات التواصل ── */}
          {step===2&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>اسم المسؤول</label>
                <input value={form.contact_name} onChange={e=>set('contact_name',e.target.value)} style={inp} placeholder="الشخص المسؤول"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>📱 واتساب</label>
                  <input value={form.contact_whatsapp} onChange={e=>set('contact_whatsapp',e.target.value)} style={inp} placeholder="+62 8xx xxx xxxx"/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>📞 هاتف</label>
                  <input value={form.contact_phone} onChange={e=>set('contact_phone',e.target.value)} style={inp} placeholder="+62 xx xxx xxxx"/>
                </div>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>✉️ الإيميل</label>
                <input value={form.contact_email} onChange={e=>set('contact_email',e.target.value)} style={inp} placeholder="email@company.com"/>
              </div>
              {/* معاينة بطاقة التواصل */}
              {(form.contact_name||form.contact_whatsapp)&&(
                <div style={{background:S.card,borderRadius:12,padding:'14px 16px',border:`1px solid ${S.border}`}}>
                  <div style={{fontSize:10,color:S.muted,marginBottom:8,fontWeight:700,textAlign:'right'}}>معاينة بطاقة التواصل</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',gap:8}}>
                      {form.contact_whatsapp&&<a href={`https://wa.me/${form.contact_whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" style={{fontSize:10,padding:'4px 10px',borderRadius:6,background:S.greenB,color:S.green,textDecoration:'none',fontWeight:700}}>📱 واتساب</a>}
                      {form.contact_email&&<a href={`mailto:${form.contact_email}`} style={{fontSize:10,padding:'4px 10px',borderRadius:6,background:S.blueB,color:S.blue,textDecoration:'none',fontWeight:700}}>✉️ إيميل</a>}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:13,fontWeight:700,color:S.white}}>{form.contact_name||'—'}</div>
                      <div style={{fontSize:10,color:S.muted}}>{form.company_name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── الخطوة 3: المنتجات والملاحظات ── */}
          {step===3&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>المنتجات الرئيسية</label>
                <div style={{fontSize:10,color:S.muted,marginBottom:6,textAlign:'right'}}>أدخل المنتجات مفصولة بـ ، (فاصلة عربية)</div>
                <textarea value={form.main_products} onChange={e=>set('main_products',e.target.value)} rows={4}
                  placeholder="مثال: زيت نخيل، فحم جوز هند، زيت جوز هند..." style={{...inp,resize:'none',lineHeight:'1.7'} as React.CSSProperties}/>
                {/* معاينة المنتجات */}
                {form.main_products&&(
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                    {form.main_products.split(/[،,]/).map(p=>p.trim()).filter(Boolean).map((p,i)=>(
                      <span key={i} style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:S.gold3,color:S.gold2,border:`1px solid ${S.goldB}`,fontWeight:600}}>📦 {p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>الشهادات والاعتمادات</label>
                <input value={form.certifications} onChange={e=>set('certifications',e.target.value)} style={inp} placeholder="ISO، Halal، HACCP، ..."/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.muted,fontWeight:700,marginBottom:6,textAlign:'right'}}>ملاحظات</label>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
                  placeholder="نبذة عن المورد، تفاصيل إضافية..." style={{...inp,resize:'none'} as React.CSSProperties}/>
              </div>
            </div>
          )}
        </div>

        {/* أزرار التنقل */}
        <div style={{padding:'16px 26px',borderTop:`1px solid ${S.border}`,flexShrink:0,display:'flex',gap:10}}>
          {step>1?(
            <button onClick={()=>setStep(p=>p-1)} style={{flex:1,background:'transparent',color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
              ← السابق
            </button>
          ):(
            <button onClick={onClose} style={{flex:1,background:'transparent',color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
          )}
          {step<3?(
            <button onClick={()=>setStep(p=>p+1)} disabled={step===1&&!form.company_name}
              style={{flex:2,background:step===1&&!form.company_name?S.muted:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,border:'none',padding:11,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
              التالي →
            </button>
          ):(
            <button onClick={handleSave} disabled={saving}
              style={{flex:2,background:saving?S.muted:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,border:'none',padding:11,borderRadius:10,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'Tajawal, sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {saving?'⏳ جاري الحفظ...':'✅ إضافة المورد'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════
export default function SuppliersPage(){
  const router = useRouter()

  const [suppliers,     setSuppliers]     = useState<Supplier[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState<'active'|'suspended'>('active')
  const [showForm,      setShowForm]      = useState(false)
  const [filterCountry, setFilterCountry] = useState('')
  const [viewMode,      setViewMode]      = useState<'table'|'cards'>('table')
  const [userName,      setUserName]      = useState('User')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [sortField,     setSortField]     = useState<'company_name'|'rating'|'total_deals'|'last_contact_date'|'completion_pct'>('company_name')
  const [sortDir,       setSortDir]       = useState<'asc'|'desc'>('asc')
  // FIX 3 — الميزة الإضافية 1: بحث سريع في المنتجات
  const [productSearch, setProductSearch] = useState('')

  const rowsPerPage=20

  const fetchSuppliers=useCallback(async()=>{
    setLoading(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(user) setUserName(user.user_metadata?.full_name||user.email?.split('@')[0]||'User')
    const {data,error}=await supabase.from('suppliers').select('*').order('created_at',{ascending:false})
    if(!error) setSuppliers(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{ fetchSuppliers() },[fetchSuppliers])

  async function toggleStatus(id:string,currentStatus:string){
    const newStatus=currentStatus==='active'?'suspended':'active'
    const {error}=await supabase.from('suppliers').update({status:newStatus}).eq('id',id)
    if(!error) setSuppliers(prev=>prev.map(s=>s.id===id?{...s,status:newStatus}:s))
  }

  // FIX 3 — الميزة الإضافية 2: تحديث آخر تواصل بنقرة
  async function markContacted(id:string){
    const now=new Date().toISOString()
    const {error}=await supabase.from('suppliers').update({last_contact_date:now,last_contact_method:'manual'}).eq('id',id)
    if(!error){
      setSuppliers(prev=>prev.map(s=>s.id===id?{...s,last_contact_date:now}:s))
      alert('✅ تم تسجيل التواصل اليوم')
    }
  }

  const exportToExcel=()=>{
    if(filtered.length===0) return alert('لا توجد بيانات للتصدير')
    const ws=XLSX.utils.json_to_sheet(filtered.map(s=>({
      'رقم المورد':formatSupNum(s.supplier_number),'اسم الشركة':s.company_name,
      'الدولة':s.country,'المدينة':s.city,'المنتجات':s.main_products,
      'واتساب':s.contact_whatsapp,'الإيميل':s.contact_email,
      'التقييم':`${s.rating||0}/10`,'الصفقات':s.total_deals||0,
      'آخر تواصل':s.last_contact_date?new Date(s.last_contact_date).toLocaleDateString('ar-EG'):'—',
      'الحالة':s.status==='active'?'نشط':'موقوف',
    })))
    const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Suppliers')
    XLSX.writeFile(wb,`${userName}_Suppliers_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ── تصفية وترتيب ──
  const filtered=useMemo(()=>{
    let res=suppliers
      .filter(s=>s.status===tab)
      .filter(s=>s.company_name?.toLowerCase().includes(search.toLowerCase()))
      .filter(s=>filterCountry?s.country===filterCountry:true)
      .filter(s=>!productSearch||s.main_products?.toLowerCase().includes(productSearch.toLowerCase()))

    res=[...res].sort((a,b)=>{
      let va=(a as any)[sortField]||0, vb=(b as any)[sortField]||0
      if(typeof va==='string') return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va)
      return sortDir==='asc'?va-vb:vb-va
    })
    return res
  },[suppliers,tab,search,filterCountry,productSearch,sortField,sortDir])

  const totalPages=Math.ceil(filtered.length/rowsPerPage)
  const paged=filtered.slice((currentPage-1)*rowsPerPage,currentPage*rowsPerPage)

  function toggleSort(field:typeof sortField){
    if(sortField===field) setSortDir(d=>d==='asc'?'desc':'asc')
    else{ setSortField(field);setSortDir('asc') }
  }

  const active=suppliers.filter(s=>s.status==='active')
  const totalDeals=suppliers.reduce((a,b)=>a+(b.total_deals||0),0)
  const avgRating=suppliers.length?(suppliers.reduce((a,b)=>a+(b.rating||0),0)/suppliers.length).toFixed(1):'0'

  // FIX 3 — الميزة الإضافية 3: بيانات المنتجات الأكثر شيوعاً
  const topProducts=useMemo(()=>{
    const map:Record<string,number>={}
    suppliers.forEach(s=>{
      (s.main_products||'').split(/[،,]/).forEach(p=>{
        const n=p.trim()
        if(n) map[n]=(map[n]||0)+1
      })
    })
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5)
  },[suppliers])

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal,sans-serif',direction:'rtl',background:S.navy}}>

      {/* ══ شريط الأدوات ══ */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>setShowForm(true)}
            style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            + إضافة مورد
          </button>
          <button onClick={exportToExcel}
            style={{background:'rgba(232,201,122,0.1)',color:S.gold2,border:`1px solid ${S.gold}`,padding:'9px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            📤 تصدير
          </button>
          <button onClick={()=>router.push('/pricing/compare')}
            style={{background:S.card2,color:S.muted,border:`1px solid ${S.border}`,padding:'9px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            📊 مقارنة أسعار
          </button>
          <button onClick={()=>router.push('/Buy-Request')}
            style={{background:S.card2,color:S.muted,border:`1px solid ${S.border}`,padding:'9px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            ⚖️ طلب شراء
          </button>
        </div>
        <div style={{fontSize:12,color:S.muted}}>
          {active.length} نشط من {suppliers.length} مورد
        </div>
      </div>

      {/* ══ المحتوى ══ */}
      <div style={{flex:1,overflowY:'auto',padding:'18px 24px'}}>

        {/* الإحصائيات */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'18px'}}>
          {[
            {label:'إجمالي الموردين', val:suppliers.length,      color:S.gold,    icon:'🏭'},
            {label:'نشطون',           val:active.length,          color:S.green,   icon:'✅'},
            {label:'موقوفون',         val:suppliers.filter(s=>s.status==='suspended').length, color:S.red, icon:'⏸'},
            {label:'إجمالي الصفقات', val:totalDeals,             color:S.blue,    icon:'📦'},
            {label:'متوسط التقييم',  val:avgRating,              color:S.amber,   icon:'⭐'},
          ].map((s,i)=>(
            <div key={i} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'12px',padding:'14px 16px',textAlign:'right'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:20}}>{s.icon}</span>
                <div style={{fontSize:'22px',fontWeight:700,color:s.color}}>{s.val}</div>
              </div>
              <div style={{fontSize:'10px',color:S.muted}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FIX 3 — أكثر المنتجات شيوعاً */}
        {topProducts.length>0&&(
          <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'12px',padding:'14px 18px',marginBottom:'16px'}}>
            <div style={{fontSize:12,fontWeight:700,color:S.muted,marginBottom:10,textAlign:'right'}}>📦 أكثر المنتجات شيوعاً بين الموردين</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-start'}}>
              {topProducts.map(([name,count],i)=>(
                <button key={i} onClick={()=>{setProductSearch(name);setViewMode('table')}}
                  style={{fontSize:11,padding:'4px 12px',borderRadius:20,background:i===0?S.gold3:S.card,color:i===0?S.gold2:S.muted,border:`1px solid ${i===0?S.goldB:S.border}`,cursor:'pointer',fontFamily:'Tajawal, sans-serif',fontWeight:i===0?700:400}}>
                  {name} <span style={{fontSize:10,opacity:.7}}>({count})</span>
                </button>
              ))}
              {productSearch&&<button onClick={()=>setProductSearch('')} style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:S.redB,color:S.red,border:`1px solid ${S.red}30`,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>✕ إلغاء الفلتر</button>}
            </div>
          </div>
        )}

        {/* شريط البحث والفلاتر */}
        <div style={{display:'flex',gap:'10px',marginBottom:'14px',alignItems:'center',flexWrap:'wrap'}}>
          <input type="text" placeholder="🔍 ابحث عن مورد..." value={search}
            onChange={e=>{setSearch(e.target.value);setCurrentPage(1)}}
            style={{flex:1,minWidth:'180px',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'10px',padding:'10px 16px',fontSize:'13px',color:S.white,outline:'none',fontFamily:'inherit',textAlign:'right',boxSizing:'border-box' as any}}/>

          <input type="text" placeholder="🔍 بحث في المنتجات..." value={productSearch}
            onChange={e=>{setProductSearch(e.target.value);setCurrentPage(1)}}
            style={{width:160,background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'10px',padding:'10px 14px',fontSize:'12px',color:S.white,outline:'none',fontFamily:'inherit',textAlign:'right',boxSizing:'border-box' as any}}/>

          <select value={filterCountry} onChange={e=>{setFilterCountry(e.target.value);setCurrentPage(1)}}
            style={{background:S.navy2,color:filterCountry?S.white:S.muted,border:`1px solid ${S.border}`,borderRadius:'10px',padding:'10px 14px',fontSize:'12px',outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
            <option value="">كل الدول</option>
            {[...new Set(suppliers.map(s=>s.country).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          <button onClick={()=>setViewMode(viewMode==='table'?'cards':'table')}
            style={{background:S.navy2,color:S.muted,border:`1px solid ${S.border}`,padding:'10px 14px',borderRadius:'10px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>
            {viewMode==='table'?'⊞ بطاقات':'☰ جدول'}
          </button>

          <div style={{display:'flex',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'10px',overflow:'hidden'}}>
            {[{key:'active',label:'نشطون',color:S.green},{key:'suspended',label:'موقوفون',color:S.red}].map(t=>(
              <button key={t.key} onClick={()=>{setTab(t.key as any);setCurrentPage(1)}}
                style={{padding:'9px 18px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'none',background:tab===t.key?`${t.color}22`:'transparent',color:tab===t.key?t.color:S.muted,transition:'all .15s'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── عرض البطاقات ── */}
        {viewMode==='cards'&&!loading&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px',marginBottom:'12px'}}>
            {filtered.length===0?(
              <div style={{textAlign:'center',color:S.muted,padding:'80px 0',gridColumn:'1/-1'}}>
                <div style={{fontSize:'48px',marginBottom:'16px'}}>🏭</div>
                <div style={{fontSize:'16px',fontWeight:700,color:S.white}}>لا يوجد موردون</div>
              </div>
            ):filtered.map(s=>(
              <div key={s.id} onClick={()=>router.push(`/suppliers/${s.id}`)}
                style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'14px',padding:'16px',cursor:'pointer',transition:'border-color .2s',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                  <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',flexShrink:0}}>
                    {initials(s.company_name)}
                  </div>
                  <div style={{flex:1,textAlign:'right'}}>
                    <div style={{fontSize:13,fontWeight:700}}>{s.company_name}</div>
                    <div style={{fontSize:10,color:S.muted}}>{s.country||'—'}{s.city?` / ${s.city}`:''}</div>
                  </div>
                  <span style={{fontSize:9,padding:'2px 8px',borderRadius:20,fontWeight:700,background:s.status==='active'?S.greenB:S.redB,color:s.status==='active'?S.green:S.red}}>
                    {s.status==='active'?'نشط':'موقوف'}
                  </span>
                </div>
                <div style={{marginBottom:8}}><Stars rating={s.rating||0}/></div>
                {s.main_products&&<div style={{fontSize:11,color:S.muted,textAlign:'right',marginBottom:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.main_products}</div>}
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,color:S.muted}}>{s.completion_pct||0}%</span>
                  <div style={{flex:1,height:3,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${s.completion_pct||0}%`,background:s.completion_pct>=80?S.green:s.completion_pct>=50?S.amber:S.red,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:10,color:S.muted}}>{formatSupNum(s.supplier_number)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── عرض الجدول ── */}
        {viewMode==='table'&&(
          <>
            {loading?(
              <div style={{textAlign:'center',color:S.muted,padding:'80px 0'}}>
                <div style={{fontSize:32,marginBottom:12}}>⏳</div>جاري التحميل...
              </div>
            ):filtered.length===0?(
              <div style={{textAlign:'center',color:S.muted,padding:'80px 0'}}>
                <div style={{fontSize:'48px',marginBottom:'16px'}}>🏭</div>
                <div style={{fontSize:'16px',fontWeight:700,color:S.white,marginBottom:8}}>لا يوجد موردون</div>
                <div style={{fontSize:'14px'}}>ابدأ بإضافة أول مورد</div>
              </div>
            ):(
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'14px',overflow:'hidden',alignItems: 'center'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${S.border}`,textAlign: 'center'}}>
                      {[
                        {label:'#',         field:null},
                        {label:'الشركة',    field:'company_name'},
                        {label:'الدولة',    field:null},
                        {label:'المنتجات',  field:null},
                        {label:'التقييم',   field:'rating'},
                        {label:'الصفقات',   field:'total_deals'},
                        {label:'الاكتمال',  field:'completion_pct'},
                        {label:'آخر تواصل', field:'last_contact_date'},
                        {label:'الحالة',    field:null},
                        {label:'إجراءات',   field:null},
                      ].map(h=>(
                        <th key={h.label} onClick={h.field?()=>toggleSort(h.field as any):undefined}
                          style={{padding:'11px 12px',textAlign:'center',fontSize:'10px',color:sortField===h.field?S.gold:S.muted,fontWeight:700,cursor:h.field?'pointer':'default',userSelect:'text',whiteSpace:'nowrap'}}>
                          {h.label}{h.field&&(sortField===h.field?(sortDir==='asc'?' ▲':' ▼'):'')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((s,i)=>(
                      <tr key={s.id} onClick={()=>router.push(`/suppliers/${s.id}`)}
                        style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:i%2===0?'transparent':S.card,cursor:'pointer',transition:'background .1s'}}>

                        <td style={{padding:'10px 12px',fontSize:10,color:S.muted,textAlign:'right',whiteSpace:'nowrap'}}>{formatSupNum(s.supplier_number)}</td>

                        <td style={{padding:'10px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>
                              {initials(s.company_name)}
                            </div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700}}>{s.company_name}</div>
                              {s.contact_name&&<div style={{fontSize:10,color:S.muted,marginTop:1}}>{s.contact_name}</div>}
                            </div>
                          </div>
                        </td>

                        <td style={{padding:'10px 12px',fontSize:11,color:S.white,textAlign:'right',whiteSpace:'nowrap'}}>
                          {s.country||'—'}{s.city?`\n${s.city}`:''}
                        </td>

                        <td style={{padding:'10px 12px',textAlign:'right',maxWidth:180}}>
                          <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                            {(s.main_products||'').split(/[،,]/).slice(0,3).map(p=>p.trim()).filter(Boolean).map((p,j)=>(
                              <span key={j} style={{fontSize:9,padding:'2px 6px',borderRadius:8,background:S.gold3,color:S.gold,fontWeight:600}}>{p}</span>
                            ))}
                            {(s.main_products||'').split(/[،,]/).length>3&&<span style={{fontSize:9,color:S.muted}}>+{(s.main_products||'').split(/[،,]/).length-3}</span>}
                          </div>
                        </td>

                        <td style={{padding:'10px 12px',textAlign:'right'}}>
                          <div style={{display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}>
                            <span style={{fontSize:12,fontWeight:700,color:ratingColor(s.rating||0)}}>{s.rating||0}</span>
                            <span style={{fontSize:9,color:S.muted}}>/10</span>
                          </div>
                        </td>

                        <td style={{padding:'10px 12px',fontSize:12,fontWeight:700,color:S.blue,textAlign:'right'}}>{s.total_deals||0}</td>

                        <td style={{padding:'10px 12px',textAlign:'right'}}>
                          <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                            <div style={{width:50,height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${s.completion_pct||0}%`,background:s.completion_pct>=80?S.green:s.completion_pct>=50?S.amber:S.red}}/>
                            </div>
                            <span style={{fontSize:10,color:S.muted}}>{s.completion_pct||0}%</span>
                          </div>
                        </td>

                        <td style={{padding:'10px 12px',textAlign:'right'}}>
                          {s.last_contact_date?(
                            <div>
                              <div style={{fontSize:11,color:S.white}}>{timeAgo(s.last_contact_date)}</div>
                              <div style={{fontSize:9,color:S.muted}}>{new Date(s.last_contact_date).toLocaleDateString('ar-EG')}</div>
                            </div>
                          ):(
                            <span style={{fontSize:10,color:S.red}}>لم يُتواصل</span>
                          )}
                        </td>

                        <td style={{padding:'10px 12px',textAlign:'right'}}>
                          <span style={{fontSize:10,padding:'3px 8px',borderRadius:20,fontWeight:700,
                            background:s.status==='active'?S.greenB:S.redB,
                            color:s.status==='active'?S.green:S.red}}>
                            {s.status==='active'?'نشط':'موقوف'}
                          </span>
                        </td>

                        <td style={{padding:'10px 12px',textAlign:'right'}} onClick={e=>e.stopPropagation()}>
                          <div style={{display:'flex',gap:5,justifyContent:'flex-end',alignItems:'center'}}>
                            {/* FIX 3 — ميزة: تسجيل التواصل بنقرة */}
                            <button onClick={()=>markContacted(s.id)} title="تسجيل تواصل اليوم"
                              style={{fontSize:10,padding:'4px 8px',borderRadius:6,border:`1px solid ${S.border}`,background:'transparent',color:S.muted,cursor:'pointer',fontFamily:'inherit'}}>
                              ⭐
                            </button>
                                     {s.contact_whatsapp && (
                              <a href={'https://wa.me/' + s.contact_whatsapp.replace(/[^0-9]/g, '')}
                                target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                title={'واتساب: ' + s.contact_whatsapp}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="#22C55E">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.528 5.855L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.516-5.165-1.415l-.371-.22-3.763.894.952-3.671-.242-.381A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                </svg>
                              </a>
                            )}
                              {s.contact_email && (
                              <a href={'mailto:' + s.contact_email}
                                onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(s.contact_email); alert('تم نسخ الإيميل: ' + s.contact_email) }}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                title={'إيميل: ' + s.contact_email}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="#3B82F6">
                                  <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/>
                                </svg>
                              </a>
                            )}
                            {s.website && (
                              <a href={s.website.startsWith('http') ? s.website : 'https://' + s.website}
                                target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '13px' }}
                                title={'الموقع: ' + s.website}>
                                🌐
                              </a>
                            )}
                            <button onClick={()=>toggleStatus(s.id,s.status)}
                              style={{fontSize:10,padding:'4px 8px',borderRadius:6,border:`1px solid rgba(255,255,255,0.15)`,background:'transparent',color:s.status==='active'?S.red:S.green,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>
                              {s.status==='active'?'إيقاف':'تفعيل'}
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                  {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${S.border}`, background: S.navy2 }}>
                    <div style={{ fontSize: '12px', color: S.muted }}>
                      عرض {(currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, filtered.length)} من {filtered.length} مورد
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '6px 14px', borderRadius: '7px', border: `1px solid ${S.border}`, background: 'transparent', color: currentPage === 1 ? S.muted : S.white, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                        → السابق
                      </button>
                      {Array.from({length:totalPages},(_,i)=>i+1)
                        .filter(p=>p===1||p===totalPages||Math.abs(p-currentPage)<=1)
                        .reduce<(number|string)[]>((acc,p,idx,arr)=>{
                          if(idx>0&&(p as number)-(arr[idx-1] as number)>1) acc.push('...')
                          acc.push(p); return acc
                        },[])
                        .map((p,idx)=>p==='...'?(
                          <span key={`d${idx}`} style={{color:S.muted,fontSize:12}}>...</span>
                        ):(
                          <button key={p} onClick={()=>setCurrentPage(p as number)}
                            style={{width:30,height:30,borderRadius:7,border:`1px solid ${currentPage===p?S.gold:S.border}`,background:currentPage===p?S.gold3:'transparent',color:currentPage===p?S.gold:S.muted,cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:currentPage===p?700:400}}>
                            {p}
                          </button>
                        ))
                      }
                      <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                        style={{padding:'6px 12px',borderRadius:7,border:`1px solid ${S.border}`,background:'transparent',color:currentPage===totalPages?S.muted:S.white,cursor:currentPage===totalPages?'not-allowed':'pointer',fontSize:12,fontFamily:'inherit'}}>
                        التالي →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Modal إضافة مورد ══ */}
      {showForm&&(
        <AddSupplierModal
          onClose={()=>setShowForm(false)}
          onSaved={fetchSuppliers}
          existingSuppliers={suppliers}
        />
      )}
    </div>
  )
}
