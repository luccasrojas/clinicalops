import {
  Hero,
  Features,
  HowItWorks,
  Testimonials,
  CTA,
  Header,
  Footer,
} from '@/features/landing'

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

