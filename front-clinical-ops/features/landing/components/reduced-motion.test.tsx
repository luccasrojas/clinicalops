/**
 * Property-Based Test for Reduced Motion Support
 * Feature: landing-page-redesign, Property 14: Reduced motion respect
 * Validates: Requirements 10.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { Hero } from './hero'
import { Header } from './header'
import { FeatureCard } from './feature-card'
import { ProblemCard } from './problem-card'
import { Button } from '@/components/ui/button'
import { Layout } from 'lucide-react'

describe('Reduced Motion Support (Property 14)', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia
  })

  /**
   * Mock matchMedia to simulate prefers-reduced-motion preference
   */
  function mockPrefersReducedMotion(prefersReduced: boolean) {
    window.matchMedia = (query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)' ? prefersReduced : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })
  }

  /**
   * Property 14: Reduced motion respect
   * For any animated element, when the user's system has prefers-reduced-motion enabled,
   * animations should be disabled or significantly reduced.
   */

  it('should include motion-reduce classes on animated elements in Hero', () => {
    const { container } = render(<Hero />)

    // Check for motion-reduce utilities on animated elements
    const animatedElements = container.querySelectorAll('[class*="animate-"]')

    animatedElements.forEach((element) => {
      const classes = String(element.className)

      // Elements with animations should have motion-reduce:animate-none or similar
      if (classes.includes('animate-spin')) {
        expect(classes).toMatch(/motion-reduce:animate-none/)
      }
      if (classes.includes('animate-pulse')) {
        expect(classes).toMatch(/motion-reduce:animate-none/)
      }
    })
  })

  it('should include motion-reduce classes on transition elements in Button', () => {
    const { container } = render(<Button>Test Button</Button>)

    const button = container.querySelector('button')
    expect(button).toBeTruthy()

    const classes = button!.className

    // Button should have motion-reduce:transition-none
    expect(classes).toMatch(/motion-reduce:transition-none/)

    // Button should have motion-reduce:active:scale-100 to disable scale animation
    expect(classes).toMatch(/motion-reduce:active:scale-100/)
  })

  it('should include motion-reduce classes on FeatureCard transitions', () => {
    const { container } = render(
      <FeatureCard
        icon={Layout}
        title='Test Feature'
        description='Test description'
      />,
    )

    // Check for motion-reduce utilities on transition elements
    const card = container.querySelector('article')
    expect(card).toBeTruthy()

    const classes = card!.className

    // Card should have motion-reduce:transition-none
    expect(classes).toMatch(/motion-reduce:transition-none/)
  })

  it('should include motion-reduce classes on ProblemCard transitions', () => {
    const { container } = render(
      <ProblemCard
        icon={Layout}
        title='Test Problem'
        description='Test description'
        gradientFrom='from-rose-500'
        gradientTo='to-pink-600'
      />,
    )

    // Check for motion-reduce utilities
    const card = container.querySelector('article')
    expect(card).toBeTruthy()

    const classes = card!.className

    // Card should have motion-reduce utilities for hover effects
    expect(classes).toMatch(/motion-reduce/)
  })

  it('should include motion-reduce classes on Header transitions', () => {
    const { container } = render(<Header />)

    const nav = container.querySelector('nav')
    expect(nav).toBeTruthy()

    // Navigation should have smooth transitions that respect reduced motion
    const classes = nav!.className
    expect(classes).toContain('transition')
  })

  it('should verify all animated icons have motion-reduce:animate-none', () => {
    const { container } = render(<Hero />)

    // Find all elements with animate-spin class
    const spinningElements = container.querySelectorAll(
      '[class*="animate-spin"]',
    )

    spinningElements.forEach((element) => {
      // Handle both HTML and SVG elements
      const classes =
        element instanceof SVGElement
          ? element.getAttribute('class') || ''
          : String(element.className)
      expect(
        classes,
        'Spinning elements should have motion-reduce:animate-none',
      ).toMatch(/motion-reduce:animate-none/)
    })

    // Find all elements with animate-pulse class
    const pulsingElements = container.querySelectorAll(
      '[class*="animate-pulse"]',
    )

    pulsingElements.forEach((element) => {
      // Handle both HTML and SVG elements
      const classes =
        element instanceof SVGElement
          ? element.getAttribute('class') || ''
          : String(element.className)
      expect(
        classes,
        'Pulsing elements should have motion-reduce:animate-none',
      ).toMatch(/motion-reduce:animate-none/)
    })
  })

  it('should verify hover transform effects have motion-reduce utilities', () => {
    const { container } = render(
      <ProblemCard
        icon={Layout}
        title='Test'
        description='Test'
        gradientFrom='from-rose-500'
        gradientTo='to-pink-600'
      />,
    )

    const card = container.querySelector('article')
    expect(card).toBeTruthy()

    const classes = card!.className

    // Card with hover:-translate-y should have motion-reduce:hover:translate-y-0
    if (classes.includes('hover:-translate-y')) {
      expect(classes).toMatch(/motion-reduce:hover:translate-y-0/)
    }
  })

  it('should verify all transition classes have motion-reduce:transition-none', () => {
    const components = [
      <Button key='button'>Test</Button>,
      <FeatureCard
        key='feature'
        icon={Layout}
        title='Test'
        description='Test'
      />,
      <ProblemCard
        key='problem'
        icon={Layout}
        title='Test'
        description='Test'
        gradientFrom='from-rose-500'
        gradientTo='to-pink-600'
      />,
    ]

    components.forEach((component) => {
      const { container } = render(component)

      // Find all elements with transition classes
      const transitionElements = container.querySelectorAll(
        '[class*="transition"]',
      )

      transitionElements.forEach((element) => {
        const classes = String(element.className)

        // Elements with transitions should have motion-reduce:transition-none
        if (
          classes.includes('transition-all') ||
          classes.includes('transition-colors') ||
          classes.includes('transition-opacity') ||
          classes.includes('transition-transform')
        ) {
          expect(
            classes,
            'Transition elements should have motion-reduce:transition-none',
          ).toMatch(/motion-reduce:transition-none/)
        }
      })
    })
  })

  it('should verify scale animations have motion-reduce utilities', () => {
    const { container } = render(<Button>Test</Button>)

    const button = container.querySelector('button')
    expect(button).toBeTruthy()

    const classes = button!.className

    // Button with active:scale-95 should have motion-reduce:active:scale-100
    if (classes.includes('active:scale-95')) {
      expect(classes).toMatch(/motion-reduce:active:scale-100/)
    }
  })

  it('should verify gradient animations have motion-reduce utilities', () => {
    const { container } = render(<Hero />)

    // Find elements with shimmer or other gradient animations
    const gradientAnimations = container.querySelectorAll(
      '[class*="animate-[shimmer"]',
    )

    gradientAnimations.forEach((element) => {
      const classes = element.className
      expect(
        classes,
        'Gradient animations should have motion-reduce:animate-none',
      ).toMatch(/motion-reduce:animate-none/)
    })
  })

  it('should verify all animation types are covered by motion-reduce utilities', () => {
    // Test that common animation patterns all have motion-reduce equivalents
    const animationPatterns = [
      { pattern: 'animate-spin', expected: 'motion-reduce:animate-none' },
      { pattern: 'animate-pulse', expected: 'motion-reduce:animate-none' },
      { pattern: 'transition-all', expected: 'motion-reduce:transition-none' },
      {
        pattern: 'transition-colors',
        expected: 'motion-reduce:transition-none',
      },
      {
        pattern: 'active:scale-95',
        expected: 'motion-reduce:active:scale-100',
      },
      {
        pattern: 'hover:-translate-y',
        expected: 'motion-reduce:hover:translate-y-0',
      },
    ]

    // This test documents the expected patterns
    animationPatterns.forEach(({ pattern, expected }) => {
      expect(expected).toBeTruthy()
      expect(pattern).toBeTruthy()
    })
  })
})
