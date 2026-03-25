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

export default function FeaturesPage() {
  const sections = [
    "العملاء", "المنتجات والخدمات", "الموردون", 
    " الجودة","الموارد البشرية", " التسويق", " المبيعات", 
    " البحوث و التطوير "," الإدارة المالي"," خدمة العملاء", "تقنية المعلومات", "العلاقات العامة"
  ];

  return (
    <LayoutFrame>
      <div style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif" }}>
        
        {/* ── قسم الرؤية والفخر ── */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ color: S.gold, fontWeight: 800, fontSize: '14px', letterSpacing: '1px', marginBottom: '16px' }}>
            فخر الصناعة العربية الرقمية
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: S.white, marginBottom: '24px', lineHeight: 1.4 }}>
            نحن نفتخر بأن نكون أول شركة عربية تخدم <br/>
            <span style={{ color: S.gold2 }}>الشركات الناشئة، الصغيرة، والمتوسطة</span>
          </h1>
          <p style={{ color: S.muted, fontSize: '18px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8 }}>
            تكمن أغلب مشاكل المؤسسات في الإدارة وسوء التنظيم، لذلك قمنا ببناء **بدلكس** لنقدم حلولاً واقعية مختصة لجميع أقسام شركتك.
          </p>
        </div>

        {/* ── شبكة الأقسام المتخصصة ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px',
          marginBottom: '60px'
        }}>
          {sections.map((section, index) => (
            <div key={index} style={{ 
              background: S.navy2, 
              padding: '25px', 
              borderRadius: '20px', 
              border: `1px solid ${S.borderG}`,
              textAlign: 'center',
              transition: 'transform 0.3s ease',
              cursor: 'default'
            }}>
              <div style={{ color: S.gold2, fontSize: '24px', marginBottom: '10px' }}>💎</div>
              <h3 style={{ color: S.white, fontSize: '16px', fontWeight: 700 }}>{section}</h3>
            </div>
          ))}
        </div>

        {/* ── رسالة الختام والقابلية للتوسع ── */}
        <div style={{ 
          background: `linear-gradient(135deg, ${S.navy4} 0%, #0A1628 100%)`, 
          padding: '40px', 
          borderRadius: '32px', 
          border: `1px solid ${S.gold}`,
          textAlign: 'center'
        }}>
          <h2 style={{ color: S.gold2, fontSize: '24px', marginBottom: '15px', fontWeight: 800 }}>
            قابلية غير محدودة للتوسع
          </h2>
          <p style={{ color: S.muted, fontSize: '16px', marginBottom: '25px' }}>
            كما يمكن إضافة العديد من الأقسام الأخرى بناءً على حجم شركتك واحتياجاتك الخاصة.
          </p>
          <div style={{ fontSize: '20px', fontWeight: 900, color: S.white }}>
            بدلكس .. تجارة بلا حدود
          </div>
        </div>

      </div>
    </LayoutFrame>
  );
}