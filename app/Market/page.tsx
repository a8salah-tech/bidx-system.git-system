"use client";

import React, { useState } from 'react';
import AppShell from "../components/AppShell";


// الهوية البصرية الموحدة لمشروع Bridge Edge - نسخة مصغرة واحترافية
const S = {
  navy: '#0a192f',       // الخلفية العميقة
  navy2: '#112240',      // الحاويات
  navy3: '#1a2f5a',      // العناصر الفرعية
  gold: '#c9a84c',       // اللون الرئيسي (الذهبي)
  gold2: '#e5c158',      // ذهبي فاتح للتفاعل
  white: '#e6f1ff',      // النصوص الرئيسية
  muted: '#8892b0',      // النصوص الثانوية
  border: 'rgba(201,168,76,0.12)', // حدود أنحف وأكثر شفافية
  card: '#172a45',       // بطاقات العرض
  green: '#4ade80',      // مؤشرات النجاح
};

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<'products' | 'suppliers'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ 
      background: S.navy, 
      minHeight: '100vh', 
      padding: '25px 15px', // تقليل الهوامش الخارجية للصفحة
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: S.white
    }}>
      
      {/* هيدر السوق - مصغر */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ 
          color: S.gold, 
          fontSize: '26px', // تصغير حجم العنوان الرئيسي
          fontWeight: 800, 
          letterSpacing: '-0.5px',
          marginBottom: '5px' 
        }}>سوق الموردين والطلبات</h1>
        <p style={{ color: S.muted, fontSize: '13px', maxWidth: '500px', margin: '0 auto' }}>
          المنصة المركزية لربط الموردين الدوليين بالعملاء واتخاذ قرارات شرائية ذكية.
        </p>
      </div>

      {/* شريط الأدوات الذكي (Toolbar) - أكثر نحافة */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px', 
        background: S.navy2, 
        padding: '8px 15px', // تقليل الهوامش الداخلية للشريط
        borderRadius: '12px', 
        border: `1px solid ${S.border}`,
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        
        {/* أزرار التبديل - مصغرة */}
        <div style={{ 
          display: 'flex', 
          background: S.navy, 
          padding: '3px', 
          borderRadius: '8px', 
          border: `1px solid ${S.border}` 
        }}>
          <button 
            onClick={() => setViewMode('products')}
            style={{ 
              padding: '6px 16px', // تقليل حجم الأزرار
              borderRadius: '6px', 
              cursor: 'pointer', 
              border: 'none',
              background: viewMode === 'products' ? S.gold : 'transparent',
              color: viewMode === 'products' ? S.navy : S.white,
              fontWeight: 700, 
              fontSize: '12px', // تصغير خط الأزرار
              transition: 'all 0.3s ease'
            }}>📦 المنتجات</button>
          <button 
            onClick={() => setViewMode('suppliers')}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              border: 'none',
              background: viewMode === 'suppliers' ? S.gold : 'transparent',
              color: viewMode === 'suppliers' ? S.navy : S.white,
              fontWeight: 700, 
              fontSize: '12px',
              transition: 'all 0.3s ease'
            }}>🏭 الموردين</button>
        </div>

        {/* حقل البحث - أنحف */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="ابحث عن منتج، مورد، أو دولة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 35px 10px 10px', // تقليل الهوامش وحجم الحقل
              borderRadius: '8px', 
              background: S.navy, 
              border: `1px solid ${S.border}`, 
              color: S.white, 
              fontSize: '12px', // تصغير خط البحث
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = S.gold}
            onBlur={(e) => e.target.style.borderColor = S.border}
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>🔍</span>
        </div>
      </div>

      {/* شبكة العرض (Grid) - تم تصغير minmax لتستوعب عناصر أكثر */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // تصغير الحد الأدنى لعرض البطاقة
        gap: '20px' // تقليل المسافة بين البطاقات
      }}>
        
        {/* حالة عرض المنتجات (Products Mode) - نسخة مصغرة */}
        {viewMode === 'products' && [1,2,3,4,5,6,7,8].map(i => (
          <div key={i} style={{ 
            background: S.card, 
            borderRadius: '12px', // زوايا أقل حدة لتناسب الحجم الصغير
            overflow: 'hidden', 
            border: `1px solid ${S.border}`, 
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = S.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = S.border; }}
          >
            <div style={{ 
              height: '130px', // تقليل ارتفاع الصورة بشكل كبير
              background: `linear-gradient(135deg, ${S.navy3} 0%, #1a2f5a 100%)`, 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '40px' // تصغير الأيقونة
            }}>
               📦
               <div style={{ position: 'absolute', top: '10px', left: '10px', background: S.gold, padding: '2px 8px', borderRadius: '10px', color: S.navy, fontSize: '9px', fontWeight: 800 }}>
                 رائج 🔥
               </div>
            </div>
            <div style={{ padding: '15px' }}> {/* تقليل الهوامش الداخلية للبطاقة */}
              <div style={{ fontSize: '10px', color: S.gold, fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>تصنيف عام</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: S.white, marginBottom: '8px', lineHeight: '1.2' }}>اسم المنتج التجاري</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '10px', borderTop: `1px solid ${S.border}` }}>
                <div>
                  <div style={{ fontSize: '10px', color: S.muted }}>أفضل سعر</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: S.white }}>$1,250 <span style={{ fontSize: '10px', fontWeight: 400, color: S.muted }}>/ طن</span></div>
                </div>
                <button style={{ 
                  background: 'rgba(201,168,76,0.1)', 
                  border: `1px solid ${S.gold}`, 
                  color: S.gold,
                  padding: '6px 12px', // تصغير الزر
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: 700,
                  fontSize: '11px', // تصغير خط الزر
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = S.gold; e.currentTarget.style.color = S.navy; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; e.currentTarget.style.color = S.gold; }}
                >تفاصيل</button>
              </div>
            </div>
          </div>
        ))}

        {/* حالة عرض الموردين (Suppliers Mode) - نسخة مصغرة */}
        {viewMode === 'suppliers' && [1,2,3,4,5,6].map(i => (
          <div key={i} style={{ 
            background: S.card, 
            borderRadius: '12px', 
            padding: '20px', // تقليل الهوامش الداخلية
            border: `1px solid ${S.border}`, 
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = S.gold}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = S.border}
          >
            <div style={{ 
              width: '60px', // تصغير حجم الأيقونة والدائرة
              height: '60px', 
              borderRadius: '15px', 
              background: `linear-gradient(45deg, ${S.navy} 0%, ${S.navy3} 100%)`, 
              border: `1px solid ${S.gold}`,
              margin: '0 auto 15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '25px',
              boxShadow: `0 5px 15px rgba(0,0,0,0.2)`
            }}>🏭</div>
            <h3 style={{ color: S.white, fontSize: '14px', fontWeight: 800, marginBottom: '5px' }}>مجموعة توريد آسيا</h3>
            <div style={{ color: S.gold, fontSize: '11px', fontWeight: 600, marginBottom: '15px' }}>🇮🇩 إندونيسيا | جاكرتا</div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginBottom: '20px' }}>
              {['زيت نخيل', 'تصدير'].map(tag => (
                <span key={tag} style={{ 
                  fontSize: '9px', // تصغير حجم التاجات
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  color: S.muted,
                  border: `1px solid rgba(255,255,255,0.03)`
                }}>{tag}</span>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button style={{ padding: '8px', borderRadius: '8px', background: S.gold, border: 'none', color: S.navy, fontWeight: 800, fontSize: '11px', cursor: 'pointer' }}>تواصل</button>
              <button style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: `1px solid ${S.border}`, color: S.white, fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>الملف</button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
