'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES } from '../components/options'

// ===== نظام الألوان =====
const S = {
  navy:    '#0A1628', navy2: '#0F2040', navy3: '#0C1A32',
  gold:    '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.10)',
  white:   '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  borderG: 'rgba(201,168,76,0.18)',
  green:   '#22C55E', red: '#EF4444', amber: '#F59E0B',
  blue:    '#3B82F6', purple: '#8B5CF6',
  card:    'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.08)',
}

// ===== رموز العملات =====
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:'$', EUR:'€', GBP:'£', SAR:'ر.س', AED:'د.إ', KWD:'د.ك',
  QAR:'ر.ق', BHD:'د.ب', OMR:'ر.ع', EGP:'ج.م', IQD:'د.ع',
  JOD:'د.أ', CNY:'¥', TRY:'₺', IDR:'Rp', MAD:'د.م',
  DZD:'د.ج', TND:'د.ت', LYD:'د.ل', YER:'ر.ي', SDG:'ج.س',
  LBP:'ل.ل', SYP:'ل.س', MRU:'أوق',
}

// ===== أنواع الحسابات =====
const ACCOUNT_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  asset:     { label: 'أصول',       color: S.green,  bg: 'rgba(34,197,94,0.12)',   icon: '🏦' },
  liability: { label: 'خصوم',       color: S.red,    bg: 'rgba(239,68,68,0.12)',   icon: '📋' },
  equity:    { label: 'حقوق ملكية', color: S.amber,  bg: 'rgba(245,158,11,0.12)', icon: '💼' },
  income:    { label: 'إيرادات',    color: S.blue,   bg: 'rgba(59,130,246,0.12)', icon: '📈' },
  expense:   { label: 'مصروفات',   color: S.red,    bg: 'rgba(239,68,68,0.12)',   icon: '📉' },
}

// ===== أنواع السندات =====
const VOUCHER_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  receipt: { label: 'سند قبض',  color: S.green, icon: '📥' },
  payment: { label: 'سند صرف',  color: S.red,   icon: '📤' },
  journal: { label: 'قيد يومية', color: S.blue,  icon: '📒' },
}

// ===== طرق الدفع =====
const PAYMENT_METHODS = ['نقداً', 'تحويل بنكي', 'شيك', 'بطاقة ائتمان', 'خطاب اعتماد', 'آجل']

// ===== style مشترك =====
const inp: React.CSSProperties = {
  width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
  borderRadius: '9px', padding: '10px 14px', fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

// ===== دوال مساعدة =====
function fmt(n: number, sym = '$') {
  return `${sym}${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function nextVoucherNumber(existing: any[]): string {
  const nums = existing
    .map(v => v.voucher_number)
    .filter(n => /^B-\d+$/.test(n))
    .map(n => parseInt(n.replace('B-', '')))
  const max = nums.length ? Math.max(...nums) : 0
  return `B-${String(max + 1).padStart(4, '0')}`
}

// ===================================================
// مكون اختيار العملة (شريط علوي ثابت)
// ===================================================
function CurrencyBar({ currency, setCurrency }: { currency: string; setCurrency: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const sym  = CURRENCY_SYMBOLS[currency] || currency
  const curr = CURRENCIES.find(c => c.value === currency)

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    if (!open) return
    function handleClick() { setOpen(false) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 8, background: S.gold3, border: `1px solid ${S.borderG}`, color: S.gold2, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 700 }}>
        <span style={{ fontSize: 10, color: S.muted }}>{open ? '▲' : '▼'}</span>
        <span>{curr?.label || currency}</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{sym}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 12, width: 300, maxHeight: 340, overflowY: 'auto', zIndex: 9999, boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
          {CURRENCIES.map(c => (
            <button key={c.id} onClick={() => { setCurrency(c.value); setOpen(false) }}
              style={{ width: '100%', padding: '10px 16px', background: currency === c.value ? S.gold3 : 'transparent', border: 'none', borderBottom: `1px solid ${S.border}`, color: currency === c.value ? S.gold2 : S.white, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
              <span>{c.label}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: S.gold, minWidth: 40, textAlign: 'right' }}>{CURRENCY_SYMBOLS[c.value] || c.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ===================================================
// الصفحة الرئيسية
// ===================================================
export default function AccountingPage() {
  const [tab, setTab]             = useState<'dashboard' | 'accounts' | 'vouchers' | 'reports'>('dashboard')
  const [accounts, setAccounts]   = useState<any[]>([])
  const [vouchers, setVouchers]   = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currency, setCurrency]   = useState('USD')  // العملة الافتراضية

  // ── Modal states ──
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [saving, setSaving]                   = useState(false)

  // ── نموذج الحساب ──
  const [accountForm, setAccountForm] = useState({
    account_code: '', account_name: '', account_type: 'asset',
    description: '', opening_balance: '0',
  })

  // ── نموذج السند ──
  const [voucherForm, setVoucherForm] = useState({
    voucher_type:   'receipt',
    voucher_number: 'B-0001',
    voucher_date:   new Date().toISOString().split('T')[0],
    account_id:     '',
    party_type:     'customer',
    party_id:       '',
    party_name:     '',
    amount:         '',
    currency:       currency,
    description:    '',
    payment_method: 'نقداً',
  })

  // ── تحميل البيانات ──
  const loadAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [accRes, vchRes, custRes, suppRes, settRes] = await Promise.all([
      supabase.from('accounts').select('*').order('account_code'),
      supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name, company_name').eq('created_by', user?.id).order('full_name'),
      supabase.from('suppliers').select('id, company_name').order('company_name'),
      supabase.from('company_settings').select('default_currency').limit(1).single(),
    ])
    setAccounts(accRes.data || [])
    setVouchers(vchRes.data || [])
    setCustomers(custRes.data || [])
    setSuppliers(suppRes.data || [])
    if (settRes.data?.default_currency) {
      setCurrency(settRes.data.default_currency)
    }
    // رقم السند التالي
    const nextNum = nextVoucherNumber(vchRes.data || [])
    setVoucherForm(prev => ({ ...prev, voucher_number: nextNum, currency }))
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── حفظ العملة في إعدادات الشركة ──
  async function saveCurrency(cur: string) {
    setCurrency(cur)
    setVoucherForm(prev => ({ ...prev, currency: cur }))
    const { data: existing } = await supabase.from('company_settings').select('id').limit(1).single()
    if (existing?.id) {
      await supabase.from('company_settings').update({ default_currency: cur }).eq('id', existing.id)
    } else {
      await supabase.from('company_settings').insert([{ default_currency: cur }])
    }
  }

  // ── حفظ حساب جديد ──
  async function handleSaveAccount() {
    if (!accountForm.account_code || !accountForm.account_name) { alert('أدخل الكود والاسم'); return }
    setSaving(true)
    const bal = parseFloat(accountForm.opening_balance) || 0
    const { error } = await supabase.from('accounts').insert([{
      ...accountForm, balance: bal, opening_balance: bal, currency,
    }])
    if (error) { alert('خطأ: ' + error.message) }
    else {
      setShowAccountForm(false)
      setAccountForm({ account_code: '', account_name: '', account_type: 'asset', description: '', opening_balance: '0' })
      await loadAll()
    }
    setSaving(false)
  }

  // ── حفظ سند جديد ──
  async function handleSaveVoucher() {
    if (!voucherForm.amount || !voucherForm.account_id) { alert('أدخل المبلغ والحساب'); return }
    setSaving(true)
    const amount = parseFloat(voucherForm.amount)

    // تحديث رصيد الحساب
    const acc = accounts.find(a => a.id === voucherForm.account_id)
    if (acc) {
      const newBal = voucherForm.voucher_type === 'receipt' ? acc.balance + amount : acc.balance - amount
      await supabase.from('accounts').update({ balance: newBal }).eq('id', acc.id)
    }

    // تحديد رقم السند التالي
    const nextNum = nextVoucherNumber(vouchers)

    const { error } = await supabase.from('vouchers').insert([{
      voucher_type:   voucherForm.voucher_type,
      voucher_number: voucherForm.voucher_number,
      voucher_date:   voucherForm.voucher_date,
      account_id:     voucherForm.account_id,
      party_type:     voucherForm.party_type,
      party_id:       voucherForm.party_id || null,
      party_name:     voucherForm.party_name,
      amount,
      currency:       voucherForm.currency,
      description:    voucherForm.description,
      payment_method: voucherForm.payment_method,
    }])

    if (error) { alert('خطأ: ' + error.message) }
    else {
      setShowVoucherForm(false)
      setVoucherForm(prev => ({ ...prev, amount: '', description: '', party_id: '', party_name: '', voucher_number: nextNum, currency }))
      await loadAll()
    }
    setSaving(false)
  }

  // ── الإحصائيات ──
  const totalAssets      = accounts.filter(a => a.account_type === 'asset').reduce((s, a) => s + (a.balance || 0), 0)
  const totalLiabilities = accounts.filter(a => a.account_type === 'liability').reduce((s, a) => s + (a.balance || 0), 0)
  const totalIncome      = accounts.filter(a => a.account_type === 'income').reduce((s, a) => s + (a.balance || 0), 0)
  const totalExpenses    = accounts.filter(a => a.account_type === 'expense').reduce((s, a) => s + (a.balance || 0), 0)
  const netProfit        = totalIncome - totalExpenses
  const receipts         = vouchers.filter(v => v.voucher_type === 'receipt').reduce((s, v) => s + (v.amount || 0), 0)
  const payments         = vouchers.filter(v => v.voucher_type === 'payment').reduce((s, v) => s + (v.amount || 0), 0)
  const profitColor      = netProfit > 0 ? S.green : netProfit < 0 ? S.red : S.amber

  // ── الحسابات المصفاة ──
  const filteredAccounts = accounts
    .filter(a => typeFilter === 'all' || a.account_type === typeFilter)
    .filter(a => a.account_name?.includes(search) || a.account_code?.includes(search))

  // ── رمز العملة الحالية ──
  const sym = CURRENCY_SYMBOLS[currency] || currency

  const TABS = [
    { key: 'dashboard', label: '📊 لوحة المالية' },
    { key: 'accounts',  label: '📁 دليل الحسابات' },
    { key: 'vouchers',  label: '📋 السندات' },
    { key: 'reports',   label: '📈 التقارير' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy }}>

      {/* شريط الأدوات */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.borderG}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { const n = nextVoucherNumber(vouchers); setVoucherForm(prev => ({ ...prev, voucher_number: n, currency })); setShowVoucherForm(true) }}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            + إضافة سند
          </button>
          <button onClick={() => setShowAccountForm(true)}
            style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            + إضافة حساب
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* اختيار العملة */}
          <CurrencyBar currency={currency} setCurrency={saveCurrency}/>
        </div>
      </div>

      {/* التبويبات */}
      <div style={{ display: 'flex', gap: 2, background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '12px 20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', borderBottom: tab === t.key ? `2px solid ${S.gold}` : '2px solid transparent', background: 'transparent', color: tab === t.key ? S.gold2 : S.muted, transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ══ لوحة المالية ══ */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* الإحصائيات الرئيسية */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'إجمالي الأصول',    val: fmt(totalAssets, sym),      color: S.green, icon: '🏦', sub: 'إجمالي الموجودات' },
                { label: 'إجمالي الخصوم',    val: fmt(totalLiabilities, sym),  color: S.red,   icon: '📋', sub: 'الالتزامات المستحقة' },
                { label: 'إجمالي الإيرادات', val: fmt(totalIncome, sym),       color: S.blue,  icon: '📈', sub: 'المبيعات والخدمات' },
                { label: 'إجمالي المصروفات', val: fmt(totalExpenses, sym),     color: S.amber, icon: '📉', sub: 'التكاليف والنفقات' },
              ].map((s, i) => (
                <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: S.muted, marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: S.muted, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* صافي الربح + التدفق + المعادلة */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

              {/* صافي الربح */}
              <div style={{ background: S.navy2, border: `2px solid ${profitColor}`, borderRadius: 14, padding: 20, boxShadow: `0 0 24px ${profitColor}22` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 12 }}>📊 صافي الربح / الخسارة</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: profitColor, lineHeight: 1, marginBottom: 8 }}>
                  {netProfit >= 0 ? '+' : ''}{fmt(netProfit, sym)}
                </div>
                <div style={{ fontSize: 11, color: profitColor, fontWeight: 700, marginBottom: 12 }}>
                  {netProfit > 0 ? '📈 ربح' : netProfit < 0 ? '📉 خسارة' : '⚖️ تعادل'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.green }}>+{fmt(totalIncome, sym)}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>الإيرادات</span>
                  </div>
                  <div style={{ height: 1, background: S.border }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.red }}>-{fmt(totalExpenses, sym)}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>المصروفات</span>
                  </div>
                </div>
              </div>

              {/* التدفق النقدي */}
              <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 12 }}>💵 التدفق النقدي</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: S.muted, marginBottom: 3 }}>📥 سندات القبض</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.green }}>{fmt(receipts, sym)}</div>
                    <div style={{ fontSize: 10, color: S.muted }}>{vouchers.filter(v => v.voucher_type === 'receipt').length} سند</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: S.muted, marginBottom: 3 }}>📤 سندات الصرف</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.red }}>{fmt(payments, sym)}</div>
                    <div style={{ fontSize: 10, color: S.muted }}>{vouchers.filter(v => v.voucher_type === 'payment').length} سند</div>
                  </div>
                </div>
              </div>

              {/* المعادلة المحاسبية */}
              <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 12 }}>⚖️ المعادلة المحاسبية</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>الأصول</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.green }}>{fmt(totalAssets, sym)}</div>
                  </div>
                  <div style={{ textAlign: 'center', color: S.gold, fontWeight: 700, fontSize: 16 }}>=</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ textAlign: 'center', background: S.card, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 10, color: S.muted }}>الخصوم</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.red }}>{fmt(totalLiabilities, sym)}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: S.card, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 10, color: S.muted }}>حقوق الملكية</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.amber }}>{fmt(Math.max(0, totalAssets - totalLiabilities), sym)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* آخر السندات */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: S.white, marginBottom: 14 }}>🕐 آخر السندات المسجلة</div>
              {vouchers.length === 0 ? (
                <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13 }}>لا توجد سندات بعد</div>
              ) : vouchers.slice(0, 6).map((v, i) => {
                const vt = VOUCHER_TYPES[v.voucher_type] || VOUCHER_TYPES.journal
                const vSym = CURRENCY_SYMBOLS[v.currency] || sym
                return (
                  <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? `1px solid ${S.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: S.muted }}>{v.voucher_date ? new Date(v.voucher_date).toLocaleDateString('ar-EG') : ''}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${vt.color}18`, color: vt.color, fontWeight: 700 }}>{vt.icon} {vt.label}</span>
                      <span style={{ fontSize: 10, color: S.muted, fontFamily: 'monospace' }}>{v.voucher_number}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{v.description || v.party_name || '—'}</div>
                      {v.payment_method && <div style={{ fontSize: 10, color: S.muted }}>{v.payment_method}</div>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: v.voucher_type === 'receipt' ? S.green : S.red }}>
                      {v.voucher_type === 'receipt' ? '+' : '-'}{fmt(v.amount || 0, vSym)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ دليل الحسابات ══ */}
        {tab === 'accounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 ابحث بالاسم أو الكود..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200, background: S.navy2 }}/>
              <div style={{ display: 'flex', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {[{ key: 'all', label: 'الكل' }, ...Object.entries(ACCOUNT_TYPES).map(([k, v]) => ({ key: k, label: v.icon + ' ' + v.label }))].map(t => (
                  <button key={t.key} onClick={() => setTypeFilter(t.key)}
                    style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: typeFilter === t.key ? S.gold : 'transparent', color: typeFilter === t.key ? S.navy : S.muted, transition: 'all .15s', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ملخص بالأنواع */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
              {Object.entries(ACCOUNT_TYPES).map(([key, t]) => {
                const accs = accounts.filter(a => a.account_type === key)
                const total = accs.reduce((s, a) => s + (a.balance || 0), 0)
                return (
                  <div key={key} onClick={() => setTypeFilter(key)}
                    style={{ background: typeFilter === key ? `${t.color}15` : S.navy2, border: `1px solid ${typeFilter === key ? t.color : S.border}`, borderRadius: 12, padding: 14, cursor: 'pointer', textAlign: 'right', transition: 'all .2s' }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{fmt(total, sym)}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{t.label} ({accs.length})</div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                    {['الكود', 'اسم الحساب', 'النوع', 'الرصيد الافتتاحي', 'الرصيد الحالي', 'الوصف'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: S.muted }}>جاري التحميل...</td></tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: S.muted }}>لا توجد حسابات</td></tr>
                  ) : filteredAccounts.map((a, i) => {
                    const t = ACCOUNT_TYPES[a.account_type] || ACCOUNT_TYPES.asset
                    const aSym = CURRENCY_SYMBOLS[a.currency] || sym
                    return (
                      <tr key={a.id} style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 14px', color: S.gold, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{a.account_code}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{t.icon} {a.account_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: t.bg, color: t.color, fontWeight: 700 }}>{t.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: S.muted, fontFamily: 'monospace' }}>{fmt(a.opening_balance || 0, aSym)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: a.balance >= 0 ? S.green : S.red, fontFamily: 'monospace' }}>{fmt(a.balance || 0, aSym)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted, maxWidth: 180 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description || '—'}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ السندات ══ */}
        {tab === 'vouchers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {Object.entries(VOUCHER_TYPES).map(([key, t]) => {
                const vList = vouchers.filter(v => v.voucher_type === key)
                const total = vList.reduce((s, v) => s + (v.amount || 0), 0)
                return (
                  <div key={key} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: t.color, marginBottom: 4 }}>{fmt(total, sym)}</div>
                    <div style={{ fontSize: 11, color: S.muted }}>{t.label} — {vList.length} سند</div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                    {['رقم السند', 'النوع', 'التاريخ', 'الطرف الآخر', 'المبلغ', 'العملة', 'طريقة الدفع', 'البيان'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vouchers.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: S.muted }}>لا توجد سندات بعد</td></tr>
                  ) : vouchers.map((v, i) => {
                    const vt = VOUCHER_TYPES[v.voucher_type] || VOUCHER_TYPES.journal
                    const vSym = CURRENCY_SYMBOLS[v.currency] || sym
                    return (
                      <tr key={v.id} style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 14px', color: S.gold, fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{v.voucher_number}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${vt.color}18`, color: vt.color, fontWeight: 700 }}>{vt.icon} {vt.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: S.muted }}>{v.voucher_date ? new Date(v.voucher_date).toLocaleDateString('ar-EG') : '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>{v.party_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: v.voucher_type === 'receipt' ? S.green : S.red, fontFamily: 'monospace' }}>
                          {v.voucher_type === 'receipt' ? '+' : '-'}{fmt(v.amount || 0, vSym)}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 6, background: S.card2, color: S.gold, fontSize: 10, fontWeight: 700 }}>{v.currency || currency}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted }}>{v.payment_method || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted, maxWidth: 150 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.description || '—'}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ التقارير ══ */}
        {tab === 'reports' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* قائمة الدخل */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: S.white, marginBottom: 16, textAlign: 'right' }}>📊 قائمة الدخل</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* إجمالي الإيرادات */}
                     <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, textAlign: 'right' }}>
                       <span style={{ fontSize: 12, color: S.white, fontWeight: 600 }}>إجمالي الإيرادات</span>
                       <span style={{ fontSize: 16, fontWeight: 800, color: S.blue }}>{fmt(totalIncome, sym)}</span>
                      </div>
                            {accounts.filter(a => a.account_type === 'income').map(a => (
                      <div key={a.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '5px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: S.muted }}>{a.account_name}</span>
                        <span style={{ fontSize: 13, color: S.green, fontFamily: 'monospace' }}>{fmt(a.balance || 0, sym)}</span>
                      </div>
                      ))}

  <div style={{ height: 1, background: S.border, margin: '4px 0' }}/>

{/* إجمالي المصروفات */}
<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, textAlign: 'right' }}>
  <span style={{ fontSize: 12, color: S.white, fontWeight: 600 }}>إجمالي المصروفات</span>
  <span style={{ fontSize: 16, fontWeight: 800, color: S.red }}>{fmt(totalExpenses, sym)}</span>
</div>

{accounts.filter(a => a.account_type === 'expense').map(a => (
  <div key={a.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '5px 12px', textAlign: 'right' }}>
    <span style={{ fontSize: 11, color: S.muted }}>{a.account_name}</span>
    <span style={{ fontSize: 13, color: S.red, fontFamily: 'monospace' }}>{fmt(a.balance || 0, sym)}</span>
  </div>
))}

                <div style={{ height: 2, background: S.border, margin: '4px 0' }}/>

                {/* صافي الربح */}
<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '14px 16px', background: `${profitColor}18`, borderRadius: 10, border: `1px solid ${profitColor}40`, textAlign: 'right' }}>
  <span style={{ fontSize: 13, fontWeight: 700, color: profitColor }}>
    {netProfit > 0 ? '📈 صافي ربح' : netProfit < 0 ? '📉 صافي خسارة' : '⚖️ تعادل'}
  </span>
  <span style={{ fontSize: 20, fontWeight: 900, color: profitColor, fontFamily: 'monospace' }}>
    {netProfit >= 0 ? '+' : ''}{fmt(netProfit, sym)}
  </span>
</div>
              </div>
            </div>

            {/* الميزانية العمومية */}
<div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
  <div style={{ fontSize: 14, fontWeight: 800, color: S.white, marginBottom: 16, textAlign: 'right' }}>⚖️ الميزانية العمومية</div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

    <div style={{ fontSize: 11, fontWeight: 700, color: S.green, textAlign: 'right', marginBottom: 2 }}>الأصول</div>

    {accounts.filter(a => a.account_type === 'asset').map(a => (
      <div key={a.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '5px 12px', background: S.card, borderRadius: 6, textAlign: 'right' }}>
        <span style={{ fontSize: 11, color: S.muted }}>{a.account_code} — {a.account_name}</span>
        <span style={{ fontSize: 13, color: S.green, fontFamily: 'monospace' }}>{fmt(a.balance || 0, sym)}</span>
      </div>
    ))}

    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, textAlign: 'right' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>إجمالي الأصول</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: S.green, fontFamily: 'monospace' }}>{fmt(totalAssets, sym)}</span>
    </div>
<div style={{ height: 1, background: S.border, margin: '4px 0' }}/>

<div style={{ fontSize: 11, fontWeight: 700, color: S.amber, textAlign: 'right', marginBottom: 2 }}>الخصوم وحقوق الملكية</div>

{accounts.filter(a => ['liability', 'equity'].includes(a.account_type)).map(a => (
  <div key={a.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '5px 12px', background: S.card, borderRadius: 6, textAlign: 'right' }}>
    <span style={{ fontSize: 11, color: S.muted }}>{a.account_code} — {a.account_name}</span>
    <span style={{ fontSize: 13, color: S.amber, fontFamily: 'monospace' }}>{fmt(a.balance || 0, sym)}</span>
  </div>
))}

<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, textAlign: 'right' }}>
  <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>إجمالي الخصوم + حقوق الملكية</span>
  <span style={{ fontSize: 16, fontWeight: 800, color: S.amber, fontFamily: 'monospace' }}>
    {fmt(totalLiabilities + Math.max(0, totalAssets - totalLiabilities), sym)}
  </span>
</div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ══ Modal إضافة حساب ══ */}
      {showAccountForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 520, borderRadius: 20, padding: 28, border: `1px solid ${S.borderG}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <button onClick={() => setShowAccountForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 16, fontWeight: 800, color: S.gold2 }}>📁 إضافة حساب جديد</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>كود الحساب *</label>
                <input type="text" placeholder="مثال: 1101" value={accountForm.account_code}
                  onChange={e => setAccountForm({ ...accountForm, account_code: e.target.value })} style={inp}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>اسم الحساب *</label>
                <input type="text" placeholder="اسم الحساب" value={accountForm.account_name}
                  onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })} style={inp}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>نوع الحساب</label>
                <select value={accountForm.account_type}
                  onChange={e => setAccountForm({ ...accountForm, account_type: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: S.navy2 }}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الرصيد الافتتاحي ({sym})</label>
                <input type="number" placeholder="0.00" value={accountForm.opening_balance}
                  onChange={e => setAccountForm({ ...accountForm, opening_balance: e.target.value })} style={inp}/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الوصف</label>
                <input type="text" placeholder="وصف مختصر..." value={accountForm.description}
                  onChange={e => setAccountForm({ ...accountForm, description: e.target.value })} style={inp}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAccountForm(false)}
                style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={handleSaveAccount} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الحساب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal إضافة سند ══ */}
      {showVoucherForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 580, borderRadius: 20, padding: 28, border: `1px solid ${S.borderG}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => setShowVoucherForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 16, fontWeight: 800, color: S.gold2 }}>📋 إضافة سند مالي</div>
            </div>

            {/* رقم السند */}
            <div style={{ background: S.gold3, border: `1px solid ${S.borderG}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: S.gold2, fontFamily: 'monospace' }}>{voucherForm.voucher_number}</span>
              <span style={{ fontSize: 11, color: S.muted }}>رقم السند (تلقائي)</span>
            </div>

            {/* نوع السند */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'flex-end' }}>
              {Object.entries(VOUCHER_TYPES).map(([key, t]) => (
                <button key={key} onClick={() => setVoucherForm({ ...voucherForm, voucher_type: key })}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${voucherForm.voucher_type === key ? t.color : S.border}`, background: voucherForm.voucher_type === key ? `${t.color}18` : 'transparent', color: voucherForm.voucher_type === key ? t.color : S.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>التاريخ</label>
                <input type="date" value={voucherForm.voucher_date}
                  onChange={e => setVoucherForm({ ...voucherForm, voucher_date: e.target.value })}
                  style={{ ...inp, colorScheme: 'dark' as any }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>العملة</label>
                <select value={voucherForm.currency}
                  onChange={e => setVoucherForm({ ...voucherForm, currency: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  {CURRENCIES.map(c => (
                    <option key={c.id} value={c.value} style={{ background: S.navy2 }}>
                      {CURRENCY_SYMBOLS[c.value] || c.value} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الحساب المتأثر *</label>
                <select value={voucherForm.account_id}
                  onChange={e => setVoucherForm({ ...voucherForm, account_id: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">اختر الحساب...</option>
                  {accounts.map(a => {
                    const aSym = CURRENCY_SYMBOLS[a.currency] || sym
                    return (
                      <option key={a.id} value={a.id} style={{ background: S.navy2 }}>
                        {a.account_code} — {a.account_name} ({fmt(a.balance || 0, aSym)})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* الطرف الآخر */}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الطرف الآخر</label>
                <select value={voucherForm.party_type}
                  onChange={e => setVoucherForm({ ...voucherForm, party_type: e.target.value, party_id: '', party_name: '' })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="customer" style={{ background: S.navy2 }}>عميل</option>
                  <option value="supplier" style={{ background: S.navy2 }}>مورد</option>
                  <option value="other"    style={{ background: S.navy2 }}>طرف آخر</option>
                </select>
              </div>
              <div>
                {voucherForm.party_type === 'customer' ? (
                  <>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>اختر العميل</label>
                    <select value={voucherForm.party_id}
                      onChange={e => {
                        const c = customers.find(x => x.id === e.target.value)
                        setVoucherForm({ ...voucherForm, party_id: e.target.value, party_name: c?.full_name || c?.company_name || '' })
                      }} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">اختر...</option>
                      {customers.map(c => <option key={c.id} value={c.id} style={{ background: S.navy2 }}>{c.full_name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
                    </select>
                  </>
                ) : voucherForm.party_type === 'supplier' ? (
                  <>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>اختر المورد</label>
                    <select value={voucherForm.party_id}
                      onChange={e => {
                        const s = suppliers.find(x => x.id === e.target.value)
                        setVoucherForm({ ...voucherForm, party_id: e.target.value, party_name: s?.company_name || '' })
                      }} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">اختر...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id} style={{ background: S.navy2 }}>{s.company_name}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>اسم الطرف</label>
                    <input type="text" placeholder="اسم الجهة أو الشخص" value={voucherForm.party_name}
                      onChange={e => setVoucherForm({ ...voucherForm, party_name: e.target.value })} style={inp}/>
                  </>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: voucherForm.voucher_type === 'receipt' ? S.green : S.red, fontWeight: 700, marginBottom: 6 }}>
                  المبلغ ({CURRENCY_SYMBOLS[voucherForm.currency] || voucherForm.currency}) *
                </label>
                <input type="number" placeholder="0.00" value={voucherForm.amount}
                  onChange={e => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                  style={{ ...inp, fontSize: 16, fontWeight: 700, color: voucherForm.voucher_type === 'receipt' ? S.green : S.red, border: `1px solid ${voucherForm.voucher_type === 'receipt' ? S.green : S.red}44` }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>طريقة الدفع</label>
                <select value={voucherForm.payment_method}
                  onChange={e => setVoucherForm({ ...voucherForm, payment_method: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m} style={{ background: S.navy2 }}>{m}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>البيان / الوصف</label>
                <input type="text" placeholder="وصف العملية المالية..." value={voucherForm.description}
                  onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })} style={inp}/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowVoucherForm(false)}
                style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={handleSaveVoucher} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '⏳ جاري الحفظ...' : `💾 حفظ ${VOUCHER_TYPES[voucherForm.voucher_type]?.label || 'السند'}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
