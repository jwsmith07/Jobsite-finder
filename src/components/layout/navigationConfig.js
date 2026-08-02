import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  Map,
  User,
  Users,
} from 'lucide-react'
import { launchFlags } from '../../config/launchMode'

const common = {
  jobsitesMap: { to: '/jobsites', label: 'Jobsites', icon: Map },
}

export const roleMenus = {
  worker: [
    common.jobsitesMap,
    { to: '/worker/applications', label: 'Applications', icon: ClipboardList },
    { to: '/worker/profile', label: 'Profile', icon: User },
  ],
  sc: launchFlags.SHOW_SUBCONTRACTOR_PORTAL ? [common.jobsitesMap] : [],
  gc: [
    { to: '/gc/jobsites', label: 'My Projects', icon: Building2 },
    { to: '/gc/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/gc/applicants', label: 'Applicants', icon: Users },
    { to: '/gc/company', label: 'Company', icon: User },
  ],
  admin: [
    common.jobsitesMap,
    { to: '/admin/projects', label: 'Projects', icon: FileText },
    { to: '/admin/claims', label: 'Claims', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
  ],
}

export const publicMenu = [
  common.jobsitesMap,
  { to: '/signin', label: 'Sign In', icon: User },
  { to: '/signup', label: 'Sign Up', icon: ClipboardList },
]
