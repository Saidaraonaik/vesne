import { useMemo, useState } from 'react'
import { Alert, Button, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { FileDown, FileSpreadsheet, FileText, Share2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../../app/app-context.ts'
import { ChartCard } from '../../components/charts/ChartCard.tsx'
import { KpiCard } from '../../components/common/KpiCard.tsx'
import { EmptyState } from '../../components/common/EmptyState.tsx'
import { ShareWhatsAppDialog } from '../../components/proof/ShareWhatsAppDialog.tsx'
import { datedName, exportCsv, exportPdf, exportXlsx } from '../../services/exportService.ts'
import { panelSx } from '../../theme/theme.ts'
import type { ReportRow } from '../../utils/reports.ts'
import { proofShareMessage, type ProofShare } from '../../utils/whatsapp.ts'

export function ReportView({
  rows,
  filename,
  title,
  showClientFilter,
}: {
  rows: ReportRow[]
  filename: string
  title: string
  showClientFilter: boolean
}) {
  const { notify } = useApp()
  const [project, setProject] = useState('all')
  const [client, setClient] = useState('all')
  const [location, setLocation] = useState('all')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [share, setShare] = useState<ProofShare | null>(null)

  const options = useMemo(() => ({
    projects: unique(rows.map((row) => row.project)),
    clients: unique(rows.map((row) => row.client)),
    locations: unique(rows.map((row) => row.location)),
    statuses: unique(rows.map((row) => row.status)),
  }), [rows])

  const filtered = rows.filter((row) => {
    if (project !== 'all' && row.project !== project) return false
    if (client !== 'all' && row.client !== client) return false
    if (location !== 'all' && row.location !== location) return false
    if (status !== 'all' && row.status !== status) return false
    if (from && row.targetDateIso < from) return false
    if (to && row.targetDateIso > to) return false
    return true
  })

  const completed = filtered.filter((row) => row.status === 'Completed').length
  const awaiting = filtered.filter((row) => row.status.toLowerCase().includes('await') || row.status.toLowerCase().includes('review') || row.status.toLowerCase().includes('submitted')).length
  const rejected = filtered.filter((row) => row.status.toLowerCase().includes('reject') || row.status.toLowerCase().includes('resubmission')).length
  const pending = filtered.length - completed - awaiting - rejected
  const percent = filtered.length === 0 ? 0 : Math.round((completed / filtered.length) * 100)

  const byProject = group(filtered, (row) => row.project)
  const byClient = group(filtered, (row) => row.client)
  const byExecutor = group(filtered, (row) => row.executor)
  const byDate = filtered
    .filter((row) => row.approvalDateIso)
    .reduce<Record<string, number>>((acc, row) => {
      acc[row.approvalDateIso] = (acc[row.approvalDateIso] ?? 0) + 1
      return acc
    }, {})
  const dateChart = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }))

  const download = async (kind: 'csv' | 'xlsx' | 'pdf') => {
    if (filtered.length === 0) {
      notify('Nothing to export for the current filters.', 'info')
      return
    }
    const photos = filtered.filter((row) => row.imageDataUrl).length
    try {
      if (kind === 'csv') await exportCsv(datedName(filename, 'csv'), filtered)
      if (kind === 'xlsx') await exportXlsx(datedName(filename, 'xlsx'), filtered)
      if (kind === 'pdf') await exportPdf(datedName(filename, 'pdf'), title, filtered)
      notify(
        photos > 0
          ? kind === 'pdf'
            ? `PDF downloaded with ${photos} current proof image${photos === 1 ? '' : 's'}.`
            : `Download includes ${photos} current proof image${photos === 1 ? '' : 's'} in a photos folder.`
          : 'Report downloaded from the current filters.',
        'success',
      )
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not export the report.', 'error')
    }
  }

  const shareRow = (row: ReportRow) => {
    if (!row.imageDataUrl) return
    setShare({
      stamp: row.lat != null && row.lng != null && row.capturedAt
        ? {
            placeName: row.placeName || row.location,
            address: row.proofAddress || row.address,
            lat: row.lat,
            lng: row.lng,
            at: row.capturedAt,
          }
        : undefined,
      message: proofShareMessage({
        project: `${row.project} / ${row.campaign}`,
        location: row.location,
        date: row.approvalDate !== '—' ? row.approvalDate : row.submittedAt,
        executor: row.executor,
        coordinates: `${row.coordinates}`,
        reference: row.proofRef,
        filename: row.imageName,
        status: row.status,
      }),
      imageDataUrl: row.imageDataUrl,
      filename: row.imageName,
    })
  }

  const visible = filtered.slice(page * 8, page * 8 + 8)

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <Button variant="outlined" startIcon={<FileText size={16} />} onClick={() => void download('csv')}>CSV</Button>
        <Button variant="outlined" startIcon={<FileSpreadsheet size={16} />} onClick={() => void download('xlsx')}>Excel</Button>
        <Button variant="outlined" startIcon={<FileDown size={16} />} onClick={() => void download('pdf')}>PDF</Button>
      </Stack>
      <Alert severity="info">
        Exports use the rows currently shown. Each proof photograph in the PDF, and in the photos folder of the CSV and Excel download, includes the location card with the place, address, coordinates, and time.
      </Alert>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <TextField select size="small" label="Project" value={project} onChange={(event) => { setProject(event.target.value); setPage(0) }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All projects</MenuItem>
          {options.projects.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        {showClientFilter && (
          <TextField select size="small" label="Client" value={client} onChange={(event) => { setClient(event.target.value); setPage(0) }} sx={{ minWidth: 180 }}>
            <MenuItem value="all">All clients</MenuItem>
            {options.clients.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
        )}
        <TextField select size="small" label="Location" value={location} onChange={(event) => { setLocation(event.target.value); setPage(0) }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All locations</MenuItem>
          {options.locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0) }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {options.statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
        <TextField type="date" size="small" label="Target from" slotProps={{ inputLabel: { shrink: true } }} value={from} onChange={(event) => { setFrom(event.target.value); setPage(0) }} />
        <TextField type="date" size="small" label="Target to" slotProps={{ inputLabel: { shrink: true } }} value={to} onChange={(event) => { setTo(event.target.value); setPage(0) }} />
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
        <KpiCard label="Locations" value={filtered.length} hint="In the current filter" icon={<FileText size={16} />} />
        <KpiCard label="Completed" value={completed} hint={`${percent}% complete`} icon={<FileText size={16} />} tint="#d1fae5" color="#047857" />
        <KpiCard label="Pending" value={Math.max(pending, 0)} hint="Not completed or in review" icon={<FileText size={16} />} tint="#e2e8f0" color="#334155" />
        <KpiCard label="Awaiting / rejected" value={`${awaiting} / ${rejected}`} hint="Review states in this filter" icon={<FileText size={16} />} tint="#fef3c7" color="#b45309" />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <ChartCard title="Project-wise progress" subtitle="Completed locations"><MiniBar data={byProject} color="#E4570E" /></ChartCard>
        {showClientFilter && <ChartCard title="Client-wise progress" subtitle="Completed locations"><MiniBar data={byClient} color="#0F6E6B" /></ChartCard>}
        <ChartCard title="Executor-wise completed work"><MiniBar data={byExecutor} color="#6D28D9" /></ChartCard>
        <ChartCard title="Date-wise approvals" subtitle="Approved proof by review date"><MiniBar data={dateChart.length ? dateChart : [{ label: 'None', value: 0 }]} color="#d97706" /></ChartCard>
      </Box>
      {filtered.length === 0 ? <EmptyState title="No rows in this filter" body="Widen the date range or clear a status filter." /> : (
        <TableContainer sx={panelSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Executor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Proof image</TableCell>
                <TableCell>Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.taskCode} hover>
                  <TableCell>{row.taskCode}</TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{row.executor}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.targetDate}</TableCell>
                  <TableCell>
                    {row.imageDataUrl ? (
                      <Box component="img" src={row.imageDataUrl} alt={`${row.taskCode} proof`} sx={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {row.imageDataUrl ? (
                      <Button size="small" startIcon={<Share2 size={14} />} onClick={() => shareRow(row)}>Share</Button>
                    ) : row.proofRef}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, next) => setPage(next)} rowsPerPage={8} rowsPerPageOptions={[8]} />
        </TableContainer>
      )}
      <Typography variant="caption" color="text.secondary">The photo column is the current proof for that row. Client reports include approved photographs only.</Typography>
      <ShareWhatsAppDialog open={Boolean(share)} share={share} onClose={() => setShare(null)} onNotify={notify} />
    </Stack>
  )
}

function MiniBar({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={70} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort()
}

function group(rows: ReportRow[], pick: (row: ReportRow) => string) {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    if (row.status !== 'Completed') return
    map.set(pick(row), (map.get(pick(row)) ?? 0) + 1)
  })
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
}
