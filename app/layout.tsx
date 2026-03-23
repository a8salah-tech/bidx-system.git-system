import "./globals.css";

export const metadata = {
  title: "BidLX | نظام إدارة الموردين",
  description: "نظام سحابي متطور لإدارة سلاسل الإمداد العالمية",
};
icon: '/icon.png?v=4'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}