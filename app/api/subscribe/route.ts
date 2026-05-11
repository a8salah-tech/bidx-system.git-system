// app/api/subscribe/route.ts
// ─────────────────────────────────────────────────────────────
// يبعت إيميل تأكيد للعميل + إشعار لـ support@bidlx.com
// يتطلب: npm install resend
// وإضافة RESEND_API_KEY في ملف .env.local
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, country, email, phone, plan } = body;

    // ── تحقق من البيانات الإلزامية ──
    if (!name || !company || !country || !email) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const planAr  = plan === 'annual' ? 'السنوية ($199/سنة)' : 'الشهرية ($20/شهر)';
    const planEn  = plan === 'annual' ? 'Annual ($199/year)' : 'Monthly ($20/month)';
    const dateNow = new Date().toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });

    // ════════════════════════════════════════════
    // 1) إيميل تأكيد للعميل
    // ════════════════════════════════════════════
    await resend.emails.send({
      from:    'BidLX <no-reply@bidlx.com>',   // غيّر هذا لدومينك المسجل في Resend
      to: 'support@bidlx.com',
      subject: '🎉 تم تسجيلك في BidLX — الشهر الأول مجاناً',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F4F6FA;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
          <div style="max-width:560px;margin:32px auto;background:#0F2040;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#C9A84C 0%,#E8C97A 100%);padding:32px 36px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🎉</div>
              <h1 style="margin:0;font-size:22px;color:#0A1628;font-weight:900;">تم تسجيلك بنجاح!</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#0A1628;opacity:0.8;">مرحباً بك في عائلة BidLX</p>
            </div>

            <!-- Body -->
            <div style="padding:32px 36px;">
              <p style="color:#FAFAF8;font-size:16px;margin:0 0 8px;">مرحباً <strong style="color:#E8C97A;">${name}</strong>،</p>
              <p style="color:#8A9BB5;font-size:14px;line-height:1.7;margin:0 0 24px;">
                شكراً لتسجيلك في BidLX. سيتواصل معك فريقنا خلال <strong style="color:#C9A84C;">24 ساعة</strong> لتفعيل حسابك وبدء الشهر الأول المجاني.
              </p>

              <!-- تفاصيل الطلب -->
              <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:14px;padding:20px 24px;margin-bottom:24px;">
                <h3 style="color:#E8C97A;font-size:13px;margin:0 0 14px;text-transform:uppercase;letter-spacing:.06em;">تفاصيل الاشتراك</h3>
                ${[
                  ['الاسم',     name],
                  ['الشركة',    company],
                  ['الدولة',    country],
                  ['البريد',    email],
                  ['الهاتف',    phone || '—'],
                  ['الخطة',     planAr],
                  ['تاريخ التسجيل', dateNow],
                ].map(([k,v]) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="color:#8A9BB5;font-size:13px;">${k}</span>
                    <span style="color:#FAFAF8;font-size:13px;font-weight:600;">${v}</span>
                  </div>
                `).join('')}
              </div>

              <!-- الخطوات التالية -->
              <h3 style="color:#E8C97A;font-size:14px;margin:0 0 12px;">الخطوات التالية</h3>
              ${['سيتواصل معك فريقنا خلال 24 ساعة','ستحصل على رابط تفعيل حسابك','ستبدأ فترتك التجريبية المجانية فوراً'].map((s,i) => `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                  <div style="width:24px;height:24px;background:linear-gradient(135deg,#C9A84C,#E8C97A);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:#0A1628;">${i+1}</div>
                  <span style="color:#FAFAF8;font-size:13.5px;">${s}</span>
                </div>
              `).join('')}
            </div>

            <!-- Footer -->
            <div style="background:rgba(201,168,76,0.05);border-top:1px solid rgba(201,168,76,0.15);padding:20px 36px;text-align:center;">
              <p style="color:#8A9BB5;font-size:12px;margin:0 0 8px;">أي استفسار؟ تواصل معنا</p>
              <a href="mailto:support@bidlx.com" style="color:#C9A84C;font-size:13px;font-weight:700;text-decoration:none;">support@bidlx.com</a>
              <p style="color:#4A5568;font-size:11px;margin:12px 0 0;">© 2026 BidLX · جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // ════════════════════════════════════════════
    // 2) إشعار داخلي لـ support@bidlx.com
    // ════════════════════════════════════════════
    await resend.emails.send({
      from:    'BidLX Signups <no-reply@bidlx.com>',
      to:      'support@bidlx.com',
      subject: `🆕 تسجيل جديد — ${name} (${company}) · ${planEn}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
          <h2 style="color:#0A1628;margin-top:0;">🆕 عميل جديد سجّل في BidLX</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${[
              ['الاسم',       name],
              ['الشركة',      company],
              ['الدولة',      country],
              ['البريد',      email],
              ['الهاتف',      phone || '—'],
              ['الخطة',       planEn],
              ['التاريخ',     dateNow],
            ].map(([k,v]) => `
              <tr>
                <td style="padding:8px 12px;background:#fff;border:1px solid #eee;color:#666;font-size:13px;width:120px;font-weight:600;">${k}</td>
                <td style="padding:8px 12px;background:#fff;border:1px solid #eee;color:#0A1628;font-size:13px;">${v}</td>
              </tr>
            `).join('')}
          </table>
          <div style="margin-top:16px;padding:12px 16px;background:#FEF3C7;border-radius:8px;font-size:13px;color:#92400E;">
            ⏰ يجب التواصل مع العميل خلال <strong>24 ساعة</strong> لتفعيل حسابه
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Subscribe API error:', err);
    return NextResponse.json({ error: 'فشل الإرسال' }, { status: 500 });
  }
}
