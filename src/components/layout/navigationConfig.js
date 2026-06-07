import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

const common = {
  home: { to: '/', label: 'Home', icon: Home },
  jobsitesMap: { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  notifications: { to: '/notifications', label: 'Notifications', icon: Bell },
  settings: { to: '/settings', label: 'Settings', icon: Settings },
}

export const roleMenus = {
  worker: [
    common.home,
    common.jobsitesMap,
    { to: '/worker/saved', label: 'Find Jobs', icon: BriefcaseBusiness },
    { to: '/worker/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/worker/profile', label: 'My Profile', icon: User },
    common.notifications,
    common.settings,
  ],
  sc: [
    common.home,
    common.jobsitesMap,
    { to: '/subcontractor/dashboard', label: 'My Jobsites', icon: Building2 },
    { to: '/subcontractor/jobs', label: 'Job Postings', icon: BriefcaseBusiness },
    { to: '/subcontractor/applicants', label: 'Applicants', icon: Users },
    { to: '/subcontractor/company', label: 'Company Profile', icon: User },
    common.notifications,
    common.settings,
  ],
  gc: [
    common.home,
    common.jobsitesMap,
    { to: '/gc/dashboard', label: 'My Jobsites', icon: Building2 },
    { to: '/gc/jobsites/create', label: 'Create Jobsite', icon: FileText },
    { to: '/gc/jobs', label: 'Job Postings', icon: BriefcaseBusiness },
    { to: '/gc/applicants', label: 'Applicants', icon: Users },
    { to: '/gc/subcontractors', label: 'Subcontractors', icon: ShieldCheck },
    { to: '/gc/company', label: 'Company Profile', icon: User },
    common.notifications,
    common.settings,
  ],
  admin: [
    common.home,
    common.jobsitesMap,
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/claims', label: 'Jobsite Claims', icon: ClipboardList },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/job-postings', label: 'Job Postings', icon: BriefcaseBusiness },
    { to: '/admin/projects', label: 'Project Management', icon: FileText },
    { to: '/admin/reports', label: 'Reports', icon: LayoutDashboard },
    common.notifications,
    common.settings,
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
  ],
}

export const publicMenu = [
  common.home,
  common.jobsitesMap,
  { to: '/about', label: 'About', icon: FileText },
  { to: '/pricing', label: 'Pricing', icon: BriefcaseBusiness },
]
