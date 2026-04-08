'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { CURRENCIES } from '../components/options'

const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#0C1A32',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.10)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.08)',
  borderG:'rgba(201,168,76,0.18)',
  green:'#22C55E',red:'#EF4444',amber:'#F59E0B',
  blue:'#3B82F6',purple:'#8B5CF6',
  card:'rgba(255,255,255,0.04)',card2:'rgba(255,255,255,0.08)',
}

const CURRENCY_SYMBOLS: Record<string,string> = {
  USD:'$',EUR:'€',GBP:'£',SAR:'ر.س',AED:'د.إ',KWD:'د.ك',
  QAR:'ر.ق',BHD:'د.ب',OMR:'ر.ع',EGP:'ج.م',IQD:'د.ع',
  JOD:'د.أ',CNY:'¥',TRY:'₺',IDR:'Rp',MAD:'د.م',
  DZD:'د.ج',TND:'د.ت',LYD:'د.ل',YER:'ر.ي',SDG:'ج.س',
  LBP:'ل.ل',SYP:'ل.س',MRU:'أوق',
}

const ACCOUNT_TYPES: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  asset:     {label:'أصول',      color:S.green, bg:'rgba(34,197,94,0.12)',  icon:'🏦'},
  liability: {label:'خصوم',      color:S.red,   bg:'rgba(239,68,68,0.12)', icon:'📋'},
  equity:    {label:'حقوق ملكية',color:S.amber, bg:'rgba(245,158,11,0.12)',icon:'💼'},
  income:    {label:'إيرادات',   color:S.blue,  bg:'rgba(59,130,246,0.12)',icon:'📈'},
  expense:   {label:'مصروفات',  color:S.red,   bg:'rgba(239,68,68,0.12)', icon:'📉'},
}

const VOUCHER_TYPES: Record<string,{label:string;color:string;icon:string}> = {
  receipt:{label:'سند قبض', color:S.green,icon:'📥'},
  payment:{label:'سند صرف', color:S.red,  icon:'📤'},
  journal:{label:'قيد يومية',color:S.blue, icon:'📒'},
}

const PAYMENT_METHODS = ['نقداً','تحويل بنكي','شيك','بطاقة ائتمان','خطاب اعتماد','آجل']

const inp: React.CSSProperties = {
  width:'100%',background:S.navy3,border:`1px solid ${S.border}`,
  borderRadius:'9px',padding:'10px 14px',fontSize:'13px',color:S.white,
  outline:'none',fontFamily:'Tajawal, sans-serif',
  boxSizing:'border-box',direction:'rtl',textAlign:'right',
}

function fmt(n:number,sym='$') {
  return `${sym}${Math.abs(n).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`
}

// FIX 1: رقم مستقل لكل نوع سند
function nextReceiptNumber(existing:any[]):string {
  const nums = existing
    .filter(v=>v.voucher_type==='receipt')
    .map(v=>v.voucher_number)
    .filter((n:string)=>/^Q-\d+$/.test(n))
    .map((n:string)=>parseInt(n.replace('Q-','')))
  const max = nums.length ? Math.max(...nums) : 0
  return `Q-${String(max+1).padStart(4,'0')}`
}
function nextPaymentNumber(existing:any[]):string {
  const nums = existing
    .filter(v=>v.voucher_type==='payment')
    .map(v=>v.voucher_number)
    .filter((n:string)=>/^S-\d+$/.test(n))
    .map((n:string)=>parseInt(n.replace('S-','')))
  const max = nums.length ? Math.max(...nums) : 0
  return `S-${String(max+1).padStart(4,'0')}`
}
function nextJournalNumber(existing:any[]):string {
  const nums = existing
    .filter(v=>v.voucher_type==='journal')
    .map(v=>v.voucher_number)
    .filter((n:string)=>/^J-\d+$/.test(n))
    .map((n:string)=>parseInt(n.replace('J-','')))
  const max = nums.length ? Math.max(...nums) : 0
  return `J-${String(max+1).padStart(4,'0')}`
}
function getNextVoucherNumber(type:string, existing:any[]):string {
  if (type==='receipt') return nextReceiptNumber(existing)
  if (type==='payment') return nextPaymentNumber(existing)
  return nextJournalNumber(existing)
}

// ======================================================
// CurrencyBar
// ======================================================
function CurrencyBar({currency,setCurrency}:{currency:string;setCurrency:(c:string)=>void}) {
  const [open,setOpen] = useState(false)
  const sym  = CURRENCY_SYMBOLS[currency]||currency
  const curr = CURRENCIES.find(c=>c.value===currency)

  useEffect(()=>{
    if (!open) return
    function h() { setOpen(false) }
    document.addEventListener('click',h)
    return ()=>document.removeEventListener('click',h)
  },[open])

  return (
    <div style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:8,background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,cursor:'pointer',fontFamily:'Tajawal, sans-serif',fontSize:13,fontWeight:700}}>
        <span style={{fontSize:10,color:S.muted}}>{open?'▲':'▼'}</span>
        <span>{curr?.label||currency}</span>
        <span style={{fontSize:15,fontWeight:800}}>{sym}</span>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'110%',left:0,background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:12,width:300,maxHeight:340,overflowY:'auto',zIndex:9999,boxShadow:'0 8px 40px rgba(0,0,0,0.7)'}}>
          {CURRENCIES.map(c=>(
            <button key={c.id} onClick={()=>{setCurrency(c.value);setOpen(false)}}
              style={{width:'100%',padding:'10px 16px',background:currency===c.value?S.gold3:'transparent',border:'none',borderBottom:`1px solid ${S.border}`,color:currency===c.value?S.gold2:S.white,cursor:'pointer',fontFamily:'Tajawal, sans-serif',fontSize:12,display:'flex',justifyContent:'space-between',alignItems:'center',direction:'rtl'}}>
              <span>{c.label}</span>
              <span style={{fontSize:12,fontWeight:800,color:S.gold,minWidth:40,textAlign:'right'}}>{CURRENCY_SYMBOLS[c.value]||c.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ======================================================
// Modal طباعة/معاينة السند
// ======================================================
function VoucherPrintModal({voucher,sym,onClose}:{voucher:any;sym:string;onClose:()=>void}) {
  const vt = VOUCHER_TYPES[voucher.voucher_type]||VOUCHER_TYPES.journal
  const vSym = CURRENCY_SYMBOLS[voucher.currency]||sym

  function handlePrint() {
    window.print()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(8px)',padding:16}}
      onClick={onClose}>
      <div style={{background:S.white,width:'100%',maxWidth:600,borderRadius:16,overflow:'hidden',direction:'rtl'}}
        onClick={e=>e.stopPropagation()}>

        {/* شريط الطباعة */}
        <div style={{background:S.navy2,padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={handlePrint}
              style={{background:S.gold,color:S.navy,border:'none',padding:'8px 20px',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
              🖨️ طباعة
            </button>
            <button onClick={onClose}
              style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'8px 16px',borderRadius:7,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
              ✕ إغلاق
            </button>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:S.gold2}}>معاينة السند</span>
        </div>

        {/* محتوى السند للطباعة */}
        <div id="print-area" style={{padding:32,background:S.white,color:'#111',fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
          {/* رأس السند */}
          <div style={{textAlign:'center',marginBottom:24,borderBottom:'2px solid #ddd',paddingBottom:16}}>
            <div style={{fontSize:20,fontWeight:900,color:S.navy,marginBottom:4}}>bidlx.com</div>
            <div style={{fontSize:16,fontWeight:700,color:vt.color,marginBottom:4}}>{vt.icon} {vt.label}</div>
            <div style={{fontSize:22,fontWeight:900,color:S.navy,fontFamily:'monospace'}}>{voucher.voucher_number}</div>
          </div>

          {/* تفاصيل السند */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            {[
              {l:'رقم السند',   v:voucher.voucher_number},
              {l:'التاريخ',     v:voucher.voucher_date?new Date(voucher.voucher_date).toLocaleDateString('ar-EG'):'—'},
              {l:'الطرف الآخر', v:voucher.party_name||'—'},
              {l:'طريقة الدفع', v:voucher.payment_method||'—'},
              {l:'العملة',      v:voucher.currency||'—'},
              {l:'نوع السند',   v:vt.label},
            ].map((f,i)=>(
              <div key={i} style={{background:'#f8f8f8',borderRadius:8,padding:'10px 14px',textAlign:'right'}}>
                <div style={{fontSize:10,color:'#666',marginBottom:3,fontWeight:700}}>{f.l}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#111'}}>{f.v}</div>
              </div>
            ))}
          </div>

          {/* المبلغ */}
          <div style={{background:voucher.voucher_type==='receipt'?'#f0fff4':'#fff0f0',border:`2px solid ${vt.color}`,borderRadius:12,padding:'18px 24px',textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:12,color:'#666',marginBottom:6}}>المبلغ</div>
            <div style={{fontSize:32,fontWeight:900,color:vt.color,fontFamily:'monospace'}}>
              {voucher.voucher_type==='receipt'?'+':'-'}{fmt(voucher.amount||0,vSym)}
            </div>
          </div>

          {/* البيان */}
          {voucher.description&&(
            <div style={{background:'#f8f8f8',borderRadius:8,padding:'12px 16px',marginBottom:16,textAlign:'right'}}>
              <div style={{fontSize:10,color:'#666',marginBottom:4,fontWeight:700}}>البيان</div>
              <div style={{fontSize:13,color:'#111'}}>{voucher.description}</div>
            </div>
          )}

          {/* التوقيعات */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:32,paddingTop:20,borderTop:'1px solid #ddd'}}>
            {['المحاسب','المدير المالي','المستلم'].map(label=>(
              <div key={label} style={{textAlign:'center'}}>
                <div style={{height:40,borderBottom:'1px solid #999',marginBottom:6}}/>
                <div style={{fontSize:11,color:'#666'}}>{label}</div>
              </div>
            ))}
          </div>

          {/* التذييل */}
          <div style={{textAlign:'center',marginTop:20,fontSize:10,color:'#999'}}>
            هذا السند صادر من نظام bidlx.com — {new Date().toLocaleDateString('ar-EG')}
          </div>
        </div>
      </div>
    </div>
  )
}

// ======================================================
// الصفحة الرئيسية
// ======================================================
export default function AccountingPage() {
  const [tab,        setTab]        = useState<'dashboard'|'accounts'|'vouchers'|'reports'|'statement'>('dashboard')
  const [accounts,   setAccounts]   = useState<any[]>([])
  const [vouchers,   setVouchers]   = useState<any[]>([])
  const [customers,  setCustomers]  = useState<any[]>([])
  const [suppliers,  setSuppliers]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currency,   setCurrency]   = useState('USD')
  const [vPage,      setVPage]      = useState(1) // FIX 2: pagination

  // Modal states
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [printVoucher,    setPrintVoucher]    = useState<any>(null) // FIX 2: طباعة
  const [editVoucher,     setEditVoucher]     = useState<any>(null) // FIX 2: تعديل
  const [saving,          setSaving]          = useState(false)

  const [accountForm, setAccountForm] = useState({
    account_code:'',account_name:'',account_type:'asset',description:'',opening_balance:'0',
  })

  const [voucherForm, setVoucherForm] = useState({
    voucher_type:'receipt', voucher_number:'Q-0001',
    voucher_date:new Date().toISOString().split('T')[0],
    account_id:'', party_type:'customer', party_id:'', party_name:'',
    amount:'', currency:'USD', description:'', payment_method:'نقداً',
  })

  // كشف الحساب
  const [stmtPartyType,  setStmtPartyType]  = useState<'customer'|'supplier'|'account'>('customer')
  const [stmtPartyId,    setStmtPartyId]    = useState('')
  const [stmtAccountId,  setStmtAccountId]  = useState('')
  const [stmtFrom,       setStmtFrom]       = useState('')
  const [stmtTo,         setStmtTo]         = useState('')

  const loadAll = useCallback(async()=>{
    setLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    const [accRes,vchRes,custRes,suppRes,settRes] = await Promise.all([
      supabase.from('accounts').select('*').order('account_code'),
      supabase.from('vouchers').select('*').order('created_at',{ascending:false}),
      supabase.from('customers').select('id,full_name,company_name').eq('created_by',user?.id).order('full_name'),
      supabase.from('suppliers').select('id,company_name').order('company_name'),
      supabase.from('company_settings').select('default_currency').limit(1).single(),
    ])
    setAccounts(accRes.data||[])
    setVouchers(vchRes.data||[])
    setCustomers(custRes.data||[])
    setSuppliers(suppRes.data||[])
    if (settRes.data?.default_currency) setCurrency(settRes.data.default_currency)
    // FIX 1: رقم السند التالي حسب النوع الافتراضي (receipt)
    const nextNum = nextReceiptNumber(vchRes.data||[])
    setVoucherForm(prev=>({...prev,voucher_number:nextNum,currency}))
    setLoading(false)
  },[])

  useEffect(()=>{ loadAll() },[loadAll])

  async function saveCurrency(cur:string) {
    setCurrency(cur)
    setVoucherForm(prev=>({...prev,currency:cur}))
    const {data:existing} = await supabase.from('company_settings').select('id').limit(1).single()
    if (existing?.id) await supabase.from('company_settings').update({default_currency:cur}).eq('id',existing.id)
    else await supabase.from('company_settings').insert([{default_currency:cur}])
  }

  async function handleSaveAccount() {
    if (!accountForm.account_code||!accountForm.account_name) { alert('أدخل الكود والاسم'); return }
    setSaving(true)
    const {data:{user}} = await supabase.auth.getUser()
    const bal = parseFloat(accountForm.opening_balance)||0
    const {error} = await supabase.from('accounts').insert([{...accountForm,balance:bal,opening_balance:bal,currency,user_id:user?.id}])
    if (error) alert('خطأ: '+error.message)
    else {
      setShowAccountForm(false)
      setAccountForm({account_code:'',account_name:'',account_type:'asset',description:'',opening_balance:'0'})
      await loadAll()
    }
    setSaving(false)
  }

  async function handleSaveVoucher() {
    if (!voucherForm.amount||!voucherForm.account_id) { alert('أدخل المبلغ والحساب'); return }
    setSaving(true)
    const {data:{user}} = await supabase.auth.getUser()
    const amount = parseFloat(voucherForm.amount)
    const acc = accounts.find(a=>a.id===voucherForm.account_id)
    if (acc) {
      const newBal = voucherForm.voucher_type==='receipt'?acc.balance+amount:acc.balance-amount
      await supabase.from('accounts').update({balance:newBal}).eq('id',acc.id)
    }
    const {error} = await supabase.from('vouchers').insert([{
      voucher_type:voucherForm.voucher_type,
      voucher_number:voucherForm.voucher_number,
      voucher_date:voucherForm.voucher_date,
      account_id:voucherForm.account_id,
      party_type:voucherForm.party_type,
      party_id:voucherForm.party_id||null,
      party_name:voucherForm.party_name,
      amount,currency:voucherForm.currency,
      description:voucherForm.description,
      payment_method:voucherForm.payment_method,
      user_id:user?.id,
    }])
    if (error) alert('خطأ: '+error.message)
    else {
      setShowVoucherForm(false)
      // FIX 1: الرقم التالي حسب النوع
      const updatedVouchers = [...vouchers,{voucher_type:voucherForm.voucher_type,voucher_number:voucherForm.voucher_number}]
      const nextNum = getNextVoucherNumber(voucherForm.voucher_type, updatedVouchers)
      setVoucherForm(prev=>({...prev,amount:'',description:'',party_id:'',party_name:'',voucher_number:nextNum,currency}))
      await loadAll()
    }
    setSaving(false)
  }

  // FIX 2: تعديل سند
  async function handleEditVoucher() {
    if (!editVoucher) return
    setSaving(true)
    await supabase.from('vouchers').update({
      voucher_date:editVoucher.voucher_date,
      party_name:editVoucher.party_name,
      amount:parseFloat(editVoucher.amount)||editVoucher.amount,
      description:editVoucher.description,
      payment_method:editVoucher.payment_method,
    }).eq('id',editVoucher.id)
    setEditVoucher(null)
    await loadAll()
    setSaving(false)
  }

  const totalAssets      = accounts.filter(a=>a.account_type==='asset').reduce((s,a)=>s+(a.balance||0),0)
  const totalLiabilities = accounts.filter(a=>a.account_type==='liability').reduce((s,a)=>s+(a.balance||0),0)
  const totalIncome      = accounts.filter(a=>a.account_type==='income').reduce((s,a)=>s+(a.balance||0),0)
  const totalExpenses    = accounts.filter(a=>a.account_type==='expense').reduce((s,a)=>s+(a.balance||0),0)
  const netProfit        = totalIncome - totalExpenses
  const receipts         = vouchers.filter(v=>v.voucher_type==='receipt').reduce((s,v)=>s+(v.amount||0),0)
  const payments         = vouchers.filter(v=>v.voucher_type==='payment').reduce((s,v)=>s+(v.amount||0),0)
  const profitColor      = netProfit>0?S.green:netProfit<0?S.red:S.amber

  const filteredAccounts = accounts
    .filter(a=>typeFilter==='all'||a.account_type===typeFilter)
    .filter(a=>a.account_name?.includes(search)||a.account_code?.includes(search))

  const sym = CURRENCY_SYMBOLS[currency]||currency

  // FIX 2: pagination السندات
  const PAGE_SIZE = 20
  const totalPages = Math.ceil(vouchers.length/PAGE_SIZE)
  const pagedVouchers = vouchers.slice((vPage-1)*PAGE_SIZE, vPage*PAGE_SIZE)

  // كشف الحساب
  const stmtVouchers = vouchers.filter(v=>{
    if (stmtPartyType==='account' && stmtAccountId) return v.account_id===stmtAccountId
    if (stmtPartyType==='customer' && stmtPartyId) return v.party_id===stmtPartyId && v.party_type==='customer'
    if (stmtPartyType==='supplier' && stmtPartyId) return v.party_id===stmtPartyId && v.party_type==='supplier'
    return false
  }).filter(v=>{
    if (stmtFrom && v.voucher_date < stmtFrom) return false
    if (stmtTo   && v.voucher_date > stmtTo)   return false
    return true
  })
  const stmtTotal = stmtVouchers.reduce((s,v)=>s+(v.voucher_type==='receipt'?v.amount||0:-(v.amount||0)),0)

  const TABS = [
    {key:'dashboard', label:'📊 لوحة المالية'},
    {key:'accounts',  label:'📁 دليل الحسابات'},
    {key:'vouchers',  label:'📋 السندات'},
    {key:'reports',   label:'📈 التقارير'},
    {key:'statement', label:'📊 كشف الحساب'},
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal, sans-serif',direction:'rtl',background:S.navy}}>

      {/* شريط الأدوات */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.borderG}`,padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{
            const nextNum = getNextVoucherNumber(voucherForm.voucher_type, vouchers)
            setVoucherForm(prev=>({...prev,voucher_number:nextNum,currency}))
            setShowVoucherForm(true)
          }}
            style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            + إضافة سند
          </button>
          <button onClick={()=>setShowAccountForm(true)}
            style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            + إضافة حساب
          </button>
        </div>
        <CurrencyBar currency={currency} setCurrency={saveCurrency}/>
      </div>

      {/* التبويبات */}
      <div style={{display:'flex',gap:2,background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'0 24px',flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as any)}
            style={{padding:'12px 20px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',borderBottom:tab===t.key?`2px solid ${S.gold}`:'2px solid transparent',background:'transparent',color:tab===t.key?S.gold2:S.muted,transition:'all .15s',textAlign:'right'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

        {/* ══ لوحة المالية ══ */}
        {tab==='dashboard'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* الإحصائيات */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {label:'إجمالي الأصول',   val:fmt(totalAssets,sym),     color:S.green, sub:'إجمالي الموجودات'},
                {label:'إجمالي الخصوم',   val:fmt(totalLiabilities,sym), color:S.red,   sub:'الالتزامات المستحقة'},
                {label:'إجمالي الإيرادات',val:fmt(totalIncome,sym),      color:S.blue,  sub:'المبيعات والخدمات'},
                {label:'إجمالي المصروفات',val:fmt(totalExpenses,sym),    color:S.amber, sub:'التكاليف والنفقات'},
              ].map((s,i)=>(
                <div key={i} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,textAlign:'right'}}>
                  <div style={{fontSize:9,color:S.muted,marginBottom:4,fontWeight:600}}>{s.sub}</div>
                  <div style={{fontSize:18,fontWeight:900,color:s.color,marginBottom:6,fontFamily:'monospace'}}>{s.val}</div>
                  <div style={{fontSize:11,color:S.muted,fontWeight:600}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* صافي الربح + التدفق + المعادلة */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div style={{background:S.navy2,border:`2px solid ${profitColor}`,borderRadius:14,padding:20,boxShadow:`0 0 24px ${profitColor}22`}}>
                <div style={{fontSize:12,fontWeight:700,color:S.muted,marginBottom:12,textAlign:'right'}}>📊 صافي الربح / الخسارة</div>
                <div style={{fontSize:28,fontWeight:900,color:profitColor,lineHeight:1,marginBottom:8,textAlign:'right'}}>
                  {netProfit>=0?'+':''}{fmt(netProfit,sym)}
                </div>
                <div style={{fontSize:11,color:profitColor,fontWeight:700,marginBottom:12,textAlign:'right'}}>
                  {netProfit>0?'📈 ربح':netProfit<0?'📉 خسارة':'⚖️ تعادل'}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,fontWeight:700,color:S.green}}>{fmt(totalIncome,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>الإيرادات</span>
                  </div>
                  <div style={{height:1,background:S.border}}/>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,fontWeight:700,color:S.red}}>{fmt(totalExpenses,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>المصروفات</span>
                  </div>
                </div>
              </div>

              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
                <div style={{fontSize:12,fontWeight:700,color:S.muted,marginBottom:12,textAlign:'right'}}>💵 التدفق النقدي</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{background:'rgba(34,197,94,0.08)',borderRadius:10,padding:'12px 14px',textAlign:'right'}}>
                    <div style={{fontSize:10,color:S.muted,marginBottom:3}}>📥 سندات القبض</div>
                    <div style={{fontSize:18,fontWeight:800,color:S.green}}>{fmt(receipts,sym)}</div>
                    <div style={{fontSize:10,color:S.muted}}>{vouchers.filter(v=>v.voucher_type==='receipt').length} سند</div>
                  </div>
                  <div style={{background:'rgba(239,68,68,0.08)',borderRadius:10,padding:'12px 14px',textAlign:'right'}}>
                    <div style={{fontSize:10,color:S.muted,marginBottom:3}}>📤 سندات الصرف</div>
                    <div style={{fontSize:18,fontWeight:800,color:S.red}}>{fmt(payments,sym)}</div>
                    <div style={{fontSize:10,color:S.muted}}>{vouchers.filter(v=>v.voucher_type==='payment').length} سند</div>
                  </div>
                </div>
              </div>

              <div style={{background:S.navy2,border:`1px solid ${S.borderG}`,borderRadius:14,padding:20}}>
                <div style={{fontSize:12,fontWeight:700,color:S.muted,marginBottom:12,textAlign:'right'}}>⚖️ المعادلة المحاسبية</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{textAlign:'right',padding:'8px 0'}}>
                    <div style={{fontSize:11,color:S.muted,marginBottom:4}}>الأصول</div>
                    <div style={{fontSize:18,fontWeight:800,color:S.green}}>{fmt(totalAssets,sym)}</div>
                  </div>
                  <div style={{textAlign:'center',color:S.gold,fontWeight:700,fontSize:16}}>=</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                    <div style={{textAlign:'center',background:S.card,borderRadius:8,padding:8}}>
                      <div style={{fontSize:10,color:S.muted}}>الخصوم</div>
                      <div style={{fontSize:13,fontWeight:700,color:S.red}}>{fmt(totalLiabilities,sym)}</div>
                    </div>
                    <div style={{textAlign:'center',background:S.card,borderRadius:8,padding:8}}>
                      <div style={{fontSize:10,color:S.muted}}>حقوق الملكية</div>
                      <div style={{fontSize:13,fontWeight:700,color:S.amber}}>{fmt(Math.max(0,totalAssets-totalLiabilities),sym)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FIX 2: آخر السندات مع معاينة وتعديل */}
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:13,fontWeight:800,color:S.white,marginBottom:14,textAlign:'right'}}>🕐 آخر السندات المسجلة</div>
              {vouchers.length===0?(
                <div style={{textAlign:'center',color:S.muted,padding:'30px 0',fontSize:13}}>لا توجد سندات بعد</div>
              ):vouchers.slice(0,6).map((v,i)=>{
                const vt = VOUCHER_TYPES[v.voucher_type]||VOUCHER_TYPES.journal
                const vSym = CURRENCY_SYMBOLS[v.currency]||sym
                return (
                  <div key={v.id||i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:i<5?`1px solid ${S.border}`:'none'}}>
                    {/* يمين: أزرار */}
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>setPrintVoucher(v)}
                        style={{background:S.card2,border:`1px solid ${S.border}`,color:S.muted,padding:'4px 10px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                        🖨️ طباعة
                      </button>
                      <button onClick={()=>setEditVoucher({...v,amount:String(v.amount)})}
                        style={{background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'4px 10px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                        ✏️ تعديل
                      </button>
                    </div>
                    {/* وسط */}
                    <div style={{textAlign:'right',flex:1,margin:'0 12px'}}>
                      <div style={{fontSize:13,fontWeight:700}}>{v.description||v.party_name||'—'}</div>
                      <div style={{fontSize:9,color:S.muted,marginTop:2,display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
                        <span>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):''}</span>
                        <span style={{fontSize:9,padding:'1px 6px',borderRadius:20,background:`${vt.color}18`,color:vt.color,fontWeight:700}}>{vt.icon} {vt.label}</span>
                        <span style={{fontFamily:'monospace'}}>{v.voucher_number}</span>
                      </div>
                    </div>
                    {/* يسار: المبلغ */}
                    <div style={{fontSize:15,fontWeight:800,color:v.voucher_type==='receipt'?S.green:S.red,fontFamily:'monospace',flexShrink:0}}>
                      {v.voucher_type==='receipt'?'+':'-'}{fmt(v.amount||0,vSym)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ دليل الحسابات ══ */}
        {tab==='accounts'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <input type="text" placeholder="🔍 ابحث بالاسم أو الكود..." value={search}
                onChange={e=>setSearch(e.target.value)} style={{...inp,flex:1,minWidth:200,background:S.navy2}}/>
              <div style={{display:'flex',background:S.navy2,border:`1px solid ${S.border}`,borderRadius:10,overflow:'hidden'}}>
                {[{key:'all',label:'الكل'},...Object.entries(ACCOUNT_TYPES).map(([k,v])=>({key:k,label:v.icon+' '+v.label}))].map(t=>(
                  <button key={t.key} onClick={()=>setTypeFilter(t.key)}
                    style={{padding:'8px 12px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',background:typeFilter===t.key?S.gold:'transparent',color:typeFilter===t.key?S.navy:S.muted,transition:'all .15s',whiteSpace:'nowrap'}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
              {Object.entries(ACCOUNT_TYPES).map(([key,t])=>{
                const accs=accounts.filter(a=>a.account_type===key)
                const total=accs.reduce((s,a)=>s+(a.balance||0),0)
                return (
                  <div key={key} onClick={()=>setTypeFilter(key)}
                    style={{background:typeFilter===key?`${t.color}15`:S.navy2,border:`1px solid ${typeFilter===key?t.color:S.border}`,borderRadius:12,padding:14,cursor:'pointer',textAlign:'right',transition:'all .2s'}}>
                    <div style={{fontSize:18,marginBottom:6}}>{t.icon}</div>
                    <div style={{fontSize:14,fontWeight:800,color:t.color}}>{fmt(total,sym)}</div>
                    <div style={{fontSize:10,color:S.muted,marginTop:2}}>{t.label} ({accs.length})</div>
                  </div>
                )
              })}
            </div>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${S.border}`}}>
                    {['الكود','اسم الحساب','النوع','الرصيد الحالي','الوصف'].map(h=>(
                      <th key={h} style={{padding:'12px 14px',textAlign:'right',fontSize:'10px',color:S.muted,fontWeight:700}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading?(
                    <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:S.muted}}>جاري التحميل...</td></tr>
                  ):filteredAccounts.length===0?(
                    <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:S.muted}}>لا توجد حسابات</td></tr>
                  ):filteredAccounts.map((a,i)=>{
                    const t=ACCOUNT_TYPES[a.account_type]||ACCOUNT_TYPES.asset
                    const aSym=CURRENCY_SYMBOLS[a.currency]||sym
                    return (
                      <tr key={a.id} style={{borderTop:`1px solid rgba(255,255,255,0.05)`,background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                        <td style={{padding:'12px 14px',color:S.gold,fontWeight:700,fontSize:13,fontFamily:'monospace',textAlign:'right'}}>{a.account_code}</td>
                        <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,textAlign:'right'}}>{t.icon} {a.account_name}</td>
                        <td style={{padding:'12px 14px',textAlign:'right'}}>
                          <span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:t.bg,color:t.color,fontWeight:700}}>{t.label}</span>
                        </td>
                        <td style={{padding:'12px 14px',fontSize:14,fontWeight:800,color:a.balance>=0?S.green:S.red,fontFamily:'monospace',textAlign:'right'}}>{fmt(a.balance||0,aSym)}</td>
                        <td style={{padding:'12px 14px',fontSize:11,color:S.muted,maxWidth:180,textAlign:'right'}}>
                          <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.description||'—'}</div>
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
        {tab==='vouchers'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {Object.entries(VOUCHER_TYPES).map(([key,t])=>{
                const vList=vouchers.filter(v=>v.voucher_type===key)
                const total=vList.reduce((s,v)=>s+(v.amount||0),0)
                return (
                  <div key={key} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,textAlign:'right'}}>
                    <div style={{fontSize:22,marginBottom:8}}>{t.icon}</div>
                    <div style={{fontSize:20,fontWeight:900,color:t.color,marginBottom:4}}>{fmt(total,sym)}</div>
                    <div style={{fontSize:11,color:S.muted}}>{t.label} — {vList.length} سند</div>
                  </div>
                )
              })}
            </div>

            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${S.border}`}}>
                    {['رقم السند','النوع','التاريخ','الطرف الآخر','المبلغ','العملة','طريقة الدفع','إجراءات'].map(h=>(
                      <th key={h} style={{padding:'12px 14px',textAlign:'right',fontSize:'10px',color:S.muted,fontWeight:700}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedVouchers.length===0?(
                    <tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:S.muted}}>لا توجد سندات بعد</td></tr>
                  ):pagedVouchers.map((v,i)=>{
                    const vt=VOUCHER_TYPES[v.voucher_type]||VOUCHER_TYPES.journal
                    const vSym=CURRENCY_SYMBOLS[v.currency]||sym
                    return (
                      <tr key={v.id} style={{borderTop:`1px solid rgba(255,255,255,0.05)`,background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                        <td style={{padding:'12px 14px',color:S.gold,fontWeight:700,fontSize:12,fontFamily:'monospace',textAlign:'right'}}>{v.voucher_number}</td>
                        <td style={{padding:'12px 14px',textAlign:'right'}}>
                          <span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:`${vt.color}18`,color:vt.color,fontWeight:700}}>{vt.icon} {vt.label}</span>
                        </td>
                        <td style={{padding:'12px 14px',fontSize:12,color:S.muted,textAlign:'right'}}>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'}</td>
                        <td style={{padding:'12px 14px',fontSize:13,textAlign:'right'}}>{v.party_name||'—'}</td>
                        <td style={{padding:'12px 14px',fontSize:14,fontWeight:800,color:v.voucher_type==='receipt'?S.green:S.red,fontFamily:'monospace',textAlign:'right'}}>
                          {v.voucher_type==='receipt'?'+':'-'}{fmt(v.amount||0,vSym)}
                        </td>
                        <td style={{padding:'12px 14px',fontSize:11,textAlign:'right'}}>
                          <span style={{padding:'2px 8px',borderRadius:6,background:S.card2,color:S.gold,fontSize:10,fontWeight:700}}>{v.currency||currency}</span>
                        </td>
                        <td style={{padding:'12px 14px',fontSize:11,color:S.muted,textAlign:'right'}}>{v.payment_method||'—'}</td>
                        {/* FIX 2: أزرار طباعة وتعديل */}
                        <td style={{padding:'12px 14px',textAlign:'right'}}>
                          <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                            <button onClick={()=>setPrintVoucher(v)}
                              style={{background:S.card2,border:`1px solid ${S.border}`,color:S.muted,padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🖨️</button>
                            <button onClick={()=>setEditVoucher({...v,amount:String(v.amount)})}
                              style={{background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>✏️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* FIX 2: Pagination */}
            {totalPages>1&&(
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                <button onClick={()=>setVPage(p=>Math.max(1,p-1))} disabled={vPage===1}
                  style={{background:S.card2,border:`1px solid ${S.border}`,color:vPage===1?S.muted:S.white,padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  ← السابقة
                </button>
                <span style={{fontSize:12,color:S.muted}}>صفحة {vPage} من {totalPages}</span>
                <button onClick={()=>setVPage(p=>Math.min(totalPages,p+1))} disabled={vPage===totalPages}
                  style={{background:S.card2,border:`1px solid ${S.border}`,color:vPage===totalPages?S.muted:S.white,padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  التالية →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ التقارير ══ */}
        {tab==='reports'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:14,fontWeight:800,color:S.white,marginBottom:16,textAlign:'right'}}>📊 قائمة الدخل</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(59,130,246,0.08)',borderRadius:8}}>
                  <span style={{fontSize:16,fontWeight:800,color:S.blue}}>{fmt(totalIncome,sym)}</span>
                  <span style={{fontSize:12,color:S.white,fontWeight:600}}>إجمالي الإيرادات</span>
                </div>
                {accounts.filter(a=>a.account_type==='income').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px'}}>
                    <span style={{fontSize:13,color:S.green,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_name}</span>
                  </div>
                ))}
                <div style={{height:1,background:S.border,margin:'4px 0'}}/>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(239,68,68,0.08)',borderRadius:8}}>
                  <span style={{fontSize:16,fontWeight:800,color:S.red}}>{fmt(totalExpenses,sym)}</span>
                  <span style={{fontSize:12,color:S.white,fontWeight:600}}>إجمالي المصروفات</span>
                </div>
                {accounts.filter(a=>a.account_type==='expense').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px'}}>
                    <span style={{fontSize:13,color:S.red,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_name}</span>
                  </div>
                ))}
                <div style={{height:2,background:S.border,margin:'4px 0'}}/>
                <div style={{display:'flex',justifyContent:'space-between',padding:'14px 16px',background:`${profitColor}18`,borderRadius:10,border:`1px solid ${profitColor}40`}}>
                  <span style={{fontSize:20,fontWeight:900,color:profitColor,fontFamily:'monospace'}}>
                    {netProfit>=0?'+':''}{fmt(netProfit,sym)}
                  </span>
                  <span style={{fontSize:13,fontWeight:700,color:profitColor}}>
                    {netProfit>0?'📈 صافي ربح':netProfit<0?'📉 صافي خسارة':'⚖️ تعادل'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:14,fontWeight:800,color:S.white,marginBottom:16,textAlign:'right'}}>⚖️ الميزانية العمومية</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontSize:11,fontWeight:700,color:S.green,textAlign:'right',marginBottom:2}}>الأصول</div>
                {accounts.filter(a=>a.account_type==='asset').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px',background:S.card,borderRadius:6}}>
                    <span style={{fontSize:13,color:S.green,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_code} — {a.account_name}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(34,197,94,0.08)',borderRadius:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:S.green,fontFamily:'monospace'}}>{fmt(totalAssets,sym)}</span>
                  <span style={{fontSize:12,fontWeight:700,color:S.white}}>إجمالي الأصول</span>
                </div>
                <div style={{height:1,background:S.border,margin:'4px 0'}}/>
                <div style={{fontSize:11,fontWeight:700,color:S.amber,textAlign:'right',marginBottom:2}}>الخصوم وحقوق الملكية</div>
                {accounts.filter(a=>['liability','equity'].includes(a.account_type)).map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px',background:S.card,borderRadius:6}}>
                    <span style={{fontSize:13,color:S.amber,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_code} — {a.account_name}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(245,158,11,0.08)',borderRadius:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:S.amber,fontFamily:'monospace'}}>{fmt(totalLiabilities+Math.max(0,totalAssets-totalLiabilities),sym)}</span>
                  <span style={{fontSize:12,fontWeight:700,color:S.white}}>إجمالي الخصوم + حقوق الملكية</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ كشف الحساب ══ */}
        {tab==='statement'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* فلاتر */}
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:13,fontWeight:800,color:S.white,marginBottom:16,textAlign:'right'}}>📊 كشف الحساب</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>نوع الحساب</label>
                  <select value={stmtPartyType} onChange={e=>{ setStmtPartyType(e.target.value as any); setStmtPartyId(''); setStmtAccountId('') }}
                    style={{...inp,cursor:'pointer'}}>
                    <option value="customer" style={{background:S.navy2}}>عميل</option>
                    <option value="supplier" style={{background:S.navy2}}>مورد</option>
                    <option value="account"  style={{background:S.navy2}}>حساب من دليل الحسابات</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>
                    {stmtPartyType==='customer'?'العميل':stmtPartyType==='supplier'?'المورد':'الحساب'}
                  </label>
                  {stmtPartyType==='account'?(
                    <select value={stmtAccountId} onChange={e=>setStmtAccountId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر الحساب...</option>
                      {accounts.map(a=><option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name}</option>)}
                    </select>
                  ):stmtPartyType==='customer'?(
                    <select value={stmtPartyId} onChange={e=>setStmtPartyId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر العميل...</option>
                      {customers.map(c=><option key={c.id} value={c.id} style={{background:S.navy2}}>{c.full_name}{c.company_name?` — ${c.company_name}`:''}</option>)}
                    </select>
                  ):(
                    <select value={stmtPartyId} onChange={e=>setStmtPartyId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر المورد...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الفترة</label>
                  <div style={{display:'flex',gap:6}}>
                    <input type="date" value={stmtFrom} onChange={e=>setStmtFrom(e.target.value)} style={{...inp,flex:1,colorScheme:'dark' as any}} placeholder="من"/>
                    <input type="date" value={stmtTo}   onChange={e=>setStmtTo(e.target.value)}   style={{...inp,flex:1,colorScheme:'dark' as any}} placeholder="إلى"/>
                  </div>
                </div>
              </div>

              <button onClick={()=>window.print()}
                style={{background:S.gold,color:S.navy,border:'none',padding:'9px 24px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                🖨️ طباعة الكشف
              </button>
            </div>

            {/* جدول الكشف */}
            {stmtVouchers.length>0&&(
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.05)',borderBottom:`1px solid ${S.border}`}}>
                      {['التاريخ','رقم السند','البيان','مدين','دائن','الرصيد'].map(h=>(
                        <th key={h} style={{padding:'12px 14px',textAlign:'right',fontSize:10,color:S.muted,fontWeight:700}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(()=>{
                      let running = 0
                      return stmtVouchers.map((v,i)=>{
                        const isReceipt = v.voucher_type==='receipt'
                        const amt = v.amount||0
                        running += isReceipt ? amt : -amt
                        return (
                          <tr key={v.id} style={{borderTop:`1px solid rgba(255,255,255,0.05)`,background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                            <td style={{padding:'10px 14px',fontSize:12,color:S.muted,textAlign:'right'}}>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'}</td>
                            <td style={{padding:'10px 14px',fontSize:11,color:S.gold,fontFamily:'monospace',textAlign:'right'}}>{v.voucher_number}</td>
                            <td style={{padding:'10px 14px',fontSize:12,textAlign:'right'}}>{v.description||v.party_name||'—'}</td>
                            <td style={{padding:'10px 14px',fontSize:13,color:S.green,fontFamily:'monospace',fontWeight:700,textAlign:'right'}}>
                              {isReceipt?fmt(amt,sym):'—'}
                            </td>
                            <td style={{padding:'10px 14px',fontSize:13,color:S.red,fontFamily:'monospace',fontWeight:700,textAlign:'right'}}>
                              {!isReceipt?fmt(amt,sym):'—'}
                            </td>
                            <td style={{padding:'10px 14px',fontSize:13,fontWeight:800,fontFamily:'monospace',textAlign:'right',color:running>=0?S.green:S.red}}>
                              {fmt(running,sym)}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${S.borderG}`,background:S.card2}}>
                      <td colSpan={5} style={{padding:'12px 14px',textAlign:'right',fontSize:12,fontWeight:700,color:S.gold2}}>الرصيد النهائي</td>
                      <td style={{padding:'12px 14px',fontSize:16,fontWeight:900,fontFamily:'monospace',textAlign:'right',color:stmtTotal>=0?S.green:S.red}}>
                        {fmt(stmtTotal,sym)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {(stmtPartyId||stmtAccountId)&&stmtVouchers.length===0&&(
              <div style={{textAlign:'center',color:S.muted,padding:'60px 0'}}>
                <div style={{fontSize:40,marginBottom:12}}>📊</div>
                <div>لا توجد حركات لهذا الحساب</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ Modal طباعة السند ══ */}
      {printVoucher&&(
        <VoucherPrintModal voucher={printVoucher} sym={sym} onClose={()=>setPrintVoucher(null)}/>
      )}

      {/* ══ Modal تعديل السند ══ */}
      {editVoucher&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:500,borderRadius:18,padding:26,border:`1px solid ${S.borderG}`,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <button onClick={()=>setEditVoucher(null)} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:15,fontWeight:800,color:S.gold2}}>✏️ تعديل السند — {editVoucher.voucher_number}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>التاريخ</label>
                <input type="date" value={editVoucher.voucher_date} onChange={e=>setEditVoucher({...editVoucher,voucher_date:e.target.value})} style={{...inp,colorScheme:'dark' as any}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الطرف الآخر</label>
                <input type="text" value={editVoucher.party_name} onChange={e=>setEditVoucher({...editVoucher,party_name:e.target.value})} style={inp}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>المبلغ</label>
                <input type="number" value={editVoucher.amount} onChange={e=>setEditVoucher({...editVoucher,amount:e.target.value})} style={inp}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>طريقة الدفع</label>
                <select value={editVoucher.payment_method} onChange={e=>setEditVoucher({...editVoucher,payment_method:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m} style={{background:S.navy2}}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>البيان</label>
                <input type="text" value={editVoucher.description} onChange={e=>setEditVoucher({...editVoucher,description:e.target.value})} style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:18}}>
              <button onClick={()=>setEditVoucher(null)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleEditVoucher} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':'💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal إضافة حساب ══ */}
      {showAccountForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:520,borderRadius:20,padding:28,border:`1px solid ${S.borderG}`,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <button onClick={()=>setShowAccountForm(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:16,fontWeight:800,color:S.gold2}}>📁 إضافة حساب جديد</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {[
                {l:'كود الحساب *',k:'account_code',t:'text',p:'مثال: 1101'},
                {l:'اسم الحساب *', k:'account_name',t:'text',p:'اسم الحساب'},
              ].map(f=>(
                <div key={f.k}>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={(accountForm as any)[f.k]}
                    onChange={e=>setAccountForm({...accountForm,[f.k]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>نوع الحساب</label>
                <select value={accountForm.account_type} onChange={e=>setAccountForm({...accountForm,account_type:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {Object.entries(ACCOUNT_TYPES).map(([k,v])=>(
                    <option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الرصيد الافتتاحي ({sym})</label>
                <input type="number" placeholder="0.00" value={accountForm.opening_balance}
                  onChange={e=>setAccountForm({...accountForm,opening_balance:e.target.value})} style={inp}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الوصف</label>
                <input type="text" placeholder="وصف مختصر..." value={accountForm.description}
                  onChange={e=>setAccountForm({...accountForm,description:e.target.value})} style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:20}}>
              <button onClick={()=>setShowAccountForm(false)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleSaveAccount} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':'💾 حفظ الحساب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal إضافة سند ══ */}
      {showVoucherForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:580,borderRadius:20,padding:28,border:`1px solid ${S.borderG}`,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <button onClick={()=>setShowVoucherForm(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:16,fontWeight:800,color:S.gold2}}>📋 إضافة سند مالي</div>
            </div>

            {/* رقم السند */}
            <div style={{background:S.gold3,border:`1px solid ${S.borderG}`,borderRadius:10,padding:'10px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:10,color:S.muted}}>رقم السند (تلقائي)</span>
              <span style={{fontSize:18,fontWeight:900,color:S.gold2,fontFamily:'monospace'}}>{voucherForm.voucher_number}</span>
            </div>

            {/* FIX 1: نوع السند يغير الرقم تلقائياً */}
            <div style={{display:'flex',gap:8,marginBottom:18,justifyContent:'flex-end'}}>
              {Object.entries(VOUCHER_TYPES).map(([key,t])=>(
                <button key={key} onClick={()=>{
                  const nextNum = getNextVoucherNumber(key, vouchers)
                  setVoucherForm({...voucherForm,voucher_type:key,voucher_number:nextNum})
                }}
                  style={{padding:'8px 16px',borderRadius:8,border:`1px solid ${voucherForm.voucher_type===key?t.color:S.border}`,background:voucherForm.voucher_type===key?`${t.color}18`:'transparent',color:voucherForm.voucher_type===key?t.color:S.muted,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>التاريخ</label>
                <input type="date" value={voucherForm.voucher_date}
                  onChange={e=>setVoucherForm({...voucherForm,voucher_date:e.target.value})}
                  style={{...inp,colorScheme:'dark' as any}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>العملة</label>
                <select value={voucherForm.currency} onChange={e=>setVoucherForm({...voucherForm,currency:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {CURRENCIES.map(c=>(
                    <option key={c.id} value={c.value} style={{background:S.navy2}}>{CURRENCY_SYMBOLS[c.value]||c.value} {c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الحساب المتأثر *</label>
                <select value={voucherForm.account_id} onChange={e=>setVoucherForm({...voucherForm,account_id:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  <option value="">اختر الحساب...</option>
                  {accounts.map(a=>{
                    const aSym=CURRENCY_SYMBOLS[a.currency]||sym
                    return <option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name} ({fmt(a.balance||0,aSym)})</option>
                  })}
                </select>
              </div>

              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الطرف الآخر</label>
                <select value={voucherForm.party_type} onChange={e=>setVoucherForm({...voucherForm,party_type:e.target.value,party_id:'',party_name:''})} style={{...inp,cursor:'pointer'}}>
                  <option value="customer" style={{background:S.navy2}}>عميل</option>
                  <option value="supplier" style={{background:S.navy2}}>مورد</option>
                  <option value="other"    style={{background:S.navy2}}>طرف آخر</option>
                </select>
              </div>
              <div>
                {voucherForm.party_type==='customer'?(
                  <>
                    <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اختر العميل</label>
                    <select value={voucherForm.party_id} onChange={e=>{const c=customers.find(x=>x.id===e.target.value);setVoucherForm({...voucherForm,party_id:e.target.value,party_name:c?.full_name||c?.company_name||''})}} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {customers.map(c=><option key={c.id} value={c.id} style={{background:S.navy2}}>{c.full_name}{c.company_name?` — ${c.company_name}`:''}</option>)}
                    </select>
                  </>
                ):voucherForm.party_type==='supplier'?(
                  <>
                    <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اختر المورد</label>
                    <select value={voucherForm.party_id} onChange={e=>{const s=suppliers.find(x=>x.id===e.target.value);setVoucherForm({...voucherForm,party_id:e.target.value,party_name:s?.company_name||''})}} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name}</option>)}
                    </select>
                  </>
                ):(
                  <>
                    <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اسم الطرف</label>
                    <input type="text" placeholder="اسم الجهة أو الشخص" value={voucherForm.party_name} onChange={e=>setVoucherForm({...voucherForm,party_name:e.target.value})} style={inp}/>
                  </>
                )}
              </div>

              <div>
                <label style={{display:'block',fontSize:11,color:voucherForm.voucher_type==='receipt'?S.green:S.red,fontWeight:700,marginBottom:6,textAlign:'right'}}>
                  المبلغ ({CURRENCY_SYMBOLS[voucherForm.currency]||voucherForm.currency}) *
                </label>
                <input type="number" placeholder="0.00" value={voucherForm.amount}
                  onChange={e=>setVoucherForm({...voucherForm,amount:e.target.value})}
                  style={{...inp,fontSize:16,fontWeight:700,color:voucherForm.voucher_type==='receipt'?S.green:S.red,border:`1px solid ${voucherForm.voucher_type==='receipt'?S.green:S.red}44`}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>طريقة الدفع</label>
                <select value={voucherForm.payment_method} onChange={e=>setVoucherForm({...voucherForm,payment_method:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m} style={{background:S.navy2}}>{m}</option>)}
                </select>
              </div>

              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>البيان / الوصف</label>
                <input type="text" placeholder="وصف العملية المالية..." value={voucherForm.description}
                  onChange={e=>setVoucherForm({...voucherForm,description:e.target.value})} style={inp}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:20}}>
              <button onClick={()=>setShowVoucherForm(false)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleSaveVoucher} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':`💾 حفظ ${VOUCHER_TYPES[voucherForm.voucher_type]?.label||'السند'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print{body *{visibility:hidden}#print-area,#print-area *{visibility:visible}#print-area{position:absolute;left:0;top:0;width:100%}}`}</style>
    </div>
  )
}
