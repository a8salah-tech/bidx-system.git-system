'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AppShell from "../components/AppShell";
// ===== نظام الألوان =====
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
  purple:  '#8B5CF6',
  card:    'rgba(255,255,255,0.04)',
  card2:   'rgba(255,255,255,0.08)',
}

// ===== أنواع الحسابات =====
const ACCOUNT_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  asset:     { label: 'أصول',        color: S.green,  bg: 'rgba(34,197,94,0.12)',   icon: '🏦' },
  liability: { label: 'خصوم',        color: S.red,    bg: 'rgba(239,68,68,0.12)',   icon: '📋' },
  equity:    { label: 'حقوق ملكية',  color: S.amber,  bg: 'rgba(245,158,11,0.12)', icon: '💼' },
  income:    { label: 'إيرادات',     color: S.blue,   bg: 'rgba(59,130,246,0.12)', icon: '📈' },
  expense:   { label: 'مصروفات',    color: S.red,    bg: 'rgba(239,68,68,0.12)',   icon: '📉' },
}

// ===== أنواع السندات =====
const VOUCHER_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  receipt:  { label: 'سند قبض',  color: S.green,  icon: '📥' },
  payment:  { label: 'سند صرف',  color: S.red,    icon: '📤' },
  journal:  { label: 'قيد يومية', color: S.blue,   icon: '📒' },
}

// ===== style مشترك =====
const inp: React.CSSProperties = {
  width: '100%', background: S.navy3,
  border: `1px solid ${S.border}`,
  borderRadius: '9px', padding: '10px 14px',
  fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

// ===== دالة تنسيق المبلغ =====
function fmt(n: number) {
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ===================================================
// المكون الرئيسي
// ===================================================
export default function AccountingPage() {

  const [tab, setTab]           = useState<'dashboard' | 'accounts' | 'vouchers' | 'reports'>('dashboard')
  const [accounts, setAccounts] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // ── Modal states ──
  const [showAccountForm, setShowAccountForm]   = useState(false)
  const [showVoucherForm, setShowVoucherForm]   = useState(false)
  const [saving, setSaving]                     = useState(false)

  // ── نموذج الحساب ──
  const [accountForm, setAccountForm] = useState({
    account_code: '', account_name: '', account_type: 'asset',
    description: '', opening_balance: '0',
  })

  // ── نموذج السند ──
  const [voucherForm, setVoucherForm] = useState({
    voucher_type: 'receipt',
    voucher_number: '',
    voucher_date: new Date().toISOString().split('T')[0],
    account_id: '',
    party_type: 'customer',  // customer | supplier | other
    party_id: '',
    party_name: '',
    amount: '',
    description: '',
    payment_method: 'cash',
  })

  // ── تحميل البيانات ──
  useEffect(() => {
    loadAll()
    // رقم السند التلقائي
    const vNum = `V-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    setVoucherForm(prev => ({ ...prev, voucher_number: vNum }))
  }, [])

  async function loadAll() {
    setLoading(true)
    const [accRes, vchRes, custRes, suppRes] = await Promise.all([
      supabase.from('accounts').select('*').order('account_code'),
      supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, full_name, company_name').order('full_name'),
      supabase.from('suppliers').select('id, company_name').order('company_name'),
    ])
    setAccounts(accRes.data || [])
    setVouchers(vchRes.data || [])
    setCustomers(custRes.data || [])
    setSuppliers(suppRes.data || [])
    setLoading(false)
  }

  // ── حفظ حساب جديد ──
  async function handleSaveAccount() {
    if (!accountForm.account_code || !accountForm.account_name) { alert('أدخل الكود والاسم'); return }
    setSaving(true)
    const { error } = await supabase.from('accounts').insert([{
      ...accountForm,
      balance: parseFloat(accountForm.opening_balance) || 0,
      opening_balance: parseFloat(accountForm.opening_balance) || 0,
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
      const newBalance = voucherForm.voucher_type === 'receipt'
        ? acc.balance + amount
        : acc.balance - amount
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', acc.id)
    }

    const { error } = await supabase.from('vouchers').insert([{
      voucher_type:   voucherForm.voucher_type,
      voucher_number: voucherForm.voucher_number,
      voucher_date:   voucherForm.voucher_date,
      account_id:     voucherForm.account_id,
      party_type:     voucherForm.party_type,
      party_id:       voucherForm.party_id || null,
      party_name:     voucherForm.party_name,
      amount,
      description:    voucherForm.description,
      payment_method: voucherForm.payment_method,
    }])

    if (error) { alert('خطأ: ' + error.message) }
    else {
      setShowVoucherForm(false)
      const vNum = `V-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
      setVoucherForm(prev => ({ ...prev, amount: '', description: '', party_id: '', party_name: '', voucher_number: vNum }))
      await loadAll()
    }
    setSaving(false)
  }

  // ── الحسابات المصفاة ──
  const filteredAccounts = accounts
    .filter(a => typeFilter === 'all' || a.account_type === typeFilter)
    .filter(a => a.account_name?.includes(search) || a.account_code?.includes(search))

  // ── الإحصائيات ──
  const totalAssets      = accounts.filter(a => a.account_type === 'asset').reduce((s, a) => s + (a.balance || 0), 0)
  const totalLiabilities = accounts.filter(a => a.account_type === 'liability').reduce((s, a) => s + (a.balance || 0), 0)
  const totalIncome      = accounts.filter(a => a.account_type === 'income').reduce((s, a) => s + (a.balance || 0), 0)
  const totalExpenses    = accounts.filter(a => a.account_type === 'expense').reduce((s, a) => s + (a.balance || 0), 0)
  const netProfit        = totalIncome - totalExpenses
  const receipts         = vouchers.filter(v => v.voucher_type === 'receipt').reduce((s, v) => s + (v.amount || 0), 0)
  const payments         = vouchers.filter(v => v.voucher_type === 'payment').reduce((s, v) => s + (v.amount || 0), 0)

  const profitColor = netProfit > 0 ? S.green : netProfit < 0 ? S.red : S.amber

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowVoucherForm(true)}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            + إضافة سند
          </button>
          <button onClick={() => setShowAccountForm(true)}
            style={{ background: 'rgba(232,201,122,0.1)', color: S.gold2, border: `1px solid ${S.gold}`, padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + إضافة حساب
          </button>
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
                { label: 'إجمالي الأصول',   val: `$${fmt(totalAssets)}`,      color: S.green, icon: '🏦', sub: 'إجمالي الموجودات' },
                { label: 'إجمالي الخصوم',   val: `$${fmt(totalLiabilities)}`,  color: S.red,   icon: '📋', sub: 'الالتزامات المستحقة' },
                { label: 'إجمالي الإيرادات', val: `$${fmt(totalIncome)}`,       color: S.blue,  icon: '📈', sub: 'المبيعات والخدمات' },
                { label: 'إجمالي المصروفات', val: `$${fmt(totalExpenses)}`,     color: S.amber, icon: '📉', sub: 'التكاليف والنفقات' },
              ].map((s, i) => (
                <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: S.muted, marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: S.muted, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* صافي الربح + التدفق النقدي */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

              {/* صافي الربح/الخسارة */}
              <div style={{ background: S.navy2, border: `2px solid ${profitColor}`, borderRadius: 14, padding: 20, boxShadow: `0 0 24px ${profitColor}22` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 12 }}>📊 صافي الربح / الخسارة</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: profitColor, lineHeight: 1, marginBottom: 8 }}>
                  {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}$
                </div>
                <div style={{ fontSize: 11, color: profitColor, fontWeight: 700 }}>
                  {netProfit > 0 ? '📈 ربح' : netProfit < 0 ? '📉 خسارة' : '⚖️ تعادل'}
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.green }}>+{fmt(totalIncome)}$</span>
                    <span style={{ fontSize: 11, color: S.muted }}>الإيرادات</span>
                  </div>
                  <div style={{ height: 1, background: S.border }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.red }}>-{fmt(totalExpenses)}$</span>
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
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.green }}>${fmt(receipts)}</div>
                    <div style={{ fontSize: 10, color: S.muted }}>{vouchers.filter(v => v.voucher_type === 'receipt').length} سند</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: S.muted, marginBottom: 3 }}>📤 سندات الصرف</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.red }}>${fmt(payments)}</div>
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
                    <div style={{ fontSize: 18, fontWeight: 800, color: S.green }}>${fmt(totalAssets)}</div>
                  </div>
                  <div style={{ textAlign: 'center', color: S.gold, fontWeight: 700, fontSize: 16 }}>=</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ textAlign: 'center', background: S.card, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 10, color: S.muted }}>الخصوم</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.red }}>${fmt(totalLiabilities)}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: S.card, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 10, color: S.muted }}>حقوق الملكية</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.amber }}>${fmt(Math.max(0, totalAssets - totalLiabilities))}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* آخر السندات */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: S.white, marginBottom: 14 }}>🕐 آخر السندات المسجلة</div>
              {vouchers.length === 0 ? (
                <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13 }}>لا توجد سندات بعد — ابدأ بإضافة سند جديد</div>
              ) : vouchers.slice(0, 5).map((v, i) => {
                const vt = VOUCHER_TYPES[v.voucher_type] || VOUCHER_TYPES.journal
                return (
                  <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${S.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>
                        {v.voucher_date ? new Date(v.voucher_date).toLocaleDateString('ar-EG') : ''}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${vt.color}18`, color: vt.color, fontWeight: 700 }}>
                        {vt.icon} {vt.label}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.white }}>{v.description || v.party_name || '—'}</div>
                      <div style={{ fontSize: 11, color: S.muted }}>{v.voucher_number}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: v.voucher_type === 'receipt' ? S.green : S.red }}>
                      {v.voucher_type === 'receipt' ? '+' : '-'}${fmt(v.amount || 0)}
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

            {/* فلاتر */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 ابحث بالاسم أو الكود..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inp, flex: 1, minWidth: 200, background: S.navy2 }}/>
              <div style={{ display: 'flex', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {[{ key: 'all', label: 'الكل' }, ...Object.entries(ACCOUNT_TYPES).map(([k, v]) => ({ key: k, label: v.icon + ' ' + v.label }))].map(t => (
                  <button key={t.key} onClick={() => setTypeFilter(t.key)}
                    style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: typeFilter === t.key ? S.gold : 'transparent', color: typeFilter === t.key ? S.navy : S.muted, transition: 'all .15s', whiteSpace: 'nowrap' }}>
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
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.color }}>${fmt(total)}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{t.label} ({accs.length})</div>
                  </div>
                )
              })}
            </div>

            {/* الجدول */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                    {['الكود', 'اسم الحساب', 'النوع', 'الرصيد الافتتاحي', 'الرصيد الحالي', 'الوصف'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700, letterSpacing: '.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>جاري التحميل...</td></tr>
                  ) : filteredAccounts.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>لا توجد حسابات — أضف حساباً من الزر أعلى</td></tr>
                  ) : filteredAccounts.map((a, i) => {
                    const t = ACCOUNT_TYPES[a.account_type] || ACCOUNT_TYPES.asset
                    return (
                      <tr key={a.id} style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 14px', color: S.gold, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{a.account_code}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, fontFamily: 'Tajawal, sans-serif' }}>{t.icon} {a.account_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: t.bg, color: t.color, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{t.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, color: S.muted, fontFamily: 'monospace' }}>${fmt(a.opening_balance || 0)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: a.balance >= 0 ? S.green : S.red, fontFamily: 'monospace' }}>${fmt(a.balance || 0)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted, maxWidth: 180, fontFamily: 'Tajawal, sans-serif' }}>
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

            {/* الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {Object.entries(VOUCHER_TYPES).map(([key, t]) => {
                const vList = vouchers.filter(v => v.voucher_type === key)
                const total = vList.reduce((s, v) => s + (v.amount || 0), 0)
                return (
                  <div key={key} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: t.color, marginBottom: 4 }}>${fmt(total)}</div>
                    <div style={{ fontSize: 11, color: S.muted }}>{t.label} — {vList.length} سند</div>
                  </div>
                )
              })}
            </div>

            {/* جدول السندات */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${S.border}` }}>
                    {['رقم السند', 'النوع', 'التاريخ', 'الطرف الآخر', 'المبلغ', 'طريقة الدفع', 'البيان'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '10px', color: S.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vouchers.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>لا توجد سندات — أضف سنداً من الزر أعلى</td></tr>
                  ) : vouchers.map((v, i) => {
                    const vt = VOUCHER_TYPES[v.voucher_type] || VOUCHER_TYPES.journal
                    return (
                      <tr key={v.id} style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px 14px', color: S.gold, fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{v.voucher_number}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${vt.color}18`, color: vt.color, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{vt.icon} {vt.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>
                          {v.voucher_date ? new Date(v.voucher_date).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>{v.party_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: v.voucher_type === 'receipt' ? S.green : S.red, fontFamily: 'monospace' }}>
                          {v.voucher_type === 'receipt' ? '+' : '-'}${fmt(v.amount || 0)}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{v.payment_method || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: S.muted, maxWidth: 150, fontFamily: 'Tajawal, sans-serif' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: S.blue }}>${fmt(totalIncome)}</span>
                  <span style={{ fontSize: 12, color: S.white, fontWeight: 600 }}>إجمالي الإيرادات</span>
                </div>
                {accounts.filter(a => a.account_type === 'income').map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px' }}>
                    <span style={{ fontSize: 13, color: S.green }}>${fmt(a.balance || 0)}</span>
                    <span style={{ fontSize: 12, color: S.muted }}>{a.account_name}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: S.border, margin: '4px 0' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: S.red }}>${fmt(totalExpenses)}</span>
                  <span style={{ fontSize: 12, color: S.white, fontWeight: 600 }}>إجمالي المصروفات</span>
                </div>
                {accounts.filter(a => a.account_type === 'expense').map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px' }}>
                    <span style={{ fontSize: 13, color: S.red }}>${fmt(a.balance || 0)}</span>
                    <span style={{ fontSize: 12, color: S.muted }}>{a.account_name}</span>
                  </div>
                ))}
                <div style={{ height: 2, background: S.border, margin: '4px 0' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: `${profitColor}18`, borderRadius: 10, border: `1px solid ${profitColor}40` }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: profitColor }}>
                    {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}$
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: profitColor }}>
                    {netProfit > 0 ? '📈 صافي ربح' : netProfit < 0 ? '📉 صافي خسارة' : '⚖️ تعادل'}
                  </span>
                </div>
              </div>
            </div>

            {/* الميزانية العمومية */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: S.white, marginBottom: 16, textAlign: 'right' }}>⚖️ الميزانية العمومية</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.green, textAlign: 'right', marginBottom: 4 }}>الأصول</div>
                {accounts.filter(a => a.account_type === 'asset').map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: S.card, borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: S.green }}>${fmt(a.balance || 0)}</span>
                    <span style={{ fontSize: 12, color: S.muted }}>{a.account_code} — {a.account_name}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: S.green }}>${fmt(totalAssets)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>إجمالي الأصول</span>
                </div>
                <div style={{ height: 1, background: S.border, margin: '8px 0' }}/>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.red, textAlign: 'right', marginBottom: 4 }}>الخصوم وحقوق الملكية</div>
                {accounts.filter(a => ['liability','equity'].includes(a.account_type)).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: S.card, borderRadius: 6 }}>
                    <span style={{ fontSize: 13, color: S.amber }}>${fmt(a.balance || 0)}</span>
                    <span style={{ fontSize: 12, color: S.muted }}>{a.account_code} — {a.account_name}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: S.amber }}>${fmt(totalLiabilities + Math.max(0, totalAssets - totalLiabilities))}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>إجمالي الخصوم + حقوق الملكية</span>
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
                <input type="text" placeholder="1101" value={accountForm.account_code}
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
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الرصيد الافتتاحي ($)</label>
                <input type="number" placeholder="0.00" value={accountForm.opening_balance}
                  onChange={e => setAccountForm({ ...accountForm, opening_balance: e.target.value })} style={inp}/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الوصف</label>
                <input type="text" placeholder="وصف مختصر للحساب..." value={accountForm.description}
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
          <div style={{ background: S.navy2, width: '100%', maxWidth: 560, borderRadius: 20, padding: 28, border: `1px solid ${S.borderG}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <button onClick={() => setShowVoucherForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 16, fontWeight: 800, color: S.gold2 }}>📋 إضافة سند مالي</div>
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
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>رقم السند</label>
                <input type="text" value={voucherForm.voucher_number}
                  onChange={e => setVoucherForm({ ...voucherForm, voucher_number: e.target.value })} style={inp}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>التاريخ</label>
                <input type="date" value={voucherForm.voucher_date}
                  onChange={e => setVoucherForm({ ...voucherForm, voucher_date: e.target.value })}
                  style={{ ...inp, colorScheme: 'dark' as any }}/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>الحساب المتأثر *</label>
                <select value={voucherForm.account_id}
                  onChange={e => setVoucherForm({ ...voucherForm, account_id: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">اختر الحساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} style={{ background: S.navy2 }}>
                      {a.account_code} — {a.account_name} (${fmt(a.balance || 0)})
                    </option>
                  ))}
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
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>المبلغ ($) *</label>
                <input type="number" placeholder="0.00" value={voucherForm.amount}
                  onChange={e => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                  style={{ ...inp, fontSize: 16, fontWeight: 700, color: voucherForm.voucher_type === 'receipt' ? S.green : S.red }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6 }}>طريقة الدفع</label>
                <select value={voucherForm.payment_method}
                  onChange={e => setVoucherForm({ ...voucherForm, payment_method: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  {['نقداً', 'تحويل بنكي', 'شيك', 'بطاقة', 'خطاب اعتماد', 'آجل'].map(m => (
                    <option key={m} value={m} style={{ background: S.navy2 }}>{m}</option>
                  ))}
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
