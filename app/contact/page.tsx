'use client';

import React, { useState } from 'react';
import LayoutFrame from '../components/LayoutFrame';

const S = {
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  muted:   '#8A9BB5',
  navy2:   '#0F2040',
  navy4:   '#111D35',
  borderG: 'rgba(201,168,76,0.15)',
  white:   '#FAFAF8',
};

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => setStatus('sent'), 1500);
  };

  return (
    <LayoutFrame>
      <div style={{ padding: '60px 24px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif" }}>
        
        {/* ── الرأس: وداعاً للعشوائية ── */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-block', padding: '6px 16px', borderRadius: '100px', 
            background: 'rgba(201,168,76,0.05)', border: `1px solid ${S.borderG}`,
            color: S.gold, fontSize: '12px', fontWeight: 800, marginBottom: '16px'
          }}>
            العقل الإلكتروني لشركتك
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', color: S.white }}>
            وداعاً للعشوائية.. <span style={{ color: S.gold2 }}>أهلاً بنظام BidLX</span>
          </h1>
          <p style={{ color: S.muted, fontSize: '17px', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            نظم ملفات عملائك، مورديك، وحساباتك الإدارية في مكان واحد واستمتع بالإنجاز.
          </p>
        </div>

        {/* ── حاوية المحتوى المتساوية الأبعاد ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '20px', 
          alignItems: 'stretch' 
        }}>
          
          {/* ── الجانب الأيمن: البطاقات الأربع ── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px' 
          }}>
            {[
              { t: 'تنظيم العملاء والموردين', d: 'قاعدة بيانات ذكية تحفظ كل تفاصيل جهات الاتصال.' },
              { t: 'إدارة الملفات الإدارية', d: 'وداعاً للملفات الورقية، كل شيء متاح بضغطة زر.' },
              { t: 'نظام محاسبي مبسط', d: 'تتبع التدفقات النقدية وحسابات الشركة بدقة.' },
              { t: 'توفير المجهود', d: 'استمتع بالإنجاز ودع العقل الإلكتروني يتولى المتابعة.' }
            ].map((item, i) => (
              <div key={i} style={{ 
                padding: '20px', 
                background: S.navy2, 
                borderRadius: '20px', 
                border: `1px solid ${S.borderG}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <h3 style={{ color: S.gold2, fontSize: '15px', marginBottom: '8px', fontWeight: 800 }}>
                  ✅ {item.t}
                </h3>
                <p style={{ color: S.muted, fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                  {item.d}
                </p>
              </div>
            ))}
          </div>

          {/* ── الجانب الأيسر: الفورم المصغر المتساوي مع البطاقات ── */}
          <div style={{ 
            background: S.navy4, 
            padding: '25px', 
            borderRadius: '24px', 
            border: `1px solid ${S.borderG}`, 
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {status === 'sent' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>📈</div>
                <h3 style={{ color: S.gold2 }}>تم استلام طلبك!</h3>
                <p style={{ color: S.muted, fontSize: '13px' }}>سنتواصل معك لبدء رحلة التنظيم.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
<div style={{ textAlign: 'center', marginBottom: '20px' }}>
  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '5px', color: S.white }}>
    حجز استشارة تقنية
  </h3>
  <a 
    href="mailto:support@bidlx.com" 
    style={{ 
      fontSize: '13px', 
      color: S.gold, 
      textDecoration: 'none', 
      fontWeight: 600,
      opacity: 0.9,
      transition: 'opacity 0.2s'
    }}
    onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
    onMouseOut={(e) => e.currentTarget.style.opacity = '0.9'}
  >
    support@bidlx.com
  </a>
</div>                
                <input required placeholder="الاسم الكامل" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0A1628', border: `1px solid ${S.borderG}`, color: 'white', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />
                
                <input required placeholder="اسم الشركة" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0A1628', border: `1px solid ${S.borderG}`, color: 'white', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />

                <select style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0A1628', border: `1px solid ${S.borderG}`, color: 'white', fontFamily: 'inherit', fontSize: '13px', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                  <option>كيف تصف إدارة بياناتك حالياً؟</option>
                  <option>نعتمد على الطرق التقليدية والجداول اليدوية</option>
                  <option>بياناتنا مشتتة ونريد نظاماً موحداً</option>
                  <option>نسعى لأتمتة العمليات بالكامل</option>
                </select>

                <textarea required rows={3} placeholder="أكبر مشكلة إدارية تواجهك؟" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0A1628', border: `1px solid ${S.borderG}`, color: 'white', resize: 'none', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />

                <button type="submit" style={{ 
                  background: `linear-gradient(135deg, #B8963E 0%, ${S.gold} 100%)`, 
                  color: '#0A1628', padding: '14px', borderRadius: '10px', fontWeight: 900, 
                  fontSize: '15px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  {status === 'sending' ? 'جاري التحليل...' : 'ابدأ الآن ←'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </LayoutFrame>
  );
}