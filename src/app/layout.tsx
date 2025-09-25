import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apple ギフトコード管理システム',
  description: 'Appleギフトコードの在庫管理と最適配分システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
