import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import { useAuth } from './useAuth'
import { createClaim } from '../services/claimsService'

/**
 * Custom hook for contractors (General Contractor/Subcontractor) to claim projects
 * Handles duplicate prevention, auth integration, and user notifications
 *
 * @returns {Object} { claim, loading, error, claimProject }
 *   - claim: The created claim object (or null)
 *   - loading: Boolean indicating if claim operation is in progress
 *   - error: Error message (if any)
 *   - claimProject: Async function to claim a project by ID
 */
export function useClaimProject() {
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const claimProject = useCallback(
    async (projectId) => {
      // Clear previous state
      setError(null)
      setClaim(null)

      // Validate user is authenticated
      if (!user) {
        const errorMsg = 'You must be logged in to claim a project'
        setError(errorMsg)
        toast({
          title: 'Authentication Required',
          description: errorMsg,
          variant: 'destructive',
        })
        return
      }

      // Validate projectId
      if (!projectId) {
        const errorMsg = 'Project ID is required'
        setError(errorMsg)
        toast({
          title: 'Invalid Project',
          description: errorMsg,
          variant: 'destructive',
        })
        return
      }

      setLoading(true)

      try {
        const claimData = await createClaim(user.id, projectId)
        setClaim(claimData)
        toast({
          title: 'Project Claimed',
          description: 'Your claim has been submitted successfully. An admin will review it shortly.',
        })
      } catch (err) {
        const errorMsg = err.message || 'Failed to claim project'

        // Handle duplicate claim error
        if (errorMsg.includes('already exists')) {
          setError('Already claimed')
          toast({
            title: 'Already Claimed',
            description: 'This project has already been claimed by your company.',
            variant: 'destructive',
          })
        } else if (errorMsg.includes('company profile')) {
          setError('Company profile required')
          toast({
            title: 'Company Profile Required',
            description: errorMsg,
            variant: 'destructive',
          })
        } else {
          setError(errorMsg)
          toast({
            title: 'Claim Failed',
            description: errorMsg,
            variant: 'destructive',
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [user, toast]
  )

  return {
    claim,
    loading,
    error,
    claimProject,
  }
}
