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
import GCJobsPage from '../pages/gc/GCJobsPage'
import GCApplicantsPage from '../pages/gc/GCApplicantsPage'
import GCMyJobsitesPage from '../pages/gc/GCMyJobsitesPage'
import GCProjectWorkspacePage from '../pages/gc/GCProjectWorkspacePage'

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
        { path: 'worker/:id', element: <WorkerPublicProfilePage /> },
        { path: 'companies/:id', element: <CompanyPublicProfilePage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'privacy', element: <PrivacyPage /> },
        { path: 'terms', element: <TermsPage /> },
        { path: 'cookies', element: <CookiePolicyPage /> },
        { path: 'refund-policy', element: <RefundPolicyPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'community-guidelines', element: <CommunityGuidelinesPage /> },
        { path: 'security', element: <SecurityPage /> },
        { path: 'accessibility', element: <AccessibilityPage /> },
        { path: 'maplibre-poc', element: <Navigate to="/jobsites" replace /> },
        { path: 'under-construction', element: <UnderConstructionPage /> },
        { path: 'login', element: <Navigate to="/signin" replace /> },
        { path: 'signin', element: <SignInPage /> },
        { path: 'signup', element: <SignUpPage /> },
        { path: 'onboarding/select-role', element: <SelectRolePage /> },

        { path: 'dashboard', element: <RoleRedirect /> },
        { path: 'notifications', element: protect(['worker', 'sc', 'gc', 'admin'], <NotificationsPage />) },
        { path: 'settings', element: protect(['worker', 'sc', 'gc', 'admin'], <SettingsPage />) },

        { path: 'applications', element: <Navigate to="/worker/applications" replace /> },
        { path: 'saved-jobs', element: protect(['worker'], <SavedJobsPage />) },
        { path: 'worker', element: <Navigate to="/worker/dashboard" replace /> },
        { path: 'worker/dashboard', element: protect(['worker'], <WorkerDashboardPage />) },
        { path: 'worker/profile', element: protect(['worker'], <WorkerProfilePage />) },
        { path: 'worker/applications', element: protect(['worker'], <ApplicationsPage />) },
        { path: 'worker/saved', element: <Navigate to="/saved-jobs" replace /> },

        { path: 'gc', element: <Navigate to="/gc/jobsites" replace /> },
        { path: 'gc/dashboard', element: <Navigate to="/gc/jobsites" replace /> },
        { path: 'gc/jobsites', element: protect(['gc'], <GCMyJobsitesPage />) },
        { path: 'gc/jobsites/:projectId', element: protect(['gc'], <GCProjectWorkspacePage />) },
        { path: 'gc/company', element: protect(['gc'], <GCCompanyPage />) },
        { path: 'gc/jobs', element: protect(['gc'], <GCJobsPage />) },
        { path: 'gc/applicants', element: protect(['gc'], <GCApplicantsPage />) },
        { path: 'gc/project-photos', element: <Navigate to="/gc/jobsites" replace /> },
        { path: 'gc/subcontractors', element: <Navigate to="/gc/jobsites" replace /> },
        { path: 'gc/jobsites/create', element: protect(['gc'], <CreateJobsitePage />) },

        { path: 'sc', element: <Navigate to="/subcontractor/dashboard" replace /> },
        { path: 'sc/dashboard', element: <Navigate to="/subcontractor/dashboard" replace /> },
        { path: 'subcontractor/dashboard', element: protect(['sc'], <SCDashboardPage />) },
        { path: 'subcontractor/company', element: protect(['sc'], <SCCompanyPage />) },
        { path: 'subcontractor/jobs', element: protect(['sc'], <SCJobsPage />) },
        { path: 'subcontractor/applicants', element: protect(['sc'], <SCApplicantsPage />) },
        { path: 'sc/company', element: <Navigate to="/subcontractor/company" replace /> },
        { path: 'sc/jobs', element: <Navigate to="/subcontractor/jobs" replace /> },
        { path: 'sc/applicants', element: <Navigate to="/subcontractor/applicants" replace /> },

        { path: 'admin', element: <Navigate to="/admin/dashboard" replace /> },
        { path: 'admin/dashboard', element: protect(['admin'], <AdminDashboardPage />) },
        { path: 'admin/home-preview', element: <Navigate to="/" replace /> },
        { path: 'admin/projects', element: protect(['admin'], <AdminProjectsPage />) },
        { path: 'admin/companies', element: protect(['admin'], <AdminCompaniesPage />) },
        { path: 'admin/job-postings', element: <Navigate to="/admin/reports" replace /> },
        { path: 'admin/reports', element: protect(['admin'], <AdminReportsPage />) },
        { path: 'admin/jobsites', element: <Navigate to="/admin/projects" replace /> },
        { path: 'admin/claims', element: protect(['admin'], <AdminClaimsPage />) },
        { path: 'admin/users', element: protect(['admin'], <AdminUsersPage />) },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
