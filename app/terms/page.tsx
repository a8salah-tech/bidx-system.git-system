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

export default function TermsPage() {
  return (
    <LayoutFrame>
      <div style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif", lineHeight: 1.8 }}>
        
        <h1 style={{ color: S.gold2, fontSize: '36px', fontWeight: 900, marginBottom: '40px', textAlign: 'center' }}>
          شروط وأحكام استخدام BidLX
        </h1>

        <div style={{ background: S.navy2, padding: '40px', borderRadius: '24px', border: `1px solid ${S.borderG}`, color: S.white }}>
          
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '20px', marginBottom: '12px' }}>١. قبول الشروط</h2>
            <p style={{ color: S.muted, fontSize: '15px' }}>
              بمجرد استخدامك لنظام BidLX، فإنك توافق على الالتزام بهذه الشروط. هذا النظام مصمم لمساعدة الشركات الصغيرة والمتوسطة على تنظيم عملياتها الإدارية وتجاوز العشوائية.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '20px', marginBottom: '12px' }}>٢. حساب الشركة وأمن البيانات</h2>
            <p style={{ color: S.muted, fontSize: '15px' }}>
              تتحمل الشركة المستخدمة مسؤولية الحفاظ على سرية معلومات الدخول. أي نشاط يحدث تحت حساب شركتك هو مسؤوليتك القانونية.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '20px', marginBottom: '12px' }}>٣. الاستخدام المشروع</h2>
            <p style={{ color: S.muted, fontSize: '15px' }}>
              يُحظر استخدام BidLX في أي أنشطة غير قانونية أو تخزين بيانات تخالف القوانين المحلية والدولية. النظام مخصص حصراً لتنظيم ملفات العملاء والموردين والحسابات الإدارية.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '20px', marginBottom: '12px' }}>٤. إخلاء المسؤولية</h2>
            <p style={{ color: S.muted, fontSize: '15px' }}>
              نحن نوفر "العقل الإلكتروني" كأداة تنظيمية. BidLX لا يتحمل مسؤولية أي قرارات تجارية خاطئة أو أخطاء محاسبية ناتجة عن إدخال بيانات غير صحيحة من قبل المستخدم.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ color: S.gold2, fontSize: '20px', marginBottom: '12px' }}>٥. التعديلات على الخدمة</h2>
            <p style={{ color: S.muted, fontSize: '15px' }}>
              نحتفظ بالحق في تحديث ميزات النظام وتطويره باستمرار لضمان تقديم أفضل تجربة "تجارة بلا حدود" لمستخدمينا.
            </p>
          </section>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: `1px solid ${S.borderG}`, textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: S.muted }}>آخر تحديث: مارس ٢٠٢٦</p>
          </div>

        </div>
      </div>
    </LayoutFrame>
  );
}