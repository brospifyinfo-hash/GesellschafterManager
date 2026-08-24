export type User = {
  code: string
  name: string
  password: string
  isAdmin: boolean
  color: 'devid' | 'dennis' | 'lukas' | 'david'
  isTimeAccount?: boolean
}

export type SplitPayment = {
  user_code: string
  amount: number
  percentage: number
}

export type Expense = {
  id: string
  created_at: string
  created_by: string
  description: string
  total_amount: number
  amount_per_person: number
  devid_paid: boolean
  dennis_paid: boolean
  lukas_paid: boolean
  david_paid: boolean
  receipt_url?: string
  receipt_filename?: string
  devid_payment_source?: string
  dennis_payment_source?: string
  lukas_payment_source?: string
  david_payment_source?: string
  is_favorite?: boolean
  category?: string
  tags?: string[]
  paid_to?: string
  split_payments?: SplitPayment[]
  payment_proofs?: Record<string, string> // user_code -> proof_url
  payment_type?: 'private' | 'company' // Privat oder Firmenkonto
  day_of_week?: string // Wochentag der Erstellung
  // Bearbeitungs-Markierung: wird gesetzt, sobald die Ausgabe nachträglich geändert wird
  edited_at?: string | null
  edited_by?: string | null
  edited_by_admin?: boolean | null
}

export type TimeEntry = {
  id: string
  user_code: string
  check_in: string
  check_out: string | null
  duration_minutes: number | null
  created_at: string
}

// Nachgetragene Zeit: entsteht nicht durch Ein-/Auschecken, sondern wird
// manuell eingetragen und deshalb überall als "Nachgetragen" markiert.
export type ManualTimeEntry = {
  id: string
  user_code: string
  hours: number
  added_by: string
  reason: string | null
  created_at: string
}

export type UserAccount = {
  user_code: string
  free_available: number
  company_account: number
  total_earned: number
  updated_at: string
}

export type Withdrawal = {
  id: string
  created_at: string
  user_code: string
  amount: number
  processed_by: string
  note: string | null
}

export type RevenueDistribution = {
  id: string
  created_at: string
  month: number
  year: number
  total_revenue: number
  tax_reserve: number
  distributable: number
  created_by: string
}

export type Subscription = {
  id: string
  created_at: string
  name: string
  description: string | null
  amount: number
  frequency: 'monthly' | 'yearly' | 'quarterly'
  start_date: string
  next_due_date: string
  receipt_url?: string
  receipt_filename?: string
  active: boolean
  created_by: string
}

export type ActivityLog = {
  id: string
  created_at: string
  user_code: string
  activity_type: string
  description: string
  admin_comment?: string
  metadata?: any
}

export type ExpenseComment = {
  id: string
  expense_id: string
  user_code: string
  comment: string
  created_at: string
}

export type ExpenseReaction = {
  id: string
  expense_id: string
  user_code: string
  emoji: string
  created_at: string
}

export type ExpenseReceipt = {
  id: string
  expense_id: string
  receipt_url: string
  receipt_filename: string
  uploaded_at: string
}

export type UserProfile = {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  payment_method?: string // Legacy - wird migriert
  paypal?: string // NEU: Pflichtfeld
  iban?: string // NEU: Pflichtfeld
  company_paypal?: string // Firmen-PayPal
  company_iban?: string // Firmen-IBAN
  updated_at: string
  created_at: string
}

export type Achievement = {
  id: string
  user_code: string
  achievement_type: string
  title: string
  description: string
  earned_at: string
  icon: string
  metadata?: any
}

export type Document = {
  id: string
  created_at: string
  uploaded_by: string
  title: string
  description?: string
  category: string
  file_url: string
  file_name: string
  file_size?: number
  tags?: string[]
  is_private: boolean
}

export type ExpenseReadStatus = {
  id: string
  expense_id: string
  user_code: string
  read_at: string
}

export type Department = {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export type UserDepartment = {
  id: string
  user_code: string
  department_id: string
  created_at: string
}

export type Decision = {
  id: string
  created_at: string
  created_by: string
  title: string
  description?: string
  departments: string[]
  votes_for: string[]
  votes_against: string[]
  final_percentage?: number
  status: 'pending' | 'approved' | 'rejected'
  objection_used_by?: string
  objection_date?: string
  ai_decision?: string
}

export type Return = {
  id: string
  created_at: string
  created_by: string
  order_number: string
  amount: number
  applied_to_revenue_id?: string
  status: 'pending' | 'applied'
}

export type TaxDeclaration = {
  id: string
  created_at: string
  created_by: string
  amount: number
  document_url: string
  document_name: string
  description?: string
}

export type ArchiveFolder = {
  id: string
  created_at: string
  name: string
  parent_id?: string
  color: string
  emoji: string
  created_by: string
}

export type UserStats = {
  totalPaid: number
  totalHours: number
  percentage: number
}
