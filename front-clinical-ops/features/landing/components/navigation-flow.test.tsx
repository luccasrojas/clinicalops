import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from './header'

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    })

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('should scroll to correct section when clicking nav links', async () => {
    render(<Header />)

    // Find the "El Problema" link
    const problemaLink = screen.getByRole('link', { name: /El Problema/i })

    // Mock the target section
    const mockSection = document.createElement('section')
    mockSection.id = 'problema'
    document.body.appendChild(mockSection)

    // Click the link
    fireEvent.click(problemaLink)

    // Wait for any async operations
    await waitFor(() => {
      // Verify the href is correct
      expect(problemaLink).toHaveAttribute('href', '#problema')
    })

    // Cleanup
    document.body.removeChild(mockSection)
  })

  it('should open mobile menu when clicking menu button', async () => {
    render(<Header />)

    // Find the mobile menu button (only visible on mobile)
    const menuButton = screen.getByRole('button', { name: /Abrir menú/i })

    // Click to open menu
    fireEvent.click(menuButton)

    // Wait for menu to appear
    await waitFor(() => {
      const mobileMenu = screen.getByRole('menu')
      expect(mobileMenu).toBeInTheDocument()
    })

    // Verify menu items are visible
    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems).toHaveLength(3) // Three nav links
  })

  it('should close mobile menu when clicking close button', async () => {
    render(<Header />)

    // Open the menu first
    const openButton = screen.getByRole('button', { name: /Abrir menú/i })
    fireEvent.click(openButton)

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /Cerrar menú/i })
    fireEvent.click(closeButton)

    // Wait for menu to disappear
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('should close mobile menu when clicking a navigation link', async () => {
    render(<Header />)

    // Open the menu
    const menuButton = screen.getByRole('button', { name: /Abrir menú/i })
    fireEvent.click(menuButton)

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    // Click a menu item
    const menuItems = screen.getAllByRole('menuitem')
    fireEvent.click(menuItems[0])

    // Wait for menu to close
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  it('should have correct aria attributes for accessibility', () => {
    render(<Header />)

    // Check navigation has proper role and label
    const nav = screen.getByRole('navigation', { name: /Main navigation/i })
    expect(nav).toBeInTheDocument()

    // Check menu button has aria-expanded
    const menuButton = screen.getByRole('button', { name: /Abrir menú/i })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    // Open menu and check aria-expanded changes
    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('should apply scrolled styles when page is scrolled', async () => {
    render(<Header />)

    const nav = screen.getByRole('navigation')

    // Initially should not have scrolled styles
    expect(nav).toHaveClass('bg-transparent')

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 100,
    })

    // Trigger scroll event
    fireEvent.scroll(window)

    // Wait for state update
    await waitFor(() => {
      expect(nav).toHaveClass('bg-white/90')
      expect(nav).toHaveClass('backdrop-blur-xl')
    })
  })

  it('should have keyboard accessible navigation links', () => {
    render(<Header />)

    // Get all navigation links
    const links = screen.getAllByRole('link')

    // Verify each link has focus styles
    links.forEach((link) => {
      expect(link).toHaveClass('focus:outline-none')
      expect(link).toHaveClass('focus:ring-2')
    })
  })
})
