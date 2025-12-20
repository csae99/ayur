import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'
import type { Metadata } from 'next' // Assuming Metadata type is from 'next'

export const metadata: Metadata = {
  title: 'Ayurveda Platform',
  description: 'Holistic database for patients and practitioners',
  manifest: '/manifest.json',
  themeColor: '#15803d',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AyurCare',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
