import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  Bell,
  Building,
  ChartColumn,
  ClipboardList,
  Clock3,
  FolderKanban,
  Images,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Menu as MenuIcon,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link as RouterLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { ConfirmDialog } from '../common/ConfirmDialog.tsx'
import { VesneLogo } from '../common/VesneLogo.tsx'
import { panelSx } from '../../theme/theme.ts'
import type { Role } from '../../types/models.ts'
import { formatDateTime } from '../../utils/format.ts'

const DRAWER_WIDTH = 272

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badge?: number
}

export function AppShell() {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const location = useLocation()
  const { session, data, switchRole, logout, resetData } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null)
  const [noticeAnchor, setNoticeAnchor] = useState<HTMLElement | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const awaiting = data.submissions.filter((item) => item.status === 'awaiting_verification').length
  const myRejected = data.submissions.filter(
    (item) => item.executorId === session?.executorId && item.status === 'rejected',
  ).length

  const items = useMemo<NavItem[]>(() => {
    if (session?.role === 'executor') {
      return [
        { label: 'Dashboard', to: '/executor', icon: LayoutDashboard },
        { label: 'My Tasks', to: '/executor/tasks', icon: ClipboardList },
        { label: 'Submission History', to: '/executor/submissions', icon: Clock3, badge: myRejected || undefined },
        { label: 'Profile', to: '/executor/profile', icon: UserRound },
      ]
    }
    if (session?.role === 'client') {
      return [
        { label: 'Dashboard', to: '/client', icon: LayoutDashboard },
        { label: 'My Projects', to: '/client/projects', icon: FolderKanban },
        { label: 'Approved Proof Gallery', to: '/client/gallery', icon: Images },
        { label: 'Work Map', to: '/client/map', icon: Map },
        { label: 'Reports', to: '/client/reports', icon: ChartColumn },
        { label: 'Profile', to: '/client/profile', icon: UserRound },
      ]
    }
    return [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Projects', to: '/admin/projects', icon: FolderKanban },
      { label: 'Tasks & Work Locations', to: '/admin/tasks', icon: MapPinned },
      { label: 'Executors', to: '/admin/executors', icon: Users },
      { label: 'Clients', to: '/admin/clients', icon: Building },
      { label: 'Proof Verification', to: '/admin/verification', icon: ShieldCheck, badge: awaiting || undefined },
      { label: 'Reports', to: '/admin/reports', icon: ChartColumn },
      { label: 'Work Map', to: '/admin/map', icon: Map },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ]
  }, [awaiting, myRejected, session?.role])

  const home = items[0]?.to ?? '/'
  const profileTo = session?.role === 'admin' ? '/admin/settings' : session?.role === 'executor' ? '/executor/profile' : '/client/profile'
  if (!session) return <Navigate to="/login" replace />

  const drawer = (
    <Stack sx={{ height: '100%', bgcolor: '#FFFFFF', color: '#1A2633', borderRight: '1px solid #E6EEF2' }}>
      <Box sx={{ px: 2, py: 2 }}>
        <VesneLogo height={46} />
      </Box>
      <Divider sx={{ borderColor: '#E6EEF2' }} />
      <List sx={{ px: 1.25, py: 1.5, flex: 1 }}>
        {items.map((item) => {
          const selected = item.to === home ? location.pathname === item.to : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: '#5E7082',
                '&.Mui-selected': {
                  bgcolor: '#E8F3FF',
                  color: '#1A2633',
                },
                '&.Mui-selected .MuiListItemIcon-root': { color: '#5B8AD6' },
                '&.Mui-selected:hover': { bgcolor: '#DCEBFF' },
                '&:hover': { bgcolor: '#F4F8FF' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }} />
              {item.badge ? <Chip size="small" color="warning" label={item.badge} /> : null}
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography
          component={RouterLink}
          to="/"
          sx={{ display: 'inline-block', mb: 0.75, color: '#3D7AB5', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
        >
          Vesne website
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#5E7082' }}>
          Records stay in this browser until a backend is connected.
        </Typography>
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 0, boxSizing: 'border-box', bgcolor: '#FFFFFF' } }}
      >
        {drawer}
      </Drawer>
      <Box sx={{ ml: { md: `${DRAWER_WIDTH}px` }, minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: 1 }}>
            {!desktop && (
              <IconButton aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <MenuIcon size={20} />
              </IconButton>
            )}
            <Box
              component={RouterLink}
              to={home}
              aria-label="Vesne dashboard"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', mr: 'auto' }}
            >
              <VesneLogo height={desktop ? 42 : 36} />
            </Box>
            <TextField
              select
              size="small"
              label="Switch role"
              value={session?.role ?? 'admin'}
              onChange={(event) => switchRole(event.target.value as Role)}
              sx={{ minWidth: { xs: 150, sm: 200 }, bgcolor: 'background.paper' }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="executor">Executor</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </TextField>
            <Tooltip title="Recent activity">
              <IconButton aria-label="Recent activity" onClick={(event) => setNoticeAnchor(event.currentTarget)}>
                <Badge color="primary" variant="dot" invisible={data.activities.length === 0}>
                  <Bell size={18} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Account">
              <IconButton aria-label="Account menu" onClick={(event) => setAccountAnchor(event.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                  {session?.name.slice(0, 1)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
      <Menu anchorEl={noticeAnchor} open={Boolean(noticeAnchor)} onClose={() => setNoticeAnchor(null)}>
        <Box sx={{ px: 2, py: 1, width: 340, maxWidth: '80vw' }}>
          <Typography sx={{ fontWeight: 700 }}>Recent activity</Typography>
        </Box>
        {data.activities.slice(0, 6).map((activity) => (
          <MenuItem key={activity.id} sx={{ alignItems: 'flex-start', whiteSpace: 'normal', maxWidth: 360 }}>
            <Stack>
              <Typography variant="body2">{activity.message}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDateTime(activity.at)}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
      <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{session?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{session?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem component={RouterLink} to={profileTo} onClick={() => setAccountAnchor(null)}>
          <UserRound size={16} style={{ marginRight: 8 }} /> {session?.role === 'admin' ? 'Settings' : 'Profile'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAccountAnchor(null)
            setConfirmReset(true)
          }}
        >
          <RefreshCw size={16} style={{ marginRight: 8 }} /> Clear workspace
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAccountAnchor(null)
            logout()
          }}
        >
          <LogOut size={16} style={{ marginRight: 8 }} /> Log out
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={confirmReset}
        title="Clear workspace?"
        body="Clients, projects, tasks, and proof stored in this browser will be removed."
        confirmLabel="Clear workspace"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetData()
          setConfirmReset(false)
        }}
      />
    </Box>
  )
}

export function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ ...panelSx, p: 2, height: '100%' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
        <Typography variant="h6">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Box>
  )
}
