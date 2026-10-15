import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Frame, Images, Mail, MapPin, Menu, Paintbrush, Phone, X } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { useApp } from '../../app/app-context.ts'
import { VesneLogo } from '../../components/common/VesneLogo.tsx'
import { homePath } from '../../data/demoUsers.ts'

const NAV = [
  { label: 'Home', href: '#top' },
  { label: 'Services', href: '#services' },
  { label: 'Clients', href: '#clients' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const SERVICES = [
  {
    title: 'Posters & Print Advertising',
    body: 'High-quality poster designs and print ads that grab attention and leave a lasting impression.',
    action: 'Start your campaign',
    icon: Images,
  },
  {
    title: 'Hoardings & Billboards',
    body: 'Massive outdoor displays crafted to maximize your brand’s visibility across prime locations.',
    action: 'Get full exposure',
    icon: Frame,
  },
  {
    title: 'Wall Paintings & Murals',
    body: 'Creative wall art that transforms ordinary spaces into powerful brand storytelling platforms.',
    action: 'Create street impact',
    icon: Paintbrush,
  },
]

const CLIENTS = [
  'Pampers',
  'Muthoot Finance',
  'TVS Motors',
  'Kubota',
  'Patanjali',
  'Closeup',
  'Himalaya',
  'JSW Paints',
  'Bosch',
  'Berger Paints',
]

const FACTS = [
  { value: '2015', label: 'Trading since July, as Sri Lokapujya Enterprises' },
  { value: '2022', label: 'Vesne Private Limited, from April' },
  { value: 'Flex', label: 'Recyclable, non-plastic outdoor and indoor media' },
  { value: 'India', label: 'Field execution for campaigns across the country' },
]

export function LandingPage() {
  const { session } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const portalTo = session ? homePath(session.role) : '/login'

  const submitEnquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <Box id="top" sx={{ bgcolor: '#FFFFFF', color: '#1C1410', minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #E6EEF2',
        }}
      >
        <Container sx={{ display: 'flex', alignItems: 'center', gap: 3, minHeight: 76 }}>
          <Box component="a" href="#top" aria-label="Vesne Private Limited" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <VesneLogo height={46} />
          </Box>
          <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {NAV.map((item) => (
              <Typography key={item.href} component="a" href={item.href} sx={{ color: '#5E7082', fontWeight: 700, fontSize: 15, lineHeight: 1, textDecoration: 'none', '&:hover': { color: '#1A2633' } }}>
                {item.label}
              </Typography>
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Button component={RouterLink} to={portalTo} variant="contained" sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: '12px', px: 2.25 }}>
            {session ? 'Open field portal' : 'Field portal'}
          </Button>
          <IconButton aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)} sx={{ display: { md: 'none' } }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>
        </Container>
        {menuOpen && (
          <Stack spacing={1} sx={{ display: { md: 'none' }, px: 2, pb: 2 }}>
            {NAV.map((item) => (
              <Typography key={item.href} component="a" href={item.href} onClick={() => setMenuOpen(false)} sx={{ color: '#5E7082', fontWeight: 700, textDecoration: 'none' }}>
                {item.label}
              </Typography>
            ))}
            <Button component={RouterLink} to={portalTo} variant="contained">
              {session ? 'Open field portal' : 'Field portal'}
            </Button>
          </Stack>
        )}
      </Box>

      <Container sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ display: 'grid', gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)' }, alignItems: 'center' }}>
          <Box sx={{ maxWidth: 620 }}>
            <Typography sx={{ color: '#E4570E', fontWeight: 800, letterSpacing: 0.3, mb: 1.5, fontSize: 15 }}>
              Reliable, professional, and sustainable media
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -1.2, fontSize: { xs: 36, md: 54 }, lineHeight: 1.08, color: '#1A2633' }}>
              Create a lasting impression with sustainable advertising.
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 540, fontSize: 17, lineHeight: 1.6, color: '#5E7082' }}>
              Vesne Private Limited manufactures outdoor and indoor advertising media for agencies, businesses, and startups — posters, hoardings, and wall paintings, executed in the field.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3.5, alignItems: { sm: 'center' } }}>
              <Button href="#contact" variant="contained" size="large" sx={{ borderRadius: '12px', px: 2.5 }}>Enquire now</Button>
              <Button component={RouterLink} to={portalTo} variant="outlined" size="large" sx={{ borderRadius: '12px', px: 2.5 }}>
                {session ? 'Continue in the portal' : 'See the field portal'}
              </Button>
            </Stack>
          </Box>
          <Box
            sx={{
              borderRadius: '20px',
              px: { xs: 3, md: 4 },
              py: { xs: 4, md: 5 },
              minHeight: 420,
              bgcolor: '#FFF8F4',
              border: '1px solid #F3E4D8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  minHeight: 148,
                  px: 3,
                  py: 3,
                  borderRadius: '16px',
                  background: 'linear-gradient(180deg, #F26A24 0%, #E4570E 100%)',
                  boxShadow: '0 16px 32px rgba(228, 87, 14, 0.22)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 24, md: 28 }, textAlign: 'center', lineHeight: 1.2 }}>
                  Your brand, on the street.
                </Typography>
              </Box>
              <Box sx={{ width: 14, height: 64, bgcolor: '#E7C3A4' }} />
              <Box sx={{ width: 78, height: 8, borderRadius: '99px', bgcolor: '#F0E2D6' }} />
            </Box>
            <Typography sx={{ mt: 3, color: '#5E7082', fontWeight: 700, textAlign: 'center' }}>
              Outdoor media · campaign board
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Posters', 'Hoardings', 'Wall paintings'].map((item) => (
                <Box key={item} sx={{ px: 1.5, py: 0.6, borderRadius: '999px', bgcolor: '#FFFFFF', border: '1px solid #F3E4D8', color: '#1A2633', fontSize: 13, fontWeight: 700 }}>
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: '#FFFFFF', borderTop: '1px solid #E6EEF2', borderBottom: '1px solid #E6EEF2' }}>
        <Container sx={{ py: { xs: 5, md: 7 } }}>
          <Typography sx={{ color: '#E4570E', fontWeight: 800, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' }}>Making an impact</Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 3, color: '#1A2633', maxWidth: 640 }}>Our track record starts in the field.</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, minmax(0, 1fr))' }, alignItems: 'stretch' }}>
            {FACTS.map((fact, index) => (
              <Box
                key={fact.value}
                sx={{
                  minHeight: 168,
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: ['#FFF5E0', '#E8F3FF', '#E1F8FB', '#E4F8E9'][index],
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography sx={{ color: '#E4570E', fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{fact.value}</Typography>
                <Typography sx={{ color: '#5E7082', mt: 1.25, fontSize: 14, lineHeight: 1.5 }}>{fact.label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container id="services" sx={{ py: { xs: 6, md: 9 } }}>
        <Typography sx={{ color: '#E4570E', fontWeight: 800, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' }}>Across India</Typography>
        <Typography variant="h4" sx={{ maxWidth: 680, mt: 1, color: '#1A2633' }}>We bring your brand to life with posters, hoardings, and wall paintings.</Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, mt: 3, alignItems: 'stretch' }}>
          {SERVICES.map((service) => {
            const Icon = service.icon
            return (
              <Box key={service.title} sx={{ p: 3, borderRadius: '16px', bgcolor: '#FFFFFF', border: '1px solid #E6EEF2', display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 260 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#FFF5E0', color: '#E4570E', display: 'grid', placeItems: 'center' }}>
                  <Icon size={20} />
                </Box>
                <Typography variant="h6" sx={{ color: '#1A2633' }}>{service.title}</Typography>
                <Typography sx={{ color: '#5E7082', flex: 1, lineHeight: 1.55 }}>{service.body}</Typography>
                <Button href="#contact" sx={{ alignSelf: 'flex-start', px: 0, fontWeight: 800 }}>{service.action}</Button>
              </Box>
            )
          })}
        </Box>
      </Container>

      <Box id="clients" sx={{ bgcolor: '#FFFFFF', borderTop: '1px solid #E6EEF2', borderBottom: '1px solid #E6EEF2' }}>
        <Container sx={{ py: { xs: 6, md: 8 } }}>
          <Typography variant="h4" sx={{ color: '#1A2633' }}>Clients working with us nationwide</Typography>
          <Typography sx={{ color: '#5E7082', mt: 1, mb: 3, maxWidth: 640, lineHeight: 1.55 }}>
            Names published on vesne.in. This page does not display their logos or claim a new endorsement.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, minmax(0, 1fr))' } }}>
            {CLIENTS.map((name) => (
              <Box key={name} sx={{ minHeight: 64, px: 2, borderRadius: '12px', bgcolor: '#F7FBFF', border: '1px solid #E6EEF2', fontWeight: 750, color: '#1A2633', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                {name}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container id="about" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' }, alignItems: 'start' }}>
          <Box>
            <Typography sx={{ color: '#E4570E', fontWeight: 800, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' }}>Word from the founder</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: '#1A2633' }}>Nitesh Gaddamidhi</Typography>
            <Typography sx={{ color: '#5E7082', fontWeight: 700, mt: 0.5 }}>Founder & CEO</Typography>
          </Box>
          <Typography sx={{ fontSize: 18, lineHeight: 1.7, color: '#1A2633' }}>
            Vesne Private Limited came into existence in April 2022. We were formerly known as Sri Lokapujya Enterprises since July 2015. We manufacture digital wall-painting media and non-plastic flex media, a recyclable material used for outdoor and indoor advertisement. Vesne is a reliable, professional media manufacturer with a healthy execution team, and we keep growing with a sustainable approach.
          </Typography>
        </Box>
      </Container>

      <Container sx={{ pb: { xs: 6, md: 9 } }}>
        <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: '20px', bgcolor: '#FFF8F4', border: '1px solid #F3E4D8' }}>
          <Typography sx={{ color: '#E4570E', fontWeight: 800, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' }}>Field execution portal</Typography>
          <Typography variant="h4" sx={{ maxWidth: 680, mt: 1, color: '#1A2633' }}>Proof of every poster, hoarding, and wall — from assignment to client sign-off.</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, my: 3, alignItems: 'stretch' }}>
            {[
              ['Assign', 'Create the campaign, sites, and user instructions.'],
              ['Capture', 'Upload the photograph and record the device location.'],
              ['Approve', 'Review the proof, then share only the approved work with the client.'],
            ].map(([title, body]) => (
              <Box key={title} sx={{ bgcolor: '#FFFFFF', borderRadius: '16px', p: 2.5, border: '1px solid #F3E4D8', minHeight: 140 }}>
                <Typography sx={{ fontWeight: 800, color: '#E4570E' }}>{title}</Typography>
                <Typography sx={{ color: '#5E7082', mt: 0.75, lineHeight: 1.5 }}>{body}</Typography>
              </Box>
            ))}
          </Box>
          <Button component={RouterLink} to={portalTo} variant="contained" size="large">
            {session ? 'Open your portal' : 'Open the field portal'}
          </Button>
        </Box>
      </Container>

      <Box id="contact" sx={{ bgcolor: '#fff', borderTop: '1px solid #E6EEF2' }}>
        <Container sx={{ py: { xs: 6, md: 9 } }}>
          <Typography variant="h4" sx={{ color: '#1A2633' }}>Contact us</Typography>
          <Typography sx={{ color: '#5E7082', mt: 1, mb: 3 }}>We are here to help you 7 days a week and respond within 24 hours.</Typography>
          <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' }, alignItems: 'start' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Mail size={18} color="#E4570E" />
                <Typography component="a" href="mailto:vesne009@gmail.com" sx={{ color: 'inherit', fontWeight: 700 }}>vesne009@gmail.com</Typography>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Phone size={18} color="#E4570E" />
                <Typography component="a" href="tel:+917799182345" sx={{ color: 'inherit', fontWeight: 700 }}>+91 77991 82345</Typography>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <MapPin size={18} color="#E4570E" />
                <Typography>Alcazar Mall 498, 3rd Floor, Road number 36, Jubilee Hills, Hyderabad - 500033</Typography>
              </Stack>
              <Button
                component="a"
                href="https://wa.me/917799182345?text=Hello%20Vesne%2C%20I%20would%20like%20to%20enquire%20about%20outdoor%20advertising."
                target="_blank"
                rel="noreferrer"
                variant="outlined"
              >
                Chat on WhatsApp
              </Button>
            </Stack>
            <Box component="form" onSubmit={submitEnquiry} sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField name="firstName" label="First name" required />
              <TextField name="lastName" label="Last name" required />
              <TextField name="email" type="email" label="Email" required sx={{ gridColumn: { sm: '1 / -1' } }} />
              <TextField name="number" label="Number" required sx={{ gridColumn: { sm: '1 / -1' } }} />
              <TextField name="message" label="Message" required multiline minRows={4} sx={{ gridColumn: { sm: '1 / -1' } }} />
              {sent && (
                <Alert severity="success" sx={{ gridColumn: { sm: '1 / -1' } }}>
                  Enquiry noted in this browser only. A production site would send this to Vesne. For a real conversation, use the email, phone, or WhatsApp details above.
                </Alert>
              )}
              <Button type="submit" variant="contained" size="large" sx={{ justifySelf: 'start' }}>Send</Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid #E6EEF2', py: 3 }}>
        <Container sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <VesneLogo height={40} />
          <Typography variant="body2" sx={{ color: '#5E7082' }}>
            Vesne Private Limited · Jubilee Hills, Hyderabad · Public site content follows vesne.in
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}
