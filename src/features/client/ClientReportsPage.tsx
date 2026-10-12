import { Stack } from '@mui/material'
import { useApp } from '../../app/app-context.ts'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { buildReportRows } from '../../utils/reports.ts'
import { ReportView } from '../reports/ReportView.tsx'

export function ClientReportsPage() {
  const { data, session } = useApp()
  const rows = buildReportRows(data, { audience: 'client', clientId: session?.clientId })
  return (
    <Stack spacing={2}>
      <PageHeader
        title="Reports"
        subtitle="Your locations, completion, and approved proof references. Other clients are excluded."
        crumbs={[{ label: 'Client', to: '/client' }, { label: 'Reports' }]}
      />
      <ReportView rows={rows} filename="vesne-client-report" title="Vesne client progress report (demo)" showClientFilter={false} />
    </Stack>
  )
}
