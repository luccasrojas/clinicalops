/**
 * Property-Based Test for Desktop Layout Utilization
 * Feature: landing-page-redesign, Property 17: Desktop layout utilization
 * Validates: Requirements 12.3
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

describe('Property 17: Desktop layout utilization', () => {
  // Helper to set viewport width
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    window.dispatchEvent(new Event('resize'))
  }

  it('should apply desktop-specific classes for viewports > 1024px', () => {
    // Set desktop viewport
    setViewportWidth(1280)

    const { container: headerContainer } = render(<Header />)
    const { container: heroContainer } = render(<Hero />)
    const { container: featuresContainer } = render(<FeaturesSection />)
    const { container: problemContainer } = render(<ProblemSection />)
    const { container: roiContainer } = render(<ROICalculator />)
    const { container: securityContainer } = render(<SecuritySection />)
    const { container: footerContainer } = render(<Footer />)

    // Check that desktop navigation is visible
    const desktopNav = headerContainer.querySelector('.hidden.md\\:flex')
    expect(desktopNav).toBeTruthy()

    // Check that mobile menu button is hidden
    const mobileMenuButton = headerContainer.querySelector('button.md\\:hidden')
    expect(mobileMenuButton).toBeTruthy()

    // Check Hero uses largest text sizes
    const heading = heroContainer.querySelector('h1')
    expect(heading?.className).toMatch(/lg:text-8xl/)

    // Check Features grid uses 3 columns on desktop
    const featuresGrid = featuresContainer.querySelector('.grid')
    expect(featuresGrid?.className).toMatch(/lg:grid-cols-3/)

    // Check Problem section uses full 12-column grid
    const problemGrid = problemContainer.querySelector('.grid')
    expect(problemGrid?.className).toMatch(/lg:grid-cols-12/)

    // Check ROI Calculator uses 2-column results grid on desktop
    const roiGrids = roiContainer.querySelectorAll('.grid')
    const resultsGrid = Array.from(roiGrids).find((grid) =>
      grid.className.includes('sm:grid-cols-2'),
    )
    expect(resultsGrid).toBeTruthy()

    // Check Security section uses horizontal layout
    const securityFlex = securityContainer.querySelector('.flex')
    expect(securityFlex?.className).toMatch(/md:flex-row/)

    // Check Footer uses 12-column grid
    const footerGrid = footerContainer.querySelector('.grid')
    expect(footerGrid?.className).toMatch(/md:grid-cols-12/)
  })

  it('should use max-w-7xl container for content width constraint', () => {
    setViewportWidth(1440)
    const { container: heroContainer } = render(<Hero />)
    const { container: featuresContainer } = render(<FeaturesSection />)
    const { container: problemContainer } = render(<ProblemSection />)
    const { container: roiContainer } = render(<ROICalculator />)
    const { container: securityContainer } = render(<SecuritySection />)
    const { container: footerContainer } = render(<Footer />)

    // All sections should have max-w-7xl container
    expect(heroContainer.querySelector('.max-w-7xl')).toBeTruthy()
    expect(featuresContainer.querySelector('.max-w-7xl')).toBeTruthy()
    expect(problemContainer.querySelector('.max-w-7xl')).toBeTruthy()
    expect(roiContainer.querySelector('.max-w-7xl')).toBeTruthy()
    expect(securityContainer.querySelector('.max-w-7xl')).toBeTruthy()
    expect(footerContainer.querySelector('.max-w-7xl')).toBeTruthy()
  })

  it('should use large padding on desktop', () => {
    setViewportWidth(1280)
    const { container } = render(<Hero />)

    const innerContainer = container.querySelector('.max-w-7xl')
    expect(innerContainer?.className).toMatch(/lg:px-8/)
  })

  it('should show 3-column features grid on desktop', () => {
    setViewportWidth(1200)
    const { container } = render(<FeaturesSection />)

    const grid = container.querySelector('.grid')
    expect(grid?.className).toMatch(/lg:grid-cols-3/)
  })

  it('should use largest text sizes on desktop', () => {
    setViewportWidth(1440)
    const { container } = render(<Hero />)

    const heading = container.querySelector('h1')
    expect(heading?.className).toMatch(/lg:text-8xl/)

    const paragraph = container.querySelector('p')
    expect(paragraph?.className).toMatch(/md:text-xl/)
  })

  it('should show 2-column ROI results grid on desktop', () => {
    setViewportWidth(1280)
    const { container } = render(<ROICalculator />)

    const grids = container.querySelectorAll('.grid')
    const resultsGrid = Array.from(grids).find((grid) =>
      grid.className.includes('sm:grid-cols-2'),
    )
    expect(resultsGrid).toBeTruthy()
  })

  it('should use full-width 12-column grid for problem section on desktop', () => {
    setViewportWidth(1400)
    const { container } = render(<ProblemSection />)

    const grid = container.querySelector('.grid')
    expect(grid?.className).toMatch(/lg:grid-cols-12/)
  })

  it('should maintain horizontal layout for security section on desktop', () => {
    setViewportWidth(1280)
    const { container } = render(<SecuritySection />)

    const flexContainer = container.querySelector('.flex')
    expect(flexContainer?.className).toMatch(/md:flex-row/)
  })

  it('should use appropriate spacing between sections on desktop', () => {
    setViewportWidth(1440)
    const { container: heroContainer } = render(<Hero />)
    const { container: featuresContainer } = render(<FeaturesSection />)

    // Check Hero has large padding
    const heroSection = heroContainer.querySelector('section')
    expect(heroSection?.className).toMatch(/lg:pt-56/)
    expect(heroSection?.className).toMatch(/lg:pb-40/)

    // Check Features has consistent padding
    const featuresSection = featuresContainer.querySelector('section')
    expect(featuresSection?.className).toMatch(/py-32/)
  })
})
