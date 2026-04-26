import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useDarkModeSync } from '@/hooks/useDashboardSettings'
import { useProfile } from '@/hooks/useProfile'
import { LoginForm } from '@/components/auth/LoginForm'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'
import { DashboardSettings } from '@/components/dashboard/DashboardSettings'
import { HomePage } from '@/components/home/HomePage'
import { ExpensesPage } from '@/components/expenses/ExpensesPage'
import { TimePage } from '@/components/time/TimePage'
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage'
import { ExportPage } from '@/components/export/ExportPage'
import { TimeAccountPage } from '@/components/time/TimeAccountPage'
import { RevenuePage } from '@/components/revenue/RevenuePage'
import { SubscriptionsPage } from '@/components/subscriptions/SubscriptionsPage'
import { AccountsPage } from '@/components/accounts/AccountsPage'
import { ActivityLogPage } from '@/components/activity/ActivityLogPage'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { OnlineStatusPage } from '@/components/online/OnlineStatusPage'
import { LeaderboardPage } from '@/components/leaderboard/LeaderboardPage'

import { InboxPage } from '@/components/inbox/InboxPage'
import { ReturnsPage } from '@/components/returns/ReturnsPage'
import { TaxDeclarationsPage } from '@/components/tax/TaxDeclarationsPage'
import { GhostModeExitButton } from '@/components/admin/GhostModeExitButton'
import { PaymentMethodRequiredDialog } from '@/components/profile/PaymentMethodRequiredDialog'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient()

function AppContent() {
  const { user } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(user?.code || '')
  const [currentPage, setCurrentPage] = useState('home')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false)
  
  // Sync dark mode on mount
  useDarkModeSync()

  // Check if both payment methods are set
  useEffect(() => {
    if (user && !user.isTimeAccount && profile && !profileLoading) {
      const hasPayPal = !!profile.paypal?.trim()
      const hasIBAN = !!profile.iban?.trim()
      
      if (!hasPayPal || !hasIBAN) {
        setShowPaymentMethodDialog(true)
      }
    }
  }, [user, profile, profileLoading])

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Safe user check with loading
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Time account has special UI
  if (user.isTimeAccount) {
    return <TimeAccountPage />
  }

  // Mobile layout with custom dashboard
  if (isMobile && currentPage === 'home') {
    return (
      <>
        <MobileDashboard 
          onNavigate={setCurrentPage}
        />
        <MobileBottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </>
    )
  }

  // Desktop layout or mobile sub-pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <Header />
      {!isMobile && <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />}
      
      <main className={`container mx-auto px-4 ${isMobile ? 'pb-20 pt-4' : 'py-8'}`}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'expenses' && <ExpensesPage onNavigate={setCurrentPage} />}
        {currentPage === 'time' && <TimePage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
        {currentPage === 'export' && <ExportPage />}
        {currentPage === 'revenue' && <RevenuePage />}
        {currentPage === 'accounts' && <AccountsPage />}
        {currentPage === 'subscriptions' && <SubscriptionsPage />}
        {currentPage === 'online' && <OnlineStatusPage />}
        {currentPage === 'activity' && <ActivityLogPage />}

        {currentPage === 'leaderboard' && <LeaderboardPage />}
        {currentPage === 'inbox' && <InboxPage />}
        {currentPage === 'returns' && <ReturnsPage />}
        {currentPage === 'tax' && <TaxDeclarationsPage />}
        {currentPage === 'profile' && <ProfilePage />}
      </main>

      {isMobile && <MobileBottomNav currentPage={currentPage} onPageChange={setCurrentPage} />}
      
      {/* Payment Method Required Dialog */}
      {user && !user.isTimeAccount && (
        <PaymentMethodRequiredDialog
          open={showPaymentMethodDialog}
          userCode={user.code}
          onComplete={() => setShowPaymentMethodDialog(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <GhostModeExitButton />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}
