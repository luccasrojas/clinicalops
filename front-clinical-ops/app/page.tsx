import {
  Hero,
  Header,
  Footer,
  FeaturesSection,
  ProblemSection,
  ROICalculator,
  SecuritySection,
} from '@/features/landing'

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <ROICalculator />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  )
}
