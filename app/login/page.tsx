'use client';

export const dynamic = "force-dynamic";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from './login.module.css';

const C = {
  navy:    '#0A1628',
  navy2:   '#0F2040',
  navy3:   '#0C1A32',
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  gold3:   'rgba(201,168,76,0.10)',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  border:  'rgba(255,255,255,0.07)',
  borderG: 'rgba(201,168,76,0.18)',
  green:   '#22C55E',
  red:     '#EF4444',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  // ── تسجيل دخول بالإيميل والباسورد ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else {
      router.push('/suppliers');
    }
    setLoading(false);
  }

  // ── تسجيل دخول بـ Google ──
  async function handleGoogle() {
    setGLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/suppliers` },
    });
    setGLoading(false);
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: C.navy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Tajawal', sans-serif",
        color: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');`}</style>

      {/* Ambient glow */}
      <div className={styles.glow} />

      {/* ── Card ── */}
      <div className={styles.card}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className={styles.logoWrap}>
            <div className={styles.logoSq}>TF</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.gold2, marginTop: 14, letterSpacing: '-.01em' }}>
            TradeFlow OS
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Bridge Edge OS
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 6 }}>مرحباً بعودتك</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>سجّل دخولك للمتابعة</p>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 7 }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              className={styles.input}
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 7 }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={styles.input}
                style={{ direction: 'ltr', textAlign: 'left', paddingLeft: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: C.muted, padding: 0, lineHeight: 1,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={styles.btnPrimary}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              '← دخول'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>أو تسجيل الدخول بـ</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={gLoading}
          className={styles.btnGoogle}
        >
          {gLoading ? (
            <span className={styles.spinnerDark} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              متابعة مع Google
            </>
          )}
        </button>

        {/* Footer */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: C.muted }}>
          ليس لديك حساب؟{' '}
          <a href="mailto:admin@bridgeedge.com" style={{ color: C.gold2, fontWeight: 700, textDecoration: 'none' }}>
           إنشاء حساب جديد
          </a>
        </div>

        {/* Back to home */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            → العودة للصفحة الرئيسية
          </a>
        </div>

      </div>
    </div>
  );
}
