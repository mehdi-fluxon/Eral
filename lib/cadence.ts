export const CADENCE_OPTIONS = [
  { value: '1_DAY', label: '1 day', days: 1 },
  { value: '2_DAYS', label: '2 days', days: 2 },
  { value: '3_DAYS', label: '3 days', days: 3 },
  { value: '5_DAYS', label: '5 days', days: 5 },
  { value: '7_DAYS', label: '7 days (weekly)', days: 7 },
  { value: '2_WEEKS', label: '2 weeks', days: 14 },
  { value: '3_WEEKS', label: '3 weeks', days: 21 },
  { value: '1_MONTH', label: '1 month', days: 30 },
  { value: '2_MONTHS', label: '2 months', days: 60 },
  { value: '3_MONTHS', label: '3 months', days: 90 },
  { value: '6_MONTHS', label: '6 months', days: 180 },
  { value: '9_MONTHS', label: '9 months', days: 270 },
  { value: '12_MONTHS', label: '12 months (yearly)', days: 365 },
  { value: '18_MONTHS', label: '18 months', days: 548 },
  { value: '24_MONTHS', label: '24 months', days: 730 },
] as const

export type CadenceValue = typeof CADENCE_OPTIONS[number]['value']

export function getCadenceDays(cadence: string): number {
  const option = CADENCE_OPTIONS.find(opt => opt.value === cadence)
  return option?.days ?? 90
}

export function calculateNextReminderDate(lastTouchDate: Date, cadence: string): Date {
  const days = getCadenceDays(cadence)
  const nextDate = new Date(lastTouchDate)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export type ReminderStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'NO_REMINDER'

export function getReminderStatus(nextReminderDate: Date | null): ReminderStatus {
  if (!nextReminderDate) return 'NO_REMINDER'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const reminderDate = new Date(nextReminderDate)
  reminderDate.setHours(0, 0, 0, 0)
  
  if (reminderDate < today) return 'OVERDUE'
  if (reminderDate.getTime() === today.getTime()) return 'DUE_TODAY'
  return 'UPCOMING'
}

export function getReminderBadgeColor(status: ReminderStatus): string {
  switch (status) {
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    case 'DUE_TODAY':
      return 'bg-yellow-100 text-yellow-800'
    case 'UPCOMING':
      return 'bg-green-100 text-green-800'
    case 'NO_REMINDER':
      return 'bg-gray-100 text-gray-800'
  }
}

export function getReminderBadgeText(status: ReminderStatus): string {
  switch (status) {
    case 'OVERDUE':
      return 'Overdue'
    case 'DUE_TODAY':
      return 'Due Today'
    case 'UPCOMING':
      return 'Upcoming'
    case 'NO_REMINDER':
      return 'No Reminder'
  }
}