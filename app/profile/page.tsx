'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import AppShell from "../components/AppShell";
import { COUNTRIES } from '../components/options'

// ══════════════════ DESIGN TOKENS ══════════════════
const S = {
  navy:   '#0A1628', navy2:  '#0F2040', navy3:  '#0C1A32',
  gold:   '#C9A84C', gold2:  '#E8C97A', gold3:  'rgba(201,168,76,0.10)', goldB: 'rgba(201,168,76,0.22)',
  white:  '#FAFAF8', muted:  '#8A9BB5', border: 'rgba(255,255,255,0.07)',
  green:  '#22C55E', greenB: 'rgba(34,197,94,0.10)',
  red:    '#EF4444', redB:   'rgba(239,68,68,0.10)',
  blue:   '#3B82F6', blueB:  'rgba(59,130,246,0.10)',
  amber:  '#F59E0B', amberB: 'rgba(245,158,11,0.10)',
  card:   'rgba(255,255,255,0.03)', card2: 'rgba(255,255,255,0.06)',
}

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px', padding: '11px 14px',
  fontSize: '13px', color: S.white, outline: 'none',
  fontFamily: 'Tajawal, sans-serif', direction: 'rtl',
  textAlign: 'right', boxSizing: 'border-box',
  transition: 'border-color .2s',
}

// ══════════════════ AVATAR ══════════════════
function Avatar({ name, url, size = 80 }: { name: string; url?: string; size?: number }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: url ? 'transparent' : 'linear-gradient(135deg,#1D9E75,#0A1628)',
      border: `2px solid ${S.goldB}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, color: S.gold2,
      flexShrink: 0, overflow: 'hidden',
      boxShadow: `0 0 0 4px ${S.navy2}, 0 0 24px rgba(201,168,76,0.15)`,
    }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}

// ══════════════════ STAT CARD ══════════════════
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <div style={{
      background: S.card2, border: `1px solid ${S.border}`,
      borderRadius: '14px', padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, fontFamily: 'monospace' }}>{value}</div>
        <div style={{ fontSize: 11, color: S.muted, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

// ══════════════════ SECTION CARD ══════════════════
function Section({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      background: S.card2, border: `1px solid ${S.border}`,
      borderRadius: '16px', overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${S.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {action}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: 'rtl' }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: S.white }}>{title}</span>
        </div>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

// ══════════════════ FIELD ROW ══════════════════
function FieldRow({ label, value, edit, editNode }: { label: string; value: any; edit: boolean; editNode?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: S.gold, letterSpacing: '0.5px', textAlign: 'right' }}>{label}</label>
      {edit && editNode ? editNode : (
        <div style={{
          fontSize: 13, color: value ? S.white : S.muted,
          padding: '10px 14px', background: S.card,
          borderRadius: '9px', border: `1px solid ${S.border}`,
          textAlign: 'right', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}

// ══════════════════ MAIN PAGE ══════════════════
export default function ProfilePage() {
  const router = useRouter()

  const [user,          setUser]         = useState<any>(null)
  const [profile,       setProfile]      = useState<any>(null)
  const [stats,         setStats]        = useState({ suppliers: 0, products: 0, deals: 0, customers: 0 })
  const [loading,       setLoading]      = useState(true)
  const [tab,           setTab]          = useState<'info'|'security'|'activity'>('info')
  const [editInfo,      setEditInfo]     = useState(false)
  const [savingInfo,    setSavingInfo]   = useState(false)
  const [savingPass,    setSavingPass]   = useState(false)
  const [passMsg,       setPassMsg]      = useState('')
  const [passMsgType,   setPassMsgType]  = useState<'ok'|'err'>('ok')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [infoForm, setInfoForm] = useState({
    full_name: '', company_name: '', phone: '', country: '',
    city: '', website: '', bio: '', job_title: '',
  })
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' })

  // ──── Load ────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)

      // جلب بيانات user_profiles
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*').eq('id', u.id).single()
      setProfile(prof)
      if (prof) {
        setInfoForm({
          full_name:    prof.full_name    || u.user_metadata?.full_name || '',
          company_name: prof.company_name || '',
          phone:        prof.phone        || u.phone || '',
          country:      prof.country      || '',
          city:         prof.city         || '',
          website:      prof.website      || '',
          bio:          prof.bio          || '',
          job_title:    prof.job_title    || '',
        })
      } else {
        setInfoForm(p => ({ ...p, full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || '' }))
      }

      // الإحصائيات
      const [supR, proR, cusR] = await Promise.all([
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('products').select('id',  { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('created_by', u.id),
      ])
      setStats({
        suppliers: supR.count || 0,
        products:  proR.count || 0,
        customers: cusR.count || 0,
        deals:     0,
      })
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [router])

  useEffect(() => { loadAll() }, [loadAll])

  // ──── حفظ المعلومات ────
  async function saveInfo() {
    if (!infoForm.full_name.trim()) { alert('يرجى إدخال الاسم الكامل'); return }
    setSavingInfo(true)
    try {
      // تحديث auth metadata
      await supabase.auth.updateUser({ data: { full_name: infoForm.full_name } })

      // upsert في user_profiles
      await supabase.from('user_profiles').upsert({
        id:           user.id,
        full_name:    infoForm.full_name,
        company_name: infoForm.company_name || null,
        phone:        infoForm.phone        || null,
        country:      infoForm.country      || null,
        city:         infoForm.city         || null,
        website:      infoForm.website      || null,
        bio:          infoForm.bio          || null,
        job_title:    infoForm.job_title    || null,
        email:        user.email,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'id' })

      setEditInfo(false)
      await loadAll()
    } catch (e: any) { alert('خطأ: ' + e.message) }
    setSavingInfo(false)
  }

  // ──── تغيير كلمة المرور ────
  async function changePassword() {
    if (!passForm.next || !passForm.confirm) { setPassMsg('يرجى ملء جميع الحقول'); setPassMsgType('err'); return }
    if (passForm.next !== passForm.confirm)   { setPassMsg('كلمتا المرور غير متطابقتين'); setPassMsgType('err'); return }
    if (passForm.next.length < 8)             { setPassMsg('يجب أن تكون 8 أحرف على الأقل'); setPassMsgType('err'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passForm.next })
    if (error) { setPassMsg('خطأ: ' + error.message); setPassMsgType('err') }
    else       { setPassMsg('✅ تم تغيير كلمة المرور بنجاح'); setPassMsgType('ok'); setPassForm({ current: '', next: '', confirm: '' }) }
    setSavingPass(false)
    setTimeout(() => setPassMsg(''), 4000)
  }

  // ──── رفع صورة ────
  async function uploadAvatar(file: File) {
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      await supabase.from('user_profiles').upsert({ id: user.id, avatar_url: url, email: user.email }, { onConflict: 'id' })
      await loadAll()
    } catch (e: any) { alert('خطأ في الرفع: ' + e.message) }
    setUploadingAvatar(false)
  }

  // ──── تسجيل الخروج ────
  async function signOut() {
    if (!window.confirm('هل تريد تسجيل الخروج؟')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ textAlign: 'center', color: S.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div>جاري التحميل...</div>
      </div>
    </div>
  )

  const displayName = infoForm.full_name || user?.email?.split('@')[0] || 'المستخدم'
  const avatarUrl   = profile?.avatar_url || user?.user_metadata?.avatar_url
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }) : '—'

  const TABS = [
    { key: 'info',     label: 'المعلومات الشخصية', icon: '👤' },
    { key: 'security', label: 'الأمان',              icon: '🔐' },
    { key: 'activity', label: 'النشاط',              icon: '📊' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      color: S.white, fontFamily: 'Tajawal, sans-serif',
      direction: 'rtl', background: S.navy, overflowY: 'auto',
    }}>

      {/* ══ هيدر البروفيل ══ */}
      <div style={{
        background: `linear-gradient(135deg, ${S.navy2} 0%, ${S.navy3} 100%)`,
        borderBottom: `1px solid ${S.border}`,
        padding: '28px 32px', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        {/* خلفية زخرفية */}
        <div style={{
          position: 'absolute', top: -60, left: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(201,168,76,0.04)', pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: -40, right: -20, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(59,130,246,0.04)', pointerEvents: 'none',
        }}/>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>

          {/* الصورة + رفع */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={displayName} url={avatarUrl} size={88} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              title="تغيير الصورة"
              style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: S.gold, border: `2px solid ${S.navy2}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, cursor: 'pointer', color: S.navy, fontWeight: 700,
              }}>
              {uploadingAvatar ? '⏳' : '✎'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>

          {/* معلومات المستخدم */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                background: S.greenB, color: S.green, border: `1px solid ${S.green}30`,
              }}>● نشط</span>
              {profile?.job_title && (
                <span style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                  background: S.blueB, color: S.blue, border: `1px solid ${S.blue}30`,
                }}>{profile.job_title}</span>
              )}
              <h1 style={{ fontSize: 22, fontWeight: 900, color: S.white, margin: 0 }}>{displayName}</h1>
            </div>
            {profile?.company_name && (
              <div style={{ fontSize: 13, color: S.gold, marginBottom: 4, textAlign: 'right' }}>
                🏢 {profile.company_name}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: S.muted }}>✉️ {user?.email}</span>
              {profile?.country && <span style={{ fontSize: 11, color: S.muted }}>🌍 {profile.country}</span>}
              <span style={{ fontSize: 11, color: S.muted }}>📅 عضو منذ {memberSince}</span>
            </div>
            {profile?.bio && (
              <div style={{ fontSize: 12, color: S.muted, marginTop: 8, textAlign: 'right', maxWidth: 500, lineHeight: '1.7', fontStyle: 'italic' }}>
                "{profile.bio}"
              </div>
            )}
          </div>

          {/* زر تسجيل الخروج */}
          <button onClick={signOut}
            style={{
              background: S.redB, border: `1px solid ${S.red}30`, color: S.red,
              padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <span>خروج</span> <span>🚪</span>
          </button>
        </div>
      </div>

      {/* ══ الإحصائيات ══ */}
      <div style={{ padding: '20px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <StatCard icon="🏭" label="الموردين"  value={stats.suppliers} color={S.gold}  />
          <StatCard icon="📦" label="المنتجات"  value={stats.products}  color={S.blue}  />
          <StatCard icon="👥" label="العملاء"   value={stats.customers} color={S.green} />
          <StatCard icon="📋" label="الصفقات"   value={stats.deals}     color={S.amber} />
        </div>
      </div>

      {/* ══ التبويبات ══ */}
      <div style={{ padding: '18px 32px 0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', background: S.card2,
          border: `1px solid ${S.border}`, borderRadius: 12,
          padding: 4, gap: 2, width: 'fit-content',
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: tab === t.key ? S.navy2 : 'transparent',
                color: tab === t.key ? S.gold2 : S.muted,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: tab === t.key ? `0 0 0 1px ${S.goldB}` : 'none',
              }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ المحتوى ══ */}
      <div style={{ flex: 1, padding: '20px 32px 32px' }}>

        {/* ─── المعلومات الشخصية ─── */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
            <Section title="البيانات الأساسية" icon="👤"
              action={
                editInfo ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditInfo(false)}
                      style={{ background: 'transparent', border: `1px solid ${S.border}`, color: S.muted, padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      إلغاء
                    </button>
                    <button onClick={saveInfo} disabled={savingInfo}
                      style={{ background: savingInfo ? S.muted : S.gold, color: S.navy, border: 'none', padding: '6px 18px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      {savingInfo ? '⏳ حفظ...' : '💾 حفظ التغييرات'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditInfo(true)}
                    style={{ background: S.gold3, border: `1px solid ${S.goldB}`, color: S.gold2, padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>✏️</span><span>تعديل</span>
                  </button>
                )
              }>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                <FieldRow label="الاسم الكامل *" value={infoForm.full_name} edit={editInfo}
                  editNode={<input value={infoForm.full_name} onChange={e => setInfoForm(p => ({ ...p, full_name: e.target.value }))} style={inp} placeholder="اسمك الكامل" />} />

                <FieldRow label="المسمى الوظيفي" value={infoForm.job_title} edit={editInfo}
                  editNode={<input value={infoForm.job_title} onChange={e => setInfoForm(p => ({ ...p, job_title: e.target.value }))} style={inp} placeholder="مثال: مدير التوريد" />} />

                <FieldRow label="اسم الشركة" value={infoForm.company_name} edit={editInfo}
                  editNode={<input value={infoForm.company_name} onChange={e => setInfoForm(p => ({ ...p, company_name: e.target.value }))} style={inp} placeholder="اسم شركتك" />} />

                <FieldRow label="رقم الهاتف" value={infoForm.phone} edit={editInfo}
                  editNode={<input value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} style={inp} placeholder="+966 5xx xxx xxxx" />} />

                <FieldRow label="الدولة" value={infoForm.country} edit={editInfo}
                  editNode={
                    <select value={infoForm.country} onChange={e => setInfoForm(p => ({ ...p, country: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="" style={{ background: S.navy2 }}>اختر الدولة...</option>
                      {COUNTRIES.map(c => <option key={c.id} value={c.label} style={{ background: S.navy2 }}>{c.label}</option>)}
                    </select>
                  } />

                <FieldRow label="المدينة" value={infoForm.city} edit={editInfo}
                  editNode={<input value={infoForm.city} onChange={e => setInfoForm(p => ({ ...p, city: e.target.value }))} style={inp} placeholder="مدينتك" />} />

                <div style={{ gridColumn: 'span 2' }}>
                  <FieldRow label="الموقع الإلكتروني" value={infoForm.website} edit={editInfo}
                    editNode={<input value={infoForm.website} onChange={e => setInfoForm(p => ({ ...p, website: e.target.value }))} style={inp} placeholder="www.yourcompany.com" />} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <FieldRow label="نبذة شخصية" value={infoForm.bio} edit={editInfo}
                    editNode={
                      <textarea value={infoForm.bio} onChange={e => setInfoForm(p => ({ ...p, bio: e.target.value }))}
                        rows={3} placeholder="اكتب نبذة مختصرة عنك..."
                        style={{ ...inp, resize: 'none', lineHeight: '1.7' } as React.CSSProperties} />
                    } />
                </div>
              </div>
            </Section>

            {/* معلومات الحساب — للقراءة فقط */}
            <Section title="معلومات الحساب" icon="🔒">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FieldRow label="البريد الإلكتروني" value={user?.email} edit={false} />
                <FieldRow label="تاريخ التسجيل" value={memberSince} edit={false} />
                <FieldRow label="معرّف المستخدم" value={
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: S.muted }}>
                    {user?.id?.slice(0, 8)}...
                  </span>
                } edit={false} />
                <FieldRow label="آخر تسجيل دخول" value={
                  user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'
                } edit={false} />
              </div>
            </Section>
          </div>
        )}

        {/* ─── الأمان ─── */}
        {tab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <Section title="تغيير كلمة المرور" icon="🔐">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { l: 'كلمة المرور الجديدة', k: 'next', t: 'password', p: '••••••••' },
                  { l: 'تأكيد كلمة المرور',   k: 'confirm', t: 'password', p: '••••••••' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: S.gold, marginBottom: 6, textAlign: 'right' }}>{f.l}</label>
                    <input type={f.t} placeholder={f.p} value={(passForm as any)[f.k]}
                      onChange={e => setPassForm(p => ({ ...p, [f.k]: e.target.value }))} style={inp} />
                  </div>
                ))}

                {passMsg && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, textAlign: 'right',
                    background: passMsgType === 'ok' ? S.greenB : S.redB,
                    color: passMsgType === 'ok' ? S.green : S.red,
                    border: `1px solid ${passMsgType === 'ok' ? S.green + '30' : S.red + '30'}`,
                  }}>{passMsg}</div>
                )}

                <button onClick={changePassword} disabled={savingPass}
                  style={{
                    background: savingPass ? S.muted : `linear-gradient(135deg,${S.gold},${S.gold2})`,
                    color: S.navy, border: 'none', padding: '12px',
                    borderRadius: 10, fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
                    width: '100%',
                  }}>
                  {savingPass ? '⏳ جاري التغيير...' : '🔐 تغيير كلمة المرور'}
                </button>

                <div style={{ fontSize: 11, color: S.muted, textAlign: 'right', lineHeight: '1.7' }}>
                  💡 يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على أرقام وحروف
                </div>
              </div>
            </Section>

            {/* معلومات الجلسة */}
            <Section title="الجلسة الحالية" icon="🖥️">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'حالة الجلسة',       v: '🟢 نشطة', c: S.green },
                  { l: 'البريد المرتبط',    v: user?.email, c: S.white },
                  { l: 'آخر دخول',           v: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ar-EG') : '—', c: S.muted },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: S.card, borderRadius: 9 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.c }}>{item.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{item.l}</span>
                  </div>
                ))}
                <button onClick={signOut}
                  style={{
                    background: S.redB, border: `1px solid ${S.red}30`, color: S.red,
                    padding: '11px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', width: '100%',
                    marginTop: 4,
                  }}>
                  🚪 تسجيل الخروج من هذا الجهاز
                </button>
              </div>
            </Section>
          </div>
        )}

        {/* ─── النشاط ─── */}
        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>

            {/* إحصائيات مفصّلة */}
            <Section title="ملخص النشاط" icon="📊">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { icon: '🏭', label: 'موردين مضافين',   value: stats.suppliers, color: S.gold  },
                  { icon: '📦', label: 'منتجات مضافة',    value: stats.products,  color: S.blue  },
                  { icon: '👥', label: 'عملاء تجاريين',   value: stats.customers, color: S.green },
                  { icon: '📋', label: 'صفقات مسجّلة',    value: stats.deals,     color: S.amber },
                ].map((s, i) => (
                  <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* بيانات الحساب */}
            <Section title="معلومات إضافية" icon="ℹ️">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'الخطة الحالية',   v: '⭐ Pro',           c: S.gold  },
                  { l: 'حالة الحساب',     v: '✅ مفعّل',          c: S.green },
                  { l: 'تاريخ الإنشاء',   v: memberSince,         c: S.white },
                  { l: 'عدد تسجيلات الدخول', v: '—',             c: S.muted },
                ].map((item, i) => (
                  <div key={i} style={{ background: S.card, borderRadius: 9, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.c }}>{item.v}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{item.l}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
