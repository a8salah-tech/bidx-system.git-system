'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const S = {
  navy: '#0A1628', navy2: '#0F2040',
  gold: '#C9A84C', gold2: '#E8C97A', gold3: 'rgba(201,168,76,0.12)',
  white: '#FAFAF8', muted: '#8A9BB5', border: 'rgba(255,255,255,0.08)',
  green: '#22C55E', red: '#EF4444', amber: '#F59E0B',
  card2: 'rgba(255,255,255,0.08)',
}

const navItems = [
  { label: 'قائمة الموردين', href: '/suppliers', color: '#7F77DD' },
  { label: 'المنتجات', href: '/products', color: S.gold },
]

const pageTitles: Record<string, string> = {
  '/suppliers': 'إدارة الموردين',
  '/products': 'إدارة المنتجات',
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // States
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [alerts, setAlerts] = useState<any[]>([])
  const [readAlerts, setReadAlerts] = useState<string[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // 1. مراجعة الجلسة (الحل الجذري لخطأ "انتهت الجلسة")
  const syncUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      setAvatarUrl(session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '')
    } else if (pathname !== '/login') {
      router.push('/login')
    }
  }, [pathname, router])

  useEffect(() => {
    syncUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setAvatarUrl(session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '')
      } else {
        setUser(null)
        if (pathname !== '/login') router.push('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [syncUser, pathname, router])

  // 2. جلب التنبيهات
  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase.from('suppliers').select('id,company_name,last_contact_date,completion_pct,status').eq('status', 'active')
      if (data) {
        const list = data.filter((s: any) => {
          const days = s.last_contact_date ? Math.floor((Date.now() - new Date(s.last_contact_date).getTime()) / 86400000) : 999
          return (days > 30) || (Number(s.completion_pct) || 0) < 50
        })
        setAlerts(list)
      }
      setReadAlerts(JSON.parse(localStorage.getItem('readAlerts') || '[]'))
    }
    fetchAlerts()
  }, [])

  const unreadAlerts = alerts.filter(s => !readAlerts.includes(s.id))
  const markRead = (id: string) => {
    const newRead = [...readAlerts, id]
    setReadAlerts(newRead)
    localStorage.setItem('readAlerts', JSON.stringify(newRead))
  }

  const pageTitle = pageTitles[pathname] || (pathname.startsWith('/suppliers/') ? 'ملف المورد' : 'TradeFlow')

  return (
    <div style={{ height: '100vh', background: S.navy, color: S.white, fontFamily: 'Tajawal,sans-serif', direction: 'rtl', display: 'flex', overflow: 'hidden' }}>

      {/* --- SIDEBAR --- */}
      <aside style={{ width: '240px', flexShrink: 0, background: S.navy2, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${S.border}`, minHeight: '66px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: S.gold }}>TradeFlow</div>
          <div style={{ fontSize: '10px', color: S.muted, letterSpacing: '1px' }}>BRIDGE EDGE OS</div>
        </div>

        <nav style={{ flex: 1, padding: '15px 0' }}>
          <div style={{ padding: '0 24px 10px', fontSize: '10px', color: S.muted, fontWeight: 700, textTransform: 'uppercase' }}>الرئيسية</div>
          {navItems.map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/')
            return (
              <div key={n.label} onClick={() => router.push(n.href)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', cursor: 'pointer', transition: '0.2s', color: active ? S.gold : S.muted, background: active ? S.gold3 : 'transparent' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.color }} />
                <span style={{ fontSize: '14px', fontWeight: active ? 700 : 500 }}>{n.label}</span>
              </div>
            )
          })}
        </nav>

        {/* إطار العميل - تم ضبطه ليظهر الإيميل والاسم بوضوح */}
        <div style={{ padding: '20px', borderTop: `1px solid ${S.border}`, background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row-reverse' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${S.gold}`, overflow: 'hidden', flexShrink: 0 }}>
              <img src={avatarUrl || `https://ui-avatars.com/api/?name=User&background=0A1628&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: S.white, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.user_metadata?.full_name || 'مدير النظام'}
              </div>
              <div style={{ fontSize: '11px', color: S.muted, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '66px', background: S.navy2, borderBottom: `1px solid ${S.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{pageTitle}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* التنبيهات */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowAlerts(!showAlerts)}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: S.card2, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
              {unreadAlerts.length > 0 && (
                <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: S.red, color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${S.navy2}` }}>
                  {unreadAlerts.length}
                </div>
              )}
            </div>

            {/* الرسائل */}
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: S.card2, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>💬</div>

            {/* المنيو العلوي */}
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${S.gold}`, cursor: 'pointer', overflow: 'hidden' }}>
                <img src={avatarUrl || `https://ui-avatars.com/api/?name=User&background=0A1628&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="P" />
              </div>
              {showUserMenu && (
                <div style={{ position: 'absolute', top: '50px', left: 0, width: '200px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000 }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${S.border}`, fontSize: '11px', color: S.muted, wordBreak: 'break-all' }}>{user?.email}</div>
                  <div onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ padding: '12px 16px', color: S.red, fontWeight: 700, cursor: 'pointer' }}>تسجيل الخروج</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: S.navy }}>
          {children}
        </main>
      </div>

      {/* --- لوحة التنبيهات المنبثقة --- */}
      {showAlerts && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowAlerts(false)}>
          <div style={{ position: 'absolute', top: '75px', left: '24px', width: '320px', background: S.navy2, border: `1px solid ${S.border}`, borderRadius: '15px', boxShadow: '0 20px 50px rgba(0,0,0,0.7)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${S.border}`, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>التنبيهات</span>
              <span onClick={() => setShowAlerts(false)} style={{ cursor: 'pointer', color: S.muted }}>✕</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {alerts.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: S.muted }}>لا توجد تنبيهات جديدة</div> : alerts.map(s => (
                <div key={s.id} onClick={() => { markRead(s.id); setShowAlerts(false); router.push(`/suppliers/${s.id}`) }} style={{ padding: '15px', borderBottom: `1px solid ${S.border}`, cursor: 'pointer', background: readAlerts.includes(s.id) ? 'transparent' : 'rgba(201,168,76,0.05)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.company_name}</div>
                  <div style={{ fontSize: '11px', color: S.red, marginTop: '4px' }}>⚠️ تحديث مطلوب أو بيانات ناقصة</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}