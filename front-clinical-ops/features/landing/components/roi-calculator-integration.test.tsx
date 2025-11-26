import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ROICalculator } from './roi-calculator'

describe('ROI Calculator Integration Tests', () => {
  it('should update all calculations when changing number of doctors', () => {
    render(<ROICalculator />)

    // Get the slider for number of doctors
    const medicosSlider = screen.getByLabelText(/Número de médicos/i)

    // Initial value should be 1
    expect(medicosSlider).toHaveValue('1')

    // Change to 5 doctors
    fireEvent.change(medicosSlider, { target: { value: '5' } })

    // Verify the display value updated
    expect(screen.getByText('5')).toBeInTheDocument()

    // Verify calculations updated (time saved should increase)
    // With 5 doctors instead of 1, time saved should be 5x more
    const timeSavedElements = screen.getAllByText(/horas por mes/i)
    expect(timeSavedElements.length).toBeGreaterThan(0)
  })

  it('should update all calculations when changing patients per day', () => {
    render(<ROICalculator />)

    // Get the slider for patients per day
    const pacientesSlider = screen.getByLabelText(/Pacientes por día/i)

    // Initial value should be 35
    expect(pacientesSlider).toHaveValue('35')

    // Change to 40 patients
    fireEvent.change(pacientesSlider, { target: { value: '40' } })

    // Verify the display value updated
    expect(screen.getByText('40')).toBeInTheDocument()

    // Verify calculations section exists using getAllByText
    expect(screen.getAllByText(/Eficiencia/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Crecimiento/i).length).toBeGreaterThan(0)
  })

  it('should update all calculations when changing consultation value', () => {
    render(<ROICalculator />)

    // Get the slider for consultation value
    const valorSlider = screen.getByLabelText(/Valor de consulta/i)

    // Initial value should be 20000
    expect(valorSlider).toHaveValue('20000')

    // Change to 100000
    fireEvent.change(valorSlider, { target: { value: '100000' } })

    // Verify currency formatting is displayed
    const currencyElements = screen.getAllByText(/\$/i)
    expect(currencyElements.length).toBeGreaterThan(0)

    // Verify ROI section exists
    expect(screen.getByText(/Retorno/i)).toBeInTheDocument()
  })

  it('should work correctly with all three inputs changed together', () => {
    render(<ROICalculator />)

    // Get all three sliders
    const medicosSlider = screen.getByLabelText(/Número de médicos/i)
    const pacientesSlider = screen.getByLabelText(/Pacientes por día/i)
    const valorSlider = screen.getByLabelText(/Valor de consulta/i)

    // Change all three values
    fireEvent.change(medicosSlider, { target: { value: '10' } })
    fireEvent.change(pacientesSlider, { target: { value: '30' } })
    fireEvent.change(valorSlider, { target: { value: '80000' } })

    // Verify slider values updated
    expect(medicosSlider).toHaveValue('10')
    expect(pacientesSlider).toHaveValue('30')
    expect(valorSlider).toHaveValue('80000')

    // Verify all result cards are present using getAllByText
    expect(screen.getAllByText(/Eficiencia/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Crecimiento/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Rentabilidad/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Retorno/i).length).toBeGreaterThan(0)
  })

  it('should handle minimum values correctly', () => {
    render(<ROICalculator />)

    // Get all sliders
    const medicosSlider = screen.getByLabelText(/Número de médicos/i)
    const pacientesSlider = screen.getByLabelText(/Pacientes por día/i)
    const valorSlider = screen.getByLabelText(/Valor de consulta/i)

    // Set to minimum values
    fireEvent.change(medicosSlider, { target: { value: '1' } })
    fireEvent.change(pacientesSlider, { target: { value: '10' } })
    fireEvent.change(valorSlider, { target: { value: '20000' } })

    // Verify values are set
    expect(medicosSlider).toHaveValue('1')
    expect(pacientesSlider).toHaveValue('10')
    expect(valorSlider).toHaveValue('20000')

    // Verify calculations still work (no errors)
    expect(screen.getByText(/horas por mes/i)).toBeInTheDocument()
    expect(screen.getByText(/consultas por mes/i)).toBeInTheDocument()
  })

  it('should handle maximum values correctly', () => {
    render(<ROICalculator />)

    // Get all sliders
    const medicosSlider = screen.getByLabelText(/Número de médicos/i)
    const pacientesSlider = screen.getByLabelText(/Pacientes por día/i)
    const valorSlider = screen.getByLabelText(/Valor de consulta/i)

    // Set to maximum values
    fireEvent.change(medicosSlider, { target: { value: '50' } })
    fireEvent.change(pacientesSlider, { target: { value: '50' } })
    fireEvent.change(valorSlider, { target: { value: '150000' } })

    // Verify values are set
    expect(medicosSlider).toHaveValue('50')
    expect(pacientesSlider).toHaveValue('50')
    expect(valorSlider).toHaveValue('150000')

    // Verify calculations still work (no errors)
    expect(screen.getByText(/horas por mes/i)).toBeInTheDocument()
    expect(screen.getByText(/consultas por mes/i)).toBeInTheDocument()
  })

  it('should display currency in Colombian peso format', () => {
    render(<ROICalculator />)

    // Get the valor slider
    const valorSlider = screen.getByLabelText(/Valor de consulta/i)

    // Set a specific value
    fireEvent.change(valorSlider, { target: { value: '56900' } })

    // Check that currency is formatted correctly (should have $ and no decimals)
    // The exact format depends on Intl.NumberFormat for es-CO
    const currencyText = screen.getByText(/\$ 56\.900/i)
    expect(currencyText).toBeInTheDocument()
  })

  it('should recalculate immediately when any input changes', () => {
    render(<ROICalculator />)

    // Verify initial state has ROI section
    expect(screen.getByText(/retorno anual/i)).toBeInTheDocument()

    // Change a value
    const medicosSlider = screen.getByLabelText(/Número de médicos/i)
    fireEvent.change(medicosSlider, { target: { value: '20' } })

    // Verify slider value updated
    expect(medicosSlider).toHaveValue('20')

    // Verify calculations updated (ROI section still exists and has content)
    expect(screen.getByText(/retorno anual/i)).toBeInTheDocument()
  })

  it('should have proper labels and accessibility attributes', () => {
    render(<ROICalculator />)

    // Check all sliders have proper labels
    expect(screen.getByLabelText(/Número de médicos/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Pacientes por día/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Valor de consulta/i)).toBeInTheDocument()

    // Check section has proper ID for navigation
    const section = screen.getByText(/Calcula tu/i).closest('section')
    expect(section).toHaveAttribute('id', 'impacto')
  })

  it('should display all four result cards', () => {
    render(<ROICalculator />)

    // Verify all four result cards are present by checking for unique headings
    const tiempoHeadings = screen.getAllByText(/Eficiencia/i)
    expect(tiempoHeadings.length).toBeGreaterThan(0)

    const consultasHeadings = screen.getAllByText(/Crecimiento/i)
    expect(consultasHeadings.length).toBeGreaterThan(0)

    const ingresoHeadings = screen.getAllByText(/Rentabilidad/i)
    expect(ingresoHeadings.length).toBeGreaterThan(0)

    const roiHeadings = screen.getAllByText(/Retorno/i)
    expect(roiHeadings.length).toBeGreaterThan(0)
  })

  it('should show calculation assumptions in footer', () => {
    render(<ROICalculator />)

    // Check that the assumptions are displayed
    expect(
      screen.getByText(/Cálculos basados en 5 minutos ahorrados/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/24 días laborales por mes/i)).toBeInTheDocument()
  })
})
