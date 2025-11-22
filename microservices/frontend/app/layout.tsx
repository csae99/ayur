import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
