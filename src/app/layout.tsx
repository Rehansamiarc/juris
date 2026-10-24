import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: {
    default: "Juris — Enter the Chambers",
    template: "%s · Juris",
  },
  description:
    "A focused portal for law students to study, argue, and qualify. Case briefs, the law library, moot court and revision in one workspace.",
  applicationName: "Juris",
  authors: [{ name: "Juris" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#080f1c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="juris-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
