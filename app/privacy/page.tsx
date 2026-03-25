'use client';

import React from 'react';
import LayoutFrame from '../components/LayoutFrame';

const S = {
  gold2:   '#E8C97A',
  muted:   '#8A9BB5',
  white:   '#FAFAF8',
  navy2:   '#0F2040',
  borderG: 'rgba(201,168,76,0.15)',
};

export default function PrivacyPage() {
  return (
    <LayoutFrame>
      <div style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif", lineHeight: 1.8 }}>
        
        <h1 style={{ color: S.gold2, fontSize: '36px', fontWeight: 900, marginBottom: '40px', textAlign: 'center' }}>
          سياسة الخصوصية لـ BidLX
        </h1>

        <div style={{ background: S.navy2, padding: '40px', borderRadius: '24px', border: `1px solid ${S.borderG}`, color: S.white }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '22px', marginBottom: '15px' }}>1. التزامنا تجاه بياناتك</h2>
            <p style={{ color: S.muted }}>
              في BidLX، ندرك أن بيانات عملائك ومورديك هي أصول شركتك الأكثر قيمة. نحن نلتزم بحماية هذه البيانات باستخدام أعلى معايير التشفير والأمان الرقمي.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '22px', marginBottom: '15px' }}>2. البيانات التي نجمعها</h2>
            <ul style={{ color: S.muted, paddingRight: '20px' }}>
              <li>المعلومات الإدارية التي تدخلها لتنظيم ملفات الشركة.</li>
              <li>بيانات الاتصال الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف).</li>
              <li>سجلات الأداء لغرض تحسين تجربة "العقل الإلكتروني" الخاص بك.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '22px', marginBottom: '15px' }}>3. كيف نستخدم معلوماتك؟</h2>
            <p style={{ color: S.muted }}>
              نستخدم البيانات فقط لتشغيل نظام BidLX وتوفير التقارير الإدارية لك. لا نقوم ببيع أو مشاركة بيانات شركتك مع أي طرف ثالث لأغراض إعلانية نهائياً.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '22px', marginBottom: '15px' }}>4. أمن البيانات</h2>
            <p style={{ color: S.muted }}>
              يتم تخزين كافة البيانات في خوادم مشفرة وآمنة، ونقوم بإجراء نسخ احتياطي دوري لضمان عدم ضياع أي ملفات إدارية تخص مؤسستك.
            </p>
          </section>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: `1px solid ${S.borderG}`, textAlign: 'center' }}>
            <p style={{ color: S.gold2, fontWeight: 700 }}>لديك استفسار حول خصوصيتك؟</p>
            <p style={{ color: S.muted }}>يمكنك دائماً التواصل مع فريق الدعم الفني عبر صفحة اتصل بنا.</p>
          </div>

        </div>
      </div>
    </LayoutFrame>
  );
}