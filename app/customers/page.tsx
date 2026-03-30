'use client'

// ===== الاستيرادات =====
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AppShell from "../components/AppShell";

// ===== تعريف نوع بيانات العميل =====
interface Customer {
  id: string
  created_at: string
  full_name: string
  company_name: string
  phone: string
  email: string
  country: string
  city: string
  interest: string        // المنتج المطلوب
  status: 'active' | 'pending' | 'inactive'
  total_deals: number
  total_amount: number
  notes: string
  last_contact_date: string
  website: string
}

// ===== دالة حساب الوقت المنقضي =====
function timeAgo(date: string) {
  if (!date) return null
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'منذ يوم'
  if (diff < 7) return `منذ ${diff} أيام`
  if (diff < 30) return `منذ ${Math.floor(diff / 7)} أسابيع`
  return `منذ ${Math.floor(diff / 30)} أشهر`
}

// ===== نظام الألوان الموحد لـ Bridge Edge =====
const S = {
  navy:   '#0A1628',
  navy2:  '#0F2040',
  gold:   '#C9A84C',
  gold2:  '#E8C97A',
  gold3:  'rgba(201,168,76,0.12)',
  white:  '#FAFAF8',
  muted:  '#8A9BB5',
  border: 'rgba(255,255,255,0.08)',
  green:  '#22C55E',
  red:    '#EF4444',
  blue:   '#3B82F6',
  amber:  '#F59E0B',
  card2:  'rgba(255,255,255,0.08)',
}

// ===== قائمة الدول =====
const COUNTRIES = [
  'مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان',
  'إندونيسيا', 'ماليزيا', 'تركيا', 'الصين', 'الأردن', 'العراق',
  'لبنان', 'المغرب', 'الجزائر', 'تونس', 'ليبيا', 'السودان', 'اليمن',
]

// ===== حالات العميل =====
const STATUS_MAP = {
  active:   { label: 'نشط',          color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  pending:  { label: 'قيد الانتظار', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  inactive: { label: 'غير نشط',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

// ===== القيمة الافتراضية لنموذج الإضافة =====
const EMPTY_FORM = {
  full_name: '', company_name: '', phone: '',
  email: '', country: '', city: '',
  interest: '', notes: '', website: '',
}

// ===== المكون الرئيسي =====
export default function CustomersPage() {
  const router = useRouter()

  // ── الـ State ──
  const [customers, setCustomers]         = useState<Customer[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState('')
  const [showForm, setShowForm]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [currentPage, setCurrentPage]     = useState(1)
  const rowsPerPage = 20

  // ── تحميل البيانات عند فتح الصفحة ──
  useEffect(() => {
    fetchCustomers()
  }, [])

  // ===== 1. جلب العملاء من Supabase =====
  async function fetchCustomers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) { console.error('خطأ جلب العملاء:', error.message); return }
      setCustomers(data || [])
    } catch (err) {
      console.error('خطأ غير متوقع:', err)
    } finally {
      setLoading(false)
    }
  }

  // ===== 2. إضافة عميل جديد =====
  async function handleAddCustomer() {
    // التحقق من الحقول الإلزامية
    if (!form.full_name) { alert('يرجى إدخال اسم العميل'); return }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { alert('جلسة الدخول انتهت، يرجى تسجيل الدخول'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('customers').insert([{
        ...form,
        status: 'active',
        total_deals: 0,
        total_amount: 0,
      }])

      if (error) throw error

      alert('✅ تم إضافة العميل بنجاح')
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchCustomers()

    } catch (err: any) {
      console.error('خطأ إضافة العميل:', err.message)
      alert('حدث خطأ أثناء الحفظ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ===== 3. تغيير حالة العميل =====
  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('customers')
      .update({ status: next })
      .eq('id', id)

    if (error) { console.error('خطأ تغيير الحالة:', error.message); return }
    // تحديث القائمة محلياً فوراً دون إعادة تحميل
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: next as any } : c))
  }

  // ===== 4. حذف عميل =====
  async function deleteCustomer(id: string, name: string) {
    if (!window.confirm(`هل تريد حذف العميل "${name}" نهائياً؟`)) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { alert('خطأ في الحذف: ' + error.message); return }
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  // ===== تصفية العملاء =====
  const filtered = customers
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                 c.company_name?.toLowerCase().includes(search.toLowerCase()))
    .filter(c => filterCountry ? c.country === filterCountry : true)

  // ===== Pagination =====
  const totalPages   = Math.ceil(filtered.length / rowsPerPage)
  const paginatedData = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // ===== دوال مساعدة للواجهة =====
  const initials = (name: string) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  // ── style مشترك لحقول الإدخال ──
  const inp: React.CSSProperties = {
    width: '100%', background: S.navy,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '10px 14px',
    fontSize: '13px', color: S.white,
    outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', direction: 'rtl',
  }

  // ===== الواجهة =====
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>

      {/* ── شريط الأدوات ── */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>

          {/* زر إضافة عميل */}
          <button onClick={() => setShowForm(true)}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + إضافة عميل
          </button>

          {/* زر التصدير */}
          <button
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📤 تصدير
          </button>

        </div>
      </div>

      {/* ── المحتوى القابل للتمرير ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ── الإحصائيات السريعة ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'إجمالي العملاء',  val: customers.length,                                              color: S.gold  },
            { label: 'نشطون',           val: customers.filter(c => c.status === 'active').length,            color: S.green },
            { label: 'قيد الانتظار',    val: customers.filter(c => c.status === 'pending').length,           color: S.amber },
            { label: 'إجمالي الصفقات',  val: customers.reduce((a, b) => a + (b.total_deals || 0), 0),       color: S.blue  },
          ].map((stat, i) => (
            <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>{stat.val}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── شريط البحث والفلاتر ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* البحث */}
          <input
            type="text" placeholder="🔍 ابحث عن عميل أو شركة..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            style={{ ...inp, flex: 1, background: S.navy2, borderRadius: '10px', padding: '10px 16px', minWidth: '200px' }}
          />

          {/* فلتر الدولة */}
          <select
            value={filterCountry}
            onChange={e => { setFilterCountry(e.target.value); setCurrentPage(1) }}
            style={{ background: S.navy2, color: filterCountry ? S.white : S.muted, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">كل الدول</option>
            {[...new Set(customers.map(c => c.country).filter(Boolean))].map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* فلتر الحالة */}
          <div style={{ display: 'flex', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            {[
              { key: 'all',      label: 'الكل' },
              { key: 'active',   label: 'نشطون' },
              { key: 'pending',  label: 'انتظار' },
              { key: 'inactive', label: 'غير نشط' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setStatusFilter(t.key); setCurrentPage(1) }}
                style={{
                  padding: '9px 16px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: statusFilter === t.key ? S.gold : 'transparent',
                  color: statusFilter === t.key ? S.navy : S.muted,
                  transition: 'all 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

        </div>

        {/* ── الجدول ── */}
        {loading ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: S.white }}>لا يوجد عملاء</div>
          </div>
        ) : (
          <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                  {['العميل', 'الشركة', 'الدولة', 'المنتج المطلوب', 'الصفقات', 'آخر تواصل', 'الحالة', 'تواصل سريع', 'إجراء'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700, letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((c, i) => {
                  const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.inactive
                  return (
                    <tr
                      key={c.id}
                      style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => router.push(`/customers/${c.id}`)}>

                      {/* العميل */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#0F2040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {initials(c.full_name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{c.full_name}</div>
                            <div style={{ fontSize: '10px', color: S.muted, marginTop: '2px' }}>{c.email || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* الشركة */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: S.white, textAlign: 'right' }}>
                        {c.company_name || '—'}
                      </td>

                      {/* الدولة */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: S.muted, textAlign: 'right' }}>
                        {c.country || '—'}{c.city ? ` / ${c.city}` : ''}
                      </td>

                      {/* المنتج المطلوب */}
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right', maxWidth: '120px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.interest || '—'}
                        </div>
                      </td>

                      {/* الصفقات */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: S.gold }}>{c.total_deals || 0}</div>
                        {c.total_amount > 0 && (
                          <div style={{ fontSize: '10px', color: S.muted }}>${c.total_amount.toLocaleString()}</div>
                        )}
                      </td>

                      {/* آخر تواصل */}
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: S.muted, textAlign: 'right' }}>
                        {c.last_contact_date ? (
                          <div style={{ color: S.white }}>{timeAgo(c.last_contact_date)}</div>
                        ) : '—'}
                      </td>

                      {/* الحالة */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, background: statusInfo.bg, color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* تواصل سريع */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* واتساب */}
                          {c.phone && (
                            <a
                              href={'https://wa.me/' + c.phone.replace(/[^0-9]/g, '')}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                              title={'واتساب: ' + c.phone}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="#22C55E">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.528 5.855L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.516-5.165-1.415l-.371-.22-3.763.894.952-3.671-.242-.381A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                              </svg>
                            </a>
                          )}
                          {/* إيميل */}
                          {c.email && (
                            <a
                              href={'mailto:' + c.email}
                              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(c.email); alert('تم نسخ الإيميل: ' + c.email) }}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                              title={'إيميل: ' + c.email}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="#3B82F6">
                                <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/>
                              </svg>
                            </a>
                          )}
                          {/* موقع */}
                          {c.website && (
                            <a
                              href={c.website.startsWith('http') ? c.website : 'https://' + c.website}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '13px' }}
                              title={'الموقع: ' + c.website}>
                              🌐
                            </a>
                          )}
                        </div>
                      </td>

                      {/* إجراء */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* حذف — يظهر فقط للغير نشطين */}
                          {c.status === 'inactive' && (
                            <button
                              onClick={() => deleteCustomer(c.id, c.full_name)}
                              style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: S.red, fontSize: '14px', fontWeight: 700 }}>
                              ✕
                            </button>
                          )}
                          {/* تغيير الحالة */}
                          <button
                            onClick={() => toggleStatus(c.id, c.status)}
                            style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(255,255,255,0.15)`, background: 'transparent', color: c.status === 'active' ? S.red : S.green, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {c.status === 'active' ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* ── Pagination Bar ── */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${S.border}`, background: S.navy2 }}>
                <div style={{ fontSize: '12px', color: S.muted }}>
                  عرض {(currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, filtered.length)} من {filtered.length} عميل
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

      </div>

      {/* ── Modal إضافة عميل ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px', border: `1px solid ${S.border}`, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* رأس المودال */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: S.muted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '16px', fontWeight: 800, color: S.gold }}>إضافة عميل جديد</div>
            </div>

{/* حقول النموذج بتنسيق Grid */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  {[
    { label: 'الاسم الكامل *',     key: 'full_name',     placeholder: 'اسم العميل' },
    { label: 'اسم الشركة',          key: 'company_name',  placeholder: 'شركة...' },
    { label: 'رقم الهاتف / واتساب', key: 'phone',         placeholder: '+966 5xx xxx xxxx' },
    { label: 'البريد الإلكتروني',    key: 'email',         placeholder: 'email@company.com' },
    { label: 'المدينة',             key: 'city',          placeholder: 'الرياض' },
    { label: 'الموقع الإلكتروني',    key: 'website',       placeholder: 'www.company.com' },
  ].map(f => (
    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', color: S.gold, fontWeight: 600, letterSpacing: '0.5px' }}>{f.label}</label>
      <input
        type="text" 
        placeholder={f.placeholder}
        value={(form as any)[f.key] || ''}
        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
        style={{
          ...inp,
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${S.border}`,
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  ))}

  {/* اختيار الدولة والمنتج المطلوب في سطر واحد */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '11px', color: S.gold, fontWeight: 600 }}>الدولة</label>
    <select
      value={form.country}
      onChange={e => setForm({ ...form, country: e.target.value })}
      style={{ ...inp, background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
      <option value="">اختر الدولة...</option>
      {COUNTRIES.map(c => (
        <option key={c} value={c} style={{ background: S.navy2 }}>{c}</option>
      ))}
    </select>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '11px', color: S.gold, fontWeight: 600 }}>المنتج المطلوب</label>
    <input
      type="text" 
      placeholder="مثال: زيت نخيل..."
      value={form.interest}
      onChange={e => setForm({ ...form, interest: e.target.value })}
      style={{ ...inp, background: 'rgba(255,255,255,0.02)' }}
    />
  </div>

  {/* ملاحظات - تأخذ السطر بالكامل */}
  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '11px', color: S.gold, fontWeight: 600 }}>ملاحظات إضافية</label>
    <textarea
      placeholder="اكتب هنا أي تفاصيل إضافية..."
      value={form.notes}
      onChange={e => setForm({ ...form, notes: e.target.value })}
      rows={3}
      style={{ 
        ...inp, 
        background: 'rgba(255,255,255,0.02)', 
        resize: 'none',
        lineHeight: '1.6'
      } as React.CSSProperties}
    />
  </div>
</div>
<div style={{ width: '100%', overflowX: 'auto', background: S.navy2, borderRadius: '12px', border: `1px solid ${S.border}`, marginTop: '20px' }}>
</div>

            {/* أزرار الحفظ والإلغاء */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'rgba(255,255,255,0.06)', color: S.white, border: `1px solid rgba(255,255,255,0.12)`, padding: '11px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
              <button onClick={handleAddCustomer} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '⏳ جاري الحفظ...' : 'إضافة العميل'}
              </button>
            </div>

          </div>
        </div>
         )}

      </div>
  );
}