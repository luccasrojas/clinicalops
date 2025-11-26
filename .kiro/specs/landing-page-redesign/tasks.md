# Implementation Plan

- [x] 1. Setup project structure and shared UI components

  - Create directory structure for landing feature
  - Implement Button component with cva and Slot pattern
  - Implement SectionBadge component
  - Create TypeScript types and interfaces
  - Create constants file with static data
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 8.1, 8.2_

- [ ]\* 1.1 Write property test for Button variants

  - **Property 1: Button variant rendering consistency**
  - **Validates: Requirements 4.2**

- [ ]\* 1.2 Write property test for Button asChild pattern

  - **Property 2: Button asChild pattern**
  - **Validates: Requirements 4.3**

- [x] 2. Implement static Server Components

  - Implement Hero section component
  - Implement Features section and FeatureCard components
  - Implement Problem section and ProblemCard components
  - Implement Security section component
  - Implement Footer component
  - Ensure all use semantic HTML and proper structure
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.4_

- [ ]\* 2.1 Write property test for Hero semantic structure

  - **Property 7: Hero semantic HTML structure**
  - **Validates: Requirements 6.4**

- [ ]\* 2.2 Write property test for semantic landmarks

  - **Property 13: Semantic landmarks**
  - **Validates: Requirements 10.4**

- [x] 3. Implement Header navigation component

  - Create Header component with 'use client' directive
  - Implement scroll state detection with useEffect
  - Implement mobile menu state management
  - Add navigation links with smooth scrolling
  - Implement mobile menu with proper accessibility
  - _Requirements: 2.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 3.1 Write property test for navigation scroll state

  - **Property 3: Navigation scroll state reactivity**
  - **Validates: Requirements 5.1**

- [ ]\* 3.2 Write property test for navigation semantic structure

  - **Property 4: Navigation semantic structure**
  - **Validates: Requirements 5.5**

- [ ] 4. Implement ROI Calculator component

  - Create ROI Calculator component with 'use client' directive
  - Implement state management for three input sliders
  - Implement calculation logic with useMemo
  - Implement currency formatting with Intl.NumberFormat
  - Create responsive layout for calculator controls
  - Display calculated results (time saved, extra consults, revenue, ROI)
  - _Requirements: 2.1, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 4.1 Write property test for ROI Calculator input-output consistency

  - **Property 5: ROI Calculator input-output consistency**
  - **Validates: Requirements 7.2**

- [ ] 4.2 Write property test for currency formatting

  - **Property 6: Currency formatting localization**
  - **Validates: Requirements 7.4**

- [ ] 5. Implement accessibility features

  - Add ARIA attributes to all interactive elements
  - Ensure decorative icons have aria-hidden="true"
  - Ensure meaningful icons have aria-label
  - Implement keyboard navigation for all interactive elements
  - Add focus indicators for keyboard navigation
  - Verify color contrast meets WCAG AA standards
  - Implement prefers-reduced-motion support for animations
  - _Requirements: 9.4, 9.5, 10.1, 10.2, 10.5_

- [ ]\* 5.1 Write property test for decorative icon accessibility

  - **Property 8: Decorative icon accessibility**
  - **Validates: Requirements 9.4**

- [ ]\* 5.2 Write property test for meaningful icon accessibility

  - **Property 9: Meaningful icon accessibility**
  - **Validates: Requirements 9.5**

- [ ]\* 5.3 Write property test for keyboard accessibility

  - **Property 10: Interactive element keyboard accessibility**
  - **Validates: Requirements 10.1**

- [ ] 5.4 Write property test for color contrast

  - **Property 11: Color contrast compliance**
  - **Validates: Requirements 10.2**

- [ ] 5.5 Write property test for reduced motion

  - **Property 14: Reduced motion respect**
  - **Validates: Requirements 10.5**

- [ ] 6. Implement responsive design

  - Add mobile-specific layouts and styles
  - Add tablet-specific layouts and styles
  - Add desktop-specific layouts and styles
  - Test all breakpoints (sm, md, lg, xl, 2xl)
  - Ensure mobile menu works correctly on small screens
  - Verify grid layouts adapt properly at each breakpoint
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 6.1 Write property test for mobile layout

  - **Property 15: Mobile layout adaptation**
  - **Validates: Requirements 12.1**

- [ ] 6.2 Write property test for tablet layout

  - **Property 16: Tablet layout adaptation**
  - **Validates: Requirements 12.2**

- [ ] 6.3 Write property test for desktop layout

  - **Property 17: Desktop layout utilization**
  - **Validates: Requirements 12.3**

- [ ] 7. Integrate components into landing page

  - Update app/page.tsx to import new components
  - Verify component composition and data flow
  - Test navigation between sections
  - Verify all links work correctly
  - Test mobile menu functionality
  - _Requirements: 1.4, 2.3, 2.4_

- [ ] 7.1 Write integration tests for navigation flow

  - Test clicking nav links scrolls to correct sections
  - Test mobile menu opens and closes correctly
  - Test navigation links close mobile menu

- [ ] 7.2 Write integration tests for ROI Calculator

  - Test all three inputs work together
  - Test calculations update when any input changes
  - Test edge cases (minimum and maximum values)

- [ ] 8. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Verify build output and performance

  - Run Next.js build and verify static generation
  - Check that landing page is fully prerendered
  - Verify JavaScript bundle size is minimal
  - Test page load performance (Lighthouse)
  - Verify Cache Components are working correctly
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 10. Clean up and remove old components

  - Remove old landing components from features/landing/components/
  - Update features/landing/index.ts exports
  - Remove any unused imports or files
  - Verify no broken imports remain
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

