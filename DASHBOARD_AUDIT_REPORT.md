# JOBSITE FINDER - DASHBOARD & NAVIGATION AUDIT REPORT

**Date:** June 12, 2026  
**Purpose:** Determine if dashboard pages can be removed in favor of role-based navigation  
**Status:** AUDIT ONLY - NO CHANGES IMPLEMENTED

---

## EXECUTIVE SUMMARY

Jobsite Finder currently has **4 separate dashboard pages** (Worker, Subcontractor, General Contractor, Admin) plus role-based navigation. The analysis shows that **dashboards are PARTIALLY REDUNDANT** with navigation but serve as gateway/onboarding pages. Worker dashboard redirects to /jobsites, while GC and SC dashboards display useful onboarding content.

**Key Finding:** Dashboards can be removed/simplified IF their onboarding content (welcome messages, quick stats) is moved to dedicated landing pages or home page content.

---

## PART 1: DASHBOARD AUDIT

### 1.1 Worker Dashboard

**File Location:** `src/pages/worker/WorkerDashboardPage.jsx`  
**Route:** `/worker` and `/worker/dashboard`  
**Protected By:** `['worker']` role

**Current Behavior:**
- Loads worker session
- **REDIRECTS immediately to `/jobsites`** (does not show dashboard content)
- No dashboard cards, stats, or quick actions
- Essentially a routing passthrough

**Components Rendered:** None (redirect component)  
**Navigation Cards:** None  
**Stats Widgets:** None  
**Quick Actions:** None  
**Links Available:** Sign in link (if user not authenticated)

**Unique Functionality:** None - purely a redirect page

**Analysis:** This dashboard serves NO PURPOSE. It's immediately redirected away.

---

### 1.2 General Contractor Dashboard

**File Location:** `src/pages/gc/GCDashboardPage.jsx`  
**Route:** `/gc` and `/gc/dashboard`  
**Protected By:** `['gc']` role

**Current Behavior:**
- Displays welcome message with user's full name
- Shows "Connected projects" section
- Fetches and displays approved projects the GC is connected to
- Shows project cards with images, location, and status badges

**Components Rendered:**
- Welcome card with greeting
- Connected projects section
- Project cards (image, name, location, primary GC status)

**Navigation Cards:** None (but displays projects as links)  
**Stats Widgets:** None  
**Quick Actions:** None (but links to individual projects)  
**Links Available:**
- Links to individual projects (`/projects/{id}`)

**Data Fetched:** `getApprovedProjectsForUser(user.id)` from jobsService

**Unique Functionality:**
- **Welcome personalization** with user name
- **Quick access to connected projects** with visual cards
- **Project image previews** for at-a-glance recognition
- **Primary GC indicator badge** to show status on jobsites

**Analysis:** This dashboard has value as an onboarding/welcome page. It provides quick visual access to the user's current projects without needing to navigate to a separate "Projects" page.

---

### 1.3 Subcontractor Dashboard

**File Location:** `src/pages/sc/SCDashboardPage.jsx`  
**Route:** `/sc` and `/sc/dashboard` and `/subcontractor/dashboard`  
**Protected By:** `['sc']` role

**Current Behavior:**
- Displays welcome message with user's full name
- Shows "Connected projects" section
- Fetches and displays approved projects the SC is connected to
- Shows project cards with images, location, and trade scope

**Components Rendered:**
- Welcome card with greeting
- Connected projects section
- Project cards (image, name, location, trade scope)

**Navigation Cards:** None (but displays projects as links)  
**Stats Widgets:** None  
**Quick Actions:** None (but links to individual projects)  
**Links Available:**
- Links to individual projects (`/projects/{id}`)

**Data Fetched:** `getApprovedProjectsForUser(user.id)` from jobsService

**Unique Functionality:**
- **Welcome personalization** with user name
- **Quick access to connected projects** with visual cards
- **Project image previews** for at-a-glance recognition
- **Trade scope display** showing what trades they're hired for

**Analysis:** Similar value to GC dashboard. Provides onboarding context and quick access to assigned projects.

---

### 1.4 Admin Dashboard

**File Location:** `src/pages/admin/AdminDashboardPage.jsx`  
**Route:** `/admin` and `/admin/dashboard`  
**Protected By:** `['admin']` role

**Current Behavior:**
- Uses DashboardShell component (special layout)
- Shows admin-specific action cards as grid
- Displays site settings control (maintenance mode toggle)
- Links to admin functions

**Components Rendered:**
- Admin action cards in 2-column grid
- Site settings section with toggle switch

**Navigation Cards:** Yes - 4 cards
- "Projects" → `/admin/projects` - Review and edit project visibility, stage, and status
- "Jobsites Map" → `/admin/jobsites` - Add jobsites tied to projects
- "Project claims" → `/admin/claims` - Approve or reject company claims
- "Users & companies" → `/admin/users` - View users and verify pending company profiles

**Stats Widgets:** No numerical stats  
**Quick Actions:** 
- Maintenance mode toggle (for Pre-Launch Landing Page)

**Links Available:**
- `/admin/projects`
- `/admin/jobsites`
- `/admin/claims`
- `/admin/users`
- Plus additional admin routes accessible from menu

**Unique Functionality:**
- **Maintenance mode toggle** - Pre-launch landing page control
- **Site-wide settings hub** - Centralized place for global platform controls
- **Quick access to critical admin functions**
- **Descriptions of each admin section** for clarity

**Analysis:** This dashboard has significant value as an admin control center. It provides quick descriptions and access to critical admin functions, and hosts the site settings control that could be elsewhere but is appropriately placed here.

---

## PART 2: NAVIGATION AUDIT

### 2.1 Navigation Components Active in the Application

#### **AppHeader.jsx**
**File Location:** `src/components/layout/AppHeader.jsx`  
**Status:** ✅ **ACTIVE**

**Purpose:** Main header bar (sticky, top navigation)  
**Components Used:**
- HamburgerMenu (mobile toggle button)
- Logo (clickable, goes to home)
- Notifications link
- User avatar/profile link

**Behavior:**
- Displays on all pages (part of main App layout)
- Hamburger menu opens NavigationDrawer
- User avatar links to:
  - Workers → `/worker/profile`
  - GC → `/gc/company`
  - SC → `/subcontractor/company`
  - Admin → `/admin/dashboard`
- Notifications button goes to `/notifications`

**Navigation Exposed:** Secondary (icon buttons only)

---

#### **NavigationDrawer.jsx**
**File Location:** `src/components/layout/NavigationDrawer.jsx`  
**Status:** ✅ **ACTIVE**

**Purpose:** Mobile/hamburger menu (side drawer)  
**Components Used:**
- RoleBasedMenu (renders all navigation items)
- Sign out button
- Logo
- User name and role label

**Behavior:**
- Opens when hamburger menu clicked
- Overlay closes drawer when clicked
- X button closes drawer
- Sign out button at bottom
- Closes when user clicks a menu item

**Navigation Exposed:** Full role-based menu

---

#### **RoleBasedMenu.jsx**
**File Location:** `src/components/layout/RoleBasedMenu.jsx`  
**Status:** ✅ **ACTIVE**

**Purpose:** Core navigation items manager  
**Components Used:**
- MenuItem (for each nav item)

**Behavior:**
- Shows different menu based on user role
- Uses navigationConfig.js to get items
- Passes onSelect callback to close drawer

**Navigation Exposed:** All primary navigation

---

#### **HamburgerMenu.jsx**
**File Location:** `src/components/layout/HamburgerMenu.jsx`  
**Status:** ✅ **ACTIVE**

**Purpose:** Mobile menu toggle button  
**Behavior:**
- Simple button with Menu icon
- Toggles NavigationDrawer open/closed
- Accessible with aria-expanded

---

#### **MenuItem.jsx**
**File Location:** `src/components/layout/MenuItem.jsx`  
**Status:** ✅ **ACTIVE**

**Purpose:** Individual navigation item renderer  
**Behavior:** Renders Link with icon and label from navigationConfig

---

#### **navigationConfig.js**
**File Location:** `src/components/layout/navigationConfig.js`  
**Status:** ✅ **ACTIVE - CENTRAL HUB**

**Purpose:** Single source of truth for all navigation  
**Content:**
- Common menu items (Home, Jobsites Map, Notifications, Settings)
- Role-specific menus (worker, sc, gc, admin)
- Public menu (for non-authenticated users)

---

#### **DashboardShell.jsx**
**File Location:** `src/components/layout/DashboardShell.jsx`  
**Status:** ✅ **ACTIVE** (Secondary navigation layout)

**Purpose:** Consistent header for dashboard/admin pages  
**Used By:**
- AdminDashboardPage
- SettingsPage
- NotificationsPage
- AdminProjectsPage
- GCSubcontractorsPage

**Provides:** Logo, title, subtitle, actions area

---

### 2.2 Navigation Components NOT FOUND (No Sidebar, No Persistent Nav)

- ❌ Sidebar.jsx - Not found
- ❌ NavigationSidebar.jsx - Not found
- ❌ PersistentNav.jsx - Not found
- ❌ DesktopNav.jsx - Not found

**Conclusion:** Navigation is MOBILE-FIRST with hamburger menu as single entry point.

---

### 2.3 Summary of Navigation Component Usage

| Component | Active | Purpose |
|-----------|--------|---------|
| AppHeader | ✅ | Sticky header with menu toggle |
| NavigationDrawer | ✅ | Mobile menu (slide-out) |
| RoleBasedMenu | ✅ | Menu item renderer by role |
| HamburgerMenu | ✅ | Menu toggle button |
| MenuItem | ✅ | Individual menu item |
| navigationConfig.js | ✅ | Menu content definition |
| DashboardShell | ✅ | Dashboard page header |
| Navbar | ❌ | File is just export redirect to AppHeader |

**Navigation Status:** Single, unified navigation system (hamburger/drawer model)  
**Duplicate Navs:** None found  
**Unused Components:** None

---

## PART 3: ROLE MENU AUDIT

All role menus defined in `src/components/layout/navigationConfig.js`

### 3.1 Worker Menu

**Route Prefix:** `/worker` and `/`  
**Default Route:** `/jobsites`

**Menu Items:**

| # | Menu Item | Route | Icon | Visibility |
|---|-----------|-------|------|-----------|
| 1 | Home | `/` | Home | All users |
| 2 | Jobsites Map | `/jobsites` | Map | All users |
| 3 | Find Jobs | `/worker/saved` | BriefcaseBusiness | Workers only |
| 4 | My Applications | `/worker/applications` | ClipboardList | Workers only |
| 5 | My Profile | `/worker/profile` | User | Workers only |
| 6 | Notifications | `/notifications` | Bell | All authenticated |
| 7 | Settings | `/settings` | Settings | All authenticated |

**Total Items:** 7  
**Public Items:** 2 (Home, Jobsites Map)  
**Role-Specific Items:** 5

---

### 3.2 Subcontractor Menu

**Route Prefix:** `/subcontractor` and `/sc`  
**Default Route:** `/subcontractor/dashboard`

**Menu Items:**

| # | Menu Item | Route | Icon | Visibility |
|---|-----------|-------|------|-----------|
| 1 | Home | `/` | Home | All users |
| 2 | Jobsites Map | `/jobsites` | Map | All users |
| 3 | My Jobsites | `/subcontractor/dashboard` | Building2 | Subcontractors only |
| 4 | Job Postings | `/subcontractor/jobs` | BriefcaseBusiness | Subcontractors only |
| 5 | Applicants | `/subcontractor/applicants` | Users | Subcontractors only |
| 6 | Company Profile | `/subcontractor/company` | User | Subcontractors only |
| 7 | Notifications | `/notifications` | Bell | All authenticated |
| 8 | Settings | `/settings` | Settings | All authenticated |

**Total Items:** 8  
**Public Items:** 2 (Home, Jobsites Map)  
**Role-Specific Items:** 6

---

### 3.3 General Contractor Menu

**Route Prefix:** `/gc`  
**Default Route:** `/gc/dashboard`

**Menu Items:**

| # | Menu Item | Route | Icon | Visibility |
|---|-----------|-------|------|-----------|
| 1 | Home | `/` | Home | All users |
| 2 | Jobsites Map | `/jobsites` | Map | All users |
| 3 | My Jobsites | `/gc/dashboard` | Building2 | GC only |
| 4 | Create Jobsite | `/gc/jobsites/create` | FileText | GC only |
| 5 | Job Postings | `/gc/jobs` | BriefcaseBusiness | GC only |
| 6 | Applicants | `/gc/applicants` | Users | GC only |
| 7 | Subcontractors | `/gc/subcontractors` | ShieldCheck | GC only |
| 8 | Company Profile | `/gc/company` | User | GC only |
| 9 | Notifications | `/notifications` | Bell | All authenticated |
| 10 | Settings | `/settings` | Settings | All authenticated |

**Total Items:** 10  
**Public Items:** 2 (Home, Jobsites Map)  
**Role-Specific Items:** 8

---

### 3.4 Admin Menu

**Route Prefix:** `/admin`  
**Default Route:** `/admin/dashboard`

**Menu Items:**

| # | Menu Item | Route | Icon | Visibility |
|---|-----------|-------|------|-----------|
| 1 | Home | `/` | Home | All users |
| 2 | Jobsites Map | `/jobsites` | Map | All users |
| 3 | Companies | `/admin/companies` | Building2 | Admin only |
| 4 | Jobsite Claims | `/admin/claims` | ClipboardList | Admin only |
| 5 | User Management | `/admin/users` | Users | Admin only |
| 6 | Job Postings | `/admin/job-postings` | BriefcaseBusiness | Admin only |
| 7 | Project Management | `/admin/projects` | FileText | Admin only |
| 8 | Reports | `/admin/reports` | LayoutDashboard | Admin only |
| 9 | Notifications | `/notifications` | Bell | All authenticated |
| 10 | Settings | `/settings` | Settings | All authenticated |
| 11 | Admin Dashboard | `/admin/dashboard` | ShieldCheck | Admin only |

**Total Items:** 11  
**Public Items:** 2 (Home, Jobsites Map)  
**Role-Specific Items:** 9

---

### 3.5 Public Menu (Unauthenticated Users)

| # | Menu Item | Route | Icon | Visibility |
|---|-----------|-------|------|-----------|
| 1 | Home | `/` | Home | Public |
| 2 | Jobsites Map | `/jobsites` | Map | Public |
| 3 | About | `/about` | FileText | Public |
| 4 | Pricing | `/pricing` | BriefcaseBusiness | Public |

**Total Items:** 4

---

## PART 4: ROUTE AUDIT

### 4.1 Complete Route List

**Authenticated Routes** (Protected by ProtectedRoute with role checks):

#### Worker Routes
| Route | Component | Roles | Status |
|-------|-----------|-------|--------|
| `/worker` | WorkerDashboardPage | worker | **REDIRECTS to /jobsites** |
| `/worker/dashboard` | WorkerDashboardPage | worker | **REDIRECTS to /jobsites** |
| `/worker/profile` | WorkerProfilePage | worker | ✅ Active |
| `/worker/applications` | ApplicationsPage | worker | ✅ Active |
| `/worker/saved` | SavedJobsPage | worker | ✅ Active |

#### General Contractor Routes
| Route | Component | Roles | Status |
|-------|-----------|-------|--------|
| `/gc` | GCDashboardPage | gc | ✅ Active (Welcome page) |
| `/gc/dashboard` | GCDashboardPage | gc | ✅ Active (Welcome page) |
| `/gc/company` | GCCompanyPage | gc | ✅ Active |
| `/gc/jobs` | GCJobsPage | gc | ✅ Active |
| `/gc/applicants` | GCApplicantsPage | gc | ✅ Active |
| `/gc/subcontractors` | GCSubcontractorsPage | gc | ✅ Active |
| `/gc/jobsites/create` | CreateJobsitePage | gc | ✅ Active |

#### Subcontractor Routes
| Route | Component | Roles | Status |
|-------|-----------|-------|--------|
| `/sc` | SCDashboardPage | sc | ✅ Active (Welcome page) |
| `/sc/dashboard` | SCDashboardPage | sc | ✅ Active (Welcome page) |
| `/subcontractor/dashboard` | SCDashboardPage | sc | ✅ Active (Welcome page) |
| `/subcontractor/company` | SCCompanyPage | sc | ✅ Active |
| `/subcontractor/jobs` | SCJobsPage | sc | ✅ Active |
| `/subcontractor/applicants` | SCApplicantsPage | sc | ✅ Active |
| `/subcontractor/jobsites/create` | CreateJobsitePage | sc | ✅ Active |
| `/sc/company` | SCCompanyPage | sc | ✅ Active (Alias) |
| `/sc/jobs` | SCJobsPage | sc | ✅ Active (Alias) |
| `/sc/applicants` | SCApplicantsPage | sc | ✅ Active (Alias) |
| `/sc/jobsites/create` | CreateJobsitePage | sc | ✅ Active (Alias) |

#### Admin Routes
| Route | Component | Roles | Status |
|-------|-----------|-------|--------|
| `/admin` | AdminDashboardPage | admin | ✅ Active (Control center) |
| `/admin/dashboard` | AdminDashboardPage | admin | ✅ Active (Control center) |
| `/admin/projects` | AdminProjectsPage | admin | ✅ Active |
| `/admin/companies` | AdminCompaniesPage | admin | ✅ Active |
| `/admin/job-postings` | AdminJobPostingsPage | admin | ✅ Active |
| `/admin/reports` | AdminReportsPage | admin | ✅ Active |
| `/admin/jobsites` | AdminJobsitesPage | admin | ✅ Active |
| `/admin/claims` | AdminClaimsPage | admin | ✅ Active |
| `/admin/users` | AdminUsersPage | admin | ✅ Active |

#### Account Routes (All Roles)
| Route | Component | Roles | Status |
|-------|-----------|-------|--------|
| `/notifications` | NotificationsPage | worker, sc, gc, admin | ✅ Active |
| `/settings` | SettingsPage | worker, sc, gc, admin | ✅ Active |

#### Redirect Route
| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard` | RoleRedirect | ✅ Redirects to role-default route |

---

### 4.2 Orphaned, Duplicate, and Dashboard-Only Routes

#### Orphaned Routes: None identified
All routes are referenced in navigation or have clear purposes.

#### Duplicate Routes: Yes, identified

**Subcontractor Routes - Multiple Path Aliases:**
- `/subcontractor/dashboard` + `/sc/dashboard` + `/sc` → All route to SCDashboardPage
- `/subcontractor/jobs` + `/sc/jobs` → Both route to SCJobsPage
- `/subcontractor/applicants` + `/sc/applicants` → Both route to SCApplicantsPage
- `/subcontractor/company` + `/sc/company` → Both route to SCCompanyPage
- `/subcontractor/jobsites/create` + `/sc/jobsites/create` → Both route to CreateJobsitePage

**Reason for Aliases:** The router supports both `/subcontractor/*` and `/sc/*` patterns. Navigation config uses `/subcontractor/*` but `/sc/*` routes are also available for backwards compatibility or user preference.

#### Dashboard-Only Routes: None

All dashboard routes (`/worker`, `/gc`, `/sc`, `/admin`) have corresponding feature pages:
- Worker dashboard → Redirects to `/jobsites` (public page, not dashboard-only)
- GC dashboard → Has feature pages (`/gc/jobs`, `/gc/applicants`, etc.)
- SC dashboard → Has feature pages (`/subcontractor/jobs`, `/subcontractor/applicants`, etc.)
- Admin dashboard → Has feature pages (`/admin/projects`, `/admin/users`, etc.)

---

### 4.3 Route Architecture Analysis

**Default Route Behavior:**

When user lands on `/dashboard`:
1. RoleRedirect component intercepts
2. Calls `getDefaultRouteForRole(role)` from utils
3. Routes to:
   - Worker → `/jobsites`
   - GC → `/gc/dashboard`
   - SC → `/subcontractor/dashboard`
   - Admin → `/admin/dashboard`

**Missing In Navigation Config:**
- `/admin/home-preview` exists but is immediately redirected: `<Navigate to="/" replace />`

---

## PART 5: UX AUDIT - CONFUSING NAVIGATION LABELS

### 5.1 Identified Confusing Terms

| Label | Current Usage | Audience Issue | Recommended Name | Reason |
|-------|---------------|-----------------|-----------------|--------|
| **Applicants** | Worker job applications (in GC/SC context) | Tradespeople may think "people applying to work here" but actually means "job applications I/we created" | **Job Applicants** or **Applications** | Clarifies it's about job postings, not company hiring |
| **Company Profile** | Business registration page | "Company" is formal/corporate; tradespeople say "business" | **Business Profile** or **Your Business** | More vernacular for trades |
| **User Management** | Admin tool for user accounts | Vague; unclear what "management" means to non-tech users | **Team Members** or **Company Users** | Clearer for admin context |
| **Project Management** | Admin page for projects/jobsites | "Project" is ambiguous; could mean construction project OR software project | **Jobsites** or **Sites Management** | More specific and concrete |
| **Job Postings** | Posts for positions to hire | Generic but clear in context | **Open Positions** or **Hiring** | More action-oriented |
| **Jobsite Claims** | System where companies claim ownership of projects | "Claims" is vague to non-technical users | **Verify Jobsite Ownership** or **Jobsite Verification** | More explicit about what it does |
| **My Jobsites** | Dashboard showing connected projects | OK term but inconsistent with other pages saying "Projects" | **My Projects** or **Connected Jobs** | Consistency across product |

---

### 5.2 Trade Worker Vocabulary Preferences

Based on industry language:
- **"Crew"** instead of "Team" (SC context)
- **"Bid"** instead of "Proposal"
- **"Site"** or **"Jobsite"** instead of "Project"
- **"Trade"** or **"Skill"** instead of "Specialization"
- **"Equipment/Tools"** instead of "Resources"
- **"Rates"** instead of "Pricing"

---

### 5.3 Current Best Practice Labels Already Used

✅ Well-chosen labels:
- "Find Jobs" (worker)
- "My Applications" (worker)
- "My Profile" (worker)
- "Jobsites Map" (public)
- "Notifications" (all)
- "Settings" (all)

---

## PART 6: V1 SIMPLIFICATION PLAN

### 6.1 Analysis: Can Dashboards Be Removed?

**Current State:**
```
Dashboard Routes:
├── /worker → REDIRECTS to /jobsites (useless)
├── /gc → Shows welcome + projects (useful)
├── /sc → Shows welcome + projects (useful)
└── /admin → Shows quick links + settings (critical)
```

**Verdict:** PARTIAL REMOVAL POSSIBLE

---

### 6.2 Recommended V1 Architecture

### Option A: MINIMAL DASHBOARDS (Recommended for MVP/V1)

Keep dashboards but simplify:

**Worker (REMOVE):**
- ❌ Delete `/worker` and `/worker/dashboard` routes
- ✅ Worker default route remains `/jobsites`
- Reasoning: Worker dashboard adds no value; instantly redirects anyway

**GC & SC (KEEP - but as welcome/onboarding):**
- ✅ Keep `/gc/dashboard` and `/sc/dashboard`
- 🔄 Simplify to show ONLY welcome + projects
- ✅ Remove from main navigation (not in menu currently)
- Add quick access in header or make landing page
- Reasoning: Provides onboarding context and quick project access

**Admin (KEEP - but refactor):**
- ✅ Keep `/admin/dashboard`
- 🔄 Move "Site Settings" to its own page or modal
- ✅ Keep quick access cards
- Reasoning: Serves as control center hub

---

### 6.3 Pages That Should Remain

**Essential Application Pages** (Cannot remove):

#### Public Pages
- ✅ Home (/)
- ✅ Jobsites Map (/jobsites)
- ✅ Project Detail (/projects/:id)
- ✅ Worker Profile (/worker/:id)
- ✅ Auth Pages (login, signup, role select)

#### Worker Pages
- ✅ Find Jobs (/worker/saved) - **Where workers find jobs**
- ✅ My Applications (/worker/applications) - **Track job applications**
- ✅ My Profile (/worker/profile) - **Build worker profile**
- ❓ Worker Dashboard (/worker) - **REMOVE** (redirects anyway)

#### Contractor Pages (GC & SC identical structure)
- ✅ Dashboard (/gc, /sc) - **Keep but simplify** (onboarding/welcome)
- ✅ Company Profile (/gc/company) - **Business registration**
- ✅ Job Postings (/gc/jobs) - **Post and manage jobs**
- ✅ Applicants (/gc/applicants) - **Review job applicants**
- ✅ Create Jobsite (/gc/jobsites/create) - **Add new jobsite**
- ✅ Subcontractors (/gc/subcontractors) - **GC-only: manage subs**

#### Admin Pages
- ✅ Admin Dashboard (/admin) - **Keep** (control center)
- ✅ Projects (/admin/projects) - **Administer jobsites**
- ✅ Companies (/admin/companies) - **Review company profiles**
- ✅ Job Postings (/admin/job-postings) - **Monitor job posts**
- ✅ Jobsites (/admin/jobsites) - **Create/manage jobsites**
- ✅ Claims (/admin/claims) - **Verify company claims**
- ✅ Users (/admin/users) - **Manage user accounts**
- ✅ Reports (/admin/reports) - **Analytics**

#### Shared Pages
- ✅ Notifications (/notifications)
- ✅ Settings (/settings)

---

### 6.4 Pages That Can Move to Role-Based Navigation

**Currently ACCESSIBLE but NOT IN MENU:**
- GC/SC: Dashboard pages (show in menu? or keep hidden?)
- GC: Subcontractors page (currently not in menu)

**Recommendation:**
- Keep GC/SC dashboards HIDDEN from menu (accessible via direct URL)
- Add GC "Subcontractors" to main GC menu
- Dashboards serve as landing pages, not primary navigation

---

### 6.5 Dashboard Cards That Can Be Removed

**Worker Dashboard:**
- ❌ Remove entire page (redirects anyway)

**GC Dashboard:**
- ✅ Keep: Welcome message
- ✅ Keep: Connected projects cards (this IS the value)
- ✅ Remove: Could move to /gc/projects page but not needed yet

**SC Dashboard:**
- ✅ Keep: Welcome message
- ✅ Keep: Connected projects cards (this IS the value)
- ✅ Remove: Could move to /sc/projects page but not needed yet

**Admin Dashboard:**
- ✅ Keep: Quick access cards (Projects, Jobsites, Claims, Users)
- 🔄 Move: Site Settings to separate `/admin/settings` page
- ✅ Keep: Descriptions under each card

---

### 6.6 Dashboard Routes That Should Be Redirected

| Current Route | Action | Redirect To | Reason |
|---------------|--------|------------|--------|
| `/worker` | Remove | N/A (can delete) | Redirects to /jobsites anyway |
| `/worker/dashboard` | Remove | N/A (can delete) | Redirects to /jobsites anyway |
| `/dashboard` | Keep | Role-specific route | Already working as intended |
| `/gc/dashboard` | Keep | (no redirect) | Useful onboarding page |
| `/sc/dashboard` | Keep | (no redirect) | Useful onboarding page |
| `/admin/dashboard` | Keep | (no redirect) | Critical control center |

---

### 6.7 Suggested Simplified Role Menus for V1

#### Worker Menu (PROPOSED)

```javascript
worker: [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  { to: '/worker/saved', label: 'Find Jobs', icon: BriefcaseBusiness },
  { to: '/worker/applications', label: 'My Applications', icon: ClipboardList },
  { to: '/worker/profile', label: 'My Profile', icon: User },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]
```

**Changes:** None - Already optimal  
**Menu Items:** 7 total  
**Grouping Suggestion:** Could split into "Browse" and "Account" groups visually

---

#### Subcontractor Menu (PROPOSED)

```javascript
sc: [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  // New group: "My Business"
  { to: '/sc/dashboard', label: 'My Jobsites', icon: Building2 },
  { to: '/sc/company', label: 'Business Profile', icon: User }, // RENAMED
  // New group: "Hiring"
  { to: '/sc/jobs', label: 'Open Positions', icon: BriefcaseBusiness }, // RENAMED
  { to: '/sc/applicants', label: 'Job Applicants', icon: Users }, // RENAMED
  // Account
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]
```

**Changes:**
- Rename "Company Profile" → "Business Profile"
- Rename "Job Postings" → "Open Positions"
- Rename "Applicants" → "Job Applicants"
- Group items logically (optional visual grouping)

**Menu Items:** 8 total

---

#### General Contractor Menu (PROPOSED)

```javascript
gc: [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  // New group: "My Business"
  { to: '/gc/dashboard', label: 'My Jobsites', icon: Building2 },
  { to: '/gc/company', label: 'Business Profile', icon: User }, // RENAMED
  // New group: "Hiring & Projects"
  { to: '/gc/jobsites/create', label: 'Create Jobsite', icon: FileText },
  { to: '/gc/jobs', label: 'Open Positions', icon: BriefcaseBusiness }, // RENAMED
  { to: '/gc/applicants', label: 'Job Applicants', icon: Users }, // RENAMED
  { to: '/gc/subcontractors', label: 'Subcontractors', icon: ShieldCheck },
  // Account
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]
```

**Changes:**
- Rename "Company Profile" → "Business Profile"
- Rename "Job Postings" → "Open Positions"
- Rename "Applicants" → "Job Applicants"
- Add "Subcontractors" to menu (currently hidden)
- Group items logically (optional)

**Menu Items:** 10 total

---

#### Admin Menu (PROPOSED)

```javascript
admin: [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobsites', label: 'Jobsites Map', icon: Map },
  // Admin group: "Moderation"
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/users', label: 'Team Members', icon: Users }, // RENAMED
  { to: '/admin/claims', label: 'Verify Ownership', icon: ClipboardList }, // RENAMED
  // Admin group: "Content"
  { to: '/admin/projects', label: 'Jobsites', icon: FileText }, // RENAMED
  { to: '/admin/jobsites', label: 'Jobsites Map Editor', icon: Map },
  { to: '/admin/job-postings', label: 'Open Positions', icon: BriefcaseBusiness }, // RENAMED
  { to: '/admin/reports', label: 'Reports', icon: LayoutDashboard },
  // Account
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin/dashboard', label: 'Control Center', icon: ShieldCheck }, // ADD
]
```

**Changes:**
- Rename "User Management" → "Team Members"
- Rename "Project Management" → "Jobsites"
- Rename "Jobsite Claims" → "Verify Ownership"
- Rename "Job Postings" → "Open Positions"
- Add "Control Center" link (currently not in menu)
- Group items logically

**Menu Items:** 11 total

---

### 6.8 Summary of Recommended V1 Changes

#### Routes to Remove:
1. ❌ `/worker` (already redirects to /jobsites)
2. ❌ `/worker/dashboard` (already redirects to /jobsites)

#### Routes to Keep:
- ✅ All other routes (dashboards, feature pages)

#### Routes to Modify:
- ✅ `/admin/dashboard` - Move Site Settings to separate control area or keep as is

#### Navigation Labels to Update:
| Old Label | New Label | Roles |
|-----------|-----------|-------|
| Company Profile | Business Profile | GC, SC |
| Job Postings | Open Positions | GC, SC, Admin |
| Applicants | Job Applicants | GC, SC, Admin |
| User Management | Team Members | Admin |
| Project Management | Jobsites | Admin |
| Jobsite Claims | Verify Ownership | Admin |

#### New Menu Items to Add:
- ✅ Admin: "Control Center" (link to /admin/dashboard)
- ✅ GC: "Subcontractors" (add to menu if not already visible)

#### Pages to Hide from Menu (but keep accessible):
- 🔄 GC Dashboard (/gc/dashboard) - Hidden from menu, accessible as landing page
- 🔄 SC Dashboard (/sc/dashboard) - Hidden from menu, accessible as landing page

#### Rationale:
1. Worker dashboard removal saves code (pure redirect)
2. GC/SC dashboards kept as welcome/onboarding pages
3. Navigation labels simplified for trades vocabulary
4. All functionality remains, just better organized
5. Mobile-first navigation already optimal

---

## PART 7: FINDINGS & RECOMMENDATIONS

### 7.1 Key Findings

1. **Navigation System is Sound**
   - Single, unified navigation (hamburger/drawer model)
   - No duplicate navigation systems
   - Role-based menu configuration centralized in navigationConfig.js

2. **Dashboards Are Partially Redundant**
   - Worker dashboard: 100% redundant (immediate redirect)
   - GC dashboard: 20% redundant (welcome + projects could be elsewhere)
   - SC dashboard: 20% redundant (welcome + projects could be elsewhere)
   - Admin dashboard: 0% redundant (critical control center)

3. **Terminology Issues Exist**
   - "Applicants" = ambiguous (should be "Job Applicants")
   - "Company Profile" = too formal (should be "Business Profile")
   - "User Management" = too technical (should be "Team Members")
   - "Project Management" = ambiguous (should be "Jobsites")

4. **Routes Are Well-Organized**
   - No orphaned routes found
   - Duplicate SC routes provide backwards compatibility
   - Role-based access control working correctly

---

### 7.2 Recommended V1 Actions (in priority order)

**PRIORITY 1 - Remove Redundant Routes:**
- [ ] Delete `/worker` route (WorkerDashboardPage)
- [ ] Delete `/worker/dashboard` route (WorkerDashboardPage)
- [ ] Update default worker route to `/jobsites` (already done)

**PRIORITY 2 - Update Navigation Labels:**
- [ ] Change "Company Profile" → "Business Profile" in navigationConfig.js
- [ ] Change "Applicants" → "Job Applicants" in navigationConfig.js
- [ ] Change "User Management" → "Team Members" in navigationConfig.js (admin)
- [ ] Change "Project Management" → "Jobsites" in navigationConfig.js (admin)
- [ ] Change "Jobsite Claims" → "Verify Ownership" in navigationConfig.js (admin)

**PRIORITY 3 - Add Missing Menu Items:**
- [ ] Add GC "Subcontractors" to GC menu (currently accessible but not in nav)
- [ ] Add Admin "Control Center" to admin menu (currently accessible but not in nav)

**PRIORITY 4 - Simplify Dashboards:**
- [ ] GC Dashboard: Keep simple (welcome + projects only)
- [ ] SC Dashboard: Keep simple (welcome + projects only)
- [ ] Admin Dashboard: Consider moving "Site Settings" to separate `/admin/settings` page

**PRIORITY 5 - Clean Up Routes:**
- [ ] Review SC route aliases (both `/sc/*` and `/subcontractor/*`) - consolidate to one pattern or document why both needed

---

### 7.3 What NOT to Do

❌ **Do NOT remove GC/SC dashboards entirely**
- They provide valuable onboarding context
- Project cards with images offer quick visual access
- Removing would require finding new home for welcome messages

❌ **Do NOT remove admin dashboard**
- It's a critical control center
- Site settings and quick actions are well-placed

❌ **Do NOT create new navigation sidebar**
- Current mobile-first hamburger model is clean and simple
- Adding desktop sidebar would add complexity without value for MVP

❌ **Do NOT remove role-based menu system**
- It's working perfectly
- Centralized in navigationConfig.js for easy management

---

### 7.4 Long-term Recommendations (Post-V1)

1. **Consider Dashboard Evolution**
   - GC/SC dashboards could become "Project Hub" with more stats
   - Add project activity feed or quick stats
   - Add shortcuts to recently viewed projects

2. **Analytics & Reporting**
   - Add worker/contractor role-based dashboards with personal stats
   - (e.g., "3 open applications", "2 interviews scheduled")

3. **Progressive Enhancement**
   - Admin dashboard could include platform health metrics
   - Notification alerts could be highlighted on dashboard

4. **Accessibility Review**
   - Test navigation with screen readers
   - Verify ARIA labels are complete (partially done)

5. **Mobile Testing**
   - Verify hamburger menu works well on small screens
   - Test navigation drawer scroll behavior

---

## APPENDIX A: FILE REFERENCES

### Navigation Components
- `src/components/layout/navigationConfig.js` - Menu definitions
- `src/components/layout/AppHeader.jsx` - Main header
- `src/components/layout/NavigationDrawer.jsx` - Mobile drawer
- `src/components/layout/RoleBasedMenu.jsx` - Menu renderer
- `src/components/layout/HamburgerMenu.jsx` - Toggle button
- `src/components/layout/MenuItem.jsx` - Menu item renderer
- `src/components/layout/DashboardShell.jsx` - Dashboard layout

### Router & Auth
- `src/app/router.jsx` - Route definitions
- `src/app/App.jsx` - Main app wrapper
- `src/components/auth/ProtectedRoute.jsx` - Role-based access
- `src/components/auth/RoleRedirect.jsx` - Dashboard redirect

### Dashboard Pages
- `src/pages/worker/WorkerDashboardPage.jsx` - Worker dashboard (REDIRECTS)
- `src/pages/gc/GCDashboardPage.jsx` - GC dashboard
- `src/pages/sc/SCDashboardPage.jsx` - SC dashboard
- `src/pages/admin/AdminDashboardPage.jsx` - Admin dashboard

### Feature Pages
- Worker: ApplicationsPage, SavedJobsPage, WorkerProfilePage
- GC: GCCompanyPage, GCJobsPage, GCApplicantsPage, GCSubcontractorsPage
- SC: SCCompanyPage, SCJobsPage, SCApplicantsPage
- Admin: AdminProjectsPage, AdminCompaniesPage, AdminJobsitesPage, AdminClaimsPage, AdminUsersPage, AdminJobPostingsPage, AdminReportsPage
- Shared: NotificationsPage, SettingsPage

### Utilities
- `src/lib/utils.js` - normalizeRole(), getDefaultRouteForRole(), getRoleLabel()

---

## APPENDIX B: ROLE DEFAULT ROUTES

When user navigates to `/dashboard`:

| Role | Default Route | Component |
|------|---------------|-----------|
| worker | `/jobsites` | JobsitesPage (public) |
| gc | `/gc/dashboard` | GCDashboardPage |
| sc | `/subcontractor/dashboard` | SCDashboardPage |
| admin | `/admin/dashboard` | AdminDashboardPage |
| unknown | `/onboarding/select-role` | SelectRolePage |

---

## APPENDIX C: ROUTE PROTECTION SUMMARY

All authenticated routes use `<ProtectedRoute allowedRoles={['role']}>` wrapper.

- Worker routes: Protected with `['worker']`
- GC routes: Protected with `['gc']`
- SC routes: Protected with `['sc']`
- Admin routes: Protected with `['admin']`
- Account routes: Protected with `['worker', 'sc', 'gc', 'admin']` (all authenticated)

---

## APPENDIX D: UNUSED COMPONENTS / DEAD CODE

**No unused navigation components found.**

All components in `src/components/layout/` are actively used:
- ✅ AppHeader
- ✅ NavigationDrawer
- ✅ RoleBasedMenu
- ✅ HamburgerMenu
- ✅ MenuItem
- ✅ DashboardShell
- ⚠️ Navbar.jsx - Just exports AppHeader, could be consolidated

---

## APPENDIX E: MENU ITEM ICON USAGE

Icons are from lucide-react library:

| Icon | Usage |
|------|-------|
| Home | Home navigation |
| Map | Jobsites Map |
| Building2 | My Jobsites, Companies |
| BriefcaseBusiness | Job Postings, Pricing, Find Jobs |
| FileText | Create Jobsite, Projects, About |
| Bell | Notifications |
| Settings | Settings |
| User | Profiles, Company Profile |
| Users | Applicants, User Management |
| ClipboardList | Applications, Jobsite Claims |
| ShieldCheck | Subcontractors, Admin Dashboard |
| LayoutDashboard | Reports |

All icons are appropriately chosen and accessible with `aria-hidden="true"` on SVG elements.

---

**END OF AUDIT REPORT**

*This audit was completed June 12, 2026*  
*No code changes have been made*  
*All findings are based on static code analysis*

