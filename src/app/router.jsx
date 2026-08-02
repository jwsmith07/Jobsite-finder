import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'

import HomePageWrapper from '../pages/public/HomePageWrapper'
import JobsitesPage from '../pages/public/JobsitesPage'
import ProjectDetailPage from '../pages/public/ProjectDetailPage'
import UnderConstructionPage from '../pages/public/UnderConstructionPage'
import AboutPage from '../pages/public/AboutPage'
import PricingPage from '../pages/public/PricingPage'
import SignInPage from '../pages/public/SignInPage'
import SignUpPage from '../pages/public/SignUpPage'
import WorkerPublicProfilePage from '../pages/public/WorkerPublicProfilePage'
import CompanyPublicProfilePage from '../pages/public/CompanyPublicProfilePage'
import PrivacyPage from '../pages/public/PrivacyPage'
import TermsPage from '../pages/public/TermsPage'
import CookiePolicyPage from '../pages/public/CookiePolicyPage'
import RefundPolicyPage from '../pages/public/RefundPolicyPage'
import ContactPage from '../pages/public/ContactPage'
import FAQPage from '../pages/public/FAQPage'
import CommunityGuidelinesPage from '../pages/public/CommunityGuidelinesPage'
import SecurityPage from '../pages/public/SecurityPage'
import AccessibilityPage from '../pages/public/AccessibilityPage'
import SelectRolePage from '../pages/onboarding/SelectRolePage'

import WorkerDashboardPage from '../pages/worker/WorkerDashboardPage'
import WorkerProfilePage from '../pages/worker/WorkerProfilePage'
import ApplicationsPage from '../pages/worker/ApplicationsPage'
import SavedJobsPage from '../pages/worker/SavedJobsPage'

import GCCompanyPage from '../pages/gc/GCCompanyPage'
import GCDashboardPage from '../pages/gc/GCDashboardPage'
import GCJobsPage from '../pages/gc/GCJobsPage'
import GCApplicantsPage from '../pages/gc/GCApplicantsPage'
import GCMyJobsitesPage from '../pages/gc/GCMyJobsitesPage'
import GCProjectWorkspacePage from '../pages/gc/GCProjectWorkspacePage'
import GCSubcontractorsPage from '../pages/gc/GCSubcontractorsPage'

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
import AdminClaimsPage from '../pages/admin/AdminClaimsPage'
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage'
import AdminReportsPage from '../pages/admin/AdminReportsPage'
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
        { path: 'worker/:id', element: <Navigate to="/under-construction" replace /> },
        { path: 'companies/:id', element: <Navigate to="/under-construction" replace /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'pricing', element: <Navigate to="/under-construction" replace /> },
        { path: 'privacy', element: <PrivacyPage /> },
        { path: 'terms', element: <TermsPage /> },
        { path: 'cookies', element: <Navigate to="/under-construction" replace /> },
        { path: 'refund-policy', element: <Navigate to="/under-construction" replace /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'community-guidelines', element: <Navigate to="/under-construction" replace /> },
        { path: 'security', element: <Navigate to="/under-construction" replace /> },
        { path: 'accessibility', element: <Navigate to="/under-construction" replace /> },
        { path: 'maplibre-poc', element: <Navigate to="/under-construction" replace /> },
        { path: 'under-construction', element: <UnderConstructionPage /> },
        { path: 'login', element: <Navigate to="/signin" replace /> },
        { path: 'signin', element: <SignInPage /> },
        { path: 'signup', element: <SignUpPage /> },
        { path: 'onboarding/select-role', element: <SelectRolePage /> },

        { path: 'dashboard', element: <RoleRedirect /> },
        { path: 'notifications', element: <Navigate to="/under-construction" replace /> },
        { path: 'settings', element: <Navigate to="/under-construction" replace /> },

        { path: 'applications', element: <Navigate to="/worker/applications" replace /> },
        { path: 'saved-jobs', element: <Navigate to="/under-construction" replace /> },
        { path: 'worker', element: <Navigate to="/jobsites" replace /> },
        { path: 'worker/dashboard', element: <Navigate to="/jobsites" replace /> },
        { path: 'worker/profile', element: protect(['worker'], <WorkerProfilePage />) },
        { path: 'worker/applications', element: protect(['worker'], <ApplicationsPage />) },
        { path: 'worker/saved', element: <Navigate to="/under-construction" replace /> },

        { path: 'gc', element: <Navigate to="/gc/dashboard" replace /> },
        { path: 'gc/dashboard', element: protect(['gc'], <GCDashboardPage />) },
        { path: 'gc/jobsites', element: protect(['gc'], <GCMyJobsitesPage />) },
        { path: 'gc/jobsites/:projectId', element: protect(['gc'], <GCProjectWorkspacePage />) },
        { path: 'gc/company', element: protect(['gc'], <GCCompanyPage />) },
        { path: 'gc/jobs', element: protect(['gc'], <GCJobsPage />) },
        { path: 'gc/applicants', element: protect(['gc'], <GCApplicantsPage />) },
        { path: 'gc/project-photos', element: <Navigate to="/under-construction" replace /> },
        { path: 'gc/subcontractors', element: protect(['gc'], <GCSubcontractorsPage />) },
        { path: 'gc/jobsites/create', element: <Navigate to="/under-construction" replace /> },

        { path: 'sc', element: <Navigate to="/sc/dashboard" replace /> },
        { path: 'sc/dashboard', element: protect(['sc'], <SCDashboardPage />) },
        { path: 'subcontractor/dashboard', element: <Navigate to="/sc/dashboard" replace /> },
        { path: 'subcontractor/company', element: <Navigate to="/sc/company" replace /> },
        { path: 'subcontractor/jobs', element: <Navigate to="/sc/jobs" replace /> },
        { path: 'subcontractor/applicants', element: <Navigate to="/sc/applicants" replace /> },
        { path: 'subcontractor/*', element: <Navigate to="/under-construction" replace /> },
        { path: 'sc/company', element: protect(['sc'], <SCCompanyPage />) },
        { path: 'sc/jobs', element: protect(['sc'], <SCJobsPage />) },
        { path: 'sc/applicants', element: protect(['sc'], <SCApplicantsPage />) },
        { path: 'sc/*', element: <Navigate to="/under-construction" replace /> },

        { path: 'admin', element: <Navigate to="/admin/projects" replace /> },
        { path: 'admin/dashboard', element: <Navigate to="/under-construction" replace /> },
        { path: 'admin/home-preview', element: <Navigate to="/" replace /> },
        { path: 'admin/projects', element: protect(['admin'], <AdminProjectsPage />) },
        { path: 'admin/companies', element: protect(['admin'], <AdminCompaniesPage />) },
        { path: 'admin/job-postings', element: <Navigate to="/under-construction" replace /> },
        { path: 'admin/reports', element: <Navigate to="/under-construction" replace /> },
        { path: 'admin/jobsites', element: <Navigate to="/admin/projects" replace /> },
        { path: 'admin/claims', element: protect(['admin'], <AdminClaimsPage />) },
        { path: 'admin/users', element: protect(['admin'], <AdminUsersPage />) },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
