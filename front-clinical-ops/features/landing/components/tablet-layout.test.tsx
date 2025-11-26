/**
 * Property-Based Test for Tablet Layout Adaptation
 * Feature: landing-page-redesign, Property 16: Tablet layout adaptation
 * Validates: Requirements 12.2
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Header } from './header'
import { Hero } from './hero'
import { FeaturesSection } from './features-section'
import { ProblemSection } from './problem-section'
import { ROICalculator } from './roi-calculator'
import { SecuritySection } from './security-section'
import { Footer } from './footer'

describe('Property 16: Tablet layout adaptation', () => {
  // Helper to set viewport width
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    window.dispatchEvent(new Event('resize'))
  }

  it('should apply tablet-specific classes for viewports between 768px and 1024px', () => {
    // Set tablet viewport (iPad portrait)
    setViewportWidth(768)

    const { container: headerContainer } = render(<Header />)
    const { container: heroContainer } = render(<Hero />)
    const { container: featuresContainer } = render(<FeaturesSection />)
    const { container: problemContainer } = render(<ProblemSection />)
    const { container: roiContainer } = render(<ROICalculator />)
    const { container: securityContainer } = render(<SecuritySection />)
    const { container: footerContainer } = render(<Footer />)

    // Check that desktop navigation is visible on tablet
    const desktopNav = headerContainer.querySelector('.hidden.md\\:flex')
    expect(desktopNav).toBeTruthy()

    // Check that mobile menu button is hidden on tablet
    const mobileMenuButton = headerContainer.querySelector('button.md\\:hidden')
    expect(mobileMenuButton).toBeTruthy()

    // Check Hero uses medium text sizes
    const heading = heroContainer.querySelector('h1')
    expect(heading?.className).toMatch(/md:text-7xl/)

    // Check Features grid uses 2 columns on tablet (via sm breakpoint)
    const featuresGrid = featuresContainer.querySelector('.grid')
    expect(featuresGrid?.className).toMatch(/sm:grid-cols-2/)
    expect(featuresGrid?.className).toMatch(/lg:grid-cols-3/)

    // Check Problem section grid adapts for tablet
    const problemGrid = problemContainer.querySelector('.grid')
    expect(problemGrid?.className).toMatch(/lg:grid-cols-12/)

    // Check ROI Calculator uses 3 columns on tablet (sm and up)
    const roiInputGrid = roiContainer.querySelector('.grid')
    expect(roiInputGrid?.className).toMatch(/sm:grid-cols-3/)

    // Check Security section uses row layout on tablet
    const securityFlex = securityContainer.querySelector('.flex')
    expect(securityFlex?.className).toMatch(/md:flex-row/)

    // Check Footer uses multi-column grid on tablet
    const footerGrid = footerContainer.querySelector('.grid')
    expect(footerGrid?.className).toMatch(/md:grid-cols-12/)
  })

  it('should use appropriate spacing for tablet viewports', () => {
    setViewportWidth(900)
    const { container } = render(<Hero />)

    const innerContainer = container.querySelector('.max-w-7xl')
    expect(innerContainer?.className).toMatch(/sm:px-6/)
  })

  it('should show 2-column grid for features on tablet', () => {
    setViewportWidth(800)
    const { container } = render(<FeaturesSection />)

    const grid = container.querySelector('.grid')
    expect(grid?.className).toMatch(/sm:grid-cols-2/)
    expect(grid?.className).toMatch(/lg:grid-cols-3/)
  })

  it('should use medium text sizes on tablet', () => {
    setViewportWidth(768)
    const { container } = render(<Hero />)

    const heading = container.querySelector('h1')
    expect(heading?.className).toMatch(/md:text-7xl/)

    const paragraph = container.querySelector('p')
    expect(paragraph?.className).toMatch(/md:text-xl/)
  })

  it('should adapt ROI calculator to 3-column input layout on tablets', () => {
    setViewportWidth(768)
    const { container } = render(<ROICalculator />)

    const inputGrid = container.querySelector('.grid')
    // ROI Calculator input grid is 3 columns on sm and up
    expect(inputGrid?.className).toMatch(/sm:grid-cols-3/)
  })

  it('should show horizontal security badges layout on tablet', () => {
    setViewportWidth(900)
    const { container } = render(<SecuritySection />)

    const flexContainer = container.querySelector('.flex.flex-col')
    expect(flexContainer?.className).toMatch(/md:flex-row/)
  })

  it('should use appropriate padding on tablet', () => {
    setViewportWidth(800)
    const { container } = render(<FeaturesSection />)

    const innerContainer = container.querySelector('.max-w-7xl')
    expect(innerContainer?.className).toMatch(/sm:px-6/)
    expect(innerContainer?.className).toMatch(/lg:px-8/)
  })
})
