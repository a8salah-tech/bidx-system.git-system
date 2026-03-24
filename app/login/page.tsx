'use client';

export const dynamic = "force-dynamic";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from './login.module.css';

const COLORS = {
  navy: '#0A1628', gold2: '#E8C97A', white: '#FAFAF8', 
  muted: '#8A9BB5', border: 'rgba(255,255,255,0.07)', navy3: '#0C1A32',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('Indonesia');

  // مراقب الحالة لضمان التوجيه التلقائي
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/suppliers');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { company_name: companyName, country } }
        });
        if (error) throw error;
        alert('تم إنشاء الحساب! يرجى تأكيد البريد الإلكتروني.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/suppliers` },
      });
    } catch (err) { console.error(err); } finally { setGLoading(false); }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Tajawal', sans-serif", color: COLORS.white, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        * { font-family: 'Tajawal', sans-serif !important; } /* إجبار جميع العناصر على استخدام نفس الخط */
      `}</style>
      
      <div className={styles.glow} />

      <div className={styles.card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className={styles.logoWrap}><div className={styles.logoSq}>TF</div></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.gold2, marginTop: 14 }}>BidLX</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, letterSpacing: '.1em' }}>BidLX OS</div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{isSignUp ? 'إنشاء حساب جديد' : 'مرحباً بعودتك'}</h1>
          <p style={{ fontSize: 14, color: COLORS.muted, marginTop: 6 }}>{isSignUp ? 'ابدأ رحلتك التجارية مع BidLX' : 'سجّل دخولك للمتابعة'}</p>
        </div>

        {error && <div className={styles.errorBox}><span>⚠️</span> {error}</div>}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, display: 'block', marginBottom: 7 }}>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@company.com" required className={styles.input} style={{ direction: 'ltr', textAlign: 'left' }} />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, display: 'block', marginBottom: 7 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className={styles.input} style={{ direction: 'ltr', textAlign: 'left', paddingLeft: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: COLORS.muted }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, display: 'block', marginBottom: 7 }}>اسم الشركة</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="شركة الجسر المتطور" required className={styles.input} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, display: 'block', marginBottom: 7 }}>الدولة</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={styles.input} style={{ background: COLORS.navy3, color: COLORS.white }}>
                  <option value="Indonesia">إندونيسيا 🇮🇩</option>
                  <option value="Lebanon">لبنان 🇱🇧</option>
                  <option value="Egypt">مصر 🇪🇬</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? <span className={styles.spinner} /> : (isSignUp ? 'إنشاء حساب' : '← دخول')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.muted }}>أو المتابعة عبر</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Google Button with SVG Logo */}
        <button onClick={handleGoogle} disabled={gLoading} className={styles.btnGoogle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {gLoading ? (
            <span className={styles.spinnerDark} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>متابعة مع Google</span>
            </>
          )}
        </button>

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: COLORS.muted }}>
          {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ background: 'none', border: 'none', color: COLORS.gold2, fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}