import "./globals.css";

export const metadata = {
  title: "BidLX | نظام إدارة الشركات ",
  description: "نظام سحابي متطور لإدارة الشركات ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
<style dangerouslySetInnerHTML={{ __html: `
  @media print {
    /* إجبار الصفحة على الوضع العرضي */
    @page { 
      size: landscape !important; 
      margin: 1cm !important; 
    }
    
    /* التأكد من أن الحاوية الرئيسية تأخذ العرض الكامل */
    html, body, #__next, main {
      width: 100% !important;
      height: auto !important;
      background: white !important;
      color: black !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* إخفاء الأزرار وأي شيء لا نحتاجه في الورق */
    button, .no-print, nav, aside {
      display: none !important;
    }

    /* إظهار خلفيات الجداول والألوان (مهم جداً للبريدج إيدج) */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
` }} />