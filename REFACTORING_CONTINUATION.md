# UI Refactoring Continuation Checklist

## Pages Already Refactored ✅
- [x] WorkerProfilePage - Complete redesign with new components
- [x] ApplicationsPage - Refactored for consistency
- [x] GCApplicantsPage - Refactored with new form styling

---

## Pages to Refactor (Priority Order)

### High Priority (Core User Flows)

#### [ ] SCDashboardPage
**Location**: `src/pages/sc/SCDashboardPage.jsx`
**Purpose**: Company/General Contractor dashboard
**Refactoring Needs**:
- Replace all div containers with GlobalCard
- Use GlobalButton for all action buttons
- Apply Typography components
- Implement 8px spacing system
- Ensure mobile responsiveness
- Update any status displays to StatusBadge

**Pattern to Follow**:
```jsx
// Import components
import GlobalCard, { CardHeader, CardContent } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import { PageTitle, PageSubtitle, CardTitle, SmallText } from '../../components/ui/Typography'

// Replace containers
<GlobalCard padding="md">
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardContent>Content</CardContent>
</GlobalCard>

// Use GlobalButton
<GlobalButton variant="primary">Action</GlobalButton>

// Apply typography
<PageTitle>Dashboard</PageTitle>
<SmallText>Support text</SmallText>
```

#### [ ] SCJobsPage
**Location**: `src/pages/sc/SCJobsPage.jsx`
**Purpose**: Company job listings
**Refactoring Needs**:
- Replace job cards with consistent GlobalCard structure
- Use StatusBadge for job status
- Apply GlobalButton for actions
- Implement grid layout with mobile responsiveness
- Consistent typography

#### [ ] WorkerDashboardPage
**Location**: `src/pages/worker/WorkerDashboardPage.jsx`
**Purpose**: Worker dashboard
**Refactoring Needs**:
- Replace dashboard cards with GlobalCard
- Update typography to use new components
- Implement responsive grid for dashboard items
- Update buttons and interactive elements

#### [ ] SavedJobsPage
**Location**: `src/pages/worker/SavedJobsPage.jsx`
**Purpose**: Worker's saved jobs
**Refactoring Needs**:
- Replace job cards with consistent GlobalCard
- Use GlobalButton for actions
- Implement StatusBadge for job status
- Responsive list layout

---

### Medium Priority (Administrative Features)

#### [ ] SCCompanyPage
**Location**: `src/pages/sc/SCCompanyPage.jsx`
**Purpose**: Company profile management
**Refactoring Needs**:
- Similar to WorkerProfilePage pattern
- Use GlobalCard for sections
- Apply form styling consistently
- GlobalButton for all actions

#### [ ] Admin Pages
**Location**: `src/pages/admin/`
**Purpose**: Administrative functions
**Refactoring Needs**:
- Consistent with other pages
- Tables using GlobalCard structure
- GlobalButton for admin actions

---

### Lower Priority (Component Updates)

#### [ ] JobCard Component
**Location**: `src/components/jobs/JobCard.jsx`
**Update**:
- Wrap in GlobalCard
- Use StatusBadge for job status
- Apply Typography components
- GlobalButton for actions

#### [ ] ProjectCard Component
**Location**: `src/components/projects/ProjectCard.jsx`
**Update**:
- Wrap in GlobalCard
- Use consistent spacing
- GlobalButton for actions

#### [ ] ProjectDetailMap
**Location**: `src/components/map/ProjectDetailMap.jsx`
**Update**:
- Ensure consistent styling of map-related cards
- GlobalButton for map interactions

#### [ ] Layout Components
- **Location**: `src/components/layout/`
- **Update Navbar**: Ensure responsive and uses GlobalButton for actions
- **Update Footer**: Apply consistent styling

#### [ ] Profile Components
- **WorkerProfileForm**: Update styling to use new components
- **CompanyProfileForm**: Update styling to use new components
- **ResumeUpload**: Update UI to match new design

---

## Refactoring Steps for Each Page

### Step 1: Import New Components
```jsx
import GlobalCard, { CardHeader, CardContent, CardFooter } from '../../components/ui/GlobalCard'
import GlobalButton from '../../components/ui/GlobalButton'
import StatusBadge, { Badge } from '../../components/ui/StatusBadge'
import {
  PageTitle,
  PageSubtitle,
  CardTitle,
  SmallText,
  Caption,
  Label
} from '../../components/ui/Typography'
```

### Step 2: Replace Container Divs
```jsx
// ❌ Old
<div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
  <h1 className="text-2xl font-bold">Title</h1>
  <p className="mt-2 text-slate-400">Subtitle</p>
</div>

// ✅ New
<GlobalCard padding="lg">
  <CardHeader title="Title" subtitle="Subtitle" />
</GlobalCard>
```

### Step 3: Replace All Buttons
```jsx
// ❌ Old
<button className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-black hover:bg-amber-300">
  Click
</button>

// ✅ New
<GlobalButton variant="primary" onClick={handleClick}>
  Click
</GlobalButton>
```

### Step 4: Replace Typography
```jsx
// ❌ Old
<h1 className="text-2xl font-bold">Title</h1>
<p className="text-sm text-slate-400">Support</p>

// ✅ New
<PageTitle>Title</PageTitle>
<PageSubtitle>Support</PageSubtitle>
```

### Step 5: Apply Spacing System
```jsx
// ❌ Old
<div className="space-y-6">

// ✅ New
<div className="space-y-4 sm:space-y-6">
```

### Step 6: Update Status Displays
```jsx
// ❌ Old
<span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
  {status}
</span>

// ✅ New
<StatusBadge status={status} size="sm" />
```

### Step 7: Review Mobile Layout
- ✅ Test on 375px viewport
- ✅ Check touch targets are 44px+ height
- ✅ Verify text is readable
- ✅ Ensure spacing scales properly

---

## Validation Checklist for Each Page

After refactoring, verify:

- [ ] All div containers replaced with GlobalCard
- [ ] All buttons use GlobalButton component
- [ ] All status displays use StatusBadge
- [ ] All text uses Typography components
- [ ] Spacing follows 8px system
- [ ] Border radius is consistent (rounded-lg = 8px)
- [ ] Mobile layout tested on 375px
- [ ] Tablet layout tested on 768px
- [ ] Desktop layout tested on 1920px
- [ ] Color scheme is consistent
- [ ] No inline styles remain
- [ ] No use of rounded-3xl or rounded-2xl
- [ ] Focus states visible on buttons and inputs
- [ ] Responsive breakpoints work (sm:, md:, lg:)
- [ ] Functionality unchanged (backend still works)
- [ ] No TypeScript or linting errors

---

## Commands for Verification

```bash
# Check for compilation errors
npm run build

# Check for linting issues
npm run lint

# Check specific file
npm run lint -- path/to/file.jsx

# Run dev server to test
npm run dev
```

---

## Design System References

### Spacing System (8px base)
```
xs = 4px   (gap-1)
sm = 8px   (gap-2)
md = 12px  (gap-3)
lg = 16px  (gap-4)
xl = 24px  (gap-6)
2xl = 32px (gap-8)
3xl = 48px (gap-12)
```

### Colors
```
Primary BG:    bg-slate-900
Secondary BG:  bg-slate-800
Dark BG:       bg-slate-950
Accent:        bg-amber-400
Primary Text:  text-white
Secondary:     text-slate-400
```

### Border Radius
```
Consistent: rounded-lg (8px)
Special:    rounded-xl (12px) - only when needed
Full:       rounded-full
```

### Component Padding
```
Card default:  p-4 sm:p-6
Button:        px-4 py-2
Small button:  px-3 py-1
```

---

## Common Issues & Solutions

### Issue: Component not importing correctly
**Solution**: Check import path and ensure component exists
```jsx
// Correct
import GlobalCard from '../../components/ui/GlobalCard'

// Check if file exists before importing
```

### Issue: Styling not applying
**Solution**: Ensure Tailwind CSS classes are correct
```jsx
// Check class names use Tailwind conventions
className="rounded-lg border border-slate-800 bg-slate-900 p-4"
```

### Issue: Mobile layout broken
**Solution**: Check responsive prefixes
```jsx
// Correct mobile-first approach
className="grid grid-cols-1 md:grid-cols-2 gap-4"
// Default is 1 column, scales to 2 on md breakpoint
```

### Issue: Colors not matching
**Solution**: Use design system colors
```jsx
// From designSystem.js
import { COLORS, STATUS_COLORS } from '../../lib/designSystem'
```

---

## Next Refactoring Priorities

1. **Phase 1**: Dashboard pages (SCDashboardPage, WorkerDashboardPage)
2. **Phase 2**: Listing pages (SCJobsPage, SavedJobsPage)
3. **Phase 3**: Profile pages (SCCompanyPage, admin pages)
4. **Phase 4**: Reusable components (JobCard, ProjectCard, etc.)
5. **Phase 5**: Layout components (Navbar, Footer)

---

## Files to Reference

- Design System: `src/lib/designSystem.js`
- Components Docs: `COMPONENTS_REFERENCE.md`
- Refactoring Guide: `UI_REFACTORING_GUIDE.md`
- Completed Examples:
  - `src/pages/worker/WorkerProfilePage.jsx`
  - `src/pages/worker/ApplicationsPage.jsx`
  - `src/pages/gc/GCApplicantsPage.jsx`

---

## Questions or Issues?

1. Check `COMPONENTS_REFERENCE.md` for component usage
2. Review `UI_REFACTORING_GUIDE.md` for detailed explanation
3. Compare with already-refactored pages
4. Check for console errors in browser dev tools
5. Verify imports are correct before running
