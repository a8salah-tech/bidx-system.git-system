'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES } from '../components/options'


// ===== نظام الألوان =====
const S = {
  navy:    '#0A1628', navy2: '#0F2040', navy3: '#0C1A32', navy4: '#162035',
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

// ===== style مشترك للحقول =====
const inp: React.CSSProperties = {
  width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
  borderRadius: '9px', padding: '10px 14px', fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

// ===== أنواع الطلبات =====
const REQUEST_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  annual_leave:    { label: 'إجازة سنوية',    icon: '🏖️', color: S.blue   },
  sick_leave:      { label: 'إجازة مرضية',    icon: '🏥', color: S.red    },
  emergency_leave: { label: 'إجازة طارئة',    icon: '🚨', color: S.amber  },
  unpaid_leave:    { label: 'إجازة بدون راتب', icon: '📋', color: S.muted  },
  advance_salary:  { label: 'سلفة راتب',       icon: '💰', color: S.green  },
  loan:            { label: 'قرض',             icon: '🏦', color: S.purple },
  resignation:     { label: 'استقالة',         icon: '👋', color: S.red    },
  certificate:     { label: 'شهادة عمل',       icon: '📜', color: S.gold   },
  other:           { label: 'طلب آخر',         icon: '📝', color: S.muted  },
}

// ===== حالات الطلبات =====
const REQUEST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'قيد المراجعة', color: S.amber, bg: S.amberB  },
  approved:  { label: 'موافق عليه',   color: S.green, bg: S.greenB  },
  rejected:  { label: 'مرفوض',        color: S.red,   bg: S.redB    },
  cancelled: { label: 'ملغي',         color: S.muted, bg: S.card2   },
}

// ===== دالة تنسيق التاريخ =====
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtMoney(n: number) {
  return n?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
}

// ===== بيانات دليل الموظف =====
const HANDBOOK_SECTIONS = [
  {
    id: 'welcome', icon: '👋', title: 'مرحباً بك في الفريق',
    content: [
      { heading: 'رسالة الترحيب', text: 'يسعدنا انضمامك إلى عائلتنا. نحن نؤمن بأن موظفينا هم أهم أصولنا، ونلتزم بتوفير بيئة عمل محفزة وعادلة لجميع أعضاء الفريق.' },
      { heading: 'رؤيتنا ورسالتنا', text: 'رؤيتنا أن نكون الخيار الأول في مجال التجارة الدولية. رسالتنا تقديم خدمات تجارية استثنائية بالاعتماد على فريق متميز ومتكامل.' },
    ]
  },
  {
    id: 'work_system', icon: '⏰', title: 'نظام العمل',
    content: [
      { heading: 'ساعات العمل', text: 'ساعات العمل الرسمية من 9:00 صباحاً حتى 6:00 مساءً، من الأحد إلى الخميس. يوم العمل 8 ساعات بما فيها استراحة الغداء (ساعة واحدة).' },
      { heading: 'نظام الحضور', text: 'يُطبق نظام تسجيل الحضور الإلكتروني. التأخر عن موعد الحضور 3 مرات يُعادل يوم غياب. الغياب بدون إذن يُخصم من الراتب.' },
      { heading: 'العمل عن بُعد', text: 'يحق للموظف العمل عن بُعد يومين في الأسبوع بعد إتمام 6 أشهر في الشركة، بشرط الحصول على موافقة المدير المباشر.' },
    ]
  },
  {
    id: 'leaves', icon: '🏖️', title: 'سياسة الإجازات',
    content: [
      { heading: 'الإجازة السنوية', text: '30 يوم في السنة للموظفين الذين أتموا سنة كاملة. يمكن ترحيل 15 يوم للسنة التالية فقط. يُصرف بدل نقدي عن الأيام المتبقية.' },
      { heading: 'الإجازة المرضية', text: '15 يوم براتب كامل سنوياً بتقديم تقرير طبي معتمد. تزيد إلى 30 يوم بعد خمس سنوات خدمة.' },
      { heading: 'إجازة الأمومة', text: '90 يوم إجازة أمومة براتب كامل، مع إمكانية تمديدها 30 يوماً بدون راتب.' },
      { heading: 'إجازة الأبوة', text: '5 أيام عمل براتب كامل عند ولادة المولود.' },
      { heading: 'الإجازات الرسمية', text: 'أيام العطل الرسمية المعلنة من الحكومة، إضافة إلى اليوم الوطني والمناسبات الدينية.' },
    ]
  },
  {
    id: 'salary', icon: '💰', title: 'نظام الرواتب والمزايا',
    content: [
      { heading: 'موعد صرف الراتب', text: 'يُصرف الراتب في اليوم الخامس والعشرين من كل شهر. إذا صادف يوم إجازة، يُصرف اليوم السابق.' },
      { heading: 'مكونات الراتب', text: 'الراتب الأساسي + بدل السكن (25%) + بدل المواصلات (10%) + البدلات الأخرى حسب الوظيفة.' },
      { heading: 'مكافأة الأداء', text: 'مكافأة نصف سنوية تُصرف في يونيو وديسمبر بناءً على تقييم الأداء.' },
      { heading: 'التأمين الصحي', text: 'تأمين صحي شامل للموظف وأسرته (الزوج/ة وحتى 3 أبناء).' },
    ]
  },
  {
    id: 'conduct', icon: '🤝', title: 'ميثاق السلوك المهني',
    content: [
      { heading: 'الالتزام بالسرية', text: 'يلتزم الموظف بعدم إفشاء أي معلومات تجارية أو عملاء أو موردين لأي طرف خارجي خلال فترة العمل وبعدها بسنتين.' },
      { heading: 'اللباس الرسمي', text: 'اللباس الرسمي مطلوب في أيام العمل. الاثنين والخميس أيام Casual بلباس محترم.' },
      { heading: 'استخدام التكنولوجيا', text: 'أجهزة الشركة للاستخدام المهني. يُسمح باستخدام شخصي محدود. ممنوع تحميل برامج غير مرخصة.' },
    ]
  },
  {
    id: 'career', icon: '📈', title: 'التطوير والمسار الوظيفي',
    content: [
      { heading: 'تقييم الأداء', text: 'تقييم سنوي شامل في ديسمبر، مع مراجعة نصف سنوية في يونيو. النتائج تؤثر في زيادة الراتب والمكافآت.' },
      { heading: 'برنامج التدريب', text: 'تدريب إلزامي أول 90 يوم. دورات تطوير مهنية مدفوعة من الشركة حتى 5,000 ريال سنوياً.' },
      { heading: 'الترقية الوظيفية', text: 'يُمكن الترقي بعد سنتين من الأداء المتميز. الترقية تحتاج مراجعة الإدارة العليا والموارد البشرية.' },
    ]
  },
  {
    id: 'resignation', icon: '👋', title: 'إجراءات إنهاء الخدمة',
    content: [
      { heading: 'فترة الإشعار', text: 'إشعار مسبق 30 يوم للموظفين تحت السنة، و60 يوم لمن تجاوز سنة. يمكن الإعفاء منها باتفاق الطرفين.' },
      { heading: 'مكافأة نهاية الخدمة', text: 'راتب شهر عن كل سنة عمل للسنوات الخمس الأولى، وراتب شهر ونصف عن كل سنة بعدها.' },
      { heading: 'تسليم المهام', text: 'يلتزم الموظف بتسليم كامل المهام والملفات والأجهزة والبطاقة قبل آخر يوم عمل.' },
      { heading: 'شهادة الخبرة', text: 'تُصدر شهادة الخبرة خلال 5 أيام عمل من آخر يوم. يُمكن طلبها بعد الفترة بتقديم نموذج عبر المنصة.' },
    ]
  },
]

// ===================================================
// الصفحة الرئيسية
// ===================================================
export default function HRPage() {
  const [tab, setTab] = useState<'handbook' | 'payroll' | 'requests' | 'orgchart' | 'attendance'>('handbook')
  const [employee, setEmployee]   = useState<any>(null)
  const [requests, setRequests]   = useState<any[]>([])
  const [payroll, setPayroll]     = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [selectedSection, setSelectedSection] = useState('welcome')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [requestForm, setRequestForm] = useState({
    request_type: 'annual_leave',
    leave_from: '',
    leave_to: '',
    leave_days: '',
    amount: '',
    repayment_months: '',
    reason: '',
    notes: '',
  })

  // ── تحميل البيانات ──
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [empRes, reqRes, payRes, teamRes] = await Promise.all([
        supabase.from('employees').select('*').eq('user_id', user.id).single(),
        supabase.from('hr_requests').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payroll').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('employees').select('id, full_name, job_title, department, avatar_url, manager_id').eq('status', 'active').limit(20),
      ])

      setEmployee(empRes.data)
      setRequests(reqRes.data || [])
      setPayroll(payRes.data || [])
      setTeamMembers(teamRes.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── حفظ طلب جديد ──
  async function submitRequest() {
    if (!employee) { alert('لم يتم العثور على بيانات الموظف'); return }
    if (!requestForm.reason) { alert('أدخل سبب الطلب'); return }
    setSaving(true)

    let attachmentUrl = null
    if (uploadedFile) {
      setUploading(true)
      const ext = uploadedFile.name.split('.').pop()
      const path = `hr-requests/${employee.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('hr-attachments').upload(path, uploadedFile)
      if (!upErr) attachmentUrl = path
      setUploading(false)
    }

    // حساب أيام الإجازة تلقائياً
    let leaveDays = parseFloat(requestForm.leave_days) || 0
    if (requestForm.leave_from && requestForm.leave_to) {
      const diff = (new Date(requestForm.leave_to).getTime() - new Date(requestForm.leave_from).getTime()) / (1000 * 60 * 60 * 24)
      leaveDays = diff + 1
    }

    const { error } = await supabase.from('hr_requests').insert([{
      employee_id:      employee.id,
      request_type:     requestForm.request_type,
      leave_from:       requestForm.leave_from || null,
      leave_to:         requestForm.leave_to || null,
      leave_days:       leaveDays || null,
      amount:           parseFloat(requestForm.amount) || null,
      repayment_months: parseInt(requestForm.repayment_months) || null,
      reason:           requestForm.reason,
      notes:            requestForm.notes,
      attachment_url:   attachmentUrl,
      status:           'pending',
    }])

    if (error) { alert('خطأ: ' + error.message) }
    else {
      setShowRequestForm(false)
      setRequestForm({ request_type: 'annual_leave', leave_from: '', leave_to: '', leave_days: '', amount: '', repayment_months: '', reason: '', notes: '' })
      setUploadedFile(null)
      await loadData()
    }
    setSaving(false)
  }

  // ── حسابات الراتب ──
  const gross   = (employee?.basic_salary || 0) + (employee?.housing_allowance || 0) + (employee?.transport_allowance || 0) + (employee?.other_allowances || 0)
  const lastPayroll = payroll[0]
  const netSalary   = lastPayroll?.net_salary || gross

  // ── احتساب أيام الإجازة المطلوبة ──
  const leaveDaysCalc = requestForm.leave_from && requestForm.leave_to
    ? Math.max(0, Math.round((new Date(requestForm.leave_to).getTime() - new Date(requestForm.leave_from).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0

  const isLeaveRequest = ['annual_leave', 'sick_leave', 'emergency_leave', 'unpaid_leave'].includes(requestForm.request_type)
  const isMoneyRequest = ['advance_salary', 'loan'].includes(requestForm.request_type)

  const TABS = [
    { key: 'handbook',   label: '📖 دليل الموظف',      desc: 'السياسات والأنظمة' },
    { key: 'payroll',    label: '💰 الرواتب',           desc: 'تفاصيل المرتبات' },
    { key: 'requests',   label: '📋 طلباتي',            desc: 'الإجازات والطلبات' },
    { key: 'orgchart',   label: '🏢 الهيكل التنظيمي',   desc: 'فريق العمل' },
    { key: 'attendance', label: '⏰ الحضور والانصراف',   desc: 'سجل الحضور' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48, animation: 'spin 2s linear infinite' }}>⚙️</div>
      <div style={{ fontSize: 16 }}>جاري تحميل بيانات الموظف...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy, overflow: 'hidden' }}>

      {/* ── بطاقات الإحصائيات ── */}
      <div style={{ background: `linear-gradient(135deg, ${S.navy2} 0%, ${S.navy3} 100%)`, borderBottom: `1px solid ${S.border}`, padding: '16px 24px', flexShrink: 0 }}>

        {/* هيدر الموظف */}
        {employee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexDirection: 'row-reverse' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${S.gold},${S.navy2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0, border: `2px solid ${S.gold}40` }}>
              {employee.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '??'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.white }}>{employee.full_name}</div>
              <div style={{ fontSize: 12, color: S.gold2, marginTop: 2 }}>{employee.job_title} • {employee.department}</div>
              <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>{employee.employee_number} • تاريخ التعيين: {fmtDate(employee.hire_date)}</div>
            </div>
          </div>
        )}

        {/* بطاقات الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            {
              icon: '🏖️', label: 'رصيد الإجازات',
              val: `${employee?.annual_leave_balance || 0} يوم`,
              sub: `مرضية: ${employee?.sick_leave_balance || 0} | طارئة: ${employee?.emergency_leave_balance || 0}`,
              color: S.blue, bg: S.blueB,
            },
            {
              icon: '💵', label: 'الراتب الصافي',
              val: `${fmtMoney(netSalary)}`,
              sub: `إجمالي: ${fmtMoney(gross)} | يُصرف: 25 كل شهر`,
              color: S.green, bg: S.greenB,
            },
            {
              icon: '📋', label: 'الطلبات المعلقة',
              val: `${requests.filter(r => r.status === 'pending').length} طلب`,
              sub: `إجمالي طلباتي: ${requests.length} طلب`,
              color: S.amber, bg: S.amberB,
            },
            {
              icon: '⏰', label: 'مدة الخدمة',
              val: employee?.hire_date ? `${Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000*60*60*24*30))} شهر` : '—',
              sub: employee?.hire_date ? `منذ ${fmtDate(employee.hire_date)}` : 'لم يُحدد',
              color: S.gold, bg: S.gold3,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: 'monospace' }}>{s.val}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.muted, textAlign: 'right', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 9, color: S.muted, textAlign: 'right' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── التبويبات ── */}
      <div style={{ display: 'flex', background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', borderBottom: tab === t.key ? `2px solid ${S.gold}` : '2px solid transparent', background: 'transparent', color: tab === t.key ? S.gold2 : S.muted, transition: 'all .2s', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ══ دليل الموظف ══ */}
        {tab === 'handbook' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

            {/* القائمة الجانبية */}
            <div style={{ background: S.navy2, borderRadius: 14, padding: 12, border: `1px solid ${S.border}`, height: 'fit-content', position: 'sticky', top: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.muted, marginBottom: 12, textAlign: 'right', letterSpacing: '.5px' }}>محتويات الدليل</div>
              {HANDBOOK_SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => setSelectedSection(sec.id)}
                  style={{ width: '100%', textAlign: 'right', padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 12, fontWeight: selectedSection === sec.id ? 700 : 500, background: selectedSection === sec.id ? S.gold3 : 'transparent', color: selectedSection === sec.id ? S.gold2 : S.muted, borderRight: selectedSection === sec.id ? `3px solid ${S.gold}` : '3px solid transparent', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', transition: 'all .15s' }}>
                  <span style={{ fontSize: 11 }}>{sec.title}</span>
                  <span>{sec.icon}</span>
                </button>
              ))}
            </div>

            {/* المحتوى */}
            <div>
              {HANDBOOK_SECTIONS.filter(s => s.id === selectedSection).map(sec => (
                <div key={sec.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexDirection: 'row-reverse' }}>
                    <span style={{ fontSize: 32 }}>{sec.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: S.white }}>{sec.title}</div>
                      <div style={{ height: 2, width: 60, background: `linear-gradient(90deg,${S.gold},transparent)`, marginTop: 6, marginRight: 0 }}/>
                    </div>
                  </div>
                  {sec.content.map((item, i) => (
                    <div key={i} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, marginBottom: 12, borderRight: `4px solid ${S.gold}` }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.gold2, marginBottom: 10, textAlign: 'right' }}>{item.heading}</div>
                      <div style={{ fontSize: 13, color: S.white, lineHeight: '1.9', textAlign: 'right' }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ الرواتب ══ */}
        {tab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* بطاقة الراتب الحالي */}
            <div style={{ background: `linear-gradient(135deg, ${S.navy2} 0%, #0A1F35 100%)`, border: `1px solid ${S.borderG}`, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: `${S.gold}08` }}/>
              <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: `${S.gold}05` }}/>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>يُصرف كل شهر في</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>اليوم 25</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>صافي الراتب الشهري</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: S.gold2, fontFamily: 'monospace' }}>{fmtMoney(netSalary)}</div>
                  </div>
                </div>

                {/* تفصيل الراتب */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* المستحقات */}
                  <div style={{ background: S.greenB, border: `1px solid ${S.green}30`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.green, marginBottom: 12, textAlign: 'right' }}>📈 المستحقات</div>
                    {[
                      { label: 'الراتب الأساسي',   val: employee?.basic_salary || 0 },
                      { label: 'بدل السكن',         val: employee?.housing_allowance || 0 },
                      { label: 'بدل المواصلات',     val: employee?.transport_allowance || 0 },
                      { label: 'بدلات أخرى',        val: employee?.other_allowances || 0 },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${S.green}15` : 'none' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: S.green, fontFamily: 'monospace' }}>{fmtMoney(row.val)}</span>
                        <span style={{ fontSize: 11, color: S.muted }}>{row.label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', marginTop: 4, borderTop: `2px solid ${S.green}30` }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>{fmtMoney(gross)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>الإجمالي</span>
                    </div>
                  </div>

                  {/* الخصومات */}
                  <div style={{ background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 12, textAlign: 'right' }}>📉 الخصومات</div>
                    {[
                      { label: 'خصم الغياب',    val: lastPayroll?.deduction_absence || 0 },
                      { label: 'استقطاع سلفة',  val: lastPayroll?.deduction_advance || 0 },
                      { label: 'استقطاع قرض',   val: lastPayroll?.deduction_loan || 0 },
                      { label: 'خصومات أخرى',   val: lastPayroll?.deduction_other || 0 },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${S.red}15` : 'none' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: S.red, fontFamily: 'monospace' }}>{fmtMoney(row.val)}</span>
                        <span style={{ fontSize: 11, color: S.muted }}>{row.label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', marginTop: 4, borderTop: `2px solid ${S.red}30` }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: S.red, fontFamily: 'monospace' }}>{fmtMoney(lastPayroll?.total_deductions || 0)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.white }}>الإجمالي</span>
                    </div>
                  </div>
                </div>

                {/* ربط بالحسابات */}
                <div style={{ marginTop: 16, background: S.card, borderRadius: 10, padding: '12px 16px', border: `1px solid ${S.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 8, textAlign: 'right' }}>🔗 ربط دليل الحسابات</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: S.muted }}>يُرحَّل إلى حساب 5001 — رواتب وأجور</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: S.gold, fontFamily: 'monospace' }}>مصروفات ← {fmtMoney(gross)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* سجل الرواتب السابقة */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${S.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.white, textAlign: 'right' }}>📅 سجل الرواتب السابقة</div>
              </div>
              {payroll.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: S.muted, fontSize: 13 }}>لا يوجد سجل رواتب بعد</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['الشهر', 'الإجمالي', 'الخصومات', 'الصافي', 'الحالة'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : S.card }}>
                        <td style={{ padding: '12px 16px', color: S.white, fontWeight: 600, textAlign: 'right' }}>{p.month}</td>
                        <td style={{ padding: '12px 16px', color: S.green, fontFamily: 'monospace', textAlign: 'right' }}>{fmtMoney(p.gross_salary)}</td>
                        <td style={{ padding: '12px 16px', color: S.red, fontFamily: 'monospace', textAlign: 'right' }}>{fmtMoney(p.total_deductions)}</td>
                        <td style={{ padding: '12px 16px', color: S.gold2, fontFamily: 'monospace', fontWeight: 700, textAlign: 'right' }}>{fmtMoney(p.net_salary)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
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

        {/* ══ الطلبات ══ */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* زر الطلب الجديد */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRequestForm(true)}
                style={{ background: S.gold, color: S.navy, border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                + تقديم طلب جديد
              </button>
            </div>

            {/* بطاقات أنواع الطلبات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {Object.entries(REQUEST_TYPES).slice(0, 6).map(([key, t]) => (
                <button key={key} onClick={() => { setRequestForm(prev => ({ ...prev, request_type: key })); setShowRequestForm(true) }}
                  style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', textAlign: 'right', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>اضغط للتقديم</div>
                  </div>
                </button>
              ))}
            </div>

            {/* جدول الطلبات */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: S.muted }}>{requests.length} طلب</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: S.white }}>سجل طلباتي</span>
              </div>
              {requests.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: S.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14 }}>لا توجد طلبات بعد — ابدأ بتقديم أول طلب</div>
                </div>
              ) : requests.map((r, i) => {
                const rt = REQUEST_TYPES[r.request_type] || REQUEST_TYPES.other
                const rs = REQUEST_STATUS[r.status] || REQUEST_STATUS.pending
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i > 0 ? `1px solid ${S.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 10, color: S.muted, fontFamily: 'monospace' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: rs.bg, color: rs.color, fontWeight: 700 }}>{rs.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${rt.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{rt.icon}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rt.color }}>{rt.label}</div>
                        <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
                          {r.leave_from && r.leave_to ? `${fmtDate(r.leave_from)} → ${fmtDate(r.leave_to)} (${r.leave_days} يوم)` : r.reason?.slice(0, 50) || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ الهيكل التنظيمي ══ */}
        {tab === 'orgchart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: S.white, textAlign: 'right' }}>🏢 فريق العمل — {teamMembers.length} موظف نشط</div>

            {/* تجميع حسب القسم */}
            {(() => {
              const depts = [...new Set(teamMembers.map(e => e.department).filter(Boolean))]
              return depts.length === 0 ? (
                <div style={{ textAlign: 'center', color: S.muted, padding: '60px 0', fontSize: 14 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                  لا توجد بيانات للهيكل التنظيمي بعد
                </div>
              ) : depts.map(dept => {
                const deptMembers = teamMembers.filter(e => e.department === dept)
                return (
                  <div key={dept} style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 20px', background: S.card2, borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: S.muted }}>{deptMembers.length} موظف</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: S.gold2 }}>{dept}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: 16 }}>
                      {deptMembers.map(emp => (
                        <div key={emp.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '14px', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row-reverse' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg,${S.gold},${S.navy3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {emp.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: S.white }}>{emp.full_name}</div>
                            <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{emp.job_title || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* ══ الحضور والانصراف ══ */}
        {tab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.white, marginBottom: 8 }}>سجل الحضور والانصراف</div>
              <div style={{ fontSize: 13, color: S.muted, marginBottom: 20 }}>سيُعرض هنا سجل حضورك اليومي وإجمالي ساعات العمل</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 500, margin: '0 auto' }}>
                {[
                  { label: 'أيام الحضور هذا الشهر', val: '22', color: S.green },
                  { label: 'أيام الغياب',             val: '0',  color: S.red },
                  { label: 'إجمالي الساعات',          val: '176', color: S.blue },
                ].map((s, i) => (
                  <div key={i} style={{ background: S.card, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ Modal تقديم طلب ══ */}
      {showRequestForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 560, borderRadius: 20, border: `1px solid ${S.borderG}`, maxHeight: '92vh', overflowY: 'auto', direction: 'rtl' }}>

            {/* رأس المودال */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S.card2 }}>
              <button onClick={() => setShowRequestForm(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: 15, fontWeight: 800, color: S.gold2 }}>📋 تقديم طلب جديد</div>
            </div>

            <div style={{ padding: 24 }}>

              {/* نوع الطلب */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 10, textAlign: 'right' }}>نوع الطلب *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {Object.entries(REQUEST_TYPES).map(([key, t]) => (
                    <button key={key} onClick={() => setRequestForm(prev => ({ ...prev, request_type: key }))}
                      style={{ padding: '10px 8px', borderRadius: 10, border: `1px solid ${requestForm.request_type === key ? t.color : S.border}`, background: requestForm.request_type === key ? `${t.color}18` : 'transparent', color: requestForm.request_type === key ? t.color : S.muted, fontSize: 11, fontWeight: requestForm.request_type === key ? 700 : 400, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s' }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* حقول الإجازة */}
              {isLeaveRequest && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>تاريخ البداية</label>
                    <input type="date" value={requestForm.leave_from}
                      onChange={e => setRequestForm(prev => ({ ...prev, leave_from: e.target.value }))}
                      style={{ ...inp, colorScheme: 'dark' as any }}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>تاريخ النهاية</label>
                    <input type="date" value={requestForm.leave_to}
                      onChange={e => setRequestForm(prev => ({ ...prev, leave_to: e.target.value }))}
                      style={{ ...inp, colorScheme: 'dark' as any }}/>
                  </div>
                  {leaveDaysCalc > 0 && (
                    <div style={{ gridColumn: 'span 2', background: S.blueB, border: `1px solid ${S.blue}30`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: S.blue, fontFamily: 'monospace' }}>{leaveDaysCalc} يوم</span>
                      <span style={{ fontSize: 12, color: S.muted }}>عدد أيام الإجازة المطلوبة</span>
                    </div>
                  )}
                  {/* تحقق من رصيد الإجازة */}
                  {requestForm.request_type === 'annual_leave' && leaveDaysCalc > (employee?.annual_leave_balance || 0) && (
                    <div style={{ gridColumn: 'span 2', background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 8, padding: '10px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: S.red, fontWeight: 700 }}>⚠️ الأيام المطلوبة ({leaveDaysCalc}) تتجاوز رصيدك ({employee?.annual_leave_balance || 0} يوم)</span>
                    </div>
                  )}
                </div>
              )}

              {/* حقول السلفة / القرض */}
              {isMoneyRequest && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>المبلغ المطلوب</label>
                    <input type="number" placeholder="0.00" value={requestForm.amount}
                      onChange={e => setRequestForm(prev => ({ ...prev, amount: e.target.value }))} style={inp}/>
                  </div>
                  {requestForm.request_type === 'loan' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>عدد أشهر السداد</label>
                      <input type="number" placeholder="12" value={requestForm.repayment_months}
                        onChange={e => setRequestForm(prev => ({ ...prev, repayment_months: e.target.value }))} style={inp}/>
                    </div>
                  )}
                  {requestForm.request_type === 'loan' && requestForm.amount && requestForm.repayment_months && (
                    <div style={{ gridColumn: 'span 2', background: S.purpleB, border: `1px solid ${S.purple}30`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: S.purple, fontFamily: 'monospace' }}>
                        {fmtMoney(parseFloat(requestForm.amount) / parseInt(requestForm.repayment_months))} / شهر
                      </span>
                      <span style={{ fontSize: 12, color: S.muted }}>قسط السداد الشهري</span>
                    </div>
                  )}
                </div>
              )}

              {/* السبب */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.gold, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>
                  {requestForm.request_type === 'resignation' ? 'سبب الاستقالة *' : 'السبب / التفاصيل *'}
                </label>
                <textarea value={requestForm.reason}
                  onChange={e => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={requestForm.request_type === 'resignation' ? 'يرجى ذكر سبب الاستقالة بشكل واضح...' : 'اشرح تفاصيل طلبك هنا...'}
                  rows={3} style={{ ...inp, resize: 'none' } as React.CSSProperties}/>
              </div>

              {/* ملاحظات إضافية */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.muted, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>ملاحظات إضافية (اختياري)</label>
                <input type="text" value={requestForm.notes}
                  onChange={e => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي معلومات إضافية..." style={inp}/>
              </div>

              {/* رفع مرفق */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: S.muted, fontWeight: 700, marginBottom: 6, textAlign: 'right' }}>
                  {requestForm.request_type === 'sick_leave' ? 'التقرير الطبي (مطلوب)' : 'مرفق (اختياري)'}
                </label>
                <div style={{ position: 'relative', background: S.navy3, border: `2px dashed ${S.border}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setUploadedFile(e.target.files?.[0] ?? null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
                  <div style={{ fontSize: 13, color: uploadedFile ? S.green : S.muted }}>
                    {uploadedFile ? `✅ ${uploadedFile.name}` : '📎 اضغط لرفع ملف (PDF أو صورة)'}
                  </div>
                </div>
              </div>

              {/* تحذير الاستقالة */}
              {requestForm.request_type === 'resignation' && (
                <div style={{ background: S.redB, border: `1px solid ${S.red}30`, borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.red, marginBottom: 6 }}>⚠️ تنبيه هام</div>
                  <div style={{ fontSize: 12, color: S.muted, lineHeight: '1.8' }}>
                    تقديم طلب الاستقالة يستلزم إشعاراً مسبقاً 30-60 يوم. ستحتاج لتسليم كامل مهامك. يحق لك مكافأة نهاية الخدمة حسب سنوات الخدمة.
                  </div>
                </div>
              )}

              {/* أزرار */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <button onClick={() => setShowRequestForm(false)}
                  style={{ background: S.card2, color: S.white, border: `1px solid ${S.border}`, padding: 12, borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                <button onClick={submitRequest} disabled={saving || uploading}
                  style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {saving ? '⏳ جاري الإرسال...' : uploading ? '⬆️ جاري الرفع...' : '✉️ إرسال الطلب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
