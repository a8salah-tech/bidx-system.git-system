'use client'

import React, { useState, useEffect, useCallback, Fragment } from 'react'
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
  asset:    {label:'أصول',      color:S.green,bg:'rgba(34,197,94,0.12)', icon:'🏦'},
  liability:{label:'خصوم',      color:S.red,  bg:'rgba(239,68,68,0.12)',icon:'📋'},
  equity:   {label:'حقوق ملكية',color:S.amber,bg:'rgba(245,158,11,0.12)',icon:'💼'},
  income:   {label:'إيرادات',   color:S.blue, bg:'rgba(59,130,246,0.12)',icon:'📈'},
  expense:  {label:'مصروفات',  color:S.red,  bg:'rgba(239,68,68,0.12)', icon:'📉'},
}

const VOUCHER_TYPES: Record<string,{label:string;color:string;icon:string}> = {
  receipt:{label:'سند قبض', color:S.green,icon:'📥'},
  payment:{label:'سند صرف', color:S.red,  icon:'📤'},
  journal:{label:'قيد يومية',color:S.blue, icon:'📒'},
}

const PAYMENT_METHODS=['نقداً','تحويل بنكي','شيك','بطاقة ائتمان','خطاب اعتماد','آجل']

const inp: React.CSSProperties = {
  width:'100%',background:S.navy3,border:`1px solid ${S.border}`,
  borderRadius:'9px',padding:'10px 14px',fontSize:'13px',color:S.white,
  outline:'none',fontFamily:'Tajawal, sans-serif',
  boxSizing:'border-box',direction:'rtl',textAlign:'right',
}
const th: React.CSSProperties = {
  padding:'11px 14px',textAlign:'right',fontSize:'10px',
  color:S.muted,fontWeight:700,background:'rgba(255,255,255,0.04)',
}
const td_s: React.CSSProperties = {padding:'11px 14px',textAlign:'right',fontSize:12}

function fmt(n:number,sym='$'){
  return `${sym}${Math.abs(n).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`
}

function nextNum(vouchers:any[],type:string,prefix:string):string{
  const nums=vouchers.filter(v=>v.voucher_type===type&&v.status!=='cancelled')
    .map(v=>v.voucher_number)
    .filter((n:string)=>n?.startsWith(prefix+'-'))
    .map((n:string)=>parseInt(n.replace(prefix+'-','')))
  return `${prefix}-${String((nums.length?Math.max(...nums):0)+1).padStart(4,'0')}`
}
function getNext(type:string,vouchers:any[]){
  if(type==='receipt') return nextNum(vouchers,'receipt','Q')
  if(type==='payment') return nextNum(vouchers,'payment','S')
  return nextNum(vouchers,'journal','J')
}

// ════════ CurrencyBar ════════
function CurrencyBar({currency,setCurrency}:{currency:string;setCurrency:(c:string)=>void}){
  const [open,setOpen]=useState(false)
  const sym=CURRENCY_SYMBOLS[currency]||currency
  const curr=CURRENCIES.find(c=>c.value===currency)
  useEffect(()=>{
    if(!open)return
    const h=()=>setOpen(false)
    document.addEventListener('click',h)
    return()=>document.removeEventListener('click',h)
  },[open])
  return(
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
              <span style={{fontSize:12,fontWeight:800,color:S.gold}}>{CURRENCY_SYMBOLS[c.value]||c.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════ PrintModal ════════
function PrintModal({v,sym,onClose}:{v:any;sym:string;onClose:()=>void}){
  const vt=VOUCHER_TYPES[v.voucher_type]||VOUCHER_TYPES.journal
  const vSym=CURRENCY_SYMBOLS[v.currency]||sym
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(8px)',padding:16}} onClick={onClose}>
      <div style={{background:S.white,width:'100%',maxWidth:600,borderRadius:16,overflow:'hidden',direction:'rtl'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:S.navy2,padding:'12px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>window.print()} style={{background:S.gold,color:S.navy,border:'none',padding:'8px 20px',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🖨️ طباعة</button>
            <button onClick={onClose} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'8px 16px',borderRadius:7,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>✕</button>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:S.gold2}}>معاينة السند</span>
        </div>
        <div id="print-area" style={{padding:32,background:S.white,color:'#111',fontFamily:'Tajawal, sans-serif',direction:'rtl'}}>
          <div style={{textAlign:'center',marginBottom:24,borderBottom:'2px solid #ddd',paddingBottom:16}}>
            <div style={{fontSize:20,fontWeight:900,color:S.navy,marginBottom:4}}>bidlx.com</div>
            <div style={{fontSize:16,fontWeight:700,color:vt.color,marginBottom:4}}>{vt.icon} {vt.label}</div>
            <div style={{fontSize:22,fontWeight:900,color:S.navy,fontFamily:'monospace'}}>{v.voucher_number}</div>
            {v.status==='cancelled'&&<div style={{marginTop:8,fontSize:14,fontWeight:900,color:'#EF4444',border:'2px solid #EF4444',padding:'4px 16px',borderRadius:8,display:'inline-block'}}>⚠️ مُلغى</div>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            {[{l:'رقم السند',v:v.voucher_number},{l:'التاريخ',v:v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'},{l:'الطرف الآخر',v:v.party_name||'—'},{l:'طريقة الدفع',v:v.payment_method||'—'},{l:'العملة',v:v.currency||'—'},{l:'نوع السند',v:vt.label}]
              .map((f,i)=>(
              <div key={i} style={{background:'#f8f8f8',borderRadius:8,padding:'10px 14px',textAlign:'right'}}>
                <div style={{fontSize:10,color:'#666',marginBottom:3,fontWeight:700}}>{f.l}</div>
                <div style={{fontSize:13,fontWeight:600}}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:v.voucher_type==='receipt'?'#f0fff4':'#fff0f0',border:`2px solid ${vt.color}`,borderRadius:12,padding:'18px 24px',textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:12,color:'#666',marginBottom:6}}>المبلغ</div>
            <div style={{fontSize:32,fontWeight:900,color:vt.color,fontFamily:'monospace'}}>{v.voucher_type==='receipt'?'+':'-'}{fmt(v.amount||0,vSym)}</div>
          </div>
          {v.description&&<div style={{background:'#f8f8f8',borderRadius:8,padding:'12px 16px',marginBottom:16,textAlign:'right'}}><div style={{fontSize:10,color:'#666',marginBottom:4,fontWeight:700}}>البيان</div><div style={{fontSize:13}}>{v.description}</div></div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginTop:32,paddingTop:20,borderTop:'1px solid #ddd'}}>
            {['المحاسب','المدير المالي','المستلم'].map(l=>(
              <div key={l} style={{textAlign:'center'}}><div style={{height:40,borderBottom:'1px solid #999',marginBottom:6}}/><div style={{fontSize:11,color:'#666'}}>{l}</div></div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:20,fontSize:10,color:'#999'}}>صادر من نظام bidlx.com — {new Date().toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════════════
export default function AccountingPage(){
  const [tab,setTab]=useState<'dashboard'|'accounts'|'vouchers'|'journal'|'ledger'|'trial'|'statement'|'reports'>('dashboard')
  const [accounts,setAccounts]   = useState<any[]>([])
  const [vouchers,setVouchers]   = useState<any[]>([])
  const [customers,setCustomers] = useState<any[]>([])
  const [suppliers,setSuppliers] = useState<any[]>([])
  const [journalEntries,setJournalEntries] = useState<any[]>([])
  const [loading,setLoading]     = useState(true)
  const [search,setSearch]       = useState('')
  const [typeFilter,setTypeFilter] = useState('all')
  const [currency,setCurrency]   = useState('USD')
  const [vPage,setVPage]         = useState(1)
  const [ledgerAccountId,setLedgerAccountId] = useState('')
  const [stmtType,setStmtType]   = useState<'customer'|'supplier'|'account'>('customer')
  const [stmtPartyId,setStmtPartyId] = useState('')
  const [stmtAccountId,setStmtAccountId] = useState('')
  const [stmtFrom,setStmtFrom]   = useState('')
  const [stmtTo,setStmtTo]       = useState('')
  const [showAccForm,setShowAccForm]   = useState(false)
  const [showVchForm,setShowVchForm]   = useState(false)
  const [printVch,setPrintVch]         = useState<any>(null)
  const [editVch,setEditVch]           = useState<any>(null)
  const [saving,setSaving]             = useState(false)
  const [cancellingId,setCancellingId] = useState<string|null>(null)
  const [showJournalForm,setShowJournalForm] = useState(false)

  // نظام القيد المزدوج
  const [jLines,setJLines] = useState<{account_id:string;debit:string;credit:string}[]>([
    {account_id:'',debit:'',credit:''},
    {account_id:'',debit:'',credit:''},
  ])
  const [jDesc,setJDesc]=useState('')
  const [jDate,setJDate]=useState(new Date().toISOString().split('T')[0])
  const [jCurrency,setJCurrency]=useState('USD')

  const [accForm,setAccForm] = useState({account_code:'',account_name:'',account_type:'asset',description:'',opening_balance:'0'})
  const [vchForm,setVchForm] = useState({
    voucher_type:'receipt',voucher_number:'Q-0001',
    voucher_date:new Date().toISOString().split('T')[0],
    account_id:'',party_type:'customer',party_id:'',party_name:'',
    amount:'',currency:'USD',description:'',payment_method:'نقداً',
  })

  // ── load ──
  const loadAll = useCallback(async()=>{
    setLoading(true)
    const {data:{session}} = await supabase.auth.getSession()
    const [aR,vR,cR,sR,stR,jR] = await Promise.all([
      supabase.from('accounts').select('*').order('account_code'),
      supabase.from('vouchers').select('*').order('created_at',{ascending:false}),
      supabase.from('customers').select('id,full_name,company_name').order('full_name'),
      supabase.from('suppliers').select('id,company_name').order('company_name'),
      supabase.from('company_settings').select('default_currency').limit(1).single(),
      supabase.from('journal_entries').select(`*,journal_lines(id,account_id,debit,credit,accounts(account_code,account_name))`).order('entry_date',{ascending:false}),
    ])
    setAccounts(aR.data||[])
    setVouchers(vR.data||[])
    setCustomers(cR.data||[])
    setSuppliers(sR.data||[])
    setJournalEntries(jR.data||[])
    if(stR.data?.default_currency) setCurrency(stR.data.default_currency)
    const nextN = getNext('receipt',vR.data||[])
    setVchForm(prev=>({...prev,voucher_number:nextN,currency}))
    setLoading(false)
  },[])

  useEffect(()=>{loadAll()},[loadAll])

  async function saveCurrency(cur:string){
    setCurrency(cur)
    setVchForm(p=>({...p,currency:cur}))
    const {data:ex}=await supabase.from('company_settings').select('id').limit(1).single()
    if(ex?.id) await supabase.from('company_settings').update({default_currency:cur}).eq('id',ex.id)
    else await supabase.from('company_settings').insert([{default_currency:cur}])
  }

  async function handleSaveAccount(){
    if(!accForm.account_code||!accForm.account_name){alert('أدخل الكود والاسم');return}
    setSaving(true)
    const {data:{session}}=await supabase.auth.getSession()
    const bal=parseFloat(accForm.opening_balance)||0
    const {error}=await supabase.from('accounts').insert([{...accForm,balance:bal,opening_balance:bal,currency,user_id:session?.user?.id}])
    if(error) alert('خطأ: '+error.message)
    else{setShowAccForm(false);setAccForm({account_code:'',account_name:'',account_type:'asset',description:'',opening_balance:'0'});await loadAll()}
    setSaving(false)
  }

  // ════════════════════════════════════════
  // FIX: حفظ سند — نظام القيد المزدوج الصحيح
  // ════════════════════════════════════════
  async function handleSaveVoucher(){
    if(!vchForm.amount||!vchForm.account_id){alert('أدخل المبلغ وحدد الحساب');return}
    const amount=parseFloat(vchForm.amount)
    if(amount<=0){alert('المبلغ يجب أن يكون أكبر من صفر');return}
    setSaving(true)
    try{
      const {data:{session}}=await supabase.auth.getSession()
      const uid=session?.user?.id
      const isReceipt=vchForm.voucher_type==='receipt'
      const selectedAcc=accounts.find(a=>a.id===vchForm.account_id)
      const cashAcc=accounts.find(a=>a.account_code==='1001'||a.account_name.includes('صندوق')||a.account_name.includes('خزينة'))

      // 1. حفظ السند مع status='active'
      const {data:vch,error:ve}=await supabase.from('vouchers').insert([{
        voucher_type:vchForm.voucher_type,
        voucher_number:vchForm.voucher_number,
        voucher_date:vchForm.voucher_date,
        account_id:vchForm.account_id,
        party_type:vchForm.party_type,
        party_id:vchForm.party_id||null,
        party_name:vchForm.party_name,
        amount,
        currency:vchForm.currency,
        description:vchForm.description,
        payment_method:vchForm.payment_method,
        status:'active',
        user_id:uid,
      }]).select().single()
      if(ve) throw ve

      // 2. تحديث رصيد الحساب المختار (القيد المزدوج الصحيح)
      if(selectedAcc){
        const debit=isReceipt?0:amount
        const credit=isReceipt?amount:0
        const newBal=(selectedAcc.balance||0)+(debit-credit)
        await supabase.from('accounts').update({balance:newBal}).eq('id',selectedAcc.id)
      }
      // 3. تحديث حساب الخزينة/الصندوق
      if(cashAcc){
        const debit=isReceipt?amount:0
        const credit=isReceipt?0:amount
        const newBal=(cashAcc.balance||0)+(debit-credit)
        await supabase.from('accounts').update({balance:newBal}).eq('id',cashAcc.id)
      }

      // 4. قيد يومية تلقائي
      const {data:entry,error:ee}=await supabase.from('journal_entries').insert([{
        entry_date:vchForm.voucher_date,
        description:`${VOUCHER_TYPES[vchForm.voucher_type].label} ${vchForm.voucher_number} — ${vchForm.party_name||vchForm.description||''}`,
        reference_type:'voucher',
        reference_id:vch.id,
        status:'active',
        currency:vchForm.currency,
        user_id:uid,
      }]).select().single()
      if(ee) throw ee

      // 5. سطور القيد المزدوج (Debit / Credit)
      const lines:any[]=[
        {entry_id:entry.id,account_id:vchForm.account_id,debit:isReceipt?0:amount,credit:isReceipt?amount:0},
      ]
      if(cashAcc){
        lines.push({entry_id:entry.id,account_id:cashAcc.id,debit:isReceipt?amount:0,credit:isReceipt?0:amount})
      }
      await supabase.from('journal_lines').insert(lines)

      setShowVchForm(false)
      const nextN=getNext(vchForm.voucher_type,[...vouchers,{voucher_type:vchForm.voucher_type,voucher_number:vchForm.voucher_number}])
      setVchForm(p=>({...p,amount:'',description:'',party_id:'',party_name:'',voucher_number:nextN}))
      await loadAll()
    }catch(err:any){alert('خطأ: '+err.message)}
    finally{setSaving(false)}
  }

  async function handleEditVoucher(){
    if(!editVch)return
    setSaving(true)
    await supabase.from('vouchers').update({
      voucher_date:editVch.voucher_date,party_name:editVch.party_name,
      amount:parseFloat(editVch.amount)||editVch.amount,
      description:editVch.description,payment_method:editVch.payment_method,
    }).eq('id',editVch.id)
    setEditVch(null);await loadAll();setSaving(false)
  }

  // ════════════════════════════════════════
  // FIX: cancelVoucher — إلغاء بدون حذف + عكس القيود
  // ════════════════════════════════════════
  async function cancelVoucher(voucherId:string){
    if(!window.confirm('هل تريد إلغاء هذا السند؟ سيتم عكس القيد المحاسبي.')) return
    setCancellingId(voucherId)
    try{
      const {data:{session}}=await supabase.auth.getSession()
      const uid=session?.user?.id
      const v=vouchers.find(x=>x.id===voucherId)
      if(!v){alert('السند غير موجود');return}

      // 1. تغيير status إلى cancelled (NO DELETE)
      await supabase.from('vouchers').update({status:'cancelled'}).eq('id',voucherId)

      const amount=parseFloat(v.amount)||0
      const isReceipt=v.voucher_type==='receipt'
      const selectedAcc=accounts.find(a=>a.id===v.account_id)
      const cashAcc=accounts.find(a=>a.account_code==='1001'||a.account_name.includes('صندوق')||a.account_name.includes('خزينة'))

      // 2. عكس أرصدة الحسابات
      if(selectedAcc){
        const debit=isReceipt?0:amount
        const credit=isReceipt?amount:0
        // عكس: نطرح بدل ما نجمع
        const newBal=(selectedAcc.balance||0)-(debit-credit)
        await supabase.from('accounts').update({balance:newBal}).eq('id',selectedAcc.id)
      }
      if(cashAcc){
        const debit=isReceipt?amount:0
        const credit=isReceipt?0:amount
        const newBal=(cashAcc.balance||0)-(debit-credit)
        await supabase.from('accounts').update({balance:newBal}).eq('id',cashAcc.id)
      }

      // 3. قيد عكسي في دفتر اليومية
      const {data:reverseEntry,error:re}=await supabase.from('journal_entries').insert([{
        entry_date:new Date().toISOString().split('T')[0],
        description:`⊘ قيد عكسي — ${VOUCHER_TYPES[v.voucher_type]?.label||''} ${v.voucher_number}`,
        reference_type:'reversal',
        reference_id:voucherId,
        status:'active',
        currency:v.currency||currency,
        user_id:uid,
      }]).select().single()

      if(!re&&reverseEntry){
        // سطور عكسية: مدين↔دائن
        const reverseLines:any[]=[
          {entry_id:reverseEntry.id,account_id:v.account_id,debit:isReceipt?amount:0,credit:isReceipt?0:amount},
        ]
        if(cashAcc){
          reverseLines.push({entry_id:reverseEntry.id,account_id:cashAcc.id,debit:isReceipt?0:amount,credit:isReceipt?amount:0})
        }
        await supabase.from('journal_lines').insert(reverseLines)
      }

      // 4. تحديث حالة قيود اليومية الأصلية
      await supabase.from('journal_entries').update({status:'cancelled'})
        .eq('reference_type','voucher').eq('reference_id',voucherId)

      await loadAll()
      alert('✅ تم إلغاء السند وعكس القيد المحاسبي')
    }catch(err:any){alert('خطأ في الإلغاء: '+err.message)}
    finally{setCancellingId(null)}
  }

  // ════════════════════════════════════════
  // حفظ قيد يومية يدوي (Double Entry)
  // ════════════════════════════════════════
  async function handleSaveJournal(){
    const validLines=jLines.filter(l=>l.account_id&&(parseFloat(l.debit)||parseFloat(l.credit)))
    if(validLines.length<2){alert('يجب إدخال سطرين على الأقل');return}
    const totalDebit=validLines.reduce((s,l)=>s+(parseFloat(l.debit)||0),0)
    const totalCredit=validLines.reduce((s,l)=>s+(parseFloat(l.credit)||0),0)
    if(Math.abs(totalDebit-totalCredit)>0.001){
      alert(`القيد غير متوازن!\nالمدين: ${totalDebit.toFixed(2)}\nالدائن: ${totalCredit.toFixed(2)}\nالفرق: ${Math.abs(totalDebit-totalCredit).toFixed(2)}`);return
    }
    setSaving(true)
    try{
      const {data:{session}}=await supabase.auth.getSession()
      const uid=session?.user?.id
      const nextJ=getNext('journal',vouchers)

      // 1. إنشاء قيد يومية
      const {data:entry,error:ee}=await supabase.from('journal_entries').insert([{
        entry_date:jDate,
        description:jDesc||'قيد يومية يدوي',
        reference_type:'journal',
        reference_id:null,
        status:'active',
        currency:jCurrency,
        user_id:uid,
      }]).select().single()
      if(ee) throw ee

      // 2. سطور القيد المزدوج
      const lines=validLines.map(l=>({
        entry_id:entry.id,
        account_id:l.account_id,
        debit:parseFloat(l.debit)||0,
        credit:parseFloat(l.credit)||0,
      }))
      await supabase.from('journal_lines').insert(lines)

      // 3. تحديث أرصدة الحسابات
      for(const l of validLines){
        const acc=accounts.find(a=>a.id===l.account_id)
        if(acc){
          const newBal=(acc.balance||0)+((parseFloat(l.debit)||0)-(parseFloat(l.credit)||0))
          await supabase.from('accounts').update({balance:newBal}).eq('id',acc.id)
        }
      }

      setShowJournalForm(false)
      setJLines([{account_id:'',debit:'',credit:''},{account_id:'',debit:'',credit:''}])
      setJDesc('');setJDate(new Date().toISOString().split('T')[0])
      await loadAll()
      alert('✅ تم حفظ القيد المحاسبي')
    }catch(err:any){alert('خطأ: '+err.message)}
    finally{setSaving(false)}
  }

  // ── الإحصائيات — تعتمد على السندات النشطة فقط ──
  const activeVouchers = vouchers.filter(v=>v.status!=='cancelled')
  const totalAssets      = accounts.filter(a=>a.account_type==='asset').reduce((s,a)=>s+(a.balance||0),0)
  const totalLiabilities = accounts.filter(a=>a.account_type==='liability').reduce((s,a)=>s+Math.abs(a.balance||0),0)
  const totalIncome      = accounts.filter(a=>a.account_type==='income').reduce((s,a)=>s+(a.balance||0),0)
  const totalExpenses    = accounts.filter(a=>a.account_type==='expense').reduce((s,a)=>s+(a.balance||0),0)
  const netProfit        = totalIncome - totalExpenses
  // حقوق الملكية = الأصول - الخصوم (مدعومة من الإيرادات والمصروفات)
  const totalEquity      = totalAssets - totalLiabilities
  const receipts         = activeVouchers.filter(v=>v.voucher_type==='receipt').reduce((s,v)=>s+(v.amount||0),0)
  const payments         = activeVouchers.filter(v=>v.voucher_type==='payment').reduce((s,v)=>s+(v.amount||0),0)
  const profitColor      = netProfit>0?S.green:netProfit<0?S.red:S.amber
  const sym              = CURRENCY_SYMBOLS[currency]||currency

  function getLedgerLines(accountId:string){
    const lines:any[]=[]
    journalEntries.filter(e=>e.status!=='cancelled').forEach(entry=>{
      (entry.journal_lines||[]).forEach((line:any)=>{
        if(line.account_id===accountId){
          lines.push({date:entry.entry_date,desc:entry.description,debit:line.debit,credit:line.credit,voucherRef:entry.reference_id})
        }
      })
    })
    return lines.sort((a,b)=>a.date?.localeCompare(b.date||'')||0)
  }

  // ميزان المراجعة من القيود النشطة فقط
  const trialBalance = accounts.map(acc=>{
    let totalDebit=0,totalCredit=0
    journalEntries.filter(e=>e.status!=='cancelled').forEach(entry=>{
      (entry.journal_lines||[]).forEach((line:any)=>{
        if(line.account_id===acc.id){totalDebit+=(line.debit||0);totalCredit+=(line.credit||0)}
      })
    })
    const netDebit  = totalDebit > totalCredit ? totalDebit-totalCredit : 0
    const netCredit = totalCredit > totalDebit ? totalCredit-totalDebit : 0
    return {...acc,totalDebit,totalCredit,netDebit,netCredit}
  }).filter(a=>a.totalDebit>0||a.totalCredit>0)

  const trialTotalDebit  = trialBalance.reduce((s,a)=>s+a.netDebit,0)
  const trialTotalCredit = trialBalance.reduce((s,a)=>s+a.netCredit,0)

  // كشف الحساب — السندات النشطة فقط
  const stmtVouchers = activeVouchers.filter(v=>{
    if(stmtType==='account'&&stmtAccountId) return v.account_id===stmtAccountId
    if(stmtType==='customer'&&stmtPartyId) return v.party_id===stmtPartyId&&v.party_type==='customer'
    if(stmtType==='supplier'&&stmtPartyId) return v.party_id===stmtPartyId&&v.party_type==='supplier'
    return false
  }).filter(v=>{
    if(stmtFrom&&v.voucher_date<stmtFrom)return false
    if(stmtTo&&v.voucher_date>stmtTo)return false
    return true
  })
  const stmtTotal=stmtVouchers.reduce((s,v)=>s+(v.voucher_type==='receipt'?v.amount||0:-(v.amount||0)),0)

  const PAGE=20,totalPages=Math.ceil(vouchers.length/PAGE)
  const pagedV=vouchers.slice((vPage-1)*PAGE,vPage*PAGE)
  const filteredAcc=accounts.filter(a=>typeFilter==='all'||a.account_type===typeFilter).filter(a=>a.account_name?.includes(search)||a.account_code?.includes(search))
  const ledgerAccount = accounts.find(a=>a.id===ledgerAccountId)
  const ledgerLines   = ledgerAccountId ? getLedgerLines(ledgerAccountId) : []
  let ledgerRunning   = ledgerAccount?.opening_balance||0

  // التحقق من توازن القيد اليدوي
  const jTotalDebit=jLines.reduce((s,l)=>s+(parseFloat(l.debit)||0),0)
  const jTotalCredit=jLines.reduce((s,l)=>s+(parseFloat(l.credit)||0),0)
  const jBalanced=Math.abs(jTotalDebit-jTotalCredit)<0.001

  const TABS=[
    {key:'dashboard',label:'📊 لوحة المالية'},
    {key:'accounts', label:'📁 دليل الحسابات'},
    {key:'vouchers', label:'📋 السندات'},
    {key:'journal',  label:'📒 دفتر اليومية'},
    {key:'ledger',   label:'📗 دفتر الأستاذ'},
    {key:'trial',    label:'⚖️ ميزان المراجعة'},
    {key:'statement',label:'📊 كشف الحساب'},
    {key:'reports',  label:'📈 التقارير'},
  ]

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',color:S.white,fontFamily:'Tajawal, sans-serif',direction:'rtl',background:S.navy}}>

      {/* ── شريط الأدوات ── */}
      <div style={{background:S.navy2,borderBottom:`1px solid ${S.borderG}`,padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setVchForm(p=>({...p,voucher_number:getNext(p.voucher_type,vouchers),currency}));setShowVchForm(true)}}
            style={{background:S.gold,color:S.navy,border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            + إضافة سند
          </button>
          <button onClick={()=>setShowAccForm(true)}
            style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            + إضافة حساب
          </button>
          <button onClick={()=>setShowJournalForm(true)}
            style={{background:'rgba(59,130,246,0.12)',color:S.blue,border:`1px solid rgba(59,130,246,0.25)`,padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
            📒 قيد يدوي
          </button>
        </div>
        <CurrencyBar currency={currency} setCurrency={saveCurrency}/>
      </div>

      {/* ── التبويبات ── */}
      <div style={{display:'flex',background:S.navy2,borderBottom:`1px solid ${S.border}`,padding:'0 24px',flexShrink:0,overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as any)}
            style={{padding:'11px 16px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Tajawal, sans-serif',border:'none',borderBottom:tab===t.key?`2px solid ${S.gold}`:'2px solid transparent',background:'transparent',color:tab===t.key?S.gold2:S.muted,transition:'all .15s',whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── المحتوى ── */}
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

        {/* ══ لوحة المالية ══ */}
        {tab==='dashboard'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {label:'إجمالي الأصول',   val:fmt(totalAssets,sym),     color:S.green,sub:'الموجودات'},
                {label:'إجمالي الخصوم',   val:fmt(totalLiabilities,sym),color:S.red,  sub:'الالتزامات'},
                {label:'إجمالي الإيرادات',val:fmt(totalIncome,sym),     color:S.blue, sub:'المبيعات'},
                {label:'إجمالي المصروفات',val:fmt(totalExpenses,sym),   color:S.amber,sub:'التكاليف'},
              ].map((s,i)=>(
                <div key={i} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,textAlign:'right'}}>
                  <div style={{fontSize:9,color:S.muted,marginBottom:4,fontWeight:600}}>{s.sub}</div>
                  <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'monospace',marginBottom:4}}>{s.val}</div>
                  <div style={{fontSize:11,color:S.muted}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* صافي الربح + حقوق الملكية + التدفقات */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div style={{background:S.navy2,border:`1px solid ${profitColor}40`,borderRadius:14,padding:18,textAlign:'right'}}>
                <div style={{fontSize:9,color:S.muted,marginBottom:4}}>صافي الربح والخسارة</div>
                <div style={{fontSize:26,fontWeight:900,color:profitColor,fontFamily:'monospace'}}>{netProfit>=0?'+':''}{fmt(netProfit,sym)}</div>
                <div style={{fontSize:10,color:S.muted,marginTop:4}}>{netProfit>0?'📈 ربح':netProfit<0?'📉 خسارة':'⚖️ تعادل'}</div>
              </div>
              <div style={{background:S.navy2,border:`1px solid ${S.amber}40`,borderRadius:14,padding:18,textAlign:'right'}}>
                <div style={{fontSize:9,color:S.muted,marginBottom:4}}>حقوق الملكية (الأصول − الخصوم)</div>
                <div style={{fontSize:26,fontWeight:900,color:S.amber,fontFamily:'monospace'}}>{fmt(totalEquity,sym)}</div>
                <div style={{fontSize:10,color:S.muted,marginTop:4}}>مدعوم بالإيرادات والمصروفات</div>
              </div>
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,textAlign:'right'}}>
                <div style={{fontSize:9,color:S.muted,marginBottom:8}}>التدفقات النقدية (سندات نشطة)</div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:S.green,fontFamily:'monospace'}}>{fmt(receipts,sym)}</span>
                  <span style={{fontSize:10,color:S.muted}}>📥 قبض</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700,color:S.red,fontFamily:'monospace'}}>{fmt(payments,sym)}</span>
                  <span style={{fontSize:10,color:S.muted}}>📤 صرف</span>
                </div>
              </div>
            </div>

            {/* آخر السندات النشطة */}
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18}}>
              <div style={{fontSize:13,fontWeight:800,color:S.white,marginBottom:14,textAlign:'right'}}>آخر السندات النشطة</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {activeVouchers.slice(0,5).map(v=>{
                  const vt=VOUCHER_TYPES[v.voucher_type]||VOUCHER_TYPES.journal
                  const vSym=CURRENCY_SYMBOLS[v.currency]||sym
                  return(
                    <div key={v.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:S.card,borderRadius:10,border:`1px solid ${S.border}`}}>
                      <span style={{fontSize:14,fontWeight:800,color:v.voucher_type==='receipt'?S.green:S.red,fontFamily:'monospace'}}>{v.voucher_type==='receipt'?'+':'-'}{fmt(v.amount||0,vSym)}</span>
                      <div style={{textAlign:'right'}}>
                        <span style={{fontSize:11,color:S.gold,fontFamily:'monospace',marginLeft:8}}>{v.voucher_number}</span>
                        <span style={{fontSize:11,color:S.white}}>{v.party_name||v.description||'—'}</span>
                        <div style={{fontSize:10,color:S.muted,marginTop:2}}>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ دليل الحسابات ══ */}
        {tab==='accounts'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input type="text" placeholder="🔍 ابحث عن حساب..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{...inp,flex:1,minWidth:200,background:S.navy2}}/>
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...inp,width:'auto',cursor:'pointer',background:S.navy2}}>
                <option value="all">كل الأنواع</option>
                {Object.entries(ACCOUNT_TYPES).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
              {Object.entries(ACCOUNT_TYPES).map(([key,t])=>{
                const accs=accounts.filter(a=>a.account_type===key)
                const total=accs.reduce((s,a)=>s+(a.balance||0),0)
                return(
                  <div key={key} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:12,padding:14,textAlign:'right'}}>
                    <div style={{fontSize:18,marginBottom:6}}>{t.icon}</div>
                    <div style={{fontSize:14,fontWeight:800,color:t.color,fontFamily:'monospace'}}>{fmt(total,sym)}</div>
                    <div style={{fontSize:10,color:S.muted,marginTop:2}}>{t.label} ({accs.length})</div>
                  </div>
                )
              })}
            </div>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>{['الكود','اسم الحساب','النوع','الرصيد الحالي','الوصف','الأستاذ'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {loading?<tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:S.muted}}>جاري التحميل...</td></tr>
                  :filteredAcc.length===0?<tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:S.muted}}>لا توجد حسابات</td></tr>
                  :filteredAcc.map((a,i)=>{
                    const t=ACCOUNT_TYPES[a.account_type]||ACCOUNT_TYPES.asset
                    const aSym=CURRENCY_SYMBOLS[a.currency]||sym
                    return(
                      <tr key={a.id} style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:i%2===0?'transparent':S.card}}>
                        <td style={{...td_s,color:S.gold,fontWeight:700,fontFamily:'monospace'}}>{a.account_code}</td>
                        <td style={{...td_s,fontWeight:600}}>{t.icon} {a.account_name}</td>
                        <td style={td_s}><span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:t.bg,color:t.color,fontWeight:700}}>{t.label}</span></td>
                        <td style={{...td_s,fontSize:14,fontWeight:800,color:a.balance>=0?S.green:S.red,fontFamily:'monospace'}}>{fmt(a.balance||0,aSym)}</td>
                        <td style={{...td_s,color:S.muted,maxWidth:160}}><div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.description||'—'}</div></td>
                        <td style={td_s}>
                          <button onClick={()=>{setLedgerAccountId(a.id);setTab('ledger')}}
                            style={{background:S.card2,border:`1px solid rgba(59,130,246,0.3)`,color:S.blue,padding:'3px 10px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                            📗 الأستاذ
                          </button>
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
            {/* إحصاء السندات النشطة فقط */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {Object.entries(VOUCHER_TYPES).map(([key,t])=>{
                const vList=activeVouchers.filter(v=>v.voucher_type===key)
                const total=vList.reduce((s,v)=>s+(v.amount||0),0)
                const cancelledCount=vouchers.filter(v=>v.voucher_type===key&&v.status==='cancelled').length
                return(
                  <div key={key} style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,textAlign:'right'}}>
                    <div style={{fontSize:22,marginBottom:8}}>{t.icon}</div>
                    <div style={{fontSize:20,fontWeight:900,color:t.color,marginBottom:4,fontFamily:'monospace'}}>{fmt(total,sym)}</div>
                    <div style={{fontSize:11,color:S.muted}}>{t.label} — {vList.length} نشط{cancelledCount>0?` | ${cancelledCount} ملغى`:''}</div>
                  </div>
                )
              })}
            </div>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>{['رقم السند','النوع','التاريخ','الطرف الآخر','المبلغ','العملة','الحالة','إجراءات'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {pagedV.length===0?<tr><td colSpan={8} style={{padding:'40px',textAlign:'center',color:S.muted}}>لا توجد سندات بعد</td></tr>
                  :pagedV.map((v,i)=>{
                    const vt=VOUCHER_TYPES[v.voucher_type]||VOUCHER_TYPES.journal
                    const vSym=CURRENCY_SYMBOLS[v.currency]||sym
                    const isCancelled=v.status==='cancelled'
                    return(
                      <tr key={v.id} style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:isCancelled?'rgba(239,68,68,0.04)':i%2===0?'transparent':S.card,opacity:isCancelled?0.65:1}}>
                        <td style={{...td_s,color:isCancelled?S.muted:S.gold,fontWeight:700,fontFamily:'monospace',textDecoration:isCancelled?'line-through':'none'}}>{v.voucher_number}</td>
                        <td style={td_s}><span style={{fontSize:10,padding:'3px 10px',borderRadius:20,background:`${vt.color}18`,color:vt.color,fontWeight:700}}>{vt.icon} {vt.label}</span></td>
                        <td style={{...td_s,color:S.muted}}>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'}</td>
                        <td style={td_s}>{v.party_name||'—'}</td>
                        <td style={{...td_s,fontSize:14,fontWeight:800,color:isCancelled?S.muted:v.voucher_type==='receipt'?S.green:S.red,fontFamily:'monospace'}}>{v.voucher_type==='receipt'?'+':'-'}{fmt(v.amount||0,vSym)}</td>
                        <td style={td_s}><span style={{padding:'2px 8px',borderRadius:6,background:S.card2,color:S.gold,fontSize:10,fontWeight:700}}>{v.currency||currency}</span></td>
                        <td style={td_s}>
                          <span style={{fontSize:10,padding:'3px 9px',borderRadius:20,fontWeight:700,
                            background:isCancelled?'rgba(239,68,68,0.12)':'rgba(34,197,94,0.12)',
                            color:isCancelled?S.red:S.green}}>
                            {isCancelled?'⊘ ملغى':'● نشط'}
                          </span>
                        </td>
                        <td style={td_s}><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                          <button onClick={()=>setPrintVch(v)} style={{background:S.card2,border:`1px solid ${S.border}`,color:S.muted,padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🖨️</button>
                          {!isCancelled&&<button onClick={()=>setEditVch({...v,amount:String(v.amount)})} style={{background:S.gold3,border:`1px solid ${S.borderG}`,color:S.gold2,padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>✏️</button>}
                          {!isCancelled&&(
                            <button
                              onClick={()=>cancelVoucher(v.id)}
                              disabled={cancellingId===v.id}
                              style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:S.red,padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',fontFamily:'Tajawal, sans-serif',fontWeight:700}}>
                              {cancellingId===v.id?'⏳':'⊘ إلغاء'}
                            </button>
                          )}
                        </div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages>1&&(
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                <button onClick={()=>setVPage(p=>Math.max(1,p-1))} disabled={vPage===1} style={{background:S.card2,border:`1px solid ${S.border}`,color:vPage===1?S.muted:S.white,padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>← السابقة</button>
                <span style={{fontSize:12,color:S.muted}}>صفحة {vPage} من {totalPages}</span>
                <button onClick={()=>setVPage(p=>Math.min(totalPages,p+1))} disabled={vPage===totalPages} style={{background:S.card2,border:`1px solid ${S.border}`,color:vPage===totalPages?S.muted:S.white,padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>التالية →</button>
              </div>
            )}
          </div>
        )}

        {/* ══ دفتر اليومية ══ */}
        {tab==='journal'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={loadAll} style={{background:S.gold3,color:S.gold2,border:`1px solid ${S.borderG}`,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Tajawal, sans-serif'}}>🔄 تحديث</button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>📒 دفتر اليومية العام</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>سجل كافة القيود المحاسبية النشطة — {journalEntries.filter(e=>e.status!=='cancelled').length} قيد</div>
              </div>
            </div>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>
                  {['التاريخ والبيان','الحساب','مدين','دائن'].map(h=><th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {journalEntries.filter(e=>e.status!=='cancelled').length===0
                    ?<tr><td colSpan={4} style={{padding:'40px',textAlign:'center',color:S.muted}}>لا توجد قيود مسجلة</td></tr>
                  :journalEntries.filter(e=>e.status!=='cancelled').map(entry=>(
                    <Fragment key={entry.id}>
                      <tr style={{background:'rgba(201,168,76,0.05)',borderBottom:`1px solid ${S.borderG}`}}>
                        <td colSpan={4} style={{padding:'11px 14px',textAlign:'right',fontWeight:700,color:S.gold2,fontSize:12}}>
                          {entry.entry_date&&new Date(entry.entry_date).toLocaleDateString('ar-EG')} — {entry.description}
                        </td>
                      </tr>
                      {(entry.journal_lines||[]).map((line:any,li:number)=>(
                        <tr key={line.id} style={{borderBottom:`1px solid ${S.border}`,background:li%2===0?'transparent':S.card}}>
                          <td style={td_s}></td>
                          <td style={{...td_s,fontWeight:600}}>
                            <span style={{fontSize:10,color:S.gold,fontFamily:'monospace',marginLeft:8}}>{line.accounts?.account_code}</span>
                            {line.accounts?.account_name}
                          </td>
                          <td style={{...td_s,color:S.green,fontFamily:'monospace',fontWeight:700}}>{line.debit>0?fmt(line.debit,sym):'—'}</td>
                          <td style={{...td_s,color:S.red,fontFamily:'monospace',fontWeight:700}}>{line.credit>0?fmt(line.credit,sym):'—'}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ دفتر الأستاذ ══ */}
        {tab==='ledger'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18}}>
              <div style={{fontSize:14,fontWeight:800,color:S.white,marginBottom:14,textAlign:'right'}}>📗 دفتر الأستاذ</div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اختر الحساب</label>
                <select value={ledgerAccountId} onChange={e=>setLedgerAccountId(e.target.value)} style={{...inp,cursor:'pointer',maxWidth:400}}>
                  <option value="">اختر حساباً...</option>
                  {accounts.map(a=><option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name}</option>)}
                </select>
              </div>
            </div>
            {ledgerAccount&&(
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
                <div style={{padding:'14px 20px',background:'rgba(255,255,255,0.03)',borderBottom:`1px solid ${S.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:S.muted}}>رصيد افتتاحي: {fmt(ledgerAccount.opening_balance||0,sym)}</span>
                  <div style={{textAlign:'right'}}>
                    <span style={{fontSize:13,fontWeight:800,color:S.gold2}}>{ledgerAccount.account_code} — {ledgerAccount.account_name}</span>
                  </div>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>
                    {['التاريخ','البيان','مدين','دائن','الرصيد'].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    <tr style={{background:S.card,borderBottom:`1px solid ${S.border}`}}>
                      <td style={td_s}>—</td>
                      <td style={{...td_s,color:S.muted,fontStyle:'italic'}}>الرصيد الافتتاحي</td>
                      <td style={td_s}>—</td><td style={td_s}>—</td>
                      <td style={{...td_s,fontFamily:'monospace',fontWeight:700,color:S.gold}}>{fmt(ledgerAccount.opening_balance||0,sym)}</td>
                    </tr>
                    {ledgerLines.length===0?<tr><td colSpan={5} style={{padding:'30px',textAlign:'center',color:S.muted}}>لا توجد حركات مسجلة</td></tr>
                    :ledgerLines.map((line,i)=>{
                      ledgerRunning+=((line.debit||0)-(line.credit||0))
                      return(
                        <tr key={i} style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:i%2===0?'transparent':S.card}}>
                          <td style={{...td_s,color:S.muted}}>{line.date?new Date(line.date).toLocaleDateString('ar-EG'):'—'}</td>
                          <td style={td_s}>{line.desc||'—'}</td>
                          <td style={{...td_s,color:S.green,fontFamily:'monospace',fontWeight:700}}>{line.debit>0?fmt(line.debit,sym):'—'}</td>
                          <td style={{...td_s,color:S.red,fontFamily:'monospace',fontWeight:700}}>{line.credit>0?fmt(line.credit,sym):'—'}</td>
                          <td style={{...td_s,fontFamily:'monospace',fontWeight:800,color:ledgerRunning>=0?S.green:S.red}}>{fmt(ledgerRunning,sym)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${S.borderG}`,background:S.card2}}>
                      <td colSpan={4} style={{padding:'12px 14px',textAlign:'right',fontSize:12,fontWeight:700,color:S.gold2}}>الرصيد الختامي</td>
                      <td style={{padding:'12px 14px',textAlign:'right',fontSize:16,fontWeight:900,fontFamily:'monospace',color:ledgerRunning>=0?S.green:S.red}}>{fmt(ledgerRunning,sym)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ ميزان المراجعة ══ */}
        {tab==='trial'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>window.print()} style={{background:S.gold,color:S.navy,border:'none',padding:'8px 20px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🖨️ طباعة</button>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:800,color:S.white}}>⚖️ ميزان المراجعة</div>
                <div style={{fontSize:11,color:S.muted,marginTop:2}}>مشتق من القيود النشطة فقط — {trialBalance.length} حساب</div>
              </div>
            </div>
            {trialBalance.length===0?(
              <div style={{textAlign:'center',color:S.muted,padding:'60px 0'}}><div style={{fontSize:40,marginBottom:12}}>⚖️</div><div>أضف قيوداً لظهور ميزان المراجعة</div></div>
            ):(
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>
                    {['الكود','اسم الحساب','إجمالي المدين','إجمالي الدائن','صافي مدين','صافي دائن'].map(h=><th key={h} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {trialBalance.map((a,i)=>(
                      <tr key={a.id} style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:i%2===0?'transparent':S.card}}>
                        <td style={{...td_s,color:S.gold,fontWeight:700,fontFamily:'monospace'}}>{a.account_code}</td>
                        <td style={{...td_s,fontWeight:600}}>{a.account_name}</td>
                        <td style={{...td_s,color:S.green,fontFamily:'monospace'}}>{fmt(a.totalDebit,sym)}</td>
                        <td style={{...td_s,color:S.red,fontFamily:'monospace'}}>{fmt(a.totalCredit,sym)}</td>
                        <td style={{...td_s,color:a.netDebit>0?S.green:S.muted,fontFamily:'monospace',fontWeight:700}}>{a.netDebit>0?fmt(a.netDebit,sym):'—'}</td>
                        <td style={{...td_s,color:a.netCredit>0?S.red:S.muted,fontFamily:'monospace',fontWeight:700}}>{a.netCredit>0?fmt(a.netCredit,sym):'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${S.borderG}`,background:S.card2}}>
                      <td colSpan={4} style={{padding:'12px 14px',textAlign:'right',fontSize:12,fontWeight:700,color:S.gold2}}>الإجماليات</td>
                      <td style={{padding:'12px 14px',textAlign:'right',fontSize:14,fontWeight:900,fontFamily:'monospace',color:S.green}}>{fmt(trialTotalDebit,sym)}</td>
                      <td style={{padding:'12px 14px',textAlign:'right',fontSize:14,fontWeight:900,fontFamily:'monospace',color:S.red}}>{fmt(trialTotalCredit,sym)}</td>
                    </tr>
                    <tr style={{background:S.card2}}>
                      <td colSpan={6} style={{padding:'10px 14px',textAlign:'center',fontSize:11,color:Math.abs(trialTotalDebit-trialTotalCredit)<0.01?S.green:S.red,fontWeight:700}}>
                        {Math.abs(trialTotalDebit-trialTotalCredit)<0.01?'✅ الميزان متوازن — المدين = الدائن':'⚠️ الميزان غير متوازن — تحقق من القيود'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ كشف الحساب ══ */}
        {tab==='statement'&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:13,fontWeight:800,color:S.white,marginBottom:14,textAlign:'right'}}>📊 كشف الحساب (السندات النشطة فقط)</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>نوع الحساب</label>
                  <select value={stmtType} onChange={e=>{setStmtType(e.target.value as any);setStmtPartyId('');setStmtAccountId('')}} style={{...inp,cursor:'pointer'}}>
                    <option value="customer" style={{background:S.navy2}}>عميل</option>
                    <option value="supplier" style={{background:S.navy2}}>مورد</option>
                    <option value="account"  style={{background:S.navy2}}>حساب من دليل الحسابات</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>{stmtType==='customer'?'العميل':stmtType==='supplier'?'المورد':'الحساب'}</label>
                  {stmtType==='account'?(
                    <select value={stmtAccountId} onChange={e=>setStmtAccountId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {accounts.map(a=><option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name}</option>)}
                    </select>
                  ):stmtType==='customer'?(
                    <select value={stmtPartyId} onChange={e=>setStmtPartyId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {customers.map(c=><option key={c.id} value={c.id} style={{background:S.navy2}}>{c.full_name}{c.company_name?` — ${c.company_name}`:''}</option>)}
                    </select>
                  ):(
                    <select value={stmtPartyId} onChange={e=>setStmtPartyId(e.target.value)} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الفترة</label>
                  <div style={{display:'flex',gap:6}}>
                    <input type="date" value={stmtFrom} onChange={e=>setStmtFrom(e.target.value)} style={{...inp,flex:1,colorScheme:'dark' as any}}/>
                    <input type="date" value={stmtTo}   onChange={e=>setStmtTo(e.target.value)}   style={{...inp,flex:1,colorScheme:'dark' as any}}/>
                  </div>
                </div>
              </div>
              <button onClick={()=>window.print()} style={{background:S.gold,color:S.navy,border:'none',padding:'9px 24px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>🖨️ طباعة</button>
            </div>
            {stmtVouchers.length>0&&(
              <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:`1px solid ${S.border}`}}>{['التاريخ','رقم السند','البيان','مدين','دائن','الرصيد'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(()=>{let r=0;return stmtVouchers.map((v,i)=>{const isR=v.voucher_type==='receipt';const a=v.amount||0;r+=isR?a:-a;return(
                      <tr key={v.id} style={{borderTop:`1px solid rgba(255,255,255,0.04)`,background:i%2===0?'transparent':S.card}}>
                        <td style={{...td_s,color:S.muted}}>{v.voucher_date?new Date(v.voucher_date).toLocaleDateString('ar-EG'):'—'}</td>
                        <td style={{...td_s,color:S.gold,fontFamily:'monospace'}}>{v.voucher_number}</td>
                        <td style={td_s}>{v.description||v.party_name||'—'}</td>
                        <td style={{...td_s,color:S.green,fontFamily:'monospace',fontWeight:700}}>{isR?fmt(a,sym):'—'}</td>
                        <td style={{...td_s,color:S.red,fontFamily:'monospace',fontWeight:700}}>{!isR?fmt(a,sym):'—'}</td>
                        <td style={{...td_s,fontFamily:'monospace',fontWeight:800,color:r>=0?S.green:S.red}}>{fmt(r,sym)}</td>
                      </tr>
                    )})})()}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${S.borderG}`,background:S.card2}}>
                      <td colSpan={5} style={{padding:'12px 14px',textAlign:'right',fontSize:12,fontWeight:700,color:S.gold2}}>الرصيد النهائي</td>
                      <td style={{padding:'12px 14px',textAlign:'right',fontSize:16,fontWeight:900,fontFamily:'monospace',color:stmtTotal>=0?S.green:S.red}}>{fmt(stmtTotal,sym)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {(stmtPartyId||stmtAccountId)&&stmtVouchers.length===0&&(
              <div style={{textAlign:'center',color:S.muted,padding:'60px 0'}}><div style={{fontSize:40,marginBottom:12}}>📊</div><div>لا توجد حركات نشطة</div></div>
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
                  <span style={{fontSize:12,color:S.white,fontWeight:600}}>إجمالي الإيرادات</span>
                  <span style={{fontSize:16,fontWeight:800,color:S.blue,fontFamily:'monospace'}}>{fmt(totalIncome,sym)}</span>
                </div>
                {accounts.filter(a=>a.account_type==='income').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px'}}>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_name}</span>
                    <span style={{fontSize:13,color:S.green,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                  </div>
                ))}
                <div style={{height:1,background:S.border,margin:'4px 0'}}/>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(239,68,68,0.08)',borderRadius:8}}>
                  <span style={{fontSize:12,color:S.white,fontWeight:600}}>إجمالي المصروفات</span>
                  <span style={{fontSize:16,fontWeight:800,color:S.red,fontFamily:'monospace'}}>{fmt(totalExpenses,sym)}</span>
                </div>
                {accounts.filter(a=>a.account_type==='expense').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px'}}>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_name}</span>
                    <span style={{fontSize:13,color:S.red,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                  </div>
                ))}
                <div style={{height:2,background:S.border,margin:'4px 0'}}/>
                <div style={{display:'flex',justifyContent:'space-between',padding:'14px 16px',background:`${profitColor}18`,borderRadius:10,border:`1px solid ${profitColor}40`}}>
                  <span style={{fontSize:13,fontWeight:700,color:profitColor}}>{netProfit>0?'📈 صافي ربح':netProfit<0?'📉 صافي خسارة':'⚖️ تعادل'}</span>
                  <span style={{fontSize:20,fontWeight:900,color:profitColor,fontFamily:'monospace'}}>{netProfit>=0?'+':''}{fmt(netProfit,sym)}</span>
                </div>
              </div>
            </div>
            <div style={{background:S.navy2,border:`1px solid ${S.border}`,borderRadius:14,padding:20}}>
              <div style={{fontSize:14,fontWeight:800,color:S.white,marginBottom:16,textAlign:'right'}}>⚖️ الميزانية العمومية</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontSize:11,fontWeight:700,color:S.green,textAlign:'right',marginBottom:2}}>الأصول</div>
                {accounts.filter(a=>a.account_type==='asset').map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px',background:S.card,borderRadius:6}}>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_code} — {a.account_name}</span>
                    <span style={{fontSize:13,color:S.green,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(34,197,94,0.08)',borderRadius:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.white}}>إجمالي الأصول</span>
                  <span style={{fontSize:14,fontWeight:800,color:S.green,fontFamily:'monospace'}}>{fmt(totalAssets,sym)}</span>
                </div>
                <div style={{height:1,background:S.border,margin:'4px 0'}}/>
                <div style={{fontSize:11,fontWeight:700,color:S.amber,textAlign:'right',marginBottom:2}}>الخصوم وحقوق الملكية</div>
                {accounts.filter(a=>['liability','equity'].includes(a.account_type)).map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 12px',background:S.card,borderRadius:6}}>
                    <span style={{fontSize:11,color:S.muted}}>{a.account_code} — {a.account_name}</span>
                    <span style={{fontSize:13,color:S.amber,fontFamily:'monospace'}}>{fmt(a.balance||0,sym)}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'rgba(245,158,11,0.08)',borderRadius:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.white}}>إجمالي الخصوم</span>
                  <span style={{fontSize:14,fontWeight:800,color:S.amber,fontFamily:'monospace'}}>{fmt(totalLiabilities,sym)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:'rgba(139,92,246,0.08)',borderRadius:8,border:`1px solid rgba(139,92,246,0.2)`}}>
                  <span style={{fontSize:12,fontWeight:700,color:S.purple}}>حقوق الملكية (الأصول − الخصوم)</span>
                  <span style={{fontSize:14,fontWeight:800,color:S.purple,fontFamily:'monospace'}}>{fmt(totalEquity,sym)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:S.card2,borderRadius:8,border:`1px solid ${S.borderG}`}}>
                  <span style={{fontSize:12,fontWeight:800,color:S.gold2}}>الخصوم + حقوق الملكية</span>
                  <span style={{fontSize:15,fontWeight:900,color:Math.abs(totalLiabilities+totalEquity-totalAssets)<0.01?S.green:S.red,fontFamily:'monospace'}}>{fmt(totalLiabilities+totalEquity,sym)}</span>
                </div>
                <div style={{textAlign:'center',fontSize:10,color:Math.abs(totalLiabilities+totalEquity-totalAssets)<0.01?S.green:S.red,fontWeight:700,padding:'4px 0'}}>
                  {Math.abs(totalLiabilities+totalEquity-totalAssets)<0.01?'✅ الميزانية متوازنة':'⚠️ الميزانية غير متوازنة'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {printVch&&<PrintModal v={printVch} sym={sym} onClose={()=>setPrintVch(null)}/>}

      {/* تعديل سند */}
      {editVch&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:500,borderRadius:18,padding:26,border:`1px solid ${S.borderG}`,direction:'rtl'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <button onClick={()=>setEditVch(null)} style={{background:'none',border:'none',color:S.muted,fontSize:18,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:15,fontWeight:800,color:S.gold2}}>✏️ تعديل السند — {editVch.voucher_number}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[{l:'التاريخ',k:'voucher_date',t:'date'},{l:'الطرف الآخر',k:'party_name',t:'text'},{l:'المبلغ',k:'amount',t:'number'},{l:'البيان',k:'description',t:'text'}]
                .map(f=>(
                <div key={f.k}>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>{f.l}</label>
                  <input type={f.t} value={(editVch as any)[f.k]||''} onChange={e=>setEditVch({...editVch,[f.k]:e.target.value})} style={{...inp,colorScheme:f.t==='date'?'dark' as any:undefined}}/>
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>طريقة الدفع</label>
                <select value={editVch.payment_method} onChange={e=>setEditVch({...editVch,payment_method:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m} style={{background:S.navy2}}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:18}}>
              <button onClick={()=>setEditVch(null)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleEditVoucher} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':'💾 حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إضافة حساب */}
      {showAccForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:520,borderRadius:20,padding:28,border:`1px solid ${S.borderG}`,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <button onClick={()=>setShowAccForm(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:16,fontWeight:800,color:S.gold2}}>📁 إضافة حساب جديد</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {[{l:'كود الحساب *',k:'account_code',p:'مثال: 1101'},{l:'اسم الحساب *',k:'account_name',p:'اسم الحساب'}].map(f=>(
                <div key={f.k}>
                  <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>{f.l}</label>
                  <input type="text" placeholder={f.p} value={(accForm as any)[f.k]} onChange={e=>setAccForm({...accForm,[f.k]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>نوع الحساب</label>
                <select value={accForm.account_type} onChange={e=>setAccForm({...accForm,account_type:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {Object.entries(ACCOUNT_TYPES).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الرصيد الافتتاحي ({sym})</label>
                <input type="number" placeholder="0.00" value={accForm.opening_balance} onChange={e=>setAccForm({...accForm,opening_balance:e.target.value})} style={inp}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الوصف</label>
                <input type="text" placeholder="وصف مختصر..." value={accForm.description} onChange={e=>setAccForm({...accForm,description:e.target.value})} style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:20}}>
              <button onClick={()=>setShowAccForm(false)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleSaveAccount} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':'💾 حفظ الحساب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إضافة سند */}
      {showVchForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(8px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:580,borderRadius:20,padding:28,border:`1px solid ${S.borderG}`,maxHeight:'90vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <button onClick={()=>setShowVchForm(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:16,fontWeight:800,color:S.gold2}}>📋 إضافة سند مالي</div>
            </div>
            <div style={{background:S.gold3,border:`1px solid ${S.borderG}`,borderRadius:10,padding:'10px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:900,color:S.gold2,fontFamily:'monospace'}}>{vchForm.voucher_number}</span>
              <span style={{fontSize:10,color:S.muted}}>رقم السند (تلقائي)</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>نوع السند</label>
                <select value={vchForm.voucher_type} onChange={e=>{const t=e.target.value;setVchForm(p=>({...p,voucher_type:t,voucher_number:getNext(t,vouchers)}))}} style={{...inp,cursor:'pointer'}}>
                  {Object.entries(VOUCHER_TYPES).map(([k,v])=><option key={k} value={k} style={{background:S.navy2}}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>التاريخ</label>
                <input type="date" value={vchForm.voucher_date} onChange={e=>setVchForm({...vchForm,voucher_date:e.target.value})} style={{...inp,colorScheme:'dark' as any}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>العملة</label>
                <select value={vchForm.currency} onChange={e=>setVchForm({...vchForm,currency:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{CURRENCY_SYMBOLS[c.value]||c.value} {c.label}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الحساب المتأثر *</label>
                <select value={vchForm.account_id} onChange={e=>setVchForm({...vchForm,account_id:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  <option value="">اختر الحساب...</option>
                  {accounts.map(a=>{const aSym=CURRENCY_SYMBOLS[a.currency]||sym;return<option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name} ({fmt(a.balance||0,aSym)})</option>})}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>الطرف الآخر</label>
                <select value={vchForm.party_type} onChange={e=>setVchForm({...vchForm,party_type:e.target.value,party_id:'',party_name:''})} style={{...inp,cursor:'pointer'}}>
                  <option value="customer" style={{background:S.navy2}}>عميل</option>
                  <option value="supplier" style={{background:S.navy2}}>مورد</option>
                  <option value="other"    style={{background:S.navy2}}>طرف آخر</option>
                </select>
              </div>
              <div>
                {vchForm.party_type==='customer'?(
                  <>
                    <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اختر العميل</label>
                    <select value={vchForm.party_id||''} onChange={e=>{const id=e.target.value;const c=customers.find(x=>String(x.id)===id);setVchForm({...vchForm,party_id:id,party_name:c?.full_name||c?.company_name||''})}} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {customers.map(c=><option key={c.id} value={c.id} style={{background:S.navy2}}>{c.full_name}{c.company_name?` — ${c.company_name}`:''}</option>)}
                    </select>
                  </>
                ):vchForm.party_type==='supplier'?(
                  <>
                    <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اختر المورد</label>
                    <select value={vchForm.party_id||''} onChange={e=>{const id=e.target.value;const s=suppliers.find(x=>String(x.id)===id);setVchForm({...vchForm,party_id:id,party_name:s?.company_name||''})}} style={{...inp,cursor:'pointer'}}>
                      <option value="">اختر...</option>
                      {suppliers.map(s=><option key={s.id} value={s.id} style={{background:S.navy2}}>{s.company_name}</option>)}
                    </select>
                  </>
                ):(
                  <><label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>اسم الطرف</label>
                  <input type="text" placeholder="اسم الجهة أو الشخص" value={vchForm.party_name} onChange={e=>setVchForm({...vchForm,party_name:e.target.value})} style={inp}/></>
                )}
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:vchForm.voucher_type==='receipt'?S.green:S.red,fontWeight:700,marginBottom:6,textAlign:'right'}}>المبلغ ({CURRENCY_SYMBOLS[vchForm.currency]||vchForm.currency}) *</label>
                <input type="number" placeholder="0.00" value={vchForm.amount} onChange={e=>setVchForm({...vchForm,amount:e.target.value})}
                  style={{...inp,fontSize:16,fontWeight:700,color:vchForm.voucher_type==='receipt'?S.green:S.red,border:`1px solid ${vchForm.voucher_type==='receipt'?S.green:S.red}44`}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>طريقة الدفع</label>
                <select value={vchForm.payment_method} onChange={e=>setVchForm({...vchForm,payment_method:e.target.value})} style={{...inp,cursor:'pointer'}}>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m} style={{background:S.navy2}}>{m}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>البيان / الوصف</label>
                <input type="text" placeholder="وصف العملية المالية..." value={vchForm.description} onChange={e=>setVchForm({...vchForm,description:e.target.value})} style={inp}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginTop:20}}>
              <button onClick={()=>setShowVchForm(false)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:11,borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
              <button onClick={handleSaveVoucher} disabled={saving} style={{background:saving?S.muted:S.gold,color:S.navy,border:'none',padding:11,borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                {saving?'⏳ جاري الحفظ...':`💾 حفظ ${VOUCHER_TYPES[vchForm.voucher_type]?.label||'السند'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Modal القيد اليدوي المزدوج ════════ */}
      {showJournalForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(10px)',padding:16}}>
          <div style={{background:S.navy2,width:'100%',maxWidth:680,borderRadius:20,padding:28,border:`1px solid ${S.borderG}`,maxHeight:'92vh',overflowY:'auto',direction:'rtl'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <button onClick={()=>setShowJournalForm(false)} style={{background:'none',border:'none',color:S.muted,fontSize:20,cursor:'pointer'}}>✕</button>
              <div style={{fontSize:16,fontWeight:800,color:S.gold2}}>📒 قيد يومية — نظام القيد المزدوج</div>
            </div>

            {/* بيانات القيد */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>التاريخ</label>
                <input type="date" value={jDate} onChange={e=>setJDate(e.target.value)} style={{...inp,colorScheme:'dark' as any}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>العملة</label>
                <select value={jCurrency} onChange={e=>setJCurrency(e.target.value)} style={{...inp,cursor:'pointer'}}>
                  {CURRENCIES.map(c=><option key={c.id} value={c.value} style={{background:S.navy2}}>{CURRENCY_SYMBOLS[c.value]||c.value} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:S.gold,fontWeight:700,marginBottom:6,textAlign:'right'}}>البيان</label>
                <input value={jDesc} onChange={e=>setJDesc(e.target.value)} style={inp} placeholder="بيان القيد..."/>
              </div>
            </div>

            {/* جدول القيد المزدوج */}
            <div style={{background:S.navy3,borderRadius:12,overflow:'hidden',border:`1px solid ${S.border}`,marginBottom:14}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'rgba(201,168,76,0.08)'}}>
                    {['الحساب','مدين (Debit)','دائن (Credit)',''].map(h=><th key={h} style={{...th,padding:'10px 12px'}}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {jLines.map((line,i)=>(
                    <tr key={i} style={{borderTop:`1px solid ${S.border}`}}>
                      <td style={{padding:'8px 10px'}}>
                        <select value={line.account_id} onChange={e=>{const n=[...jLines];n[i]={...n[i],account_id:e.target.value};setJLines(n)}} style={{...inp,fontSize:12}}>
                          <option value="">اختر الحساب...</option>
                          {accounts.map(a=><option key={a.id} value={a.id} style={{background:S.navy2}}>{a.account_code} — {a.account_name}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <input type="number" placeholder="0.00" value={line.debit}
                          onChange={e=>{const n=[...jLines];n[i]={...n[i],debit:e.target.value,credit:e.target.value?'':n[i].credit};setJLines(n)}}
                          style={{...inp,fontSize:13,fontWeight:700,color:S.green,border:`1px solid ${S.green}30`,textAlign:'left',direction:'ltr'}}/>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <input type="number" placeholder="0.00" value={line.credit}
                          onChange={e=>{const n=[...jLines];n[i]={...n[i],credit:e.target.value,debit:e.target.value?'':n[i].debit};setJLines(n)}}
                          style={{...inp,fontSize:13,fontWeight:700,color:S.red,border:`1px solid ${S.red}30`,textAlign:'left',direction:'ltr'}}/>
                      </td>
                      <td style={{padding:'8px 8px',textAlign:'center'}}>
                        {jLines.length>2&&<button onClick={()=>setJLines(jLines.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:S.red,cursor:'pointer',fontSize:16}}>✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'rgba(255,255,255,0.03)',borderTop:`2px solid ${S.borderG}`}}>
                    <td style={{padding:'10px 12px',textAlign:'right',fontSize:11,color:S.muted,fontWeight:700}}>الإجماليات</td>
                    <td style={{padding:'10px 12px',textAlign:'right',fontSize:14,fontWeight:900,color:S.green,fontFamily:'monospace'}}>{fmt(jTotalDebit,CURRENCY_SYMBOLS[jCurrency]||jCurrency)}</td>
                    <td style={{padding:'10px 12px',textAlign:'right',fontSize:14,fontWeight:900,color:S.red,fontFamily:'monospace'}}>{fmt(jTotalCredit,CURRENCY_SYMBOLS[jCurrency]||jCurrency)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* مؤشر التوازن */}
            <div style={{padding:'10px 14px',borderRadius:10,marginBottom:16,textAlign:'center',fontSize:12,fontWeight:700,
              background:jTotalDebit===0&&jTotalCredit===0?S.card:jBalanced?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
              color:jTotalDebit===0&&jTotalCredit===0?S.muted:jBalanced?S.green:S.red,
              border:`1px solid ${jTotalDebit===0?S.border:jBalanced?S.green+'40':S.red+'40'}`}}>
              {jTotalDebit===0&&jTotalCredit===0?'أدخل المبالغ في الأعلى':
               jBalanced?`✅ القيد متوازن — المدين = الدائن = ${fmt(jTotalDebit,CURRENCY_SYMBOLS[jCurrency]||jCurrency)}`:
               `⚠️ غير متوازن — الفرق: ${fmt(Math.abs(jTotalDebit-jTotalCredit),CURRENCY_SYMBOLS[jCurrency]||jCurrency)}`}
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>setJLines([...jLines,{account_id:'',debit:'',credit:''}])}
                style={{background:S.card2,color:S.muted,border:`1px solid ${S.border}`,padding:'9px 18px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>
                + إضافة سطر
              </button>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShowJournalForm(false)} style={{background:S.card2,color:S.white,border:`1px solid ${S.border}`,padding:'10px 20px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Tajawal, sans-serif'}}>إلغاء</button>
                <button onClick={handleSaveJournal} disabled={saving||!jBalanced||jTotalDebit===0}
                  style={{background:saving||!jBalanced||jTotalDebit===0?S.muted:S.gold,color:S.navy,border:'none',padding:'10px 24px',borderRadius:8,fontSize:13,fontWeight:700,cursor:saving||!jBalanced||jTotalDebit===0?'not-allowed':'pointer',fontFamily:'Tajawal, sans-serif'}}>
                  {saving?'⏳ جاري الحفظ...':'💾 حفظ القيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print{body *{visibility:hidden}#print-area,#print-area *{visibility:visible}#print-area{position:absolute;left:0;top:0;width:100%}}
      `}</style>
    </div>
  )
}
