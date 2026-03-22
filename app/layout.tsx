import "./globals.css";

export const metadata = {
  title: "Bridge Edge SMS | نظام إدارة الموردين",
  description: "نظام سحابي متطور لإدارة سلاسل الإمداد العالمية",
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