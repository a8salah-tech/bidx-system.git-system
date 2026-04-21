'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { PRODUCT_CATEGORIES, CURRENCIES, COUNTRIES, PRODUCT_UNITS } from '../components/options'

function getCountryLabel(val: string) {
  if (!val) return '—'
  const found = COUNTRIES.find(c =>
    c.id === val || c.value === val || c.label === val || c.label.includes(val)
  )
  return found?.label || val
}

const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#152A52',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.12)',goldB:'rgba(201,168,76,0.22)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.08)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.12)',
  red:'#EF4444',redB:'rgba(239,68,68,0.12)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.12)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.12)',
  card:'rgba(255,255,255,0.04)',card2:'rgba(255,255,255,0.08)',
}

const inp: React.CSSProperties = {
  width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
  padding:'11px 14px',borderRadius:'10px',color:'#fff',fontFamily:'Tajawal, sans-serif',
  outline:'none',cursor:'pointer',fontSize:'13px',direction:'rtl',textAlign:'right',boxSizing:'border-box',
}

// ════════════════════════════════════════════════
// Modal إضافة مورد لمنتج موجود
// ════════════════════════════════════════════════
function AddSupplierModal({
  productName, suppliers, currentUser, onClose, onAdded
}: {
  productName: string; suppliers: any[]; currentUser: any;
  onClose: () => void; onAdded: () => void;
}) {
  const [mode,       setMode]       = useState<'existing'|'new'>('existing')
  const [selSuppId,  setSelSuppId]  = useState('')
  const [saving,     setSaving]     = useState(false)
  const [newSupp, setNewSupp] = useState({
    company_name:'', country:'', city:'', phone:'', email:''
  })

  async function handleAdd() {
    if (!currentUser) return
    setSaving(true)
    try {
      let supplierId = selSuppId

      if (mode === 'new') {
        if (!newSupp.company_name) { alert('أدخل اسم الشركة'); return }
        // إنشاء مورد جديد
const { data: newSupData, error: supErr } = await supabase.from('suppliers').insert([{
  company_name: newSupp.company_name,
  country: newSupp.country,
  city: newSupp.city,
  contact_phone: newSupp.phone,   // ✅ هنا التعديل
  contact_email: newSupp.email,
  user_id: currentUser.id,
  status: 'active',
}]).select().single()
        if (supErr) { alert('خطأ: ' + supErr.message); return }
        supplierId = newSupData.id
      } else {
        if (!supplierId) { alert('اختر المورد'); return }
      }

      // FIX 4: نجيب id المنتج من جدول products
      const { data: prodData } = await supabase.from('products').select('id').eq('name', productName).single()
      const productId = prodData?.id || null

      // إضافة الربط في supplier_products
      const { error } = await supabase.from('supplier_products').insert([{
        supplier_id: supplierId,
        product_id: productId,
        name: productName,
        user_id: currentUser.id,
      }])
      if (error) { alert('خطأ: ' + error.message); return }
      onAdded()
      onClose()
      alert('✅ تم إضافة المورد للمنتج')
    } finally { setSaving(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(10px)',padding:16}}
      onClick={onClose}>
      <div style={{background:S.navy2,width:'100%',maxWidth:480,borderRadius:20,border:`1px solid ${S.goldB}`,direction:'rtl',overflow:'hidden'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{background:S.gold3,borderBottom:`1px solid ${S.goldB}`,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button onClick={onClose} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:14,fontWeight:800,color:S.gold2}}>➕ إضافة مورد للمنتج</div>
            <div style={{fontSize:11,color:S.muted,marginTop:2}}>📦 {productName}</div>
          </div>
        </div>
        <div style={{padding:22}}>
          {/* تبديل الوضع */}
          <div style={{display:'flex',background:S.card,borderRadius:10,overflow:'hidden',marginBottom:18}}>
            {[{k:'existing',l:'مورد موجود'},{k:'new',l:'مورد جديد'}].map(t=>(
              <button key={t.k} onClick={()=>setMode(t.k as any)}
                style={{flex:1,padding:'10px',border:'none',background:mode===t.k?S.gold:'transparent',color:mode===t.k?S.navy:S.muted,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif',transition:'all .15s'}}>
                {t.l}
              </button>
            ))}
          </div>

          {mode==='existing'?(
            <div>
              <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:8,textAlign:'right'}}>اختر المورد</label>
              <select value={selSuppId} onChange={e=>setSelSuppId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                <option value="" style={{background:S.navy2}}>اختر من القائمة...</option>
                {suppliers.map(s=>(
                  <option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name} — {s.country||'—'}</option>
                ))}
              </select>
              {suppliers.length===0&&<div style={{fontSize:11,color:S.amber,marginTop:8,textAlign:'right'}}>⚠️ لا يوجد موردين مضافين. اختر "مورد جديد".</div>}
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اسم الشركة *</label>
                <input value={newSupp.company_name} onChange={e=>setNewSupp(p=>({...p,company_name:e.target.value}))} style={inp} placeholder="اسم شركة المورد"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,marginBottom:6,textAlign:'right'}}>الدولة</label>
                  <select value={newSupp.country} onChange={e=>setNewSupp(p=>({...p,country:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="" style={{background:S.navy2}}>اختر...</option>
                    {COUNTRIES.map(c=><option key={c.id} value={c.label} style={{background:S.navy2}}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,marginBottom:6,textAlign:'right'}}>المدينة</label>
                  <input value={newSupp.city} onChange={e=>setNewSupp(p=>({...p,city:e.target.value}))} style={inp} placeholder="المدينة"/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,marginBottom:6,textAlign:'right'}}>الهاتف</label>
                  <input value={newSupp.phone} onChange={e=>setNewSupp(p=>({...p,phone:e.target.value}))} style={inp} placeholder="+966..."/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.muted,marginBottom:6,textAlign:'right'}}>الإيميل</label>
                  <input value={newSupp.email} onChange={e=>setNewSupp(p=>({...p,email:e.target.value}))} style={inp} placeholder="email@..."/>
                </div>
              </div>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:18}}>
            <button onClick={onClose} style={{background:'transparent',color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
            <button onClick={handleAdd} disabled={saving}
              style={{background:saving?S.muted:`linear-gradient(135deg,${S.gold},${S.gold2})`,color:S.navy,border:'none',padding:11,borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
              {saving?'⏳ جاري الحفظ...':'✅ إضافة المورد'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════
export default function ProductsPage() {
  const router = useRouter()

  const [suppliers,        setSuppliers]        = useState<any[]>([])
  const [products,         setProducts]         = useState<any[]>([])
  const [allProducts,      setAllProducts]      = useState<any[]>([]) // FIX 4: جدول products
  const [loading,          setLoading]          = useState(true)
  const [search,           setSearch]           = useState('')
  const [selectedProduct,  setSelectedProduct]  = useState<string|null>(null)
  const [filterCountry,    setFilterCountry]    = useState('')
  const [viewMode,         setViewMode]         = useState<'table'|'cards'>('table')
  const [statusFilter,     setStatusFilter]     = useState('active')  // active | stopped
  const [currentUser,      setCurrentUser]      = useState<any>(null)
  const [saving,           setSaving]           = useState(false)
  const [showAddProduct,   setShowAddProduct]   = useState(false)
  const [addSupplierFor,   setAddSupplierFor]   = useState<string|null>(null) // FIX 1
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20
  const [newProduct, setNewProduct] = useState({
    name:'',category:'',price:'',currency:'',unit:'',
    stock_quantity:'',moq:'',description:'',certifications:'',
    supplier_id:'',origin_country:'',market_country:'',
  })

  // ── تحميل البيانات ──
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setCurrentUser(user)

    // الموردين
// 🚀 نحن هنا نخبر النظام: اجلب contact_email وسمِّه email مؤقتاً ليرتاح الكود
const { data: suppData, error: suppError } = await supabase
  .from('suppliers')
  .select(`
    id, 
    company_name, 
    country, 
    city, 
    status, 
    rating, 
    main_products, 
    contact_email,
    email:contact_email, 
    user_id
  `) 
  .eq('user_id', user.id);

    // FIX 4: جلب من جدول products أولاً
    const { data: prodsMaster } = await supabase.from('products')
      .select('id,name,description,status,category,created_at,origin_country,market_country')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // FIX 4 + 2: جلب supplier_products مع product_id
    const { data: spData } = await supabase.from('supplier_products')
      .select('*').eq('user_id', user.id)

    setSuppliers(suppData || [])
    setAllProducts(prodsMaster || [])

    const mergedProducts = (spData || []).map(sp => {
  const master = (prodsMaster || []).find(p =>
    (sp.product_id && p.id === sp.product_id) ||
    p.name?.trim().toLowerCase() === sp.name?.trim().toLowerCase()
  )

  if (!master) return sp

  return {
    ...sp,

    // 🔥 أهم تعديل
    name: master.name || sp.name,

    // 🔥 خلي master هو الأساس
    category:       master.category       ?? sp.category,
    origin_country: master.origin_country ?? sp.origin_country,
    market_country: master.market_country ?? sp.market_country,

    // اختياري مهم
    description: master.description ?? sp.notes,
    status:      master.status      ?? sp.status,
  }
})

setProducts(mergedProducts)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── إضافة منتج (FIX 2+4) ──
  async function handleAddProduct() {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('يجب تسجيل الدخول'); return }
      if (!newProduct.name || !newProduct.category) { alert('يرجى إدخال اسم المنتج والفئة'); return }

      // FIX 4: إضافة في جدول products أولاً
      const { data: pData, error: pErr } = await supabase.from('products').insert([{
        name: newProduct.name,
        category: newProduct.category,
        description: newProduct.description || null,
        certifications: newProduct.certifications || null,
        origin_country: newProduct.origin_country || null,
        market_country: newProduct.market_country || null,
        min_order: newProduct.moq || null,
        price_range: newProduct.price || null,
        stock_quantity: newProduct.stock_quantity || null,
        currency: newProduct.currency || null,
        unit: newProduct.unit || null,
        user_id: user.id,
        status: 'active',
      }]).select().single()

      if (pErr) { alert('خطأ products: ' + pErr.message); return }

      // إضافة في supplier_products مع product_id
      const { error: spErr } = await supabase.from('supplier_products').insert([{
        name: newProduct.name,
        product_id: pData.id, // FIX 2: الربط بالـ id
        supplier_id: newProduct.supplier_id || null,
        user_id: user.id,
        category: newProduct.category,
        min_order: newProduct.moq || null,
        price_range: newProduct.price || null,
        certifications: newProduct.certifications || null,
        notes: newProduct.description || null,
        origin_country: newProduct.origin_country || null,
        market_country: newProduct.market_country || null,
        stock_quantity: newProduct.stock_quantity || null,
        status: 'active',
      }])

      if (spErr) { alert('خطأ supplier_products: ' + spErr.message); return }

      alert('✅ تم إضافة المنتج')
      setShowAddProduct(false)
      setNewProduct({ name:'',category:'',price:'',currency:'',unit:'',stock_quantity:'',moq:'',description:'',certifications:'',supplier_id:'',origin_country:'',market_country:'' })
      await fetchAll()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  // FIX 6: إيقاف/تفعيل منتج
  async function toggleProductStatus(productName: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'stopped' : 'active'
    const sp = products.filter(p => (p.name||'').trim() === productName)
    for (const p of sp) {
      await supabase.from('supplier_products').update({ status: newStatus }).eq('id', p.id)
    }
    // تحديث في products أيضاً
    await supabase.from('products').update({ status: newStatus }).eq('name', productName).eq('user_id', currentUser?.id)
    await fetchAll()
  }

  const exportToExcel = () => {
    if (sortedProducts.length === 0) return alert('لا توجد بيانات للتصدير')
    const ws = XLSX.utils.json_to_sheet(sortedProducts.map(([name, sups]) => ({
      'المنتج': name,
      'عدد الموردين': sups.length,
      'بلد المنشأ': getCountryLabel((sups[0] as any)?.origin_country),
      'سوق البيع': getCountryLabel((sups[0] as any)?.market_country),
      'الحالة': (sups[0] as any)?.status === 'stopped' ? 'موقوف' : 'نشط',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'المنتجات')
    XLSX.writeFile(wb, `Products_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ── بناء خريطة المنتجات ──
  const productMap: Record<string, any[]> = {}
  const productStatusMap: Record<string, string> = {} // FIX 5+6

  // من supplier_products
  products.forEach(p => {
    const name = (p.name || '').trim()
    if (!name) return
    if (!productMap[name]) productMap[name] = []
    const sup = suppliers.find(s => s.id === p.supplier_id)
    productMap[name].push({
      ...p, supplier_id: p.supplier_id, name,
      category: p.category || 'غير محدد',
      country: sup?.country || '—',
      origin_country: p.origin_country || sup?.country || '',
      market_country: p.market_country || '',
      rating: sup?.rating || 0,
      company_name: sup?.company_name || '—',
      city: sup?.city || '',
      status: p.status || 'active',
    })
    // أخذ حالة المنتج (نشط/موقوف)
    if (!productStatusMap[name]) productStatusMap[name] = p.status || 'active'
    if (p.status === 'stopped') productStatusMap[name] = 'stopped'
  })

  // من main_products في الموردين
  suppliers.forEach(s => {
    if (!s.main_products) return
    s.main_products.split(/[،,\n\r]/).forEach((prod: string) => {
      const name = prod.trim()
      if (!name) return
      if (!productMap[name]) productMap[name] = []
      if (productMap[name].some(p => p.supplier_id === s.id)) return
      productMap[name].push({
        supplier_id: s.id, name, category: 'غير محدد',
        country: s.country || '—',
        origin_country: s.country || '', market_country: '',
        rating: s.rating || 0, company_name: s.company_name || '—', city: s.city || '',
        status: 'active',
      })
    })
  })

  // FIX 5: فلتر الحالة — "نشط" أو "موقف"
  const sortedProducts = Object.entries(productMap)
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([name]) => {
      const st = productStatusMap[name] || 'active'
      if (statusFilter === 'active')  return st !== 'stopped'
      if (statusFilter === 'stopped') return st === 'stopped'
      return true
    })
    .filter(([name]) => name.includes(search) || search === '')
    .filter(([, sups]) => filterCountry ? sups.some(s => s.country === filterCountry) : true)

  const totalProducts  = Object.keys(productMap).length
  const activeCount    = Object.entries(productStatusMap).filter(([,v]) => v !== 'stopped').length
  const stoppedCount   = Object.entries(productStatusMap).filter(([,v]) => v === 'stopped').length
  const totalSuppliers = suppliers.length
  const mostPopular    = sortedProducts[0]
  const totalPagesCount = Math.ceil(sortedProducts.length / PAGE_SIZE)
  const pagedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal,sans-serif',direction:'rtl'}}>

      {/* ══ شريط الأدوات ══ */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>setShowAddProduct(true)}
            style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            + إضافة منتج
          </button>
          <button onClick={exportToExcel}
            style={{background:'rgba(232,201,122,0.1)',color:S.gold2,border:`1px solid ${S.gold}`,padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            📤 تصدير Excel
          </button>
        </div>
        {/* إحصاء سريع */}
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <span style={{fontSize:12,color:S.muted}}>{totalProducts} منتج</span>
          <span style={{fontSize:12,color:S.green}}>● {activeCount} نشط</span>
          {stoppedCount>0&&<span style={{fontSize:12,color:S.red}}>● {stoppedCount} موقوف</span>}
        </div>
      </div>

      {/* ══ Modal إضافة منتج ══ */}
      {showAddProduct && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px',backdropFilter:'blur(8px)'}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:'680px',borderRadius:'20px',border:`1px solid ${S.border}`,padding:'28px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.6)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
              <button onClick={()=>setShowAddProduct(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div>
                <h3 style={{fontSize:'18px',color:S.gold,margin:0}}>➕ إضافة منتج جديد</h3>
                <p style={{fontSize:'11px',color:S.muted,margin:'4px 0 0',textAlign:'right'}}>يُضاف تلقائياً في جدول products وsupplier_products</p>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>
              {/* اسم + فئة */}
              <div style={{gridColumn:'span 2',display:'flex',gap:'14px'}}>
                <div style={{flex:2}}>
                  <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',fontWeight:600,textAlign:'right'}}>اسم المنتج *</label>
                  <input placeholder="مثال: Refined Palm Olein Oil" style={inp} onChange={e=>setNewProduct({...newProduct,name:e.target.value})} value={newProduct.name}/>
                </div>
                <div style={{flex:1.2}}>
                  <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',fontWeight:600,textAlign:'right'}}>الفئة *</label>
                  <select style={inp} onChange={e=>setNewProduct({...newProduct,category:e.target.value})}>
                    <option value="" style={{background:S.navy2}}>اختر...</option>
                    {PRODUCT_CATEGORIES.map(c=><option key={c.id} value={c.label} style={{background:S.navy2}}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              {/* المورد */}
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',fontWeight:600,textAlign:'right'}}>المورد (اختياري)</label>
                <select style={inp} onChange={e=>setNewProduct({...newProduct,supplier_id:e.target.value})}>
                  <option value="" style={{background:S.navy2}}>بدون مورد الآن</option>
                  {suppliers.map(s=><option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name} — {s.country||'—'}</option>)}
                </select>
              </div>
              {/* السعر + العملة */}
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>السعر المرجعي</label>
                <div style={{display:'flex',gap:'6px'}}>
                  <input type="text" placeholder="مثال: 980-1050" style={{...inp,flex:2}} onChange={e=>setNewProduct({...newProduct,price:e.target.value})}/>
                  <select style={{...inp,flex:1,cursor:'pointer'}} onChange={e=>setNewProduct({...newProduct,currency:e.target.value})}>
                    <option value="" style={{background:S.navy2}}>عملة</option>
                    {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{c.id}</option>)}
                  </select>
                </div>
              </div>
              {/* الوحدة */}
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>وحدة القياس</label>
                <select style={inp} onChange={e=>setNewProduct({...newProduct,unit:e.target.value})}>
                  <option value="" style={{background:S.navy2}}>اختر الوحدة...</option>
                  {PRODUCT_UNITS.map(u=><option key={u.id} value={u.value} style={{background:S.navy2}}>{u.label}</option>)}
                </select>
              </div>
              {/* الكمية + MOQ */}
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>الكمية المتاحة</label>
                <input type="text" placeholder="مثال: 500 MT" style={inp} onChange={e=>setNewProduct({...newProduct,stock_quantity:e.target.value})}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>أقل كمية (MOQ)</label>
                <input placeholder="مثال: 1 × 40FT" style={inp} onChange={e=>setNewProduct({...newProduct,moq:e.target.value})}/>
              </div>
              {/* دولة المنشأ + سوق البيع */}
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>دولة المنشأ</label>
                <select style={inp} onChange={e=>setNewProduct({...newProduct,origin_country:e.target.value})}>
                  <option value="" style={{background:S.navy2}}>اختر...</option>
                  {COUNTRIES.map(c=><option key={c.id} value={c.label} style={{background:S.navy2}}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>السوق المستهدف</label>
                <select style={inp} onChange={e=>setNewProduct({...newProduct,market_country:e.target.value})}>
                  <option value="" style={{background:S.navy2}}>اختر...</option>
                  {COUNTRIES.map(c=><option key={c.id} value={c.label} style={{background:S.navy2}}>{c.label}</option>)}
                </select>
              </div>
              {/* الشهادات */}
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>الشهادات والاعتمادات</label>
                <input placeholder="ISO، HACCP، Halal، ..." style={inp} onChange={e=>setNewProduct({...newProduct,certifications:e.target.value})}/>
              </div>
              {/* الوصف */}
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:'11px',color:S.muted,marginBottom:'7px',textAlign:'right'}}>وصف المنتج</label>
                <textarea rows={3} placeholder="تفاصيل المنتج التي تهم المشتري..."
                  style={{...inp,resize:'none',lineHeight:'1.6'} as React.CSSProperties}
                  onChange={e=>setNewProduct({...newProduct,description:e.target.value})}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'14px',marginTop:'24px'}}>
              <button onClick={handleAddProduct} disabled={saving}
                style={{flex:2,background:saving?'#666':S.gold,color:S.navy,padding:'13px',borderRadius:'12px',fontWeight:800,border:'none',cursor:'pointer',fontSize:'14px',fontFamily:'inherit'}}>
                {saving?'جاري الحفظ...':'✅ إضافة المنتج'}
              </button>
              <button onClick={()=>setShowAddProduct(false)}
                style={{flex:1,background:'transparent',color:S.white,padding:'12px',borderRadius:'8px',border:`1px solid ${S.border}`,cursor:'pointer',fontFamily:'inherit'}}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal إضافة مورد للمنتج (FIX 1) ══ */}
      {addSupplierFor && (
        <AddSupplierModal
          productName={addSupplierFor} suppliers={suppliers}
          currentUser={currentUser}
          onClose={()=>setAddSupplierFor(null)}
          onAdded={()=>{fetchAll();setAddSupplierFor(null)}}
        />
      )}

      {/* ══ المحتوى الرئيسي ══ */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

        {/* الإحصائيات */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[
            {label:'إجمالي المنتجات',    val:totalProducts,   color:S.gold},
            {label:'المنتجات النشطة',    val:activeCount,     color:S.green},
            {label:'الموردين',           val:totalSuppliers,  color:S.blue},
            {label:'أكثر منتج تكراراً', val:mostPopular?mostPopular[0]:'—', color:S.amber, small:true},
            {label:'المنتجات الموقوفة',  val:stoppedCount,   color:S.red},
          ].map((s,i)=>(
            <div key={i} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'12px',padding:'14px 16px',textAlign:'right'}}>
              <div style={{fontSize:s.small?'13px':'24px',fontWeight:700,color:s.color,marginBottom:'4px'}}>{s.val}</div>
              <div style={{fontSize:'10px',color:S.muted}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* البحث والفلاتر */}
        <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap',alignItems:'center'}}>
          <input type="text" placeholder="🔍 ابحث عن منتج..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{flex:1,minWidth:'200px',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'10px',padding:'10px 16px',fontSize:'13px',color:S.white,outline:'none',fontFamily:'inherit',textAlign:'right',boxSizing:'border-box' as any}}/>

          <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}
            style={{background:S.navy2,color:filterCountry?S.white:S.muted,border:`1px solid ${S.border}`,borderRadius:'10px',padding:'10px 14px',fontSize:'12px',outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
            <option value="">كل الدول</option>
            {[...new Set(suppliers.map(s=>s.country).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          <button onClick={()=>setViewMode(viewMode==='table'?'cards':'table')}
            style={{background:S.navy2,color:S.muted,border:`1px solid ${S.border}`,padding:'10px 14px',borderRadius:'10px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>
            {viewMode==='table'?'⊞ بطاقات':'☰ جدول'}
          </button>

          {/* FIX 5: فلتر الحالة */}
          <div style={{display:'flex',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'10px',overflow:'hidden'}}>
            {[
              {key:'active',  label:'نشط',   color:S.green},
              {key:'stopped', label:'موقف',   color:S.red},   // FIX 5: بدل "الكل"
              {key:'all',     label:'الكل',   color:S.muted},
            ].map(t=>(
              <button key={t.key} onClick={()=>setStatusFilter(t.key)}
                style={{padding:'9px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'none',background:statusFilter===t.key?`${t.color}22`:'transparent',color:statusFilter===t.key?t.color:S.muted,transition:'all 0.15s'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',color:S.muted,padding:'80px 0'}}>
            <div style={{fontSize:36,marginBottom:12}}>⏳</div>جاري التحميل...
          </div>
        ) : sortedProducts.length === 0 ? (
          <div style={{textAlign:'center',color:S.muted,padding:'80px 0'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>📦</div>
            <div style={{fontSize:'16px',fontWeight:700,color:S.white}}>لا يوجد منتجات</div>
            <div style={{fontSize:'14px',marginTop:'8px'}}>ابدأ بإضافة أول منتج</div>
          </div>
        ) : (
          <div style={{display:'flex',gap:'16px',alignItems:'flex-start'}}>

            {/* ── الجدول ── */}
            {viewMode==='table'&&(
              <div style={{flex:selectedProduct?'0 0 56%':'1',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:'14px',overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${S.border}`}}>
                      {['#','المنتج','الموردين','المنشأ','السوق','التوزيع','التقييم','الحالة','إجراء'].map(h=>(
                        <th key={h} style={{padding:'11px 14px',textAlign:'right',fontSize:'10px',color:S.muted,fontWeight:700,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    
                    {pagedProducts.map(([name, sups], i) => {
                      const safeSups = Array.isArray(sups) ? sups : []
                      const count    = safeSups.length
                      const avgRating = count > 0 ? (safeSups.reduce((a,s)=>a+(s.rating||0),0)/count).toFixed(1) : 0
                      const allCountries = [...new Set(safeSups.map(s=>getCountryLabel(s.origin_country)).filter(c=>c!=='—'))]
                      const isSelected   = selectedProduct === name
                      const totalSups    = suppliers.length || 1
                      const firstSup     = safeSups[0] || {}
                      const pStatus      = productStatusMap[name] || 'active'
                      const isStopped    = pStatus === 'stopped'

                      return (
                        <tr key={name} onClick={()=>setSelectedProduct(isSelected?null:name)}
                          style={{borderTop:`1px solid rgba(255,255,255,0.05)`,background:isSelected?`rgba(201,168,76,0.08)`:isStopped?'rgba(239,68,68,0.04)':i%2===0?'transparent':'rgba(255,255,255,0.02)',cursor:'pointer',height:'48px',direction:'rtl',opacity:isStopped?0.65:1}}>

                          <td style={{padding:'10px 14px',fontSize:'11px',color:S.muted,textAlign:'center',width:'40px'}}>{i+1}</td>

                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                              <span onClick={e=>{e.stopPropagation();router.push(`/products/${encodeURIComponent(name)}`)}}
                                style={{fontSize:'13px',fontWeight:600,color:'#FFFFFF',cursor:'pointer',textDecoration:'none'}}>
                                📦 {name}
                              </span>
                              {i===0&&<span style={{fontSize:'8px',padding:'2px 6px',borderRadius:'8px',background:'rgba(201,168,76,0.12)',color:S.gold,fontWeight:700}}>الأكثر</span>}
                            </div>
                            {firstSup.category&&firstSup.category!=='غير محدد'&&<div style={{fontSize:'10px',color:S.muted,marginTop:2}}>{firstSup.category}</div>}
                          </td>

                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <span style={{fontSize:'14px',fontWeight:700,color:S.gold}}>{safeSups.filter((s:any)=>s.supplier_id).length}</span>
                            <span style={{fontSize:'10px',color:S.muted,marginRight:'3px'}}>مورد</span>
                          </td>

                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:'11px',color:S.white}}>
                            {firstSup.origin_country?getCountryLabel(firstSup.origin_country):'—'}
                          </td>

                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <span style={{fontSize:'10px',color:S.gold,background:'rgba(201,168,76,0.1)',padding:'2px 7px',borderRadius:'6px'}}>
                              🛒 {firstSup.market_country?getCountryLabel(firstSup.market_country):'—'}
                            </span>
                          </td>

                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                              <span style={{fontSize:'9px',color:S.muted}}>{((count/totalSups)*100).toFixed(0)}%</span>
                              <div style={{width:'50px',height:'4px',background:S.border,borderRadius:'2px',overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${(count/totalSups)*100}%`,background:i===0?S.gold:i===1?S.green:S.blue}}/>
                              </div>
                            </div>
                          </td>

                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
                              {[1,2,3,4,5].map(j=>(
                                <svg key={j} width="9" height="9" viewBox="0 0 16 16" style={{fill:j<=Math.round(Number(avgRating)/2)?S.gold:'rgba(201,168,76,0.2)'}}>
                                  <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                                </svg>
                              ))}
                              <span style={{fontSize:'9px',color:S.muted,marginRight:'3px'}}>{avgRating}</span>
                            </div>
                          </td>

                          {/* FIX 6: عمود الحالة */}
                          <td style={{padding:'10px 14px',textAlign:'right'}}>
                            <span style={{fontSize:'10px',padding:'3px 9px',borderRadius:20,fontWeight:700,
                              background:isStopped?S.redB:S.greenB,color:isStopped?S.red:S.green,
                              border:`1px solid ${isStopped?S.red+'40':S.green+'40'}`}}>
                              {isStopped?'موقوف':'نشط'}
                            </span>
                          </td>

                          {/* FIX 6: زر الإيقاف/التفعيل */}
                          <td style={{padding:'10px 14px',textAlign:'right'}} onClick={e=>e.stopPropagation()}>
                            <button
                              onClick={()=>toggleProductStatus(name, pStatus)}
                              title={isStopped?'تفعيل المنتج':'إيقاف المنتج'}
                              style={{background:isStopped?S.greenB:S.redB,border:`1px solid ${isStopped?S.green+'40':S.red+'40'}`,color:isStopped?S.green:S.red,padding:'4px 10px',borderRadius:7,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif',fontWeight:700}}>
                              {isStopped?'▶ تفعيل':'⏸ إيقاف'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {totalPagesCount > 1 && (
  <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', gap: 8, marginTop: 14 }}>
    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
      style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${S.border}`, background:'transparent', color:currentPage===1?S.muted:S.white, cursor:currentPage===1?'not-allowed':'pointer', fontSize:12, fontFamily:'inherit' }}>
      → السابقة
    </button>
    <span style={{ fontSize:12, color:S.muted }}>
      {currentPage} / {totalPagesCount} — {sortedProducts.length} منتج
    </span>
    <button onClick={() => setCurrentPage(p => Math.min(totalPagesCount, p+1))} disabled={currentPage === totalPagesCount}
      style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${S.border}`, background:'transparent', color:currentPage===totalPagesCount?S.muted:S.white, cursor:currentPage===totalPagesCount?'not-allowed':'pointer', fontSize:12, fontFamily:'inherit' }}>
      ← التالية
    </button>
  </div>
)}
              </div>
              
            )}

            {/* ── البطاقات ── */}
            {viewMode==='cards'&&(
              <div style={{flex:selectedProduct?'0 0 55%':'1',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'}}>
                {sortedProducts.map(([name, sups], i) => {
                  const avgRating  = sups.length>0?(sups.reduce((a,s)=>a+(s.rating||0),0)/sups.length).toFixed(1):0
                  const isSelected = selectedProduct===name
                  const pStatus    = productStatusMap[name]||'active'
                  const isStopped  = pStatus==='stopped'
                  return (
                    <div key={name} onClick={()=>setSelectedProduct(isSelected?null:name)}
                      style={{background:isSelected?S.navy3:S.navy2,border:`1px solid ${isSelected?S.gold:isStopped?S.red+'40':S.border}`,borderRadius:'12px',padding:'14px',cursor:'pointer',textAlign:'right',opacity:isStopped?0.65:1,position:'relative'}}>
                      {isStopped&&<div style={{position:'absolute',top:8,left:8,fontSize:9,background:S.redB,color:S.red,padding:'2px 6px',borderRadius:10,fontWeight:700}}>موقوف</div>}
                      <div style={{fontSize:'18px',marginBottom:'8px'}}>📦</div>
                      <div style={{fontSize:'13px',fontWeight:700,marginBottom:'4px'}}>{name}</div>
                      {i===0&&<span style={{fontSize:'9px',padding:'2px 6px',borderRadius:'8px',background:'rgba(201,168,76,0.12)',color:S.gold,fontWeight:700}}>الأكثر</span>}
                      <div style={{marginTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:'10px',color:S.muted}}>{avgRating} ⭐</span>
                        <span style={{fontSize:'12px',fontWeight:700,color:S.gold}}>{sups.length} مورد</span>
                      </div>
                    </div>
                    
                  )
                })}
              </div>
            )}

            {/* ══ لوحة تفاصيل المنتج (FIX 1: + إضافة مورد) ══ */}
            {selectedProduct && productMap[selectedProduct] && (
              <div style={{flex:'0 0 42%',background:S.navy2,border:`1px solid ${S.gold}`,borderRadius:'14px',padding:'18px',position:'sticky',top:0,maxHeight:'calc(100vh - 200px)',overflowY:'auto'}}>
                {/* هيدر */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                  <button onClick={()=>setSelectedProduct(null)} style={{background:'none',border:'none',color:S.muted,cursor:'pointer',fontSize:'16px'}}>✕</button>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'15px',fontWeight:700}}>📦 {selectedProduct}</div>
                    <div style={{fontSize:'10px',color:S.muted,marginTop:'2px'}}>{productMap[selectedProduct].length} مورد</div>
                  </div>
                </div>

                {/* إحصاء */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
                  {[
                    {label:'من الموردين',  val:((productMap[selectedProduct].length/totalSuppliers)*100).toFixed(0)+'%', color:S.gold},
                    {label:'متوسط التقييم',val:(productMap[selectedProduct].reduce((a,s)=>a+(s.rating||0),0)/productMap[selectedProduct].length).toFixed(1), color:S.green},
                    {label:'الدول',        val:[...new Set(productMap[selectedProduct].map(s=>s.country).filter(Boolean))].length, color:S.blue},
                  ].map((st,i)=>(
                    <div key={i} style={{background:S.card,borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:'18px',fontWeight:700,color:st.color}}>{st.val}</div>
                      <div style={{fontSize:'9px',color:S.muted,marginTop:'3px'}}>{st.label}</div>
                    </div>
                  ))}
                </div>

                {/* أزرار الإجراءات */}
                <div style={{display:'flex',gap:8,marginBottom:14}}>
                  <button onClick={e=>{e.stopPropagation();router.push(`/products/${encodeURIComponent(selectedProduct)}`)}}
                    style={{flex:1,background:S.gold3,border:`1px solid ${S.goldB}`,color:S.gold2,padding:'8px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    📋 تفاصيل كاملة
                  </button>
                  {/* FIX 1: زر إضافة مورد */}
                  <button onClick={e=>{e.stopPropagation();setAddSupplierFor(selectedProduct)}}
                    style={{flex:1,background:S.greenB,border:`1px solid ${S.green}40`,color:S.green,padding:'8px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                    ➕ إضافة مورد
                  </button>
                </div>

                {/* قائمة الموردين */}
                <div style={{fontSize:'11px',fontWeight:700,color:S.muted,marginBottom:'8px',textAlign:'right'}}>الموردين المرتبطون</div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {productMap[selectedProduct].map((s,idx)=>{
                    const supInfo = suppliers.find(sup=>sup.id===s.supplier_id)||s
                    return(
                      <div key={idx} onClick={()=>s.supplier_id&&router.push(`/suppliers/${s.supplier_id}`)}
                        style={{background:S.card2,borderRadius:'10px',padding:'12px',cursor:s.supplier_id?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'background .15s'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <div style={{display:'flex',gap:'2px'}}>
                            {[1,2,3,4,5].map(j=>(
                              <svg key={j} width="9" height="9" viewBox="0 0 16 16" style={{fill:j<=Math.round((s.rating||0)/2)?S.gold:'rgba(201,168,76,0.2)'}}>
                                <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                              </svg>
                            ))}
                          </div>
                          <span style={{fontSize:'9px',color:S.muted}}>{s.rating||0}/10</span>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:'13px',fontWeight:700}}>{supInfo.company_name||s.company_name}</div>
                          <div style={{fontSize:'10px',color:S.muted}}>
                            {supInfo.country||'—'}{supInfo.city?` / ${supInfo.city}`:''}
                            {s.origin_country&&<span style={{color:S.gold,marginRight:'6px'}}> · 🌍 {getCountryLabel(s.origin_country)}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* FIX 1: زر + إضافة مورد في أسفل القائمة */}
                  <button onClick={()=>setAddSupplierFor(selectedProduct)}
                    style={{width:'100%',background:'transparent',border:`1px dashed ${S.gold}50`,color:S.gold,padding:'10px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    ➕ إضافة مورد جديد لهذا المنتج
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}