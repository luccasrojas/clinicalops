import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NetworkStatusBadge } from './network-status-badge'
import * as useNetworkStatusModule from '../hooks/use-network-status'

// Mock the useNetworkStatus hook
vi.mock('../hooks/use-network-status')

describe('NetworkStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display "Sin conexión" when offline', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: '4g',
    })

    render(<NetworkStatusBadge />)
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
  })

  it('should display "En línea" when online with unknown connection type', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: '4g',
    })

    render(<NetworkStatusBadge />)
    expect(screen.getByText('4G')).toBeInTheDocument()
  })

  it('should display "WiFi" when connected via WiFi', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    render(<NetworkStatusBadge />)
    expect(screen.getByText('WiFi')).toBeInTheDocument()
  })

  it('should display "4G" when connected via 4G', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: '4g',
      effectiveType: '4g',
    })

    render(<NetworkStatusBadge />)
    expect(screen.getByText('4G')).toBeInTheDocument()
  })

  it('should display "3G" when connected via 3G', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: '3g',
      effectiveType: '3g',
    })

    render(<NetworkStatusBadge />)
    expect(screen.getByText('3G')).toBeInTheDocument()
  })

  it('should use warning variant for slow connections', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: '2g',
      effectiveType: '2g',
    })

    const { container } = render(<NetworkStatusBadge />)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-yellow-500')
  })

  it('should use destructive variant when offline', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'unknown',
      effectiveType: '4g',
    })

    const { container } = render(<NetworkStatusBadge />)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-destructive')
  })

  it('should use success variant when online with good connection', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    const { container } = render(<NetworkStatusBadge />)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-green-500')
  })

  it('should hide connection type when showConnectionType is false', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    render(<NetworkStatusBadge showConnectionType={false} />)
    expect(screen.getByText('En línea')).toBeInTheDocument()
    expect(screen.queryByText('WiFi')).not.toBeInTheDocument()
  })

  it('should have proper aria-label for accessibility', () => {
    vi.spyOn(useNetworkStatusModule, 'useNetworkStatus').mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
    })

    const { container } = render(<NetworkStatusBadge />)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveAttribute('aria-label', 'Estado de conexión: WiFi')
  })
})
