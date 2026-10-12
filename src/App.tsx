import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './app/AppProvider.tsx'
import { AppRoutes } from './routes/AppRoutes.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
