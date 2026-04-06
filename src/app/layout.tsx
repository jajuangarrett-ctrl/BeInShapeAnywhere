import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BeInShapeAnywhere',
  description: 'Your personal training workout platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
