'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const S = {
  navy: '#0A1628', navy2: '#0F2040',
  gold: '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green: '#22C55E', red: '#EF4444', amber: '#F59E0B',
  card2: 'rgba(255,255,255,0.08)',
}

const navItems = [
  { label: 'لوحة التحكم',        href: '/dashboard' },
  { label: 'إدارة الموردين',     href: '/suppliers' },
  { label: 'إدارة المنتجات',     href: '/products' },
  { label: 'إدارة العملاء',      href: '/customers' },
  { label: 'إدارة الموارد البشرية', href: '/hr' },
  { label: 'إدارة التسويق',      href: '/marketing' },
  { label: 'إدارة الحسابات',     href: '/accounting', color: '#EF4444' },
]

const pageTitles: Record<string, string> = {
  '/suppliers':  'إدارة الموردين',
  '/products':   'إدارة المنتجات',
  '/profile':    'ملف المدير التنفيذي',
  '/pricing/compare': 'مقارنة أسعار',
  '/customers':  'إدارة العملاء',
  '/accounting': 'إدارة الحسابات المالية',
  '/hr':         'إدارة الموارد البشرية',
  '/marketing':  'إدارة التسويق',
  '/dashboard':  'لوحة التحكم',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [showAlerts,  setShowAlerts]  = useState(false)
  const [alerts,      setAlerts]      = useState<any[]>([])
  const [readAlerts,  setReadAlerts]  = useState<string[]>([])
  const [user,        setUser]        = useState<any>(null)
  const [showUserMenu,setShowUserMenu]= useState(false)
  const [avatarUrl,   setAvatarUrl]   = useState('')
  // موبايل: هل القائمة مفتوحة؟
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const unreadAlerts = alerts.filter(s => !readAlerts.includes(s.id))

  function markRead(id: string) {
    const newRead = [...readAlerts, id]
    setReadAlerts(newRead)
    localStorage.setItem('readAlerts', JSON.stringify(newRead))
  }

  useEffect(() => {
    const saved = localStorage.getItem('avatarUrl')
    if (saved) setAvatarUrl(saved)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession()
      const u = data?.session?.user
      if (u) {
        setUser(u)
        if (!localStorage.getItem('avatarUrl')) {
          const url = u.user_metadata?.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.user_metadata?.full_name || u.email || 'User')}&background=0A1628&color=fff`
          setAvatarUrl(url)
          localStorage.setItem('avatarUrl', url)
        }
      }
    }
    fetchUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setUser(session.user)
      else setUser(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase.from('suppliers').select('id,company_name,last_contact_date,completion_pct,status').eq('status', 'active')
      if (!data) return
      const list = data.filter((s: any) => {
        const days = s.last_contact_date ? Math.floor((Date.now() - new Date(s.last_contact_date).getTime()) / 86400000) : 999
        return days > 30 || (s.completion_pct || 0) < 50
      })
      setAlerts(list)
      const saved = localStorage.getItem('readAlerts')
      setReadAlerts(JSON.parse(saved || '[]'))
    }
    fetchAlerts()
  }, [])

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const pageTitle = pageTitles[pathname] ||
    (pathname.includes('/customers/') ? 'إدارة العميل' :
     pathname.startsWith('/suppliers/') ? 'ملف المورد' : 'BidLx')

  return (
    <>
      {/* ── Responsive style injection ── */}
      <style>{`
        @media (max-width: 768px) {
          .appshell-sidebar {
            position: fixed !important;
            top: 0; right: 0;
            height: 100vh !important;
            width: 260px !important;
            z-index: 9999 !important;
            transform: translateX(100%);
            transition: transform .28s cubic-bezier(.4,0,.2,1);
            box-shadow: -8px 0 32px rgba(0,0,0,.55);
          }
          .appshell-sidebar.open {
            transform: translateX(0);
          }
          .appshell-overlay {
            display: none;
            position: fixed; inset: 0;
            background: rgba(0,0,0,.55);
            z-index: 9998;
            backdrop-filter: blur(2px);
          }
          .appshell-overlay.open { display: block; }
          .appshell-main { width: 100% !important; }
          .appshell-topbar { padding: 0 12px !important; }
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>

      <div style={{ height: '100vh', background: S.navy, color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl', display: 'flex', overflow: 'hidden' }}>

        {/* ── Overlay (موبايل) ── */}
        <div
          className={`appshell-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ═══════════ SIDEBAR ═══════════ */}
        <div className={`appshell-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ width: 220, flexShrink: 0, background: S.navy2, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', height: '100vh' }}>

          {/* لوغو */}
          <div style={{ padding: '0 24px', borderBottom: `1px solid ${S.border}`, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 66, position: 'relative' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.gold }}>bidlx.com</div>
            <div style={{ fontSize: 9, color: S.muted, letterSpacing: '1.5px', marginTop: 2 }}>Bidlx OS</div>
            {/* زر إغلاق في الموبايل */}
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: S.muted, fontSize: 20, cursor: 'pointer', padding: 4 }}>
              ✕
            </button>
          </div>

          {/* القائمة */}
          <div style={{ padding: '14px 24px 5px', fontSize: 9, color: S.muted, fontWeight: 700 }}>القائمة الرئيسية</div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {navItems.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <div key={n.label} onClick={() => router.push(n.href)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', margin: '2px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: active ? S.gold : S.muted, background: active ? S.gold3 : 'transparent', border: active ? '1px solid rgba(201,168,76,0.18)' : '1px solid transparent' }}>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.color && <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.color }} />}
                </div>
              )
            })}
          </div>

          {/* أسفل القائمة */}
          <div style={{ padding: 16, borderTop: `1px solid ${S.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 10, color: S.muted, textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.white }}>bidlx.com</div>
                <div>V 1.06.22</div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${S.gold},${S.gold2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: S.navy, marginRight: 'auto' }}>BE</div>
            </div>
          </div>
        </div>

        {/* ═══════════ MAIN ═══════════ */}
        <div className="appshell-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Topbar */}
          <div className="appshell-topbar"
            style={{ background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, minHeight: 66 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* زر الهامبورغر — موبايل فقط */}
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: `1px solid ${S.border}`, color: S.muted, fontSize: 18, cursor: 'pointer', borderRadius: 7, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ☰
              </button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{pageTitle}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* التنبيهات */}
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowAlerts(!showAlerts)}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: S.card2, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔔</div>
                {unreadAlerts.length > 0 && (
                  <div style={{ position: 'absolute', top: -5, left: -5, width: 16, height: 16, borderRadius: '50%', background: S.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                    {unreadAlerts.length}
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${S.border}`, cursor: 'pointer', overflow: 'hidden', background: S.card2 }}>
                  <img src={avatarUrl || `https://ui-avatars.com/api/?name=User&background=0A1628&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                </div>

                {showUserMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowUserMenu(false)} />
                    <div style={{ position: 'absolute', top: 46, left: 0, width: 190, background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 999, padding: '6px 0' }}>
                      <Link href="/profile" style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${S.border}`, fontSize: 11, color: S.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>👤</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
                        </div>
                      </Link>
                      <div onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
                        style={{ padding: '10px 14px', cursor: 'pointer', color: S.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🚪</span> تسجيل الخروج
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* المحتوى */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>
        </div>

        {/* ═══════════ ALERTS ═══════════ */}
        {showAlerts && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowAlerts(false)}>
            <div style={{ position: 'absolute', top: 70, left: 16, right: 16, maxWidth: 300, margin: '0 auto', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,.5)', direction: 'rtl', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setShowAlerts(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 16, cursor: 'pointer' }}>✕</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>التنبيهات</span>
                  {unreadAlerts.length > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,.12)', color: S.red, fontWeight: 700 }}>{unreadAlerts.length} جديد</span>}
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: S.muted, padding: 20, fontSize: 13 }}>لا توجد تنبيهات</div>
                ) : alerts.map(s => {
                  const days = s.last_contact_date ? Math.floor((Date.now() - new Date(s.last_contact_date).getTime()) / 86400000) : null
                  const isRead = readAlerts.includes(s.id)
                  return (
                    <div key={s.id} onClick={() => { markRead(s.id); setShowAlerts(false); router.push(`/suppliers/${s.id}`) }}
                      style={{ padding: 12, borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: isRead ? 'transparent' : 'rgba(255,255,255,.04)', border: `1px solid ${isRead ? 'transparent' : 'rgba(255,255,255,.08)'}`, opacity: isRead ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{s.company_name}</div>
                        {!isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.red, flexShrink: 0, marginTop: 4 }} />}
                      </div>
                      {(!s.last_contact_date || (days !== null && days > 30)) && <div style={{ fontSize: 11, color: S.red }}>🔴 {!s.last_contact_date ? 'لم يتم التواصل' : `منذ ${days} يوم`}</div>}
                      {(s.completion_pct || 0) < 50 && <div style={{ fontSize: 11, color: S.amber }}>⚠️ ملف ناقص {s.completion_pct || 0}%</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
