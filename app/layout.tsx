import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Playable Ad Builder - Create High-Performance Slot Game Ads",
  description: "Build engaging playable slot game ads for Meta, Snapchat, TikTok, and Google with our specialized tool",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
