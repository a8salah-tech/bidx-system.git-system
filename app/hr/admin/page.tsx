'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

// ===== نظام الألوان =====
const S = {
  navy:    '#0A1628', navy2: '#0F2040', navy3: '#0C1A32',
  gold:    '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.10)',
  goldB:   'rgba(201,168,76,0.20)',
  white:   '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.20)',
  green:   '#22C55E', greenB: 'rgba(34,197,94,0.10)',
  red:     '#EF4444', redB:   'rgba(239,68,68,0.10)',
  amber:   '#F59E0B', amberB: 'rgba(245,158,11,0.10)',
  blue:    '#3B82F6', blueB:  'rgba(59,130,246,0.10)',
  purple:  '#8B5CF6', purpleB:'rgba(139,92,246,0.10)',
  card:    'rgba(255,255,255,0.03)', card2: 'rgba(255,255,255,0.07)',
}

const inp: React.CSSProperties = {
  width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
  borderRadius: '9px', padding: '10px 14px', fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

const REQUEST_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  annual_leave:    { label: 'إجازة سنوية',     icon: '🏖️', color: '#3B82F6' },
  sick_leave:      { label: 'إجازة مرضية',     icon: '🏥', color: '#EF4444' },
  emergency_leave: { label: 'إجازة طارئة',     icon: '🚨', color: '#F59E0B' },
  unpaid_leave:    { label: 'إجازة بدون راتب', icon: '📋', color: '#8A9BB5' },
  advance_salary:  { label: 'سلفة راتب',        icon: '💰', color: '#22C55E' },
  loan:            { label: 'قرض',              icon: '🏦', color: '#8B5CF6' },
  resignation:     { label: 'استقالة',          icon: '👋', color: '#EF4444' },
  certificate:     { label: 'شهادة عمل',        icon: '📜', color: '#C9A84C' },
  other:           { label: 'طلب آخر',          icon: '📝', color: '#8A9BB5' },
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}
function fmtMoney(n: number) {
  return (n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function todayISO() { return new Date().toISOString().split('T')[0] }

// ===================================================
export default function HRAdminPage() {
  const [tab, setTab] = useState<'requests' | 'payroll' | 'employees' | 'messages' | 'orgchart'>('requests')
  const [adminEmp, setAdminEmp]   = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [requests, setRequests]   = useState<any[]>([])
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  // ── إضافة موظف ──
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [empForm, setEmpForm] = useState({
    full_name: '', job_title: '', department: '', hire_date: todayISO(),
    email: '', phone: '', national_id: '',
    basic_salary: '', housing_allowance: '', transport_allowance: '', other_allowances: '',
    role: 'employee', can_view_salaries: false, can_approve_requests: false,
    contract_type: 'full_time', annual_leave_balance: '30', sick_leave_balance: '15',
  })

  // ── إضافة مسيرة رواتب ──
  const [showPayrollForm, setShowPayrollForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // ── المراسلات ──
  const [showMsgForm, setShowMsgForm] = useState(false)
  const [msgForm, setMsgForm] = useState({
    subject: '', body: '', recipient_type: 'all',
    recipient_employee_id: '', recipient_department: '', message_type: 'internal',
  })

  // ── الهيكل التنظيمي ──
  const [orgDragMode, setOrgDragMode] = useState(false)
  const [draggingEmp, setDraggingEmp] = useState<string | null>(null)

  // ── إعلانات ──
  const [showDirectiveForm, setShowDirectiveForm] = useState(false)
  const [directiveForm, setDirectiveForm] = useState({
    title: '', content: '', directive_type: 'announcement',
    target_department: '', is_pinned: false, effective_date: todayISO(),
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [adminR, empsR, reqsR, payR] = await Promise.all([
        supabase.from('employees').select('*').eq('user_id', user.id).single(),
        supabase.from('employees').select('*').order('department').order('full_name'),
        supabase.from('hr_requests').select('*, employees:employee_id(full_name,job_title,department)').order('created_at', { ascending: false }),
        supabase.from('payroll_runs').select('*').order('created_at', { ascending: false }).limit(12),
      ])

      setAdminEmp(adminR.data)
      setEmployees(empsR.data || [])
      setRequests(reqsR.data || [])
      setPayrollRuns(payR.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── الموافقة / الرفض على الطلبات ──
  async function handleRequest(id: string, status: 'approved' | 'rejected', reason = '') {
    await supabase.from('hr_requests').update({ status, rejection_reason: reason || null, reviewed_at: new Date().toISOString() }).eq('id', id)
    await loadData()
  }

  // ── إضافة موظف جديد ──
  async function addEmployee() {
    if (!empForm.full_name || !empForm.email) { alert('الاسم والإيميل إلزاميان'); return }
    setSaving(true)

    const empNum = `EMP-${String(employees.length + 1).padStart(4, '0')}`

    const { error } = await supabase.from('employees').insert([{
      ...empForm,
      employee_number: empNum,
      company_id: adminEmp?.company_id,
      basic_salary: parseFloat(empForm.basic_salary) || 0,
      housing_allowance: parseFloat(empForm.housing_allowance) || 0,
      transport_allowance: parseFloat(empForm.transport_allowance) || 0,
      other_allowances: parseFloat(empForm.other_allowances) || 0,
      annual_leave_balance: parseInt(empForm.annual_leave_balance) || 30,
      sick_leave_balance: parseInt(empForm.sick_leave_balance) || 15,
      status: 'active',
    }])

    if (error) { alert('خطأ: ' + error.message) }
    else {
      setShowEmpForm(false)
      setEmpForm({ full_name: '', job_title: '', department: '', hire_date: todayISO(), email: '', phone: '', national_id: '', basic_salary: '', housing_allowance: '', transport_allowance: '', other_allowances: '', role: 'employee', can_view_salaries: false, can_approve_requests: false, contract_type: 'full_time', annual_leave_balance: '30', sick_leave_balance: '15' })
      await loadData()
    }
    setSaving(false)
  }

  // ── إنشاء مسيرة الرواتب ──
  async function runPayroll() {
    if (!selectedMonth) { alert('اختر الشهر'); return }
    setSaving(true)

    const activeEmps = employees.filter(e => e.status === 'active')
    const totalGross = activeEmps.reduce((s, e) => s + (e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.other_allowances || 0), 0)

    // إضافة سجل لكل موظف
    const payrollRecords = activeEmps.map(e => {
      const gross = (e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.other_allowances || 0)
      return {
        employee_id: e.id, company_id: e.company_id,
        month: selectedMonth, year: new Date(selectedMonth + '-01').getFullYear(),
        basic_salary: e.basic_salary || 0, housing_allowance: e.housing_allowance || 0,
        transport_allowance: e.transport_allowance || 0, other_allowances: e.other_allowances || 0,
        gross_salary: gross, total_deductions: 0, net_salary: gross, status: 'pending',
      }
    })

    await supabase.from('payroll').insert(payrollRecords)

    // سجل مسيرة الرواتب
    await supabase.from('payroll_runs').insert([{
      company_id: adminEmp?.company_id,
      month: selectedMonth, year: new Date(selectedMonth + '-01').getFullYear(),
      total_gross: totalGross, total_net: totalGross, total_deductions: 0,
      employees_count: activeEmps.length, status: 'draft',
    }])

    setShowPayrollForm(false)
    await loadData()
    setSaving(false)
    alert(`✅ تم إنشاء مسيرة رواتب ${selectedMonth} لـ ${activeEmps.length} موظف`)
  }

  // ── إرسال رسالة ──
  async function sendMessage() {
    if (!msgForm.subject || !msgForm.body) { alert('العنوان والمحتوى إلزاميان'); return }
    setSaving(true)

    const depts = [...new Set(employees.map(e => e.department).filter(Boolean))]
    const targets = msgForm.recipient_type === 'all'
      ? employees
      : msgForm.recipient_type === 'department'
        ? employees.filter(e => e.department === msgForm.recipient_department)
        : employees.filter(e => e.id === msgForm.recipient_employee_id)

    await supabase.from('hr_messages').insert(
      targets.map(e => ({
        company_id: adminEmp?.company_id,
        sender_id: adminEmp?.id,
        recipient_type: msgForm.recipient_type,
        recipient_employee_id: e.id,
        recipient_department: msgForm.recipient_department || null,
        subject: msgForm.subject,
        body: msgForm.body,
        message_type: msgForm.message_type,
      }))
    )

    setShowMsgForm(false)
    setMsgForm({ subject: '', body: '', recipient_type: 'all', recipient_employee_id: '', recipient_department: '', message_type: 'internal' })
    setSaving(false)
    alert(`✅ تم إرسال الرسالة لـ ${targets.length} موظف`)
  }

  // ── إضافة إعلان ──
  async function addDirective() {
    if (!directiveForm.title) { alert('العنوان إلزامي'); return }
    setSaving(true)
    await supabase.from('hr_directives').insert([{
      ...directiveForm,
      company_id: adminEmp?.company_id,
      created_by: adminEmp?.id,
    }])
    setShowDirectiveForm(false)
    setDirectiveForm({ title: '', content: '', directive_type: 'announcement', target_department: '', is_pinned: false, effective_date: todayISO() })
    setSaving(false)
    alert('✅ تم نشر الإعلان')
  }

  // ── تحريك الموظف لقسم آخر (Org Chart) ──
  async function moveEmployee(empId: string, newDept: string) {
    await supabase.from('employees').update({ department: newDept }).eq('id', empId)
    await loadData()
    setDraggingEmp(null)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const activeEmployees = employees.filter(e => e.status === 'active')
  const totalPayroll    = activeEmployees.reduce((s, e) => s + (e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.other_allowances || 0), 0)
  const depts           = [...new Set(employees.map(e => e.department).filter(Boolean))]

  const TABS = [
    { key: 'requests',  label: '📋 الطلبات',          badge: pendingRequests.length },
    { key: 'payroll',   label: '💰 الرواتب',           badge: 0 },
    { key: 'employees', label: '👥 الموظفون',          badge: 0 },
    { key: 'messages',  label: '✉️ المراسلات',         badge: 0 },
    { key: 'orgchart',  label: '🏢 الهيكل التنظيمي',  badge: 0 },
  ]

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif', flexDirection: 'column', gap: 12, background: S.navy }}>
      <div style={{ fontSize: 36 }}>⚙️</div>
      <div>جاري تحميل لوحة الإدارة...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy }}>

      {/* ── هيدر الإدارة ── */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '12px 24px', flexShrink: 0 }}>

        {/* الأزرار الرئيسية */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowMsgForm(true)}
              style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              ✉️ إرسال رسالة
            </button>
            <button onClick={() => setShowDirectiveForm(true)}
              style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              📢 نشر إعلان
            </button>
            <button onClick={() => setShowPayrollForm(true)}
              style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              💰 مسيرة رواتب
            </button>
            <button onClick={() => setShowEmpForm(true)}
              style={{ background: S.gold, color: S.navy, border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
              + إضافة موظف
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: S.gold2 }}>لوحة إدارة الموارد البشرية</div>
            <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{adminEmp?.full_name} • {adminEmp?.job_title}</div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { icon: '👥', label: 'إجمالي الموظفين', val: activeEmployees.length, color: S.blue },
            { icon: '📋', label: 'طلبات معلقة',     val: pendingRequests.length, color: S.amber },
            { icon: '💰', label: 'إجمالي الرواتب',  val: `${fmtMoney(totalPayroll)}`, color: S.green },
            { icon: '🏢', label: 'عدد الأقسام',     val: depts.length, color: S.gold },
          ].map((s, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 9, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: S.muted }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── التبويبات ── */}
      <div style={{ display: 'flex', background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '11px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', borderBottom: tab === t.key ? `2px solid ${S.gold}` : '2px solid transparent', background: 'transparent', color: tab === t.key ? S.gold2 : S.muted, whiteSpace: 'nowrap', transition: 'all .15s', position: 'relative' }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ position: 'absolute', top: 6, left: 8, background: S.red, color: S.white, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>

        {/* ══ الطلبات ══ */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>📋 الطلبات الواردة — {requests.length} طلب ({pendingRequests.length} معلق)</div>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', color: S.muted, padding: '60px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div>لا توجد طلبات</div>
              </div>
            ) : requests.map((r, i) => {
              const rt = REQUEST_TYPES[r.request_type] || REQUEST_TYPES.other
              return (
                <div key={r.id} style={{ background: S.navy2, border: `1px solid ${r.status === 'pending' ? S.amber + '40' : S.border}`, borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: r.status === 'pending' ? 12 : 0 }}>
                    {/* أزرار الموافقة */}
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRequest(r.id, 'rejected')}
                          style={{ background: S.redB, border: `1px solid ${S.red}30`, color: S.red, padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                          ✕ رفض
                        </button>
                        <button onClick={() => handleRequest(r.id, 'approved')}
                          style={{ background: S.greenB, border: `1px solid ${S.green}30`, color: S.green, padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                          ✓ موافقة
                        </button>
                      </div>
                    )}
                    {r.status !== 'pending' && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: r.status === 'approved' ? S.greenB : S.redB, color: r.status === 'approved' ? S.green : S.red, fontWeight: 700 }}>
                        {r.status === 'approved' ? '✓ موافق' : '✕ مرفوض'}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${rt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{rt.icon}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rt.color }}>{rt.label}</div>
                        <div style={{ fontSize: 11, color: S.white, marginTop: 2 }}>{(r.employees as any)?.full_name} — {(r.employees as any)?.department}</div>
                        <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>
                          {r.leave_from ? `${fmtDate(r.leave_from)} ← ${fmtDate(r.leave_to)} (${r.leave_days} يوم)` : r.reason?.slice(0, 60)}
                        </div>
                        <div style={{ fontSize: 10, color: S.muted }}>{fmtDate(r.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ الرواتب ══ */}
        {tab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ملخص الرواتب */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'إجمالي الرواتب الشهرية', val: fmtMoney(totalPayroll), color: S.green, icon: '💰' },
                { label: 'متوسط الراتب',           val: fmtMoney(activeEmployees.length ? totalPayroll / activeEmployees.length : 0), color: S.blue, icon: '📊' },
                { label: 'عدد الموظفين النشطين',   val: activeEmployees.length, color: S.gold, icon: '👥' },
              ].map((s, i) => (
                <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, textAlign: 'right' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: S.muted, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* جدول الموظفين والرواتب */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setShowPayrollForm(true)}
                  style={{ background: S.gold, color: S.navy, border: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  إنشاء مسيرة رواتب
                </button>
                <span style={{ fontSize: 13, fontWeight: 700 }}>تفاصيل رواتب الموظفين</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card }}>
                    {['الموظف', 'القسم', 'الأساسي', 'البدلات', 'الإجمالي', 'الحالة'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, color: S.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((e, i) => {
                    const allowances = (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.other_allowances || 0)
                    const gross = (e.basic_salary || 0) + allowances
                    return (
                      <tr key={e.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : S.card }}>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{e.full_name}</div>
                          <div style={{ fontSize: 10, color: S.muted }}>{e.employee_number}</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, color: S.muted }}>{e.department || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: S.white }}>{fmtMoney(e.basic_salary || 0)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: S.blue }}>{fmtMoney(allowances)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: S.green, fontWeight: 700 }}>{fmtMoney(gross)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: e.status === 'active' ? S.greenB : S.redB, color: e.status === 'active' ? S.green : S.red, fontWeight: 700 }}>
                            {e.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${S.borderG}`, background: S.card2 }}>
                    <td colSpan={4} style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: S.gold2 }}>إجمالي الرواتب الشهرية</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 900, color: S.gold2 }}>{fmtMoney(totalPayroll)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ══ الموظفون ══ */}
        {tab === 'employees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowEmpForm(true)}
                style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                + إضافة موظف جديد
              </button>
              <div style={{ fontSize: 13, fontWeight: 700 }}>👥 قائمة الموظفين — {employees.length} موظف</div>
            </div>

            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: S.card }}>
                    {['الموظف', 'المسمى / القسم', 'تاريخ التعيين', 'الدور والصلاحيات', 'الراتب الإجمالي', 'الحالة'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, color: S.muted, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e, i) => {
                    const gross = (e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.other_allowances || 0)
                    return (
                      <tr key={e.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : S.card }}>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{e.full_name}</div>
                              <div style={{ fontSize: 10, color: S.muted }}>{e.employee_number} • {e.email}</div>
                            </div>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${S.gold},${S.navy3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {e.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: S.white }}>{e.job_title || '—'}</div>
                          <div style={{ fontSize: 10, color: S.muted }}>{e.department || '—'}</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, color: S.muted }}>{fmtDate(e.hire_date)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: e.role === 'hr_manager' ? S.purpleB : e.role === 'owner' ? S.goldB : S.card2, color: e.role === 'hr_manager' ? S.purple : e.role === 'owner' ? S.gold : S.muted, fontWeight: 700 }}>
                            {e.role === 'owner' ? '👑 مالك' : e.role === 'hr_manager' ? '🔑 HR' : e.role === 'dept_manager' ? '📋 مدير قسم' : '👤 موظف'}
                          </span>
                          {e.can_view_salaries && <span style={{ fontSize: 9, marginRight: 4, color: S.green }}>يرى الرواتب</span>}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: S.green, fontWeight: 700 }}>{fmtMoney(gross)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: e.status === 'active' ? S.greenB : S.redB, color: e.status === 'active' ? S.green : S.red, fontWeight: 700 }}>
                            {e.status === 'active' ? 'نشط' : e.status === 'resigned' ? 'مستقيل' : 'غير نشط'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ المراسلات ══ */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowMsgForm(true)}
                  style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  ✉️ رسالة جديدة
                </button>
                <button onClick={() => setShowDirectiveForm(true)}
                  style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: '9px 18px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  📢 إعلان جديد
                </button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>✉️ المراسلات والإعلانات</div>
            </div>

            {/* نماذج الإرسال السريع */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { icon: '👤', label: 'رسالة لموظف',  sub: 'تواصل مباشر مع موظف معين', action: () => { setMsgForm(p => ({ ...p, recipient_type: 'employee' })); setShowMsgForm(true) } },
                { icon: '🏢', label: 'رسالة لقسم',   sub: 'إرسال لجميع موظفي قسم',    action: () => { setMsgForm(p => ({ ...p, recipient_type: 'department' })); setShowMsgForm(true) } },
                { icon: '📣', label: 'إعلان عام',    sub: 'رسالة لجميع الموظفين',       action: () => { setMsgForm(p => ({ ...p, recipient_type: 'all' })); setShowMsgForm(true) } },
              ].map((s, i) => (
                <button key={i} onClick={s.action}
                  style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px 14px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', transition: 'all .2s' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.white, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: S.muted }}>{s.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ الهيكل التنظيمي ══ */}
        {tab === 'orgchart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setOrgDragMode(!orgDragMode)}
                style={{ background: orgDragMode ? S.amber : S.card2, color: orgDragMode ? S.navy : S.white, border: `1px solid ${orgDragMode ? S.amber : S.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {orgDragMode ? '✓ وضع النقل نشط' : '🔄 تفعيل نقل الموظفين'}
              </button>
              <div style={{ fontSize: 13, fontWeight: 700 }}>🏢 الهيكل التنظيمي — {depts.length} قسم</div>
            </div>

            {orgDragMode && (
              <div style={{ background: S.amberB, border: `1px solid ${S.amber}30`, borderRadius: 9, padding: '10px 14px', textAlign: 'right', fontSize: 12, color: S.amber }}>
                💡 اضغط على موظف لتحديده، ثم اضغط على القسم المراد نقله إليه
              </div>
            )}

            {depts.map(dept => (
              <div key={dept}
                style={{ background: S.navy2, border: `2px solid ${draggingEmp && orgDragMode ? S.amber + '60' : S.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border .2s' }}
                onClick={() => { if (draggingEmp && orgDragMode) { moveEmployee(draggingEmp, dept) } }}>
                <div style={{ padding: '10px 18px', background: S.card2, borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: S.muted }}>{employees.filter(e => e.department === dept).length} موظف</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.gold2 }}>{dept}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, padding: 14 }}>
                  {employees.filter(e => e.department === dept).map(emp => (
                    <div key={emp.id}
                      onClick={e => { e.stopPropagation(); if (orgDragMode) setDraggingEmp(draggingEmp === emp.id ? null : emp.id) }}
                      style={{ background: draggingEmp === emp.id ? S.goldB : S.card, border: `1px solid ${draggingEmp === emp.id ? S.gold : S.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse', cursor: orgDragMode ? 'pointer' : 'default', transition: 'all .15s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${S.gold},${S.navy3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {emp.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</div>
                        <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{emp.job_title || '—'}</div>
                        {emp.role !== 'employee' && (
                          <span style={{ fontSize: 9, color: S.gold }}>{emp.role === 'hr_manager' ? '🔑 HR' : emp.role === 'dept_manager' ? '📋 مدير' : ''}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {depts.length === 0 && (
              <div style={{ textAlign: 'center', color: S.muted, padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                <div>لا توجد أقسام بعد — أضف موظفين لتظهر هنا</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Modal إضافة موظف ══ */}
      {showEmpForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 640, borderRadius: 20, border: `1px solid ${S.borderG}`, maxHeight: '94vh', overflowY: 'auto', direction: 'rtl' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S.card2 }}>
              <button onClick={() => setShowEmpForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: S.gold2 }}>👤 إضافة موظف جديد</div>
            </div>
            <div style={{ padding: 22 }}>

              <div style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginBottom: 12, textAlign: 'right' }}>البيانات الشخصية</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'الاسم الكامل *', key: 'full_name', placeholder: 'اسم الموظف' },
                  { label: 'المسمى الوظيفي', key: 'job_title', placeholder: 'مثال: مدير مبيعات' },
                  { label: 'القسم',           key: 'department', placeholder: 'مثال: المبيعات' },
                  { label: 'البريد الإلكتروني *', key: 'email', placeholder: 'email@company.com' },
                  { label: 'رقم الهاتف',     key: 'phone', placeholder: '+966 5xx xxx xxxx' },
                  { label: 'رقم الهوية',      key: 'national_id', placeholder: 'رقم الهوية الوطنية' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 5, textAlign: 'right' }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(empForm as any)[f.key]}
                      onChange={e => setEmpForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}/>
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 5, textAlign: 'right' }}>تاريخ التعيين</label>
                  <input type="date" value={empForm.hire_date}
                    onChange={e => setEmpForm(p => ({ ...p, hire_date: e.target.value }))}
                    style={{ ...inp, colorScheme: 'dark' as any }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 5, textAlign: 'right' }}>نوع العقد</label>
                  <select value={empForm.contract_type} onChange={e => setEmpForm(p => ({ ...p, contract_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="full_time"  style={{ background: S.navy2 }}>دوام كامل</option>
                    <option value="part_time"  style={{ background: S.navy2 }}>دوام جزئي</option>
                    <option value="contract"   style={{ background: S.navy2 }}>عقد مؤقت</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginBottom: 12, textAlign: 'right' }}>الراتب والبدلات</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'الراتب الأساسي', key: 'basic_salary' },
                  { label: 'بدل السكن',      key: 'housing_allowance' },
                  { label: 'بدل المواصلات',  key: 'transport_allowance' },
                  { label: 'بدلات أخرى',     key: 'other_allowances' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 5, textAlign: 'right' }}>{f.label}</label>
                    <input type="number" placeholder="0.00" value={(empForm as any)[f.key]}
                      onChange={e => setEmpForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}/>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: S.gold, marginBottom: 12, textAlign: 'right' }}>الصلاحيات</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 5, textAlign: 'right' }}>الدور الوظيفي</label>
                  <select value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="employee"     style={{ background: S.navy2 }}>👤 موظف</option>
                    <option value="dept_manager" style={{ background: S.navy2 }}>📋 مدير قسم</option>
                    <option value="hr_manager"   style={{ background: S.navy2 }}>🔑 مدير HR</option>
                    <option value="owner"        style={{ background: S.navy2 }}>👑 مالك / مدير عام</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: S.muted }}>صلاحية رؤية الرواتب</span>
                    <input type="checkbox" checked={empForm.can_view_salaries}
                      onChange={e => setEmpForm(p => ({ ...p, can_view_salaries: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: S.gold }}/>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: S.muted }}>صلاحية الموافقة على الطلبات</span>
                    <input type="checkbox" checked={empForm.can_approve_requests}
                      onChange={e => setEmpForm(p => ({ ...p, can_approve_requests: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: S.gold }}/>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <button onClick={() => setShowEmpForm(false)}
                  style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                <button onClick={addEmployee} disabled={saving}
                  style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {saving ? '⏳ جاري الحفظ...' : '+ إضافة الموظف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal مسيرة الرواتب ══ */}
      {showPayrollForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 480, borderRadius: 20, border: `1px solid ${S.borderG}`, padding: 28, direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => setShowPayrollForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: S.gold2 }}>💰 إنشاء مسيرة الرواتب</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 8, textAlign: 'right' }}>الشهر</label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ ...inp, colorScheme: 'dark' as any }}/>
            </div>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>{fmtMoney(totalPayroll)}</span>
                <span style={{ fontSize: 12, color: S.muted }}>إجمالي الرواتب</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: S.blue }}>{activeEmployees.length} موظف</span>
                <span style={{ fontSize: 12, color: S.muted }}>عدد الموظفين</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button onClick={() => setShowPayrollForm(false)}
                style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={runPayroll} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '⏳ جاري الإنشاء...' : `💰 إنشاء مسيرة ${selectedMonth}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal الرسالة ══ */}
      {showMsgForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 540, borderRadius: 20, border: `1px solid ${S.borderG}`, padding: 28, direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => setShowMsgForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: S.gold2 }}>✉️ إرسال رسالة</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>المستلم</label>
                <select value={msgForm.recipient_type} onChange={e => setMsgForm(p => ({ ...p, recipient_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="all"        style={{ background: S.navy2 }}>📣 جميع الموظفين</option>
                  <option value="department" style={{ background: S.navy2 }}>🏢 قسم محدد</option>
                  <option value="employee"   style={{ background: S.navy2 }}>👤 موظف محدد</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>نوع الرسالة</label>
                <select value={msgForm.message_type} onChange={e => setMsgForm(p => ({ ...p, message_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="internal" style={{ background: S.navy2 }}>🔒 داخلية</option>
                  <option value="email"    style={{ background: S.navy2 }}>📧 إيميل</option>
                </select>
              </div>
            </div>

            {msgForm.recipient_type === 'department' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>اختر القسم</label>
                <select value={msgForm.recipient_department} onChange={e => setMsgForm(p => ({ ...p, recipient_department: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">اختر...</option>
                  {depts.map(d => <option key={d} value={d} style={{ background: S.navy2 }}>{d}</option>)}
                </select>
              </div>
            )}

            {msgForm.recipient_type === 'employee' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>اختر الموظف</label>
                <select value={msgForm.recipient_employee_id} onChange={e => setMsgForm(p => ({ ...p, recipient_employee_id: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">اختر...</option>
                  {employees.map(e => <option key={e.id} value={e.id} style={{ background: S.navy2 }}>{e.full_name} — {e.department}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>عنوان الرسالة *</label>
              <input type="text" placeholder="عنوان الرسالة..." value={msgForm.subject}
                onChange={e => setMsgForm(p => ({ ...p, subject: e.target.value }))} style={inp}/>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>محتوى الرسالة *</label>
              <textarea value={msgForm.body} onChange={e => setMsgForm(p => ({ ...p, body: e.target.value }))}
                placeholder="اكتب رسالتك هنا..." rows={5}
                style={{ ...inp, resize: 'none' } as React.CSSProperties}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button onClick={() => setShowMsgForm(false)}
                style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={sendMessage} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '⏳ جاري الإرسال...' : '✉️ إرسال'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal إعلان ══ */}
      {showDirectiveForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 520, borderRadius: 20, border: `1px solid ${S.borderG}`, padding: 28, direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => setShowDirectiveForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: S.gold2 }}>📢 نشر إعلان</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>نوع الإعلان</label>
                <select value={directiveForm.directive_type} onChange={e => setDirectiveForm(p => ({ ...p, directive_type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="announcement"   style={{ background: S.navy2 }}>📢 إعلان عام</option>
                  <option value="policy_update"  style={{ background: S.navy2 }}>📋 تحديث سياسة</option>
                  <option value="leave_approval" style={{ background: S.navy2 }}>🏖️ موافقة إجازة</option>
                  <option value="training"       style={{ background: S.navy2 }}>📚 تدريب</option>
                  <option value="other"          style={{ background: S.navy2 }}>📝 أخرى</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>القسم المستهدف</label>
                <select value={directiveForm.target_department} onChange={e => setDirectiveForm(p => ({ ...p, target_department: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="" style={{ background: S.navy2 }}>جميع الأقسام</option>
                  {depts.map(d => <option key={d} value={d} style={{ background: S.navy2 }}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>عنوان الإعلان *</label>
              <input type="text" placeholder="عنوان الإعلان..." value={directiveForm.title}
                onChange={e => setDirectiveForm(p => ({ ...p, title: e.target.value }))} style={inp}/>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>محتوى الإعلان</label>
              <textarea value={directiveForm.content} onChange={e => setDirectiveForm(p => ({ ...p, content: e.target.value }))}
                placeholder="تفاصيل الإعلان أو التوجيهات..." rows={4}
                style={{ ...inp, resize: 'none' } as React.CSSProperties}/>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'flex-end', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: S.muted }}>تثبيت الإعلان في الأعلى</span>
              <input type="checkbox" checked={directiveForm.is_pinned}
                onChange={e => setDirectiveForm(p => ({ ...p, is_pinned: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: S.gold }}/>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button onClick={() => setShowDirectiveForm(false)}
                style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={addDirective} disabled={saving}
                style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {saving ? '⏳ ...' : '📢 نشر الإعلان'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
