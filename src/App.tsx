import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store'
import PlayerSetup from './components/PlayerSetup'
import Roster from './components/Roster'
import Layouts from './components/Layouts'
import Settings from './components/Settings'
import EaAuthLab from './components/EaAuthLab'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

const NAV_ITEMS = [
  { id: 'roster',   label: 'Roster',   icon: '👥' },
  { id: 'layouts',  label: 'Layouts',  icon: '💾' },
  { id: 'settings', label: 'Réglages', icon: '⚙️' },
  { id: 'lab',      label: 'Lab',      icon: '⚗️' },
] as const

function AppContent() {
  const { playerData, activeTab, setActiveTab } = useAppStore()

  if (!playerData) return <PlayerSetup />

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0e1a' }}>
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ background: '#0d1424', borderBottom: '1px solid #1e3a5f' }}
      >
        <span className="text-blue-400 font-bold text-lg">⚡ SWGOH Mods</span>
        <span className="text-slate-400 text-sm">{playerData.name}</span>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'roster'   && <Roster />}
        {activeTab === 'layouts'  && <Layouts />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'lab'      && <EaAuthLab />}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 flex"
        style={{ background: '#0d1424', borderTop: '1px solid #1e3a5f' }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors"
            style={{ color: activeTab === item.id ? '#3b82f6' : '#64748b' }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
