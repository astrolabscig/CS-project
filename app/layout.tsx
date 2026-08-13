import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { LibraryProvider } from "@/components/LibraryProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PageTransition from "@/components/PageTransition";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geist = Geist({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS Resource Hub",
  description: "KNUST Computer Science Department resource library",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CS Hub",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/logo.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Mirrors --bg from globals.css. Dark is this app's default identity (not
// prefers-color-scheme-driven), so the OS chrome defaults to it too — a
// static <meta> can't read localStorage, so a light-theme visitor's status
// bar will read dark until they reload; that's a known, accepted gap.
export const viewport: Viewport = {
  themeColor: "#0c0e13",
};

// Runs before hydration so the correct theme applies with no flash and no
// mismatch. Dark is the default identity for this app — first-time visitors
// get dark regardless of prefers-color-scheme; only an explicit prior choice
// of light overrides it.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <SessionProvider>
          <LibraryProvider>
            <ToastProvider>
              <PageTransition>{children}</PageTransition>
            </ToastProvider>
          </LibraryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
