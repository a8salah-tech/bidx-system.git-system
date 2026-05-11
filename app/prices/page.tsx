'use client';

import { useState } from 'react';
import Link from 'next/link';
import LayoutFrame from '../components/LayoutFrame';

// ✅ الدول مسحوبة من الملف الصحيح
import { COUNTRIES } from '../components/options';

const C = {
  navy:    '#0A1628',
  navy2:   '#0F2040',
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  gold3:   'rgba(201,168,76,0.10)',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  border:  'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.15)',
  green:   '#22C55E',
  card:    'rgba(15,32,64,0.7)',
};

const MONTHLY_FEATURES = [
  'جميع الأقسام السبعة كاملة',
  'لوحة تحكم موحدة بالوقت الفعلي',
  'إدارة الموردين والمنتجات',
  'إدارة العملاء والمبيعات',
  'الموارد البشرية والرواتب',
  'إدارة الحسابات والتقارير',
  'إدارة التسويق والحملات',
  'نسخ احتياطي يومي تلقائي',
  'دعم فني عبر البريد الإلكتروني',
  'وصول من أي جهاز وأي مكان',
  'تحديثات مجانية مستمرة',
  'تشفير SSL للبيانات',
];

const ANNUAL_EXTRAS = [
  'كل مميزات الخطة الشهرية',
  'توفير $41 مقارنة بالشهري',
  'أولوية في الدعم الفني',
  'تقارير متقدمة وتحليلات ذكية',
  'مدير حساب مخصص',
  'إعداد وتهيئة مجانية',
];

// ─────────────────────────────────────────────
// Modal الاشتراك
// ─────────────────────────────────────────────
function SignupModal({ plan, onClose }: { plan: 'monthly' | 'annual'; onClose: () => void }) {
  const [form, setForm]       = useState({ name: '', company: '', country: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const planLabel = plan === 'monthly' ? 'الشهرية ($20/شهر)' : 'السنوية ($199/سنة)';
  const isValid   = !!(form.name && form.company && form.country && form.email);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError('حدث خطأ — تواصل معنا على support@bidlx.com');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(10,22,40,0.92)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.navy2, border: `1px solid ${C.borderG}`,
        borderRadius: 20, width: '100%', maxWidth: 500,
        padding: 'clamp(22px,5vw,40px) clamp(18px,5vw,36px)',
        position: 'relative', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        margin: 'auto',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
          width: 32, height: 32, cursor: 'pointer', color: C.muted, fontSize: 18,
          display: 'grid', placeItems: 'center',
        }}>×</button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: C.gold2, marginBottom: 10 }}>
              تم التسجيل بنجاح!
            </h2>
            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.7 }}>
              مرحباً <strong style={{ color: C.white }}>{form.name}</strong>، سيتواصل معك فريق BidLX
              خلال <strong style={{ color: C.gold }}>24 ساعة</strong> لتفعيل حسابك وبدء الشهر الأول المجاني.
            </p>
            <div style={{
              margin: '16px 0', padding: '11px 14px',
              background: C.gold3, borderRadius: 10,
              border: `1px solid ${C.borderG}`, fontSize: 12.5, color: C.gold2,
            }}>
              📧 راجع بريدك: <strong>{form.email}</strong>
            </div>
            <button onClick={onClose} style={{
              padding: '11px 26px',
              background: `linear-gradient(135deg,${C.gold},${C.gold2})`,
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 800, color: C.navy,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>حسناً، شكراً!</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: C.gold3, border: `1px solid ${C.borderG}`,
                borderRadius: 20, padding: '4px 12px', fontSize: 12, color: C.gold2, marginBottom: 10,
              }}>✨ الشهر الأول مجاناً</div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: C.white, margin: '0 0 4px' }}>
                ابدأ مع BidLX
              </h2>
              <p style={{ color: C.muted, fontSize: 12.5, margin: 0 }}>
                خطة {planLabel} · لا بطاقة ائتمان الآن
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Field label="الاسم الكامل" required>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="محمد أحمد" style={inputSt} />
              </Field>

              <Field label="اسم الشركة / المطعم" required>
                <input name="company" value={form.company} onChange={handleChange}
                  placeholder="شركة النجاح للتجارة" style={inputSt} />
              </Field>

              {/* ✅ select مصلوح الألوان */}
<Field label="الدولة" required>
  <select
    name="country"
    value={form.country}
    onChange={handleChange}
    style={{
      ...inputSt,
      cursor: 'pointer',
      color: form.country ? C.white : (C.muted || '#888'),
    }}
  >
    <option value="" disabled style={{ background: C.navy2, color: C.muted || '#888' }}>
      اختر دولتك
    </option>
    {COUNTRIES.map((c) => (
      <option key={c.id} value={c.value} style={{ background: C.navy2, color: C.white }}>
        {c.label}
      </option>
    ))}
  </select>
</Field>

              <Field label="البريد الإلكتروني" required>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="your@email.com"
                  style={{ ...inputSt, direction: 'ltr', textAlign: 'left' }} />
              </Field>

              <Field label="رقم الهاتف (اختياري)">
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+966 5X XXX XXXX"
                  style={{ ...inputSt, direction: 'ltr', textAlign: 'left' }} />
              </Field>

              {error && (
                <div style={{
                  padding: '9px 13px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, fontSize: 12.5, color: '#FCA5A5',
                }}>{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !isValid}
                style={{
                  marginTop: 4, padding: '13px',
                  background: !isValid
                    ? 'rgba(201,168,76,0.25)'
                    : `linear-gradient(135deg,${C.gold},${C.gold2})`,
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 800, color: C.navy,
                  cursor: !isValid ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: loading ? 0.8 : 1,
                  transition: 'all .2s',
                }}
              >
                {loading ? '⏳ جاري التسجيل...' : '🚀 سجّل الآن — الشهر الأول مجاناً'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, margin: 0 }}>
                بالتسجيل توافق على{' '}
                <Link href="/terms" style={{ color: C.gold2 }}>الشروط</Link>{' '}و{' '}
                <Link href="/privacy" style={{ color: C.gold2 }}>الخصوصية</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 5 }}>
        {label} {required && <span style={{ color: C.gold }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '11px 13px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, fontSize: 14, color: C.white,
  fontFamily: "'Tajawal', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: C.green, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 13, color: highlight ? C.gold2 : C.white, fontWeight: highlight ? 600 : 400 }}>
        {text}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// الصفحة
// ─────────────────────────────────────────────
export default function PricingPage() {
  const [modal, setModal] = useState<'monthly' | 'annual' | null>(null);

  return (
    <LayoutFrame>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ✅ إصلاح select - خلفية داكنة في كل المتصفحات */
        select { appearance: auto; -webkit-appearance: auto; }
        select option { background-color: #0F2040 !important; color: #FAFAF8 !important; }
        input:focus, select:focus { border-color: rgba(201,168,76,0.5) !important; outline: none; }

        .pg { display:flex; gap:24px; justify-content:center; flex-wrap:wrap; padding:0 16px 80px; max-width:900px; margin:0 auto; }
        .pc { flex:1 1 300px; min-width:280px; max-width:420px; }
        .cg { display:grid; grid-template-columns:1fr 1fr 1fr; }
        .cg > div { padding:12px 14px; font-size:13px; }

        @media (max-width:640px) {
          .pg { flex-direction:column; align-items:stretch; padding:0 12px 60px; gap:16px; }
          .pc { max-width:100% !important; }
          .cg > div { padding:9px 10px !important; font-size:11.5px !important; }
          .hero { padding:50px 14px 36px !important; }
          .hero h1 { font-size:26px !important; }
          .hero p  { font-size:14px !important; }
          .faq  { padding:0 12px 60px !important; }
          .cstm { padding:0 12px 80px !important; }
          .cbox { padding:28px 18px !important; }
        }
      `}</style>

      {modal && <SignupModal plan={modal} onClose={() => setModal(null)} />}

      {/* Hero */}
      <section className="hero" style={{ textAlign:'center', padding:'80px 24px 56px', position:'relative' }}>
        <div style={{
          position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
          width:500, height:260,
          background:'radial-gradient(ellipse,rgba(201,168,76,0.12) 0%,transparent 70%)',
          pointerEvents:'none',
        }}/>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:C.gold3, border:`1px solid ${C.borderG}`,
          borderRadius:20, padding:'5px 15px', fontSize:13, color:C.gold2, marginBottom:18,
        }}>🎉 عرض الإطلاق · الشهر الأول مجاناً</div>
        <h1 style={{ fontSize:'clamp(26px,5vw,50px)', fontWeight:900, color:C.white, margin:'0 0 12px', lineHeight:1.2 }}>
          سعر واحد · كل شيء مشمول
        </h1>
        <p style={{ fontSize:'clamp(13px,2.5vw,17px)', color:C.muted, maxWidth:460, margin:'0 auto', lineHeight:1.7 }}>
          لا مفاجآت، لا تكاليف خفية — جميع أقسام BidLX السبعة بسعر ثابت وشفاف
        </p>
      </section>

      {/* البطاقات */}
      <div className="pg">

        {/* الشهرية */}
        <div className="pc" style={{
          background:C.card, border:`1px solid ${C.borderG}`,
          borderRadius:24, padding:'clamp(22px,4vw,34px) clamp(18px,4vw,30px)',
          backdropFilter:'blur(20px)',
        }}>
          <div style={{ fontSize:11.5, color:C.muted, marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' }}>
            الخطة الشهرية
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, marginBottom:6 }}>
            <span style={{ fontSize:'clamp(38px,7vw,50px)', fontWeight:900, color:C.white, lineHeight:1 }}>$20</span>
            <span style={{ fontSize:13.5, color:C.muted, marginBottom:5 }}>/شهر</span>
          </div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)',
            borderRadius:20, padding:'3px 10px', fontSize:11.5, color:C.green, marginBottom:14,
          }}>🎁 الشهر الأول مجاناً</div>
          <p style={{ fontSize:12.5, color:C.muted, lineHeight:1.6, margin:'0 0 20px' }}>
            مرونة كاملة — ألغِ في أي وقت
          </p>
          <div style={{ marginBottom:22 }}>
            {MONTHLY_FEATURES.map((f,i) => <Feature key={i} text={f} highlight={i===0}/>)}
          </div>
          <button onClick={() => setModal('monthly')} style={{
            width:'100%', padding:'12px',
            background:'transparent', border:`1.5px solid ${C.borderG}`,
            borderRadius:12, fontSize:14, fontWeight:700, color:C.gold2,
            cursor:'pointer', fontFamily:'inherit',
          }}>ابدأ مجاناً — الشهري ←</button>
        </div>

        {/* السنوية */}
        <div className="pc" style={{
          background:`linear-gradient(145deg,rgba(201,168,76,0.12) 0%,rgba(15,32,64,0.9) 60%)`,
          border:`1.5px solid ${C.gold}`, borderRadius:24,
          padding:'clamp(22px,4vw,34px) clamp(18px,4vw,30px)',
          position:'relative', boxShadow:'0 0 50px rgba(201,168,76,0.15)',
        }}>
          <div style={{
            position:'absolute', top:-12, right:22,
            background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
            color:C.navy, fontSize:11, fontWeight:800,
            padding:'4px 12px', borderRadius:20,
            boxShadow:'0 4px 16px rgba(201,168,76,0.4)',
          }}>⭐ الأفضل قيمة</div>

          <div style={{ fontSize:11.5, color:C.gold2, marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em' }}>
            الخطة السنوية
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:'clamp(38px,7vw,50px)', fontWeight:900, color:C.gold2, lineHeight:1 }}>$199</span>
            <span style={{ fontSize:13.5, color:C.muted, marginBottom:5 }}>/سنة</span>
          </div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>
            بدلاً من <span style={{ textDecoration:'line-through', color:'#EF4444' }}>$240</span>
            {' '}— توفير <strong style={{ color:C.green }}>$41</strong>
          </div>
          <div style={{
            display:'inline-flex', gap:5, alignItems:'center',
            background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)',
            borderRadius:20, padding:'3px 10px', fontSize:11.5, color:C.green, marginBottom:10,
          }}>🎁 الشهر الأول مجاناً</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>
            ≈ <strong style={{ color:C.gold2 }}>$16.6</strong>/شهر فقط
          </div>
          <div style={{ marginBottom:22 }}>
            {ANNUAL_EXTRAS.map((f,i) => <Feature key={i} text={f} highlight={i<2}/>)}
          </div>
          <button onClick={() => setModal('annual')} style={{
            width:'100%', padding:'13px',
            background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
            border:'none', borderRadius:12,
            fontSize:14, fontWeight:800, color:C.navy,
            cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 6px 24px rgba(201,168,76,0.3)',
          }}>ابدأ مجاناً — السنوي ←</button>
        </div>
      </div>

      {/* مقارنة */}
      <section style={{ maxWidth:760, margin:'0 auto', padding:'0 16px 68px' }}>
        <h2 style={{ textAlign:'center', fontSize:'clamp(19px,4vw,25px)', fontWeight:800, color:C.white, marginBottom:24 }}>
          مقارنة الخطتين
        </h2>
        <div style={{ background:C.card, border:`1px solid ${C.borderG}`, borderRadius:18, overflow:'hidden', backdropFilter:'blur(20px)' }}>
          <div className="cg" style={{ background:'rgba(201,168,76,0.08)', borderBottom:`1px solid ${C.borderG}` }}>
            <div style={{ padding:'13px 14px', fontSize:12, color:C.muted, fontWeight:600 }}>الميزة</div>
            <div style={{ padding:'13px 14px', fontSize:12, color:C.muted, fontWeight:600, textAlign:'center' }}>الشهرية</div>
            <div style={{ padding:'13px 14px', fontSize:12, color:C.gold2, fontWeight:700, textAlign:'center' }}>السنوية ⭐</div>
          </div>
          {[
            ['السعر',          '$20/شهر',       '$199/سنة'],
            ['الشهر الأول',    'مجاناً ✓',      'مجاناً ✓'],
            ['الأقسام السبعة', '✓',             '✓'],
            ['الدعم الفني',    'بريد إلكتروني', 'أولوية + مدير حساب'],
            ['تقارير متقدمة',  '—',             '✓'],
            ['إعداد مجاني',    '—',             '✓'],
            ['التوفير السنوي', '—',             '$41'],
          ].map(([feat,mo,yr],i) => (
            <div key={i} className="cg" style={{
              borderBottom: i<6 ? `1px solid ${C.border}` : 'none',
              background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ color:C.white }}>{feat}</div>
              <div style={{ color:C.muted, textAlign:'center' }}>{mo}</div>
              <div style={{ color:C.gold2, textAlign:'center', fontWeight:600 }}>{yr}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" style={{ maxWidth:660, margin:'0 auto', padding:'0 16px 72px' }}>
        <h2 style={{ textAlign:'center', fontSize:'clamp(19px,4vw,25px)', fontWeight:800, color:C.white, marginBottom:24 }}>
          أسئلة شائعة
        </h2>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          {[
            ['هل الشهر الأول مجاني فعلاً؟',   'نعم، بدون أي شرط ودون الحاجة لبطاقة ائتمان. سيتواصل معك فريقنا لتفعيل حسابك خلال 24 ساعة.'],
            ['هل يمكنني الإلغاء في أي وقت؟',  'بالطبع — الخطة الشهرية تُلغى في أي وقت. الخطة السنوية تستمر حتى نهاية السنة.'],
            ['كم عدد المستخدمين المسموح بهم؟', 'السعر يشمل عدداً غير محدود من المستخدمين داخل شركتك.'],
            ['هل هناك تكاليف خفية؟',           'لا — السعر ثابت وشامل لجميع الأقسام والتحديثات والدعم.'],
            ['كيف أبدأ؟',                       'سجّل بياناتك وسيتواصل معك فريقنا خلال 24 ساعة لإعداد حسابك مجاناً.'],
          ].map(([q,a],i) => (
            <div key={i} style={{
              background:C.card, border:`1px solid ${C.borderG}`,
              borderRadius:13, padding:'16px 18px', backdropFilter:'blur(16px)',
            }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.white, marginBottom:6 }}>{q}</div>
              <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* النظام المخصص */}
      <section className="cstm" style={{ maxWidth:760, margin:'0 auto', padding:'0 16px 96px' }}>
        <div className="cbox" style={{
          background:`linear-gradient(135deg,rgba(201,168,76,0.08) 0%,rgba(15,32,64,0.6) 100%)`,
          border:`1px solid ${C.borderG}`, borderRadius:22,
          padding:'clamp(28px,5vw,46px) clamp(18px,5vw,38px)',
          textAlign:'center', position:'relative', overflow:'hidden',
          backdropFilter:'blur(20px)',
        }}>
          <div style={{
            position:'absolute', top:-40, right:-40, width:160, height:160,
            background:'radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 70%)',
            pointerEvents:'none',
          }}/>
          <div style={{ fontSize:36, marginBottom:12 }}>🏢</div>
          <h2 style={{ fontSize:'clamp(17px,4vw,23px)', fontWeight:800, color:C.white, margin:'0 0 10px' }}>
            هل تحتاج نظاماً مخصصاً لشركتك؟
          </h2>
          <p style={{ fontSize:'clamp(12.5px,2vw,14.5px)', color:C.muted, lineHeight:1.7, maxWidth:440, margin:'0 auto 22px' }}>
            إذا كانت شركتك تحتاج تطويرات خاصة، تكاملات مع أنظمة قائمة، أو نظاماً مبنياً من الصفر على مقاسك — فريقنا جاهز.
          </p>
          <a
            href="mailto:support@bidlx.com?subject=طلب نظام مخصص&body=مرحباً، أود الاستفسار عن إمكانية تطوير نظام مخصص لشركتنا."
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:`linear-gradient(135deg,${C.gold},${C.gold2})`,
              color:C.navy, padding:'clamp(10px,2vw,13px) clamp(18px,4vw,28px)',
              borderRadius:12, fontSize:'clamp(12.5px,2vw,14.5px)', fontWeight:800,
              textDecoration:'none', boxShadow:'0 8px 28px rgba(201,168,76,0.3)',
            }}
          >
            📧 تواصل معنا — support@bidlx.com
          </a>
          <p style={{ marginTop:13, fontSize:12, color:C.muted }}>
            نرد خلال 24 ساعة · عروض مخصصة · استشارة مجانية
          </p>
        </div>
      </section>
    </LayoutFrame>
  );
}
