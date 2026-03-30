'use client'

// ===== الاستيرادات =====
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import AppShell from "../components/AppShell";
// ===== تعريف نوع بيانات المورد =====
interface Supplier {
  id: string
  created_at: string
  supplier_number: number
  company_name: string
  country: string
  city: string
  status: string
  rating: number
  completion_pct: number
  contact_name: string
  contact_whatsapp: string
  contact_email: string
  annual_sales: string
  notes: string
  total_deals: number
  total_amount: number
  main_products: string
  last_contact_date: string
  last_contact_method: string
  website: string
}

// ===== دوال مساعدة (خارج المكون — صحيح) =====
function timeAgo(date: string) {
  if (!date) return null
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'منذ يوم'
  if (diff < 7) return `منذ ${diff} أيام`
  if (diff < 30) return `منذ ${Math.floor(diff / 7)} أسابيع`
  return `منذ ${Math.floor(diff / 30)} أشهر`
}

function formatSupNum(n: number) {
  return `SUP-${String(n).padStart(5, '0')}`
}

// ===== دالة تنظيف اسم المنتج (BidLX V1.2.1) =====
function cleanProductName(name: string): string {
  return name
    .trim()
    .replace(/^(ال)/, '')       // حذف "ال" التعريف من البداية
    .replace(/\s+/g, ' ')        // توحيد المسافات
    .toLowerCase()               // توحيد الأحرف
}

// ===== نظام الألوان الموحد =====
const S = {
  navy:  '#0A1628',
  navy2: '#0F2040',
  gold:  '#C9A84C',
  gold2: '#E8C97A',
  gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8',
  muted: '#8A9BB5',
  border: 'rgba(255,255,255,0.08)',
  green: '#22C55E',
  red:   '#EF4444',
  blue:  '#3B82F6',
  amber: '#F59E0B',
  card2: 'rgba(255,255,255,0.08)',
}

// ===== المكون الرئيسي =====
export default function SuppliersPage() {

  // ===== الراوتر — داخل المكون (صحيح) =====
  const router = useRouter()

  // ===== الـ State — كل الـ Hooks في أعلى المكون =====
  const [currentPage, setCurrentPage]   = useState(1)
  const rowsPerPage = 20
  const [suppliers, setSuppliers]       = useState<Supplier[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [tab, setTab]                   = useState<'active' | 'suspended'>('active')
  const [showForm, setShowForm]         = useState(false)
  const [aiLoading, setAiLoading]       = useState(false)
  const [filterCountry, setFilterCountry] = useState('')
  const [viewMode, setViewMode]         = useState<'table' | 'cards'>('table')
  const [userName, setUserName]         = useState('User')
  const [form, setForm] = useState({
    company_name: '', country: '', city: '',
    contact_name: '', contact_whatsapp: '',
    contact_email: '', annual_sales: '',
    main_products: '', notes: '',
    website: '',
  })

  // ===== تحميل البيانات عند فتح الصفحة =====
  useEffect(() => {
    fetchSuppliers()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
    })
  }, [])

  // ===== 1. جلب الموردين =====
  async function fetchSuppliers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) { console.error('خطأ:', error.message); return }
      setSuppliers(data || [])
    } catch (err) {
      console.error('خطأ غير متوقع:', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== 2. تعبئة بالذكاء الاصطناعي (BidLX V1.2.1) =====
  async function fillWithAI() {
    if (!form.company_name) { alert('اكتب اسم الشركة أولاً'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: form.company_name }),
      })
      const data = await res.json()
      const aiContent = data?.choices?.[0]?.message?.content || '{}'

      // تحليل JSON القادم من AI مع معالجة الأخطاء
      const parsed = JSON.parse(aiContent.replace(/```json|```/g, '').trim())

      // توزيع البيانات على الـ Form State
      // مع تحويل المصفوفات → نص مفصول بفاصلة عربية ،
      setForm(prev => ({
        ...prev,
        ...parsed,
        main_products: Array.isArray(parsed.main_products)
          ? parsed.main_products.join('، ')
          : (parsed.main_products || prev.main_products),
      }))
    } catch (err: any) {
      alert('تعذر الاتصال بالذكاء الاصطناعي')
    } finally {
      setAiLoading(false)
    }
  }

  // ===== 3. إضافة مورد جديد مع ترحيل المنتجات (BidLX V1.2.1) =====
  async function addSupplier() {
    // التحقق الأساسي
    if (!form.company_name) { alert('يرجى إدخال اسم الشركة'); return }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { alert('جلسة الدخول انتهت'); return }

    try {
      // معالجة المنتجات وتنظيفها باستخدام cleanProductName
      const rawProducts = form.main_products || ''
      const productsArray = rawProducts
        .split(/[،,]/)
        .map(p => cleanProductName(p))
        .filter(p => p !== '')

      // ترحيل المنتجات لجدول products مع منع التكرار (upsert)
      if (productsArray.length > 0) {
        const productInserts = productsArray.map(name => ({ name }))
        const { error: prodError } = await supabase
          .from('products')
          .upsert(productInserts, { onConflict: 'name' })
        if (prodError) throw prodError
      }

      // حفظ بيانات المورد في جدول suppliers
      const { error: suppError } = await supabase.from('suppliers').insert([{
        ...form,
        main_products: productsArray.join('، '), // النسخة المنسقة والموحدة
        status: 'active',
        rating: 0,
        completion_pct: calcCompletion(form),
        user_id: user.id,
      }])
      if (suppError) throw suppError

      alert('تم ترحيل المورد وتحديث مخزن المنتجات بنجاح ✅')
      setForm({
        company_name: '', country: '', city: '', contact_name: '',
        contact_whatsapp: '', contact_email: '', annual_sales: '',
        main_products: '', notes: '', website: '',
      })
      setShowForm(false)
      fetchSuppliers()

    } catch (err: any) {
      console.error('خطأ ترحيل BidLX:', err.message)
      alert('حدث خطأ أثناء الحفظ: ' + err.message)
    }
  }

  // ===== 4. تغيير حالة المورد (toggleStatus) =====
  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    const { error } = await supabase
      .from('suppliers')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) { console.error('خطأ تغيير الحالة:', error.message); return }
    // تحديث القائمة فوراً دون إعادة تحميل كاملة
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  // ===== 5. تصدير إكسيل =====
  const exportToExcel = () => {
    if (filtered.length === 0) return alert('لا توجد بيانات للتصدير')
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map(s => ({
        'رقم المورد': formatSupNum(s.supplier_number),
        'اسم الشركة': s.company_name,
        'الدولة': s.country,
        'المدينة': s.city,
        'المنتجات': s.main_products,
        'واتساب': s.contact_whatsapp,
        'الإيميل': s.contact_email,
        'الحالة': s.status === 'active' ? 'نشط' : 'موقوف',
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers')
    const dateStr = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `${userName}_Suppliers_${dateStr}.xlsx`)
  }

  // ===== حساب اكتمال الملف =====
  function calcCompletion(f: any) {
    const fields = ['company_name', 'country', 'city', 'contact_name', 'contact_whatsapp', 'contact_email', 'annual_sales', 'main_products', 'notes']
    return Math.round(fields.filter(k => f[k]?.trim()).length / fields.length * 100)
  }

  // ===== تصفية الموردين =====
  const filtered = suppliers
    .filter(s => s.status === tab)
    .filter(s => s.company_name?.toLowerCase().includes(search.toLowerCase()))
    .filter(s => filterCountry ? s.country === filterCountry : true)

  // ===== Pagination =====
  const totalPages = Math.ceil(filtered.length / rowsPerPage)
  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const inp: React.CSSProperties = {
    width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: S.white,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  // ===== الواجهة =====
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* شريط الأدوات */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowForm(true)}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + إضافة مورد
          </button>
          <button onClick={exportToExcel}
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📤 تصدير
          </button>
          <button onClick={() => router.push('/pricing/compare')}
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📊 مقارنة أسعار
          </button>
          <button onClick={() => router.push('/Buy-Request')}
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚖️ طلب شراء
          </button>
        </div>
      </div>

      {/* المحتوى القابل للتمرير */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'إجمالي الموردين',  val: suppliers.length, color: S.gold },
            { label: 'موردون نشطون',     val: suppliers.filter(s => s.status === 'active').length, color: S.green },
            { label: 'موقوفون',          val: suppliers.filter(s => s.status === 'suspended').length, color: S.red },
            { label: 'إجمالي الصفقات',   val: suppliers.reduce((a, b) => a + (b.total_deals || 0), 0), color: S.blue },
          ].map((s, i) => (
            <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* شريط البحث والفلاتر */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍  ابحث عن مورد..." value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            style={{ ...inp, flex: 1, background: S.navy2, borderRadius: '10px', padding: '10px 16px', minWidth: '200px' }} />

          <select value={filterCountry}
            onChange={e => { setFilterCountry(e.target.value); setCurrentPage(1) }}
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
            {[{ key: 'active', label: 'نشطون' }, { key: 'suspended', label: 'موقوفون' }].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key as any); setCurrentPage(1) }}
                style={{ padding: '9px 20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: tab === t.key ? (t.key === 'active' ? S.green : S.red) : 'transparent', color: tab === t.key ? '#fff' : S.muted, transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* عرض البطاقات */}
        {viewMode === 'cards' && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: S.white }}>لا يوجد موردون</div>
              </div>
            ) : filtered.map(s => (
              <div key={s.id} onClick={() => router.push(`/suppliers/${s.id}`)}
                style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '16px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials(s.company_name)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.company_name}</div>
                    <div style={{ fontSize: '10px', color: S.muted }}>{s.country || '—'}{s.city ? ` / ${s.city}` : ''}</div>
                  </div>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700, background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.status === 'active' ? S.green : S.red }}>
                    {s.status === 'active' ? 'نشط' : 'موقوف'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '10px', justifyContent: 'flex-end' }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 16 16" style={{ fill: i <= Math.round((s.rating || 0) / 2) ? S.gold : 'rgba(201,168,76,0.2)' }}>
                      <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                    </svg>
                  ))}
                  <span style={{ fontSize: '10px', color: S.muted, marginRight: '4px' }}>{s.rating || 0}/10</span>
                </div>
                {s.main_products && (
                  <div style={{ fontSize: '11px', color: S.muted, textAlign: 'right', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.main_products}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: S.muted }}>{s.completion_pct || 0}%</span>
                  <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.completion_pct || 0}%`, background: s.completion_pct >= 80 ? S.green : s.completion_pct >= 50 ? S.amber : S.red, borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: S.muted }}>{formatSupNum(s.supplier_number)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* عرض الجدول */}
        {viewMode === 'table' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: S.white }}>لا يوجد موردون</div>
              </div>
            ) : (
              <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                      {['#', 'الشركة', 'الدولة', 'المنتجات', 'الصفقات', 'آخر تواصل', 'الحالة', 'تواصل سريع', 'إجراء'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700, letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((s, i) => (
                      <tr key={s.id}
                        style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                        onClick={() => router.push(`/suppliers/${s.id}`)}>

                        <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right' }}>{formatSupNum(s.supplier_number)}</td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {initials(s.company_name)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.company_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                                {[1,2,3,4,5].map(j => (
                                  <svg key={j} width="14" height="14" viewBox="0 0 16 16" style={{ fill: j <= Math.round((s.rating || 0) / 2) ? '#C9A84C' : 'rgba(201,168,76,0.2)' }}>
                                    <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
                                  </svg>
                                ))}
                                <span style={{ fontSize: '10px', color: '#8A9BB5', marginRight: '2px' }}>{s.rating || 0}/10</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                <div style={{ fontSize: '10px', color: '#8A9BB5' }}>{new Date(s.created_at).toLocaleDateString('ar-EG')}</div>
                                <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${s.completion_pct || 0}%`, background: s.completion_pct >= 80 ? '#22C55E' : s.completion_pct >= 50 ? '#F59E0B' : '#EF4444', borderRadius: '2px' }} />
                                </div>
                                <div style={{ fontSize: '10px', color: '#8A9BB5' }}>{s.completion_pct || 0}%</div>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '12px', color: S.muted, textAlign: 'right' }}>{s.country || '—'}{s.city ? ` / ${s.city}` : ''}</td>

                        <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right', maxWidth: '120px' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.main_products || '—'}</div>
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: S.gold }}>{s.total_deals || 0}</div>
                          {s.total_amount > 0 && <div style={{ fontSize: '10px', color: S.muted }}>${s.total_amount.toLocaleString()}</div>}
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right' }}>
                          {s.last_contact_date ? (
                            <div>
                              <div style={{ color: S.white }}>{timeAgo(s.last_contact_date)}</div>
                              {s.last_contact_method && <div style={{ fontSize: '10px' }}>عبر {s.last_contact_method}</div>}
                            </div>
                          ) : '—'}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.status === 'active' ? S.green : S.red }}>
                            {s.status === 'active' ? 'نشط' : 'موقوف'}
                          </span>
                        </td>

                        {/* تواصل سريع */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
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
                          </div>
                        </td>

                        {/* إجراء */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            {s.status === 'suspended' && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm(`هل تريد حذف "${s.company_name}" نهائياً؟`)) return
                                  await supabase.from('suppliers').delete().eq('id', s.id)
                                  fetchSuppliers()
                                }}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: S.red, fontSize: '14px', fontWeight: 700 }}>
                                ✕
                              </button>
                            )}
                            {/* toggleStatus — مربوط بالدالة المصلحة */}
                            <button onClick={() => toggleStatus(s.id, s.status)}
                              style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(255,255,255,0.15)`, background: 'transparent', color: s.status === 'active' ? S.red : S.green, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {s.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Bar */}
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                          acc.push(p)
                          return acc
                        }, [])
                        .map((p, idx) => p === '...' ? (
                          <span key={`dots-${idx}`} style={{ color: S.muted, fontSize: '12px', padding: '0 4px' }}>...</span>
                        ) : (
                          <button key={p}
                            onClick={() => setCurrentPage(p as number)}
                            style={{ width: '32px', height: '32px', borderRadius: '7px', border: `1px solid ${currentPage === p ? S.gold : S.border}`, background: currentPage === p ? S.gold3 : 'transparent', color: currentPage === p ? S.gold : S.muted, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: currentPage === p ? 700 : 400 }}>
                            {p}
                          </button>
                        ))
                      }
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '6px 14px', borderRadius: '7px', border: `1px solid ${S.border}`, background: 'transparent', color: currentPage === totalPages ? S.muted : S.white, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                        ← التالي
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

      </div>

      {/* Modal إضافة مورد */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: S.navy2, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>إضافة مورد جديد</div>
            </div>
            <button onClick={fillWithAI} disabled={aiLoading}
              style={{ width: '100%', background: 'rgba(201,168,76,0.1)', color: S.gold, border: '1px solid rgba(201,168,76,0.25)', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '16px' }}>
              {aiLoading ? '⏳ جاري البحث...' : '✨ إملأ البيانات بالذكاء الاصطناعي'}
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'اسم الشركة *', key: 'company_name', placeholder: 'مثال: Wilmar International' },
                { label: 'الدولة',         key: 'country',       placeholder: 'إندونيسيا' },
                { label: 'المدينة',        key: 'city',          placeholder: 'جاكرتا' },
                { label: 'المنتجات الرئيسية', key: 'main_products', placeholder: 'زيت نخيل، ورق...' },
                { label: 'اسم المسؤول',   key: 'contact_name',  placeholder: 'الشخص المسؤول' },
                { label: 'واتساب',         key: 'contact_whatsapp', placeholder: '+62 8xx xxx xxxx' },
                { label: 'الموقع الإلكتروني', key: 'website',   placeholder: 'www.company.com' },
                { label: 'الإيميل',        key: 'contact_email', placeholder: 'email@company.com' },
                { label: 'حجم المبيعات السنوية', key: 'annual_sales', placeholder: '$10M' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '5px' }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '5px' }}>ملاحظات</label>
                <textarea placeholder="نبذة عن المورد..." value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                  style={{ ...inp, resize: 'none' } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.06)', color: S.white, border: `1px solid rgba(255,255,255,0.12)`, padding: '11px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={addSupplier} style={{ background: S.gold, color: S.navy, border: 'none', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إضافة المورد</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
