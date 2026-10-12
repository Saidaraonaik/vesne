import type { Activity, AppData, Executor, Project, ProofSubmission, Task, TaskStatus } from '../types/models.ts'

export function createEmptyData(): AppData {
  return {
    version: 1,
    clients: [],
    executors: [],
    projects: [],
    tasks: [],
    submissions: [],
    activities: [],
  }
}

export function workspaceIsEmpty(data: AppData) {
  return data.clients.length === 0 && data.projects.length === 0 && data.tasks.length === 0
}

function dayOffset(days: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export function demoProofImage(title: string, accent = '#E07A3D') {
  const safe = title.replace(/[<>&"']/g, '').slice(0, 42)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D7EEF8"/>
        <stop offset="1" stop-color="#F4F7FA"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#sky)"/>
    <rect y="292" width="640" height="108" fill="#E6E0D4"/>
    <rect x="168" y="78" width="304" height="168" rx="10" fill="${accent}"/>
    <rect x="184" y="94" width="272" height="136" rx="6" fill="#FFF8F2"/>
    <text x="320" y="154" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#1A2633">HORIZON</text>
    <text x="320" y="184" text-anchor="middle" font-family="Trebuchet MS, sans-serif" font-size="14" fill="#5E7082">${safe}</text>
    <rect x="308" y="246" width="24" height="58" fill="#8C8174"/>
    <text x="28" y="356" font-family="Trebuchet MS, sans-serif" font-size="14" fill="#5E7082">Vesne field proof · device GPS</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

interface SiteSeed {
  id: string
  code: string
  projectId: string
  locationName: string
  address: string
  lat: number
  lng: number
  executorId: string
  status: TaskStatus
  targetOffset: number
  quantity: number
  accent: string
  hoursAgo?: number
  reviewedHoursAgo?: number
  rejectionReason?: string
}

const SITES: SiteSeed[] = [
  { id: 'tk_demo_blr_01', code: 'TSK-2601', projectId: 'pr_demo_metro', locationName: 'MG Road Metro', address: 'MG Road Metro pillar 12, Bengaluru', lat: 12.9756, lng: 77.6068, executorId: 'ex_ravi', status: 'completed', targetOffset: -6, quantity: 2, accent: '#E07A3D', hoursAgo: 140, reviewedHoursAgo: 136 },
  { id: 'tk_demo_blr_02', code: 'TSK-2602', projectId: 'pr_demo_metro', locationName: 'Indiranagar 100ft Road', address: '100ft Road, near CMH, Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408, executorId: 'ex_ravi', status: 'completed', targetOffset: -4, quantity: 1, accent: '#1F6F8B', hoursAgo: 96, reviewedHoursAgo: 90 },
  { id: 'tk_demo_blr_03', code: 'TSK-2603', projectId: 'pr_demo_metro', locationName: 'Koramangala 80ft Road', address: '80ft Road, Koramangala 4th Block, Bengaluru', lat: 12.9352, lng: 77.6245, executorId: 'ex_ravi', status: 'completed', targetOffset: -3, quantity: 2, accent: '#2E9A5B', hoursAgo: 72, reviewedHoursAgo: 68 },
  { id: 'tk_demo_blr_04', code: 'TSK-2604', projectId: 'pr_demo_metro', locationName: 'Jayanagar 4th Block', address: '11th Main, Jayanagar 4th Block, Bengaluru', lat: 12.925, lng: 77.5938, executorId: 'ex_ravi', status: 'completed', targetOffset: -2, quantity: 1, accent: '#C4842A', hoursAgo: 50, reviewedHoursAgo: 46 },
  { id: 'tk_demo_blr_05', code: 'TSK-2605', projectId: 'pr_demo_metro', locationName: 'Malleshwaram 8th Cross', address: '8th Cross, Margosa Road, Malleshwaram, Bengaluru', lat: 13.0035, lng: 77.569, executorId: 'ex_ravi', status: 'completed', targetOffset: -1, quantity: 2, accent: '#5B4B8A', hoursAgo: 28, reviewedHoursAgo: 26 },
  { id: 'tk_demo_blr_06', code: 'TSK-2606', projectId: 'pr_demo_metro', locationName: 'UB City', address: 'Vittal Mallya Road, UB City, Bengaluru', lat: 12.9716, lng: 77.595, executorId: 'ex_ravi', status: 'completed', targetOffset: 0, quantity: 1, accent: '#C45C5C', hoursAgo: 8, reviewedHoursAgo: 6 },
  { id: 'tk_demo_blr_07', code: 'TSK-2607', projectId: 'pr_demo_metro', locationName: 'Hebbal Flyover', address: 'Hebbal flyover service road, Bengaluru', lat: 13.0358, lng: 77.597, executorId: 'ex_ravi', status: 'awaiting_verification', targetOffset: 0, quantity: 2, accent: '#1F6F8B', hoursAgo: 0.4 },
  { id: 'tk_demo_blr_08', code: 'TSK-2608', projectId: 'pr_demo_metro', locationName: 'Whitefield Forum', address: 'Forum Shantiniketan approach, Whitefield, Bengaluru', lat: 12.9897, lng: 77.7276, executorId: 'ex_ravi', status: 'in_progress', targetOffset: 1, quantity: 2, accent: '#E07A3D' },
  { id: 'tk_demo_blr_09', code: 'TSK-2609', projectId: 'pr_demo_metro', locationName: 'Commercial Street', address: 'Commercial Street, Shivajinagar, Bengaluru', lat: 12.9822, lng: 77.608, executorId: 'ex_ravi', status: 'rejected', targetOffset: -1, quantity: 1, accent: '#C45C5C', hoursAgo: 6, reviewedHoursAgo: 5, rejectionReason: 'The hoarding face is partly covered by a shop shutter. Retake from the opposite pavement.' },
  { id: 'tk_demo_maa_01', code: 'TSK-2610', projectId: 'pr_demo_coast', locationName: 'T Nagar Pondy Bazaar', address: 'Pondy Bazaar, Thyagaraya Road, Chennai', lat: 13.0418, lng: 80.2341, executorId: 'ex_meera', status: 'completed', targetOffset: -5, quantity: 3, accent: '#E07A3D', hoursAgo: 120, reviewedHoursAgo: 116 },
  { id: 'tk_demo_maa_02', code: 'TSK-2611', projectId: 'pr_demo_coast', locationName: 'Anna Nagar 2nd Avenue', address: '2nd Avenue, Anna Nagar, Chennai', lat: 13.085, lng: 80.2101, executorId: 'ex_meera', status: 'completed', targetOffset: -3, quantity: 2, accent: '#1F6F8B', hoursAgo: 70, reviewedHoursAgo: 66 },
  { id: 'tk_demo_maa_03', code: 'TSK-2612', projectId: 'pr_demo_coast', locationName: 'Besant Nagar Beach Road', address: 'Besant Nagar 2nd Avenue, Chennai', lat: 13.0003, lng: 80.2667, executorId: 'ex_meera', status: 'completed', targetOffset: -1, quantity: 1, accent: '#2E9A5B', hoursAgo: 30, reviewedHoursAgo: 27 },
  { id: 'tk_demo_maa_04', code: 'TSK-2613', projectId: 'pr_demo_coast', locationName: 'Velachery 100ft Road', address: '100ft Road, Vijaya Nagar, Velachery, Chennai', lat: 12.9815, lng: 80.218, executorId: 'ex_meera', status: 'completed', targetOffset: 0, quantity: 2, accent: '#5B4B8A', hoursAgo: 10, reviewedHoursAgo: 8 },
  { id: 'tk_demo_maa_05', code: 'TSK-2614', projectId: 'pr_demo_coast', locationName: 'Express Avenue', address: 'Express Avenue, Royapettah, Chennai', lat: 13.0586, lng: 80.2642, executorId: 'ex_meera', status: 'in_progress', targetOffset: 1, quantity: 2, accent: '#C4842A' },
  { id: 'tk_demo_maa_06', code: 'TSK-2615', projectId: 'pr_demo_coast', locationName: 'Phoenix Marketcity', address: 'Velachery Main Road, Phoenix Marketcity, Chennai', lat: 12.9916, lng: 80.2168, executorId: 'ex_meera', status: 'assigned', targetOffset: 2, quantity: 4, accent: '#1F6F8B' },
  { id: 'tk_demo_hyd_01', code: 'TSK-2616', projectId: 'pr_demo_saffron', locationName: 'Banjara Hills Road No 12', address: 'Road No 12, Banjara Hills, Hyderabad', lat: 17.4156, lng: 78.4347, executorId: 'ex_arjun', status: 'completed', targetOffset: -4, quantity: 2, accent: '#C4842A', hoursAgo: 80, reviewedHoursAgo: 76 },
  { id: 'tk_demo_hyd_02', code: 'TSK-2617', projectId: 'pr_demo_saffron', locationName: 'Hitech City Mindspace', address: 'Mindspace circle, Hitech City, Hyderabad', lat: 17.4435, lng: 78.3772, executorId: 'ex_arjun', status: 'completed', targetOffset: -2, quantity: 1, accent: '#2E9A5B', hoursAgo: 40, reviewedHoursAgo: 36 },
  { id: 'tk_demo_hyd_03', code: 'TSK-2618', projectId: 'pr_demo_saffron', locationName: 'Secunderabad Clock Tower', address: 'SP Road, near Clock Tower, Secunderabad', lat: 17.4399, lng: 78.4983, executorId: 'ex_arjun', status: 'in_progress', targetOffset: 1, quantity: 2, accent: '#5B4B8A' },
]

function taskFrom(site: SiteSeed): Task {
  return {
    id: site.id,
    taskCode: site.code,
    projectId: site.projectId,
    locationName: site.locationName,
    address: site.address,
    lat: site.lat,
    lng: site.lng,
    instructions: 'Photograph the installed face straight-on, include the street context, and capture device GPS at the site.',
    executorId: site.executorId,
    targetDate: dayOffset(site.targetOffset),
    quantity: site.quantity,
    requiredProofTypes: ['photo'],
    referenceImages: [],
    status: site.status,
    createdAt: hoursAgo(24 * 12),
  }
}

function submissionFrom(site: SiteSeed): ProofSubmission | null {
  if (site.hoursAgo == null) return null
  const awaiting = site.status === 'awaiting_verification'
  const rejected = site.status === 'rejected'
  const status = awaiting ? 'awaiting_verification' : rejected ? 'rejected' : 'approved'
  return {
    id: `sub_${site.id}`,
    taskId: site.id,
    executorId: site.executorId,
    imageDataUrl: demoProofImage(site.locationName, site.accent),
    lat: site.lat,
    lng: site.lng,
    locationLabel: site.address,
    gpsSource: 'device',
    submittedAt: hoursAgo(site.hoursAgo),
    status,
    rejectionReason: site.rejectionReason,
    verificationRemarks: status === 'approved' ? 'Face is fully visible and the GPS point matches the work location.' : undefined,
    reviewedAt: site.reviewedHoursAgo != null ? hoursAgo(site.reviewedHoursAgo) : undefined,
  }
}

export function createDemoData(): AppData {
  const created = hoursAgo(24 * 18)
  const executors: Executor[] = [
    {
      id: 'ex_ravi',
      executorCode: 'EX-104',
      name: 'Ravi Kumar',
      email: 'executor@vesne.demo',
      phone: '+91 98450 11220',
      city: 'Bengaluru',
      password: 'demo',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'ex_meera',
      executorCode: 'EX-118',
      name: 'Meera Iyer',
      email: 'meera.iyer@vesne.demo',
      phone: '+91 98400 22881',
      city: 'Chennai',
      password: 'demo',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'ex_arjun',
      executorCode: 'EX-126',
      name: 'Arjun Reddy',
      email: 'arjun.reddy@vesne.demo',
      phone: '+91 90000 44119',
      city: 'Hyderabad',
      password: 'demo',
      status: 'active',
      createdAt: created,
    },
  ]

  const projects: Project[] = [
    {
      id: 'pr_demo_metro',
      clientId: 'cl_horizon',
      name: 'Metro Glow Q4',
      campaign: 'Horizon Festive OOH — Bengaluru',
      startDate: dayOffset(-21),
      endDate: dayOffset(18),
      workLocations: 'Bengaluru metro corridors and high streets',
      quantity: 9,
      workType: 'Outdoor hoarding installation',
      executorInstructions: 'Capture the full face plus the nearest landmark. Retake if the creative is wrinkled or blocked.',
      requiredProofTypes: ['photo'],
      targetDate: dayOffset(10),
      referenceImages: [demoProofImage('Metro Glow Q4', '#E07A3D')],
      budget: 1860000,
      internalNotes: 'Client review is Friday. Prioritise Hebbal and Whitefield before the weekend traffic window.',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'pr_demo_coast',
      clientId: 'cl_horizon',
      name: 'Coastal Windows',
      campaign: 'Horizon Retail Windows — Chennai',
      startDate: dayOffset(-16),
      endDate: dayOffset(14),
      workLocations: 'Chennai high-street storefronts',
      quantity: 6,
      workType: 'Retail window branding',
      executorInstructions: 'Shoot the window from the pavement in daylight. Include the store name in frame.',
      requiredProofTypes: ['photo'],
      targetDate: dayOffset(8),
      referenceImages: [demoProofImage('Coastal Windows', '#1F6F8B')],
      budget: 940000,
      internalNotes: 'Phoenix Marketcity install is booked with mall operations for the day after tomorrow.',
      status: 'active',
      createdAt: created,
    },
    {
      id: 'pr_demo_saffron',
      clientId: 'cl_saffron',
      name: 'Saffron City Loop',
      campaign: 'Saffron Summer Coolers — Hyderabad',
      startDate: dayOffset(-12),
      endDate: dayOffset(20),
      workLocations: 'Hyderabad arterial roads',
      quantity: 3,
      workType: 'Bus-shelter branding',
      executorInstructions: 'Photograph both shelter panels and the stop name.',
      requiredProofTypes: ['photo'],
      targetDate: dayOffset(6),
      referenceImages: [],
      budget: 620000,
      internalNotes: 'Separate client. Do not mix these proof files into the Horizon gallery.',
      status: 'active',
      createdAt: created,
    },
  ]

  const tasks = SITES.map(taskFrom)
  const submissions = SITES.flatMap((site) => {
    const submission = submissionFrom(site)
    return submission ? [submission] : []
  }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  const activities: Activity[] = [
    { id: 'act_demo_01', at: hoursAgo(0.3), actor: 'Meera Iyer', message: 'Started TSK-2614 · Express Avenue.', type: 'task' },
    { id: 'act_demo_02', at: hoursAgo(0.4), actor: 'Ravi Kumar', message: 'Submitted proof for TSK-2607 · Hebbal Flyover.', type: 'proof' },
    { id: 'act_demo_03', at: hoursAgo(5), actor: 'Ananya Deshmukh', message: 'Rejected proof for TSK-2609 · Commercial Street.', type: 'proof' },
    { id: 'act_demo_04', at: hoursAgo(6), actor: 'Ananya Deshmukh', message: 'Approved proof for TSK-2606 · UB City.', type: 'proof' },
    { id: 'act_demo_05', at: hoursAgo(8), actor: 'Ananya Deshmukh', message: 'Approved proof for TSK-2613 · Velachery 100ft Road.', type: 'proof' },
    { id: 'act_demo_06', at: hoursAgo(26), actor: 'Ananya Deshmukh', message: 'Approved proof for TSK-2605 · Malleshwaram 8th Cross.', type: 'proof' },
    { id: 'act_demo_07', at: hoursAgo(24 * 16), actor: 'Ananya Deshmukh', message: 'Created project Coastal Windows.', type: 'project' },
    { id: 'act_demo_08', at: hoursAgo(24 * 18), actor: 'Ananya Deshmukh', message: 'Created project Metro Glow Q4.', type: 'project' },
  ]

  return {
    version: 1,
    clients: [
      {
        id: 'cl_horizon',
        name: 'Priya Menon',
        company: 'Horizon Retail',
        email: 'client@vesne.demo',
        phone: '+91 98860 33014',
        password: 'demo',
        status: 'active',
        createdAt: created,
      },
      {
        id: 'cl_saffron',
        name: 'Neha Shah',
        company: 'Saffron Beverages',
        email: 'neha.shah@saffron.demo',
        phone: '+91 98200 77410',
        password: 'demo',
        status: 'active',
        createdAt: created,
      },
    ],
    executors,
    projects,
    tasks,
    submissions,
    activities,
  }
}
