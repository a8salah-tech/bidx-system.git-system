'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AppShell from "../../components/AppShell";


interface Customer {
  id: string
  created_at: string
  customer_number: number
  company_name: string
  country: string
  city: string
  status: string
  rating: number
  completion_pct: number
  contact_name: string
  contact_whatsapp: string
  contact_email: string
  annual_sales: string
  notes: string
  total_deals: number
  total_amount: number
  main_products: string
  last_contact_date: string
  last_contact_method: string
  website: string
  registration_number: string
  quality_rating: number
  delivery_rating: number
  comm_rating: number
  price_rating: number
  flex_rating: number
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
  return `CUS-${String(n).padStart(5, '0')}`
}

const S = {
  navy: '#0A1628',
  navy2: '#0F2040',
  navy3: '#152A52',
  gold: '#C9A84C',
  gold2: '#E8C97A',
  gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8',
  muted: '#8A9BB5',
  border: 'rgba(255,255,255,0.08)',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#3B82F6',
  amber: '#F59E0B',
  card: 'rgba(255,255,255,0.04)',
  card2: 'rgba(255,255,255,0.08)',
}

// ===== مكون جهات التواصل والوثائق =====
function ContactTab({ customer, customerId, setCustomer }: { customer: any, customerId: string, setCustomer: any }) {  // 1. حالات إدارة الملفات والرفع
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
    contact_email: customer?.contact_email || '',
    contact_whatsapp: customer?.contact_whatsapp || '',
    website: customer?.website || '',
    last_contact_date: customer?.last_contact_date || '',
    last_contact_method: customer?.last_contact_method || '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(`contacts_${customerId}`)
    if (saved) {
      setContacts(JSON.parse(saved))
    } else {
      const defaults: any[] = []
      if (customer.contact_name) {
        defaults.push({ id: '1', name: customer.contact_name, role: 'مسؤول التصدير', email: customer.contact_email || '', phone: '', whatsapp: customer.contact_whatsapp || '', notes: '' })
      }
      setContacts(defaults)
    }
  }, [customerId])

  const fetchDocs = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_documents')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (!error) setDocs(data || [])
    } catch (err) {
      console.error('Fetch Error:', err)
    }
  }
useEffect(() => {
  async function fetchCustomerRating() {
    const { data } = await supabase
       .from('customers')
       .select('quality_rating, delivery_rating, comm_rating, price_rating, flex_rating')
       .eq('id', customerId)
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

  if (customerId) {
    fetchCustomerRating();
  }
}, [customerId]);

  useEffect(() => { fetchDocs() }, [customerId])

  const handleFinalUpload = async () => {
    if (!fileToUpload || !docDetails.type) {
      alert('برجاء اختيار النوع والملف')
      return
    }
    setUploading(true)
    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const filePath = `${customerId}/${Date.now()}.${fileExt}`
      const { error: upErr } = await supabase.storage.from('customer-docs').upload(filePath, fileToUpload)
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('customer_documents').insert([{
        customer_id: customerId,
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
    localStorage.setItem(`contacts_${customerId}`, JSON.stringify(list))
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

      {/* بيانات التواصل الرسمية */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>بيانات التواصل الرسمية</div>
          <button
            onClick={async () => {
              if (editOfficial) {
                await supabase.from('customers').update({
                  contact_email: officialData.contact_email,
                  contact_whatsapp: officialData.contact_whatsapp,
                  website: officialData.website,
                  last_contact_date: officialData.last_contact_date || null,
                  last_contact_method: officialData.last_contact_method,
                }).eq('id', customerId)
              } else {
                setOfficialData({
                  contact_email: customer.contact_email || '',
                  contact_whatsapp: customer.contact_whatsapp || '',
                  website: customer.website || '',
                  last_contact_date: customer.last_contact_date || '',
                  last_contact_method: customer.last_contact_method || '',
                })
              }
              setEditOfficial(!editOfficial)
            }}
            style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${S.border}`, background: editOfficial ? S.gold : 'transparent', color: editOfficial ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {editOfficial ? 'حفظ' : 'تعديل'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الإيميل الرسمي</div>
            {editOfficial ? (
              <input type="email" value={officialData.contact_email} onChange={e => setOfficialData({ ...officialData, contact_email: e.target.value })}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#93C5FD' }}>{customer.contact_email || '—'}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>واتساب</div>
            {editOfficial ? (
              <input type="text" value={officialData.contact_whatsapp} onChange={e => setOfficialData({ ...officialData, contact_whatsapp: e.target.value })}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: S.green }}>{customer.contact_whatsapp || '—'}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الموقع الإلكتروني</div>
            {editOfficial ? (
              <input type="text" value={officialData.website} onChange={e => setOfficialData({ ...officialData, website: e.target.value })}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#93C5FD' }}>{customer.website || '—'}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>آخر تواصل</div>
            {editOfficial ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="date" value={officialData.last_contact_date}
                  onChange={e => setOfficialData({ ...officialData, last_contact_date: e.target.value })}
                  style={{ flex: 1, background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as any, colorScheme: 'dark' as any }} />
                <select value={officialData.last_contact_method}
                  onChange={e => setOfficialData({ ...officialData, last_contact_method: e.target.value })}
                  style={{ flex: 1, background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit' }}>
                  <option value="">وسيلة التواصل</option>
                  <option value="واتساب">واتساب</option>
                  <option value="إيميل">إيميل</option>
                  <option value="مكالمة">مكالمة</option>
                  <option value="اجتماع">اجتماع</option>
                </select>
              </div>
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: S.white }}>
                {customer.last_contact_date ? `${timeAgo(customer.last_contact_date)}${customer.last_contact_method ? ` — عبر ${customer.last_contact_method}` : ''}` : '—'}
              </div>
            )}
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
function DocsTab({ customerId }: { customerId: string }) {
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
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (!error) setDocs(data || [])
  }

  useEffect(() => { fetchDocs() }, [customerId])

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
      const filePath = `${customerId}/${Date.now()}.${fileExt}`
      
      const { error: upErr } = await supabase.storage.from('customer-docs').upload(filePath, fileToUpload)
      if (upErr) throw upErr

      // حفظ البيانات في جدول قاعدة البيانات
      const { error: dbErr } = await supabase.from('customer_documents').insert([{
        customer_id: customerId, 
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
          لا توجد وثائق مؤرشفة حالياً في ملف المورد
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
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/customer-docs/${doc.file_path}`)}
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
                      await supabase.storage.from('customer-docs').remove([doc.file_path]);
                      // 2. حذف من الجدول
                      await supabase.from('customer_documents').delete().eq('id', doc.id);
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
function RatingTab({ customer, customerId, priceHistory }: { customer: any, customerId: string, priceHistory: any[] }) {
  const [ratings, setRatings] = useState({ quality: 0, delivery: 0, communication: 0, price: 0, flexibility: 0 })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: notesData } = await supabase
        .from('customer_notes')
        .select('*, profiles:created_by (full_name, department)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setNotes(notesData || [])
      setLoaded(true)
    }
    fetchData()
  }, [customerId])

  const categories = [
    { key: 'quality', label: 'الجودة', color: '#22C55E' },
    { key: 'delivery', label: 'الالتزام بالمواعيد', color: '#22C55E' },
    { key: 'communication', label: 'التواصل', color: '#C9A84C' },
    { key: 'price', label: 'الأسعار', color: '#C9A84C' },
    { key: 'flexibility', label: 'المرونة', color: '#F59E0B' },
  ]

const avg = Math.round(
  ((ratings.quality || customer.quality_rating || 0) + 
   (ratings.delivery || customer.delivery_rating || 0) + 
   (ratings.communication || customer.comm_rating || 0) + 
   (ratings.price || customer.price_rating || 0) + 
   (ratings.flexibility || customer.flex_rating || 0)) / 5 * 10
) / 10;

  async function saveRating() {
    if (!window.confirm(`هل تريد حفظ التقييم الإجمالي ${avg}/10 ؟`)) return
    setSaving(true)
    await supabase.from('customers').update({ rating: avg, quality_rating: ratings.quality, delivery_rating: ratings.delivery, comm_rating: ratings.communication, price_rating: ratings.price, flex_rating: ratings.flexibility }).eq('id', customerId)
    setSaving(false)
    alert('✅ تم حفظ التقييم بنجاح')
    sessionStorage.setItem('activeTab', 'rating')
    window.location.reload()
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: noteRes } = await supabase
      .from('customer_notes')
      .insert([{ customer_id: customerId, note: newNote.trim(), created_by: user?.id }])
      .select('*, profiles:created_by (full_name, department)')
      .single()
    if (noteRes) setNotes([noteRes, ...notes])
    setNewNote('')
    setSavingNote(false)
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm('هل تريد حذف هذه الملاحظة نهائياً؟')) return
    const { error } = await supabase.from('customer_notes').delete().eq('id', noteId)
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
            <div style={{ fontSize: '11px', color: S.muted, marginTop: '6px' }}>{customer.total_deals || 0} صفقة</div>
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
// ===== مكون المنتجات =====
function ProductsTab({ customerId, mainProducts }: { customerId: string, mainProducts: string }) {
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
    await supabase.from('customers').update({ main_products: updated.join('، ') }).eq('id', customerId)
    setSaving(false)
  }

  async function deleteProduct(p: string) {
    const updated = products.filter(x => x !== p)
    setProducts(updated)
    await supabase.from('customers').update({ main_products: updated.join('، ') }).eq('id', customerId)
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

// ===== الصفحة الرئيسية =====
export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
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
.from('customer_prices_history')
.select('*')
.eq('customer_id', id)
.order('created_at',{ascending:false})

setPriceHistory(data || [])

}

fetchPriceHistory()
    async function fetchCustomer() {
      const { data } = await supabase.from('customers').select('*').eq('id', id).single()
      setCustomer(data)
      if (data) setEditData({ company_name: data.company_name || '', registration_number: data.registration_number || '', country: data.country || '', city: data.city || '', website: data.website || '' })
      setLoading(false)
    }
    fetchCustomer()
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>جاري التحميل...</div>
  if (!customer) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>لم يتم العثور على المورد</div>

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const scoreFields = [
    { label: 'اسم الشركة', key: 'company_name', points: 10 },
    { label: 'الدولة', key: 'country', points: 5 },
    { label: 'المدينة', key: 'city', points: 5 },
    { label: 'المنتجات', key: 'main_products', points: 15 },
    { label: 'المسؤول', key: 'contact_name', points: 10 },
    { label: 'واتساب', key: 'contact_whatsapp', points: 15 },
    { label: 'الإيميل', key: 'contact_email', points: 10 },
    { label: 'المبيعات', key: 'annual_sales', points: 10 },
    { label: 'الموقع', key: 'website', points: 5 },
    { label: 'التسجيل', key: 'registration_number', points: 10 },
    { label: 'تعاقد', key: '_contract', points: 5 },
  ]

  const comp = scoreFields.reduce((total, f) => {
    if (f.key === '_contract') return total
    return total + ((customer as any)[f.key] ? f.points : 0)
  }, 0)

  const compFields = scoreFields.map(f => ({
    label: f.label, points: f.points,
    done: f.key === '_contract' ? false : !!(customer as any)[f.key],
  }))

  const avg = Math.round(
    ((customer.quality_rating || 0) + (customer.delivery_rating || 0) + (customer.comm_rating || 0) + (customer.price_rating || 0) + (customer.flex_rating || 0)) / 5 * 10
  ) / 10

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
          <button onClick={() => router.push('/customers')}
            style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: S.card2, color: S.white, border: `1px solid rgba(255,255,255,0.18)` }}>← رجوع</button>
          <button onClick={async () => {
            setShowAiModal(true); setAiLoading(true); setAiAnalysis('')
            try {
              const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}` },
                body: JSON.stringify({
                  model: 'openrouter/auto',
                  messages: [{ role: 'user', content: `أنت مستشار تجاري متخصص. حلل هذا المورد:\n- الاسم: ${customer.company_name}\n- الدولة: ${customer.country}\n- المنتجات: ${customer.main_products}\n- التقييم: ${customer.rating}/10\n- الصفقات: ${customer.total_deals}\n\nقدم:\n## التقييم العام\n## نقاط القوة\n## نقاط الضعف\n## المخاطر\n## التوصيات` }],
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
          <button style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>تصدير PDF</button>
        </div>
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
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{customer.company_name}</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px', justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, background: S.gold3, color: S.gold, border: `1px solid rgba(201,168,76,0.2)` }}>Manufacturer</span>
              <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600, background: S.gold3, color: S.gold, border: `1px solid rgba(201,168,76,0.2)` }}>Exporter</span>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {customer.country && <div style={{ fontSize: '11px', color: S.muted }}>{customer.country}{customer.city ? ` / ${customer.city}` : ''}</div>}
              <div style={{ fontSize: '11px', color: S.muted }}>تسجيل: {new Date(customer.created_at).toLocaleDateString('ar-EG')}</div>
              <div style={{ fontSize: '11px', color: S.muted }}>{formatSupNum(customer.customer_number)}</div>
              {customer.last_contact_date && <div style={{ fontSize: '11px', color: S.gold }}>آخر تواصل: {timeAgo(customer.last_contact_date)}</div>}
            </div>
          </div>
          <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(customer.company_name)}
          </div>
        </div>

        {/* شريط الحالة */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: '8px', padding: '8px 14px', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: S.green }}>مورد موثّق ✓</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: S.green, fontWeight: 500 }}>
            {customer.last_contact_date ? `آخر تواصل: ${timeAgo(customer.last_contact_date)}` : 'لم يتم التواصل بعد'}
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: S.green }} />
          </div>
        </div>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'إجمالي الصفقات', val: customer.total_deals || 0, color: S.gold },
            { label: 'إجمالي المبلغ', val: customer.total_amount ? `$${customer.total_amount.toLocaleString()}` : '$0', color: S.green },
{ label: 'التقييم', val: `${avg > 0 ? avg : (customer?.rating || 0)}/10`, color: S.blue },            { label: 'المبيعات السنوية', val: customer.annual_sales || '—', color: S.amber },
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
                  if (editMode) { await supabase.from('customers').update(editData).eq('id', id); window.location.reload() }
                  setEditMode(!editMode)
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
                      {f.key === 'website' && (customer as any)[f.key] ? (
                        <a href={(customer as any)[f.key].startsWith('http') ? (customer as any)[f.key] : `https://${(customer as any)[f.key]}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: S.gold, textDecoration: 'none', borderBottom: `1px solid ${S.gold}`, display: 'inline-block', paddingBottom: '1px' }}>
                          {(customer as any)[f.key]}
                        </a>
                      ) : ((customer as any)[f.key] || '—')}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>تاريخ التسجيل</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{new Date(customer.created_at).toLocaleDateString('ar-EG')}</div>
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
              <td style={{ padding: '10px', fontWeight: 700, color: S.gold }}>${item.price?.toLocaleString()}</td>
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
          const { error } = await supabase.from('customers').update({ notes: editData2.notes }).eq('id', id);
          if (!error) setCustomer({ ...customer, notes: editData2.notes });
        } else {
          setEditData2({ ...editData2, notes: customer.notes || '' });
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
        {customer.notes ? (
          customer.notes.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
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

        {tab === 'contact' && <ContactTab customer={customer} customerId={id} setCustomer={setCustomer} />}
        {tab === 'products' && <ProductsTab customerId={id} mainProducts={customer.main_products} />}

        {tab === 'trading' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>القدرات التجارية</div>
              {[
                { label: 'المبيعات السنوية', val: customer.annual_sales || '—', big: true },
                { label: 'الصفقات معنا', val: `${customer.total_deals || 0} صفقة` },
                { label: 'إجمالي المبلغ', val: customer.total_amount ? `$${customer.total_amount.toLocaleString()}` : '$0' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '14px', textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>{f.label}</div>
                  <div style={{ fontSize: f.big ? '22px' : '13px', fontWeight: 700, color: f.big ? S.gold : S.white }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>المنتجات</div>
              {customer.main_products ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                  {customer.main_products.split('،').map((p, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 500 }}>{p.trim()}</span>
                  ))}
                </div>
              ) : <div style={{ color: S.muted, fontSize: '12px', textAlign: 'right' }}>لم تُضف منتجات بعد</div>}
            </div>
          </div>
        )}

        {tab === 'deals' && (
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '16px', textAlign: 'right' }}>سجل الصفقات</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'إجمالي الصفقات', val: customer.total_deals || 0, color: S.gold },
                { label: 'إجمالي المبلغ', val: customer.total_amount ? `$${customer.total_amount.toLocaleString()}` : '$0', color: S.green },
                { label: 'متوسط الصفقة', val: customer.total_deals ? `$${Math.round((customer.total_amount || 0) / customer.total_deals).toLocaleString()}` : '—', color: S.blue },
                { label: 'نسبة الالتزام', val: '100%', color: S.green },
              ].map((m, i) => (
                <div key={i} style={{ background: S.card2, borderRadius: '10px', padding: '12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, marginBottom: '3px' }}>{m.val}</div>
                  <div style={{ fontSize: '10px', color: S.muted }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: '13px' }}>سيتم إضافة تفاصيل الصفقات قريباً</div>
          </div>
        )}

        {tab === 'docs' && <DocsTab customerId={id} />}
{tab === 'rating' && (
  <RatingTab 
    customer={customer} 
    customerId={id} 
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
                <div style={{ fontSize: '11px', color: S.muted, marginTop: '2px' }}>{customer.company_name}</div>
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