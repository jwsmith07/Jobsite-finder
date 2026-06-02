# UI Components Quick Reference

## GlobalCard
Container component with consistent styling and variants.

```jsx
import GlobalCard, { CardHeader, CardContent, CardFooter } from '../../components/ui/GlobalCard'

// Basic usage
<GlobalCard padding="md">
  <p>Content</p>
</GlobalCard>

// With header
<GlobalCard padding="md">
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardContent>
    Content here
  </CardContent>
</GlobalCard>

// With actions
<GlobalCard padding="md">
  <CardHeader
    title="Title"
    actions={
      <GlobalButton variant="primary" size="sm">
        Action
      </GlobalButton>
    }
  />
</GlobalCard>

// Card footer with actions
<GlobalCard padding="md">
  <CardHeader title="Title" />
  <CardContent>Content</CardContent>
  <CardFooter>
    <GlobalButton>Cancel</GlobalButton>
    <GlobalButton variant="primary">Save</GlobalButton>
  </CardFooter>
</GlobalCard>
```

### Props
- `padding`: 'xs' | 'sm' | 'md' | 'lg' | 'none' (default: 'md')
- `variant`: 'default' | 'elevated' | 'outlined' | 'subtle' | 'ghost' (default: 'default')
- `interactive`: boolean - adds hover effects
- `className`: string - additional Tailwind classes

---

## GlobalButton
Consistent button styling with multiple variants.

```jsx
import GlobalButton from '../../components/ui/GlobalButton'

// Primary button
<GlobalButton variant="primary">Save</GlobalButton>

// Secondary button
<GlobalButton variant="secondary">Cancel</GlobalButton>

// Ghost button (no background)
<GlobalButton variant="ghost">Learn More</GlobalButton>

// Destructive button
<GlobalButton variant="destructive">Delete</GlobalButton>

// Button sizes
<GlobalButton size="sm">Small</GlobalButton>
<GlobalButton size="md">Medium</GlobalButton>
<GlobalButton size="lg">Large</GlobalButton>

// Loading state
<GlobalButton isLoading={true}>Saving...</GlobalButton>

// Disabled state
<GlobalButton disabled>Disabled</GlobalButton>
```

### Props
- `variant`: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean
- `isLoading`: boolean - shows spinner
- `onClick`: function

---

## StatusBadge
Display status with auto-coloring.

```jsx
import StatusBadge from '../../components/ui/StatusBadge'

// All statuses are auto-colored
<StatusBadge status="hired" />
<StatusBadge status="rejected" />
<StatusBadge status="interview" />
<StatusBadge status="submitted" />
<StatusBadge status="applied" />
<StatusBadge status="shortlisted" />
<StatusBadge status="active" />
<StatusBadge status="closed" />

// Different sizes
<StatusBadge status="hired" size="sm" />
<StatusBadge status="hired" size="md" />
<StatusBadge status="hired" size="lg" />
```

### Props
- `status`: string (any status name, auto-colors)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

---

## Badge
Generic badge for labels and tags.

```jsx
import { Badge } from '../../components/ui/StatusBadge'

// Variants
<Badge variant="neutral">Label</Badge>
<Badge variant="accent">Accent</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>

// With children
<Badge variant="accent">Trade Worker</Badge>
```

### Props
- `variant`: 'neutral' | 'accent' | 'success' | 'warning' | 'error' (default: 'neutral')

---

## Typography Components

```jsx
import {
  PageTitle,
  PageSubtitle,
  SectionTitle,
  SectionSubtitle,
  CardTitle,
  BodyText,
  SmallText,
  Label,
  Caption,
  PageHeader,
} from '../../components/ui/Typography'

// Page header with title and subtitle
<PageTitle>Main Title</PageTitle>
<PageSubtitle>Support text</PageSubtitle>

// Section titles
<SectionTitle>Section Title</SectionTitle>
<SectionSubtitle>Section support text</SectionSubtitle>

// Card title
<CardTitle>Card Title</CardTitle>

// Body text
<BodyText>Regular paragraph text</BodyText>

// Small text
<SmallText>Secondary text</SmallText>

// Label for forms
<Label htmlFor="input">Field Label</Label>

// Very small text
<Caption>Meta information</Caption>

// Page header with actions
<PageHeader
  title="My Profile"
  subtitle="Your profile is public"
  actions={<GlobalButton>Edit</GlobalButton>}
/>
```

### Responsive Typography
All typography components include responsive sizing by default:
- Titles scale from mobile to desktop
- Text remains readable on all screen sizes

---

## Color System

### Background Colors
```
bg-slate-900    Primary background (main cards)
bg-slate-800    Secondary background (elevated cards)
bg-slate-950    Tertiary/dark background (overlays)
bg-amber-400    Primary accent (buttons)
```

### Status Colors (Auto-applied with StatusBadge)
```
active:      blue-500/10 (blue badge)
submitted:   amber-500/10 (amber badge)
applied:     sky-500/10 (sky badge)
shortlisted: purple-500/10 (purple badge)
interview:   indigo-500/10 (indigo badge)
hired:       emerald-500/10 (green badge)
rejected:    red-500/10 (red badge)
closed:      slate-500/10 (gray badge)
```

### Text Colors
```
text-white        Primary text
text-slate-100    Secondary text
text-slate-400    Tertiary text
text-slate-500    Meta text
text-amber-400    Accent text
```

---

## Spacing System

### Margin & Padding
```
p-1, p-2, p-3, p-4, p-6, p-8
m-1, m-2, m-3, m-4, m-6, m-8
```

### Gaps
```
gap-1, gap-2, gap-3, gap-4, gap-6, gap-8, gap-12
```

### Responsive Spacing
```
space-y-4 sm:space-y-6          Mobile 4, tablet+ 6
p-4 sm:p-6                      Mobile 4, tablet+ 6
```

---

## Common Patterns

### Form Field
```jsx
<div>
  <Label htmlFor="name">Name</Label>
  <input
    id="name"
    type="text"
    placeholder="Enter name"
    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-200 mt-1"
  />
</div>
```

### Card with Title and Actions
```jsx
<GlobalCard padding="md">
  <CardHeader
    title="Title"
    subtitle="Subtitle"
    actions={
      <GlobalButton variant="secondary" size="sm">
        Action
      </GlobalButton>
    }
  />
  <CardContent>
    <p>Content here</p>
  </CardContent>
</GlobalCard>
```

### Filter Buttons
```jsx
<div className="flex flex-wrap gap-2">
  {[
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'closed', label: 'Closed' },
  ].map((f) => (
    <GlobalButton
      key={f.key}
      variant={filter === f.key ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => setFilter(f.key)}
    >
      {f.label}
    </GlobalButton>
  ))}
</div>
```

### List of Cards
```jsx
<div className="space-y-3">
  {items.map((item) => (
    <GlobalCard key={item.id} padding="md">
      <CardTitle>{item.name}</CardTitle>
      <SmallText className="mt-2">{item.description}</SmallText>
    </GlobalCard>
  ))}
</div>
```

### Empty State
```jsx
<GlobalCard padding="lg" className="text-center">
  <p className="text-slate-400">No items found</p>
  <GlobalButton variant="secondary" className="mt-4">
    Create New
  </GlobalButton>
</GlobalCard>
```

---

## Utility Classes Quick List

```
Spacing:     p-4, m-4, gap-4, space-y-4, space-x-4
Borders:     border, border-2, rounded-lg, rounded-full
Colors:      bg-slate-900, text-white, border-slate-700
Display:     flex, grid, hidden, block, inline-flex
Alignment:   items-center, justify-between, text-center
Sizing:      w-full, h-full, min-h-screen, max-w-7xl
Responsive:  sm:, md:, lg:, xl: prefixes
```

---

## Design Tokens

Located in `src/lib/designSystem.js`:

```javascript
SPACING          // 8px scale
SPACING_CLASS    // Tailwind gap classes
PADDING          // Padding utilities
MARGIN           // Margin utilities
COLORS           // Color mappings
BORDER_RADIUS    // Border radius options
TYPOGRAPHY       // Typography scale
COMPONENTS       // Pre-built component styles
STATUS_COLORS    // Status-specific colors
RESPONSIVE       // Responsive utilities
```

---

## Tips for Best Results

1. **Always use GlobalCard** instead of plain divs for containers
2. **Use GlobalButton** for all interactive buttons
3. **Apply Typography components** for consistent text
4. **Follow the spacing system**: space-y-4 sm:space-y-6
5. **Use StatusBadge** for all status displays
6. **Keep padding consistent**: p-4 sm:p-6 for cards
7. **Mobile-first**: design for mobile, scale up with breakpoints
8. **Color consistency**: use design system colors
9. **Typography hierarchy**: use proper heading components
10. **Accessibility**: always include labels for forms
