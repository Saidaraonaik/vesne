import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs = [],
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  crumbs?: { label: string; to?: string }[]
}) {
  useEffect(() => {
    document.title = `${title} · Vesne`
  }, [title])

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' }, mb: 2.5 }}
    >
      <BoxTitle title={title} subtitle={subtitle} crumbs={crumbs} />
      {actions && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}

function BoxTitle({
  title,
  subtitle,
  crumbs,
}: {
  title: string
  subtitle?: string
  crumbs: { label: string; to?: string }[]
}) {
  return (
    <Stack spacing={0.75}>
      {crumbs.length > 0 && (
        <Breadcrumbs aria-label="Breadcrumb">
          {crumbs.map((crumb) =>
            crumb.to ? (
              <Link key={crumb.label} component={RouterLink} to={crumb.to} underline="hover" color="inherit" variant="body2">
                {crumb.label}
              </Link>
            ) : (
              <Typography key={crumb.label} variant="body2" color="text.primary">
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h4">{title}</Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}
