import { Link } from 'react-router-dom'

export const LOGO_SRC = '/assets/logo/jobsitefinder-logo.png'

const SIZE_STYLES = {
  header: 'w-[220px] max-w-full',
  mobileHeader: 'w-[160px] max-w-full',
  auth: 'w-[300px] max-w-full',
  footer: 'w-[180px] max-w-full',
  hero: 'w-full max-w-5xl',
  dashboard: 'w-[180px] max-w-full',
}

export default function Logo({
  size = 'header',
  asLink = false,
  to = '/',
  className = '',
  imageClassName = '',
  onClick,
  ...props
}) {
  const image = (
    <img
      src={LOGO_SRC}
      alt="Jobsite Finder"
      className={`h-auto object-contain ${SIZE_STYLES[size] || SIZE_STYLES.header} ${imageClassName}`}
      decoding="async"
      {...props}
    />
  )

  if (!asLink) return image

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex min-w-0 items-center ${className}`}
      aria-label="Jobsite Finder home"
    >
      {image}
    </Link>
  )
}
