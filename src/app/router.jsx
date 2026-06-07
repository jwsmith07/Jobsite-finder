import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'

import HomePageWrapper from '../pages/public/HomePageWrapper'
import JobsitesPage from '../pages/public/JobsitesPage'
import ProjectDetailPage from '../pages/public/ProjectDetailPage'
import AboutPage from '../pages/public/AboutPage'
import PricingPage from '../pages/public/PricingPage'
import SignInPage from '../pages/public/SignInPage'
import SignUpPage from '../pages/public/SignUpPage'
import UnderConstructionPage from '../pages/public/UnderConstructionPage'
import WorkerPublicProfilePage from '../pages/public/WorkerPublicProfilePage'
import SelectRolePage from '../pages/onboarding/SelectRolePage'

import WorkerDashboardPage from '../pages/worker/WorkerDashboardPage'
import WorkerProfilePage from '../pages/worker/WorkerProfilePage'
import ApplicationsPage from '../pages/worker/ApplicationsPage'
import SavedJobsPage from '../pages/worker/SavedJobsPage'

import GCDashboardPage from '../pages/gc/GCDashboardPage'
import GCCompanyPage from '../pages/gc/GCCompanyPage'
import GCJobsPage from '../pages/gc/GCJobsPage'
import GCApplicantsPage from '../pages/gc/GCApplicantsPage'

import SCDashboardPage from '../pages/sc/SCDashboardPage'
import SCCompanyPage from '../pages/sc/SCCompanyPage'
import SCJobsPage from '../pages/sc/SCJobsPage'
import SCApplicantsPage from '../pages/sc/SCApplicantsPage'
import CreateJobsitePage from '../pages/contractor/CreateJobsitePage'
import NotificationsPage from '../pages/account/NotificationsPage'
import SettingsPage from '../pages/account/SettingsPage'

import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminProjectsPage from '../pages/admin/AdminProjectsPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminJobsitesPage from '../pages/admin/AdminJobsitesPage'
import AdminClaimsPage from '../pages/admin/AdminClaimsPage'
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage'
import AdminJobPostingsPage from '../pages/admin/AdminJobPostingsPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
import GCSubcontractorsPage from '../pages/gc/GCSubcontractorsPage'
import NotFound from '../pages/not-found'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import RoleRedirect from '../components/auth/RoleRedirect'

const protect = (roles, element) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
)

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePageWrapper /> },
        { path: 'jobsites', element: <JobsitesPage /> },
        { path: 'projects/:id', element: <ProjectDetailPage /> },
        { path: 'worker/:id', element: <WorkerPublicProfilePage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'under-construction', element: <UnderConstructionPage /> },
        { path: 'login', element: <SignInPage /> },
        { path: 'signin', element: <SignInPage /> },
        { path: 'signup', element: <SignUpPage /> },
        { path: 'onboarding/select-role', element: <SelectRolePage /> },

        { path: 'dashboard', element: <RoleRedirect /> },
        { path: 'notifications', element: protect(['worker', 'sc', 'gc', 'admin'], <NotificationsPage />) },
        { path: 'settings', element: protect(['worker', 'sc', 'gc', 'admin'], <SettingsPage />) },

        { path: 'worker', element: protect(['worker'], <WorkerDashboardPage />) },
        { path: 'worker/dashboard', element: protect(['worker'], <WorkerDashboardPage />) },
        { path: 'worker/profile', element: protect(['worker'], <WorkerProfilePage />) },
        { path: 'worker/applications', element: protect(['worker'], <ApplicationsPage />) },
        { path: 'worker/saved', element: protect(['worker'], <SavedJobsPage />) },

        { path: 'gc', element: protect(['gc'], <GCDashboardPage />) },
        { path: 'gc/dashboard', element: protect(['gc'], <GCDashboardPage />) },
        { path: 'gc/company', element: protect(['gc'], <GCCompanyPage />) },
        { path: 'gc/jobs', element: protect(['gc'], <GCJobsPage />) },
        { path: 'gc/applicants', element: protect(['gc'], <GCApplicantsPage />) },
        { path: 'gc/subcontractors', element: protect(['gc'], <GCSubcontractorsPage />) },
        { path: 'gc/jobsites/create', element: protect(['gc'], <CreateJobsitePage />) },

        { path: 'sc', element: protect(['sc'], <SCDashboardPage />) },
        { path: 'sc/dashboard', element: protect(['sc'], <SCDashboardPage />) },
        { path: 'subcontractor/dashboard', element: protect(['sc'], <SCDashboardPage />) },
        { path: 'subcontractor/company', element: protect(['sc'], <SCCompanyPage />) },
        { path: 'subcontractor/jobs', element: protect(['sc'], <SCJobsPage />) },
        { path: 'subcontractor/applicants', element: protect(['sc'], <SCApplicantsPage />) },
        { path: 'subcontractor/jobsites/create', element: protect(['sc'], <CreateJobsitePage />) },
        { path: 'sc/company', element: protect(['sc'], <SCCompanyPage />) },
        { path: 'sc/jobs', element: protect(['sc'], <SCJobsPage />) },
        { path: 'sc/applicants', element: protect(['sc'], <SCApplicantsPage />) },
        { path: 'sc/jobsites/create', element: protect(['sc'], <CreateJobsitePage />) },

        { path: 'admin', element: protect(['admin'], <AdminDashboardPage />) },
        { path: 'admin/dashboard', element: protect(['admin'], <AdminDashboardPage />) },
        { path: 'admin/home-preview', element: <Navigate to="/" replace /> },
        { path: 'admin/projects', element: protect(['admin'], <AdminProjectsPage />) },
        { path: 'admin/companies', element: protect(['admin'], <AdminCompaniesPage />) },
        { path: 'admin/job-postings', element: protect(['admin'], <AdminJobPostingsPage />) },
        { path: 'admin/reports', element: protect(['admin'], <AdminReportsPage />) },
        { path: 'admin/jobsites', element: protect(['admin'], <AdminJobsitesPage />) },
        { path: 'admin/claims', element: protect(['admin'], <AdminClaimsPage />) },
        { path: 'admin/users', element: protect(['admin'], <AdminUsersPage />) },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
