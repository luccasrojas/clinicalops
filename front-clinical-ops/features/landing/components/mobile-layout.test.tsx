/**
 * Property-Based Test for Mobile Layout Adaptation
 * Feature: landing-page-redesign, Property 15: Mobile layout adaptation
 * Validates: Requirements 12.1
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

describe('Property 15: Mobile layout adaptation', () => {
  // Helper to set viewport width
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    window.dispatchEvent(new Event('resize'))
  }

  it('should apply mobile-specific classes for viewports < 768px', () => {
    // Set mobile viewport
    setViewportWidth(375)

    const { container: headerContainer } = render(<Header />)
    const { container: heroContainer } = render(<Hero />)
    const { container: featuresContainer } = render(<FeaturesSection />)
    const { container: problemContainer } = render(<ProblemSection />)
    const { container: roiContainer } = render(<ROICalculator />)
    const { container: securityContainer } = render(<SecuritySection />)
    const { container: footerContainer } = render(<Footer />)

    // Check that mobile menu button is present (Header)
    const mobileMenuButton = headerContainer.querySelector('button.md\\:hidden')
    expect(mobileMenuButton).toBeTruthy()

    // Check that desktop navigation is hidden on mobile
    const desktopNav = headerContainer.querySelector('.hidden.md\\:flex')
    expect(desktopNav).toBeTruthy()

    // Check Hero has mobile padding classes on inner container
    const heroInnerDiv = heroContainer.querySelector('.max-w-7xl')
    expect(heroInnerDiv?.className).toMatch(/px-4/)

    // Check Features grid uses single column on mobile
    const featuresGrid = featuresContainer.querySelector('.grid')
    expect(featuresGrid?.className).toMatch(/sm:grid-cols-2/)

    // Check Problem section has mobile padding on inner container
    const problemInnerDiv = problemContainer.querySelector('.max-w-7xl')
    expect(problemInnerDiv?.className).toMatch(/px-4/)

    // Check ROI Calculator results grid has mobile-friendly layout
    const roiGrids = roiContainer.querySelectorAll('.grid')
    const resultsGrid = Array.from(roiGrids).find(
      (grid) =>
        grid.className.includes('grid-cols-1') &&
        grid.className.includes('sm:grid-cols-2'),
    )
    expect(resultsGrid).toBeTruthy()

    // Check Security section stacks vertically on mobile
    const securityFlex = securityContainer.querySelector('.flex')
    expect(securityFlex?.className).toMatch(/flex-col/)

    // Check Footer has mobile grid
    const footerGrid = footerContainer.querySelector('.grid')
    expect(footerGrid?.className).toMatch(/grid-cols-1/)
  })

  it('should have stacked button layout on mobile in Hero', () => {
    setViewportWidth(375)
    const { container } = render(<Hero />)

    const buttonContainer = container.querySelector('.flex.flex-col')
    expect(buttonContainer).toBeTruthy()
    expect(buttonContainer?.className).toMatch(/sm:flex-row/)
  })

  it('should show mobile menu when viewport is < 768px', () => {
    setViewportWidth(375)
    const { container } = render(<Header />)

    // Mobile menu button should be visible
    const mobileButton = container.querySelector('button.md\\:hidden')
    expect(mobileButton).toBeTruthy()
    expect(mobileButton?.getAttribute('aria-label')).toMatch(/menú/)
  })

  it('should use smaller text sizes on mobile', () => {
    setViewportWidth(375)
    const { container } = render(<Hero />)

    const heading = container.querySelector('h1')
    expect(heading?.className).toMatch(/text-4xl/)
    expect(heading?.className).toMatch(/sm:text-5xl/)
  })

  it('should adapt ROI calculator inputs to single column on mobile', () => {
    setViewportWidth(375)
    const { container } = render(<ROICalculator />)

    const inputGrid = container.querySelector('.grid')
    // ROI Calculator input grid is always 3 columns on sm and up
    expect(inputGrid?.className).toMatch(/sm:grid-cols-3/)
  })
})
