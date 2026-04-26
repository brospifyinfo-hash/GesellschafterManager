import { Expense, TimeEntry, ManualTimeEntry, UserStats } from '@/types'
import { USER_CODES, UserCode } from '@/constants/users'

// Hourly rate: 0.25 hours (15 minutes) = 2€ investment value
// Therefore: 1 hour = 8€
const RATE_PER_QUARTER_HOUR = 2
const HOURLY_RATE = RATE_PER_QUARTER_HOUR * 4 // 8€ per hour

export function calculateUserStats(
  expenses: Expense[],
  timeEntries: TimeEntry[],
  manualEntries: ManualTimeEntry[]
): Record<UserCode, UserStats> {
  const stats: Record<UserCode, UserStats> = {
    DK: { totalPaid: 0, totalHours: 0, percentage: 0 },
    LS: { totalPaid: 0, totalHours: 0, percentage: 0 },
    DF: { totalPaid: 0, totalHours: 0, percentage: 0 },
    EM: { totalPaid: 0, totalHours: 0, percentage: 0 },
  }

  // Filter out time account (ZEIT) from time entries
  const filteredTimeEntries = timeEntries.filter((entry) => entry.user_code !== 'ZEIT')
  const filteredManualEntries = manualEntries.filter((entry) => entry.user_code !== 'ZEIT')

  // Calculate total invested for each user
  // Investment is split equally among all checked users
  expenses.forEach((expense) => {
    // Count how many users have paid
    const paidCount = [
      expense.devid_paid,
      expense.dennis_paid,
      expense.lukas_paid,
      expense.david_paid
    ].filter(Boolean).length

    if (paidCount === 0) return // No one paid yet

    // Split the total amount among those who paid
    const amountPerPayer = expense.total_amount / paidCount

    if (expense.devid_paid) stats.DK.totalPaid += amountPerPayer
    if (expense.dennis_paid) stats.DF.totalPaid += amountPerPayer
    if (expense.lukas_paid) stats.LS.totalPaid += amountPerPayer
    if (expense.david_paid) stats.EM.totalPaid += amountPerPayer
  })

  // Calculate total hours from time entries (excluding ZEIT account)
  filteredTimeEntries.forEach((entry) => {
    if (entry.duration_minutes && USER_CODES.includes(entry.user_code as UserCode)) {
      stats[entry.user_code as UserCode].totalHours += entry.duration_minutes / 60
    }
  })

  // Add manual time entries (excluding ZEIT account)
  filteredManualEntries.forEach((entry) => {
    if (USER_CODES.includes(entry.user_code as UserCode)) {
      stats[entry.user_code as UserCode].totalHours += entry.hours
    }
  })

  // Calculate percentages based on combined value (money + time converted to money)
  // 1 hour = 50€, 0.5 hours = 25€, 0.25 hours = 12.50€
  const totalInvestment = USER_CODES.reduce((sum, code) => {
    const moneyValue = stats[code].totalPaid
    const timeValue = stats[code].totalHours * HOURLY_RATE
    return sum + moneyValue + timeValue
  }, 0)

  // Calculate each user's percentage
  USER_CODES.forEach((code) => {
    const moneyValue = stats[code].totalPaid
    const timeValue = stats[code].totalHours * HOURLY_RATE
    const userTotalValue = moneyValue + timeValue
    
    stats[code].percentage = totalInvestment > 0 
      ? (userTotalValue / totalInvestment) * 100 
      : 0
  })

  return stats
}

export function getTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.total_amount, 0)
}

export function getOutstandingAmount(expenses: Expense[], userCode: UserCode): number {
  const userField = getUserPaymentField(userCode)
  return expenses
    .filter((expense) => !expense[userField])
    .reduce((sum, expense) => sum + expense.amount_per_person, 0)
}

function getUserPaymentField(userCode: UserCode): keyof Expense {
  const fieldMap: Record<UserCode, keyof Expense> = {
    DK: 'devid_paid',
    LS: 'lukas_paid',
    DF: 'dennis_paid',
    EM: 'david_paid',
  }
  return fieldMap[userCode]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateSharePercentages(
  accounts: Array<{ user_code: string; total_earned: number }>,
  totalHours: Array<{ user_code: string; hours: number }>
): Array<{ user_code: string; share_percentage: number }> {
  // Calculate total investment value (money + time converted to money)
  const totalInvestment = USER_CODES.reduce((sum, code) => {
    const account = accounts.find(a => a.user_code === code)
    const time = totalHours.find(t => t.user_code === code)
    
    const moneyValue = account?.total_earned || 0
    const timeValue = (time?.hours || 0) * HOURLY_RATE
    
    return sum + moneyValue + timeValue
  }, 0)

  // Calculate each user's share percentage
  return USER_CODES.map(code => {
    const account = accounts.find(a => a.user_code === code)
    const time = totalHours.find(t => t.user_code === code)
    
    const moneyValue = account?.total_earned || 0
    const timeValue = (time?.hours || 0) * HOURLY_RATE
    const userTotalValue = moneyValue + timeValue
    
    const share_percentage = totalInvestment > 0 
      ? (userTotalValue / totalInvestment) * 100 
      : 0
    
    return {
      user_code: code,
      share_percentage
    }
  })
}
