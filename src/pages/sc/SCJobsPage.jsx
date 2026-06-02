import { JobsManager } from '../gc/GCJobsPage'

// Subcontractor and General Contractor use identical job management UI
// scoped to the signed-in company profile. Reuse the manager so we
// only maintain one implementation.
export default function SCJobsPage() {
  return <JobsManager roleLabel="Subcontractor" />
}
