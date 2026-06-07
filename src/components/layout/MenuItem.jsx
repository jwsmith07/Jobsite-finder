import { NavLink } from 'react-router-dom'

export default function MenuItem({ item, onSelect }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      state={item.state}
      onClick={onSelect}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-amber-400 text-black'
            : 'text-slate-100 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      <span>{item.label}</span>
    </NavLink>
  )
}
