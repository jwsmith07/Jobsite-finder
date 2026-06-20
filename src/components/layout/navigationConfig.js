import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  HardHat,
  Home,
  LayoutDashboard,
  Map,
  Settings,
  User,
  Users,
} from 'lucide-react'

const common = {
  home: { to: '/', label: 'Home', icon: Home },
  underConstruction: { to: '/under-construction', label: 'Under Construction', icon: HardHat },
  jobsitesMap: { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  settings: { to: '/settings', label: 'Settings', icon: Settings },
}

export const roleMenus = {
  worker: [
    common.underConstruction,
    common.jobsitesMap,
    { to: '/worker/applications', label: 'Applications', icon: ClipboardList },
    { to: '/saved-jobs', label: 'Saved Jobs', icon: BriefcaseBusiness },
    { to: '/worker/profile', label: 'Profile', icon: User },
    common.settings,
  ],
  sc: [
    common.underConstruction,
    common.jobsitesMap,
    { to: '/subcontractor/dashboard', label: 'Connected Projects', icon: Building2 },
    { to: '/subcontractor/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/subcontractor/applicants', label: 'Applicants', icon: Users },
    { to: '/subcontractor/company', label: 'Company Profile', icon: User },
    common.settings,
  ],
  gc: [
    common.underConstruction,
    common.jobsitesMap,
    { to: '/gc/jobsites', label: 'My Jobsites', icon: Building2 },
    { to: '/gc/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { to: '/gc/applicants', label: 'Applicants', icon: Users },
    { to: '/gc/company', label: 'Company Profile', icon: User },
    common.settings,
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    common.underConstruction,
    common.jobsitesMap,
    { to: '/admin/claims', label: 'Claims', icon: ClipboardList },
    { to: '/admin/projects', label: 'Projects', icon: FileText },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: LayoutDashboard },
    common.settings,
  ],
}

export const publicMenu = [
  common.home,
  common.underConstruction,
  common.jobsitesMap,
  { to: '/about', label: 'About', icon: FileText },
  { to: '/pricing', label: 'Pricing', icon: BriefcaseBusiness },
]
