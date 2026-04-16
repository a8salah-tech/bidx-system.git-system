'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { CURRENCIES } from '../../components/options'
import { useRef } from 'react'

interface Supplier {
  id: string; created_at: string; supplier_number: number; company_name: string
  country: string; city: string; status: string; rating: number; completion_pct: number
  contact_name: string; contact_whatsapp: string; contact_email: string; contact_phone: string
  annual_sales: string; notes: string; total_deals: number; total_amount: number
  main_products: string; last_contact_date: string; last_contact_method: string
  website: string; registration_number: string; certifications: string
  quality_rating: number; delivery_rating: number; comm_rating: number
  price_rating: number; flex_rating: number; user_id: string; suspended_reason: string
}

function timeAgo(date: string) {
  if (!date) return null
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'منذ يوم'
  if (diff < 7) return `منذ ${diff} أيام`
  if (diff < 30) return `منذ ${Math.floor(diff / 7)} أسابيع`
  return `منذ ${Math.floor(diff / 30)} أشهر`
}

function formatSupNum(n: number) {
  return `SUP-${String(n).padStart(5, '0')}`
}

const S = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#152A52',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.12)',goldB:'rgba(201,168,76,0.22)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.08)',
  green:'#22C55E',greenB:'rgba(34,197,94,0.12)',
  red:'#EF4444',redB:'rgba(239,68,68,0.12)',
  blue:'#3B82F6',blueB:'rgba(59,130,246,0.12)',
  amber:'#F59E0B',amberB:'rgba(245,158,11,0.12)',
  purple:'#8B5CF6',purpleB:'rgba(139,92,246,0.12)',
  card:'rgba(255,255,255,0.04)',card2:'rgba(255,255,255,0.08)',
}

// ===== مكون أرشيف سجل التواصل =====
function ContactLogArchive({ supplier, supplierId, setSupplier }: { supplier: any, supplierId: string, setSupplier: any }) {
  const [logs, setLogs] = useState<any[]>([])
  const [showAddLog, setShowAddLog] = useState(false)
  const [savingLog, setSavingLog] = useState(false)
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    method: 'واتساب',
    notes: '',
  })

  useEffect(() => {
    // جلب سجل التواصل من supplier_notes مع فلتر نوع = contact_log
    supabase.from('supplier_notes')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('note_type', 'contact_log')
      .order('created_at', { ascending: false })
      .then(({ data }) => setLogs(data || []))
  }, [supplierId])

  async function addLog() {
    if (!logForm.date || !logForm.method) { alert('يرجى إدخال التاريخ والوسيلة'); return }
    setSavingLog(true)
    const { data: { user } } = await supabase.auth.getUser()
    // حفظ سجل التواصل
    const { data: newLog, error } = await supabase.from('supplier_notes').insert([{
      supplier_id: supplierId,
      note: logForm.notes || '—',
      note_type: 'contact_log',   // marker للتمييز
      user_id: user?.id,
      created_by: user?.id,
      created_at: new Date(logForm.date).toISOString(),
    }]).select().single()
    if (!error && newLog) {
      setLogs([{ ...newLog, meta_method: logForm.method }, ...logs])
      // تحديث آخر تواصل في جدول suppliers
      await supabase.from('suppliers').update({
        last_contact_date: new Date(logForm.date).toISOString(),
        last_contact_method: logForm.method,
      }).eq('id', supplierId)
      setSupplier((prev: any) => ({ ...prev, last_contact_date: new Date(logForm.date).toISOString(), last_contact_method: logForm.method }))
    }
    setShowAddLog(false)
    setLogForm({ date: new Date().toISOString().split('T')[0], method: 'واتساب', notes: '' })
    setSavingLog(false)
  }

  const methodIcons: Record<string, string> = { واتساب: '📱', إيميل: '✉️', مكالمة: '📞', اجتماع: '🤝', زيارة: '🏢' }

  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
      {/* هيدر + آخر تواصل بارز */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={() => setShowAddLog(!showAddLog)}
          style={{ background: S.gold, color: S.navy, border: 'none', padding: '6px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          + تسجيل تواصل
        </button>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.gold }}>📋 سجل التواصل</div>
      </div>

      {/* آخر تواصل — بارز ومميز */}
      {supplier?.last_contact_date ? (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: S.green, fontWeight: 700 }}>
            {methodIcons[supplier.last_contact_method] || '📋'} {supplier.last_contact_method || '—'}
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: S.green }}>آخر تواصل: {timeAgo(supplier.last_contact_date)}</div>
            <div style={{ fontSize: '10px', color: S.muted }}>{new Date(supplier.last_contact_date).toLocaleDateString('ar-EG')}</div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', textAlign: 'center', fontSize: '12px', color: S.red }}>
          ⚠️ لم يتم التواصل بعد مع هذا المورد
        </div>
      )}

      {/* فورم إضافة سجل */}
      {showAddLog && (
        <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.gold, fontWeight: 700, marginBottom: '4px' }}>التاريخ</label>
              <input type="date" value={logForm.date} onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))}
                style={{ width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' as any, boxSizing: 'border-box' as any }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>وسيلة التواصل</label>
              <select value={logForm.method} onChange={e => setLogForm(p => ({ ...p, method: e.target.value }))}
                style={{ width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', direction: 'rtl' }}>
                {['واتساب', 'إيميل', 'مكالمة', 'اجتماع', 'زيارة'].map(m => <option key={m} value={m} style={{ background: S.navy2 }}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>ملاحظات التواصل</label>
            <textarea value={logForm.notes} onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="ماذا جرى في هذا التواصل؟"
              style={{ width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any, resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAddLog(false)} style={{ flex: 1, background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '7px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            <button onClick={addLog} disabled={savingLog}
              style={{ flex: 2, background: savingLog ? S.muted : S.gold, color: S.navy, border: 'none', padding: '7px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {savingLog ? '⏳...' : '✅ حفظ التواصل'}
            </button>
          </div>
        </div>
      )}

      {/* الأرشيف */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: S.muted, padding: '16px 0', fontSize: '12px' }}>لا يوجد سجل تواصل بعد</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
          {logs.map((l, i) => (
            <div key={l.id || i} style={{ background: S.card2, borderRadius: '9px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '10px', color: S.muted, flexShrink: 0 }}>{new Date(l.created_at).toLocaleDateString('ar-EG')}</div>
              <div style={{ textAlign: 'right', flex: 1, marginRight: '10px' }}>
                <div style={{ fontSize: '11px', color: S.white, lineHeight: '1.6' }}>{l.note !== '—' ? l.note : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== مكون جهات التواصل والوثائق =====
function ContactTab({ supplier, supplierId, setSupplier }: { supplier: any, supplierId: string, setSupplier: any }) {  // 1. حالات إدارة الملفات والرفع
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  // أضف هذا السطر مع بقية الـ states في الأعلى
const [ratings, setRatings] = useState({
  quality: 0,
  delivery: 0,
  communication: 0,
  price: 0,
  flexibility: 0
});
  
  // دمج تفاصيل المستند مع حقل الاسم المخصص وتاريخ اليوم تلقائياً
  const [docDetails, setDocDetails] = useState({ 
    type: '', 
    exp: new Date().toISOString().split('T')[0], 
    customName: '' 
  })

  // 2. حالات البيانات (المستندات وجهات الاتصال)
  const [docs, setDocs] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])

  // 3. حالات التحكم في النماذج (جهات الاتصال)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ 
    name: '', 
    role: '', 
    email: '', 
    phone: '', 
    whatsapp: '', 
    notes: '' 
  })

  // 4. حالات البيانات الرسمية للمورد وإمكانية التعديل
  const [editOfficial, setEditOfficial] = useState(false)
  const [officialData, setOfficialData] = useState({
    contact_email: supplier?.contact_email || '',
    contact_whatsapp: supplier?.contact_whatsapp || '',
    website: supplier?.website || '',
    last_contact_date: supplier?.last_contact_date || '',
    last_contact_method: supplier?.last_contact_method || '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(`contacts_${supplierId}`)
    if (saved) {
      setContacts(JSON.parse(saved))
    } else {
      const defaults: any[] = []
      if (supplier.contact_name) {
        defaults.push({ id: '1', name: supplier.contact_name, role: 'مسؤول التصدير', email: supplier.contact_email || '', phone: '', whatsapp: supplier.contact_whatsapp || '', notes: '' })
      }
      setContacts(defaults)
    }
  }, [supplierId])

  const fetchDocs = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_documents')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
      if (!error) setDocs(data || [])
    } catch (err) {
      console.error('Fetch Error:', err)
    }
  }
useEffect(() => {
  async function fetchSupplierRating() {
    const { data } = await supabase
       .from('suppliers')
       .select('quality_rating, delivery_rating, comm_rating, price_rating, flex_rating')
       .eq('id', supplierId)
       .single();

    if (data) {
      // هنا نقوم بتحديث الـ State لكي تظهر النجوم والارقام فوراً
      setRatings({
        quality: data.quality_rating || 0,
        delivery: data.delivery_rating || 0,
        communication: data.comm_rating || 0,
        price: data.price_rating || 0,
        flexibility: data.flex_rating || 0
      });
      // إذا كان لديك State خاص بالمتوسط العام (avg) سيتم تحديثه تلقائياً
    }
  }

  if (supplierId) {
    fetchSupplierRating();
  }
}, [supplierId]);

  useEffect(() => { fetchDocs() }, [supplierId])

  const handleFinalUpload = async () => {
    if (!fileToUpload || !docDetails.type) {
      alert('برجاء اختيار النوع والملف')
      return
    }
    setUploading(true)
    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const filePath = `${supplierId}/${Date.now()}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('supplier-docs').upload(filePath, fileToUpload)
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('supplier_documents').insert([{
        supplier_id: supplierId,
        doc_type: docDetails.type,
        file_path: filePath,
        expiry_date: docDetails.exp || null,
        doc_name: fileToUpload.name,
      }])
      if (dbErr) throw dbErr
      alert('تم الحفظ بنجاح ✅')
      setSelectedDoc(null)
      setFileToUpload(null)
      await fetchDocs()
    } catch (err: any) {
      alert('حدث خطأ أثناء الرفع: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function save(list: any[]) {
    setContacts(list)
    localStorage.setItem(`contacts_${supplierId}`, JSON.stringify(list))
  }

  function addContact() {
    if (!form.name) return
    save([...contacts, { ...form, id: Date.now().toString() }])
    setForm({ name: '', role: '', email: '', phone: '', whatsapp: '', notes: '' })
    setShowForm(false)
  }

  function deleteContact(id: string) {
    if (window.confirm('هل تريد حذف جهة التواصل هذه؟')) {
      save(contacts.filter(c => c.id !== id))
    }
  }

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const inp: React.CSSProperties = {
    width: '100%', background: S.navy, border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: S.white,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
  }

  return (
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* FIX 2: سجل التواصل — في أعلى القسم، ظاهر */}
      <ContactLogArchive supplier={supplier} supplierId={supplierId} setSupplier={setSupplier} />

      {/* جهات التواصل */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: S.gold, border: 'none', color: S.navy, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
          <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, letterSpacing: '0.8px' }}>جهات التواصل</div>
        </div>

        {showForm && (
          <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: S.gold, marginBottom: '14px', textAlign: 'right' }}>إضافة جهة تواصل جديدة</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: 'الاسم *', key: 'name', placeholder: 'اسم الشخص' },
                { label: 'الوظيفة', key: 'role', placeholder: 'مثال: مدير التصدير' },
                { label: 'الإيميل', key: 'email', placeholder: 'email@company.com' },
                { label: 'رقم الموبايل', key: 'phone', placeholder: '+62 8xx xxx xxxx' },
                { label: 'واتساب', key: 'whatsapp', placeholder: '+62 8xx xxx xxxx' },
                { label: 'ملاحظات', key: 'notes', placeholder: 'أي ملاحظات...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px', textAlign: 'right' }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
              <button onClick={addContact} style={{ background: S.gold, color: S.navy, border: 'none', padding: '7px 20px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>حفظ</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '7px 16px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: '13px' }}>لا توجد جهات تواصل — اضغط + لإضافة</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contacts.map(c => (
              <div key={c.id} style={{ background: S.card2, borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexDirection: 'row-reverse' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <button onClick={() => deleteContact(c.id)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{c.name}</span>
                      {c.role && <span style={{ fontSize: '10px', color: S.muted, marginRight: '8px' }}>{c.role}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {c.whatsapp && <div style={{ fontSize: '11px', color: S.green }}>📱 {c.whatsapp}</div>}
                    {c.phone && <div style={{ fontSize: '11px', color: S.muted }}>☎️ {c.phone}</div>}
                    {c.email && <div style={{ fontSize: '11px', color: '#93C5FD' }}>✉️ {c.email}</div>}
                  </div>
                  {c.notes && <div style={{ fontSize: '11px', color: S.muted, marginTop: '6px', fontStyle: 'italic' }}>{c.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIX 7: بيانات التواصل الرسمية — تصميم محسّن */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: 'rgba(201,168,76,0.06)', borderBottom: `1px solid ${S.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={async () => {
              if (editOfficial) {
                await supabase.from('suppliers').update({
                  contact_email: officialData.contact_email,
                  contact_whatsapp: officialData.contact_whatsapp,
                  website: officialData.website,
                  last_contact_date: officialData.last_contact_date || null,
                  last_contact_method: officialData.last_contact_method,
                }).eq('id', supplierId)
              } else {
                setOfficialData({
                  contact_email: supplier.contact_email || '',
                  contact_whatsapp: supplier.contact_whatsapp || '',
                  website: supplier.website || '',
                  last_contact_date: supplier.last_contact_date || '',
                  last_contact_method: supplier.last_contact_method || '',
                })
              }
              setEditOfficial(!editOfficial)
            }}
            style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '7px', border: `1px solid ${editOfficial ? S.gold : S.border}`, background: editOfficial ? S.gold : 'transparent', color: editOfficial ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {editOfficial ? '💾 حفظ' : '✏️ تعديل'}
          </button>
          <div style={{ fontSize: '12px', fontWeight: 700, color: S.gold }}>🔗 بيانات التواصل الرسمية</div>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* الإيميل */}
            <div style={{ background: S.card2, borderRadius: '10px', padding: '12px 14px', textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: S.muted, fontWeight: 700, marginBottom: '5px', letterSpacing: '0.5px' }}>✉️ الإيميل الرسمي</div>
              {editOfficial ? (
                <input type="email" value={officialData.contact_email} onChange={e => setOfficialData({ ...officialData, contact_email: e.target.value })}
                  style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
              ) : (
                <a href={`mailto:${supplier.contact_email}`} style={{ fontSize: '13px', fontWeight: 600, color: '#93C5FD', textDecoration: 'none' }}>
                  {supplier.contact_email || '—'}
                </a>
              )}
            </div>
            {/* واتساب */}
            <div style={{ background: S.card2, borderRadius: '10px', padding: '12px 14px', textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: S.muted, fontWeight: 700, marginBottom: '5px', letterSpacing: '0.5px' }}>📱 واتساب</div>
              {editOfficial ? (
                <input type="text" value={officialData.contact_whatsapp} onChange={e => setOfficialData({ ...officialData, contact_whatsapp: e.target.value })}
                  style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
              ) : (
                <a href={`https://wa.me/${(supplier.contact_whatsapp || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: S.green, textDecoration: 'none' }}>
                  {supplier.contact_whatsapp || '—'}
                </a>
              )}
            </div>
            {/* الموقع */}
            <div style={{ background: S.card2, borderRadius: '10px', padding: '12px 14px', textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: S.muted, fontWeight: 700, marginBottom: '5px', letterSpacing: '0.5px' }}>🌐 الموقع الإلكتروني</div>
              {editOfficial ? (
                <input type="text" value={officialData.website} onChange={e => setOfficialData({ ...officialData, website: e.target.value })}
                  style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
              ) : (
                supplier.website ? (
                  <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: S.gold, textDecoration: 'none' }}>
                    🔗 {supplier.website}
                  </a>
                ) : <div style={{ fontSize: '13px', color: S.muted }}>—</div>
              )}
            </div>
            {/* آخر تواصل — حقل التعديل فقط */}
  
          </div>
        </div>
      </div>

      {/* مودال رفع الملف */}
      {selectedDoc !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }}
                style={{ background: 'none', border: 'none', color: S.muted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '14px', fontWeight: 700, color: S.white }}>رفع مستند جديد</div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '6px' }}>نوع المستند *</label>
              <select value={docDetails.type} onChange={e => setDocDetails({ ...docDetails, type: e.target.value })}
                style={{ width: '100%', background: S.navy, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', direction: 'rtl' }}>
                <option value="">اختر نوع المستند</option>
                <option value="عقد تجاري">عقد تجاري</option>
                <option value="شهادة حلال">شهادة حلال</option>
                <option value="شهادة ISO">شهادة ISO</option>
                <option value="شهادة RSPO">شهادة RSPO</option>
                <option value="فاتورة">فاتورة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '6px' }}>تاريخ الانتهاء (اختياري)</label>
              <input type="date" value={docDetails.exp} onChange={e => setDocDetails({ ...docDetails, exp: e.target.value })}
                style={{ width: '100%', background: S.navy, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' as any, boxSizing: 'border-box' as any }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '6px' }}>الملف *</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
                style={{ width: '100%', background: S.navy, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: S.muted, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as any }} />
              {fileToUpload && (
                <div style={{ fontSize: '11px', color: S.green, marginTop: '6px' }}>✓ {fileToUpload.name}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
              <button onClick={handleFinalUpload} disabled={uploading}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', background: uploading ? S.muted : S.gold, border: 'none', color: S.navy, fontSize: '13px', fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {uploading ? '⏳ جاري الرفع...' : '📤 رفع المستند'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== مكون الوثائق =====
function DocsTab({ supplierId }: { supplierId: string }) {
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
const [docDetails, setDocDetails] = useState<{ type: string; exp: string; customName: string }>({ 
    type: '', 
    exp: new Date().toISOString().split('T')[0], 
    customName: '' 
  })
    const [docs, setDocs] = useState<any[]>([])

  const fetchDocs = async () => {
    const { data, error } = await supabase
      .from('supplier_documents')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
    if (!error) setDocs(data || [])
  }

  useEffect(() => { fetchDocs() }, [supplierId])

 const handleFinalUpload = async () => {
    // التأكد من اختيار النوع، وإذا اختار "أخرى" يجب التأكد من كتابة اسم مخصص
    const finalDocName = docDetails.type === 'أخرى' ? docDetails.customName : docDetails.type;

    if (!fileToUpload || !finalDocName) { 
      alert('برجاء اختيار النوع وإدخال اسم المستند'); 
      return; 
    }

    setUploading(true)
    try {
      const fileExt = fileToUpload.name.split('.').pop()
      // إنشاء مسار فريد للملف في التخزين (Storage)
      const filePath = `${supplierId}/${Date.now()}.${fileExt}`
      
      const { error: upErr } = await supabase.storage.from('supplier-docs').upload(filePath, fileToUpload)
      if (upErr) throw upErr

      // حفظ البيانات في جدول قاعدة البيانات
      const { error: dbErr } = await supabase.from('supplier_documents').insert([{
        supplier_id: supplierId, 
        doc_type: docDetails.type, 
        file_path: filePath,
        expiry_date: docDetails.exp || null, 
        doc_name: finalDocName, // هنا التعديل: سيتم حفظ الاسم الذي اخترته بدلاً من اسم الصورة
      }])

      if (dbErr) throw dbErr

      alert('تم حفظ المستند بنجاح ✅')
      setSelectedDoc(null)
      setFileToUpload(null)
      setDocDetails({ type: '', exp: new Date().toISOString().split('T')[0], customName: '' }) // إعادة تهيئة الحقول
      await fetchDocs()
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
<div style={{ display: 'flex', flexDirection: 'column', gap: '24px', direction: 'rtl', fontFamily: 'inherit' }}>
  
  {/* الجزء العلوي: بطاقة الدعوة للأرشفة */}
  <div style={{ 
    background: `linear-gradient(135deg, ${S.navy2} 0%, ${S.card} 100%)`, 
    border: `1px solid ${S.border}`, 
    borderRadius: '20px', 
    padding: '30px', 
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px', opacity: 0.05 }}>📂</div>
    <div style={{ fontSize: '14px', color: S.muted, marginBottom: '16px', fontWeight: 500 }}>مركز إدارة مستندات الموردين الذكي</div>
    <button onClick={() => {
      setSelectedDoc({});
      // ضبط تاريخ اليوم تلقائياً عند فتح النافذة
      setDocDetails({ ...docDetails, exp: new Date().toISOString().split('T')[0], type: '', customName: '' });
    }}
 style={{ 
            background: S.gold, 
            color: S.navy, 
            border: 'none', 
            padding: '14px 32px', 
            borderRadius: '12px', 
            fontSize: '14px', 
            fontWeight: 800, 
            cursor: 'pointer', 
            boxShadow: `0 4px 20px ${S.gold}44`,
            transition: 'all 0.3s',
            fontFamily: "'Tajawal', sans-serif" // تأكد من وجود الفاصلة هنا إذا أضفت سطراً بعدها
          }}>
          أرشفة مستند جديد 📤
        </button>
      </div> {/* هذا القوس يغلق حاوية البطاقة (div) */}

  {/* قائمة المستندات المؤرشفة */}
  <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
    <div style={{ 
      padding: '18px 24px', 
      borderBottom: `1px solid ${S.border}`, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: 'rgba(255,255,255,0.03)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: S.gold }}></div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: S.white }}>الأرشيف الرقمي</div>
      </div>
      <span style={{ fontSize: '11px', color: S.gold, background: 'rgba(201,168,76,0.1)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
        {docs.length} ملفات مؤرشفة
      </span>
    </div>

    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {docs.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: S.muted, fontSize: '14px', border: `1px dashed ${S.border}`, borderRadius: '15px' }}>
          لا توجد وثائق مؤرشفة حالياً في 
        </div>
      ) : (
        docs.map((doc: any) => (
          
<div key={doc.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px', 
            background: S.card2, 
            borderRadius: '15px', 
            border: `1px solid rgba(255,255,255,0.03)`,
            transition: 'transform 0.2s',
            direction: 'rtl' // أضفنا هذا لضمان أن اليمين هو البداية
          }}>
            {/* 1. النصوص أصبحت أولاً لتظهر في اليمين */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: S.white, marginBottom: '4px' }}>{doc.doc_name}</div>
<div style={{ 
  fontSize: '11px', 
  color: doc.expiry_date ? S.amber : S.green, 
  display: 'flex', 
  alignItems: 'center', 
  gap: '6px', 
  justifyContent: 'center' // تم التغيير من flex-end إلى center
}}>
   {doc.expiry_date ? `ينتهي في: ${doc.expiry_date}` : 'مستند دائم وساري'}
   <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: doc.expiry_date ? S.amber : S.green }}></span>
</div>
            </div>

            {/* 2. الزر أصبح ثانياً ليظهر في اليسار */}
            {/* 2. الأزرار في جهة اليسار */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              
              {/* زر معاينة المستند */}
              <button
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/supplier-docs/${doc.file_path}`)}
                style={{ 
                  background: 'rgba(201,168,76,0.05)', 
                  border: `1px solid ${S.gold}`, 
                  color: S.gold, 
                  padding: '8px 18px', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  fontFamily: "'Tajawal', sans-serif"
                }}>
                معاينة 👁️
              </button>

              {/* زر حذف المستند */}
              <button
                onClick={async () => {
                  const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا المستند نهائياً؟');
                  if (confirmDelete) {
                    try {
                      // 1. حذف من Storage
                      await supabase.storage.from('supplier-docs').remove([doc.file_path]);
                      // 2. حذف من الجدول
                      await supabase.from('supplier_documents').delete().eq('id', doc.id);
                      alert('تم الحذف بنجاح ✅');
                      await fetchDocs(); // تحديث القائمة
                    } catch (err) {
                      alert('حدث خطأ أثناء الحذف');
                    }
                  }
                }}
                style={{ 
                  background: 'rgba(255,82,82,0.05)', 
                  border: '1px solid #ff5252', 
                  color: '#ff5252', 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  fontFamily: "'Tajawal', sans-serif"
                }}>
                إلغاء ✕
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* النافذة المنبثقة (Modal) بتصميم Glassmorphism */}
  {selectedDoc !== null && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: S.navy2, border: `1px solid ${S.gold}33`, borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '32px', direction: 'rtl', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: S.white }}>أرشفة وثيقة جديدة</div>
          <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: S.muted, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: S.muted, marginBottom: '10px' }}>نوع الوثيقة الرسمية *</label>
          <select value={docDetails.type} onChange={e => setDocDetails({ ...docDetails, type: e.target.value })}
            style={{ width: '100%', background: S.navy, border: `1px solid ${S.border}`,fontFamily: "'Tajawal', sans-serif", borderRadius: '12px', padding: '14px', fontSize: '14px', color: S.white, outline: 'none' }}>
            <option value="">-- اختر من القائمة --</option>
            <option value=" السجل التجاري">السجل التجاري </option>
            <option value=" البطاقة الضريبية">البطاقة الضريبية </option>
            <option value="شهادة القيمة المضافة">شهادة القيمة المضافة</option>
            <option value="شهادة ISO">شهادة ISO</option>
            <option value="شهادة RSPO">شهادة RSPO</option>
            <option value="أخرى">نوع آخر (كتابة يدوية)</option>
          </select>
        </div>

        {/* الحقل الإضافي الذكي */}
        {docDetails.type === 'أخرى' && (
          <div style={{ marginBottom: '20px', animation: 'fadeIn 0.3s ease' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: S.gold, marginBottom: '10px' }}>اسم الوثيقة المخصص *</label>
            <input 
              type="text" 
              placeholder="مثال: ترخيص تصدير، سجل ضريبي..."
              onChange={e => setDocDetails({ ...docDetails, customName: e.target.value })}
              style={{ width: '100%', background: S.navy, border: `1px solid ${S.gold}66`, borderRadius: '12px', padding: '14px', fontSize: '14px', color: S.white, outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: S.muted, marginBottom: '10px' }}>تاريخ انتهاء الصلاحية</label>
          <input type="date" value={docDetails.exp} onChange={e => setDocDetails({ ...docDetails, exp: e.target.value })}
            style={{ width: '100%', background: S.navy, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '14px', fontSize: '14px', color: S.white, outline: 'none', colorScheme: 'dark' }} />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: S.muted, marginBottom: '10px' }}>اختيار الملف *</label>
          <div style={{ position: 'relative', background: S.navy, border: `2px dashed ${S.border}`, borderRadius: '15px', padding: '25px', textAlign: 'center', transition: 'all 0.3s' }}>
            <input type="file" onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            <div style={{ fontSize: '13px', color: fileToUpload ? S.green : S.muted }}>
              {fileToUpload ? `✅ تم اختيار: ${fileToUpload.name}` : 'اضغط هنا أو اسحب الملف للرفع'}
            </div>
            <div style={{ fontSize: '10px', color: S.muted, marginTop: '8px' }}>PDF, JPG, PNG (أقصى حجم 5MB)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }}
            style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'transparent', border: `1px solid ${S.border}`, color: S.white, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>إلغاء</button>
          <button onClick={handleFinalUpload} disabled={uploading}
            style={{ 
              flex: 2, 
              padding: '14px', 
              borderRadius: '12px', 
              background: uploading ? S.muted : S.gold, 
              border: 'none', 
              color: S.navy, 
              fontSize: '14px', 
              fontWeight: 800, 
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: "'Tajawal', sans-serif",
              boxShadow: uploading ? 'none' : `0 4px 15px ${S.gold}33`
              
            }}>
            {uploading ? '⏳ جاري الحفظ...' : 'إتمام الأرشفة الآن'}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  )
}

// ===== مكون التقييم =====
function RatingTab({ supplier, supplierId, priceHistory }: { supplier: any, supplierId: string, priceHistory: any[] }) {
  const [ratings, setRatings] = useState({ quality: 0, delivery: 0, communication: 0, price: 0, flexibility: 0 })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: notesData } = await supabase
        .from('supplier_notes')
        .select('*, profiles:created_by (full_name, department)')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
      setNotes(notesData || [])
      setLoaded(true)
    }
    fetchData()
  }, [supplierId])

  const categories = [
    { key: 'quality', label: 'الجودة', color: '#22C55E' },
    { key: 'delivery', label: 'الالتزام بالمواعيد', color: '#22C55E' },
    { key: 'communication', label: 'التواصل', color: '#C9A84C' },
    { key: 'price', label: 'الأسعار', color: '#C9A84C' },
    { key: 'flexibility', label: 'المرونة', color: '#F59E0B' },
  ]

const avg = Math.round(
  ((ratings.quality || supplier.quality_rating || 0) + 
   (ratings.delivery || supplier.delivery_rating || 0) + 
   (ratings.communication || supplier.comm_rating || 0) + 
   (ratings.price || supplier.price_rating || 0) + 
   (ratings.flexibility || supplier.flex_rating || 0)) / 5 * 10
) / 10;

  async function saveRating() {
    if (!window.confirm(`هل تريد حفظ التقييم الإجمالي ${avg}/10 ؟`)) return
    setSaving(true)
    await supabase.from('suppliers').update({ rating: avg, quality_rating: ratings.quality, delivery_rating: ratings.delivery, comm_rating: ratings.communication, price_rating: ratings.price, flex_rating: ratings.flexibility }).eq('id', supplierId)
    setSaving(false)
    alert('✅ تم حفظ التقييم بنجاح')
    // FIX 5: لا يوجد reload — التقييم يُحدَّث محلياً
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: noteRes } = await supabase
      .from('supplier_notes')
      .insert([{ supplier_id: supplierId, note: newNote.trim(), created_by: user?.id }])
      .select('*, profiles:created_by (full_name, department)')
      .single()
    if (noteRes) setNotes([noteRes, ...notes])
    setNewNote('')
    setSavingNote(false)
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm('هل تريد حذف هذه الملاحظة نهائياً؟')) return
    const { error } = await supabase.from('supplier_notes').delete().eq('id', noteId)
    if (error) { alert('عذراً، لم يتم الحذف: ' + error.message) }
    else { setNotes(notes.filter(n => n.id !== noteId)) }
  }

  if (!loaded) return <div style={{ textAlign: 'center', color: S.muted, padding: '40px 0' }}>جاري التحميل...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '16px', textAlign: 'right' }}>تقييم   المورد</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', flexShrink: 0, background: S.card2, borderRadius: '12px', padding: '16px 20px', minWidth: '100px' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: S.white, lineHeight: 1 }}>{avg}</div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 16 16" style={{ fill: i <= Math.round(avg / 2) ? S.gold : 'rgba(201,168,76,0.15)' }}>
                  <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: S.muted, marginTop: '6px' }}>{supplier.total_deals || 0} صفقة</div>
          </div>
          <div style={{ flex: 1 }}>
            {categories.map(cat => (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: S.white, width: '28px', textAlign: 'left', flexShrink: 0 }}>{(ratings as any)[cat.key]}</div>
                <div style={{ flex: 1, height: '8px', background: S.border, borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const val = Math.round((e.clientX - rect.left) / rect.width * 10)
                    setRatings({ ...ratings, [cat.key]: Math.max(0, Math.min(10, val)) })
                  }}>
                  <div style={{ height: '100%', width: `${(ratings as any)[cat.key] * 10}%`, background: cat.color, borderRadius: '4px', transition: 'width 0.2s' }} />
                </div>
                <div style={{ fontSize: '11px', color: S.muted, width: '130px', textAlign: 'right', flexShrink: 0 }}>{cat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={saveRating} disabled={saving}
          style={{ background: S.gold, color: S.navy, border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التقييم'}
        </button>
      </div>

      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>الملاحظات الداخلية</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={addNote} disabled={savingNote}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            {savingNote ? '...' : 'إضافة'}
          </button>
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="اكتب ملاحظة هنا..." rows={2}
            style={{ flex: 1, background: S.navy2, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any, resize: 'none' }} />
        </div>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '20px 0', fontSize: '13px' }}>لا توجد ملاحظات بعد</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map((n, idx) => (
              <div key={n.id || idx} style={{ background: S.card2, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>✕</button>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: S.gold, marginBottom: '2px' }}>
                    {n.profiles?.full_name || 'موظف'}{n.profiles?.department ? ` (${n.profiles.department})` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: S.white, lineHeight: '1.6', marginBottom: '4px' }}>{n.note}</div>
                  <div style={{ fontSize: '10px', color: S.muted }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('ar-EG') : ''} — {n.created_at ? new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// ===== FIX 3: مكون قدرات التجارة الجديد — رسم بياني + مؤشرات ذكية =====
function TradingCapabilityTab({ supplierId, supplier, priceHistory }: { supplierId: string, supplier: any, priceHistory: any[] }) {
  const products = (supplier.main_products || '').split(/[،,]/).map((p: string) => p.trim()).filter(Boolean)

  // حساب توزيع الأسعار لكل منتج من سجل الأسعار
  const productPriceMap: Record<string, number[]> = {}
  priceHistory.forEach(r => {
    if (!r.product_name) return
    if (!productPriceMap[r.product_name]) productPriceMap[r.product_name] = []
    if (r.price) productPriceMap[r.product_name].push(Number(r.price))
  })

  // مؤشرات الأداء التجاري
  const totalAmount = supplier.total_amount || 0
  const totalDeals  = supplier.total_deals  || 0
  const avgDeal     = totalDeals ? Math.round(totalAmount / totalDeals) : 0
  const priceCount  = priceHistory.length
  const lastPrice   = priceHistory[0]
  const prevPrice   = priceHistory[1]
  const priceChange = lastPrice && prevPrice
    ? (((Number(lastPrice.price) - Number(prevPrice.price)) / Number(prevPrice.price)) * 100).toFixed(1)
    : null

  // بيانات الرسم البياني (Bar Chart SVG) — الصفقات السنوية
  const monthlyDeals: Record<string, number> = {}
  priceHistory.forEach(r => {
    const m = new Date(r.created_at).toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' })
    monthlyDeals[m] = (monthlyDeals[m] || 0) + 1
  })
  const chartData = Object.entries(monthlyDeals).slice(-6)
  const maxVal = Math.max(...chartData.map(([, v]) => v), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* مؤشرات الأداء */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { label: 'إجمالي المبلغ',   val: totalAmount ? `${priceHistory[0]?.currency || '$'}${totalAmount.toLocaleString()}` : '0', icon: '💵', color: S.green },
          { label: 'متوسط الصفقة',    val: avgDeal ? `${priceHistory[0]?.currency || '$'}${avgDeal.toLocaleString()}` : '—', icon: '📊', color: S.blue },
          { label: 'سجلات الأسعار',   val: priceCount, icon: '🗂️', color: S.amber },
        ].map((m, i) => (
          <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '14px 16px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px' }}>{m.icon}</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.val}</div>
            </div>
            <div style={{ fontSize: '10px', color: S.muted }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* FIX 3: رسم بياني SVG — نشاط الصفقات */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          {priceChange !== null && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: Number(priceChange) >= 0 ? S.green : S.red }}>
              {Number(priceChange) >= 0 ? '▲' : '▼'} {Math.abs(Number(priceChange))}% تغير السعر
            </span>
          )}
          <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>📈 نشاط الصفقات (آخر 6 أشهر)</div>
        </div>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: '12px' }}>لا توجد بيانات كافية للرسم البياني</div>
        ) : (
          <svg viewBox={`0 0 ${chartData.length * 60} 100`} style={{ width: '100%', height: '120px', direction: 'ltr' }}>
            {/* خطوط الشبكة */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2={chartData.length * 60} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ))}
            {/* الأعمدة */}
            {chartData.map(([month, val], i) => {
              const barH = (val / maxVal) * 75
              const x = i * 60 + 10
              const y = 80 - barH
              return (
                <g key={month}>
                  <rect x={x} y={y} width="40" height={barH} rx="4"
                    fill={`url(#grad${i})`} opacity="0.9" />
                  <defs>
                    <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={S.gold} />
                      <stop offset="100%" stopColor={S.gold2} stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  <text x={x + 20} y="96" textAnchor="middle" fill={S.muted} fontSize="7" fontFamily="Tajawal,sans-serif">{month}</text>
                  {val > 0 && <text x={x + 20} y={y - 3} textAnchor="middle" fill={S.gold2} fontSize="8" fontWeight="700">{val}</text>}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* حركة الأسعار */}
      {priceHistory.length > 0 && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '12px', textAlign: 'right' }}>💰 آخر أسعار مسجّلة</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {priceHistory.slice(0, 5).map((p, i) => (
              <div key={i} style={{ background: S.card2, borderRadius: '10px', padding: '10px 14px', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: S.gold }}> {/* التحقق من وجود العملة في السجل نفسه أو استخدام رمز افتراضي */} {p.currency ? p.currency : ''} {Number(p.price || 0).toLocaleString()} </div>
               <div style={{ fontSize: '9px', color: S.muted, marginTop: '2px' }}>{(p.product_name || '—').slice(0, 14)}</div>
                <div style={{ fontSize: '9px', color: S.muted }}>{new Date(p.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الشهادات والاعتمادات */}
{/* 1. التحقق المزدوج: التأكد من وجود البيانات وأنها نصية */}
{typeof supplier?.certifications === 'string' && supplier.certifications.trim() !== '' && (
  <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
    <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '12px', textAlign: 'right' }}>🏅 الشهادات والاعتمادات</div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {/* 2. التأمين باستخدام (supplier.certifications || "") قبل الـ split */}
      {(supplier.certifications || "").split(/[،,]/).map((c: string, i: number) => c.trim() && (
        <span key={i} style={{ 
          fontSize: '11px', 
          padding: '5px 14px', 
          borderRadius: '20px', 
          background: 'rgba(34,197,94,0.1)', 
          color: S.green, 
          border: '1px solid rgba(34,197,94,0.2)', 
          fontWeight: 600 
        }}>
          ✓ {c.trim()}
        </span>
      ))}
    </div>
  </div>
)}

      {/* القدرات الإنتاجية — المبيعات السنوية + الصفقات */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>⚡ القدرات التجارية</div>
        {[
          { label: 'المبيعات السنوية',    val: supplier.annual_sales || '—', big: true, color: S.gold },
          { label: 'الصفقات المنجزة',     val: `${supplier.total_deals || 0} صفقة`, color: S.blue },
          { label: 'إجمالي قيمة التعامل', val: totalAmount ? `${priceHistory[0]?.currency || '$'}${totalAmount.toLocaleString()}` : '0', color: S.green },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: `1px solid ${S.border}` }}>
            <div style={{ fontSize: f.big ? '18px' : '13px', fontWeight: 700, color: f.color }}>{f.val}</div>
            <div style={{ fontSize: '11px', color: S.muted }}>{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== مكون المنتجات =====
function ProductsTab({ supplierId, mainProducts }: { supplierId: string, mainProducts: string }) {
  const [products, setProducts] = useState<any[]>(
    mainProducts ? mainProducts.split('،').map(p => p.trim()).filter(Boolean) : []
  )
  const [newProduct, setNewProduct] = useState('')
  const [saving, setSaving] = useState(false)

  async function addProduct() {
    if (!newProduct.trim()) return
    const updated = [...products, newProduct.trim()]
    setProducts(updated)
    setNewProduct('')
    setSaving(true)
    await supabase.from('suppliers').update({ main_products: updated.join('، ') }).eq('id', supplierId)
    setSaving(false)
  }

  async function deleteProduct(p: string) {
    const updated = products.filter(x => x !== p)
    setProducts(updated)
    await supabase.from('suppliers').update({ main_products: updated.join('، ') }).eq('id', supplierId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>إضافة منتج جديد</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={addProduct} disabled={saving}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            {saving ? '...' : '+ إضافة'}
          </button>
          <input type="text" value={newProduct} onChange={e => setNewProduct(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProduct()}
            placeholder="اسم المنتج..."
            style={{ flex: 1, background: S.navy2, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right' }} />
        </div>
      </div>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>المنتجات — {products.length} منتج</div>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: '13px' }}>لم تُضف منتجات بعد</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {products.map((p, i) => (
              <div key={i} style={{ background: S.card2, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => deleteProduct(p)} style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: '13px' }}>✕</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{p}</span>
                  <span>📦</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== FIX 4+5: مكون سجل الصفقات المفعّل =====
function DealsTab({ supplierId, supplier, setSupplier, priceHistory, setPriceHistory }: {
  supplierId: string; supplier: any; setSupplier: any; priceHistory: any[]; setPriceHistory: any
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [openId,  setOpenId]  = useState<string | null>(null)
  const [form, setForm] = useState({
    product_name: '', price: '', quantity: '', currency: priceHistory.length > 0 ? (priceHistory[0].currency || 'USD') : 'USD',
    deal_date: new Date().toISOString().split('T')[0],
    status: 'مكتملة', notes: '', incoterms: 'CIF', payment_method: 'LC',
  })

  const totalAmount = priceHistory.reduce((a, d) => a + (Number(d.price) || 0), 0)
  const totalDeals  = priceHistory.length
  const avgDeal     = totalDeals ? Math.round(totalAmount / totalDeals) : 0
  const statusColors: Record<string, { c: string; b: string }> = {
    'مكتملة': { c: S.green, b: 'rgba(34,197,94,0.1)' },
    'جارية':  { c: S.blue,  b: 'rgba(59,130,246,0.1)' },
    'معلقة':  { c: S.amber, b: 'rgba(245,158,11,0.1)' },
    'ملغاة':  { c: S.red,   b: 'rgba(239,68,68,0.1)' },
  }

  async function addDeal() {
    if (!form.product_name || !form.price) { alert('يرجى إدخال المنتج والمبلغ'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const amount = Number(form.price.replace(/[^0-9.]/g, '')) || 0
// تأكد من وجود تاريخ، وإلا استخدم تاريخ اليوم كخيار احتياطي
const dealDate = form.deal_date ? new Date(form.deal_date).toISOString() : new Date().toISOString();

const { data: newDeal, error } = await supabase.from('supplier_prices_history').insert([{
  supplier_id: supplierId,
  product_name: form.product_name,
  price: parseFloat(`${amount}`), 
  status: 'مقبول', // ✅ هذه الكلمة التي ينتظرها الجدول حرفياً
  notes: form.notes || null,
  currency: form.currency || 'USD',
  quantity: form.quantity || null,
  incoterms: form.incoterms,
  payment_method: form.payment_method,
  user_id: user?.id,
  created_at: form.deal_date ? new Date(form.deal_date).toISOString() : new Date().toISOString(),
}]).select().single();

if (error) {
  console.error("❌ خطأ متبقي:", error.message);
  alert(`حدث خطأ: ${error.message}`);
} else {
  console.log("✅ تمت الصفقة بنجاح يا رئيس!");
  // تحديث الصفحة لرؤية الصفقة في الجدول
  window.location.reload(); 
}
    if (!error && newDeal) {
      // FIX 5: تحديث إحصائيات المورد في نفس الوقت
      const newTotal  = (supplier.total_deals  || 0) + 1
      const newAmount = (supplier.total_amount || 0) + amount
      await supabase.from('suppliers').update({ total_deals: newTotal, total_amount: newAmount }).eq('id', supplierId)
      setSupplier((prev: any) => ({ ...prev, total_deals: newTotal, total_amount: newAmount }))
      setPriceHistory((prev: any[]) => [newDeal, ...prev])
    }
    setShowAdd(false)
    setForm({ product_name: '', price: '', quantity: '', currency: 'USD', deal_date: new Date().toISOString().split('T')[0], status: 'مكتملة', notes: '', incoterms: 'CIF', payment_method: 'LC' })
    setSaving(false)
  }

  const inp2: React.CSSProperties = {
    width: '100%', background: S.navy, border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '8px 11px', fontSize: '12px', color: S.white,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
        {[
          { label: 'إجمالي الصفقات', val: totalDeals, color: S.gold },
          { label: 'إجمالي المبلغ', val: totalAmount ? `$${totalAmount.toLocaleString()}` : '$0', color: S.green },
          { label: 'متوسط الصفقة', val: avgDeal ? `${priceHistory[0]?.currency || '$'}${avgDeal.toLocaleString()}` : '—', color: S.blue },
        ].map((m, i) => (
          <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '14px', textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: m.color, marginBottom: '3px' }}>{m.val}</div>
            <div style={{ fontSize: '10px', color: S.muted }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* رأس الأرشيف + زر الإضافة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ background: S.gold, color: S.navy, border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          + إضافة صفقة
        </button>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>📋 أرشيف الصفقات ({totalDeals})</div>
      </div>

      {/* فورم إضافة صفقة */}
      {showAdd && (
        <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: '14px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: S.gold2, marginBottom: '14px', textAlign: 'right' }}>📦 تسجيل صفقة جديدة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '10px', color: S.gold, fontWeight: 700, marginBottom: '4px' }}>اسم المنتج *</label>
              <input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} style={inp2} placeholder="مثال: Refined Palm Olein Oil" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>المبلغ *</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {priceHistory.length > 0 ? (
  <div style={{ ...inp2, width: '65px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: S.gold, fontWeight: 700 }}>
    {form.currency}
  </div>
) : (
  <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={{ ...inp2, width: '65px', flexShrink: 0, cursor: 'pointer' }}>
    {CURRENCIES.map(c => <option key={c.id} value={c.value} style={{ background: S.navy2 }}>{c.id}</option>)}
  </select>
)}
                <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inp2} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الكمية</label>
              <input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} style={inp2} placeholder="مثال: 22 MT" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>تاريخ الصفقة</label>
              <input type="date" value={form.deal_date} onChange={e => setForm(p => ({ ...p, deal_date: e.target.value }))}
                style={{ ...inp2, colorScheme: 'dark' as any }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الحالة</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ ...inp2, cursor: 'pointer' }}>
                {['مكتملة', 'جارية', 'معلقة', 'ملغاة'].map(s => <option key={s} value={s} style={{ background: S.navy2 }}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>ملاحظات الصفقة</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                style={{ ...inp2, resize: 'none' } as React.CSSProperties} placeholder="تفاصيل إضافية..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
            <button onClick={addDeal} disabled={saving}
              style={{ flex: 2, background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? '⏳...' : '✅ حفظ الصفقة'}
            </button>
          </div>
        </div>
      )}

      {/* قائمة الصفقات */}
      {priceHistory.length === 0 ? (
        <div style={{ textAlign: 'center', color: S.muted, padding: '40px 0', fontSize: '13px', background: S.card, borderRadius: '12px', border: `1px solid ${S.border}` }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          لم تُسجَّل صفقات بعد
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {priceHistory.map((d, i) => {
            const sc = statusColors[d.status] || { c: S.muted, b: S.card }
            const noteParts = [
  d.quantity && `الكمية: ${d.quantity}`,
  d.notes,
].filter(Boolean) as string[]        
    const isOpen = openId === (d.id || String(i))
            return (
              <div key={d.id || i} onClick={() => setOpenId(isOpen ? null : (d.id || String(i)))}
                style={{ background: S.card, border: `1px solid ${isOpen ? S.gold : S.border}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'border-color .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isOpen ? '12px' : 0 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: S.gold }}>
                      {d.price ? `${d.currency || '$'}${Number(d.price).toLocaleString()}` : '—'}
                    </span>
                    <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700, background: sc.b, color: sc.c }}>{d.status || 'غير محدد'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: S.white }}>📦 {d.product_name || '—'}</div>
                    <div style={{ fontSize: '10px', color: S.muted, marginTop: '2px' }}>{new Date(d.created_at).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
                {isOpen && noteParts.length > 0 && (
                  <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {noteParts.map((part: string, j: number) => (
                      <div key={j} style={{ fontSize: '11px', color: S.muted, textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <span>{part.trim()}</span>
                        <span style={{ color: S.gold }}>›</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== الصفحة الرئيسية =====
export default function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('activeTab') || 'overview'
    return 'overview'
  })
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ company_name: '', registration_number: '', country: '', city: '', website: '' })
  const [editMode2, setEditMode2] = useState(false)
  const [editData2, setEditData2] = useState({ main_products: '', notes: '' })

  useEffect(() => {
    async function fetchPriceHistory(){

const { data } = await supabase
.from('supplier_prices_history')
.select('*')
.eq('supplier_id', id)
.order('created_at',{ascending:false})

setPriceHistory(data || [])

}

fetchPriceHistory()
    async function fetchSupplier() {
      const { data } = await supabase.from('suppliers').select('*').eq('id', id).single()
      setSupplier(data)
      if (data) setEditData({ company_name: data.company_name || '', registration_number: data.registration_number || '', country: data.country || '', city: data.city || '', website: data.website || '' })
      setLoading(false)
    }
    fetchSupplier()
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>جاري التحميل...</div>
  if (!supplier) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>لم يتم العثور على المورد</div>

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const scoreFields = [
    { label: 'اسم الشركة', key: 'company_name', points: 10 },
    { label: 'الدولة', key: 'country', points: 5 },
    { label: 'المدينة', key: 'city', points: 5 },
    { label: 'المنتجات', key: 'main_products', points: 15 },
    { label: 'المسؤول', key: 'contact_name', points: 10 },
    { label: 'واتساب', key: 'contact_whatsapp', points: 15 },
    { label: 'الإيميل', key: 'contact_email', points: 10 },
    { label: 'تقييم', key: '_has_rating', points: 10 },
    { label: 'الموقع', key: 'website', points: 5 },
    { label: 'السجل التجاري', key: 'registration_number', points: 10 },
    { label: 'صفقة أولى', key: '_first_deal', points: 5 },
  ]
  const avg = Math.round(
    ((supplier.quality_rating || 0) + (supplier.delivery_rating || 0) + (supplier.comm_rating || 0) + (supplier.price_rating || 0) + (supplier.flex_rating || 0)) / 5 * 10
  ) / 10
  
const comp = scoreFields.reduce((total, f) => {
  if (f.key === '_first_deal') {
    return total + (priceHistory.length > 0 ? f.points : 0)
  }

  if (f.key === '_has_rating') {
    return total + (avg > 0 ? f.points : 0)
  }

  return total + ((supplier as any)[f.key] ? f.points : 0)
}, 0)

const compFields = scoreFields.map(f => ({
  label: f.label,
  points: f.points,
  done:
    f.key === '_first_deal'
      ? priceHistory.length > 0
      : f.key === '_has_rating'
      ? avg > 0
      : !!(supplier as any)[f.key],
}))

function handleExportPDF() {
  if (!supplier) {
    alert('لا يوجد مورد');
    return;
  }

  const currency = (priceHistory && priceHistory[0]?.currency) || '$';

  const totalAmount = (priceHistory || []).reduce(
    (a: number, d: any) => a + (Number(d?.price) || 0),
    0
  );

  const totalDeals = priceHistory ? priceHistory.length : 0;

  const avgDeal = totalDeals
    ? Math.round(totalAmount / totalDeals)
    : 0;

  // متوسط التقييم
  const ratings = [
    supplier?.quality_rating || 0,
    supplier?.delivery_rating || 0,
    supplier?.comm_rating || 0,
    supplier?.price_rating || 0,
    supplier?.flex_rating || 0,
  ];

  const avg =
    ratings.reduce((a, b) => a + b, 0) / ratings.length || 0;

  const html = `
  <html dir="rtl">
  <body style="font-family:Arial;padding:20px">

    <h2>${supplier?.company_name || ''}</h2>

    <p>
      ${supplier?.country || ''} 
      ${supplier?.city ? ' / ' + supplier.city : ''}
    </p>

    <hr/>

    <p>إجمالي الصفقات: ${totalDeals}</p>
    <p>إجمالي المبلغ: ${currency}${totalAmount}</p>
    <p>متوسط الصفقة: ${currency}${avgDeal}</p>
    <p>التقييم: ${avg.toFixed(1)} / 10</p>

    ${
      supplier?.main_products
        ? `
      <h3>المنتجات</h3>
      <div>
        ${String(supplier.main_products)
          .split(/[،,]/)
          .map((p: any) => `<span>${p.trim()}</span>`)
          .join('<br/>')}
      </div>
    `
        : ''
    }

    ${
      priceHistory && priceHistory.length
        ? `
      <h3>الصفقات</h3>
      <table border="1" style="width:100%;border-collapse:collapse">
        <tr>
          <th>المنتج</th>
          <th>السعر</th>
          <th>التاريخ</th>
        </tr>
        ${priceHistory
          .map(
            (d: any) => `
          <tr>
            <td>${d?.product_name || ''}</td>
            <td>${Number(d?.price || 0)}</td>
            <td>${new Date(d?.created_at).toLocaleDateString()}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    `
        : ''
    }

  </body>
  </html>
  `;

  const win = window.open('', '_blank');

  if (!win) {
    alert('افتح popups');
    return;
  }

  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    win.print();
  }, 300);
}

  const tabs = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'contact', label: 'جهات التواصل' },
    { key: 'trading', label: 'قدرات التجارة' },
    { key: 'products', label: 'المنتجات' },
    { key: 'deals', label: 'سجل الصفقات' },
    { key: 'docs', label: 'الوثائق' },
    { key: 'rating', label: 'التقييم' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl' }}>

      {/* شريط الأدوات */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/suppliers')}
            style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: S.card2, color: S.white, border: `1px solid rgba(255,255,255,0.18)` }}>← رجوع</button>
          <button onClick={async () => {
            setShowAiModal(true); setAiLoading(true); setAiAnalysis('')
            try {
              const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}` },
                body: JSON.stringify({
                  model: 'openrouter/auto',
                  messages: [{ role: 'user', content: `أنت مستشار تجاري متخصص. حلل هذا المورد:\n- الاسم: ${supplier.company_name}\n- الدولة: ${supplier.country}\n- المنتجات: ${supplier.main_products}\n- التقييم: ${supplier.rating}/10\n- الصفقات: ${supplier.total_deals}\n\nقدم:\n## التقييم العام\n## نقاط القوة\n## نقاط الضعف\n## المخاطر\n## التوصيات` }],
                  max_tokens: 800
                })
              })
              const data = await res.json()
              setAiAnalysis(data?.choices?.[0]?.message?.content || 'تعذر التحليل')
            } catch { setAiAnalysis('تعذر الاتصال') } finally { setAiLoading(false) }
          }}
            style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: S.gold, color: S.navy }}>
            ✨ تحليل AI
          </button>
<button onClick={handleExportPDF}
  style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>
  📄 تصدير PDF
</button>        </div>
      </div>

      {/* المحتوى */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

        {/* بطاقة المورد */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '20px', marginBottom: '12px', display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ textAlign: 'center', background: S.card2, borderRadius: '10px', padding: '14px', minWidth: '148px', flexShrink: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: comp >= 80 ? S.green : comp >= 50 ? S.gold : S.red, lineHeight: 1 }}>{comp}%</div>
            <div style={{ fontSize: '10px', color: S.muted, marginTop: '3px' }}>اكتمال الملف</div>
            <div style={{ height: '4px', background: S.border, borderRadius: '2px', margin: '8px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${comp}%`, background: comp >= 80 ? S.green : `linear-gradient(90deg,${S.gold},${S.gold2})`, borderRadius: '2px' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
              {compFields.map(f => (
                <span key={f.label} style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '6px', fontWeight: 600, background: f.done ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)', color: f.done ? S.green : S.red }}>
                  {f.label} {f.done ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{supplier.company_name}</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px', justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, background: S.gold3, color: S.gold, border: `1px solid rgba(201,168,76,0.2)` }}>Manufacturer</span>
              <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, background: S.gold3, color: S.gold, border: `1px solid rgba(201,168,76,0.2)` }}>Exporter</span>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {supplier.country && <div style={{ fontSize: '11px', color: S.muted }}>{supplier.country}{supplier.city ? ` / ${supplier.city}` : ''}</div>}
              <div style={{ fontSize: '11px', color: S.muted }}>تسجيل: {new Date(supplier.created_at).toLocaleDateString('ar-EG')}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{formatSupNum(supplier.supplier_number)}</div>
              {supplier.last_contact_date && <div style={{ fontSize: '11px', color: S.gold }}>آخر تواصل: {timeAgo(supplier.last_contact_date)}</div>}
            </div>
          </div>
          <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(supplier.company_name)}
          </div>
        </div>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'إجمالي الصفقات', val: supplier.total_deals || 0, color: S.gold },
            { label: 'إجمالي المبلغ', val: supplier.total_amount ? `${priceHistory[0]?.currency || '$'}${supplier.total_amount.toLocaleString()}` : '0', color: S.green },
            { label: 'التقييم', val: `${avg > 0 ? avg : (supplier?.rating || 0)}/10`, color: S.blue },
           { label: 'المبيعات السنوية', val: supplier.annual_sales || '—', color: S.amber },
          ].map((m, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '14px', textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: m.color, marginBottom: '4px' }}>{m.val}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* التبويبات */}
        <div style={{ display: 'flex', gap: '2px', background: S.card, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: tab === t.key ? S.white : S.muted, borderRadius: '7px', cursor: 'pointer', border: tab === t.key ? `1px solid ${S.border}` : 'none', background: tab === t.key ? S.navy2 : 'transparent', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* نظرة عامة */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>معلومات الشركة</div>
                <button onClick={async () => {
                  if (editMode) {
                    await supabase.from('suppliers').update(editData).eq('id', id)
                    // FIX 5: تحديث الـ state مباشرة بدون reload
                    setSupplier((prev: any) => ({ ...prev, ...editData }))
                    setEditMode(false)
                  } else {
                    setEditMode(true)
                  }
                }} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${S.border}`, background: editMode ? S.gold : 'transparent', color: editMode ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {editMode ? 'حفظ' : 'تعديل'}
                </button>
              </div>
              {[
                { label: 'الاسم الرسمي', key: 'company_name' },
                { label: 'رقم التسجيل', key: 'registration_number' },
                { label: '', key: 'country' },
                { label: 'المدينة', key: 'city' },
                { label: 'الموقع الإلكتروني', key: 'website' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>{f.label}</div>
                  {editMode ? (
                    <input type="text" value={(editData as any)[f.key] || ''} onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                      style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: S.white, outline: 'none', textAlign: 'right', boxSizing: 'border-box' as any }} />
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 500, color: S.white }}>
                      {f.key === 'website' && (supplier as any)[f.key] ? (
                        <a href={(supplier as any)[f.key].startsWith('http') ? (supplier as any)[f.key] : `https://${(supplier as any)[f.key]}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: S.gold, textDecoration: 'none', borderBottom: `1px solid ${S.gold}`, display: 'inline-block', paddingBottom: '1px' }}>
                          {(supplier as any)[f.key]}
                        </a>
                      ) : ((supplier as any)[f.key] || '—')}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>تاريخ التسجيل</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{new Date(supplier.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
{/* بداية قسم جلب عروض الاسعار*/} 
   
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
  {/* الهيدر الجديد للقسم */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
    <div style={{ fontSize: '10px', color: S.gold, background: 'rgba(201,168,76,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>تحديث تلقائي</div>
    <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>سجل عروض الأسعار (من المقارنات)</div>
  </div>

  {/* جدول عرض الأسعار */}
  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', textAlign: 'right' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${S.border}`, color: S.muted, fontSize: '11px' }}>
          <th style={{ padding: '8px' }}>المنتج</th>
          <th style={{ padding: '8px' }}>السعر</th>
          <th style={{ padding: '8px' }}>الحالة</th>
          <th style={{ padding: '8px' }}>التاريخ</th>
        </tr>
      </thead>
      <tbody>
        {priceHistory && priceHistory.length > 0 ? (
          priceHistory.map((item, index) => (
            <tr key={index} style={{ borderBottom: `1px solid ${S.border}44`, fontSize: '12px' }}>
              <td style={{ padding: '10px', color: S.white }}>{item.product_name}</td>
              <td style={{ padding: '10px', fontWeight: 700, color: S.gold }}> {item.currency || ''} {item.price?.toLocaleString()} </td>
              <td style={{ padding: '10px' }}>
                <span style={{ 
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                  background: item.status === 'مقبول' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: item.status === 'مقبول' ? S.green : S.red 
                }}>
                  {item.status}
                </span>
              </td>
              <td style={{ padding: '10px', color: S.muted, fontSize: '11px' }}>
                {new Date(item.created_at).toLocaleDateString('ar-EG')}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: S.muted, fontSize: '12px' }}>
              لا توجد عروض أسعار مسجلة لهذا المورد حتى الآن.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
<div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '18px', marginTop: '20px', fontFamily: "'Tajawal', sans-serif" }}>
  
  {/* الهيدر: العنوان يميناً والزر يساراً */}
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', borderBottom: `1px solid ${S.border}44`, paddingBottom: '12px' }}>
    
    {/* الزر جهة اليسار */}
    <div style={{ fontSize: '10px', fontWeight: 800, color: S.muted, letterSpacing: '0.5px', fontFamily: "'Tajawal', sans-serif" }}>
      التقرير الإستراتيجي للمورد
    </div>
<button 
      onClick={async () => {
        if (editMode2) {
          const { error } = await supabase.from('suppliers').update({ notes: editData2.notes }).eq('id', id);
          if (!error) setSupplier({ ...supplier, notes: editData2.notes });
        } else {
          setEditData2({ ...editData2, notes: supplier.notes || '' });
        }
        setEditMode2(!editMode2);
      }}
      style={{ 
        fontSize: '10px', 
        padding: '6px 16px', 
        borderRadius: '8px', 
        border: `1px solid ${S.gold}66`, 
        background: editMode2 ? S.gold : 'transparent', 
        color: editMode2 ? S.navy : S.gold, 
        cursor: 'pointer', 
        fontWeight: 700,
        fontFamily: "'Tajawal', sans-serif", // توحيد الخط
        transition: 'all 0.3s ease'
      }}
    >
      {editMode2 ? 'حفظ التقرير' : 'تعديل / إضافة'}
    </button>

  </div>

  {/* محتوى التقرير */}
  <div style={{ marginTop: '10px' }}>
    {editMode2 ? (
      <textarea 
        value={editData2.notes} 
        onChange={(e) => setEditData2({ ...editData2, notes: e.target.value })}
        placeholder="اكتب ملاحظاتك هنا... استخدم ** لتمييز النقاط الهامة"
        rows={5}
        style={{ 
          width: '100%', 
          background: S.navy2, 
          border: `1px solid ${S.gold}33`, 
          borderRadius: '10px', 
          padding: '12px', 
          fontSize: '10px', 
          color: S.white, 
          outline: 'none', 
          fontFamily: "'Tajawal', sans-serif", // توحيد الخط
          textAlign: 'right', 
          lineHeight: '1.6',
          resize: 'none' 
        }}
      />
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {supplier.notes ? (
          supplier.notes.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
            const isCritical = line.trim().startsWith('**');
            const cleanText = line.replace(/\*\*/g, '').trim();

            return (
              <div key={i} style={{ 
                padding: isCritical ? '12px 15px' : '4px 0',
                background: isCritical ? 'rgba(201, 168, 76, 0.07)' : 'transparent',
                borderRight: isCritical ? `4px solid ${S.gold}` : 'none',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: isCritical ? '14px' : '13px', 
                  fontWeight: isCritical ? 700 : 400, 
                  color: isCritical ? S.gold : S.white,
                  lineHeight: '1.8',
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontFamily: "'Tajawal', sans-serif" // توحيد الخط
                }}>
                  {isCritical && <span style={{ fontSize: '15px' }}>📌</span>}
                  <span style={{ flex: 1 }}>{cleanText}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: S.muted, fontSize: '13px', textAlign: 'center', padding: '25px', fontFamily: "'Tajawal', sans-serif" }}>
            لا توجد بيانات في التقرير حالياً. اضغط تعديل للبدء.
          </div>
        )}
      </div>
    )}
  </div>
</div>
</div>

{/* نهاية قسم جلب عروض الاسعار*/}     
     </div>
        )}

        {tab === 'contact' && <ContactTab supplier={supplier} supplierId={id} setSupplier={setSupplier} />}
        {tab === 'products' && <ProductsTab supplierId={id} mainProducts={supplier.main_products} />}

        {tab === 'trading' && (
          <TradingCapabilityTab supplierId={id} supplier={supplier} priceHistory={priceHistory} />
        )}

        {tab === 'deals' && (
          <DealsTab supplierId={id} supplier={supplier} setSupplier={setSupplier} priceHistory={priceHistory} setPriceHistory={setPriceHistory} />
        )}

        {tab === 'docs' && <DocsTab supplierId={id} />}
{tab === 'rating' && (
  <RatingTab 
    supplier={supplier} 
    supplierId={id} 
    priceHistory={priceHistory} 
  />
)}
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>✨ تحليل AI</div>
                <div style={{ fontSize: '11px', color: S.muted, marginTop: '2px' }}>{supplier.company_name}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {aiLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                  <div style={{ color: S.muted, fontSize: '14px' }}>جاري التحليل...</div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', lineHeight: '2', color: S.white, whiteSpace: 'pre-wrap' }}>{aiAnalysis}</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}