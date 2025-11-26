# Design Document

## Overview

The landing page redesign transforms a monolithic 1000+ line single-file component into a well-architected, performant Next.js 16 application following Bulletproof React patterns. The design leverages Cache Components for optimal performance, properly separates client and server components, and organizes code into maintainable feature modules.

The migration strategy focuses on:

1. **Component extraction and organization** - Breaking down the monolith into focused, reusable components
2. **Performance optimization** - Using Cache Components and Server Components where possible
3. **Type safety** - Implementing proper TypeScript types throughout
4. **Maintainability** - Following established patterns from the existing codebase

## Architecture

### Directory Structure

```
front-clinical-ops/
├── app/
│   └── page.tsx                          # Landing page route (Server Component)
├── components/
│   └── ui/
│       ├── button.tsx                    # Shared Button component (Client)
│       └── section-badge.tsx             # Shared badge component (Server)
├── features/
│   └── landing/
│       ├── components/
│       │   ├── header.tsx                # Navigation (Client - scroll state)
│       │   ├── hero.tsx                  # Hero section (Server)
│       │   ├── problem-section.tsx       # Problem section (Server)
│       │   ├── problem-card.tsx          # Problem card (Server)
│       │   ├── features-section.tsx      # Features section (Server)
│       │   ├── feature-card.tsx          # Feature card (Server)
│       │   ├── roi-calculator.tsx        # ROI Calculator (Client - state)
│       │   ├── security-section.tsx      # Security section (Server)
│       │   ├── footer.tsx                # Footer (Server)
│       │   └── index.ts                  # Barrel export
│       ├── types/
│       │   └── index.ts                  # Feature types
│       ├── constants/
│       │   └── landing-data.ts           # Static data (features, problems)
│       └── index.ts                      # Feature export
└── lib/
    └── utils.ts                          # cn() helper (already exists)
```

### Component Classification

**Server Components (Static Shell):**

- Hero section - Pure presentational, no interactivity
- Problem section & cards - Static content
- Features section & cards - Static content
- Security section - Static content
- Footer - Static content

**Client Components (Interactive):**

- Header/Navigation - Scroll state, mobile menu state
- ROI Calculator - Form inputs, calculations, state management
- Button - Click handlers, interactive states

### Data Flow

```
Static Data (constants/landing-data.ts)
    ↓
Server Components (render with data)
    ↓
Static HTML Shell (prerendered)
    ↓
Client Components (hydrate for interactivity)
    ↓
User Interactions (scroll, clicks, form inputs)
```

## Components and Interfaces

### 1. Shared UI Components

#### Button Component (`components/ui/button.tsx`)

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg shadow-slate-900/20 border border-slate-800',
        secondary:
          'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm',
        gradient:
          'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25 border-none',
        ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
      },
      size: {
        default: 'px-8 py-3.5 text-sm',
        sm: 'px-5 py-2.5 text-xs',
        lg: 'px-10 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

#### SectionBadge Component (`components/ui/section-badge.tsx`)

```typescript
import { cn } from '@/lib/utils';

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function SectionBadge({ children, className, icon }: SectionBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest shadow-sm',
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
```

### 2. Landing Feature Components

#### Header Component (`features/landing/components/header.tsx`)

**Type:** Client Component (scroll state, mobile menu)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Component implementation...
}
```

#### Hero Component (`features/landing/components/hero.tsx`)

**Type:** Server Component (static content)

```typescript
import {
  Loader2,
  ArrowRight,
  Mic,
  Brain,
  Workflow,
  Database,
  FileText,
  Pill,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionBadge } from '@/components/ui/section-badge';

export function Hero() {
  return (
    <section className='relative pt-44 pb-32 lg:pt-56 lg:pb-40 overflow-hidden bg-white'>
      {/* Background effects - pure CSS */}
      {/* Content - static HTML */}
      {/* Pipeline visualization - static SVG/HTML */}
    </section>
  );
}
```

#### ROI Calculator Component (`features/landing/components/roi-calculator.tsx`)

**Type:** Client Component (form state, calculations)

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Calculator, Clock, TrendingUp, DollarSign } from 'lucide-react';

export function ROICalculator() {
  const [numMedicos, setNumMedicos] = useState(1);
  const [pacientesPorDia, setPacientesPorDia] = useState(24);
  const [valorConsulta, setValorConsulta] = useState(56900);

  // Memoized calculations
  const calculations = useMemo(() => {
    const daysPerMonth = 24;
    const costPerNote = 755;
    const minutesSavedPerDay = numMedicos * pacientesPorDia * 5;
    // ... rest of calculations
    return {
      hoursSavedPerMonth,
      consultsExtraPerMonth,
      annualRevenue,
      roiValue,
    };
  }, [numMedicos, pacientesPorDia, valorConsulta]);

  // Component implementation...
}
```

## Data Models

### Feature Data Types (`features/landing/types/index.ts`)

```typescript
import { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProblemCard {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface ROICalculation {
  hoursSavedPerMonth: string;
  hoursSavedPerDay: string;
  consultsExtraPerMonth: number;
  annualRevenue: number;
  roiValue: string;
}
```

### Static Data (`features/landing/constants/landing-data.ts`)

```typescript
import {
  Layout,
  FileJson,
  Database,
  Brain,
  Network,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { Feature, ProblemCard, NavLink } from '../types';

export const NAV_LINKS: NavLink[] = [
  { href: '#problema', label: 'El Problema' },
  { href: '#capacidad', label: 'Capacidades' },
  { href: '#impacto', label: 'Impacto & ROI' },
];

export const FEATURES: Feature[] = [
  {
    icon: Layout,
    title: 'Documentación Estructurada',
    description:
      'Redacta la nota SOAP automáticamente. No es solo voz a texto; comprende el contexto clínico y estructura la historia coherentemente.',
  },
  // ... rest of features
];

export const PROBLEM_CARDS: ProblemCard[] = [
  {
    icon: Clock,
    title: '50% del Tiempo Perdido',
    description:
      'Médicos convertidos en transcriptores. La mitad de la jornada se pierde digitando historias en lugar de atender pacientes.',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
  },
  // ... rest of problems
];
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, most requirements for this migration are structural and organizational (code organization, file placement, TypeScript usage) which are enforced by the development environment and code review rather than runtime properties. However, we have identified several testable properties for the interactive and accessibility aspects:

### Property 1: Button variant rendering consistency

_For any_ Button component with a specified variant prop, the rendered element should include the CSS classes corresponding to that variant as defined in the cva configuration.
**Validates: Requirements 4.2**

### Property 2: Button asChild pattern

_For any_ Button component with asChild=true, the component should render using the Radix Slot component and pass through all props to the child element.
**Validates: Requirements 4.3**

### Property 3: Navigation scroll state reactivity

_For any_ scroll position greater than 20 pixels, the navigation component should apply the scrolled state styling (backdrop-blur, border, padding changes).
**Validates: Requirements 5.1**

### Property 4: Navigation semantic structure

_For any_ navigation component instance, it should use semantic HTML nav element and include proper ARIA attributes for accessibility.
**Validates: Requirements 5.5**

### Property 5: ROI Calculator input-output consistency

_For any_ valid combination of input values (numMedicos, pacientesPorDia, valorConsulta), changing an input should immediately update all calculated output values (hoursSavedPerMonth, consultsExtraPerMonth, annualRevenue, roiValue) according to the defined formulas.
**Validates: Requirements 7.2**

### Property 6: Currency formatting localization

_For any_ numeric value passed to the currency formatter, the output should be formatted according to Colombian peso (COP) locale standards with proper thousand separators and no decimal places.
**Validates: Requirements 7.4**

### Property 7: Hero semantic HTML structure

_For any_ Hero component render, it should contain a section element with an h1 heading as the primary title element.
**Validates: Requirements 6.4**

### Property 8: Decorative icon accessibility

_For any_ icon used purely for decoration (not conveying unique information), the icon element should include aria-hidden="true" attribute.
**Validates: Requirements 9.4**

### Property 9: Meaningful icon accessibility

_For any_ icon that conveys meaning or serves as a button/link without text, the parent element should include an appropriate aria-label or the icon should have a title.
**Validates: Requirements 9.5**

### Property 10: Interactive element keyboard accessibility

_For any_ interactive element (buttons, links, form controls), the element should be focusable and respond to appropriate keyboard events (Enter, Space for buttons).
**Validates: Requirements 10.1**

### Property 11: Color contrast compliance

_For any_ text element on the landing page, the color contrast ratio between text and background should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 10.2**

### Property 12: Form label association

_For any_ form input element, there should be an associated label element properly linked via htmlFor/id or wrapped in a label element.
**Validates: Requirements 10.3**

### Property 13: Semantic landmarks

_For any_ major section of the landing page, it should use appropriate semantic HTML elements (header, nav, main, section, footer) and ARIA landmark roles where needed.
**Validates: Requirements 10.4**

### Property 14: Reduced motion respect

_For any_ animated element, when the user's system has prefers-reduced-motion enabled, animations should be disabled or significantly reduced.
**Validates: Requirements 10.5**

### Property 15: Mobile layout adaptation

_For any_ viewport width less than 768px (mobile breakpoint), the layout should display the mobile-optimized version with stacked elements and mobile navigation.
**Validates: Requirements 12.1**

### Property 16: Tablet layout adaptation

_For any_ viewport width between 768px and 1024px (tablet breakpoint), the layout should display the tablet-optimized version with appropriate grid columns and spacing.
**Validates: Requirements 12.2**

### Property 17: Desktop layout utilization

_For any_ viewport width greater than 1024px (desktop breakpoint), the layout should use the full-width design with maximum content width of 1280px (max-w-7xl).
**Validates: Requirements 12.3**

## Error Handling

### Client Component Error Boundaries

While the landing page is primarily static content, the interactive components (Header, ROI Calculator) should handle errors gracefully:

1. **Navigation Component**: If scroll event listeners fail, the component should still render with default (non-scrolled) styling
2. **ROI Calculator**: If calculations produce invalid results (NaN, Infinity), display fallback values or error messages
3. **Mobile Menu**: If state management fails, ensure the menu can still be closed via escape key or clicking outside

### Type Safety

TypeScript strict mode ensures:

- All props are properly typed
- Icon components receive correct props
- Data structures match their interfaces
- No implicit any types

## Testing Strategy

### Unit Testing

Unit tests will verify:

1. **Button Component**:

   - Renders with correct variant classes
   - asChild pattern works correctly
   - Click handlers are called
   - Disabled state prevents interaction

2. **ROI Calculator**:

   - Calculations are correct for various inputs
   - Currency formatting works properly
   - State updates trigger re-renders
   - Edge cases (zero values, maximum values)

3. **Utility Functions**:
   - cn() helper combines classes correctly
   - Currency formatter handles edge cases

### Property-Based Testing

Property-based tests will use **fast-check** (JavaScript property testing library) to verify:

1. **Button Variants Property** (Property 1):

   - Generate random variant values
   - Verify correct CSS classes are applied
   - Validates: Requirements 4.2

2. **ROI Calculator Consistency Property** (Property 5):

   - Generate random valid input combinations
   - Verify calculations follow formulas
   - Verify outputs are always positive numbers
   - Validates: Requirements 7.2

3. **Currency Formatting Property** (Property 6):

   - Generate random numeric values
   - Verify COP formatting is consistent
   - Verify no decimal places
   - Validates: Requirements 7.4

4. **Responsive Layout Properties** (Properties 15-17):

   - Generate random viewport widths
   - Verify correct breakpoint classes are applied
   - Validates: Requirements 12.1, 12.2, 12.3

5. **Accessibility Properties** (Properties 8-14):
   - Verify ARIA attributes on decorative icons
   - Verify keyboard navigation works
   - Verify semantic HTML structure
   - Validates: Requirements 9.4, 9.5, 10.1, 10.3, 10.4

### Integration Testing

Integration tests will verify:

1. **Navigation Flow**: Clicking nav links scrolls to correct sections
2. **Mobile Menu**: Opens, closes, and prevents body scroll
3. **ROI Calculator**: All inputs work together correctly
4. **Responsive Behavior**: Layout changes at breakpoints

### Accessibility Testing

Accessibility tests will verify:

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Screen Reader**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: All text meets WCAG AA standards
4. **Reduced Motion**: Animations respect user preferences

### Visual Regression Testing

Visual tests will verify:

1. **Component Rendering**: Components match design specifications
2. **Responsive Layouts**: Layouts work at all breakpoints
3. **Interactive States**: Hover, focus, active states render correctly

## Performance Considerations

### Server Components

The majority of the landing page uses Server Components, which:

- Render on the server during build time
- Generate static HTML included in the initial page load
- Reduce JavaScript bundle size
- Improve Time to First Byte (TTFB) and First Contentful Paint (FCP)

### Client Components Optimization

Client components are minimized and optimized:

- **Header**: Only scroll state and mobile menu state
- **ROI Calculator**: Uses useMemo for expensive calculations
- **Button**: Lightweight with no unnecessary re-renders

### Code Splitting

Next.js automatically code-splits:

- Each route gets its own bundle
- Client components are lazy-loaded
- Shared components are in a common chunk

### Image Optimization

If images are added:

- Use Next.js Image component
- Implement lazy loading
- Provide appropriate sizes and formats

### CSS Optimization

Tailwind CSS:

- Purges unused styles in production
- Generates minimal CSS bundle
- Uses JIT mode for optimal performance

## Migration Strategy

### Phase 1: Setup and Shared Components

1. Create directory structure
2. Implement Button component with cva
3. Implement SectionBadge component
4. Create types and constants files

### Phase 2: Static Sections

1. Implement Hero component (Server)
2. Implement Features section (Server)
3. Implement Problem section (Server)
4. Implement Security section (Server)
5. Implement Footer (Server)

### Phase 3: Interactive Components

1. Implement Header with scroll state (Client)
2. Implement ROI Calculator (Client)
3. Wire up navigation links

### Phase 4: Testing and Refinement

1. Write unit tests for all components
2. Write property-based tests for key properties
3. Test accessibility
4. Test responsive behavior
5. Verify performance metrics

### Phase 5: Integration

1. Update app/page.tsx to use new components
2. Remove old landing components
3. Verify build output
4. Deploy and monitor

## Cache Components Implementation

Since the landing page is entirely static content (no data fetching, no runtime data), the entire page will be included in the static shell automatically. No explicit `use cache` directives are needed.

The build process will:

1. Prerender the entire route at build time
2. Generate static HTML
3. Generate RSC payload for client-side navigation
4. Serve the static shell immediately on page load

Client components (Header, ROI Calculator) will hydrate after the static shell is displayed, providing progressive enhancement.

## Accessibility Compliance

### WCAG 2.1 Level AA Compliance

The landing page will meet WCAG 2.1 Level AA standards:

1. **Perceivable**:

   - Sufficient color contrast (4.5:1 for normal text)
   - Text alternatives for non-text content
   - Adaptable layouts that work at different sizes

2. **Operable**:

   - Keyboard accessible
   - Sufficient time for interactions
   - No seizure-inducing content
   - Navigable with clear focus indicators

3. **Understandable**:

   - Readable text (Spanish language)
   - Predictable navigation
   - Input assistance for forms

4. **Robust**:
   - Valid HTML
   - Proper ARIA usage
   - Compatible with assistive technologies

### Semantic HTML

All components use semantic HTML:

- `<header>` for site header
- `<nav>` for navigation
- `<main>` for main content
- `<section>` for content sections
- `<footer>` for site footer
- `<h1>`, `<h2>`, `<h3>` for proper heading hierarchy
- `<button>` for interactive buttons
- `<a>` for links

### ARIA Attributes

ARIA attributes are used where semantic HTML is insufficient:

- `aria-label` for icon-only buttons
- `aria-hidden="true"` for decorative icons
- `aria-expanded` for mobile menu state
- `aria-current` for current navigation item
- `role="navigation"` for navigation landmarks

## Conclusion

This design transforms a monolithic landing page into a well-architected, performant, and maintainable Next.js 16 application. By following Bulletproof React patterns, properly separating client and server components, and leveraging Cache Components, we achieve:

- **Performance**: Static shell loads instantly, client components hydrate progressively
- **Maintainability**: Clear component boundaries, typed interfaces, organized structure
- **Accessibility**: WCAG 2.1 AA compliant, keyboard accessible, screen reader friendly
- **Scalability**: Easy to add new sections, modify existing content, extend functionality
- **Type Safety**: Full TypeScript coverage with strict mode
- **Testability**: Clear properties to test, separated concerns, mockable dependencies

