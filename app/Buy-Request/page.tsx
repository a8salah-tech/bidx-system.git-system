'use client'

import { useEffect, useState, useRef } from 'react'
import AppShell from "../components/AppShell";
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { COUNTRIES, PRODUCT_UNITS } from '../components/options'


// ===== الألوان =====
const S = {
  navy:    '#0A1628',
  navy2:   '#0F2040',
  navy3:   '#0C1A32',
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  gold3:   'rgba(201,168,76,0.10)',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  border:  'rgba(255,255,255,0.08)',
  borderG: 'rgba(201,168,76,0.18)',
  green:   '#22C55E',
  red:     '#EF4444',
  amber:   '#F59E0B',
  blue:    '#3B82F6',
  card:    'rgba(255,255,255,0.04)',
  card2:   'rgba(255,255,255,0.08)',
}

// ===== طرق الدفع =====
const PAYMENT_METHODS = [
  { id: 'cash',        label: 'نقداً (Cash)' },
  { id: 'bank',        label: 'تحويل بنكي (Bank Transfer)' },
  { id: 'lc',          label: 'خطاب اعتماد (L/C)' },
  { id: 'dp',          label: 'مستندات مقابل دفع (D/P)' },
  { id: 'da',          label: 'مستندات مقابل قبول (D/A)' },
  { id: 'tt',          label: 'حوالة برقية (T/T)' },
  { id: 'credit_30',   label: 'آجل 30 يوم' },
  { id: 'credit_60',   label: 'آجل 60 يوم' },
  { id: 'credit_90',   label: 'آجل 90 يوم' },
  { id: 'advance_50',  label: '50% مقدم + 50% قبل الشحن' },
  { id: 'advance_30',  label: '30% مقدم + 70% عند الاستلام' },
  { id: 'paypal',      label: 'PayPal' },
  { id: 'crypto',      label: 'عملات رقمية (Crypto)' },
  { id: 'other',       label: 'أخرى' },
]

// ===== حالات الطلب =====
const ORDER_STATUSES = [
  { id: 'draft',     label: 'مسودة',    color: S.muted,  bg: 'rgba(138,155,181,0.12)' },
  { id: 'published', label: 'منشور',    color: S.blue,   bg: 'rgba(59,130,246,0.12)' },
  { id: 'approved',  label: 'معتمد',    color: S.green,  bg: 'rgba(34,197,94,0.12)' },
  { id: 'completed', label: 'منتهي',    color: S.gold,   bg: 'rgba(201,168,76,0.12)' },
  { id: 'cancelled', label: 'ملغي',     color: S.red,    bg: 'rgba(239,68,68,0.12)' },
]

// ===== مكون حقل الإدخال =====
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '7px', letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: S.red, marginRight: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
  borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'rtl',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'none',
}

// ===== الصفحة الرئيسية =====
export default function PurchaseOrderPage() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  // بيانات الطلب
  const [orderNumber, setOrderNumber]     = useState('')
  const [orderDate, setOrderDate]         = useState('')
  const [status, setStatus]               = useState('draft')
  const [buyMarket, setBuyMarket]         = useState('')   // من أين يشتري
  const [sellMarket, setSellMarket]       = useState('')   // أين يبيع
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes]                 = useState('')
  const [specs, setSpecs]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [preview, setPreview]             = useState(false)
  const [userName, setUserName]           = useState('Bridge Edge')
  const [companyName, setCompanyName]     = useState('Bridge Edge Trade Solutions')

  // بنود الطلب
  const [items, setItems] = useState([{
    product_name: '', unit: '', qty: '', target_price: '', currency: 'USD', total: '',
  }])

  // المنتجات من قاعدة البيانات
  const [productOptions, setProductOptions] = useState<string[]>([])

  // ===== تحميل البيانات =====
  useEffect(() => {
    // تاريخ اليوم
    const today = new Date()
    setOrderDate(today.toISOString().split('T')[0])

    // رقم تسلسلي
    const seq = `PO-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    setOrderNumber(seq)

    // جلب المنتجات
    async function loadData() {
      const { data: supData } = await supabase
        .from('suppliers')
        .select('main_products')
        .eq('status', 'active')

      const { data: prodData } = await supabase
        .from('supplier_products')
        .select('name')

      const names = new Set<string>()
      supData?.forEach(s => s.main_products?.split('،').forEach((p: string) => { if (p.trim()) names.add(p.trim()) }))
      prodData?.forEach(p => { if (p.name) names.add(p.name) })
      setProductOptions([...names].sort())

      // اسم المستخدم
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bridge Edge')
    }
    loadData()
  }, [])

  // ===== إدارة البنود =====
  function addItem() {
    setItems([...items, { product_name: '', unit: '', qty: '', target_price: '', currency: 'USD', total: '' }])
  }

  function removeItem(i: number) {
    if (items.length === 1) return
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, key: string, val: string) {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item
      const newItem = { ...item, [key]: val }
      // حساب الإجمالي تلقائياً
      if (key === 'qty' || key === 'target_price') {
        const qty = parseFloat(key === 'qty' ? val : item.qty) || 0
        const price = parseFloat(key === 'target_price' ? val : item.target_price) || 0
        newItem.total = (qty * price).toFixed(2)
      }
      return newItem
    })
    setItems(updated)
  }

  // ===== الإجمالي الكلي =====
  const grandTotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)

  // ===== الحالة الحالية =====
  const currentStatus = ORDER_STATUSES.find(s => s.id === status) || ORDER_STATUSES[0]

  // ===== حفظ الطلب =====
  async function saveOrder(newStatus: string) {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('يجب تسجيل الدخول'); return }

      const payload = {
        user_id: user.id,
        order_number: orderNumber,
        order_date: orderDate,
        status: newStatus,
        buy_market: buyMarket,
        sell_market: sellMarket,
        payment_method: paymentMethod,
        notes,
        specs,
        items: JSON.stringify(items),
        grand_total: grandTotal,
        created_by: userName,
      }

      const { error } = await supabase.from('purchase_orders').insert([payload])
      if (error) { alert('خطأ: ' + error.message); return }

      setStatus(newStatus)
      alert(newStatus === 'published' ? '✅ تم إرسال واعتماد الطلب' : '✅ تم حفظ المسودة')
    } finally {
      setSaving(false)
    }
  }

  // ===== طباعة =====
  function handlePrint() {
    window.print()
  }

  const sectionCard: React.CSSProperties = {
    background: S.navy2, border: `1px solid ${S.border}`,
    borderRadius: '14px', padding: '24px', marginBottom: '16px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 800, color: S.gold,
    letterSpacing: '.1em', textTransform: 'uppercase',
    marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px',
  }

  return (
    <AppShell>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; color: black !important; background: white !important; }
          .no-print { display: none !important; }
        }
      `}} />
  
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl', background: S.navy }}>

      {/* ── شريط الأدوات ── */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.borderG}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* حفظ مسودة */}
          <button onClick={() => saveOrder('draft')} disabled={saving}
            style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${S.border}`, background: 'transparent', color: S.muted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            💾 حفظ مسودة
          </button>

          {/* معاينة */}
          <button onClick={() => setPreview(!preview)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${S.borderG}`, background: preview ? S.gold3 : 'transparent', color: preview ? S.gold2 : S.muted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            👁️ {preview ? 'إغلاق المعاينة' : 'معاينة'}
          </button>

          {/* طباعة */}
          <button onClick={handlePrint}
            style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid rgba(59,130,246,0.3)`, background: 'rgba(59,130,246,0.08)', color: '#93C5FD', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            🖨️ طباعة
          </button>

          {/* اعتماد وإرسال */}
          <button onClick={() => saveOrder('published')} disabled={saving}
            style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg,${S.gold} 0%,${S.gold2} 100%)`, color: S.navy, fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>
            {saving ? '⏳ جاري الإرسال...' : '✅ اعتماد وإرسال الطلب'}
          </button>
        </div>

        {/* رقم الطلب والحالة */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: S.muted }}>{orderNumber}</span>
          <span style={{ fontSize: '11px', padding: '3px 12px', borderRadius: '20px', fontWeight: 700, background: currentStatus.bg, color: currentStatus.color }}>
            {currentStatus.label}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: S.white }}>أمر شراء جديد</div>
        </div>
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {preview ? (
          /* ══════════════ المعاينة ══════════════ */
          <div ref={printRef} style={{ background: '#fff', color: '#111', borderRadius: '16px', padding: '40px', maxWidth: '860px', margin: '0 auto', fontFamily: 'Tajawal,sans-serif', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* رأس الصفحة */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid #C9A84C', paddingBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>رقم الطلب</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#C9A84C' }}>{orderNumber}</div>
                <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>التاريخ: {orderDate}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0A1628' }}>{companyName}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>أمر شراء / Purchase Order</div>
                <div style={{ display: 'inline-block', marginTop: '8px', padding: '3px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: currentStatus.bg, color: currentStatus.color }}>
                  {currentStatus.label}
                </div>
              </div>
            </div>

            {/* معلومات الشراء */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px', background: '#f8f8f8', borderRadius: '10px', padding: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, marginBottom: '4px' }}>مصدر الشراء</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{COUNTRIES.find(c => c.id === buyMarket)?.label || buyMarket || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, marginBottom: '4px' }}>سوق البيع</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{COUNTRIES.find(c => c.id === sellMarket)?.label || sellMarket || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#888', fontWeight: 700, marginBottom: '4px' }}>طريقة الدفع</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || '—'}</div>
              </div>
            </div>

            {/* جدول البنود */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#0A1628', color: '#fff' }}>
                  {['#', 'المنتج', 'الوحدة', 'الكمية', 'السعر المستهدف', 'الإجمالي'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>{item.product_name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{item.unit || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700 }}>{item.qty || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px' }}>{item.target_price ? `${item.target_price} ${item.currency}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#C9A84C' }}>{item.total ? `${item.total} ${item.currency}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0F2040', color: '#fff' }}>
                  <td colSpan={5} style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>الإجمالي الكلي</td>
                  <td style={{ padding: '12px 14px', fontSize: '16px', fontWeight: 900, color: '#E8C97A' }}>
                    {grandTotal.toFixed(2)} USD
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* المواصفات والملاحظات */}
            {(specs || notes) && (
              <div style={{ display: 'grid', gridTemplateColumns: specs && notes ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '24px' }}>
                {specs && (
                  <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px' }}>المواصفات الإضافية</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.7' }}>{specs}</div>
                  </div>
                )}
                {notes && (
                  <div style={{ background: '#f8f8f8', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px' }}>ملاحظات</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.7' }}>{notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* التوقيع */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #ccc', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#888' }}>توقيع المعتمد</div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{userName}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #ccc', marginBottom: '8px' }} />
                <div style={{ fontSize: '11px', color: '#888' }}>ختم الشركة</div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>{companyName}</div>
              </div>
            </div>

          </div>

        ) : (
          /* ══════════════ نموذج الإدخال ══════════════ */
          <div style={{ maxWidth: '920px', margin: '0 auto' }}>

            {/* القسم الأول: معلومات الطلب */}
            <div style={sectionCard}>
              <div style={sectionTitle}>
                <span style={{ width: '6px', height: '20px', background: S.gold, borderRadius: '3px', display: 'block' }} />
                معلومات أمر الشراء
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

                <Field label="رقم الطلب">
                  <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="تاريخ الطلب">
                  <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' as any }} />
                </Field>

                <Field label="حالة الطلب">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ORDER_STATUSES.map(s => (
                      <button key={s.id} onClick={() => setStatus(s.id)}
                        style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${status === s.id ? s.color : S.border}`, background: status === s.id ? s.bg : 'transparent', color: status === s.id ? s.color : S.muted, transition: 'all .2s' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>

              </div>
            </div>

            {/* القسم الثاني: مسار التجارة */}
            <div style={sectionCard}>
              <div style={sectionTitle}>
                <span style={{ width: '6px', height: '20px', background: S.blue, borderRadius: '3px', display: 'block' }} />
                مسار التجارة — من أين تشتري وأين تبيع
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

                <Field label="مصدر الشراء (من أين تشتري)" required>
                  <select value={buyMarket} onChange={e => setBuyMarket(e.target.value)} style={selectStyle}>
                    <option value="">اختر دولة المورد...</option>
                    {COUNTRIES.map(c => <option key={c.id} value={c.id} style={{ background: S.navy2 }}>{c.label}</option>)}
                  </select>
                </Field>

                <Field label="سوق البيع (أين ستبيع)" required>
                  <select value={sellMarket} onChange={e => setSellMarket(e.target.value)} style={selectStyle}>
                    <option value="">اختر السوق المستهدف...</option>
                    {COUNTRIES.map(c => <option key={c.id} value={c.id} style={{ background: S.navy2 }}>{c.label}</option>)}
                  </select>
                </Field>

                <Field label="طريقة الدفع" required>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={selectStyle}>
                    <option value="">اختر طريقة الدفع...</option>
                    {PAYMENT_METHODS.map(p => <option key={p.id} value={p.id} style={{ background: S.navy2 }}>{p.label}</option>)}
                  </select>
                </Field>

              </div>

              {/* سهم مرئي */}
              {(buyMarket || sellMarket) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', padding: '12px 16px', background: S.gold3, borderRadius: '10px', border: `1px solid ${S.borderG}` }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: S.gold2 }}>
                    {COUNTRIES.find(c => c.id === buyMarket)?.label || '...'}
                  </span>
                  <span style={{ flex: 1, textAlign: 'center', color: S.gold, fontSize: '18px' }}>→→→</span>
                  <span style={{ fontSize: '11px', color: S.muted }}>TradeFlow OS</span>
                  <span style={{ flex: 1, textAlign: 'center', color: S.gold, fontSize: '18px' }}>→→→</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: S.gold2 }}>
                    {COUNTRIES.find(c => c.id === sellMarket)?.label || '...'}
                  </span>
                </div>
              )}
            </div>

            {/* القسم الثالث: بنود الطلب */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <button onClick={addItem}
                  style={{ padding: '7px 16px', borderRadius: '8px', border: `1px solid ${S.gold}`, background: S.gold3, color: S.gold2, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + إضافة بند
                </button>
                <div style={sectionTitle}>
                  <span style={{ width: '6px', height: '20px', background: S.green, borderRadius: '3px', display: 'block' }} />
                  بنود الطلب
                </div>
              </div>

              {/* رأس الجدول */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: '8px', marginBottom: '8px', padding: '0 4px' }}>
                {['المنتج', 'الوحدة', 'الكمية', 'السعر المستهدف', 'الإجمالي', ''].map(h => (
                  <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: S.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {/* البنود */}
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>

                  {/* المنتج — datalist */}
                  <div style={{ position: 'relative' }}>
                    <input
                      list={`products-list-${i}`}
                      value={item.product_name}
                      placeholder="ابحث أو اكتب..."
                      onChange={e => updateItem(i, 'product_name', e.target.value)}
                      style={{ ...inputStyle, padding: '10px 14px' }}
                    />
                    <datalist id={`products-list-${i}`}>
                      {productOptions.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>

                  {/* الوحدة */}
                  <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                    style={{ ...selectStyle, padding: '10px 10px', fontSize: '12px' }}>
                    <option value="">الوحدة</option>
                    {PRODUCT_UNITS.map(u => <option key={u.id} value={u.value} style={{ background: S.navy2 }}>{u.label}</option>)}
                  </select>

                  {/* الكمية */}
                  <input type="number" placeholder="0" value={item.qty}
                    onChange={e => updateItem(i, 'qty', e.target.value)}
                    style={{ ...inputStyle, padding: '10px 12px' }} />

                  {/* السعر + العملة */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="number" placeholder="0.00" value={item.target_price}
                      onChange={e => updateItem(i, 'target_price', e.target.value)}
                      style={{ ...inputStyle, flex: 2, padding: '10px 10px' }} />
                    <select value={item.currency} onChange={e => updateItem(i, 'currency', e.target.value)}
                      style={{ ...selectStyle, flex: 1, padding: '10px 6px', fontSize: '11px' }}>
                      {['USD', 'EUR', 'SAR', 'AED', 'IDR'].map(c => <option key={c} value={c} style={{ background: S.navy2 }}>{c}</option>)}
                    </select>
                  </div>

                  {/* الإجمالي */}
                  <div style={{ padding: '10px 12px', background: S.card, borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: S.gold2, textAlign: 'center', border: `1px solid ${S.border}` }}>
                    {item.total || '—'}
                  </div>

                  {/* حذف */}
                  <button onClick={() => removeItem(i)}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: S.red, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}

              {/* الإجمالي الكلي */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${S.border}` }}>
                <div style={{ background: S.gold3, border: `1px solid ${S.borderG}`, borderRadius: '10px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: S.muted, fontWeight: 700 }}>الإجمالي الكلي</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: S.gold2 }}>{grandTotal.toFixed(2)}</span>
                  <span style={{ fontSize: '13px', color: S.gold, fontWeight: 700 }}>USD</span>
                </div>
              </div>
            </div>

            {/* القسم الرابع: المواصفات والملاحظات */}
            <div style={sectionCard}>
              <div style={sectionTitle}>
                <span style={{ width: '6px', height: '20px', background: S.amber, borderRadius: '3px', display: 'block' }} />
                مواصفات وملاحظات إضافية
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="المواصفات الإضافية (جودة، شهادات، تغليف...)">
                  <textarea value={specs} onChange={e => setSpecs(e.target.value)}
                    rows={4} placeholder="مثال: شهادة حلال مطلوبة — تغليف بالكرتون — جودة Grade A..."
                    style={{ ...inputStyle, resize: 'none', lineHeight: '1.7' } as React.CSSProperties} />
                </Field>
                <Field label="ملاحظات عامة">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    rows={4} placeholder="أي ملاحظات إضافية للمورد أو الفريق الداخلي..."
                    style={{ ...inputStyle, resize: 'none', lineHeight: '1.7' } as React.CSSProperties} />
                </Field>
              </div>
            </div>

            {/* أزرار أسفل الصفحة */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', paddingBottom: '24px' }}>
              <button onClick={() => saveOrder('draft')} disabled={saving}
                style={{ padding: '12px 28px', borderRadius: '10px', border: `1px solid ${S.border}`, background: 'transparent', color: S.muted, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                💾 حفظ مسودة
              </button>
              <button onClick={() => setPreview(true)}
                style={{ padding: '12px 28px', borderRadius: '10px', border: `1px solid ${S.borderG}`, background: S.gold3, color: S.gold2, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                👁️ معاينة الطلب
              </button>
              <button onClick={handlePrint}
                style={{ padding: '12px 28px', borderRadius: '10px', border: `1px solid rgba(59,130,246,0.3)`, background: 'rgba(59,130,246,0.08)', color: '#93C5FD', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                🖨️ طباعة
              </button>
              <button onClick={() => saveOrder('published')} disabled={saving}
                style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${S.gold} 0%,${S.gold2} 100%)`, color: S.navy, fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(201,168,76,0.25)' }}>
                {saving ? '⏳ جاري الإرسال...' : '✅ اعتماد وإرسال الطلب'}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-print], [data-print] * { visibility: visible; }
        }
      `}</style>

  </div>
    </AppShell>
  )
}