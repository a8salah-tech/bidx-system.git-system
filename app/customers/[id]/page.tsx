'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ===== نوع بيانات العميل — بناءً على الأعمدة الفعلية في قاعدة البيانات =====
interface Customer {
  id: string
  created_at: string
  customer_number: number
  full_name: string
  company_name: string
  country: string
  city: string
  status: string
  email: string
  phone: string
  interest: string
  notes: string
  total_deals: string   // text في قاعدة البيانات
  total_amount: string  // text في قاعدة البيانات
  main_products: string
  last_contact_date: string
  website: string
  // أعمدة التقييم الفعلية
  quality_rating: number   // عملية الشراء الأولى
  delivery_rating: number  // عملية الشراء الثانية
  comm_rating: number      // عملية الشراء الثالثة
  price_rating: number     // عملية الشراء الرابعة
  flex_rating: number      // عملية الشراء الخامسة
  customer_type: string
}

// ===== دوال مساعدة =====
function timeAgo(date: string) {
  if (!date) return null
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'منذ يوم'
  if (diff < 7) return `منذ ${diff} أيام`
  if (diff < 30) return `منذ ${Math.floor(diff / 7)} أسابيع`
  return `منذ ${Math.floor(diff / 30)} أشهر`
}

function formatCustNum(n: number) {
  return `CUS-${String(n).padStart(5, '0')}`
}

// ===== وسائل التواصل =====
const METHODS: Record<string, { label: string; icon: string; color: string }> = {
  email:    { label: 'إيميل',  icon: '✉️', color: '#3B82F6' },
  whatsapp: { label: 'واتساب', icon: '📱', color: '#22C55E' },
  call:     { label: 'مكالمة', icon: '📞', color: '#F59E0B' },
  meeting:  { label: 'اجتماع', icon: '🤝', color: '#8B5CF6' },
  visit:    { label: 'زيارة',  icon: '🏢', color: '#C9A84C' },
}

// ===== نظام الألوان =====
const S = {
  navy:   '#0A1628', navy2: '#0F2040', navy3: '#152A52',
  gold:   '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white:  '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green:  '#22C55E', red: '#EF4444', blue: '#3B82F6',
  amber:  '#F59E0B', purple: '#8B5CF6',
  card:   'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.08)',
}

// ===== style مشترك للحقول =====
const fieldStyle: React.CSSProperties = {
  width: '100%', background: S.navy2,
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: '8px', padding: '9px 12px',
  fontSize: '13px', color: S.white,
  outline: 'none', fontFamily: 'Tajawal, sans-serif',
  boxSizing: 'border-box', direction: 'rtl', textAlign: 'right',
}

// ===== مكون نجوم =====
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 16 16"
          style={{ fill: i < value ? S.gold : 'rgba(201,168,76,0.15)' }}>
          <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
        </svg>
      ))}
    </div>
  )
}

// ===================================================
// تبويب: جهات التواصل
// ===================================================
function ContactTab({ customer, customerId }: { customer: any; customerId: string }) {
  const [contacts, setContacts]         = useState<any[]>([])
  const [showForm, setShowForm]         = useState(false)
  const [editOfficial, setEditOfficial] = useState(false)
  const [officialData, setOfficialData] = useState({
    email:    customer?.email || '',
    phone:    customer?.phone || '',
    website:  customer?.website || '',
  })
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', whatsapp: '', notes: '' })

  useEffect(() => {
    const saved = localStorage.getItem(`cust_contacts_${customerId}`)
    if (saved) { setContacts(JSON.parse(saved)); return }
    const defaults: any[] = []
    if (customer.full_name) {
      defaults.push({ id: '1', name: customer.full_name, role: 'صاحب الحساب', email: customer.email || '', phone: customer.phone || '', whatsapp: customer.phone || '', notes: '' })
    }
    setContacts(defaults)
  }, [customerId])

  function save(list: any[]) {
    setContacts(list)
    localStorage.setItem(`cust_contacts_${customerId}`, JSON.stringify(list))
  }

  function addContact() {
    if (!form.name) return
    save([...contacts, { ...form, id: Date.now().toString() }])
    setForm({ name: '', role: '', email: '', phone: '', whatsapp: '', notes: '' })
    setShowForm(false)
  }

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>

      {/* جهات التواصل */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ width: 28, height: 28, borderRadius: 8, background: S.gold, border: 'none', color: S.navy, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.muted }}>جهات التواصل</div>
        </div>

        {showForm && (
          <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.gold, marginBottom: 14, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>إضافة جهة تواصل</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'الاسم *',   key: 'name',     placeholder: 'اسم الشخص' },
                { label: 'الوظيفة',   key: 'role',     placeholder: 'مدير الشراء' },
                { label: 'الإيميل',   key: 'email',    placeholder: 'email@company.com' },
                { label: 'الموبايل',  key: 'phone',    placeholder: '+966 5xx xxx xxxx' },
                { label: 'واتساب',    key: 'whatsapp', placeholder: '+966 5xx xxx xxxx' },
                { label: 'ملاحظات',   key: 'notes',    placeholder: 'ملاحظات...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={fieldStyle}/>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addContact} style={{ background: S.gold, color: S.navy, border: 'none', padding: '7px 20px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>حفظ</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '7px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
            </div>
          </div>
        )}

        {contacts.length === 0
          ? <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لا توجد جهات تواصل — اضغط + لإضافة</div>
          : contacts.map(c => (
            <div key={c.id} style={{ background: S.card2, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12, flexDirection: 'row-reverse', marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#C9A84C,#0F2040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(c.name)}</div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <button onClick={() => save(contacts.filter(x => x.id !== c.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{c.name}</span>
                    {c.role && <span style={{ fontSize: 10, color: S.muted, marginRight: 8, fontFamily: 'Tajawal, sans-serif' }}>{c.role}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {c.whatsapp && <div style={{ fontSize: 11, color: S.green, fontFamily: 'Tajawal, sans-serif' }}>📱 {c.whatsapp}</div>}
                  {c.phone    && <div style={{ fontSize: 11, color: S.muted,  fontFamily: 'Tajawal, sans-serif' }}>☎️ {c.phone}</div>}
                  {c.email    && <div style={{ fontSize: 11, color: '#93C5FD', fontFamily: 'Tajawal, sans-serif' }}>✉️ {c.email}</div>}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* بيانات التواصل الرسمية — بدون آخر تواصل وطريقة التواصل */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={async () => {
            if (editOfficial) await supabase.from('customers').update(officialData).eq('id', customerId)
            setEditOfficial(!editOfficial)
          }} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: `1px solid ${S.border}`, background: editOfficial ? S.gold : 'transparent', color: editOfficial ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600 }}>
            {editOfficial ? 'حفظ' : 'تعديل'}
          </button>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>بيانات التواصل الرسمية</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'الإيميل الرسمي',    key: 'email' },
            { label: 'رقم الهاتف',        key: 'phone' },
            { label: 'الموقع الإلكتروني', key: 'website' },
          ].map(f => (
            <div key={f.key} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, fontFamily: 'Tajawal, sans-serif' }}>{f.label}</div>
              {editOfficial
                ? <input type="text" value={(officialData as any)[f.key] || ''}
                    onChange={e => setOfficialData({ ...officialData, [f.key]: e.target.value })}
                    style={{ ...fieldStyle, border: `1px solid rgba(201,168,76,0.3)` }}/>
                : <div style={{ fontSize: 13, color: S.white, fontFamily: 'Tajawal, sans-serif' }}>{(customer as any)[f.key] || '—'}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===================================================
// تبويب: الوثائق
// ===================================================
function DocsTab({ customerId }: { customerId: string }) {
  const [docs, setDocs]               = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [uploading, setUploading]     = useState(false)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [docDetails, setDocDetails]   = useState({ type: '', exp: new Date().toISOString().split('T')[0] })

  const fetchDocs = async () => {
    const { data } = await supabase.from('customer_documents').select('*')
      .eq('customer_id', customerId).order('created_at', { ascending: false })
    setDocs(data || [])
  }
  useEffect(() => { fetchDocs() }, [customerId])

  const handleUpload = async () => {
    if (!fileToUpload || !docDetails.type) { alert('اختر النوع والملف'); return }
    setUploading(true)
    try {
      const ext  = fileToUpload.name.split('.').pop()
      const path = `${customerId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('customer-docs').upload(path, fileToUpload)
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('customer_documents').insert([{
        customer_id: customerId, doc_type: docDetails.type,
        file_path: path, expiry_date: docDetails.exp || null, doc_name: fileToUpload.name,
      }])
      if (dbErr) throw dbErr
      alert('✅ تم حفظ الوثيقة'); setSelectedDoc(null); setFileToUpload(null); await fetchDocs()
    } catch (err: any) { alert('خطأ: ' + err.message) }
    finally { setUploading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setSelectedDoc('new')}
            style={{ padding: '7px 18px', borderRadius: 8, background: S.gold, border: 'none', color: S.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            + رفع وثيقة
          </button>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>الوثائق الرسمية — {docs.length} وثيقة</div>
        </div>
        {docs.length === 0
          ? <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لا توجد وثائق بعد</div>
          : docs.map(doc => (
            <div key={doc.id} style={{ background: S.card2, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/customer-docs/${doc.file_path}`)}
                  style={{ background: 'rgba(201,168,76,0.08)', border: `1px solid ${S.gold}`, color: S.gold, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>معاينة 👁️</button>
                <button onClick={async () => {
                  if (!window.confirm('حذف الوثيقة نهائياً؟')) return
                  await supabase.storage.from('customer-docs').remove([doc.file_path])
                  await supabase.from('customer_documents').delete().eq('id', doc.id)
                  await fetchDocs()
                }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: S.red, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>✕</button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{doc.doc_type}</div>
                <div style={{ fontSize: 10, color: S.muted, marginTop: 2, fontFamily: 'Tajawal, sans-serif' }}>{doc.doc_name}</div>
                <div style={{ fontSize: 10, color: doc.expiry_date ? S.amber : S.green, marginTop: 2, fontFamily: 'Tajawal, sans-serif' }}>
                  {doc.expiry_date ? `ينتهي: ${doc.expiry_date}` : 'مستند دائم'}
                </div>
              </div>
            </div>
          ))}
      </div>

      {selectedDoc !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: S.navy2, border: `1px solid ${S.gold}33`, borderRadius: 24, width: '100%', maxWidth: 420, padding: 32, direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: S.white }}>رفع وثيقة جديدة</div>
              <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }} style={{ background: S.card2, border: 'none', color: S.muted, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 8 }}>نوع الوثيقة *</label>
              <select value={docDetails.type} onChange={e => setDocDetails({ ...docDetails, type: e.target.value })}
                style={{ ...fieldStyle, cursor: 'pointer' }}>
                <option value="">اختر النوع...</option>
                {['السجل التجاري', 'البطاقة الضريبية', 'شهادة القيمة المضافة', 'عقد توريد', 'فاتورة', 'بوليصة شحن', 'خطاب اعتماد', 'أخرى'].map(t => (
                  <option key={t} value={t} style={{ background: S.navy2 }}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 8 }}>تاريخ الانتهاء</label>
              <input type="date" value={docDetails.exp} onChange={e => setDocDetails({ ...docDetails, exp: e.target.value })}
                style={{ ...fieldStyle, colorScheme: 'dark' as any }}/>
            </div>
            <div style={{ marginBottom: 24, position: 'relative', background: S.navy, border: `2px dashed ${S.border}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <input type="file" onChange={e => setFileToUpload(e.target.files?.[0] ?? null)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
              <div style={{ fontSize: 13, color: fileToUpload ? S.green : S.muted }}>{fileToUpload ? `✅ ${fileToUpload.name}` : 'اضغط أو اسحب الملف هنا'}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setSelectedDoc(null); setFileToUpload(null) }} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'transparent', border: `1px solid ${S.border}`, color: S.white, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
              <button onClick={handleUpload} disabled={uploading} style={{ flex: 2, padding: 12, borderRadius: 10, background: uploading ? S.muted : S.gold, border: 'none', color: S.navy, fontSize: 13, fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {uploading ? '⏳ جاري الرفع...' : 'رفع الوثيقة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================================================
// تبويب: التقييم — يستخدم الأعمدة الفعلية
// quality_rating, delivery_rating, comm_rating, price_rating, flex_rating
// كل عمود = 0 أو 2، مجموع 5 أعمدة = 10 نقاط = 5 نجوم
// ===================================================
function RatingTab({ customer, customerId }: { customer: any; customerId: string }) {
  const [ratings, setRatings] = useState({
    quality_rating:  customer?.quality_rating  || 0,
    delivery_rating: customer?.delivery_rating || 0,
    comm_rating:     customer?.comm_rating     || 0,
    price_rating:    customer?.price_rating    || 0,
    flex_rating:     customer?.flex_rating     || 0,
  })
  const [notes, setNotes]           = useState<any[]>([])
  const [newNote, setNewNote]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [loaded, setLoaded]         = useState(false)

  // عدد النجوم = عدد التقييمات المكتملة (كل تقييم > 0 = نجمة)
  const completedCount = Object.values(ratings).filter(v => v > 0).length
  const starRating     = completedCount          // 0-5 نجوم
  const ratingOut10    = starRating * 2          // 0-10

  useEffect(() => {
    async function fetchNotes() {
      const { data } = await supabase.from('customer_notes')
        .select('*, profiles:created_by (full_name, department)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setNotes(data || [])
      setLoaded(true)
    }
    fetchNotes()
  }, [customerId])

  async function saveRating() {
    if (!window.confirm(`حفظ تقييم ${starRating}/5 نجوم (${ratingOut10}/10) ؟`)) return
    setSaving(true)
    const { error } = await supabase.from('customers').update({
      quality_rating:  ratings.quality_rating,
      delivery_rating: ratings.delivery_rating,
      comm_rating:     ratings.comm_rating,
      price_rating:    ratings.price_rating,
      flex_rating:     ratings.flex_rating,
    }).eq('id', customerId)

    if (error) {
      alert('خطأ في الحفظ: ' + error.message)
      setSaving(false)
      return
    }
    setSaving(false)
    alert('✅ تم حفظ التقييم بنجاح')
    sessionStorage.setItem('activeTab', 'rating')
    window.location.reload()
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: res } = await supabase.from('customer_notes')
      .insert([{ customer_id: customerId, note: newNote.trim(), created_by: user?.id }])
      .select('*, profiles:created_by (full_name, department)').single()
    if (res) setNotes([res, ...notes])
    setNewNote('')
    setSavingNote(false)
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm('حذف الملاحظة؟')) return
    await supabase.from('customer_notes').delete().eq('id', noteId)
    setNotes(notes.filter(n => n.id !== noteId))
  }

  if (!loaded) return <div style={{ textAlign: 'center', color: S.muted, padding: '40px 0', fontFamily: 'Tajawal, sans-serif' }}>جاري التحميل...</div>

  const dealLabels = [
    { key: 'quality_rating',  label: 'عملية الشراء الأولى',  desc: 'أول صفقة ناجحة' },
    { key: 'delivery_rating', label: 'عملية الشراء الثانية', desc: 'صفقة متكررة' },
    { key: 'comm_rating',     label: 'عملية الشراء الثالثة', desc: 'عميل منتظم' },
    { key: 'price_rating',    label: 'عملية الشراء الرابعة', desc: 'عميل وفي' },
    { key: 'flex_rating',     label: 'عملية الشراء الخامسة', desc: 'عميل مميز ⭐' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 20, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>
          تقييم العميل — كل عملية شراء = نجمة (2 نقطة) — المجموع {ratingOut10}/10
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
          {/* عرض التقييم الكلي */}
          <div style={{ textAlign: 'center', background: S.card2, borderRadius: 14, padding: '20px 24px', minWidth: 120, flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: starRating >= 4 ? S.green : starRating >= 2 ? S.gold : S.muted, lineHeight: 1 }}>
              {starRating}
            </div>
            <div style={{ fontSize: 11, color: S.muted, margin: '4px 0 8px', fontFamily: 'Tajawal, sans-serif' }}>من 5 نجوم</div>
            <StarRating value={starRating}/>
            <div style={{ fontSize: 10, color: S.muted, marginTop: 8, fontFamily: 'Tajawal, sans-serif' }}>{ratingOut10}/10 نقطة</div>
          </div>

          {/* عمليات الشراء */}
          <div style={{ flex: 1 }}>
            {dealLabels.map(d => {
              const isActive = (ratings as any)[d.key] > 0
              return (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, direction: 'rtl' }}>
                  <button
                    onClick={() => setRatings({ ...ratings, [d.key]: isActive ? 0 : 2 })}
                    style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: isActive ? S.gold : S.card2, border: `2px solid ${isActive ? S.gold : S.border}`, color: isActive ? S.navy : S.muted, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                    {isActive ? '★' : '☆'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: isActive ? S.gold : S.muted, fontFamily: 'Tajawal, sans-serif' }}>{isActive ? '+2 نقطة' : 'لم تتم بعد'}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? S.white : S.muted, fontFamily: 'Tajawal, sans-serif' }}>{d.label}</span>
                    </div>
                    <div style={{ height: 6, background: S.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: isActive ? '100%' : '0%', background: isActive ? `linear-gradient(90deg,${S.gold},${S.gold2})` : 'transparent', borderRadius: 3, transition: 'width .3s' }}/>
                    </div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 3, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>{d.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button onClick={saveRating} disabled={saving}
          style={{ background: saving ? S.muted : S.gold, color: S.navy, border: 'none', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التقييم'}
        </button>
      </div>

      {/* الملاحظات الداخلية */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 14, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>الملاحظات الداخلية</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={addNote} disabled={savingNote}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', flexShrink: 0 }}>
            {savingNote ? '...' : 'إضافة'}
          </button>
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
            placeholder="اكتب ملاحظة عن العميل..." rows={2}
            style={{ ...fieldStyle, resize: 'none' } as React.CSSProperties}/>
        </div>
        {notes.length === 0
          ? <div style={{ textAlign: 'center', color: S.muted, padding: '20px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لا توجد ملاحظات بعد</div>
          : notes.map((n, idx) => (
            <div key={n.id || idx} style={{ background: S.card2, borderRadius: 8, padding: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.gold, marginBottom: 2, fontFamily: 'Tajawal, sans-serif' }}>
                  {n.profiles?.full_name || 'موظف'}{n.profiles?.department ? ` (${n.profiles.department})` : ''}
                </div>
                <div style={{ fontSize: 12, color: S.white, lineHeight: '1.6', marginBottom: 4, fontFamily: 'Tajawal, sans-serif' }}>{n.note}</div>
                <div style={{ fontSize: 10, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('ar-EG') : ''}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// ===================================================
// تبويب: المنتجات
// ===================================================
function ProductsTab({ customerId, mainProducts, onUpdate }: { customerId: string; mainProducts: string; onUpdate: (val: string) => void }) {
  const [products, setProducts]     = useState<string[]>(mainProducts ? mainProducts.split('،').map(p => p.trim()).filter(Boolean) : [])
  const [newProduct, setNewProduct] = useState('')
  const [saving, setSaving]         = useState(false)

  async function addProduct() {
    if (!newProduct.trim()) return
    const updated = [...products, newProduct.trim()]
    setProducts(updated); setNewProduct(''); setSaving(true)
    await supabase.from('customers').update({ main_products: updated.join('، ') }).eq('id', customerId)
    onUpdate(updated.join('، '))  // تحديث الـ state في الصفحة الرئيسية
    setSaving(false)
  }

  async function deleteProduct(p: string) {
    const updated = products.filter(x => x !== p)
    setProducts(updated)
    await supabase.from('customers').update({ main_products: updated.join('، ') }).eq('id', customerId)
    onUpdate(updated.join('، '))
  }

  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, direction: 'rtl' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 14, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>المنتجات التي يطلبها العميل</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={addProduct} disabled={saving}
          style={{ background: S.gold, color: S.navy, border: 'none', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', flexShrink: 0 }}>
          {saving ? '...' : '+ إضافة'}
        </button>
        <input type="text" value={newProduct} onChange={e => setNewProduct(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addProduct()}
          placeholder="اسم المنتج المطلوب..."
          style={fieldStyle}/>
      </div>
      {products.length === 0
        ? <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لم تُضف منتجات بعد</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {products.map((p, i) => (
            <div key={i} style={{ background: S.card2, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => deleteProduct(p)} style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: 13 }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Tajawal, sans-serif' }}>{p}</span>
                <span>🛒</span>
              </div>
            </div>
          ))}
        </div>}
    </div>
  )
}

// ===================================================
// الصفحة الرئيسية
// ===================================================
export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // ── كل الـ State ──
  const [customer,        setCustomer]       = useState<Customer | null>(null)
  const [loading,         setLoading]        = useState(true)
  const [aiAnalysis,      setAiAnalysis]     = useState('')
  const [aiLoading,       setAiLoading]      = useState(false)
  const [showAiModal,     setShowAiModal]    = useState(false)
  const [tab,             setTab]            = useState('overview')
  const [editMode,        setEditMode]       = useState(false)
  const [editData, setEditData] = useState({ full_name: '', company_name: '', country: '', city: '', website: '', customer_type: '' })
  const [editMode2,       setEditMode2]      = useState(false)
  const [editData2,       setEditData2]      = useState({ notes: '' })
  // ── سجل التواصل ──
  const [contacts2,       setContacts2]      = useState<any[]>([])
  const [showContactForm, setShowContactForm]= useState(false)
  const [contactPage,     setContactPage]    = useState(1)
  const [savingContact,   setSavingContact]  = useState(false)
  const [newContact,      setNewContact]     = useState({ date: new Date().toISOString().split('T')[0], method: 'whatsapp', notes: '' })
  // ── سجل الصفقات ──
  const [deals,           setDeals]          = useState<any[]>([])
  const [showDealForm,    setShowDealForm]   = useState(false)
  const [savingDeal,      setSavingDeal]     = useState(false)
  const [newDeal,         setNewDeal]        = useState({ date: new Date().toISOString().split('T')[0], name: '', amount: '', notes: '' })

  // ── تحميل البيانات ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('activeTab')
      if (saved) setTab(saved)
    }
    async function fetchCustomer() {
      const { data } = await supabase.from('customers').select('*').eq('id', id).single()
      setCustomer(data)
      if (data) {
        setEditData({ full_name: data.full_name || '', company_name: data.company_name || '', country: data.country || '', city: data.city || '', website: data.website || '' ,customer_type: data.customer_type})
        setEditData2({ notes: data.notes || '' })
      }
      setLoading(false)
    }
    fetchCustomer()
  }, [id])

  // ── تحميل سجل التواصل ──
  useEffect(() => {
    supabase.from('customer_contacts').select('*').eq('customer_id', id)
      .order('contact_date', { ascending: false })
      .then(({ data }) => setContacts2(data || []))
  }, [id])

  // ── تحميل سجل الصفقات ──
  useEffect(() => {
    supabase.from('customer_deals').select('*').eq('customer_id', id)
      .order('deal_date', { ascending: false })
      .then(({ data }) => setDeals(data || []))
  }, [id])

  // ── حفظ تواصل جديد ──
  async function saveContact() {
    if (!newContact.notes.trim()) { alert('اكتب ملاحظة'); return }
    setSavingContact(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: res } = await supabase.from('customer_contacts').insert([{
      customer_id: id, contact_date: newContact.date,
      method: newContact.method, notes: newContact.notes, created_by: user?.id,
    }]).select().single()
    if (res) {
      setContacts2([res, ...contacts2])
      await supabase.from('customers').update({ last_contact_date: newContact.date }).eq('id', id)
      setCustomer(prev => prev ? { ...prev, last_contact_date: newContact.date } : prev)
    }
    setNewContact({ date: new Date().toISOString().split('T')[0], method: 'whatsapp', notes: '' })
    setShowContactForm(false); setSavingContact(false)
  }

  // ── حفظ صفقة جديدة ──
  async function saveDeal() {
    if (!newDeal.name.trim()) { alert('أدخل اسم الصفقة'); return }
    setSavingDeal(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: res } = await supabase.from('customer_deals').insert([{
      customer_id: id, deal_date: newDeal.date,
      deal_name: newDeal.name, amount: newDeal.amount || '0', notes: newDeal.notes, created_by: user?.id,
    }]).select().single()
    if (res) {
      setDeals([res, ...deals])
      // تحديث إجمالي الصفقات والمبلغ
      const newTotal  = (parseInt(customer?.total_deals  || '0') + 1).toString()
      const newAmount = (parseFloat(customer?.total_amount || '0') + parseFloat(newDeal.amount || '0')).toString()
      await supabase.from('customers').update({ total_deals: newTotal, total_amount: newAmount }).eq('id', id)
      setCustomer(prev => prev ? { ...prev, total_deals: newTotal, total_amount: newAmount } : prev)
    }
    setNewDeal({ date: new Date().toISOString().split('T')[0], name: '', amount: '', notes: '' })
    setShowDealForm(false); setSavingDeal(false)
  }

  if (loading)   return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>جاري التحميل...</div>
  if (!customer) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>لم يتم العثور على العميل</div>

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  // ── اكتمال الملف ──
const scoreFields = [
    { label: 'الاسم',       key: 'full_name',      points: 13, done: !!customer.full_name },
    { label: 'نوع العميل',  key: 'customer_type',  points: 12, done: !!(customer as any).customer_type },
    { label: 'الدولة',      key: 'country',        points: 12, done: !!customer.country },
    { label: 'المنتجات',    key: 'interest',       points: 13, done: !!customer.interest },
    { label: 'الموبايل',    key: 'phone',          points: 13, done: !!customer.phone },
    { label: 'الإيميل',     key: 'email',          points: 12, done: !!customer.email },
    { label: 'أول صفقة',    key: '_deal',          points: 13, done: parseInt(customer.total_deals || '0') >= 1 },
    { label: 'الوثائق', key: '_docs', points: 12, done: parseInt(customer.total_deals || '0') >= 0 && contacts2.length >= 0 },
  ]
  const comp       = scoreFields.reduce((total, f) => total + (f.done ? f.points : 0), 0)
  const compFields = scoreFields.map(f => ({ label: f.label, done: f.done }))

  // ── التقييم من الأعمدة الفعلية ──
  const completedCount = [customer.quality_rating, customer.delivery_rating, customer.comm_rating, customer.price_rating, customer.flex_rating].filter(v => v && v > 0).length
  const starRating     = completedCount
  const ratingDisplay  = starRating * 2

  // ── حالة العميل ──
  const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active:      { label: 'عميل نشط ✓',  color: S.green, bg: 'rgba(34,197,94,0.08)'  },
    pending:     { label: 'قيد الانتظار', color: S.amber, bg: 'rgba(245,158,11,0.08)' },
    inactive:    { label: 'غير نشط',      color: S.red,   bg: 'rgba(239,68,68,0.08)'  },
    negotiating: { label: 'قيد التفاوض',  color: S.blue,  bg: 'rgba(59,130,246,0.08)' },
    completed:   { label: 'صفقة مكتملة', color: S.gold,  bg: 'rgba(201,168,76,0.08)' },
  }
  const statusInfo = STATUS_MAP[customer.status] || STATUS_MAP.active

  // ── Pagination سجل التواصل ──
  const perPage     = 3
  const totalPages2 = Math.ceil(contacts2.length / perPage)
  const paginated   = contacts2.slice((contactPage - 1) * perPage, contactPage * perPage)
  const firstContact = contacts2[contacts2.length - 1]

  const tabs = [
    { key: 'overview', label: '🏠 نظرة عامة' },
    { key: 'journey',  label: '🗺️ رحلة العميل' },
    { key: 'contact',  label: '📞 التواصل' },
    { key: 'products', label: '🛒 المنتجات' },
    { key: 'deals',    label: '📋 الصفقات' },
    { key: 'docs',     label: '📁 الوثائق' },
    { key: 'rating',   label: '⭐ التقييم' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: S.white, fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>

      {/* شريط الأدوات */}
      <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.push('/customers')}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: S.card2, color: S.white, border: `1px solid rgba(255,255,255,0.18)` }}>
            ← رجوع
          </button>
          <button onClick={async () => {
            setShowAiModal(true); setAiLoading(true); setAiAnalysis('')
            try {
              const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}` },
                body: JSON.stringify({ model: 'openrouter/auto', messages: [{ role: 'user', content: `حلل هذا العميل:\n- الاسم: ${customer.full_name}\n- الشركة: ${customer.company_name}\n- الدولة: ${customer.country}\n- المنتجات: ${customer.main_products}\n- التقييم: ${ratingDisplay}/10\n- الصفقات: ${customer.total_deals}\n- الاهتمام: ${customer.interest}\n\nقدم: تقييم العميل، الفرص التجارية، المخاطر، استراتيجية التعامل` }], max_tokens: 800 })
              })
              const data = await res.json()
              setAiAnalysis(data?.choices?.[0]?.message?.content || 'تعذر التحليل')
            } catch { setAiAnalysis('تعذر الاتصال') }
            finally { setAiLoading(false) }
          }} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: S.gold, color: S.navy }}>
            ✨ تحليل AI
          </button>
          <button style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>
            تصدير PDF
          </button>
        </div>
      </div>

      {/* المحتوى */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>

        {/* بطاقة العميل */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, marginBottom: 12, display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 16 }}>
          {/* اكتمال الملف */}
          <div style={{ textAlign: 'center', background: S.card2, borderRadius: 12, padding: '14px 18px', minWidth: 140, flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: comp >= 80 ? S.green : comp >= 50 ? S.gold : S.red, lineHeight: 1 }}>{comp}%</div>
            <div style={{ fontSize: 10, color: S.muted, margin: '3px 0 8px', fontFamily: 'Tajawal, sans-serif' }}>اكتمال الملف</div>
            <div style={{ height: 4, background: S.border, borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${comp}%`, background: comp >= 80 ? S.green : `linear-gradient(90deg,${S.gold},${S.gold2})`, borderRadius: 2 }}/>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              {compFields.map(f => (
                <span key={f.label} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 5, fontFamily: 'Tajawal, sans-serif', background: f.done ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.08)', color: f.done ? S.green : S.red }}>
                  {f.label} {f.done ? '✓' : '✗'}
                </span>
              ))}
            </div>
          </div>

          {/* معلومات العميل */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{customer.full_name}</div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: statusInfo.bg, color: statusInfo.color, fontWeight: 700, fontFamily: 'Tajawal, sans-serif' }}>{statusInfo.label}</span>
            </div>
            {customer.company_name && <div style={{ fontSize: 14, color: S.gold2, fontWeight: 600, marginBottom: 6, fontFamily: 'Tajawal, sans-serif' }}>🏢 {customer.company_name}</div>}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 8 }}>
              {customer.country && <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>📍 {customer.country}{customer.city ? ` / ${customer.city}` : ''}</div>}
              <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>تسجيل: {new Date(customer.created_at).toLocaleDateString('ar-EG')}</div>
              <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{formatCustNum(customer.customer_number)}</div>
              {customer.last_contact_date && <div style={{ fontSize: 11, color: S.gold, fontFamily: 'Tajawal, sans-serif' }}>آخر تواصل: {timeAgo(customer.last_contact_date)}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{starRating} نجمة من 5 ({ratingDisplay}/10)</span>
              <StarRating value={starRating}/>
            </div>
          </div>

          {/* الأفاتار */}
          <div style={{ width: 58, height: 58, borderRadius: 14, background: 'linear-gradient(135deg,#C9A84C,#0A1628)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(customer.full_name || customer.company_name)}
          </div>
        </div>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'إجمالي الصفقات', val: customer.total_deals  || '0', color: S.gold  },
            { label: 'إجمالي المبلغ',  val: customer.total_amount ? `$${parseFloat(customer.total_amount).toLocaleString()}` : '$0', color: S.green },
            { label: 'التقييم',        val: `${starRating} ★ (${ratingDisplay}/10)`, color: S.blue },
            { label: 'الاهتمام',       val: customer.interest || '—', color: S.amber },
          ].map((m, i) => (
            <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 14, textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.color, marginBottom: 4, fontFamily: 'Tajawal, sans-serif' }}>{m.val}</div>
              <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* التبويبات */}
        <div style={{ display: 'flex', gap: 2, background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: 3, marginBottom: 14, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); sessionStorage.setItem('activeTab', t.key) }}
              style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: tab === t.key ? S.white : S.muted, borderRadius: 7, cursor: 'pointer', border: tab === t.key ? `1px solid ${S.border}` : 'none', background: tab === t.key ? S.navy2 : 'transparent', fontFamily: 'Tajawal, sans-serif', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ نظرة عامة ══ */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* معلومات العميل */}
            
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>معلومات العميل</div>
                <button onClick={async () => {
                  if (editMode) { await supabase.from('customers').update(editData).eq('id', id); setCustomer(prev => prev ? { ...prev, ...editData } : prev) }
                  setEditMode(!editMode)
                }} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: `1px solid ${S.border}`, background: editMode ? S.gold : 'transparent', color: editMode ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 600 }}>
                  {editMode ? 'حفظ' : 'تعديل'}
                </button>
              </div>
              {/* نوع العميل */}
              <div style={{ marginBottom: 12, textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 3, fontFamily: 'Tajawal, sans-serif' }}>نوع العميل</div>
                {editMode ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['شركة', 'فرد'].map(type => (
                      <button key={type} onClick={() => setEditData({ ...editData, customer_type: type })}
                        style={{ padding: '6px 18px', borderRadius: 8, border: `1px solid ${editData.customer_type === type ? S.gold : S.border}`, background: editData.customer_type === type ? S.gold3 : 'transparent', color: editData.customer_type === type ? S.gold2 : S.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {type === 'شركة' ? '🏢 شركة' : '👤 فرد'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: S.white, fontFamily: 'Tajawal, sans-serif' }}>
                    {(customer as any).customer_type === 'شركة' ? '🏢 شركة' : (customer as any).customer_type === 'فرد' ? '👤 فرد' : '—'}
                  </div>
                )}
              </div>
              {[
                { label: 'الاسم الكامل',  key: 'full_name' },
                { label: 'اسم الشركة',    key: 'company_name' },
                { label: 'الدولة',        key: 'country' },
                { label: 'المدينة',       key: 'city' },
                { label: 'الموقع',        key: 'website' },
                { label: 'الاهتمام',      key: 'interest' },
              ].map(f => (
              
                <div key={f.key} style={{ marginBottom: 12, textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 3, fontFamily: 'Tajawal, sans-serif' }}>{f.label}</div>
                  {editMode
                    ? <input type="text" value={(editData as any)[f.key] || ''} onChange={e => setEditData({ ...editData, [f.key]: e.target.value })} style={{ ...fieldStyle, border: `1px solid rgba(201,168,76,0.3)` }}/>
                    : <div style={{ fontSize: 13, color: S.white, fontFamily: 'Tajawal, sans-serif' }}>{(customer as any)[f.key] || '—'}</div>}
                </div>
              ))}
            </div>

            {/* العمود الأيسر */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* المنتجات المطلوبة — تتحدث تلقائياً عند الإضافة */}
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 12, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>🛒 المنتجات المطلوبة</div>
                {(customer.main_products || customer.interest) ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    {(customer.main_products || customer.interest || '').split('،').map((p: string, i: number) => (
                      <span key={i} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 500, fontFamily: 'Tajawal, sans-serif' }}>
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                ) : <div style={{ color: S.muted, fontSize: 12, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>لم تُضف منتجات بعد</div>}
              </div>

              {/* سجل التواصل */}
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}> سجل التواصل</div>
                    {firstContact && (
                      <div style={{ fontSize: 10, color: S.gold, marginTop: 2, fontFamily: 'Tajawal, sans-serif' }}>
                        أول اتصال: {new Date(firstContact.contact_date).toLocaleDateString('ar-EG')} عبر {METHODS[firstContact.method]?.label || firstContact.method}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowContactForm(!showContactForm)}
                    style={{ padding: '6px 14px', borderRadius: 7, background: S.gold, border: 'none', color: S.navy, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    + تواصل جديد
                  </button>
                </div>

                {showContactForm && (
                  <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>التاريخ</label>
                        <input type="date" value={newContact.date} onChange={e => setNewContact({ ...newContact, date: e.target.value })}
                          style={{ ...fieldStyle, colorScheme: 'dark' as any }}/>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>وسيلة التواصل</label>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {Object.entries(METHODS).map(([key, m]) => (
                            <button key={key} onClick={() => setNewContact({ ...newContact, method: key })}
                              style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${newContact.method === key ? m.color : S.border}`, background: newContact.method === key ? `${m.color}22` : 'transparent', color: newContact.method === key ? m.color : S.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: newContact.method === key ? 700 : 400 }}>
                              {m.icon} {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>ملاحظات *</label>
                      <textarea value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                        placeholder="ما الذي تم مناقشته..." rows={3}
                        style={{ ...fieldStyle, resize: 'none' } as React.CSSProperties}/>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveContact} disabled={savingContact}
                        style={{ background: S.gold, color: S.navy, border: 'none', padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                        {savingContact ? '⏳...' : '💾 حفظ'}
                      </button>
                      <button onClick={() => setShowContactForm(false)}
                        style={{ background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '8px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                    </div>
                  </div>
                )}

                {contacts2.length === 0
                  ? <div style={{ textAlign: 'center', color: S.muted, padding: '24px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لا يوجد سجل تواصل بعد</div>
                  : <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {paginated.map((c, i) => {
                        const m = METHODS[c.method] || { label: c.method, icon: '📌', color: S.muted }
                        return (
                          <div key={c.id || i} style={{ background: S.card2, borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: 'row-reverse' }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{m.icon}</div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 10, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{new Date(c.contact_date).toLocaleDateString('ar-EG')}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: m.color, fontFamily: 'Tajawal, sans-serif' }}>{m.icon} {m.label}</span>
                              </div>
                              <div style={{ fontSize: 12, color: S.white, lineHeight: '1.6', fontFamily: 'Tajawal, sans-serif' }}>{c.notes}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {totalPages2 > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
                        <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{(contactPage-1)*perPage+1} – {Math.min(contactPage*perPage, contacts2.length)} من {contacts2.length}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setContactPage(p => Math.max(1, p-1))} disabled={contactPage === 1} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${S.border}`, background: 'transparent', color: contactPage === 1 ? S.muted : S.white, cursor: contactPage === 1 ? 'not-allowed' : 'pointer', fontSize: 11, fontFamily: 'Tajawal, sans-serif' }}>→ السابق</button>
                          <button onClick={() => setContactPage(p => Math.min(totalPages2, p+1))} disabled={contactPage === totalPages2} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${S.border}`, background: 'transparent', color: contactPage === totalPages2 ? S.muted : S.white, cursor: contactPage === totalPages2 ? 'not-allowed' : 'pointer', fontSize: 11, fontFamily: 'Tajawal, sans-serif' }}>← التالي</button>
                        </div>
                      </div>
                    )}
                  </>}
              </div>

              {/* التقرير الاستراتيجي */}
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}> التقرير الاستراتيجي</div>
                  <button onClick={async () => {
                    if (editMode2) {
                      await supabase.from('customers').update({ notes: editData2.notes }).eq('id', id)
                      setCustomer(prev => prev ? { ...prev, notes: editData2.notes } : prev)
                    } else { setEditData2({ notes: customer.notes || '' }) }
                    setEditMode2(!editMode2)
                  }} style={{ fontSize: 10, padding: '4px 12px', borderRadius: 6, border: `1px solid ${S.gold}66`, background: editMode2 ? S.gold : 'transparent', color: editMode2 ? S.navy : S.gold, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}>
                    {editMode2 ? 'حفظ' : 'تعديل'}
                  </button>
                </div>
                {editMode2
                  ? <textarea value={editData2.notes} onChange={e => setEditData2({ ...editData2, notes: e.target.value })}
                      placeholder="اكتب ملاحظاتك... استخدم ** للنقاط المهمة" rows={4}
                      style={{ ...fieldStyle, border: `1px solid ${S.gold}33`, lineHeight: '1.6', resize: 'none' } as React.CSSProperties}/>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {customer.notes ? customer.notes.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
                      const isBold = line.trim().startsWith('**'); const text = line.replace(/\*\*/g, '').trim()
                      return (
                        <div key={i} style={{ padding: isBold ? '10px 12px' : '3px 0', background: isBold ? 'rgba(201,168,76,0.07)' : 'transparent', borderRight: isBold ? `3px solid ${S.gold}` : 'none', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          {isBold && <span>📌</span>}
                          <span style={{ fontSize: isBold ? 13 : 12, fontWeight: isBold ? 700 : 400, color: isBold ? S.gold : S.white, lineHeight: '1.7', flex: 1, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>{text}</span>
                        </div>
                      )
                    }) : <div style={{ color: S.muted, fontSize: 12, textAlign: 'center', padding: '20px 0', fontFamily: 'Tajawal, sans-serif' }}>لا توجد بيانات. اضغط تعديل.</div>}
                  </div>}
              </div>
            </div>
          </div>
        )}

        {/* ══ رحلة العميل ══ */}
        {tab === 'journey' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 20, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>🗺️ الخط الزمني لرحلة العميل</div>
              <div style={{ position: 'relative', paddingRight: 32 }}>
                <div style={{ position: 'absolute', right: 12, top: 0, bottom: 0, width: 2, background: S.border }}/>
                {[
                  { title: 'أول اتصال',  done: !!customer.last_contact_date,                   icon: '📞', val: customer.last_contact_date ? timeAgo(customer.last_contact_date) : 'لم يتم بعد' },
                  { title: 'عرض أسعار',  done: !!customer.interest,                             icon: '📋', val: customer.interest || 'لم يتم بعد' },
                  { title: 'أول صفقة',   done: parseInt(customer.total_deals || '0') >= 1,      icon: '🤝', val: parseInt(customer.total_deals || '0') >= 1 ? `${customer.total_deals} صفقة` : 'لم تتم بعد' },
                  { title: 'عميل متكرر', done: parseInt(customer.total_deals || '0') >= 3,      icon: '🔄', val: parseInt(customer.total_deals || '0') >= 3 ? 'عميل منتظم ✓' : 'مطلوب 3 صفقات' },
                  { title: 'عميل مميز',  done: parseInt(customer.total_deals || '0') >= 5,      icon: '⭐', val: parseInt(customer.total_deals || '0') >= 5 ? 'عميل VIP ✓' : 'مطلوب 5 صفقات' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexDirection: 'row-reverse' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.done ? S.gold : S.card2, border: `2px solid ${step.done ? S.gold : S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, zIndex: 1 }}>{step.icon}</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: step.done ? S.white : S.muted, marginBottom: 3, fontFamily: 'Tajawal, sans-serif' }}>{step.title}</div>
                      <div style={{ fontSize: 11, color: step.done ? S.gold : S.muted, fontFamily: 'Tajawal, sans-serif' }}>{step.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'مدة التعامل', val: `${Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000*60*60*24*30))} شهر`, icon: '📅', color: S.blue },
                { label: 'آخر تواصل',   val: customer.last_contact_date ? timeAgo(customer.last_contact_date) || '—' : '—', icon: '📞', color: S.gold },
                { label: 'متوسط الصفقة', val: parseInt(customer.total_deals||'0') ? `$${Math.round(parseFloat(customer.total_amount||'0')/parseInt(customer.total_deals||'1')).toLocaleString()}` : '—', icon: '💰', color: S.green },
              ].map((m, i) => (
                <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.color, marginBottom: 4, fontFamily: 'Tajawal, sans-serif' }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'contact' && <ContactTab customer={customer} customerId={id}/>}

        {/* ── المنتجات — مع onUpdate لتحديث نظرة عامة ── */}
        {tab === 'products' && (
          <ProductsTab
            customerId={id}
            mainProducts={customer.main_products}
            onUpdate={(val) => setCustomer(prev => prev ? { ...prev, main_products: val } : prev)}
          />
        )}

        {/* ══ سجل الصفقات ══ */}
        {tab === 'deals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, direction: 'rtl' }}>

            {/* الإحصائيات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'إجمالي الصفقات', val: customer.total_deals  || '0', color: S.gold  },
                { label: 'إجمالي المبلغ',  val: customer.total_amount ? `$${parseFloat(customer.total_amount).toLocaleString()}` : '$0', color: S.green },
                { label: 'متوسط الصفقة',  val: parseInt(customer.total_deals||'0') ? `$${Math.round(parseFloat(customer.total_amount||'0')/parseInt(customer.total_deals||'1')).toLocaleString()}` : '—', color: S.blue },
              ].map((m, i) => (
                <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 14, textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginBottom: 4, fontFamily: 'Tajawal, sans-serif' }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* زر إضافة صفقة */}
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setShowDealForm(!showDealForm)}
                  style={{ padding: '8px 18px', borderRadius: 8, background: S.gold, border: 'none', color: S.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  + إضافة صفقة
                </button>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>📋 سجل الصفقات — {deals.length} صفقة</div>
              </div>

              {/* فورم الصفقة */}
              {showDealForm && (
                <div style={{ background: S.navy2, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.gold, marginBottom: 14, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>إضافة صفقة جديدة</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>تاريخ الصفقة</label>
                      <input type="date" value={newDeal.date} onChange={e => setNewDeal({ ...newDeal, date: e.target.value })}
                        style={{ ...fieldStyle, colorScheme: 'dark' as any }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>اسم الصفقة *</label>
                      <input type="text" value={newDeal.name} onChange={e => setNewDeal({ ...newDeal, name: e.target.value })}
                        placeholder="مثال: توريد زيت نخيل 20 طن" style={fieldStyle}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>المبلغ ($)</label>
                      <input type="number" value={newDeal.amount} onChange={e => setNewDeal({ ...newDeal, amount: e.target.value })}
                        placeholder="0.00" style={fieldStyle}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: S.muted, fontWeight: 700, marginBottom: 4, textAlign: 'right', fontFamily: 'Tajawal, sans-serif' }}>ملاحظات</label>
                      <input type="text" value={newDeal.notes} onChange={e => setNewDeal({ ...newDeal, notes: e.target.value })}
                        placeholder="ملاحظات الصفقة..." style={fieldStyle}/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveDeal} disabled={savingDeal}
                      style={{ background: S.gold, color: S.navy, border: 'none', padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      {savingDeal ? '⏳ جاري الحفظ...' : '💾 حفظ الصفقة'}
                    </button>
                    <button onClick={() => setShowDealForm(false)}
                      style={{ background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إلغاء</button>
                  </div>
                </div>
              )}

              {/* قائمة الصفقات */}
              {deals.length === 0
                ? <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: 13, fontFamily: 'Tajawal, sans-serif' }}>لا توجد صفقات مسجلة بعد</div>
                : deals.map((d, i) => (
                  <div key={d.id || i} style={{ background: S.card2, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.gold, fontFamily: 'Tajawal, sans-serif' }}>
                        ${parseFloat(d.amount || '0').toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: S.muted, fontFamily: 'Tajawal, sans-serif' }}>
                        {d.deal_date ? new Date(d.deal_date).toLocaleDateString('ar-EG') : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: S.white, fontFamily: 'Tajawal, sans-serif' }}>🤝 {d.deal_name}</div>
                      {d.notes && <div style={{ fontSize: 11, color: S.muted, marginTop: 2, fontFamily: 'Tajawal, sans-serif' }}>{d.notes}</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'docs'   && <DocsTab customerId={id}/>}
        {tab === 'rating' && <RatingTab customer={customer} customerId={id}/>}

      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>✨ تحليل AI للعميل</div>
                <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{customer.full_name} — {customer.company_name}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {aiLoading
                ? <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div><div style={{ color: S.muted, fontSize: 14 }}>جاري التحليل...</div></div>
                : <div style={{ fontSize: 13, lineHeight: '2', color: S.white, whiteSpace: 'pre-wrap' }}>{aiAnalysis}</div>}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
