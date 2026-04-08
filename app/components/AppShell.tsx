'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link';


const S = {
  navy: '#0A1628', navy2: '#0F2040',
  gold: '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green: '#22C55E', red: '#EF4444', amber: '#F59E0B',
  card2: 'rgba(255,255,255,0.08)',
}

const navItems = [
  { label: 'إدارة الموردين', href: '/suppliers', color: '#7F77DD' },
  { label: 'إدرة المنتجات', href: '/products', color: S.gold },
  { label: 'إدرة العملاء', href: '/customers', color: '#FAFAF8' },
  { label: 'إدرة الحسابات', href: '/accounting', color: '#EF4444' },
  { label: 'إدرة الموارد البشرية', href: '/hr', color: '#22C55E' },
    { label: 'إدرة التسويق', href: '/marketing', color: '#F59E0B' },


]

const pageTitles: Record<string, string> = {
  '/suppliers': 'إدارة الموردين',
  '/products': 'إدارة المنتجات',
  '/profile': 'ملف المدير التنفيذي',
  '/pricing/compare': 'مقارنة أسعار',
  '/customers': ' إدارة العملاء',
  '/accounting': ' إدارة الحسابات المالية ',
  '/hr': ' إدارة  الموارد البشرية ',
  '/marketing': ' إدارة  التسويق  ',

}


export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showAlerts, setShowAlerts] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [readAlerts, setReadAlerts] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // --- Avatar ثابت ---
const [avatarUrl, setAvatarUrl] = useState<string>(``)

// 2. استخدم useEffect لسحب البيانات بعد تحميل الصفحة
useEffect(() => {
  const savedAvatar = localStorage.getItem(`avatarUrl`)
  if (savedAvatar) {
    setAvatarUrl(savedAvatar)
  }
  if (typeof window !== 'undefined') {
  // كود اللوكال ستورج هنا فقط
}
}, [])

  // --- التنبيهات غير المقروءة ---
  const unreadAlerts = alerts.filter(s => !readAlerts.includes(s.id))

  function markRead(id: string) {
    if (readAlerts.includes(id)) return
    const newRead = [...readAlerts, id]
    setReadAlerts(newRead)
    localStorage.setItem('readAlerts', JSON.stringify(newRead))
  }

  // --- جلب المستخدم وتثبيت الصورة ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession()
const user = data?.session?.user
      if (user) {
        setUser(user)
        // تثبيت صورة Avatar مرة واحدة
        if (!localStorage.getItem('avatarUrl')) {
          const url = user.user_metadata?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || 'User')}&background=0A1628&color=fff`
          setAvatarUrl(url)
          localStorage.setItem('avatarUrl', url)
        }
      }
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        if (!localStorage.getItem('avatarUrl')) {
          const url = session.user.user_metadata?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || session.user.email || 'User')}&background=0A1628&color=fff`
          setAvatarUrl(url)
          localStorage.setItem('avatarUrl', url)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- جلب التنبيهات ---
  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase
        .from('suppliers')
        .select('id,company_name,last_contact_date,completion_pct,status')
        .eq('status', 'active')

      if (!data) return

      const list = data.filter((s: any) => {
        const lastContact = s.last_contact_date
        const completion = Number(s.completion_pct) || 0
        const daysSinceContact = lastContact
          ? Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000)
          : 999
        return (!lastContact || daysSinceContact > 30) || completion < 50
      })
      setAlerts(list)

      const savedRead = localStorage.getItem('readAlerts')
      setReadAlerts(JSON.parse(savedRead || '[]'))
    }
    fetchAlerts()
  }, [])

const pageTitle = pageTitles[pathname] || 
    (pathname.includes('/customers/') ? 'إدارة العميل' : 
     pathname.startsWith('/suppliers/') ? 'ملف المورد' : 'BidLx')
  return (
    <div style={{ height: '100vh', background: S.navy, color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl', display: 'flex', overflow: 'hidden' }}>

      {/* ===== SIDEBAR ===== */}
      <div style={{ width: '220px', flexShrink: 0, background: S.navy2, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '0px 24px', borderBottom: `1px solid ${S.border}`, textAlign: 'right', display: 'flex',flexDirection: 'column',justifyContent: 'center',minHeight: '66px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: S.gold }}>bidlx.com</div>
          <div style={{ fontSize: '9px', color: S.muted, letterSpacing: '1.5px', marginTop: '2px' }}>Bidlx OS</div>
        </div>

        <div style={{ padding: '14px 24px 5px', fontSize: '9px', color: S.muted, fontWeight: 700 }}>القائمة الرئيسية</div>
        {navItems.map(n => {
          const active = pathname === n.href || pathname.startsWith(n.href + '/')
          return (
            <div key={n.label} onClick={() => router.push(n.href)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', margin: '2px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: active ? S.gold : S.muted, background: active ? S.gold3 : 'transparent', border: active ? `1px solid rgba(201,168,76,0.18)` : '1px solid transparent' }}>
              <span style={{ flex: 1 }}>{n.label}</span>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: n.color }} />
            </div>
          )
        })}

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: `1px solid ${S.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row-reverse' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg,${S.gold},${S.gold2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: S.navy }}>BE</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>bidlx.com</div>
              <div style={{ fontSize: '10px', color: S.muted }}> V 1.06.10</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, minHeight: '66px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{pageTitle}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowAlerts(!showAlerts)}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: S.card2, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🔔</div>
              {unreadAlerts.length > 0 && (
                <div style={{ position: 'absolute', top: '-5px', left: '-5px', width: '16px', height: '16px', borderRadius: '50%', background: S.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                  {unreadAlerts.length}
                </div>
              )}
            </div>

            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: S.card2, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', cursor: 'pointer' }}>💬</div>

            {/* ===== Avatar ثابت ===== */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${S.border}`, cursor: 'pointer', overflow: 'hidden', background: S.card2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img 
                  src={avatarUrl || `https://ui-avatars.com/api/?name=User&background=0A1628&color=fff`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt="Profile" 
                />
              </div>

              {showUserMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowUserMenu(false)} />
                  <div style={{ position: 'absolute', top: '56px', left: 15, width: '180px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 999, padding: '8px 0' }}>


<Link href="/profile" style={{ textDecoration: 'none' }}>
  <div style={{ 
    padding: '10px 16px', 
    borderBottom: `1px solid ${S.border}`, 
    fontSize: '11px', 
    color: '#8c8c8c',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = 'rgba(201, 168, 76, 0.05)';
    e.currentTarget.style.color = '#C9A84C';
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#8c8c8c';
  }}
  >
    <span style={{ fontSize: '14px' }}>👤</span>
    {user?.email}
  </div>
</Link>

                    <div 
                      onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} 
                      style={{ padding: '10px 16px', cursor: 'pointer', color: S.red, fontSize: '14px' }}
                    >
                      تسجيل الخروج
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      {/* ===== ALERTS PANEL ===== */}
      {showAlerts && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowAlerts(false)}>
          <div style={{ position: 'absolute', top: '70px', left: '24px', width: '280px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', direction: 'rtl', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>التنبيهات</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(239,68,68,0.12)', color: S.red, fontWeight: 700 }}>{unreadAlerts.length} جديد</span>
              </div>
              <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', color: S.muted, padding: '20px', fontSize: '13px' }}>لا توجد تنبيهات</div>
              ) : alerts.map(s => {
                const daysSince = s.last_contact_date ? Math.floor((Date.now() - new Date(s.last_contact_date).getTime()) / 86400000) : null
                const noContact = !s.last_contact_date || (daysSince !== null && daysSince > 30)
                const lowCompletion = (s.completion_pct || 0) < 50
                const isRead = readAlerts.includes(s.id)
                return (
                  <div key={s.id}
                    onClick={() => { markRead(s.id); setShowAlerts(false); router.push(`/suppliers/${s.id}`) }}
                    style={{ padding: '12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', background: isRead ? 'transparent' : 'rgba(255,255,255,0.05)', border: `1px solid ${isRead ? 'transparent' : 'rgba(255,255,255,0.08)'}`, opacity: isRead ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, textAlign: 'right', flex: 1 }}>{s.company_name}</div>
                      {!isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: S.red, marginRight: '8px' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {noContact && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start' }}><span>🔴</span><span style={{ fontSize: '11px', color: S.red }}>{!s.last_contact_date ? 'لم يتم التواصل' : `منذ ${daysSince} يوم`}</span></div>}
                      {lowCompletion && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start' }}><span>⚠️</span><span style={{ fontSize: '11px', color: S.amber }}>ملف ناقص {s.completion_pct || 0}%</span></div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}