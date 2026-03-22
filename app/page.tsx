'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import styles from './page.module.css';


    // ── Colour tokens (match your AppShell S object) ──────────────────────────
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

// ── Tiny reusable atoms ───────────────────────────────────────────────────
function Badge({ children, color = C.gold2, bg = C.gold3, border = 'rgba(201,168,76,0.2)' }: {
  children: React.ReactNode; color?: string; bg?: string; border?: string;
}) {
  return (
    <span style={{ background: bg, border: `1px solid ${border}`, color, padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, display:'inline-flex', alignItems:'center', gap:5 }}>
      {children}
    </span>
  );
}

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

function SectionEye({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'block', width: 22, height: 2, background: C.gold, flexShrink: 0 }} />
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/suppliers');
    });
  }, []);
  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif", background: C.navy, color: C.white, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');`}</style>

      {/* Background layers */}
      <div className={styles.ambientGlow} />

      {/* ── Topbar ── */}
      <div className={styles.shimmerBar} style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '9px 16px', fontSize: 13.5, fontWeight: 600, color: C.navy }}>
        🎉 <strong>عرض الإطلاق:</strong> أول ٩٠ يوماً مجاناً للشركات و المؤسسات—{' '}
        <Link href="/login" style={{ color: C.navy, fontWeight: 800, textDecoration: 'underline' }}>سجّل الآن ←</Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 52px', height: 64, background: 'rgba(10,22,40,0.94)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.borderG}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <div className={styles.logoShine} style={{ width: 34, height: 34, borderRadius: 7, background: `linear-gradient(135deg,${C.gold} 0%,${C.gold2} 100%)`, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, color: C.navy, boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
            TF
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.gold2, letterSpacing: '-.01em' }}>TradeFlow OS</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase' }}>Bridge Edge OS</div>
          </div>
        </Link>

        <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
          {['المميزات','الموردون','المنتجات','الأسعار'].map(l => (
            <li key={l}>
              <Link href="#" className={styles.navLink} style={{ color: C.muted, textDecoration: 'none', fontSize: 14.5, fontWeight: 500 }}>{l}</Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn href="/login">دخول</Btn>
          <Btn href="/login" primary>ابدأ مجاناً ←</Btn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '96px 52px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', minHeight: 'calc(100vh - 90px)' }}>

        {/* Left text */}
        <div className={styles.fadeUp1}>
          {/* Pill */}
          <div className={styles.fadeUp1} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, background: C.gold3, border: `1px solid rgba(201,168,76,0.25)`, fontSize: 12.5, fontWeight: 700, color: C.gold2, marginBottom: 26 }}>
            <span className={styles.liveDot} />
            نظام تشغيل الأعمال للشركات و المؤسسات · معتمد ومؤمّن
          </div>

          <h1 className={styles.fadeUp2} style={{ fontSize: 'clamp(34px,4.5vw,56px)', fontWeight: 900, lineHeight: 1.13, letterSpacing: '-.025em', marginBottom: 10 }}>
            وداعاً<br />
            <span className={styles.goldText}>للعشوائية</span><br />
            في شركتك
          </h1>

          <div className={styles.fadeUp2} style={{ width: 56, height: 2, background: `linear-gradient(90deg,${C.gold},transparent)`, margin: '20px 0' }} />

          <p className={styles.fadeUp3} style={{ fontSize: 16.5, color: C.muted, lineHeight: 1.75, maxWidth: 460, marginBottom: 40, fontWeight: 400 }}>
            <strong style={{ color: C.white, fontWeight: 600 }}>BidLX</strong> هو العقل الإلكتروني لشركتك — يحفظ بيانات موردييك، يقارن عروضهم، يتابع عملاءك، ويحوّل كل شيء من جداول بيانات متناثرة إلى نظام{' '}
            <strong style={{ color: C.white, fontWeight: 600 }}>احترافي موحّد</strong>.
          </p>

          <div className={`${styles.fadeUp4}`} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn href="/login" primary>🚀 ابدأ مجاناً</Btn>
            <Btn href="/login">شاهد العرض التوضيحي</Btn>
          </div>

          <div className={styles.fadeUp5} style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 28 }}>
            {['لا بطاقة ائتمان', 'إعداد في ١٠ دقائق', 'بيانات مشفرة ١٠٠٪'].map(t => (
              <span key={t} style={{ fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.green, fontWeight: 800 }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: mini dashboard */}
        <div className={styles.fadeUp2} style={{ position: 'relative' }}>
          <div style={{ background: C.navy4, border: `1px solid ${C.borderG}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>

            {/* App top bar */}
            <div style={{ background: 'rgba(201,168,76,0.05)', borderBottom: `1px solid ${C.borderG}`, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: `linear-gradient(135deg,${C.gold},${C.gold2})`, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 900, color: C.navy }}>TF</div>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.gold2 }}>TradeFlow OS</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>ملف المورد</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: C.green }}>
                <span className={styles.liveDot} /> مباشر
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {/* Supplier name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.white }}>شركة النور للتصدير</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge>Exporter</Badge>
                  <Badge>Manufacturer</Badge>
                </div>
              </div>

              {/* Progress */}
              <div style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.12)`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>اكتمال الملف</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: C.gold2 }}>٦٥٪</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div className={styles.progBar} style={{ width: '65%' }} />
                </div>
              </div>

              {/* Field badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {[
                  { label: 'اسم الشركة', ok: true }, { label: 'الدولة', ok: true },
                  { label: 'المدينة', ok: true },    { label: 'المنتجات', ok: true },
                  { label: 'واتساب', ok: true },     { label: 'الإيميل', ok: true },
                  { label: 'المسؤول', ok: false },   { label: 'المبيعات', ok: false },
                  { label: 'تسجيل', ok: false },     { label: 'تعاقد', ok: false },
                ].map(f => (
                  <span key={f.label} style={{
                    fontSize: 10, padding: '3px 9px', borderRadius: 4, fontWeight: 600,
                    background: f.ok ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.10)',
                    color: f.ok ? C.green : C.red,
                  }}>
                    {f.ok ? '✓' : '✗'} {f.label}
                  </span>
                ))}
              </div>

              {/* Mini stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { val: '—', lbl: 'المبيعات', color: C.muted },
                  { val: '٠/١٠', lbl: 'التقييم', color: C.gold2 },
                  { val: '$٠', lbl: 'المبلغ', color: C.green },
                  { val: '٠', lbl: 'الصفقات', color: C.white },
                ].map(s => (
                  <div key={s.lbl} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 9.5, color: C.muted, marginTop: 3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                {['نظرة عامة','التواصل','المنتجات','الصفقات','الوثائق'].map((t, i) => (
                  <div key={t} style={{ flex: 1, padding: '7px 0', textAlign: 'center', fontSize: 10, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? C.gold2 : C.muted, background: i === 0 ? C.gold3 : 'transparent', borderLeft: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                    {t}
                  </div>
                ))}
              </div>

              {/* Two cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>معلومات الشركة</div>
                  {[['الدولة','إندونيسيا'],['المدينة','جاكرتا'],['الموقع','—']].map(([k,v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ color: v === '—' ? C.muted : C.white, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: 12 }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>المنتجات</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {['زيت نخيل','توابل','مطاط','كاكاو'].map(p => (
                      <span key={p} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: C.muted, border: `1px solid ${C.border}` }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className={styles.floatBadge} style={{ position: 'absolute', bottom: -14, left: -14, background: C.navy2, border: `1px solid ${C.borderG}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: 22 }}>🏅</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.gold2 }}>+٣٤٠ مورد</div>
              <div style={{ fontSize: 11, color: C.muted }}>موثق في النظام</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${C.borderG}`, borderBottom: `1px solid ${C.borderG}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 52px', display: 'flex' }}>
          {[
            { num: '٩٨٪', lbl: 'دقة بيانات الموردين', delta: '↑ مؤكد من مستخدمين فعليين' },
            { num: '١٠×', lbl: 'أسرع في مقارنة الموردين', delta: '↑ مقارنةً بالجداول التقليدية' },
            { num: '٠',   lbl: 'جداول مبعثرة بعد اليوم', delta: '↑ كل شيء في مكان واحد' },
            { num: '٢٤/٧', lbl: 'وصول لبياناتك من أي مكان', delta: '↑ سحابي وآمن' },
          ].map((s, i) => (
            <div key={i} className={styles.statCell} style={{ flex: 1, padding: '30px 20px', borderLeft: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.gold2, lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{s.num}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{s.lbl}</div>
              <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginTop: 5 }}>{s.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Problems → Solutions ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 52px' }}>
        <SectionEye>المشكلة والحل</SectionEye>
        <h2 style={{ fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 900, letterSpacing: '-.02em', marginBottom: 14 }}>
          تعرف على هذه المشاكل؟<br />هذا بالظبط ما حللناه.
        </h2>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, maxWidth: 540, marginBottom: 52 }}>
          كل شركة صغيرة أو متوسطة تبدأ بنفس الطريقة — واتساب، جداول مبعثرة،أوراق. وذاكرة بشرية. لكن مع النمو، العشوائية تُكلّف.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
{ type: 'before', icon: '📋', title: 'بيانات الموردين مشتتة في كل مكان', desc: 'أرقام التواصل في الهاتف، الأسعار في الأوراق، وتواريخ التواصل في الذاكرة. وعندما تحتاجها في اللحظة الحاسمة، لن تجدها.' },
            { type: 'after',  icon: '🗂️', title: 'ملف مورد شامل ومكتمل', desc: 'لكل مورد ملف إلكتروني كامل يضم: بياناته، منتجاته، تواريخ التواصل، تقييمه، وصفقاته؛ كلها في شاشة واحدة مع مؤشر اكتمال.' },
            { type: 'before', icon: '🤷', title: 'صعوبة المقارنة بين الموردين', desc: 'لديك 5 موردين يقدمون نفس المنتج، ولكنك تعجز عن تحديد الأفضل من حيث السعر أو سرعة التوصيل أو الجودة. حالياً، قرارك يعتمد على التخمين فقط.' },
            { type: 'after',  icon: '📊', title: 'مقارنة فورية بالبيانات الحية', desc: 'شاشة إدارة المنتجات تعرض جميع الموردين لكل منتج جنباً إلى جنب، مع متوسط التقييم ونسبة التوزيع.' },
            { type: 'before', icon: '😰', title: 'بيانات العملاء غير محفوظة', desc: 'إذا غادر الموظف المسؤول، تضيع معه بيانات العملاء. لا يوجد سجل للتواصل، ولا تفاصيل للصفقات السابقة، ولا أي مستندات.' },
            { type: 'after',  icon: '🔐', title: 'بيانات الشركة محفوظة ومحمية', desc: 'منصة BidLX هي الذاكرة المؤسسية لشركتك؛ فكل عميل، وصفقة، وتواصل، محفوظ في السحابة ومشفر.' },
          ].map((c, i) => (
            <div key={i} className={styles.psCard} style={{ borderRadius: 14, padding: '28px 26px', border: `1px solid ${C.border}`, background: C.navy4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: c.type === 'before' ? C.red : C.green, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {c.type === 'before' ? '✗ المشكلة' : '✓ الحل'}
              </div>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.white, marginBottom: 8 }}>{c.title}</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 52px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <SectionEye>المميزات الكاملة</SectionEye>
          <h2 style={{ fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 900, letterSpacing: '-.02em' }}>كل أدوات الإدارة التي تحتاجها</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, background: C.borderG, border: `1px solid ${C.borderG}`, borderRadius: 16, overflow: 'hidden' }}>
          {[
            { num: '٠١', icon: '🏭', title: 'ملفات موردين احترافية', desc: 'سجّل كل مورد بتفاصيل كاملة: بيانات التواصل، المنتجات، التقييمات، الوثائق، وسجل الصفقات مع مؤشر اكتمال.', tag: '🏅 وسام الأكثر طلباً' },
            { num: '٠٢', icon: '📦', title: 'كتالوج موحّد للمنتجات', desc: 'شاشة مخصصة لكل منتج تعرض كل الموردين المرتبطين به، متوسط التقييم، نسبة التوزيع والدول.', tag: '📊 مقارنة لحظية' },
            { num: '٠٣', icon: '🤖', title: 'تحليل بالذكاء الاصطناعي', desc: 'اضغط زراً واحداً وسيحلّل الذكاء الاصطناعي ملف المورد الكامل ويعطيك توصيات مبنية على بياناتك.', tag: '⚡ في ثوانٍ' },
            { num: '٠٤', icon: '👥', title: 'CRM مدمج للعملاء', desc: 'تتبع كل عميل بالتفصيل: تاريخ التواصل، الصفقات المكتملة، ملاحظات المبيعات — ذاكرة مؤسسية لا تنسى.', tag: '🔒 بيانات محمية' },
            { num: '٠٥', icon: '📄', title: 'مستودع وثائق مركزي', desc: 'ارفع عقودك، شهادات الجودة، الفواتير، وكل وثيقة مرتبطة بالمورد أو العميل في مكان واحد.', tag: '📁 تنظيم تلقائي' },
            { num: '٠٦', icon: '📋', title: 'تقارير PDF بنقرة واحدة', desc: 'صدّر ملف أي مورد أو عميل كـ PDF احترافي جاهز للمشاركة مع شركائك أو للأرشفة.', tag: '⬇️ PDF تلقائي' },
          ].map((f, i) => (
            <div key={i} className={styles.featCard} style={{ background: C.navy4, padding: '32px 26px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', color: C.gold, marginBottom: 18 }}>{f.num}</div>
              <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 16.5, fontWeight: 800, color: C.white, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.65 }}>{f.desc}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 5, background: C.gold3, border: `1px solid rgba(201,168,76,0.18)`, fontSize: 11, fontWeight: 700, color: C.gold2, marginTop: 18 }}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 52px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <SectionEye>المقارنة</SectionEye>
          <h2 style={{ fontSize: 'clamp(26px,3.2vw,38px)', fontWeight: 900, letterSpacing: '-.02em' }}>BidLX مقابل الطريقة القديمة</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.borderG}`, borderRadius: 14, overflow: 'hidden' }}>
          <thead>
            <tr>
              {['الميزة', 'BidLX ✦', 'Excel / واتساب', 'CRM تقليدي'].map((h, i) => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: i === 1 ? C.gold2 : C.muted, background: 'rgba(201,168,76,0.04)', borderBottom: `1px solid ${C.borderG}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['ملف مورد كامل مع مؤشر اكتمال', '✓', '✗', 'جزئياً'],
              ['مقارنة الموردين بنفس المنتج',   '✓', '✗', '✗'],
              ['تحليل ذكاء اصطناعي فوري',       '✓', '✗', '✗'],
              ['تصدير PDF احترافي',              '✓', 'يدوي ومعقد', 'مدفوع إضافي'],
              ['واجهة عربية RTL كاملة',          '✓', '✗', '✗'],
              ['مصمم للشركات الصغيرة والمتوسطة','✓', 'معقد ومبعثر', 'مكلف جداً'],
            ].map((row, ri) => (
              <tr key={ri} style={{ transition: 'background .15s' }}>
                {row.map((cell, ci) => (
<td key={ci} style={{ padding: '13px 20px', borderBottom: ri < 5 ? `1px solid ${C.border}` : 'none', color: ci === 0 ? C.white : ci === 1 ? (cell === '✓' ? C.green : C.muted) : C.muted, fontWeight: ci === 0 ? 600 : ci === 1 ? 800 : 400, background: ci === 1 ? 'rgba(201,168,76,0.03)' : 'transparent', fontSize: cell === '✓' || cell === '✗' ? 16 : 14 } as React.CSSProperties}>                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 1, margin: '0 52px 80px', borderRadius: 20, border: `1px solid ${C.borderG}`, background: `linear-gradient(135deg,${C.navy2} 0%,rgba(201,168,76,0.05) 100%)`, overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, padding: '80px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>ابدأ اليوم · مجاناً</div>
          <h2 style={{ fontSize: 'clamp(26px,3.8vw,46px)', fontWeight: 900, letterSpacing: '-.025em', lineHeight: 1.15, marginBottom: 18 }}>
            شركتك تستحق نظاماً<br />
            <span className={styles.goldText}>بمستوى طموحها</span>
          </h2>
          <p style={{ fontSize: 16, color: C.muted, maxWidth: 500, margin: '0 auto 38px', lineHeight: 1.7 }}>
            انضم إلى الشركات الصغيرة والمتوسطة التي قررت وداع العشوائية — وبدأت تدير مورديها وعملاءها بشكل احترافي حقيقي.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn href="/login" primary>🚀 ابدأ تجربتك المجانية</Btn>
            <Btn href="/login">تحدث مع الفريق</Btn>
          </div>
          <div style={{ marginTop: 22, fontSize: 12.5, color: C.muted, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['لا بطاقة ائتمان مطلوبة', '٩٠ يوم مجاناً', 'دعم عربي كامل', 'إلغاء في أي وقت'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: C.green, fontWeight: 800 }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}`, maxWidth: 1200, margin: '0 auto', padding: '26px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12.5, color: C.muted }}>© ٢٠٢٦ BidLX  · جميع الحقوق محفوظة</div>
        <div style={{ display: 'flex', gap: 22 }}>
          {['الخصوصية','الشروط','الدعم','تواصل معنا'].map(l => (
            <Link key={l} href="#" style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>

    </div>
  );
}
