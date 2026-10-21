import './globals.css'
import { type Metadata } from 'next'
import ToastContainer from '../components/ui/Toast'

export const metadata: Metadata = {
  title: 'DCMT Platform',
  description: 'Document Management and Technical Services Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}