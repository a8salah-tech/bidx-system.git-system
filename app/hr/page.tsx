'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

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
  annual_leave:    { label: 'إجازة سنوية',     icon: '🏖️', color: S.blue   },
  sick_leave:      { label: 'إجازة مرضية',     icon: '🏥', color: S.red    },
  emergency_leave: { label: 'إجازة طارئة',     icon: '🚨', color: S.amber  },
  unpaid_leave:    { label: 'إجازة بدون راتب', icon: '📋', color: S.muted  },
  advance_salary:  { label: 'سلفة راتب',        icon: '💰', color: S.green  },
  loan:            { label: 'قرض',              icon: '🏦', color: S.purple },
  resignation:     { label: 'استقالة',          icon: '👋', color: S.red    },
  certificate:     { label: 'شهادة عمل',        icon: '📜', color: S.gold   },
  other:           { label: 'طلب آخر',          icon: '📝', color: S.muted  },
}

const REQUEST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'قيد المراجعة', color: S.amber, bg: S.amberB },
  approved:  { label: 'موافق عليه',   color: S.green, bg: S.greenB },
  rejected:  { label: 'مرفوض',        color: S.red,   bg: S.redB   },
  cancelled: { label: 'ملغي',         color: S.muted, bg: S.card2  },
}

const HANDBOOK = [
  { id: 'welcome',    icon: '👋', title: 'مرحباً بك',
    items: [
      { h: 'رسالة الترحيب',      t: 'يسعدنا انضمامك إلى عائلتنا. نؤمن بأن موظفينا هم أهم أصولنا ونلتزم بتوفير بيئة عمل محفزة وعادلة.' },
      { h: 'رؤيتنا ورسالتنا',    t: 'رؤيتنا أن نكون الخيار الأول في مجالنا. رسالتنا تقديم خدمات استثنائية بالاعتماد على فريق متميز.' },
    ]},
  { id: 'work',       icon: '⏰', title: 'نظام العمل',
    items: [
      { h: 'ساعات العمل',        t: 'من 9:00 صباحاً حتى 6:00 مساءً، من الأحد إلى الخميس. 8 ساعات يومياً شاملة استراحة الغداء.' },
      { h: 'نظام الحضور',        t: 'التسجيل الإلكتروني إلزامي. 3 تأخيرات = يوم غياب. الغياب بدون إذن يُخصم من الراتب.' },
      { h: 'العمل عن بُعد',      t: 'يومان أسبوعياً بعد 6 أشهر خدمة، بموافقة المدير المباشر.' },
    ]},
  { id: 'leaves',     icon: '🏖️', title: 'سياسة الإجازات',
    items: [
      { h: 'الإجازة السنوية',    t: '30 يوم/سنة. ترحيل 15 يوم للسنة التالية. بدل نقدي عن الأيام المتبقية.' },
      { h: 'الإجازة المرضية',    t: '15 يوم براتب كامل مع تقرير طبي. تزيد لـ30 يوم بعد 5 سنوات خدمة.' },
      { h: 'إجازة الأمومة',      t: '90 يوم براتب كامل + تمديد 30 يوماً بدون راتب.' },
      { h: 'إجازة الأبوة',       t: '5 أيام عمل براتب كامل عند الولادة.' },
    ]},
  { id: 'salary',     icon: '💰', title: 'الرواتب والمزايا',
    items: [
      { h: 'موعد الصرف',         t: 'اليوم الخامس والعشرون من كل شهر. إذا صادف إجازة يُصرف اليوم السابق.' },
      { h: 'مكونات الراتب',      t: 'راتب أساسي + بدل سكن 25% + بدل مواصلات 10% + بدلات وظيفية.' },
      { h: 'مكافأة الأداء',      t: 'نصف سنوية في يونيو وديسمبر بناءً على تقييم الأداء.' },
      { h: 'التأمين الصحي',      t: 'تأمين شامل للموظف وأسرته (زوج/ة + 3 أبناء).' },
    ]},
  { id: 'conduct',    icon: '🤝', title: 'ميثاق السلوك',
    items: [
      { h: 'السرية المهنية',     t: 'يُحظر إفشاء أي معلومات تجارية خلال فترة العمل وبعدها بسنتين.' },
      { h: 'اللباس الرسمي',      t: 'رسمي كل الأيام. الاثنين والخميس Casual بلباس محترم.' },
      { h: 'استخدام التكنولوجيا', t: 'أجهزة الشركة للاستخدام المهني أساساً. ممنوع تحميل برامج غير مرخصة.' },
    ]},
  { id: 'career',     icon: '📈', title: 'المسار الوظيفي',
    items: [
      { h: 'تقييم الأداء',       t: 'سنوي في ديسمبر مع مراجعة نصف سنوية. يؤثر في الزيادة والمكافآت.' },
      { h: 'برنامج التدريب',     t: 'تدريب إلزامي أول 90 يوم. دورات مدفوعة حتى 5,000 ريال سنوياً.' },
      { h: 'الترقية الوظيفية',   t: 'بعد سنتين أداء متميز مع مراجعة الإدارة العليا والموارد البشرية.' },
    ]},
  { id: 'resignation', icon: '👋', title: 'إنهاء الخدمة',
    items: [
      { h: 'فترة الإشعار',        t: '30 يوم للسنة الأولى، 60 يوم لما بعدها. إعفاء باتفاق الطرفين.' },
      { h: 'مكافأة نهاية الخدمة', t: 'شهر/سنة للخمس سنوات الأولى، شهر ونصف/سنة لما بعدها.' },
      { h: 'تسليم المهام',         t: 'إلزامي تسليم كل الملفات والأجهزة والبطاقة قبل آخر يوم.' },
      { h: 'شهادة الخبرة',         t: 'تُصدر خلال 5 أيام عمل من آخر يوم، أو عبر طلب في المنصة.' },
    ]},
]

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
}
function fmtMoney(n: number) {
  return (n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function todayISO() { return new Date().toISOString().split('T')[0] }
function nowTime() {
  return new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ===================================================
export default function HREmployeePage() {
  const [tab, setTab] = useState<'requests' | 'handbook' | 'payroll' | 'orgchart' | 'attendance'>('requests')
  const [employee, setEmployee]   = useState<any>(null)
  const [requests, setRequests]   = useState<any[]>([])
  const [payroll, setPayroll]     = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [directives, setDirectives]  = useState<any[]>([])
  const [attendance, setAttendance]  = useState<any[]>([])
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [section, setSection]     = useState('requests_incoming')
  const [handbookSection, setHandbookSection] = useState('welcome')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [currentTime, setCurrentTime] = useState(nowTime())

  // ── الحضور اليوم ──
  const [checkInDone, setCheckInDone] = useState(false)
  const [checkOutDone, setCheckOutDone] = useState(false)
  const [todayTasks, setTodayTasks] = useState('')

  const [reqForm, setReqForm] = useState({
    request_type: 'annual_leave',
    leave_from: todayISO(),
    leave_to: '',
    amount: '',
    repayment_months: '',
    reason: '',
    notes: '',
  })

  // ── ساعة متحركة ──
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(nowTime()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // جلب بيانات الموظف (قد لا يكون موجوداً)
      const { data: empData } = await supabase.from('employees').select('*').eq('user_id', user.id).single()
      setEmployee(empData)

      // جلب باقي البيانات بشكل مستقل
      const [reqR, payR, teamR, dirR] = await Promise.all([
        supabase.from('hr_requests').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('payroll').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('employees').select('id, full_name, job_title, department, manager_id').eq('status', 'active'),
        supabase.from('hr_directives').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      setRequests(reqR.data || [])
      setPayroll(payR.data || [])
      setTeamMembers(teamR.data || [])
      setDirectives(dirR.data || [])

      // جلب سجل الحضور — يحاول من جدولين
      if (empData) {
        const { data: attAll } = await supabase.from('attendance').select('*')
          .eq('employee_id', empData.id).order('date', { ascending: false }).limit(30)
        const { data: todayAtt } = await supabase.from('attendance').select('*')
          .eq('employee_id', empData.id).eq('date', todayISO()).limit(1)
        setAttendance(attAll || [])
        const today = todayAtt?.[0]
        setTodayAttendance(today || null)
        if (today?.check_in) setCheckInDone(true)
        if (today?.check_out) setCheckOutDone(true)
      } else {
        // fallback: attendance_simple
        const { data: attAll } = await supabase.from('attendance_simple').select('*')
          .eq('user_id', user.id).order('date', { ascending: false }).limit(30)
        const { data: todayAtt } = await supabase.from('attendance_simple').select('*')
          .eq('user_id', user.id).eq('date', todayISO()).limit(1)
        setAttendance(attAll || [])
        const today = todayAtt?.[0]
        setTodayAttendance(today || null)
        if (today?.check_in) setCheckInDone(true)
        if (today?.check_out) setCheckOutDone(true)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── تسجيل الحضور ──
  async function handleCheckIn() {
    if (checkInDone) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('يرجى تسجيل الدخول أولاً'); setSaving(false); return }

      const now = new Date().toISOString()
      const table = employee ? 'attendance' : 'attendance_simple'
      const payload = employee
        ? { employee_id: employee.id, date: todayISO(), check_in: now, status: 'present' }
        : { user_id: user.id, date: todayISO(), check_in: now }

      // تحقق إذا في سجل اليوم
      const { data: existing } = employee
        ? await supabase.from('attendance').select('*').eq('employee_id', employee.id).eq('date', todayISO()).single()
        : await supabase.from('attendance_simple').select('*').eq('user_id', user.id).eq('date', todayISO()).single()

      if (existing) {
        setTodayAttendance(existing)
        setCheckInDone(true)
        if (existing.check_out) setCheckOutDone(true)
        setSaving(false)
        return
      }

      const { data, error } = await supabase.from(table).insert([payload]).select().single()
      if (error) { console.error(error); alert('خطأ في تسجيل الحضور: ' + error.message) }
      else if (data) { setTodayAttendance(data); setCheckInDone(true) }
    } catch (e: any) { console.error(e); alert('خطأ غير متوقع') }
    setSaving(false)
  }

  // ── تسجيل الانصراف ──
  async function handleCheckOut() {
    if (!todayAttendance || checkOutDone) return
    setSaving(true)
    try {
      const now      = new Date().toISOString()
      const checkIn  = new Date(todayAttendance.check_in)
      const hours    = Math.round((new Date(now).getTime() - checkIn.getTime()) / 36000) / 100
      const table    = employee ? 'attendance' : 'attendance_simple'

      const { error } = await supabase.from(table).update({
        check_out: now, work_hours: hours, notes: todayTasks,
      }).eq('id', todayAttendance.id)

      if (error) { alert('خطأ في تسجيل الانصراف: ' + error.message) }
      else {
        setCheckOutDone(true)
        setTodayAttendance({ ...todayAttendance, check_out: now, work_hours: hours })
        await loadData()
      }
    } catch (e: any) { alert('خطأ غير متوقع') }
    setSaving(false)
  }

  // ── تقديم طلب ──
  async function submitRequest() {
    if (!employee || !reqForm.reason) { alert('اكتب سبب الطلب'); return }
    setSaving(true)

    let attachmentUrl = null
    if (uploadedFile) {
      const ext  = uploadedFile.name.split('.').pop()
      const path = `hr-requests/${employee.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('hr-attachments').upload(path, uploadedFile)
      if (!error) attachmentUrl = path
    }

    const isLeave = ['annual_leave','sick_leave','emergency_leave','unpaid_leave'].includes(reqForm.request_type)
    const leaveDays = isLeave && reqForm.leave_from && reqForm.leave_to
      ? Math.max(1, Math.round((new Date(reqForm.leave_to).getTime() - new Date(reqForm.leave_from).getTime()) / 86400000) + 1)
      : null

    await supabase.from('hr_requests').insert([{
      employee_id:      employee.id,
      company_id:       employee.company_id,
      request_type:     reqForm.request_type,
      leave_from:       isLeave ? reqForm.leave_from : null,
      leave_to:         isLeave ? reqForm.leave_to   : null,
      leave_days:       leaveDays,
      amount:           parseFloat(reqForm.amount) || null,
      repayment_months: parseInt(reqForm.repayment_months) || null,
      reason:           reqForm.reason,
      notes:            reqForm.notes,
      attachment_url:   attachmentUrl,
      status:           'pending',
    }])

    setShowForm(false)
    setReqForm({ request_type: 'annual_leave', leave_from: todayISO(), leave_to: '', amount: '', repayment_months: '', reason: '', notes: '' })
    setUploadedFile(null)
    await loadData()
    setSaving(false)
  }

  const gross = (employee?.basic_salary || 0) + (employee?.housing_allowance || 0) + (employee?.transport_allowance || 0) + (employee?.other_allowances || 0)
  const lastPayroll = payroll[0]

  const leaveDaysCalc = reqForm.leave_from && reqForm.leave_to
    ? Math.max(0, Math.round((new Date(reqForm.leave_to).getTime() - new Date(reqForm.leave_from).getTime()) / 86400000) + 1)
    : 0

  const isLeaveReq = ['annual_leave','sick_leave','emergency_leave','unpaid_leave'].includes(reqForm.request_type)
  const isMoneyReq = ['advance_salary','loan'].includes(reqForm.request_type)

  const TABS = [
    { key: 'requests',   label: '📋 الطلبات' },
    { key: 'handbook',   label: '📖 دليل الموظف' },
    { key: 'payroll',    label: '💰 الراتب' },
    { key: 'attendance', label: '⏰ الحضور' },
    { key: 'orgchart',   label: '🏢 الهيكل التنظيمي' },
  ]

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif', flexDirection: 'column', gap: 12, background: S.navy }}>
      <div style={{ fontSize: 36 }}>⚙️</div>
      <div>جاري تحميل بياناتك...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy }}>

      {/* ── هيدر الموظف + إحصائيات ── */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 24px', flexShrink: 0 }}>
        {employee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexDirection: 'row-reverse' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${S.gold},${S.navy3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0, border: `2px solid ${S.gold}40` }}>
              {employee.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{employee.full_name}</div>
              <div style={{ fontSize: 11, color: S.gold2, marginTop: 2 }}>{employee.job_title} • {employee.department}</div>
              <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>{employee.employee_number} • منذ {fmtDate(employee.hire_date)}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { icon: '🏖️', label: 'رصيد الإجازة السنوية', val: `${employee?.annual_leave_balance || 0}`, sub: 'يوم متبقي', color: S.blue },
            { icon: '💵', label: 'صافي الراتب الشهري',   val: fmtMoney(lastPayroll?.net_salary || gross), sub: `يُصرف يوم 25`, color: S.green },
            { icon: '📋', label: 'طلبات معلقة',           val: `${requests.filter(r => r.status === 'pending').length}`, sub: `من ${requests.length} طلب`, color: S.amber },
            { icon: '⏰', label: 'مدة الخدمة',
              val: employee?.hire_date ? `${Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000*60*60*24*30))}` : '0',
              sub: 'شهر', color: S.gold },
          ].map((s, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val} <span style={{ fontSize: 10, fontFamily: 'Tajawal, sans-serif', color: S.muted }}>{s.sub}</span></div>
                <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── التبويبات ── */}
      <div style={{ display: 'flex', background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '11px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', borderBottom: tab === t.key ? `2px solid ${S.gold}` : '2px solid transparent', background: 'transparent', color: tab === t.key ? S.gold2 : S.muted, whiteSpace: 'nowrap', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>

        {/* ══ الطلبات ══ */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* الإعلانات من الإدارة */}
            {directives.length > 0 && (
              <div style={{ background: S.goldB, border: `1px solid ${S.borderG}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: S.gold2, marginBottom: 10, textAlign: 'right' }}>📢 إعلانات وتوجيهات الإدارة</div>
                {directives.slice(0, 3).map(d => (
                  <div key={d.id} style={{ background: S.navy3, borderRadius: 8, padding: '10px 14px', marginBottom: 8, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.gold }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: S.muted, marginTop: 4 }}>{d.content?.slice(0, 100)}...</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 4 }}>{fmtDate(d.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* بطاقات أنواع الطلبات */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(true)}
                style={{ background: S.gold, color: S.navy, border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                + تقديم طلب جديد
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {Object.entries(REQUEST_TYPES).slice(0, 6).map(([key, t]) => (
                <button key={key} onClick={() => { setReqForm(p => ({ ...p, request_type: key })); setShowForm(true) }}
                  style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .2s' }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>اضغط للتقديم</div>
                  </div>
                </button>
              ))}
            </div>

            {/* جدول الطلبات */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: S.muted }}>{requests.length} طلب</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>سجل طلباتي</span>
              </div>
              {requests.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: S.muted }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <div>لا توجد طلبات بعد</div>
                </div>
              ) : requests.map((r, i) => {
                const rt = REQUEST_TYPES[r.request_type] || REQUEST_TYPES.other
                const rs = REQUEST_STATUS[r.status] || REQUEST_STATUS.pending
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: i > 0 ? `1px solid ${S.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: rs.bg, color: rs.color, fontWeight: 700 }}>{rs.label}</span>
                      <span style={{ fontSize: 10, color: S.muted, fontFamily: 'monospace' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${rt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{rt.icon}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rt.color }}>{rt.label}</div>
                        <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>
                          {r.leave_from ? `${fmtDate(r.leave_from)} ← ${fmtDate(r.leave_to)} (${r.leave_days} يوم)` : r.reason?.slice(0, 50)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ دليل الموظف ══ */}
        {tab === 'handbook' && (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
            <div style={{ background: S.navy2, borderRadius: 12, padding: 10, border: `1px solid ${S.border}`, position: 'sticky', top: 0, height: 'fit-content' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.muted, marginBottom: 10, textAlign: 'right', padding: '0 6px' }}>محتويات الدليل</div>
              {HANDBOOK.map(sec => (
                <button key={sec.id} onClick={() => setHandbookSection(sec.id)}
                  style={{ width: '100%', textAlign: 'right', padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 12, fontWeight: handbookSection === sec.id ? 700 : 400, background: handbookSection === sec.id ? S.gold3 : 'transparent', color: handbookSection === sec.id ? S.gold2 : S.muted, borderRight: handbookSection === sec.id ? `3px solid ${S.gold}` : '3px solid transparent', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', transition: 'all .15s' }}>
                  <span style={{ fontSize: 11 }}>{sec.title}</span>
                  <span>{sec.icon}</span>
                </button>
              ))}
            </div>
            <div>
              {HANDBOOK.filter(s => s.id === handbookSection).map(sec => (
                <div key={sec.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexDirection: 'row-reverse' }}>
                    <span style={{ fontSize: 28 }}>{sec.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{sec.title}</div>
                      <div style={{ height: 2, width: 50, background: `linear-gradient(90deg,${S.gold},transparent)`, marginTop: 5 }}/>
                    </div>
                  </div>
                  {sec.items.map((item, i) => (
                    <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRight: `4px solid ${S.gold}`, borderRadius: 10, padding: 18, marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.gold2, marginBottom: 8, textAlign: 'right' }}>{item.h}</div>
                      <div style={{ fontSize: 13, color: S.white, lineHeight: '1.9', textAlign: 'right' }}>{item.t}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ الراتب ══ */}
        {tab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, color: S.muted, marginBottom: 2 }}>يُصرف كل شهر</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: S.green }}>اليوم 25</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: S.muted, marginBottom: 2 }}>صافي الراتب الشهري</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: S.gold2, fontFamily: 'monospace' }}>{fmtMoney(lastPayroll?.net_salary || gross)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* المستحقات */}
                <div style={{ background: S.greenB, border: `1px solid ${S.green}30`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 10, textAlign: 'right' }}>📈 المستحقات</div>
                  {[
                    { label: 'الراتب الأساسي',  val: employee?.basic_salary || 0 },
                    { label: 'بدل السكن',        val: employee?.housing_allowance || 0 },
                    { label: 'بدل المواصلات',    val: employee?.transport_allowance || 0 },
                    { label: 'بدلات أخرى',       val: employee?.other_allowances || 0 },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${S.green}15` : 'none' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: S.green, fontFamily: 'monospace' }}>{fmtMoney(row.val)}</span>
                      <span style={{ fontSize: 11, color: S.muted, textAlign: 'right' }}>{row.label}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', borderTop: `2px solid ${S.green}30`, marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>{fmtMoney(gross)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>الإجمالي</span>
                  </div>
                </div>

                {/* الخصومات */}
                <div style={{ background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 10, textAlign: 'right' }}>📉 الخصومات</div>
                  {[
                    { label: 'خصم الغياب',   val: lastPayroll?.deduction_absence || 0 },
                    { label: 'استقطاع سلفة', val: lastPayroll?.deduction_advance || 0 },
                    { label: 'استقطاع قرض',  val: lastPayroll?.deduction_loan || 0 },
                    { label: 'خصومات أخرى',  val: lastPayroll?.deduction_other || 0 },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${S.red}15` : 'none' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: S.red, fontFamily: 'monospace' }}>{fmtMoney(row.val)}</span>
                      <span style={{ fontSize: 11, color: S.muted, textAlign: 'right' }}>{row.label}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', borderTop: `2px solid ${S.red}30`, marginTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: S.red, fontFamily: 'monospace' }}>{fmtMoney(lastPayroll?.total_deductions || 0)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>الإجمالي</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, background: S.card, borderRadius: 9, padding: '10px 14px', border: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: S.gold, fontFamily: 'monospace' }}>{fmtMoney(gross)}</span>
                <span style={{ fontSize: 11, color: S.muted, textAlign: 'right' }}>🔗 يُرحَّل إلى حساب 5001 — رواتب وأجور</span>
              </div>
            </div>

            {/* سجل الرواتب */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${S.border}`, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>📅 سجل الرواتب</div>
              {payroll.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: S.muted, fontSize: 13 }}>لا يوجد سجل بعد</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: S.card }}>
                      {['الشهر', 'الإجمالي', 'الخصومات', 'الصافي', 'الحالة'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : S.card }}>
                        <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600 }}>{p.month}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: S.green, fontFamily: 'monospace' }}>{fmtMoney(p.gross_salary)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: S.red, fontFamily: 'monospace' }}>{fmtMoney(p.total_deductions)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right', color: S.gold2, fontFamily: 'monospace', fontWeight: 700 }}>{fmtMoney(p.net_salary)}</td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: p.status === 'paid' ? S.greenB : S.amberB, color: p.status === 'paid' ? S.green : S.amber, fontWeight: 700 }}>
                            {p.status === 'paid' ? '✓ مُصرف' : '⏳ معلق'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ الحضور والانصراف ══ */}
        {tab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* تاريخ ووقت اليوم */}
            <div style={{ background: S.navy2, border: `1px solid ${S.borderG}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: S.gold2 }}>{currentTime}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: S.muted }}>اليوم</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>

              {/* تبويبي الحضور */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                {/* بداية الدوام */}
                <div style={{ background: checkInDone ? S.greenB : S.card, border: `1px solid ${checkInDone ? S.green : S.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🟢</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 8 }}>بداية الدوام</div>
                  {checkInDone ? (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>
                        {todayAttendance?.check_in ? new Date(todayAttendance.check_in).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: S.muted, marginTop: 4 }}>{fmtDate(todayISO())}</div>
                    </>
                  ) : (
                    <button onClick={handleCheckIn} disabled={saving}
                      style={{ background: S.green, color: S.navy, border: 'none', padding: '10px 24px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', marginTop: 4 }}>
                      {saving ? '...' : 'تسجيل الحضور الآن'}
                    </button>
                  )}
                </div>

                {/* نهاية الدوام */}
                <div style={{ background: checkOutDone ? S.redB : S.card, border: `1px solid ${checkOutDone ? S.red : S.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔴</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 8 }}>نهاية الدوام</div>
                  {checkOutDone ? (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 900, color: S.red, fontFamily: 'monospace' }}>
                        {todayAttendance?.check_out ? new Date(todayAttendance.check_out).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: S.green, marginTop: 4 }}>ساعات العمل: {todayAttendance?.work_hours}h</div>
                    </>
                  ) : checkInDone ? (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <textarea value={todayTasks} onChange={e => setTodayTasks(e.target.value)}
                          placeholder="المهام التي أنجزتها اليوم..." rows={2}
                          style={{ ...inp, resize: 'none', fontSize: 12 } as React.CSSProperties}/>
                      </div>
                      <button onClick={handleCheckOut} disabled={saving}
                        style={{ background: S.red, color: S.white, border: 'none', padding: '10px 24px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {saving ? '...' : 'تسجيل الانصراف'}
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: S.muted, marginTop: 8 }}>سجّل الحضور أولاً</div>
                  )}
                </div>
              </div>
            </div>

            {/* أرشيف الحضور */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${S.border}`, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>📅 سجل الحضور السابق</div>
              {attendance.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: S.muted }}>لا يوجد سجل حضور بعد</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: S.card }}>
                      {['التاريخ', 'وقت الحضور', 'وقت الانصراف', 'ساعات العمل', 'المهام', 'الحالة'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => (
                      <tr key={a.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : S.card }}>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: S.muted, fontSize: 12 }}>{fmtDate(a.date)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: S.green, fontFamily: 'monospace', fontSize: 12 }}>
                          {a.check_in ? new Date(a.check_in).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: S.red, fontFamily: 'monospace', fontSize: 12 }}>
                          {a.check_out ? new Date(a.check_out).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: S.gold, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                          {a.work_hours ? `${a.work_hours}h` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, color: S.muted, maxWidth: 180 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.notes || '—'}</div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                            background: a.status === 'present' ? S.greenB : a.status === 'absent' ? S.redB : S.amberB,
                            color: a.status === 'present' ? S.green : a.status === 'absent' ? S.red : S.amber }}>
                            {a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ الهيكل التنظيمي ══ */}
        {tab === 'orgchart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>🏢 الهيكل التنظيمي — {teamMembers.length} موظف</div>
            {(() => {
              const depts = [...new Set(teamMembers.map(e => e.department).filter(Boolean))]
              if (!depts.length) return (
                <div style={{ textAlign: 'center', color: S.muted, padding: '60px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                  <div>لا توجد بيانات للهيكل التنظيمي</div>
                </div>
              )
              return depts.map(dept => (
                <div key={dept} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 18px', background: S.card2, borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: S.muted }}>{teamMembers.filter(e => e.department === dept).length} موظف</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: S.gold2 }}>{dept}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, padding: 14 }}>
                    {teamMembers.filter(e => e.department === dept).map(emp => (
                      <div key={emp.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, background: `linear-gradient(135deg,${S.gold},${S.navy3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {emp.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.full_name}</div>
                          <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{emp.job_title || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* ══ Modal تقديم طلب ══ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 540, borderRadius: 20, border: `1px solid ${S.borderG}`, maxHeight: '92vh', overflowY: 'auto', direction: 'rtl' }}>

            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S.card2 }}>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 14, fontWeight: 800, color: S.gold2 }}>📋 تقديم طلب جديد</div>
            </div>

            <div style={{ padding: 22 }}>

              {/* نوع الطلب */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 10, textAlign: 'right' }}>نوع الطلب *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {Object.entries(REQUEST_TYPES).map(([key, t]) => (
                    <button key={key} onClick={() => setReqForm(p => ({ ...p, request_type: key }))}
                      style={{ padding: '9px 6px', borderRadius: 9, border: `1px solid ${reqForm.request_type === key ? t.color : S.border}`, background: reqForm.request_type === key ? `${t.color}18` : 'transparent', color: reqForm.request_type === key ? t.color : S.muted, fontSize: 11, fontWeight: reqForm.request_type === key ? 700 : 400, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s' }}>
                      <span style={{ fontSize: 16 }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* حقول الإجازة */}
              {isLeaveReq && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>من تاريخ</label>
                    <input type="date" value={reqForm.leave_from}
                      onChange={e => setReqForm(p => ({ ...p, leave_from: e.target.value }))}
                      style={{ ...inp, colorScheme: 'dark' as any }}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>إلى تاريخ</label>
                    <input type="date" value={reqForm.leave_to}
                      onChange={e => setReqForm(p => ({ ...p, leave_to: e.target.value }))}
                      style={{ ...inp, colorScheme: 'dark' as any }}/>
                  </div>
                  {leaveDaysCalc > 0 && (
                    <div style={{ gridColumn: 'span 2', background: S.blueB, border: `1px solid ${S.blue}30`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: S.blue, fontFamily: 'monospace' }}>{leaveDaysCalc} يوم</span>
                      <span style={{ fontSize: 11, color: S.muted }}>عدد أيام الإجازة</span>
                    </div>
                  )}
                  {reqForm.request_type === 'annual_leave' && leaveDaysCalc > (employee?.annual_leave_balance || 0) && (
                    <div style={{ gridColumn: 'span 2', background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 8, padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: S.red, fontWeight: 700 }}>⚠️ تتجاوز رصيدك ({employee?.annual_leave_balance || 0} يوم)</span>
                    </div>
                  )}
                </div>
              )}

              {/* حقول المال */}
              {isMoneyReq && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>المبلغ المطلوب</label>
                    <input type="number" placeholder="0.00" value={reqForm.amount}
                      onChange={e => setReqForm(p => ({ ...p, amount: e.target.value }))} style={inp}/>
                  </div>
                  {reqForm.request_type === 'loan' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>أشهر السداد</label>
                      <input type="number" placeholder="12" value={reqForm.repayment_months}
                        onChange={e => setReqForm(p => ({ ...p, repayment_months: e.target.value }))} style={inp}/>
                    </div>
                  )}
                  {reqForm.request_type === 'loan' && reqForm.amount && reqForm.repayment_months && (
                    <div style={{ gridColumn: 'span 2', background: S.purpleB, border: `1px solid ${S.purple}30`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: S.purple, fontFamily: 'monospace' }}>
                        {fmtMoney(parseFloat(reqForm.amount) / parseInt(reqForm.repayment_months))} / شهر
                      </span>
                      <span style={{ fontSize: 11, color: S.muted }}>القسط الشهري</span>
                    </div>
                  )}
                </div>
              )}

              {reqForm.request_type === 'resignation' && (
                <div style={{ background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 9, padding: '12px 14px', marginBottom: 14, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 6 }}>⚠️ تنبيه</div>
                  <div style={{ fontSize: 11, color: S.muted, lineHeight: '1.8' }}>
                    يستلزم إشعاراً مسبقاً 30-60 يوم. يحق لك مكافأة نهاية الخدمة حسب سنوات الخدمة.
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>السبب *</label>
                <textarea value={reqForm.reason} onChange={e => setReqForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="اشرح تفاصيل طلبك..." rows={3}
                  style={{ ...inp, resize: 'none' } as React.CSSProperties}/>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.muted, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>ملاحظات إضافية</label>
                <input type="text" value={reqForm.notes} onChange={e => setReqForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="أي معلومات إضافية..." style={inp}/>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.muted, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>
                  {reqForm.request_type === 'sick_leave' ? 'التقرير الطبي (مطلوب)' : 'مرفق (اختياري)'}
                </label>
                <div style={{ position: 'relative', background: S.navy3, border: `2px dashed ${S.border}`, borderRadius: 9, padding: 18, textAlign: 'center' }}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
                  <div style={{ fontSize: 12, color: uploadedFile ? S.green : S.muted }}>
                    {uploadedFile ? `✅ ${uploadedFile.name}` : '📎 اضغط لرفع ملف PDF أو صورة'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                <button onClick={submitRequest} disabled={saving}
                  style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 11, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {saving ? '⏳ جاري الإرسال...' : '✉️ إرسال الطلب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
