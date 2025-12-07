import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'

export const metadata = {
  title: 'Ayurveda - Natural Wellness Solutions',
  description: 'Discover authentic Ayurvedic medicines and connect with certified practitioners for holistic healing.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
