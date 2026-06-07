import { normalizeRole } from '../../lib/utils'
import MenuItem from './MenuItem'
import { publicMenu, roleMenus } from './navigationConfig'

export default function RoleBasedMenu({ role, signedIn, onSelect }) {
  const normalizedRole = normalizeRole(role)
  const items = signedIn ? roleMenus[normalizedRole] || [] : publicMenu

  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {items.map((item) => (
        <MenuItem key={`${item.label}-${item.to}`} item={item} onSelect={onSelect} />
      ))}
    </nav>
  )
}
