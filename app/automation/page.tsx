'use client';

import React from 'react';
// استدعاء الإطار العام الذي يحتوي على الهيدر والفوتر
import LayoutFrame from '../components/LayoutFrame';
// استدعاء المكون التفاعلي الذي قمنا بإصلاحه
import AutomationCanvas from '../components/AutomationCanvas';

const S = {
  gold:    '#C9A84C',
  gold2:   '#E8C97A',
  white:   '#FAFAF8',
  muted:   '#8A9BB5',
  navy2:   '#0F2040',
  borderG: 'rgba(201,168,76,0.15)',
};

export default function AutomationPage() {
  return (
    <LayoutFrame>
      <div style={{ 
        padding: '100px 24px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl' 
      }}>
        
        {/* ── العنوان الرئيسي والتعريف ── */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 900, 
            color: S.white, 
            marginBottom: '24px', 
            lineHeight: 1.2 
          }}>
            أتمتة العمليات بذكاء <br/>
            <span style={{ color: S.gold2 }}>كفاءة قصوى، تدخل بشري أدنى</span>
          </h1>
          <p style={{ 
            color: S.muted, 
            fontSize: '19px', 
            maxWidth: '800px', 
            margin: '0 auto 40px', 
            lineHeight: 1.6 
          }}>
            نظام بدلكس للأتمتة يربط بين الموردين، المخازن، والعملاء في دورة عمل واحدة تعمل ذاتياً على مدار الساعة.
          </p>
        </div>

        {/* ── لوحة التحكم التفاعلية ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1.3fr', 
          gap: '60px', 
          alignItems: 'center', 
          marginBottom: '100px' 
        }}>
          <div>
            <h2 style={{ color: S.gold2, fontSize: '32px', fontWeight: 800, marginBottom: '20px' }}>مصمم المسارات المرئي</h2>
            <p style={{ color: S.muted, fontSize: '17px', lineHeight: 1.8, marginBottom: '30px' }}>
              قم بتصميم دورة عملك ببساطة. اسحب الوكلاء الذكيين واربطهم ببعضهم البعض لتفعيل التحديثات التلقائية والقرارات اللوجستية الفورية.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                'تفعيل وكلاء ذكاء اصطناعي لتحليل الطلبات',
                'ربط حي مع قواعد بيانات الموردين في بلدك',
                'إشعارات ذكية لعمليات الشحن والجمارك'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: S.white }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: S.gold }}></div>
                  <span style={{ fontSize: '15px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* هنا يظهر المكون التفاعلي AutomationCanvas */}
          <div style={{ 
            height: '480px', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            border: `1px solid ${S.borderG}`
          }}>
             <AutomationCanvas />
          </div>
        </div>

        {/* ── بطاقات الخصائص التقنية ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '25px',
          marginBottom: '60px'
        }}>
          {[
            { t: 'تكامل كامل مع API', d: 'اربط متجرك الإلكتروني أو نظام ERP الخاص بك مع بدلكس خلال دقائق.' },
            { t: 'أمن البيانات', d: 'تشفير كامل لكافة العمليات والبيانات الصادرة والواردة من الموردين.' },
            { t: 'تقارير الأداء آلياً', d: 'توليد تقارير أسبوعية وشهرية توضح مدى توفير الوقت والتكلفة.' }
          ].map((card, i) => (
            <div key={i} style={{ 
              background: `linear-gradient(145deg, ${S.navy2} 0%, #061020 100%)`, 
              padding: '35px', 
              borderRadius: '24px', 
              border: `1px solid ${S.borderG}`,
              textAlign: 'right'
            }}>
              <h3 style={{ color: S.gold, marginBottom: '15px', fontWeight: 700 }}>{card.t}</h3>
              <p style={{ color: S.muted, fontSize: '14px', lineHeight: 1.6 }}>{card.d}</p>
            </div>
          ))}
        </div>

      </div>
    </LayoutFrame>
  );
}