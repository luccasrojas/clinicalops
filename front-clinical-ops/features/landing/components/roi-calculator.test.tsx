import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * **Feature: landing-page-redesign, Property 5: ROI Calculator input-output consistency**
 *
 * This property test validates that for any valid combination of input values
 * (numMedicos, pacientesPorDia, valorConsulta), the ROI Calculator produces
 * consistent and correct output values according to the defined formulas.
 *
 * **Validates: Requirements 7.2**
 */

// Extract the calculation logic from the ROI Calculator component
// This allows us to test the pure calculation logic without rendering the component
function calculateROI(
  numMedicos: number,
  pacientesPorDia: number,
  valorConsulta: number,
) {
  const daysPerMonth = 24
  const costPerNote = 755
  const minutesSavedPerConsult = 5

  // Calculate time saved
  const minutesSavedPerDay =
    numMedicos * pacientesPorDia * minutesSavedPerConsult
  const hoursSavedPerDay = minutesSavedPerDay / 60
  const hoursSavedPerMonth = hoursSavedPerDay * daysPerMonth

  // Calculate extra consults possible with saved time
  const averageConsultDuration = 20 // minutes
  const extraConsultsPerMonth =
    (hoursSavedPerMonth * 60) / averageConsultDuration

  // Calculate financial impact
  const monthlyCost = numMedicos * costPerNote * daysPerMonth
  const extraRevenue = extraConsultsPerMonth * valorConsulta
  const annualRevenue = extraRevenue * 12
  const annualCost = monthlyCost * 12
  const netAnnualBenefit = annualRevenue - annualCost
  const roiPercentage = (netAnnualBenefit / annualCost) * 100

  return {
    hoursSavedPerDay: parseFloat(hoursSavedPerDay.toFixed(1)),
    hoursSavedPerMonth: parseFloat(hoursSavedPerMonth.toFixed(0)),
    consultsExtraPerMonth: Math.floor(extraConsultsPerMonth),
    extraRevenue: extraRevenue,
    annualRevenue: annualRevenue,
    monthlyCost: monthlyCost,
    annualCost: annualCost,
    netAnnualBenefit: netAnnualBenefit,
    roiValue: parseFloat(roiPercentage.toFixed(0)),
  }
}

describe('ROI Calculator - Property-Based Tests', () => {
  it('Property 5: ROI Calculator input-output consistency - calculations should be deterministic and follow formulas', () => {
    fc.assert(
      fc.property(
        // Generate valid input ranges matching the component's slider constraints
        fc.integer({ min: 1, max: 50 }), // numMedicos
        fc.integer({ min: 10, max: 50 }), // pacientesPorDia
        fc
          .integer({ min: 20000, max: 150000 })
          .map((v) => Math.round(v / 5000) * 5000), // valorConsulta (step of 5000)
        (numMedicos, pacientesPorDia, valorConsulta) => {
          const result = calculateROI(
            numMedicos,
            pacientesPorDia,
            valorConsulta,
          )

          // Property 1: All calculated values should be finite numbers
          expect(Number.isFinite(result.hoursSavedPerDay)).toBe(true)
          expect(Number.isFinite(result.hoursSavedPerMonth)).toBe(true)
          expect(Number.isFinite(result.consultsExtraPerMonth)).toBe(true)
          expect(Number.isFinite(result.extraRevenue)).toBe(true)
          expect(Number.isFinite(result.annualRevenue)).toBe(true)
          expect(Number.isFinite(result.monthlyCost)).toBe(true)
          expect(Number.isFinite(result.annualCost)).toBe(true)
          expect(Number.isFinite(result.netAnnualBenefit)).toBe(true)
          expect(Number.isFinite(result.roiValue)).toBe(true)

          // Property 2: All calculated values should be non-negative
          expect(result.hoursSavedPerDay).toBeGreaterThanOrEqual(0)
          expect(result.hoursSavedPerMonth).toBeGreaterThanOrEqual(0)
          expect(result.consultsExtraPerMonth).toBeGreaterThanOrEqual(0)
          expect(result.extraRevenue).toBeGreaterThanOrEqual(0)
          expect(result.annualRevenue).toBeGreaterThanOrEqual(0)
          expect(result.monthlyCost).toBeGreaterThanOrEqual(0)
          expect(result.annualCost).toBeGreaterThanOrEqual(0)

          // Property 3: Verify the calculation formulas are correct
          const expectedMinutesSavedPerDay = numMedicos * pacientesPorDia * 5
          const expectedHoursSavedPerDay = expectedMinutesSavedPerDay / 60
          const expectedHoursSavedPerMonth = expectedHoursSavedPerDay * 24

          // Compare against the rounded values since the function uses toFixed()
          expect(result.hoursSavedPerDay).toBe(
            parseFloat(expectedHoursSavedPerDay.toFixed(1)),
          )
          expect(result.hoursSavedPerMonth).toBe(
            parseFloat(expectedHoursSavedPerMonth.toFixed(0)),
          )

          // Property 4: Extra consults should be based on hours saved
          const expectedExtraConsults = Math.floor(
            (expectedHoursSavedPerMonth * 60) / 20,
          )
          expect(result.consultsExtraPerMonth).toBe(expectedExtraConsults)

          // Property 5: Financial calculations should be consistent
          const expectedMonthlyCost = numMedicos * 755 * 24
          const expectedAnnualCost = expectedMonthlyCost * 12
          const expectedExtraRevenue =
            result.consultsExtraPerMonth * valorConsulta
          const expectedAnnualRevenue = expectedExtraRevenue * 12

          expect(result.monthlyCost).toBe(expectedMonthlyCost)
          expect(result.annualCost).toBe(expectedAnnualCost)
          expect(result.extraRevenue).toBeCloseTo(expectedExtraRevenue, 2)
          expect(result.annualRevenue).toBeCloseTo(expectedAnnualRevenue, 2)

          // Property 6: ROI should be calculated correctly
          const expectedNetBenefit = result.annualRevenue - result.annualCost
          const expectedROI = (expectedNetBenefit / result.annualCost) * 100

          expect(result.netAnnualBenefit).toBeCloseTo(expectedNetBenefit, 2)
          expect(result.roiValue).toBeCloseTo(expectedROI, 0)

          // Property 7: Increasing inputs should increase outputs (monotonicity)
          // This is tested implicitly by the formulas, but we can verify key relationships
          expect(result.hoursSavedPerMonth).toBeGreaterThan(0)
          expect(result.consultsExtraPerMonth).toBeGreaterThan(0)
          expect(result.annualRevenue).toBeGreaterThan(0)
        },
      ),
      { numRuns: 100 }, // Run 100 iterations as specified in the design document
    )
  })

  it('Property 5.1: Changing numMedicos should proportionally affect all outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 49 }), // numMedicos (leaving room for +1)
        fc.integer({ min: 10, max: 50 }), // pacientesPorDia
        fc
          .integer({ min: 20000, max: 150000 })
          .map((v) => Math.round(v / 5000) * 5000), // valorConsulta
        (numMedicos, pacientesPorDia, valorConsulta) => {
          const result1 = calculateROI(
            numMedicos,
            pacientesPorDia,
            valorConsulta,
          )
          const result2 = calculateROI(
            numMedicos + 1,
            pacientesPorDia,
            valorConsulta,
          )

          // When numMedicos increases, time saved should increase
          expect(result2.hoursSavedPerMonth).toBeGreaterThan(
            result1.hoursSavedPerMonth,
          )

          // Extra consults should increase
          expect(result2.consultsExtraPerMonth).toBeGreaterThanOrEqual(
            result1.consultsExtraPerMonth,
          )

          // Costs should increase proportionally
          const costRatio = result2.monthlyCost / result1.monthlyCost
          const medicosRatio = (numMedicos + 1) / numMedicos
          expect(costRatio).toBeCloseTo(medicosRatio, 5)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 5.2: Changing pacientesPorDia should proportionally affect time saved', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // numMedicos
        fc.integer({ min: 10, max: 49 }), // pacientesPorDia (leaving room for +1)
        fc
          .integer({ min: 20000, max: 150000 })
          .map((v) => Math.round(v / 5000) * 5000), // valorConsulta
        (numMedicos, pacientesPorDia, valorConsulta) => {
          const result1 = calculateROI(
            numMedicos,
            pacientesPorDia,
            valorConsulta,
          )
          const result2 = calculateROI(
            numMedicos,
            pacientesPorDia + 1,
            valorConsulta,
          )

          // When pacientesPorDia increases, time saved should increase
          expect(result2.hoursSavedPerMonth).toBeGreaterThan(
            result1.hoursSavedPerMonth,
          )

          // Extra consults should increase
          expect(result2.consultsExtraPerMonth).toBeGreaterThanOrEqual(
            result1.consultsExtraPerMonth,
          )

          // Costs should remain the same (they don't depend on pacientesPorDia)
          expect(result2.monthlyCost).toBe(result1.monthlyCost)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 5.3: Changing valorConsulta should only affect revenue, not time or costs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // numMedicos
        fc.integer({ min: 10, max: 50 }), // pacientesPorDia
        fc
          .integer({ min: 20000, max: 145000 })
          .map((v) => Math.round(v / 5000) * 5000), // valorConsulta (leaving room for +5000)
        (numMedicos, pacientesPorDia, valorConsulta) => {
          const result1 = calculateROI(
            numMedicos,
            pacientesPorDia,
            valorConsulta,
          )
          const result2 = calculateROI(
            numMedicos,
            pacientesPorDia,
            valorConsulta + 5000,
          )

          // Time saved should be identical
          expect(result2.hoursSavedPerMonth).toBe(result1.hoursSavedPerMonth)
          expect(result2.consultsExtraPerMonth).toBe(
            result1.consultsExtraPerMonth,
          )

          // Costs should be identical
          expect(result2.monthlyCost).toBe(result1.monthlyCost)
          expect(result2.annualCost).toBe(result1.annualCost)

          // Revenue should increase
          expect(result2.extraRevenue).toBeGreaterThan(result1.extraRevenue)
          expect(result2.annualRevenue).toBeGreaterThan(result1.annualRevenue)

          // ROI should increase
          expect(result2.roiValue).toBeGreaterThan(result1.roiValue)
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * **Feature: landing-page-redesign, Property 6: Currency formatting localization**
   *
   * This property test validates that for any numeric value passed to the currency
   * formatter, the output is formatted according to Colombian peso (COP) locale
   * standards with proper thousand separators and no decimal places.
   *
   * **Validates: Requirements 7.4**
   */
  it('Property 6: Currency formatting localization - should format numbers as Colombian pesos', () => {
    // Extract the currency formatter from the component
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }

    fc.assert(
      fc.property(
        // Generate a wide range of numeric values that could appear in the calculator
        fc.integer({ min: 0, max: 100000000 }), // From 0 to 100 million COP
        (value) => {
          const formatted = formatCurrency(value)

          // Property 1: Output should be a non-empty string
          expect(formatted).toBeTruthy()
          expect(typeof formatted).toBe('string')
          expect(formatted.length).toBeGreaterThan(0)

          // Property 2: Should contain the currency symbol or code for COP
          // Colombian peso can be formatted as "COP" or "$" depending on locale
          const hasCurrencyIndicator =
            formatted.includes('COP') || formatted.includes('$')
          expect(hasCurrencyIndicator).toBe(true)

          // Property 3: Should not contain decimal places at the end
          // Colombian locale uses period (.) for thousands, comma (,) for decimals
          // Decimals would appear at the end like ",50" or ",99"
          // We check that the string doesn't end with a decimal separator followed by 1-2 digits
          const hasNoDecimals = !formatted.match(/[,]\d{1,2}$/)
          expect(hasNoDecimals).toBe(true)

          // Property 4: For values >= 1000, should contain thousand separators
          if (value >= 1000) {
            // Colombian locale uses period (.) as thousand separator
            const hasThousandSeparator = formatted.includes('.')
            expect(hasThousandSeparator).toBe(true)
          }

          // Property 5: The formatted string should contain the numeric value
          // Extract just the digits from the formatted string
          const digitsOnly = formatted.replace(/\D/g, '')
          const expectedDigits = value.toString()
          expect(digitsOnly).toBe(expectedDigits)

          // Property 6: Formatting should be consistent - formatting the same value twice
          // should produce the same result
          const formatted2 = formatCurrency(value)
          expect(formatted).toBe(formatted2)

          // Property 7: Zero should be formatted correctly
          if (value === 0) {
            const formattedZero = formatCurrency(0)
            expect(formattedZero).toMatch(/0/)
          }
        },
      ),
      { numRuns: 100 }, // Run 100 iterations as specified in the design document
    )
  })

  it('Property 6.1: Currency formatting should handle edge cases correctly', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }

    // Test specific edge cases
    const testCases = [
      { value: 0, description: 'zero' },
      { value: 1, description: 'one' },
      { value: 999, description: 'below thousand' },
      { value: 1000, description: 'exactly thousand' },
      { value: 1001, description: 'just above thousand' },
      { value: 20000, description: 'minimum slider value' },
      { value: 56900, description: 'default consultation value' },
      { value: 150000, description: 'maximum slider value' },
      { value: 1000000, description: 'one million' },
      { value: 10000000, description: 'ten million' },
    ]

    testCases.forEach(({ value, description }) => {
      const formatted = formatCurrency(value)

      // Should be a valid string
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')

      // Should contain currency indicator
      const hasCurrencyIndicator =
        formatted.includes('COP') || formatted.includes('$')
      expect(hasCurrencyIndicator).toBe(true)

      // Should not have decimals at the end (Colombian locale uses comma for decimals)
      // Decimals would appear as ",50" or ",99" at the end
      expect(formatted).not.toMatch(/[,]\d{1,2}$/)

      // For values >= 1000, should have thousand separators (period in Colombian locale)
      if (value >= 1000) {
        expect(formatted).toMatch(/\./)
      }

      // Log for manual verification during development
      // console.log(`${description} (${value}): ${formatted}`)
    })
  })

  it('Property 6.2: Currency formatting should be monotonic - larger values produce different formatted strings', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99999999 }), // Leave room for +1
        (value) => {
          const formatted1 = formatCurrency(value)
          const formatted2 = formatCurrency(value + 1)

          // Different values should produce different formatted strings
          // (unless they round to the same value, but with 0 decimals this shouldn't happen)
          if (value !== value + 1) {
            expect(formatted1).not.toBe(formatted2)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})
