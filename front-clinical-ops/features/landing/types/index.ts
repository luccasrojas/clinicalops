import { LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface ProblemCardData {
  icon: LucideIcon
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
}

export interface NavLink {
  href: string
  label: string
}

export interface ROICalculation {
  hoursSavedPerMonth: string
  hoursSavedPerDay: string
  consultsExtraPerMonth: number
  annualRevenue: number
  roiValue: string
}
