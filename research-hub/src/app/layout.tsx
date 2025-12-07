import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Hub",
  description: "AI-powered research aggregation and analysis",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Research Hub"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              📚 Research Hub
            </a>
            <div className="flex gap-4">
              <a
                href="/feed"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Digest
              </a>
              <a
                href="/add"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Research
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
