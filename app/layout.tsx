import type { Metadata } from 'next'
import '../src/index.css'
import { ModelProvider } from '../src/contexts/ModelContext'

export const metadata: Metadata = {
  title: 'Co-Ducker',
  description: 'AI Chat Assistant',
  authors: [{ name: 'Sphera' }]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ModelProvider>
          <div id="root">{children}</div>
        </ModelProvider>
      </body>
    </html>
  )
}
