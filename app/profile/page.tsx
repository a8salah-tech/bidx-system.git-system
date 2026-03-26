'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AppShell from "../components/AppShell";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// ── الهوية اللونية لـ BidLX OS ──────────────────────────────────────────
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
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchProfile() {
    try {
      // جلب بيانات المستخدم المسجل حالياً من نظام التوثيق
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // جلب بياناته من جدول profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // نضع الإيميل من (user) وباقي البيانات من (profileData) في متغير واحد
// نضع الإيميل والتاريخ من (user) وباقي البيانات من (profileData)
setProfile({
  ...profileData,
  email: user.email,
  created_at: profileData?.created_at || user?.created_at // إضافة هذا السطر لضمان ظهور التاريخ ✅
});
      }
    } finally {
      setLoading(false);
    }
  }
  fetchProfile();
}, []);
const [isEditing, setIsEditing] = useState(false);
const [tempProfile, setTempProfile] = useState({}); // لتخزين التعديلات المؤقتة
  return (
    <AppShell>
      <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif", padding: '40px 30px', minHeight: '100vh', color: C.white }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');`}</style>

        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          {/* Header Section with Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 24, height: 2, background: C.gold }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: C.gold, letterSpacing: '.15em', textTransform: 'uppercase' }}>إعدادات النظام المركزية</span>
              </div>
            </div>
            
            <div style={{ 
              padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #C9A84C 0%, #8A6E2F 100%)', 
              color: C.navy, fontWeight: 900, fontSize: 13, boxShadow: '0 4px 15px rgba(201,168,76,0.3)',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>🛡️</span> صلاحيات كاملة (Admin)
            </div>
          </div>

          {loading ? (
            <div style={{ color: C.gold, textAlign: 'center', padding: 50 }}>جاري استدعاء بيانات الإدارة...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 25 }}>
              
              {/* Left Column: Avatar & Quick Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                <div style={{ 
                  background: C.navy2, border: `1px solid ${C.borderG}`, borderRadius: 20, 
                  padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden'
                }}>
                  {/* Decorative Background */}
                  <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, background: C.gold, opacity: 0.05, borderRadius: '50%', filter: 'blur(30px)' }} />
                  
{/* حاوية الصورة الشخصية - عرض فقط */}
<div style={{ 
  width: 120, height: 120, borderRadius: '50%', 
  border: `3px solid ${C.gold}`, padding: 5, 
  margin: '0 auto 20px', position: 'relative',
  background: C.navy, overflow: 'hidden'
}}>
  {profile?.avatar_url ? (
    <img 
      src={profile.avatar_url} 
      alt="صورة المدير" 
      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
    />
  ) : (
    /* في حال عدم وجود صورة، نعرض أول حرف من الاسم بشكل فخم */
    <div style={{ 
      width: '100%', height: '100%', borderRadius: '50%', 
      display: 'grid', placeItems: 'center', 
      fontSize: 48, fontWeight: 900, color: C.gold2,
      background: `linear-gradient(135deg, ${C.navy} 0%, #050a14 100%)`
    }}>
      {profile?.full_name?.[0] || 'A'}
    </div>
  )}
</div>
                  
                  <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 5 }}>{profile?.full_name}</h2>
                  <div style={{ color: C.gold, fontSize: 14, fontWeight: 700, marginBottom: 15 }}>مدير عام الشركة</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, padding: '4px 10px', background: C.gold3, borderRadius: 4, color: C.gold2, border: `1px solid ${C.borderG}` }}>Member</span>
                    <span style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 4, color: C.green, border: '1px solid rgba(34,197,94,0.2)' }}>نشط</span>
                  </div>
                </div>

                <div style={{ background: C.navy2, border: `1px solid ${C.borderG}`, borderRadius: 20, padding: 25 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 15 }}>إحصائيات الإدارة</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                    <StatSmall label="الموردين" val="١٢٤" />
                    <StatSmall label="العملاء" val="٥٨" />
                    <StatSmall label="الصفقات" val="١٢" />
                    <StatSmall label="المهام" val="٩+" />
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Info & Control */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
  {/* بطاقة المعلومات الأساسية */}
  <div style={{ background: C.navy2, border: `1px solid ${C.borderG}`, borderRadius: 20, padding: 30 }}>
    
    {/* الهيدر: العنوان وزر التعديل في سطر واحد */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.gold2, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
        <span style={{ fontSize: 20 }}>📑</span> المعلومات الأساسية
      </h3>
      
<button 
  onClick={() => setIsEditing(!isEditing)} 
  style={{ 
    background: isEditing ? '#C9A84C' : 'transparent', // يتغير اللون عند التعديل
    color: isEditing ? '#0A1628' : '#C9A84C', 
    border: `1px solid #C9A84C`,
    padding: '5px 15px', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontSize: 12, 
    fontWeight: 700,
    transition: '0.3s all'
  }}
>
  {isEditing ? '💾 حفظ التغييرات' : '✏️ تعديل البيانات'}
</button>
    </div>

    {/* شبكة المعلومات */}
    <div style={{ display: 'grid', gap: 20 }}>
      <InfoRow 
        label="البريد الإلكتروني الموثق" 
        value={profile?.email || profile?.user_email || "جاري الاستدعاء..."} 
        icon="✉️"
      />

      <InfoRow 
        label="أسم الشركة" 
        value="Bridge Edge" 
        icon="🏢" 
      />

<div style={{ display: 'flex', alignItems: 'center', gap: 15, fontFamily: 'Tajawal, sans-serif' }}>
  <div style={{ 
    fontSize: 20, width: 40, height: 40, borderRadius: 10, 
    background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center' 
  }}>📱</div>
  
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 3, fontFamily: 'Tajawal, sans-serif' }}>
      رقم التواصل المباشر
    </div>
    
    {isEditing ? (
      <input 
        type="text"
        defaultValue={profile?.phone_number || ''}
        onChange={(e) => setTempProfile({ ...tempProfile, phone_number: e.target.value })}
        style={{ 
          background: '#050a14', 
          border: `1px solid ${C.gold}`, 
          color: C.white, 
          padding: '4px 10px', 
          borderRadius: 5, 
          width: '100%', 
          outline: 'none', 
          fontSize: 14,
          fontFamily: 'Tajawal, sans-serif' // الحفاظ على الخط داخل الإدخال
        }}
      />
    ) : (
      <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: 'Tajawal, sans-serif' }}>
        {profile?.phone_number || 'غير مضاف'}
      </div>
    )}
  </div>
</div>

      <InfoRow 
        label="تاريخ التسجيل" 
        value={
          profile?.created_at 
            ? new Date(profile.created_at).toLocaleDateString('ar-EG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : "جاري استدعاء البيانات..."
        } 
        icon="🗓️" 
      />

      <InfoRow 
        label="مقر الإدارة" 
        value="جاكرتا، إندونيسيا" 
        icon="📍" 
      />
    </div>
  </div>

  {/* بطاقة تحديث السجلات السفلى */}
  <div style={{ 
    background: `linear-gradient(135deg, ${C.navy2} 0%, #050a14 100%)`, 
    border: `1px solid ${C.borderG}`, 
    borderRadius: 20, 
    padding: 30,
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  }}>
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.white, marginBottom: 5 }}>تحديث سجلات العقل الإلكتروني</div>
      <div style={{ fontSize: 13, color: C.muted }}>يمكنك تعديل بياناتك الشخصية وإعدادات الأمان من هنا</div>
    </div>
    
    <button style={{ 
      background: 'transparent', 
      border: `1px solid ${C.gold}`, 
      color: C.gold,
      padding: '12px 24px', 
      borderRadius: 10, 
      fontWeight: 800, 
      cursor: 'pointer'
    }}>
      تعديل البيانات
    </button>
  </div>
</div>

            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ── المكونات الفرعية للتصميم ──────────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
      <div style={{ fontSize: 20, width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'grid', placeItems: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{value}</div>
      </div>
    </div>
  );
}

function StatSmall({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: C.gold2 }}>{val}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{label}</div>
    </div>
  );
}