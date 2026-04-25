'use client'

// ===== الاستيرادات =====
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// ===== نظام الألوان الموحد =====
const S = {
  navy:    '#0A1628',
  navy2:   '#0F2040',
  navy3:   '#0C1A32',
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  gold3:   'rgba(201,168,76,0.10)',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  border:  'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.18)',
  green:   '#22C55E',
  red:     '#EF4444',
  amber:   '#F59E0B',
  blue:    '#3B82F6',
  purple:  '#8B5CF6',
  card:    'rgba(255,255,255,0.04)',
  card2:   'rgba(255,255,255,0.08)',
}

// ===== أقسام النظام وصلاحياتها =====
const DEPARTMENTS = [
  { id: 'all',        label: 'كل الأقسام (مدير عام)' },
  { id: 'suppliers',  label: 'إدارة الموردين' },
  { id: 'products',   label: 'إدارة المنتجات' },
  { id: 'customers',  label: 'إدارة العملاء' },
  { id: 'accounting', label: 'إدارة الحسابات' },
  { id: 'operations', label: 'إدارة التشغيل' },
  { id: 'hr',         label: 'الموارد البشرية' },
]

// ===== مكون الرسم البياني SVG =====
function SparkLine({ data, color }: { data: number[], color: string }) {
  const max = Math.max(...data, 1)
  const w = 200, h = 40
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - 4 - (v / max) * (h - 8)
    return `${x},${y}`
  }).join(' ')
  const fill = `0,${h} ${pts} ${w},${h}`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ===== مكون البطاقة =====
function Card({
  label, value, sub, color, icon, chart, onClick, alert: isAlert
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: string; chart?: number[];
  onClick?: () => void; alert?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: S.navy2,
        border: `1px solid ${isAlert ? color : S.border}`,
        borderRadius: '12px', padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .15s',
        boxShadow: isAlert ? `0 0 18px ${color}30` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {isAlert && (
        <span style={{ position: 'absolute', top: 8, left: 10, width: 7, height: 7, borderRadius: '50%', background: color, display: 'block', animation: 'blink 1.5s infinite' }}/>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: S.muted, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontSize: 11, color: S.muted, fontWeight: 600, marginBottom: chart ? 8 : 0 }}>{label}</div>
      {chart && <SparkLine data={chart} color={color}/>}
    </div>
  )
}

// ===== رأس القسم =====
function SectionHead({ title, icon, color, href, router }: {
  title: string; icon: string; color: string; href?: string; router: ReturnType<typeof useRouter>;
}) {
  return (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
  
  {/* 👈 ده هيبقى الشمال */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 14, fontWeight: 800, color: S.white }}>{title}</span>
    <div style={{ width: 4, height: 18, background: color, borderRadius: 2 }}/>
  </div>

  {/* 👈 ده هيبقى اليمين */}
  {href ? (
    <button
      onClick={() => router.push(href)}
      style={{
        fontSize: 11,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: '4px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 700
      }}
    >
      عرض الكل ←
    </button>
  ) : <span/>}

</div>
  )
}

// ===== الصفحة الرئيسية =====
export default function DashboardPage() {
  const router = useRouter()

  // ── الموردين ──
  const [suppTotal,     setSuppTotal]     = useState(0)
  const [suppActive,    setSuppActive]    = useState(0)
  const [suppSuspended, setSuppSuspended] = useState(0)
  const [suppDeals,     setSuppDeals]     = useState(0)

  // ── المنتجات ──
  const [prodTotal, setProdTotal] = useState(0)
  const [prodTop,   setProdTop]   = useState('—')
  const [prodLow,   setProdLow]   = useState('—')
  const [prodAvg,   setProdAvg]   = useState('0')

  // ── العملاء ──
  const [custTotal,     setCustTotal]     = useState(0)
  const [custNegotiate, setCustNegotiate] = useState(0)
  const [custPending,   setCustPending]   = useState(0)
  const [custDone,      setCustDone]      = useState(0)

  // ── الحسابات ──
  const [receipts, setReceipts] = useState(0)
  const [payments, setPayments] = useState(0)
  const [custBal,  setCustBal]  = useState(0)
  const [suppBal,  setSuppBal]  = useState(0)

  // ── التشغيل ──
  const [opNew,     setOpNew]     = useState(0)
  const [opProcess, setOpProcess] = useState(0)
  const [opReady,   setOpReady]   = useState(0)
  const [opDone,    setOpDone]    = useState(0)

  // ── الموارد البشرية ──
  const [hrCount,    setHrCount]    = useState(0)
  const [hrSalaries, setHrSalaries] = useState(0)
  const [hrTrust,    setHrTrust]    = useState(0)
  const [hrLeave,    setHrLeave]    = useState('لا يوجد')

  // ── واجهة إنشاء حساب ──
  const [showAddUser, setShowAddUser] = useState(false)
  const [addingUser,  setAddingUser]  = useState(false)
  const [newUser, setNewUser] = useState({
    full_name: '', email: '', password: '',
    department: 'suppliers', role: 'viewer',
  })

  // ── معلومات المستخدم ──
  const [userName,    setUserName]    = useState('')
  const [userRole,    setUserRole]    = useState('admin')
  const [companyName] = useState('لوحة التحكم الرئيسية')
  const [currentTime, setCurrentTime] = useState('')

  // ── الحسابات المرتبطة ──
  const [accAssets,     setAccAssets]     = useState(0)
  const [accLiabilities,setAccLiabilities]= useState(0)
  const [accEquity,     setAccEquity]     = useState(0)
  const [accNetProfit,  setAccNetProfit]  = useState(0)
  const [accCurrency,   setAccCurrency]   = useState('$')

  // ── التسويق المرتبط ──
  const [mktTotal,      setMktTotal]      = useState(0)
  const [mktHot,        setMktHot]        = useState(0)
  const [mktContacted,  setMktContacted]  = useState(0)
  const [mktTasks,      setMktTasks]      = useState(0)
  const [mktFollowup,   setMktFollowup]   = useState(0)

  // ── الوضع العام ──
  const [companyHealth, setCompanyHealth] = useState({
    score: 0,
    suppliersGrowth: 0,
    customersGrowth: 0,
    dealsLast3m: 0,
    dealsNext3m: 0,
    pendingFollowups: 0,
    expiredDocs: 0,
    hotLeads: 0,
    totalRevenue: 0,
    totalExpenses: 0,
  })

  // ── الرسم البياني الديناميكي (7 أيام) ──
  const [chartData, setChartData] = useState({
    supp:  [0,0,0,0,0,0,0],
    cust:  [0,0,0,0,0,0,0],
    op:    [0,0,0,0,0,0,0],
    prod:  [0,0,0,0,0,0,0],
  })

  // ── رسم بياني (fallback) ──
  const suppChart = chartData.supp
  const custChart = chartData.cust
  const opChart   = chartData.op
  const prodChart = chartData.prod

  // ===== تحميل البيانات =====
  useEffect(() => {
    loadAll()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'المدير')
        setUserRole(user.user_metadata?.role || 'admin')
      }
    })

    const tick = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }))
    }
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id

    // ── الموردين ──
    const { data: supps } = await supabase.from('suppliers').select('status,total_deals,created_at')
    if (supps) {
      setSuppTotal(supps.length)
      setSuppActive(supps.filter(s => s.status === 'active').length)
      setSuppSuspended(supps.filter(s => s.status === 'suspended').length)
      setSuppDeals(supps.reduce((a, b) => a + (b.total_deals || 0), 0))
    }

    // ── المنتجات ──
    const { data: prods } = await supabase.from('supplier_products').select('name,created_at')
    if (prods) {
      setProdTotal(prods.length)
      if (supps && supps.length > 0) setProdAvg((prods.length / supps.length).toFixed(1))
    }

    // ── العملاء ──
    const { data: custs } = await supabase.from('customers').select('status,created_at')
    if (custs) {
      setCustTotal(custs.length)
      setCustNegotiate(custs.filter(c => c.status === 'negotiating').length)
      setCustPending(custs.filter(c => c.status === 'pending').length)
      setCustDone(custs.filter(c => c.status === 'completed').length)
    }

    // ── أوامر الشراء ──
    let orders: any[] | null = null
try {
  const { data } = await supabase.from('purchase_orders').select('status')
  orders = data
} catch { orders = null }
    if (orders) {
      setOpNew(orders.filter((o:any) => o.status === 'published').length)
      setOpProcess(orders.filter((o:any) => o.status === 'approved').length)
      setOpReady(orders.filter((o:any) => o.status === 'ready').length)
      setOpDone(orders.filter((o:any) => o.status === 'completed').length)
    }

    // ── الحسابات — مرتبط بـ account_balances ──
    const [accR, balR, vchR] = await Promise.all([
      supabase.from('accounts').select('account_type'),
      supabase.from('account_balances').select('*').eq('user_id', uid||''),
      supabase.from('vouchers').select('voucher_type,amount,status').eq('user_id', uid||'').eq('status','active'),
    ])
    if (accR.data && balR.data) {
      const accWithBal = (accR.data as any[]).map((acc:any, i:number) => ({
        ...acc,
        balance: (balR.data as any[])[i]?.balance || 0
      }))
      // نحسب من vouchers النشطة فقط
      const activeVch = (vchR.data as any[]) || []
      const totalReceipts = activeVch.filter(v => v.voucher_type === 'receipt').reduce((s:number,v:any) => s+(v.amount||0), 0)
      const totalPayments = activeVch.filter(v => v.voucher_type === 'payment').reduce((s:number,v:any) => s+(v.amount||0), 0)

      const assets = (balR.data as any[]).reduce((s:number,b:any) => {
        const acc = (accR.data as any[]).find(a => a.id === (b as any).account_id)
        return acc?.account_type === 'asset' ? s + (b.balance||0) : s
      }, 0)
      const liabilities = (balR.data as any[]).reduce((s:number,b:any) => {
        const acc = (accR.data as any[]).find(a => a.id === (b as any).account_id)
        return acc?.account_type === 'liability' ? s + Math.abs(b.balance||0) : s
      }, 0)
      const income = (balR.data as any[]).reduce((s:number,b:any) => {
        const acc = (accR.data as any[]).find(a => a.id === (b as any).account_id)
        return acc?.account_type === 'income' ? s + (b.balance||0) : s
      }, 0)
      const expenses = (balR.data as any[]).reduce((s:number,b:any) => {
        const acc = (accR.data as any[]).find(a => a.id === (b as any).account_id)
        return acc?.account_type === 'expense' ? s + (b.balance||0) : s
      }, 0)

      setReceipts(totalReceipts)
      setPayments(totalPayments)
      setAccAssets(assets)
      setAccLiabilities(liabilities)
      setAccEquity(assets - liabilities)
      setAccNetProfit(income - expenses)
    }

    // ── التسويق — مرتبط بـ marketing_leads ──
    const [leadsR, tasksR] = await Promise.all([
      supabase.from('marketing_leads').select('stage_id,contacted_at,next_followup_at,last_action_at').eq('created_by', uid||''),
      supabase.from('marketing_tasks').select('id').eq('created_by', uid||''),
    ])
    if (leadsR.data) {
      const leads = leadsR.data as any[]
      const today = new Date().toISOString().split('T')[0]
      setMktTotal(leads.length)
      setMktHot(leads.filter(l => l.stage_id === 'action').length)
      setMktContacted(leads.filter(l => l.contacted_at && l.contacted_at.startsWith(today)).length)
      setMktFollowup(leads.filter(l => {
        if (!l.next_followup_at) return false
        return new Date(l.next_followup_at) <= new Date()
      }).length)
    }
    if (tasksR.data) setMktTasks(tasksR.data.length)

    // ── الرسم البياني الديناميكي (آخر 7 أيام فعلية) ──
    const days7 = Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()-6+i)
      return d.toISOString().split('T')[0]
    })
    const suppByDay = days7.map(d => (supps||[]).filter((s:any) => s.created_at?.startsWith(d)).length)
    const custByDay = days7.map(d => (custs||[]).filter((c:any) => c.created_at?.startsWith(d)).length)
    const leadsByDay = days7.map(d => ((leadsR.data||[]) as any[]).filter((l:any) => l.last_action_at?.startsWith(d)).length)
    const prodByDay  = days7.map(d => (prods||[]).filter((p:any) => p.created_at?.startsWith(d)).length)
    setChartData({ supp: suppByDay, cust: custByDay, op: leadsByDay, prod: prodByDay })

    // ── الوضع العام ──
    const now = new Date()
    const past3m = new Date(now); past3m.setMonth(past3m.getMonth()-3)
    const next3m = new Date(now); next3m.setMonth(next3m.getMonth()+3)
    const dealsLast3m = (supps||[]).reduce((s:number,sup:any) => s+(sup.total_deals||0), 0)
    const hotLeads = (leadsR.data||[] as any[]).filter((l:any) => l.stage_id === 'action' || l.stage_id === 'decision').length
    const pendingFollowups = (leadsR.data||[] as any[]).filter((l:any) => {
      if (!l.next_followup_at) return false
      return new Date(l.next_followup_at) <= next3m
    }).length

    const suppScore   = Math.min(suppTotal * 5, 30)
    const custScore   = Math.min(custDone  * 10, 20)
    const mktScore    = Math.min(hotLeads  * 5, 20)
    const accScore    = accNetProfit > 0 ? 20 : accNetProfit === 0 ? 10 : 0
    const actScore    = Math.min((leadsR.data?.length||0) * 2, 10)
    const totalScore  = suppScore + custScore + mktScore + accScore + actScore

    setCompanyHealth({
      score: Math.min(totalScore, 100),
      suppliersGrowth: (supps||[]).filter((s:any) => new Date(s.created_at) > past3m).length,
      customersGrowth: (custs||[]).filter((c:any) => new Date(c.created_at) > past3m).length,
      dealsLast3m,
      dealsNext3m: hotLeads,
      pendingFollowups,
      expiredDocs: 0,
      hotLeads,
      totalRevenue: receipts,
      totalExpenses: payments,
    })
  }

  // ===== إنشاء حساب موظف =====
  async function handleCreateUser() {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
      alert('يرجى ملء جميع الحقول الإلزامية')
      return
    }
    setAddingUser(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name:  newUser.full_name,
            department: newUser.department,
            role:       newUser.role,
          },
        },
      })
      if (error) throw error
      alert(`✅ تم إنشاء حساب "${newUser.full_name}" بنجاح\nسيصله بريد تأكيد على ${newUser.email}`)
      setNewUser({ full_name: '', email: '', password: '', department: 'suppliers', role: 'viewer' })
      setShowAddUser(false)
    } catch (err: any) {
      alert('خطأ: ' + err.message)
    } finally {
      setAddingUser(false)
    }
  }

  // ── حسابات الأرباح ──
  const profitValue = receipts - payments
  const profitColor = profitValue > 0 ? S.green : profitValue < 0 ? S.red : S.amber
  const profitLabel = profitValue > 0 ? '📈 ربح' : profitValue < 0 ? '📉 خسارة' : '⚖️ تعادل'
  const balAlert    = custBal > suppBal

  const inp: React.CSSProperties = {
    width: '100%', background: S.navy3, border: `1px solid ${S.border}`,
    borderRadius: 9, padding: '10px 14px', fontSize: 13, color: S.white,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'rtl',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: S.navy }}>

      {/* ══ شريط الأدوات ══ */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.borderG}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>

        {/* الوقت */}
        <div style={{ fontSize: 11, color: S.muted }}>{currentTime}</div>

        {/* اسم الشركة — في الوسط */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: S.gold2, letterSpacing: '-.01em' }}>
            {companyName}
          </div>
          <div style={{ fontSize: 10, color: S.muted, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            لوحة التحكم الرئيسية
          </div>
        </div>

        {/* أزرار يسار */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {userRole === 'admin' && (
            <button onClick={() => setShowAddUser(true)}
              style={{ padding: '8px 14px', borderRadius: 8, background: S.gold3, border: `1px solid ${S.borderG}`, color: S.gold2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              👤 إنشاء حساب موظف
            </button>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.white }}>{userName}</div>
            <div style={{ fontSize: 10, color: S.muted }}>{userRole === 'admin' ? 'مدير عام' : 'موظف'}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${S.gold},${S.gold2})`, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, color: S.navy }}>
            {userName.slice(0, 2) || 'BE'}
          </div>
        </div>
      </div>

      {/* ══ المحتوى ══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ══════════════════════════════════════════════
            الوضع العام للشركة — نظرة 3 شهور
        ══════════════════════════════════════════════ */}
        <div style={{ marginBottom: 20 }}>
          {/* سطر العنوان */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={loadAll} style={{ background: S.card2, border: `1px solid ${S.border}`, color: S.muted, padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 تحديث</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
              <div style={{ width: 4, height: 20, background: S.gold, borderRadius: 2 }}/>
              <span style={{ fontSize: 15, fontWeight: 900, color: S.white }}>🏢 الوضع العام للشركة</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>

            {/* نبضة الشركة */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 18, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {/* مقياس دائري SVG */}
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="55" cy="55" r="46" fill="none"
                  stroke={companyHealth.score >= 70 ? S.green : companyHealth.score >= 40 ? S.amber : S.red}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(companyHealth.score / 100) * 289} 289`}
                  strokeDashoffset="72"
                  style={{ transition: 'stroke-dasharray 1s ease' }}/>
                <text x="55" y="50" textAnchor="middle" fill={S.white} fontSize="22" fontWeight="900" fontFamily="monospace">{companyHealth.score}</text>
                <text x="55" y="65" textAnchor="middle" fill={S.muted} fontSize="10" fontFamily="Tajawal,sans-serif">نقطة</text>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 800, color: companyHealth.score >= 70 ? S.green : companyHealth.score >= 40 ? S.amber : S.red }}>
                {companyHealth.score >= 70 ? '💚 ممتاز' : companyHealth.score >= 40 ? '🟡 جيد' : '🔴 يحتاج تحسين'}
              </div>
              <div style={{ fontSize: 10, color: S.muted, textAlign: 'center', lineHeight: '1.6' }}>نبضة الشركة<br/>Health Score</div>
            </div>

            {/* المؤشرات */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

              {/* 3 شهور ماضية */}
              <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.green, marginBottom: 10, textAlign: 'right' }}>📅 آخر 3 شهور</div>
                {[
                  { l: 'موردون جدد',  v: companyHealth.suppliersGrowth, icon: '🏭' },
                  { l: 'عملاء جدد',   v: companyHealth.customersGrowth,  icon: '👥' },
                  { l: 'صفقات منجزة', v: companyHealth.dealsLast3m,      icon: '🤝' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: S.green, fontFamily: 'monospace' }}>{m.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{m.icon} {m.l}</span>
                  </div>
                ))}
              </div>

              {/* 3 شهور قادمة */}
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.blue, marginBottom: 10, textAlign: 'right' }}>🔭 3 شهور قادمة</div>
                {[
                  { l: 'عملاء جاهزون', v: companyHealth.hotLeads,          icon: '🚀', c: S.green },
                  { l: 'متابعات مطلوبة',v: companyHealth.pendingFollowups, icon: '📞', c: S.amber },
                  { l: 'صفقات متوقعة', v: companyHealth.dealsNext3m,        icon: '📊', c: S.blue  },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: m.c, fontFamily: 'monospace' }}>{m.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{m.icon} {m.l}</span>
                  </div>
                ))}
              </div>

              {/* الصحة المالية */}
              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.amber, marginBottom: 10, textAlign: 'right' }}>💰 الصحة المالية</div>
                {[
                  { l: 'إجمالي الأصول',   v: `$${accAssets.toLocaleString()}`,      c: S.green },
                  { l: 'حقوق الملكية',    v: `$${accEquity.toLocaleString()}`,      c: S.amber },
                  { l: 'صافي الربح',      v: `${accNetProfit >= 0 ? '+' : ''}$${accNetProfit.toLocaleString()}`, c: accNetProfit >= 0 ? S.green : S.red },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: m.c, fontFamily: 'monospace' }}>{m.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{m.l}</span>
                  </div>
                ))}
              </div>

              {/* نشاط التسويق */}
              <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.purple, marginBottom: 10, textAlign: 'right' }}>📡 نشاط التسويق</div>
                {[
                  { l: 'إجمالي الخيوط',  v: mktTotal,     c: S.purple },
                  { l: 'جاهزون للإغلاق', v: mktHot,       c: S.green  },
                  { l: 'متابعة متأخرة',  v: mktFollowup,  c: S.red    },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, paddingBottom: 7, borderBottom: i < 2 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: m.c, fontFamily: 'monospace' }}>{m.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{m.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── الرسم البياني الرئيسي — بيانات حقيقية ─── */}
        <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'الموردون', color: S.gold },
                { label: 'العملاء',  color: S.green },
                { label: 'التسويق',  color: S.blue },
                { label: 'المنتجات', color: S.purple },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: S.muted }}>
                  <div style={{ width: 24, height: 3, borderRadius: 2, background: l.color }}/>
                  {l.label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: S.white }}>📊 نظرة عامة — آخر 7 أيام (بيانات فعلية)</div>
          </div>

          <svg width="100%" height="130" viewBox="0 0 700 130" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              {[
                { id: 'gGold',   color: S.gold },
                { id: 'gGreen',  color: S.green },
                { id: 'gBlue',   color: S.blue },
                { id: 'gPurple', color: S.purple },
              ].map(g => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={g.color} stopOpacity=".18"/>
                  <stop offset="100%" stopColor={g.color} stopOpacity="0"/>
                </linearGradient>
              ))}
            </defs>
            {[0.25, 0.5, 0.75].map(r => (
              <line key={r} x1="0" y1={120 * r} x2="700" y2={120 * r}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}
            {[
              { data: suppChart, color: S.gold,   grad: 'gGold' },
              { data: custChart, color: S.green,  grad: 'gGreen' },
              { data: opChart,   color: S.blue,   grad: 'gBlue' },
              { data: prodChart, color: S.purple, grad: 'gPurple' },
            ].map(({ data, color, grad }) => {
              const mx = Math.max(...data, 1)
              const pts = data.length < 2
                ? `0,115 700,115`
                : data.map((v, i) => `${(i / (data.length - 1)) * 700},${115 - (v / mx) * 100}`).join(' ')
              return (
                <g key={color}>
                  <polygon points={`0,120 ${pts} 700,120`} fill={`url(#${grad})`}/>
                  <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              )
            })}
            {Array.from({length:7}, (_,i) => {
              const d = new Date(); d.setDate(d.getDate()-6+i)
              return d.toLocaleDateString('ar-EG',{weekday:'short'})
            }).map((d, i) => (
              <text key={i} x={(i / 6) * 700} y="128" fontSize="9"
                fill={S.muted} textAnchor="middle">{d}</text>
            ))}
          </svg>
        </div>

        {/* ─── 1. إدارة الموردين ─── */}
        <div style={{ marginBottom: 20, direction: 'rtl', textAlign: 'right' }}>
          <SectionHead title="إدارة الموردين" icon="🏭" color={S.gold} href="/suppliers" router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Card label="إجمالي الموردين"    value={suppTotal}     color={S.gold}  icon="🏭" chart={suppChart} onClick={() => router.push('/suppliers')}/>
            <Card label="الموردون النشطون"   value={suppActive}    color={S.green} icon="✅" onClick={() => router.push('/suppliers')}/>
            <Card label="الموردون الموقوفون" value={suppSuspended} color={S.red}   icon="⛔"/>
            <Card label="الصفقات الناجحة"    value={suppDeals}     color={S.blue}  icon="🤝" sub="إجمالي الصفقات"/>
          </div>
        </div>

        {/* ─── 2. إدارة المنتجات ─── */}
        <div style={{ marginBottom: 20 }}>
          <SectionHead title="إدارة المنتجات" icon="📦" color={S.blue} href="/products" router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Card label="إجمالي المنتجات"       value={prodTotal} color={S.blue}   icon="📦" chart={prodChart} onClick={() => router.push('/products')}/>
            <Card label="المنتج الأكثر مبيعاً"  value={prodTop}   color={S.gold}   icon="🏅" sub="الأعلى تكراراً"/>
            <Card label="المنتج الأقل مبيعاً"   value={prodLow}   color={S.muted}  icon="📉"/>
            <Card label="متوسط المنتجات / مورد" value={prodAvg}   color={S.amber}  icon="📊"/>
          </div>
        </div>

        {/* ─── 3. إدارة العملاء ─── */}
        <div style={{ marginBottom: 20 }}>
          <SectionHead title="إدارة العملاء" icon="👥" color={S.green} href="/customers" router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Card label="إجمالي العملاء"     value={custTotal}     color={S.green} icon="👥" chart={custChart} onClick={() => router.push('/customers')}/>
            <Card label="قيد التفاوض"        value={custNegotiate} color={S.amber} icon="🤝"/>
            <Card label="قيد التنفيذ"        value={custPending}   color={S.blue}  icon="⚙️"/>
            <Card label="العمليات المكتملة"  value={custDone}      color={S.gold}  icon="✅" sub="صفقة ناجحة"/>
          </div>
        </div>
        {/* ─── 6. الموارد البشرية ─── */}
        <div style={{ marginBottom: 24 }}>
          <SectionHead title="إدارة الموارد البشرية" icon="👨‍💼" color={S.green}href="/hr" router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Card label="إجمالي الموظفين"        value={hrCount}                          color={S.green} icon="👨‍💼"/>
            <Card label="إجمالي الرواتب الشهرية" value={`$${hrSalaries.toLocaleString()}`} color={S.gold}  icon="💵" sub="شهرياً"/>
            <Card label="العهد والالتزامات"       value={`$${hrTrust.toLocaleString()}`}    color={S.amber} icon="📋"/>
            {/* إجازة قادمة */}
            <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
              <span style={{ fontSize: 20 }}>🏖️</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: S.blue, margin: '8px 0 4px' }}>{hrLeave}</div>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 600 }}>الإجازة القادمة</div>
              <div style={{ fontSize: 10, color: S.muted, marginTop: 3 }}>أقرب موظف في إجازة</div>
            </div>
          </div>
        </div>
                {/* ─── 5. إدارة التسويق — مرتبط بـ marketing_leads ─── */}
        <div style={{ marginBottom: 20 }}>
          <SectionHead title="إدارة التسويق" icon="📡" color={S.purple} href="/marketing" router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Card label="إجمالي خيوط المبيعات"  value={mktTotal}     color={S.purple} icon="🎯" chart={opChart} onClick={() => router.push('/marketing')}/>
            <Card label="جاهزون للإغلاق 🚀"     value={mktHot}       color={S.green}  icon="🚀" sub="أولوية قصوى" onClick={() => router.push('/marketing')}/>
            <Card label="تم التواصل اليوم"       value={mktContacted} color={S.blue}   icon="📞"/>
            <Card label="متابعة متأخرة ⚠️"       value={mktFollowup}  color={mktFollowup > 0 ? S.red : S.muted} icon="⏰" alert={mktFollowup > 0}/>
          </div>
        </div>
        {/* ─── 4. إدارة الحسابات — مرتبط بـ account_balances ─── */}
        <div style={{ marginBottom: 20 }}>
          <SectionHead title="إدارة الحسابات" icon="💰" href="/accounting" color={S.amber} router={router}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>

            {/* سندات القبض */}
            <Card label="إجمالي المقبوضات" value={`$${receipts.toLocaleString()}`} color={S.green} icon="📥" sub="سندات القبض النشطة"/>

            {/* سندات الصرف */}
            <Card label="إجمالي المدفوعات" value={`$${payments.toLocaleString()}`} color={S.red} icon="📤" sub="سندات الصرف النشطة"/>

            {/* الأرباح والخسائر */}
            <div style={{ background: S.navy2, border: `2px solid ${profitColor}`, borderRadius: 12, padding: 16, boxShadow: `0 0 22px ${profitColor}28` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{profitValue > 0 ? '📈' : profitValue < 0 ? '📉' : '⚖️'}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: profitColor, lineHeight: 1 }}>
                    {profitValue >= 0 ? '+' : ''}{profitValue.toLocaleString()}$
                  </div>
                  <div style={{ fontSize: 10, color: profitColor, fontWeight: 700, marginTop: 2 }}>{profitLabel}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 600 }}>الأرباح والخسائر الصافية</div>
            </div>

            {/* حسابات العملاء والموردين */}
            <div style={{ background: S.navy2, border: `1px solid ${balAlert ? S.amber : S.border}`, borderRadius: 12, padding: 16, boxShadow: balAlert ? `0 0 18px ${S.amber}28` : 'none', position: 'relative' }}>
              {balAlert && (
                <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 9, background: `${S.amber}20`, color: S.amber, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  ⚠️ تنبيه: مستحقات خارجية مرتفعة
                </div>
              )}
              <span style={{ fontSize: 20 }}>⚖️</span>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.green }}>${custBal.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: S.muted }}>مستحقات العملاء</span>
                </div>
                <div style={{ height: 1, background: S.border, marginBottom: 6 }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: S.red }}>${suppBal.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: S.muted }}>ذمم الموردين</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 600, marginTop: 8 }}>حسابات العملاء والموردين</div>
            </div>

          </div>
        </div>
      </div>

      {/* ══ Modal إنشاء حساب موظف ══ */}
      {showAddUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ background: S.navy2, width: '100%', maxWidth: 480, borderRadius: 20, padding: 28, border: `1px solid ${S.borderG}`, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* رأس المودال */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <button onClick={() => setShowAddUser(false)}
                style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: S.gold2 }}>👤 إنشاء حساب موظف</div>
                <div style={{ fontSize: 11, color: S.muted, marginTop: 3 }}>حدد القسم والصلاحيات</div>
              </div>
            </div>

            {/* الحقول الأساسية */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { label: 'الاسم الكامل *',       key: 'full_name', placeholder: 'اسم الموظف',           type: 'text'     },
                { label: 'البريد الإلكتروني *',   key: 'email',     placeholder: 'employee@company.com', type: 'email'    },
                { label: 'كلمة المرور الأولية *', key: 'password',  placeholder: '••••••••',             type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={(newUser as any)[f.key]}
                    onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                    style={inp}
                  />
                </div>
              ))}

              {/* القسم */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 6 }}>القسم المسموح بدخوله</label>
                <select
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  style={{ ...inp, cursor: 'pointer' }}>
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.id} style={{ background: S.navy2 }}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* مستوى الصلاحية */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 8 }}>مستوى الصلاحية</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'viewer', label: '👁️ مشاهدة',    desc: 'يرى فقط' },
                    { id: 'editor', label: '✏️ تعديل',      desc: 'يعدّل البيانات' },
                    { id: 'admin',  label: '👑 مدير قسم',   desc: 'صلاحيات كاملة' },
                  ].map(r => (
                    <button key={r.id} onClick={() => setNewUser({ ...newUser, role: r.id })}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all .2s',
                        border: `1px solid ${newUser.role === r.id ? S.gold : S.border}`,
                        background: newUser.role === r.id ? S.gold3 : 'transparent',
                        color: newUser.role === r.id ? S.gold2 : S.muted,
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</div>
                      <div style={{ fontSize: 10, marginTop: 3, opacity: .7 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ملاحظة */}
              <div style={{ background: S.gold3, border: `1px solid ${S.borderG}`, borderRadius: 10, padding: 12, fontSize: 11, color: S.gold2, lineHeight: '1.7' }}>
                ⚠️ سيتلقى الموظف بريد تأكيد لتفعيل حسابه. سيرى فقط القسم المحدد في النظام ولن يتمكن من الوصول لأي قسم آخر.
              </div>
            </div>

            {/* أزرار */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddUser(false)}
                style={{ background: 'rgba(255,255,255,0.06)', color: S.white, border: `1px solid ${S.border}`, padding: 11, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                إلغاء
              </button>
              <button onClick={handleCreateUser} disabled={addingUser}
                style={{ background: addingUser ? S.muted : `linear-gradient(135deg,${S.gold} 0%,${S.gold2} 100%)`, color: S.navy, border: 'none', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: addingUser ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {addingUser ? '⏳ جاري الإنشاء...' : '✅ إنشاء الحساب'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CSS للتأثيرات */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .4; transform: scale(.7); }
        }
      `}</style>

    </div>
  )
}
