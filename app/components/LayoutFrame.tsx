'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css';

const C = {
  navy:    '#0A1628',
  navy2:   '#0F2040',
  navy3:   '#0C1A32',
  navy4:   '#111D35',
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  gold3:   'rgba(201,168,76,0.10)',
  gold4:   'rgba(201,168,76,0.04)',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  border:  'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.15)',
  green:   '#22C55E',
  red:     '#EF4444',
  amber:   '#F59E0B',
  card:    'rgba(15,32,64,0.7)',
};

function Btn({ href, primary, children }: { href: string; primary?: boolean; children: React.ReactNode }) {
  const base: React.CSSProperties = {
    padding: '13px 30px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: 15, fontWeight: primary ? 800 : 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    textDecoration: 'none', transition: 'all .2s',
  };
  const s: React.CSSProperties = primary
    ? { ...base, background: `linear-gradient(135deg,${C.gold} 0%,${C.gold2} 100%)`, color: C.navy, border: 'none', boxShadow: '0 4px 20px rgba(201,168,76,0.25)' }
    : { ...base, background: 'transparent', color: C.gold2, border: `1px solid ${C.borderG}` };
  return <Link href={href} style={s}>{children}</Link>;
}

// ── المكون الأساسي (LayoutFrame) ──
export default function LayoutFrame({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{ 
      fontFamily: "'Tajawal', sans-serif", 
      background: C.navy, 
      color: C.white, 
      minHeight: '100vh', 
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');`}</style>

      <div className={styles.ambientGlow} />

      {/* ── Topbar ── */}
      <div className={styles.shimmerBar} style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '9px 16px', fontSize: 13.5, fontWeight: 600, color: C.navy }}>
        🎉 <strong>عرض الإطلاق:</strong> أول ٩٠ يوماً مجاناً للشركات و المؤسسات—{' '}
        <Link href="/login" style={{ color: C.navy, fontWeight: 800, textDecoration: 'underline' }}>سجّل الآن ←</Link>
      </div>

      {/* ── Nav (Header) ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 52px', height: 64, background: 'rgba(10,22,40,0.94)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.borderG}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div className={styles.logoShine} style={{ width: 34, height: 34, borderRadius: 7, background: `linear-gradient(135deg,${C.gold} 0%,${C.gold2} 100%)`, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, color: C.navy, boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
            TF
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold2, letterSpacing: '-.01em' }}>BidLX OS</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase' }}>تجارة بلا حدود</div>
          </div>
        </Link>
<ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
  {/* رابط المميزات الفعلي */}
<ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
  {/* رابط المميزات */}
      <li>
    <Link 
      href="/" 
      className={styles.navLink} 
      style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}
    >
      الرئيسية
    </Link>
  </li>
  <li>
    <Link 
      href="/features" 
      className={styles.navLink} 
      style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}
    >
      المميزات
    </Link>
  </li>

  {/* رابط الأتمتة - تم ربطه بصفحة التشغيل الجديدة */}
  <li>
    <Link 
      href="/automation" 
      className={styles.navLink} 
      style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}
    >
      الأتمتة
    </Link>
  </li>

  {/* الروابط المتبقية */}
  {[, 'الأسعار'].map(l => (
    <li key={l}>
      <Link 
        href="#" 
        className={styles.navLink} 
        style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}
      >
        {l}
      </Link>
    </li>
  ))}
</ul>

  {/* بقية الروابط الافتراضية */}
  {['المنتجات', ].map(l => (
    <li key={l}>
      <Link 
        href="#" 
        className={styles.navLink} 
        style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}
      >
        {l}
      </Link>
    </li>
  ))}
</ul>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn href="/login">دخول</Btn>
          <Btn href="/login" primary>ابدأ مجاناً ←</Btn>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      {/* هنا يتم حقن محتوى الصفحات (مثل صفحة الاتصال) */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {children}
      </main>

      {/* ── Footer ── */}
<footer style={{ 
  position: 'relative', 
  zIndex: 1, 
  borderTop: `1px solid ${C.border}`, 
  maxWidth: 1200, 
  margin: '0 auto', 
  width: '100%', 
  padding: '26px 52px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center' 
}}>
  {/* حقوق الملكية مع اسم العقل الإلكتروني */}
  <div style={{ fontSize: 12.5, color: C.muted, fontFamily: "'Tajawal', sans-serif" }}>
    © ٢٠٢٦ BidLX  · العقل الإلكتروني لشركتك · جميع الحقوق محفوظة
  </div>

<div style={{ display: 'flex', gap: 22, fontFamily: "'Tajawal', sans-serif" }}>
  <Link href="/" style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none' }}>الرئيسية</Link>
  <Link href="/privacy" style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none' }}>الالخصوصية</Link>
  <Link href="/terms" style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none' }}>الشروط</Link>
  <Link href="/tech-center" style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none' }}>الدعم</Link>
  
  <Link href="/contact" style={{ fontSize: 12.5, color: C.gold2, fontWeight: 700, textDecoration: 'none' }}>
    تواصل معنا
  </Link>
</div>
</footer>
    </div>
  );
}