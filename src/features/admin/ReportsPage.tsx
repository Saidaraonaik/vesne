import { Stack } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { ReportView } from '../reports/ReportView.tsx'
import { buildReportRows } from '../../utils/reports.ts'

export function AdminReportsPage() {
  const { data } = useApp()
  const rows = buildReportRows(data, { audience: 'admin' })
  return (
    <Stack spacing={2}>
      <PageHeader
        title="Reports"
        subtitle="Progress by project, client, user, location, and approval date."
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Reports' }]}
      />
      <ReportView rows={rows} filename="vesne-admin-report" title="Vesne field execution report (demo)" showClientFilter />
    </Stack>
  )
}
