import { useEffect, useState } from 'react'
import { getJobsByProjectId } from '../services/jobsService'

export function useJobsForProject(projectId) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) {
      setJobs([])
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setError(null)
    getJobsByProjectId(projectId)
      .then((data) => { if (mounted) setJobs(data) })
      .catch((err) => { if (mounted) setError(err) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [projectId])

  return { jobs, loading, error }
}
