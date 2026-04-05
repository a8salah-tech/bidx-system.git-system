'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from "../components/AppShell";
import { supabase } from '../../lib/supabase'

// ===== تعريف نوع بيانات الحساب =====
interface Account {
  id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  balance: number
  description: string
  created_at: string
}

// ===== نظام الألوان الموحد Bridge Edge =====
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
}

const TYPE_MAP = {
  asset:     { label: 'أصول',       color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  liability: { label: 'خصوم',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  equity:    { label: 'حقوق ملكية', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  income:    { label: 'إيرادات',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  expense:   { label: 'مصروفات',    color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // نماذج الإدخال
  const [accountForm, setAccountForm] = useState({ account_code: '', account_name: '', account_type: 'asset', description: '' })

  useEffect(() => { fetchAccounts() }, [])

  // جلب الحسابات من Supabase
  async function fetchAccounts() {
    setLoading(true)
    const { data, error } = await supabase.from('accounts').select('*').order('account_code', { ascending: true })
    if (!error) setAccounts(data || [])
    setLoading(false)
  }

  // حفظ حساب جديد في الدليل
  async function handleSaveAccount() {
    if (!accountForm.account_code || !accountForm.account_name) {
      alert('برجاء ملء الكود والاسم');
      return;
    }
    setSaving(true)
    const { error } = await supabase.from('accounts').insert([{ ...accountForm, balance: 0 }])
    if (!error) {
      setShowAccountForm(false)
      setAccountForm({ account_code: '', account_name: '', account_type: 'asset', description: '' })
      fetchAccounts()
    } else {
      alert('خطأ في الحفظ: ' + error.message)
    }
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: S.white,
    outline: 'none', fontFamily: 'inherit', direction: 'rtl'
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
        
        {/* شريط الأدوات العلوي */}
        <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowVoucherForm(true)} style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>+ إضافة سند</button>
            <button onClick={() => setShowAccountForm(true)} style={{ background: 'rgba(255,255,255,0.05)', color: S.white, border: `1px solid ${S.border}`, padding: '9px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>إضافة حساب</button>
          </div>
          <div style={{ color: S.gold, fontWeight: 800, fontSize: '18px' }}>إدارة الحسابات والتدفقات</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* كروت الإحصائيات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'إجمالي السيولة', val: accounts.filter(a => a.account_type === 'asset').reduce((sum, a) => sum + a.balance, 0), color: S.gold },
              { label: 'سندات القبض', val: '0 سند', color: S.green },
              { label: 'سندات الصرف', val: '0 سند', color: S.amber },
              { label: 'صافي التدفق', val: '$0', color: S.blue },
            ].map((stat, i) => (
              <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{typeof stat.val === 'number' ? `$${stat.val.toLocaleString()}` : stat.val}</div>
                <div style={{ fontSize: '11px', color: S.muted, marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <input type="text" placeholder="🔍 ابحث برقم الكود أو اسم الحساب..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, marginBottom: '16px', background: S.navy2 }} />

          {/* جدول الحسابات */}
          <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['الكود', 'اسم الحساب', 'النوع', 'الرصيد', 'إجراء'].map(h => (
                    <th key={h} style={{ padding: '14px', textAlign: 'right', fontSize: '11px', color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: S.muted }}>لا توجد حسابات مضافة حالياً. ابدأ بإضافة حساب جديد للشجرة.</td></tr>
                ) : (
                  accounts.filter(a => a.account_name.includes(search)).map((a, i) => (
                    <tr key={a.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '14px', color: S.gold, fontWeight: 700 }}>{a.account_code}</td>
                      <td style={{ padding: '14px', fontSize: '13px' }}>{a.account_name}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: TYPE_MAP[a.account_type].bg, color: TYPE_MAP[a.account_type].color }}>{TYPE_MAP[a.account_type].label}</span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700 }}>${a.balance.toLocaleString()}</td>
                      <td style={{ padding: '14px' }}><button style={{ background: 'none', border: `1px solid ${S.border}`, color: S.muted, padding: '5px 10px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>كشف حساب</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Modal إضافة حساب ── */}
        {showAccountForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div style={{ background: S.navy2, width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px', border: `1px solid ${S.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
                <button onClick={() => setShowAccountForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: '20px' }}>✕</button>
                <div style={{ fontSize: '16px', fontWeight: 800, color: S.gold }}>إضافة حساب جديد للشجرة</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>كود الحساب *</label>
                  <input type="text" placeholder="1101" value={accountForm.account_code} onChange={e => setAccountForm({...accountForm, account_code: e.target.value})} style={inp} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>اسم الحساب *</label>
                  <input type="text" placeholder="اسم الحساب" value={accountForm.account_name} onChange={e => setAccountForm({...accountForm, account_name: e.target.value})} style={inp} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>النوع</label>
                  <select value={accountForm.account_type} onChange={e => setAccountForm({...accountForm, account_type: e.target.value as any})} style={inp}>
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم</option>
                    <option value="income">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowAccountForm(false)} style={{ background: 'rgba(255,255,255,0.06)', color: S.white, border: 'none', padding: '11px', borderRadius: '8px' }}>إلغاء</button>
                <button onClick={handleSaveAccount} disabled={saving} style={{ background: S.gold, color: S.navy, border: 'none', padding: '11px', borderRadius: '8px', fontWeight: 700 }}>
                  {saving ? 'جاري الحفظ...' : 'حفظ الحساب'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal إضافة سند ── */}
        {showVoucherForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div style={{ background: S.navy2, width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '28px', border: `1px solid ${S.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
                <button onClick={() => setShowVoucherForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: '20px' }}>✕</button>
                <div style={{ fontSize: '16px', fontWeight: 800, color: S.gold }}>إضافة سند مالي جديد</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>رقم السند *</label>
                  <input type="text" placeholder="V-2026-001" style={inp} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>التاريخ *</label>
                  <input type="date" style={inp} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.gold }}>الحساب المتأثر</label>
                  <select style={inp}>
                    <option>اختر الحساب...</option>
                    {accounts.map(acc => <option key={acc.id}>{acc.account_code} - {acc.account_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.green }}>مدين (Dr)</label>
                  <input type="number" placeholder="0.00" style={{ ...inp, border: `1px solid ${S.green}44` }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: S.red }}>دائن (Cr)</label>
                  <input type="number" placeholder="0.00" style={{ ...inp, border: `1px solid ${S.red}44` }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowVoucherForm(false)} style={{ background: 'rgba(255,255,255,0.06)', color: S.white, border: 'none', padding: '11px', borderRadius: '8px' }}>إلغاء</button>
                <button style={{ background: S.gold, color: S.navy, border: 'none', padding: '11px', borderRadius: '8px', fontWeight: 700 }}>حفظ السند</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}