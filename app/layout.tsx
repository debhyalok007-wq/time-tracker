import type { Metadata, Viewport } from "next"
import "./globals.css"
import Header from "./Header"
import BottomNav from "./BottomNav"

export const metadata: Metadata = {
  title: "Timmify",
  description: "Simple daily time tracker",
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#155DFC",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 min-h-screen flex flex-col pb-28">

        <Header />

        <main className="flex-1 w-full max-w-6xl mx-auto px-6">
          {children}
        </main>

        <BottomNav />

      </body>
    </html>
  )
}
