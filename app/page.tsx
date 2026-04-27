'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import styles from './page.module.css';

const C = {
  navy:'#0A1628',navy2:'#0F2040',navy3:'#0C1A32',navy4:'#111D35',
  gold:'#C9A84C',gold2:'#E8C97A',gold3:'rgba(201,168,76,0.10)',
  white:'#FAFAF8',muted:'#8A9BB5',border:'rgba(255,255,255,0.07)',
  borderG:'rgba(201,168,76,0.15)',green:'#22C55E',red:'#EF4444',amber:'#F59E0B',
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background:C.gold3, border:'1px solid rgba(201,168,76,0.2)', color:C.gold2, padding:'2px 10px', borderRadius:4, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      {children}
    </span>
  );
}

function Btn({ href, primary, children }: { href:string; primary?:boolean; children:React.ReactNode }) {
  const s: React.CSSProperties = primary
    ? { padding:'13px 28px', borderRadius:8, fontFamily:'inherit', fontSize:15, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', background:`linear-gradient(135deg,${C.gold},${C.gold2})`, color:C.navy, border:'none', boxShadow:'0 4px 20px rgba(201,168,76,0.25)' }
    : { padding:'13px 24px', borderRadius:8, fontFamily:'inherit', fontSize:15, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none', background:'transparent', color:C.gold2, border:`1px solid ${C.borderG}` };
  return <Link href={href} style={s}>{children}</Link>;
}

function SectionEye({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:C.gold, marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ display:'block', width:22, height:2, background:C.gold }} />
      {children}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/suppliers');
    });
  }, []);

  return (
    <div dir="rtl" style={{ fontFamily:"'Tajawal',sans-serif", background:C.navy, color:C.white, minHeight:'100vh', overflowX:'hidden' }}>

      {/* Responsive styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');

        /* ── موبايل ── */
        @media (max-width: 768px) {
          .lp-nav { padding: 0 16px !important; }
          .lp-nav-links { display: none !important; }
          .lp-hero { grid-template-columns: 1fr !important; padding: 48px 20px 40px !important; min-height: auto !important; gap: 32px !important; }
          .lp-hero-dashboard { display: none !important; }
          .lp-hero-text h1 { font-size: 36px !important; }
          .lp-hero-btns { flex-direction: column !important; }
          .lp-hero-btns a { width: 100% !important; justify-content: center !important; }
          .lp-stats { grid-template-columns: repeat(2,1fr) !important; padding: 32px 16px !important; }
          .lp-feat-grid { grid-template-columns: 1fr !important; }
          .lp-features { padding: 0 16px 60px !important; }
          .lp-compare { padding: 0 16px 60px !important; overflow-x: auto !important; }
          .lp-compare table { min-width: 520px !important; font-size: 12px !important; }
          .lp-cta { margin: 0 16px 60px !important; padding: 48px 20px !important; }
          .lp-cta h2 { font-size: 28px !important; }
          .lp-cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .lp-cta-btns a { text-align: center !important; justify-content: center !important; }
          .lp-footer { flex-direction: column !important; gap: 14px !important; padding: 20px 16px !important; text-align: center !important; }
          .lp-footer-links { flex-wrap: wrap !important; justify-content: center !important; gap: 12px !important; }
          .lp-topbar { font-size: 12px !important; padding: 8px 12px !important; }
          .lp-section-pad { padding: 0 16px 60px !important; }
        }

        @media (max-width: 480px) {
          .lp-hero-text h1 { font-size: 28px !important; }
          .lp-stats { grid-template-columns: 1fr 1fr !important; }
          .lp-feat-grid { gap: 10px !important; }
        }
      `}</style>

      {/* Ambient */}
      <div className={styles.ambientGlow} />

      {/* ── Topbar ── */}
      <div className={`${styles.shimmerBar} lp-topbar`}
        style={{ position:'relative', zIndex:10, textAlign:'center', padding:'9px 16px', fontSize:13.5, fontWeight:600, color:C.navy }}>
        🎉 <strong>عرض الإطلاق:</strong> انضم لنخبة الموردين والشركات —{' '}
        <Link href="/login" style={{ color:C.navy, fontWeight:800, textDecoration:'underline' }}>سجّل الآن ←</Link>
      </div>

      {/* ── Nav ── */}
      <nav className="lp-nav"
        style={{ position:'sticky', top:0, zIndex:99, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 52px', height:64, background:'rgba(10,22,40,0.94)', backdropFilter:'blur(18px)', borderBottom:`1px solid ${C.borderG}` }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:11, textDecoration:'none' }}>
          <div className={styles.logoShine} style={{ width:34, height:34, borderRadius:7, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, display:'grid', placeItems:'center', fontSize:13, fontWeight:900, color:C.navy }}>TF</div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:C.gold2 }}>BidLX OS</div>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:'.1em', textTransform:'uppercase' }}>تجارة بلا حدود</div>
          </div>
        </Link>

        <ul className="lp-nav-links" style={{ display:'flex', gap:32, listStyle:'none', margin:0, padding:0 }}>
          {[{href:'/',l:'الرئيسية'},{href:'/features',l:'المميزات'},{href:'/automation',l:'الأتمتة'},{href:'#',l:'المنتجات'},{href:'#',l:'الأسعار'}].map(n=>(
            <li key={n.l}><Link href={n.href} className={styles.navLink} style={{ color:C.muted, textDecoration:'none', fontSize:14.5, fontWeight:500 }}>{n.l}</Link></li>
          ))}
        </ul>

        <div style={{ display:'flex', gap:10 }}>
          <Btn href="/login">دخول</Btn>
          <Btn href="/login" primary>ابدأ مجاناً ←</Btn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero"
        style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'96px 52px 72px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center', minHeight:'calc(100vh - 90px)' }}>

        {/* Text */}
        <div className={`${styles.fadeUp1} lp-hero-text`}>
          <div className={styles.fadeUp1} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:100, background:C.gold3, border:'1px solid rgba(201,168,76,0.25)', fontSize:12.5, fontWeight:700, color:C.gold2, marginBottom:26 }}>
            <span className={styles.liveDot} />
            نظام تشغيل الأعمال للشركات · معتمد ومؤمّن
          </div>

          <h1 className={styles.fadeUp2} style={{ fontSize:'clamp(28px,4.5vw,56px)', fontWeight:900, lineHeight:1.13, letterSpacing:'-.025em', marginBottom:10 }}>
            وداعاً<br />
            <span className={styles.goldText}>للعشوائية</span><br />
            في شركتك
          </h1>

          <div className={styles.fadeUp2} style={{ width:56, height:2, background:`linear-gradient(90deg,${C.gold},transparent)`, margin:'20px 0' }} />

          <p className={styles.fadeUp3} style={{ fontSize:16, color:C.muted, lineHeight:1.75, maxWidth:460, marginBottom:36, fontWeight:400 }}>
            <strong style={{ color:C.white, fontWeight:600 }}>BidLX</strong> هو العقل الإلكتروني لشركتك — يحفظ موردييك، يقارن عروضهم، يتابع عملاءك، ويحوّل كل شيء إلى نظام <strong style={{ color:C.white, fontWeight:600 }}>احترافي موحّد</strong>.
          </p>

          <div className={`${styles.fadeUp4} lp-hero-btns`} style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Btn href="/login" primary>🚀 ابدأ مجاناً</Btn>
            <Btn href="/login">شاهد العرض التوضيحي</Btn>
          </div>

          <div className={styles.fadeUp5} style={{ display:'flex', gap:20, flexWrap:'wrap', marginTop:24 }}>
            {['لا بطاقة ائتمان','إعداد في ١٠ دقائق','بيانات مشفرة ١٠٠٪'].map(t=>(
              <span key={t} style={{ fontSize:13, color:C.muted, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:C.green, fontWeight:800 }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Mini dashboard */}
        <div className={`${styles.fadeUp2} lp-hero-dashboard`} style={{ position:'relative' }}>
          <div style={{ background:C.navy4, border:`1px solid ${C.borderG}`, borderRadius:16, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.45)' }}>
            <div style={{ background:'rgba(201,168,76,0.05)', borderBottom:`1px solid ${C.borderG}`, padding:'13px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:24, height:24, borderRadius:5, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, display:'grid', placeItems:'center', fontSize:9, fontWeight:900, color:C.navy }}>TF</div>
                <span style={{ fontSize:12, fontWeight:800, color:C.gold2 }}>BidLx OS</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:C.white }}>ملف المورد</span>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:C.green }}>
                <span className={styles.liveDot}/> مباشر
              </div>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:14, fontWeight:800, color:C.white }}>شركة النور للتصدير</span>
                <div style={{ display:'flex', gap:6 }}><Badge>Exporter</Badge><Badge>Manufacturer</Badge></div>
              </div>
              <div style={{ background:'rgba(201,168,76,0.06)', border:`1px solid rgba(201,168,76,0.12)`, borderRadius:10, padding:'14px 16px', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, color:C.muted }}>اكتمال الملف</span>
                  <span style={{ fontSize:20, fontWeight:900, color:C.gold2 }}>٦٥٪</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                  <div className={styles.progBar} style={{ width:'65%' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {[{l:'التقييم',v:'9/10',c:C.green},{l:'الصفقات',v:'١٢',c:C.gold2},{l:'الوثائق',v:'٥',c:'#93C5FD'}].map(m=>(
                  <div key={m.l} style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:m.c }}>{m.v}</div>
                    <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="lp-stats" style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'40px 52px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
        {[
          {n:'٢٤+',l:'مورد مسجّل',d:'ومتنامٍ يومياً'},
          {n:'١٢',  l:'دولة مرتبطة',d:'آسيا والشرق الأوسط'},
          {n:'٩٨٪', l:'رضا المستخدمين',d:'في أول ٩٠ يوم'},
          {n:'١٠',  l:'دقائق للإعداد',d:'لا كود · لا تدريب'},
        ].map((s,i)=>(
          <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.borderG}`, borderRadius:14, padding:'22px 20px', textAlign:'right' }}>
            <div style={{ fontSize:'clamp(26px,3vw,36px)', fontWeight:900, color:C.gold2, lineHeight:1 }}>{s.n}</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.white, margin:'8px 0 4px' }}>{s.l}</div>
            <div style={{ fontSize:12, color:C.muted }}>{s.d}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <div className="lp-features lp-section-pad" style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'0 52px 80px' }}>
        <div style={{ marginBottom:48 }}>
          <SectionEye>المميزات الكاملة</SectionEye>
          <h2 style={{ fontSize:'clamp(22px,3.2vw,38px)', fontWeight:900, letterSpacing:'-.02em' }}>كل أدوات الإدارة التي تحتاجها</h2>
        </div>
        <div className="lp-feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:C.borderG, border:`1px solid ${C.borderG}`, borderRadius:16, overflow:'hidden' }}>
          {[
            {num:'٠١',icon:'🏭',title:'ملفات موردين احترافية',desc:'سجّل كل مورد بتفاصيل كاملة: بيانات التواصل، المنتجات، التقييمات، الوثائق، وسجل الصفقات.',tag:'🏅 وسام الأكثر طلباً'},
            {num:'٠٢',icon:'📦',title:'كتالوج موحّد للمنتجات',desc:'شاشة مخصصة لكل منتج تعرض كل الموردين المرتبطين به، متوسط التقييم ودول التوزيع.',tag:'📊 مقارنة لحظية'},
            {num:'٠٣',icon:'🤖',title:'تحليل بالذكاء الاصطناعي',desc:'اضغط زراً واحداً وسيحلّل الذكاء الاصطناعي ملف المورد ويعطيك توصيات مبنية على بياناتك.',tag:'⚡ في ثوانٍ'},
            {num:'٠٤',icon:'👥',title:'CRM مدمج للعملاء',desc:'تتبع كل عميل بالتفصيل: تاريخ التواصل، الصفقات، ملاحظات المبيعات — ذاكرة مؤسسية.',tag:'🔒 بيانات محمية'},
            {num:'٠٥',icon:'📄',title:'مستودع وثائق مركزي',desc:'ارفع عقودك، شهادات الجودة، الفواتير — كل وثيقة مرتبطة بالمورد أو العميل في مكان واحد.',tag:'📁 تنظيم تلقائي'},
            {num:'٠٦',icon:'📋',title:'تقارير PDF بنقرة واحدة',desc:'صدّر ملف أي مورد أو عميل كـ PDF احترافي جاهز للمشاركة أو الأرشفة.',tag:'⬇️ PDF تلقائي'},
          ].map((f,i)=>(
            <div key={i} className={styles.featCard} style={{ background:C.navy4, padding:'28px 22px' }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'.12em', color:C.gold, marginBottom:14 }}>{f.num}</div>
              <div style={{ fontSize:24, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontSize:15, fontWeight:800, color:C.white, marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.65 }}>{f.desc}</div>
              <div style={{ display:'inline-flex', padding:'4px 12px', borderRadius:5, background:C.gold3, border:`1px solid rgba(201,168,76,0.18)`, fontSize:11, fontWeight:700, color:C.gold2, marginTop:16 }}>{f.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Compare ── */}
      <div className="lp-compare lp-section-pad" style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'0 52px 80px' }}>
        <div style={{ marginBottom:36 }}>
          <SectionEye>المقارنة</SectionEye>
          <h2 style={{ fontSize:'clamp(22px,3.2vw,38px)', fontWeight:900, letterSpacing:'-.02em' }}>BidLX مقابل الطريقة القديمة</h2>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.borderG}`, borderRadius:14, overflow:'hidden', minWidth:480 }}>
            <thead>
              <tr>
                {['الميزة','BidLX ✦','Excel / واتساب','CRM تقليدي'].map((h,i)=>(
                  <th key={h} style={{ padding:'13px 16px', textAlign:'right', fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:i===1?C.gold2:C.muted, background:'rgba(201,168,76,0.04)', borderBottom:`1px solid ${C.borderG}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['ملف مورد كامل مع مؤشر اكتمال','✓','✗','جزئياً'],
                ['مقارنة الموردين بنفس المنتج','✓','✗','✗'],
                ['تحليل ذكاء اصطناعي فوري','✓','✗','✗'],
                ['تصدير PDF احترافي','✓','يدوي معقد','مدفوع'],
                ['واجهة عربية RTL كاملة','✓','✗','✗'],
                ['مصمم للشركات الصغيرة والمتوسطة','✓','معقد','مكلف جداً'],
              ].map((row,ri)=>(
                <tr key={ri}>
                  {row.map((cell,ci)=>(
                    <td key={ci} style={{ padding:'12px 16px', borderBottom:ri<5?`1px solid ${C.border}`:'none', color:ci===0?C.white:ci===1?(cell==='✓'?C.green:C.muted):C.muted, fontWeight:ci===0?600:ci===1?800:400, background:ci===1?'rgba(201,168,76,0.03)':'transparent', fontSize:cell==='✓'||cell==='✗'?16:13 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="lp-cta" style={{ position:'relative', zIndex:1, margin:'0 52px 80px', borderRadius:20, border:`1px solid ${C.borderG}`, background:`linear-gradient(135deg,${C.navy2},rgba(201,168,76,0.05))`, overflow:'hidden' }}>
        <div style={{ position:'relative', zIndex:1, padding:'72px 48px', textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.15em', textTransform:'uppercase', color:C.gold, marginBottom:16 }}>ابدأ اليوم · مجاناً</div>
          <h2 style={{ fontSize:'clamp(24px,3.8vw,44px)', fontWeight:900, lineHeight:1.15, marginBottom:16 }}>
            شركتك تستحق نظاماً<br />
            <span className={styles.goldText}>بمستوى طموحها</span>
          </h2>
          <p style={{ fontSize:15, color:C.muted, maxWidth:480, margin:'0 auto 32px', lineHeight:1.7 }}>
            انضم إلى الشركات التي قررت وداع العشوائية وبدأت تدير مورديها وعملاءها بشكل احترافي.
          </p>
          <div className="lp-cta-btns" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Btn href="/login" primary>🚀 ابدأ تجربتك المجانية</Btn>
            <Btn href="/login">تحدث مع الفريق</Btn>
          </div>
          <div style={{ marginTop:20, fontSize:12, color:C.muted, display:'flex', gap:18, justifyContent:'center', flexWrap:'wrap' }}>
            {['لا بطاقة ائتمان مطلوبة','٩٠ يوم مجاناً','دعم عربي كامل','إلغاء في أي وقت'].map(t=>(
              <span key={t} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ color:C.green, fontWeight:800 }}>✓</span> {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer" style={{ position:'relative', zIndex:1, borderTop:`1px solid ${C.border}`, maxWidth:1200, margin:'0 auto', width:'100%', padding:'24px 52px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:12, color:C.muted }}>© ٢٠٢٦ BidLX · العقل الإلكتروني لشركتك · جميع الحقوق محفوظة</div>
        <div className="lp-footer-links" style={{ display:'flex', gap:20 }}>
          {[{href:'/',l:'الرئيسية'},{href:'/privacy',l:'الخصوصية'},{href:'/terms',l:'الشروط'},{href:'/tech-center',l:'الدعم'},{href:'/contact',l:'تواصل معنا'}].map(n=>(
            <Link key={n.l} href={n.href} style={{ fontSize:12, color:n.l==='تواصل معنا'?C.gold2:C.muted, fontWeight:n.l==='تواصل معنا'?700:400, textDecoration:'none' }}>{n.l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
