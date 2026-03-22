'use client'

// ===== الاستيرادات الأساسية =====
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ===== تعريف نوع بيانات المورد =====
interface Supplier {
  id: string
  created_at: string
  supplier_number: number
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

// ===== دالة حساب الوقت المنقضي =====
function timeAgo(date: string) {
  if (!date) return null
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'منذ يوم'
  if (diff < 7) return `منذ ${diff} أيام`
  if (diff < 30) return `منذ ${Math.floor(diff / 7)} أسابيع`
  return `منذ ${Math.floor(diff / 30)} أشهر`
}

// ===== دالة تنسيق رقم المورد =====
function formatSupNum(n: number) {
  return `SUP-${String(n).padStart(5, '0')}`
}

// ===== الألوان العامة =====
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

// ===== مكون تبويب جهات التواصل =====
function ContactTab({ supplier, supplierId }: { supplier: any, supplierId: string }) {
  const [contacts, setContacts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', whatsapp: '', notes: '' })
  const [editOfficial, setEditOfficial] = useState(false)
  const [officialData, setOfficialData] = useState({
    contact_email: supplier.contact_email || '',
    contact_whatsapp: supplier.contact_whatsapp || '',
    website: supplier.website || '',
    last_contact_date: supplier.last_contact_date || '',
    last_contact_method: supplier.last_contact_method || '',
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

      {/* قائمة جهات التواصل */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: S.gold, border: 'none', color: S.navy, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
          <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, letterSpacing: '0.8px' }}>جهات التواصل</div>
        </div>

        {/* نموذج الإضافة */}
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
            style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${S.border}`, background: editOfficial ? S.gold : 'transparent', color: editOfficial ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            {editOfficial ? 'حفظ' : 'تعديل'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* الإيميل */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الإيميل الرسمي</div>
            {editOfficial ? (
              <input type="email" value={officialData.contact_email} onChange={e => setOfficialData({...officialData, contact_email: e.target.value})}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#93C5FD' }}>{supplier.contact_email || '—'}</div>
            )}
          </div>

          {/* واتساب */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>واتساب</div>
            {editOfficial ? (
              <input type="text" value={officialData.contact_whatsapp} onChange={e => setOfficialData({...officialData, contact_whatsapp: e.target.value})}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: S.green }}>{supplier.contact_whatsapp || '—'}</div>
            )}
          </div>

          {/* الموقع */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '4px' }}>الموقع الإلكتروني</div>
            {editOfficial ? (
              <input type="text" value={officialData.website} onChange={e => setOfficialData({...officialData, website: e.target.value})}
                style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
            ) : (
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#93C5FD' }}>{supplier.website || '—'}</div>
            )}
          </div>

          {/* آخر تواصل */}
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
                {supplier.last_contact_date ? `${timeAgo(supplier.last_contact_date)}${supplier.last_contact_method ? ` — عبر ${supplier.last_contact_method}` : ''}` : '—'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== مكون تبويب التقييم =====
function RatingTab({ supplier, supplierId }: { supplier: any, supplierId: string }) {
  const [ratings, setRatings] = useState({ quality: 0, delivery: 0, communication: 0, price: 0, flexibility: 0 })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('quality_rating,delivery_rating,comm_rating,price_rating,flex_rating')
        .eq('id', supplierId).single()
      if (sup) {
        setRatings({ quality: sup.quality_rating || 0, delivery: sup.delivery_rating || 0, communication: sup.comm_rating || 0, price: sup.price_rating || 0, flexibility: sup.flex_rating || 0 })
      }
      const { data: notesData } = await supabase.from('supplier_notes').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false })
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

  const avg = loaded ? Math.round((ratings.quality + ratings.delivery + ratings.communication + ratings.price + ratings.flexibility) / 5 * 10) / 10 : 0

  async function saveRating() {
    const confirmed = window.confirm(`هل تريد حفظ التقييم الإجمالي ${avg}/10 ؟`)
    if (!confirmed) return
    setSaving(true)
    await supabase.from('suppliers').update({ rating: avg, quality_rating: ratings.quality, delivery_rating: ratings.delivery, comm_rating: ratings.communication, price_rating: ratings.price, flex_rating: ratings.flexibility }).eq('id', supplierId)
    setSaving(false)
    alert('✅ تم حفظ التقييم بنجاح')
    sessionStorage.setItem('activeTab', 'rating')
    window.location.reload()
  }

  async function addNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const { data } = await supabase.from('supplier_notes').insert([{ supplier_id: supplierId, note: newNote.trim() }]).select().single()
    if (data) setNotes([data, ...notes])
    setNewNote('')
    setSavingNote(false)
  }

  async function deleteNote(id: string) {
    if (!window.confirm('هل تريد حذف هذه الملاحظة؟')) return
    await supabase.from('supplier_notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
  }

  if (!loaded) return <div style={{ textAlign: 'center', color: S.muted, padding: '40px 0' }}>جاري التحميل...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* قسم التقييم */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '16px', textAlign: 'right' }}>تقييم Bridge Edge للمورد</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', flexShrink: 0, background: S.card2, borderRadius: '12px', padding: '16px 20px', minWidth: '100px' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, color: S.white, lineHeight: 1 }}>{avg}</div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '6px' }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 16 16" style={{ fill: i <= Math.round(avg/2) ? S.gold : 'rgba(201,168,76,0.15)' }}>
                  <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10l-3.6 2 .7-4L2.2 5.2l4-.6z"/>
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
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={saveRating} disabled={saving}
            style={{ background: S.gold, color: S.navy, border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التقييم'}
          </button>
        </div>
      </div>

      {/* قسم الملاحظات */}
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
            {notes.map(n => (
              <div key={n.id} style={{ background: S.card2, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>✕</button>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: S.white, lineHeight: '1.6', marginBottom: '4px' }}>{n.note}</div>
                  <div style={{ fontSize: '10px', color: S.muted }}>
                    {new Date(n.created_at).toLocaleDateString('ar-EG')} — {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
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

// ===== مكون تبويب المنتجات =====
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

// ===== الصفحة الرئيسية — تفاصيل المورد =====
export default function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
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

  // تحميل بيانات المورد
  useEffect(() => {
    sessionStorage.removeItem('activeTab')
    async function fetchSupplier() {
      const { data } = await supabase.from('suppliers').select('*').eq('id', id).single()
      setSupplier(data)
      if (data) {
        setEditData({ company_name: data.company_name || '', registration_number: data.registration_number || '', country: data.country || '', city: data.city || '', website: data.website || '' })
      }
      setLoading(false)
    }
    fetchSupplier()
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>جاري التحميل...</div>
  if (!supplier) return <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted, fontFamily: 'Tajawal,sans-serif' }}>لم يتم العثور على المورد</div>

  const initials = (n: string) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  // نظام النقاط لاكتمال الملف
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
    return total + ((supplier as any)[f.key] ? f.points : 0)
  }, 0)

  const compFields = scoreFields.map(f => ({
    label: f.label, points: f.points,
    done: f.key === '_contract' ? false : !!(supplier as any)[f.key],
  }))

  const avg = Math.round(
    ((supplier.quality_rating || 0) + (supplier.delivery_rating || 0) + (supplier.comm_rating || 0) + (supplier.price_rating || 0) + (supplier.flex_rating || 0)) / 5 * 10
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
    // المحتوى الرئيسي فقط بدون sidebar أو header خارجي
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
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer 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' },
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
          <button style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}>تصدير PDF</button>
        </div>
      </div>
      {/* المحتوى */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

        {/* بطاقة المورد */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '20px', marginBottom: '12px', display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: '16px' }}>
          {/* اكتمال الملف */}
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

          {/* معلومات المورد */}
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

          {/* اللوجو */}
          <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: 'linear-gradient(135deg,#1D9E75,#085041)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(supplier.company_name)}
          </div>
        </div>

        {/* شريط الحالة */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: '8px', padding: '8px 14px', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: S.green }}>مورد موثّق ✓</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: S.green, fontWeight: 500 }}>
            {supplier.last_contact_date ? `آخر تواصل: ${timeAgo(supplier.last_contact_date)}` : 'لم يتم التواصل بعد'}
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: S.green }} />
          </div>
        </div>

        {/* الإحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'إجمالي الصفقات', val: supplier.total_deals || 0, color: S.gold },
            { label: 'إجمالي المبلغ', val: supplier.total_amount ? `$${supplier.total_amount.toLocaleString()}` : '$0', color: S.green },
            { label: 'التقييم', val: `${avg}/10`, color: S.blue },
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
            {/* معلومات الشركة */}
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <button onClick={async () => {
                  if (editMode) { await supabase.from('suppliers').update(editData).eq('id', id); window.location.reload() }
                  setEditMode(!editMode)
                }} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${S.border}`, background: editMode ? S.gold : 'transparent', color: editMode ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {editMode ? 'حفظ' : 'تعديل'}
                </button>
                <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>معلومات الشركة</div>
              </div>
              {[{ label: 'الاسم الرسمي', key: 'company_name' }, { label: 'رقم التسجيل', key: 'registration_number' }, { label: 'الدولة', key: 'country' }, { label: 'المدينة', key: 'city' }, { label: 'الموقع', key: 'website' }].map(f => (
                <div key={f.key} style={{ marginBottom: '12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>{f.label}</div>
                  {editMode ? (
                    <input type="text" value={(editData as any)[f.key] || ''} onChange={e => setEditData({ ...editData, [f.key]: e.target.value })}
                      style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any }} />
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{(supplier as any)[f.key] || '—'}</div>
                  )}
                </div>
              ))}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>تاريخ التسجيل</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{new Date(supplier.created_at).toLocaleDateString('ar-EG')}</div>
              </div>
            </div>

            {/* المنتجات والملاحظات */}
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <button onClick={async () => {
                  if (editMode2) { await supabase.from('suppliers').update({ main_products: editData2.main_products, notes: editData2.notes }).eq('id', id); window.location.reload() }
                  else { setEditData2({ main_products: supplier.main_products || '', notes: supplier.notes || '' }) }
                  setEditMode2(!editMode2)
                }} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${S.border}`, background: editMode2 ? S.gold : 'transparent', color: editMode2 ? S.navy : S.muted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  {editMode2 ? 'حفظ' : 'تعديل'}
                </button>
                <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted }}>المنتجات الرئيسية</div>
              </div>

              {editMode2 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button onClick={() => {
                      const input = document.getElementById('newProductInput') as HTMLInputElement
                      if (!input?.value.trim()) return
                      const updated = [...(editData2.main_products ? editData2.main_products.split('،').map(p => p.trim()).filter(Boolean) : []), input.value.trim()]
                      setEditData2({ ...editData2, main_products: updated.join('، ') })
                      input.value = ''
                    }} style={{ background: S.gold, color: S.navy, border: 'none', padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>+ إضافة</button>
                    <input id="newProductInput" type="text" placeholder="اسم المنتج..."
                      style={{ flex: 1, background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '7px', padding: '7px 10px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right' }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                    {(editData2.main_products ? editData2.main_products.split('،').map(p => p.trim()).filter(Boolean) : []).map((p, i) => (
                      <span key={i} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => { const updated = editData2.main_products.split('،').map(x => x.trim()).filter(x => x !== p); setEditData2({ ...editData2, main_products: updated.join('، ') }) }}
                          style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: '11px', padding: 0 }}>✕</button>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!editMode2 && supplier.main_products ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  {supplier.main_products.split('،').map((p, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)', fontWeight: 500 }}>{p.trim()}</span>
                  ))}
                </div>
              ) : !editMode2 && (
                <div style={{ color: S.muted, fontSize: '12px', textAlign: 'right', marginBottom: '16px' }}>لم تُضف منتجات بعد</div>
              )}

              <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '10px', textAlign: 'right' }}>ملاحظات</div>
              {editMode2 ? (
                <textarea value={editData2.notes} onChange={e => setEditData2({ ...editData2, notes: e.target.value })} placeholder="ملاحظات..." rows={3}
                  style={{ width: '100%', background: S.navy2, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: S.white, outline: 'none', fontFamily: 'inherit', textAlign: 'right', boxSizing: 'border-box' as any, resize: 'none' }} />
              ) : (
                <div style={{ fontSize: '13px', lineHeight: '1.8', color: S.white, textAlign: 'right' }}>{supplier.notes || 'لا توجد ملاحظات بعد'}</div>
              )}
            </div>
          </div>
        )}

        {tab === 'contact' && <ContactTab supplier={supplier} supplierId={id} />}

        {tab === 'products' && <ProductsTab supplierId={id} mainProducts={supplier.main_products} />}

        {tab === 'trading' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>القدرات التجارية</div>
              {[{ label: 'المبيعات السنوية', val: supplier.annual_sales || '—', big: true }, { label: 'الصفقات معنا', val: `${supplier.total_deals || 0} صفقة` }, { label: 'إجمالي المبلغ', val: supplier.total_amount ? `$${supplier.total_amount.toLocaleString()}` : '$0' }].map(f => (
                <div key={f.label} style={{ marginBottom: '14px', textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: S.muted, fontWeight: 700, marginBottom: '3px' }}>{f.label}</div>
                  <div style={{ fontSize: f.big ? '22px' : '13px', fontWeight: 700, color: f.big ? S.gold : S.white }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '14px', textAlign: 'right' }}>المنتجات</div>
              {supplier.main_products ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                  {supplier.main_products.split('،').map((p, i) => (
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
              {[{ label: 'إجمالي الصفقات', val: supplier.total_deals || 0, color: S.gold }, { label: 'إجمالي المبلغ', val: supplier.total_amount ? `$${supplier.total_amount.toLocaleString()}` : '$0', color: S.green }, { label: 'متوسط الصفقة', val: supplier.total_deals ? `$${Math.round((supplier.total_amount || 0) / supplier.total_deals).toLocaleString()}` : '—', color: S.blue }, { label: 'نسبة الالتزام', val: '100%', color: S.green }].map((m, i) => (
                <div key={i} style={{ background: S.card2, borderRadius: '10px', padding: '12px', textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, marginBottom: '3px' }}>{m.val}</div>
                  <div style={{ fontSize: '10px', color: S.muted }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: S.muted, padding: '30px 0', fontSize: '13px' }}>سيتم إضافة تفاصيل الصفقات قريباً</div>
          </div>
        )}

        {tab === 'docs' && (
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: S.muted, marginBottom: '16px', textAlign: 'right' }}>الوثائق والشهادات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[{ name: 'شهادة RSPO', exp: 'صالحة حتى ديسمبر 2026', status: 'done' }, { name: 'شهادة حلال MUI', exp: 'صالحة حتى مارس 2026', status: 'warn' }, { name: 'ISO 9001:2015', exp: 'صالحة حتى يونيو 2027', status: 'done' }, { name: 'العقد التجاري', exp: 'لم يُرفع بعد', status: 'missing' }].map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: d.status === 'missing' ? 'rgba(239,68,68,0.05)' : S.card2, borderRadius: '9px', border: d.status === 'missing' ? '1px dashed rgba(239,68,68,0.25)' : 'none' }}>
                  {d.status === 'missing' ? <button style={{ background: S.red, color: '#fff', border: 'none', padding: '5px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>رفع الملف</button>
                    : <span style={{ fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: 600, background: d.status === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: d.status === 'done' ? S.green : S.amber }}>{d.status === 'done' ? 'صالحة' : 'تجديد قريب'}</span>}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: d.status === 'missing' ? S.red : S.white }}>{d.name}</div>
                    <div style={{ fontSize: '10px', color: S.muted, marginTop: '2px' }}>{d.exp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'rating' && <RatingTab supplier={supplier} supplierId={id} />}

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
