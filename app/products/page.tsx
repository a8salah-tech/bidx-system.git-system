'use client'

// ===== الاستيرادات =====
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import {
  PRODUCT_CATEGORIES,
  CURRENCIES,
  COUNTRIES,
  PRODUCT_UNITS,
} from '../components/options'

// ===== تحويل كود الدولة أو قيمتها لاسمها الكامل =====
function getCountryLabel(val: string) {
  if (!val) return '—'
  const found = COUNTRIES.find(c =>
    c.id === val ||
    c.value === val ||
    c.label === val ||
    c.label.includes(val) ||
    val.includes(c.value)
  )
  return found?.label || val
}

// ===== الألوان =====
const S = {
  navy: '#0A1628', navy2: '#0F2040', navy3: '#152A52',
  gold: '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green: '#22C55E', red: '#EF4444', blue: '#3B82F6', amber: '#F59E0B',
  card: 'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.08)',
}

// ===== style مشترك للـ select والـ input =====
const fieldStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '12px',
  borderRadius: '10px',
  color: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
  fontSize: '14px',
}

export default function ProductsPage() {
  const router = useRouter()

  // ===== الـ State =====
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [statusFilter, setStatusFilter] = useState('active')
  const [products, setProducts] = useState<any[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    currency: '',
    unit: '',
    stock_quantity: '',
    moq: '',
    description: '',
    certifications: '',
    supplier_id: '',
    origin_country: '',
    market_country: '',
  })

  // ===== تحميل البيانات =====
useEffect(() => {
  async function fetchData() {
    setLoading(true)
    
    // 1. جلب بيانات المستخدم الحالي
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return; // حماية إضافية

    // 2. جلب الموردين الخاصين بالمستخدم فقط
    let query = supabase
      .from('suppliers')
      .select('id,company_name,main_products,rating,country,city,status')
      .eq('user_id', user.id) // ⬅️ الإضافة هنا

    if (statusFilter === 'active') {
      query = query.eq('status', 'active')
    }

    const { data: suppliersData } = await query
    
    // 3. جلب المنتجات الخاصة بالمستخدم فقط
    const { data: productsData } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('user_id', user.id) // ⬅️ الإضافة هنا

    setSuppliers(suppliersData || [])
    setProducts(productsData || [])
    setLoading(false)
  }
  fetchData()
}, [statusFilter])

  // ===== جلب المنتجات فقط =====
const fetchProducts = async () => {
  const { data: { user } } = await supabase.auth.getUser() // ⬅️ جلب المستخدم أولاً
  if (!user) return

  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('user_id', user.id) // ⬅️ الإضافة هنا لضمان الخصوصية
    
  if (!error) setProducts(data || [])
}

  // ===== إضافة منتج — مع حفظ origin_country و market_country =====
  const handleAddProduct = async () => {
    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('يجب تسجيل الدخول'); return }
      if (!newProduct.name || !newProduct.category) { alert('يرجى إدخال اسم المنتج والفئة'); return }

      const { error } = await supabase.from('supplier_products').insert([{
        supplier_id: newProduct.supplier_id || null,
        user_id: user.id,
        name: newProduct.name,
        category: newProduct.category,
        min_order: newProduct.moq,
        price_range: newProduct.price,
        certifications: newProduct.certifications,
        notes: newProduct.description,
        origin_country: newProduct.origin_country,   // ✅ يُحفظ الآن
        market_country: newProduct.market_country,   // ✅ يُحفظ الآن
      }])

      if (error) { alert(error.message); return }

      alert('تم إضافة المنتج بنجاح ✅')
      setShowAddProduct(false)
      setNewProduct({
        name: '', category: '', price: '', currency: '', unit: '',
        stock_quantity: '', moq: '', description: '', certifications: '',
        supplier_id: '', origin_country: '', market_country: '',
      })
      await fetchProducts()

    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ===== دالة التصدير =====
  const exportToExcel = () => {
    if (sortedProducts.length === 0) return alert('لا توجد بيانات للتصدير')
    const worksheet = XLSX.utils.json_to_sheet(
      sortedProducts.map(([name, sups]) => ({
        'المنتج': name,
        'عدد الموردين': sups.length,
        'بلد المنشأ': getCountryLabel((sups[0] as any)?.origin_country),
        'سوق البيع': getCountryLabel((sups[0] as any)?.market_country),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات')
    XLSX.writeFile(workbook, `Products_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ===== بناء خريطة المنتجات =====
  const productMap: Record<string, any[]> = {}

  // من جدول supplier_products
  products.forEach((p) => {
    const name = (p.name || '').trim()
    if (!name) return
    if (!productMap[name]) productMap[name] = []
    const sup = suppliers.find(s => s.id === p.supplier_id)
    productMap[name].push({
      supplier_id: p.supplier_id,
      name,
      category: p.category || 'غير محدد',
      country: sup?.country || 'غير معروف',
      // origin_country: نستخدم القيمة المحفوظة في الجدول أولاً
      origin_country: p.origin_country || sup?.country || '',
      market_country: p.market_country || '',
      rating: sup?.rating || 0,
      company_name: sup?.company_name || '—',
      city: sup?.city || '',
    })
  })

  // من main_products في جدول الموردين
  suppliers.forEach((s) => {
    if (!s.main_products) return
    s.main_products.split('،').forEach((product: string) => {
      const name = product.trim()
      if (!name) return
      if (!productMap[name]) productMap[name] = []
      // تجنب التكرار — لو المنتج موجود بالفعل من supplier_products لنفس المورد لا تضيفه
      const alreadyExists = productMap[name].some(p => p.supplier_id === s.id)
      if (alreadyExists) return
      productMap[name].push({
        supplier_id: s.id,
        name,
        category: 'غير محدد',
        country: s.country || 'غير معروف',
        origin_country: s.country || '',
        market_country: '',
        rating: s.rating || 0,
        company_name: s.company_name || '—',
        city: s.city || '',
      })
    })
  })

  // ===== ترتيب وفلترة =====
  const sortedProducts = Object.entries(productMap)
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([name]) => name.includes(search) || search === '')
    .filter(([, sups]) => filterCountry ? sups.some(s => s.country === filterCountry) : true)

  const totalProducts = Object.keys(productMap).length
  const totalSuppliers = suppliers.length
  const mostPopular = sortedProducts[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl' }}>

      {/* شريط الأدوات */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddProduct(true)}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + إضافة منتج
          </button>
          <button onClick={exportToExcel}
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📤 تصدير
          </button>
        </div>
      </div>

      {/* Modal إضافة منتج */}
      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: '650px', borderRadius: '20px', border: `1px solid ${S.border}`, padding: '30px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ fontSize: '20px', color: S.gold, marginBottom: '8px' }}>إضافة منتج جديد</h3>
              <p style={{ fontSize: '12px', color: S.muted }}>أدخل تفاصيل المنتج بدقة</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* اسم المنتج + الفئة */}
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px', fontWeight: 600 }}>اسم المنتج التجاري *</label>
                  <input
                    placeholder="مثال: فحم جوز هند طبيعي"
                    style={fieldStyle}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1.2 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px', fontWeight: 600 }}>فئة المنتج *</label>
                  <select style={fieldStyle} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                    <option value="" style={{ background: S.navy2 }}>اختر الفئة...</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.label} style={{ background: S.navy2 }}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* المورد */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px', fontWeight: 600 }}>المورد (اختياري)</label>
                <select style={fieldStyle} onChange={(e) => setNewProduct({ ...newProduct, supplier_id: e.target.value })}>
                  <option value="" style={{ background: S.navy2 }}>غير مرتبط بمورد حالياً</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id} style={{ background: S.navy2 }}>
                      {sup.company_name} — {sup.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* السعر والعملة */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>متوسط السعر (لكل وحدة)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="number" placeholder="0.00"
                    style={{ ...fieldStyle, flex: 2 }}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                  <select
                    style={{ ...fieldStyle, flex: 1, padding: '0 10px' }}
                    onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}>
                    <option value="" style={{ background: S.navy2 }}>العملة</option>
                    {CURRENCIES.map((curr) => (
                      <option key={curr.id} value={curr.value} style={{ background: S.navy2 }}>{curr.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* وحدة القياس */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>وحدة القياس</label>
                <select style={fieldStyle} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                  <option value="" style={{ background: S.navy2 }}>اختر الوحدة...</option>
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit.id} value={unit.value} style={{ background: S.navy2 }}>{unit.label}</option>
                  ))}
                </select>
              </div>

              {/* الكمية */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>الكمية المتاحة (Stock)</label>
                <input type="number" placeholder="الكمية الإجمالية"
                  style={fieldStyle}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} />
              </div>

              {/* MOQ */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>أقل كمية للطلب (MOQ)</label>
                <input placeholder="مثال: 50 قطعة"
                  style={fieldStyle}
                  onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })} />
              </div>

              {/* دولة المنشأ ✅ */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>دولة المنشأ</label>
                <select
                  style={fieldStyle}
                  onChange={(e) => setNewProduct({ ...newProduct, origin_country: e.target.value })}>
                  <option value="" style={{ background: S.navy2 }}>اختر الدولة</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.id} value={country.label} style={{ background: S.navy2 }}>{country.label}</option>
                  ))}
                </select>
              </div>

              {/* سوق البيع ✅ */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>السوق الذي تبيع فيه المنتج</label>
                <select
                  style={fieldStyle}
                  onChange={(e) => setNewProduct({ ...newProduct, market_country: e.target.value })}>
                  <option value="" style={{ background: S.navy2 }}>اختر السوق</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.id} value={country.label} style={{ background: S.navy2 }}>{country.label}</option>
                  ))}
                </select>
              </div>

              {/* الوصف */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '11px', color: S.muted, marginBottom: '8px' }}>وصف المنتج والمميزات</label>
                <textarea rows={4} placeholder="اكتب تفاصيل المنتج التي تهم المشتري..."
                  style={{ ...fieldStyle, resize: 'none', lineHeight: '1.6' } as React.CSSProperties}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>

            </div>

            {/* أزرار الحفظ */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button onClick={handleAddProduct} disabled={saving}
                style={{ flex: 2, background: saving ? '#666' : S.gold, color: S.navy, padding: '14px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }}>
                {saving ? 'جاري الإضافة...' : 'إضافة المنتج'}
              </button>
              <button onClick={() => setShowAddProduct(false)}
                style={{ flex: 1, background: 'transparent', color: S.white, padding: '12px', borderRadius: '8px', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'إجمالي المنتجات', val: totalProducts, color: S.gold },
            { label: 'إجمالي الموردين', val: totalSuppliers, color: S.green },
            { label: 'أكثر منتج تكراراً', val: mostPopular ? mostPopular[0] : '—', color: S.blue, small: true },
            { label: 'متوسط منتجات/مورد', val: totalSuppliers ? (Object.values(productMap).reduce((a, v) => a + v.length, 0) / totalSuppliers).toFixed(1) : 0, color: S.amber },
          ].map((s, i) => (
            <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px', textAlign: 'right' }}>
              <div style={{ fontSize: s.small ? '14px' : '28px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* البحث والفلاتر */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="🔍 ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />

          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            style={{ background: S.navy2, color: filterCountry ? S.white : S.muted, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">كل الدول</option>
            {[...new Set(suppliers.map(s => s.country).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            style={{ background: S.navy2, color: S.muted, border: `1px solid ${S.border}`, padding: '10px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {viewMode === 'table' ? '⊞ بطاقات' : '☰ جدول'}
          </button>

          <div style={{ display: 'flex', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            {[{ key: 'active', label: 'نشط' }, { key: 'all', label: 'الكل' }].map(t => (
              <button key={t.key} onClick={() => setStatusFilter(t.key)}
                style={{ padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: statusFilter === t.key ? S.green : 'transparent', color: statusFilter === t.key ? '#fff' : S.muted, transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

            {/* الجدول */}
            {viewMode === 'table' && (
              <div style={{ flex: selectedProduct ? '0 0 55%' : '1', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                      {['#', 'المنتج', 'عدد الموردين', 'بلد المنشأ', 'سوق البيع', 'التوزيع', 'متوسط التقييم', 'الدول'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map(([name, sups], i) => {
                      const safeSups = Array.isArray(sups) ? sups : []
                      const count = safeSups.length
                      const avgRating = count > 0
                        ? (safeSups.reduce((a, s) => a + (s.rating || 0), 0) / count).toFixed(1)
                        : 0
                      const allCountries = [...new Set(safeSups.map(s => getCountryLabel(s.origin_country)).filter(c => c !== '—'))]
                      const isSelected = selectedProduct === name
                      const totalSupsCount = suppliers.length || 1
                      const firstSup = safeSups[0] || {}

                      return (
                        <tr key={name} onClick={() => setSelectedProduct(isSelected ? null : name)}
                          style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: isSelected ? `rgba(201,168,76,0.08)` : i % 2 === 0 ? `transparent` : `rgba(255,255,255,0.02)`, cursor: `pointer`, transition: `background 0.15s`, height: `48px`, direction: `rtl` }}>

                          <td style={{ padding: `12px 14px`, fontSize: `11px`, color: S.muted, textAlign: `center`, width: `50px` }}>{i + 1}</td>

                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <div style={{ display: `flex`, alignItems: `center`, gap: `8px` }}>
                              <span style={{ fontSize: `13px`, fontWeight: 600 }}>📦 {name}</span>
                              {i === 0 && <span style={{ fontSize: `9px`, padding: `2px 8px`, borderRadius: `8px`, background: `rgba(201,168,76,0.12)`, color: S.gold, fontWeight: 700 }}>الأكثر</span>}
                            </div>
                          </td>

                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <span style={{ fontSize: `14px`, fontWeight: 700, color: S.gold }}>{safeSups.filter((s: any) => s.supplier_id).length}</span>
                            <span style={{ fontSize: `11px`, color: S.muted, marginRight: `4px` }}>مورد</span>
                          </td>

                          {/* بلد المنشأ ✅ */}
                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <span style={{ fontSize: `12px`, color: S.white }}>
                               {firstSup.origin_country ? getCountryLabel(firstSup.origin_country) : '—'}
                            </span>
                          </td>

                          {/* سوق البيع ✅ */}
                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <span style={{ fontSize: `11px`, color: S.gold, background: `rgba(201,168,76,0.1)`, padding: `2px 8px`, borderRadius: `6px` }}>
                              🛒 {firstSup.market_country ? getCountryLabel(firstSup.market_country) : '—'}
                            </span>
                          </td>

                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <div style={{ display: `flex`, alignItems: `center`, gap: `6px` }}>
                              <span style={{ fontSize: `10px`, color: S.muted }}>{((count / totalSupsCount) * 100).toFixed(0)}%</span>
                              <div style={{ width: `60px`, height: `4px`, background: S.border, borderRadius: `2px`, overflow: `hidden` }}>
                                <div style={{ height: `100%`, width: `${(count / totalSupsCount) * 100}%`, background: i === 0 ? S.gold : i === 1 ? S.green : S.blue }} />
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <div style={{ display: `flex`, alignItems: `center`, gap: `4px` }}>
                              {[1, 2, 3, 4, 5].map(j => (
                                <svg key={j} width="10" height="10" viewBox="0 0 16 16" style={{ fill: j <= Math.round(Number(avgRating) / 2) ? S.gold : `rgba(201,168,76,0.2)` }}>
                                  <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z" />
                                </svg>
                              ))}
                              <span style={{ fontSize: `10px`, color: S.muted, marginRight: `4px` }}>{avgRating}</span>
                            </div>
                          </td>

                          <td style={{ padding: `12px 14px`, textAlign: `right` }}>
                            <div style={{ display: `flex`, gap: `4px`, flexWrap: `wrap` }}>
                              {allCountries.map(c => (
                                <span key={c} style={{ fontSize: `9px`, padding: `2px 6px`, borderRadius: `8px`, background: `rgba(59,130,246,0.1)`, color: `#93C5FD`, border: `1px solid rgba(59,130,246,0.2)` }}>{c}</span>
                              ))}
                            </div>
                          </td>

                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* البطاقات */}
            {viewMode === 'cards' && (
              <div style={{ flex: selectedProduct ? '0 0 55%' : '1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {sortedProducts.map(([name, sups], i) => {
                  const avgRating = sups.length > 0 ? (sups.reduce((a, s) => a + (s.rating || 0), 0) / sups.length).toFixed(1) : 0
                  const isSelected = selectedProduct === name
                  return (
                    <div key={name} onClick={() => setSelectedProduct(isSelected ? null : name)}
                      style={{ background: isSelected ? S.navy3 : S.navy2, border: `1px solid ${isSelected ? S.gold : S.border}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', marginBottom: '8px' }}>📦</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{name}</div>
                      {i === 0 && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(201,168,76,0.12)', color: S.gold, fontWeight: 700 }}>الأكثر</span>}
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: S.muted }}>{avgRating} ⭐</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: S.gold }}>{sups.length} مورد</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
{/* لوحة تفاصيل المنتج */}
            {selectedProduct && productMap[selectedProduct] && (
              <div style={{ flex: '0 0 43%', background: S.navy2, border: `1px solid ${S.gold}`, borderRadius: '14px', padding: '20px', position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>📦 {selectedProduct}</div>
                    <div style={{ fontSize: '11px', color: S.muted, marginTop: '2px' }}>{productMap[selectedProduct].length} مورد يبيع هذا المنتج</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'من الموردين', val: ((productMap[selectedProduct].length / totalSuppliers) * 100).toFixed(0) + '%', color: S.gold },
                    { label: 'متوسط التقييم', val: (productMap[selectedProduct].reduce((a, s) => a + (s.rating || 0), 0) / productMap[selectedProduct].length).toFixed(1), color: S.green },
                    { label: 'عدد الدول', val: [...new Set(productMap[selectedProduct].map(s => s.country).filter(Boolean))].length, color: S.blue },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: S.card, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>{stat.val}</div>
                      <div style={{ fontSize: '10px', color: S.muted, marginTop: '4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '10px', textAlign: 'right' }}>الموردين</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productMap[selectedProduct].map((s, idx) => {
                    const supInfo = suppliers.find(sup => sup.id === s.supplier_id) || s;
                    return (
                      <div key={idx} onClick={() => router.push(`/suppliers/${s.supplier_id}`)}
                        style={{ background: S.card2, borderRadius: '10px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                              <svg key={i} width="10" height="10" viewBox="0 0 16 16" style={{ fill: i <= Math.round((s.rating || 0) / 2) ? S.gold : 'rgba(201,168,76,0.2)' }}>
                                <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z" />
                              </svg>
                            ))}
                          </div>
                          <span style={{ fontSize: '10px', color: S.muted }}>{s.rating || 0}/10</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{supInfo.company_name || s.company_name}</div>
                          <div style={{ fontSize: '10px', color: S.muted }}>
                            {supInfo.country || '—'}{supInfo.city ? ` / ${supInfo.city}` : ''}
                            {s.origin_country && <span style={{ color: S.gold, marginRight: '6px' }}> · 🌍 {getCountryLabel(s.origin_country)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}