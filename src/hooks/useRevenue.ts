import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RevenueDistribution } from '@/types'
import { toast } from 'sonner'
import { useExpenses } from './useExpenses'
import { useTimeEntries } from './useTimeEntries'
import { useReturns } from './useReturns'
import { calculateUserStats } from '@/lib/calculations'
import { USER_CODES, UserCode } from '@/constants/users'

export function useRevenue() {
  const queryClient = useQueryClient()

  const { data: distributions = [], isLoading, error } = useQuery({
    queryKey: ['revenue-distributions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('revenue_distributions')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false })

        if (error) {
          console.error('Error fetching revenue distributions:', error)
          return []
        }
        return (data || []) as RevenueDistribution[]
      } catch (err) {
        console.error('Revenue query error:', err)
        return []
      }
    },
    retry: 1,
  })

  const addRevenue = useMutation({
    mutationFn: async ({
      month,
      year,
      totalRevenue,
      createdBy,
      expenses,
      timeEntries,
      manualEntries,
      pendingReturns = 0,
    }: {
      month: number
      year: number
      totalRevenue: number
      createdBy: string
      expenses: any[]
      timeEntries: any[]
      manualEntries: any[]
      pendingReturns?: number
    }) => {
      // Subtract pending returns from total revenue
      const adjustedRevenue = totalRevenue - pendingReturns
      const taxReserve = adjustedRevenue * 0.55
      const distributable = adjustedRevenue * 0.45

      const { data, error } = await supabase
        .from('revenue_distributions')
        .insert({
          month,
          year,
          total_revenue: adjustedRevenue,
          tax_reserve: taxReserve,
          distributable: distributable,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) throw error

      // Apply all pending returns to this revenue
      if (pendingReturns > 0) {
        const { data: returns } = await supabase
          .from('returns')
          .select('*')
          .eq('status', 'pending')
        
        if (returns && returns.length > 0) {
          for (const ret of returns) {
            await supabase
              .from('returns')
              .update({
                status: 'applied',
                applied_to_revenue_id: data.id,
              })
              .eq('id', ret.id)
          }
        }
      }

      // Calculate user percentages based on contributions
      const stats = calculateUserStats(expenses, timeEntries, manualEntries)
      
      console.log('=== Umsatzverteilung Debug ===')
      console.log('Original Revenue:', totalRevenue)
      console.log('Pending Returns:', pendingReturns)
      console.log('Adjusted Revenue:', adjustedRevenue)
      console.log('Tax Reserve (55%):', taxReserve)
      console.log('Distributable (45%):', distributable)
      console.log('User Stats:', stats)

      // Distribute the 45% to user accounts based on percentage
      for (const userCode of USER_CODES) {
        const userPercentage = stats[userCode].percentage
        const userShare = distributable * (userPercentage / 100)
        
        // Split into 20% free available and 80% company account
        const freeAvailable = userShare * 0.2
        const companyAccount = userShare * 0.8
        
        console.log(`\n${userCode}:`)
        console.log('  Percentage:', userPercentage.toFixed(2) + '%')
        console.log('  Share of 45%:', userShare.toFixed(2))
        console.log('  Free Available (20%):', freeAvailable.toFixed(2))
        console.log('  Company Account (80%):', companyAccount.toFixed(2))

        // Get or create account
        const { data: currentAccount, error: fetchError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('user_code', userCode)
          .maybeSingle()

        if (fetchError) {
          console.error('Error fetching account:', fetchError)
          continue
        }

        if (currentAccount) {
          // Update existing account by adding the new amounts
          const newFreeAvailable = Number(currentAccount.free_available) + Number(freeAvailable)
          const newCompanyAccount = Number(currentAccount.company_account) + Number(companyAccount)
          const newTotalEarned = Number(currentAccount.total_earned) + Number(userShare)
          
          console.log('  Updating account - Old:', {
            free: currentAccount.free_available,
            company: currentAccount.company_account,
            total: currentAccount.total_earned
          })
          console.log('  New:', {
            free: newFreeAvailable,
            company: newCompanyAccount,
            total: newTotalEarned
          })
          
          const { error: updateError } = await supabase
            .from('user_accounts')
            .update({
              free_available: newFreeAvailable,
              company_account: newCompanyAccount,
              total_earned: newTotalEarned,
              updated_at: new Date().toISOString(),
            })
            .eq('user_code', userCode)

          if (updateError) {
            console.error('Error updating account:', updateError)
          } else {
            console.log('  ✓ Account updated successfully')
          }
        } else {
          // Create new account if it doesn't exist
          console.log('  Creating new account...')
          const { error: insertError } = await supabase
            .from('user_accounts')
            .insert({
              user_code: userCode,
              free_available: freeAvailable,
              company_account: companyAccount,
              total_earned: userShare,
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error creating account:', insertError)
          } else {
            console.log('  ✓ Account created successfully')
          }
        }

        // Log distribution for each user
        await supabase.from('activity_log').insert({
          user_code: userCode,
          activity_type: 'revenue_distributed',
          description: `Umsatzverteilung ${month}/${year}: ${userShare.toFixed(2)}€ (${userPercentage.toFixed(1)}%) → Frei: ${freeAvailable.toFixed(2)}€, Firma: ${companyAccount.toFixed(2)}€`,
          metadata: { 
            month, 
            year, 
            share: userShare,
            free_available: freeAvailable,
            company_account: companyAccount,
            percentage: userPercentage 
          },
        })
      }

      // Create notification for ALL users about revenue distribution
      const users = ['DK', 'LS', 'DF', 'DM']
      for (const userCode of users) {
        const userPercentage = stats[userCode].percentage
        const userShare = distributable * (userPercentage / 100)
        
        await supabase.from('notifications').insert({
          user_code: userCode,
          notification_type: 'revenue_added',
          title: '💰 Neuer Umsatz verteilt',
          message: `Umsatz für ${month}/${year}: ${adjustedRevenue.toFixed(2)}€ eingetragen${pendingReturns > 0 ? ` (${pendingReturns.toFixed(2)}€ Retouren abgezogen)` : ''}. Ihr Anteil: ${userShare.toFixed(2)}€ (${userPercentage.toFixed(1)}%)`,
          metadata: { month, year, total_revenue: adjustedRevenue, returns_deducted: pendingReturns, user_share: userShare, percentage: userPercentage },
        })
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: createdBy,
        activity_type: 'revenue_added',
        description: `Umsatz für ${month}/${year} eingetragen: ${adjustedRevenue.toFixed(2)}€${pendingReturns > 0 ? ` (${pendingReturns.toFixed(2)}€ Retouren abgezogen)` : ''}`,
        metadata: { month, year, total_revenue: adjustedRevenue, returns_deducted: pendingReturns },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-distributions'] })
      toast.success('Umsatz erfolgreich eingetragen')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Eintragen des Umsatzes')
    },
  })

  const updateRevenue = useMutation({
    mutationFn: async ({
      id,
      totalRevenue,
      updatedBy,
      expenses,
      timeEntries,
      manualEntries,
    }: {
      id: string
      totalRevenue: number
      updatedBy: string
      expenses: any[]
      timeEntries: any[]
      manualEntries: any[]
    }) => {
      // Get the original distribution
      const { data: originalDist, error: fetchError } = await supabase
        .from('revenue_distributions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const oldDistributable = originalDist.distributable
      const newTaxReserve = totalRevenue * 0.55
      const newDistributable = totalRevenue * 0.45
      
      // Calculate the difference
      const distributionDiff = newDistributable - oldDistributable

      console.log('=== Umsatz bearbeiten ===');
      console.log('Original distributable:', oldDistributable);
      console.log('New distributable:', newDistributable);
      console.log('Difference:', distributionDiff);

      // Update the revenue distribution
      const { data, error } = await supabase
        .from('revenue_distributions')
        .update({
          total_revenue: totalRevenue,
          tax_reserve: newTaxReserve,
          distributable: newDistributable,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Calculate user percentages AT THE TIME OF ORIGINAL CREATION
      // Use stats from that period (month/year)
      const stats = calculateUserStats(expenses, timeEntries, manualEntries)
      
      // Adjust accounts based on the difference
      for (const userCode of USER_CODES) {
        const userPercentage = stats[userCode].percentage
        const userShareDiff = distributionDiff * (userPercentage / 100)
        
        // Split into 20% free available and 80% company account
        const freeAvailableDiff = userShareDiff * 0.2
        const companyAccountDiff = userShareDiff * 0.8
        
        console.log(`\n${userCode}:`);
        console.log('  Percentage:', userPercentage.toFixed(2) + '%');
        console.log('  Share Diff:', userShareDiff.toFixed(2));
        console.log('  Free Diff:', freeAvailableDiff.toFixed(2));
        console.log('  Company Diff:', companyAccountDiff.toFixed(2));

        // Get current account
        const { data: currentAccount, error: fetchError } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('user_code', userCode)
          .maybeSingle()

        if (fetchError) {
          console.error('Error fetching account:', fetchError)
          continue
        }

        if (currentAccount) {
          // Update existing account by applying the difference
          const newFreeAvailable = Number(currentAccount.free_available) + Number(freeAvailableDiff)
          const newCompanyAccount = Number(currentAccount.company_account) + Number(companyAccountDiff)
          const newTotalEarned = Number(currentAccount.total_earned) + Number(userShareDiff)
          
          console.log('  Old values:', {
            free: currentAccount.free_available,
            company: currentAccount.company_account,
            total: currentAccount.total_earned
          });
          console.log('  New values:', {
            free: newFreeAvailable,
            company: newCompanyAccount,
            total: newTotalEarned
          });
          
          const { error: updateError } = await supabase
            .from('user_accounts')
            .update({
              free_available: newFreeAvailable,
              company_account: newCompanyAccount,
              total_earned: newTotalEarned,
              updated_at: new Date().toISOString(),
            })
            .eq('user_code', userCode)

          if (updateError) {
            console.error('Error updating account:', updateError)
          } else {
            console.log('  ✓ Account updated successfully')
          }
        }

        // Log adjustment for each user
        await supabase.from('activity_log').insert({
          user_code: userCode,
          activity_type: 'revenue_adjustment',
          description: `Umsatz angepasst: ${userShareDiff > 0 ? '+' : ''}${userShareDiff.toFixed(2)}€ (${userPercentage.toFixed(1)}%)`,
          metadata: { 
            revenue_id: id, 
            adjustment: userShareDiff,
            percentage: userPercentage 
          },
        })
      }

      // Create notification for ALL users about revenue distribution
      const users = ['DK', 'LS', 'DF', 'DM']
      for (const userCode of users) {
        await supabase.from('notifications').insert({
          user_code: userCode,
          notification_type: 'revenue_added',
          title: '💰 Neuer Umsatz',
          message: `Umsatz für ${month}/${year} wurde eingetragen: ${adjustedRevenue.toFixed(2)}€${pendingReturns > 0 ? ` (${pendingReturns.toFixed(2)}€ Retouren abgezogen)` : ''}`,
          metadata: { month, year, total_revenue: adjustedRevenue, returns_deducted: pendingReturns },
        })
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: updatedBy,
        activity_type: 'revenue_updated',
        description: `Umsatz bearbeitet: ${totalRevenue.toFixed(2)}€ (Anpassung: ${distributionDiff > 0 ? '+' : ''}${distributionDiff.toFixed(2)}€)`,
        metadata: { revenue_id: id, total_revenue: totalRevenue, adjustment: distributionDiff },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
      toast.success('Umsatz und Konten erfolgreich angepasst!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Aktualisieren des Umsatzes')
    },
  })

  const deleteRevenue = useMutation({
    mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
      console.log('Deleting revenue distribution:', id)
      
      const { data, error } = await supabase
        .from('revenue_distributions')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
      console.log('Delete successful:', data)

      // Create notification for ALL users about revenue distribution
      const users = ['DK', 'LS', 'DF', 'DM']
      for (const userCode of users) {
        await supabase.from('notifications').insert({
          user_code: userCode,
          notification_type: 'revenue_added',
          title: '💰 Neuer Umsatz',
          message: `Umsatz für ${month}/${year} wurde eingetragen: ${adjustedRevenue.toFixed(2)}€${pendingReturns > 0 ? ` (${pendingReturns.toFixed(2)}€ Retouren abgezogen)` : ''}`,
          metadata: { month, year, total_revenue: adjustedRevenue, returns_deducted: pendingReturns },
        })
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: deletedBy,
        activity_type: 'revenue_deleted',
        description: 'Umsatzverteilung gelöscht',
        metadata: { revenue_id: id },
      })
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-distributions'] })
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
      toast.success('Umsatz wurde gelöscht')
      
      setTimeout(() => {
        window.location.reload()
      }, 500)
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error)
      toast.error(error.message || 'Fehler beim Löschen des Umsatzes')
    },
  })

  return {
    distributions,
    isLoading,
    addRevenue: addRevenue.mutate,
    updateRevenue: updateRevenue.mutate,
    deleteRevenue: deleteRevenue.mutate,
  }
}
