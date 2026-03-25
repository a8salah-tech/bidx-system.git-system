'use client';

import React from 'react';
import LayoutFrame from '../components/LayoutFrame';

const S = {
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  muted:   '#8A9BB5',
  white:   '#FAFAF8',
  navy2:   '#0F2040',
  navy4:   '#111D35',
  borderG: 'rgba(201,168,76,0.15)',
};

export default function SupportPage() {
  return (
    <LayoutFrame>
      <div style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif" }}>
        
        {/* ── عنوان الصفحة ── */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', color: S.white }}>
            مركز دعم <span style={{ color: S.gold2 }}>BidLX</span> التقني
          </h1>
          <p style={{ color: S.muted, fontSize: '18px' }}>نحن هنا لنضمن أن عقلك الإلكتروني يعمل بكامل طاقته ودون توقف.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          
          {/* ── بطاقة الدعم الفوري ── */}
          <div style={{ background: S.navy4, padding: '35px', borderRadius: '28px', border: `2px solid ${S.gold}`, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>💬</div>
            <h3 style={{ color: S.white, marginBottom: '10px' }}>دعم واتساب المباشر</h3>
            <p style={{ color: S.muted, fontSize: '14px', marginBottom: '25px' }}>تحدث مع خبير تقني الآن لحل مشكلتك في دقائق.</p>
            <a href="https://wa.me/YOUR_NUMBER" style={{ 
              display: 'inline-block', background: S.gold, color: '#0A1628', padding: '12px 30px', 
              borderRadius: '10px', fontWeight: 900, textDecoration: 'none' 
            }}>تواصل معنا الآن</a>
          </div>

          {/* ── بطاقة البريد الرسمي ── */}
          <div style={{ background: S.navy2, padding: '35px', borderRadius: '28px', border: `1px solid ${S.borderG}`, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📧</div>
            <h3 style={{ color: S.white, marginBottom: '10px' }}>المراسلة الرسمية</h3>
            <p style={{ color: S.muted, fontSize: '14px', marginBottom: '25px' }}>لطلبات التخصيص أو المشاكل المعقدة، راسلنا عبر الإيميل.</p>
            <p style={{ color: S.gold2, fontWeight: 700 }}>support@bidlx.com</p>
          </div>

        </div>

        {/* ── قسم الأسئلة الشائعة (لأتمتة الدعم) ── */}
        <div style={{ background: S.navy2, padding: '40px', borderRadius: '32px', border: `1px solid ${S.borderG}` }}>
          <h2 style={{ color: S.gold2, textAlign: 'center', marginBottom: '40px' }}>الأسئلة الشائعة</h2>
          
          {[
            { q: 'كيف أقوم برفع بيانات العملاء من ملف Excel؟', a: 'يمكنك ببساطة سحب وإفلات ملفك في لوحة التحكم وسيقوم العقل الإلكتروني بتنظيمها تلقائياً.' },
            { q: 'هل بيانات شركتي محمية من المتسللين؟', a: 'نعم، نستخدم تشفير 256-bit ونظام نسخ احتياطي يومي لضمان أمان ملفاتك.' },
            { q: 'هل يدعم النظام العمل بعملات مختلفة؟', a: 'بكل تأكيد، BidLX مصمم لدعم التجارة العابرة للحدود بمختلف العملات الدولية.' }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: `1px solid ${S.borderG}` }}>
              <h4 style={{ color: S.white, marginBottom: '10px', fontSize: '17px' }}>🤔 {item.q}</h4>
              <p style={{ color: S.muted, fontSize: '14px', lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </LayoutFrame>
  );
}