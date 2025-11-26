import {
  Layout,
  FileJson,
  Database,
  Brain,
  Network,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { Feature, ProblemCardData, NavLink } from '../types'

export const NAV_LINKS: NavLink[] = [
  { href: '#problema', label: 'El Problema' },
  { href: '#capacidad', label: 'Capacidades' },
  { href: '#impacto', label: 'Impacto & ROI' },
]

export const FEATURES: Feature[] = [
  {
    icon: Layout,
    title: 'Documentación Estructurada',
    description:
      'Redacta la nota SOAP automáticamente. No es solo voz a texto; comprende el contexto clínico y estructura la historia coherentemente.',
  },
  {
    icon: FileJson,
    title: 'Órdenes Integradas',
    description:
      'Genera automáticamente órdenes de medicamentos, laboratorios e imágenes desde la misma conversación. Detecta dosis y frecuencias.',
  },
  {
    icon: Database,
    title: 'Codificación Automática',
    description:
      'Traduce la narrativa médica a códigos estándar (CUPS, CIE-10, CUM) listos para auditoría y facturación, reduciendo glosas.',
  },
  {
    icon: Brain,
    title: 'Adaptabilidad de Estilo',
    description:
      'Aprende y replica la forma de documentar de cada especialista. No obliga al médico a cambiar su flujo mental ni narrativo.',
  },
  {
    icon: Network,
    title: 'Integración HIS/ERP',
    description:
      'Se conecta con su sistema actual (Epic, Cerner, SAP, etc.) sin cambiar la operación de fondo. Interoperabilidad real.',
  },
  {
    icon: ShieldCheck,
    title: 'Estandarización y Calidad',
    description:
      'Reduce la variabilidad entre médicos y servicios. Asegura que cada nota cumpla con los criterios de calidad y auditoría.',
  },
]

export const PROBLEM_CARDS: ProblemCardData[] = [
  {
    icon: Clock,
    title: '50% del Tiempo Perdido',
    description:
      'Médicos convertidos en transcriptores. La mitad de la jornada se pierde digitando historias en lugar de atender pacientes.',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
  },
  {
    icon: AlertTriangle,
    title: 'Glosas y Rechazos',
    description:
      'Errores de codificación manual (CIE-10) cuestan millones en devoluciones y reprocesos.',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
  },
  {
    icon: Brain,
    title: 'Burnout Médico',
    description:
      "La fatiga por 'pantalla' es la causa #1 de rotación de especialistas.",
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-cyan-500',
  },
]
