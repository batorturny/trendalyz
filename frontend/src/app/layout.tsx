import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trendalyz — Social Media Analytics",
  description: "Multi-platform social media riport és analitika dashboard. TikTok, Facebook, Instagram, YouTube elemzések egy helyen.",
  metadataBase: new URL("https://trendalyz.hu"),
  openGraph: {
    title: "Trendalyz — Social Media Analytics",
    description: "Multi-platform social media riport és analitika dashboard. TikTok, Facebook, Instagram, YouTube elemzések egy helyen.",
    locale: "hu_HU",
    type: "website",
    siteName: "Trendalyz",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendalyz — Social Media Analytics",
    description: "Multi-platform social media riport és analitika dashboard.",
  },
  other: {
    "theme-color": "#1a1a1e",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a1a1e" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
