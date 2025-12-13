import { useState } from 'react'
import { TypeSelector } from './components/TypeSelector.tsx'
import { EntryForm } from './components/EntryForm.tsx'
import { EntriesTable } from './components/EntriesTable.tsx'

export default function App() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'archive'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Collector</h1>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-8">
            {['dashboard', 'explore', 'archive'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`border-b-2 py-4 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <TypeSelector 
              value={selectedTypes} 
              onChange={setSelectedTypes} 
            />
            
            {selectedTypes.length > 0 && (
              <>
                <EntryForm />
                <EntriesTable selectedTypes={selectedTypes} status="pending" />
              </>
            )}
          </div>
        )}

        {activeTab === 'explore' && (
          <div>Explore Tab - Coming soon</div>
        )}

        {activeTab === 'archive' && (
          <div>Archive Tab - Coming soon</div>
        )}
      </main>
    </div>
  )
}

