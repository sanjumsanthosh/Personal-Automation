import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RunsTable } from '../components/RunsTable'
import { RunDetailPanel } from '../components/RunDetailPanel'
import { CreateRunModal } from '../components/CreateRunModal'
import { AddEntriesToRunModal } from '../components/AddEntriesToRunModal'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'
import type { Run } from '../lib/types'

interface RunWithType extends Run {
    types: { name: string } | null
    entries?: Array<{ id: string; content: string; status: string; created_at: string }>
}

export const Route = createFileRoute('/runs')({
    component: RunsPage,
})

function RunsPage() {
    const [selectedRun, setSelectedRun] = useState<RunWithType | null>(null)
    const [createRunOpen, setCreateRunOpen] = useState(false)
    const [addEntriesOpen, setAddEntriesOpen] = useState(false)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-900">Processing Runs</h1>
                    <Button onClick={() => setCreateRunOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Run
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex h-[calc(100vh-130px)]">
                {/* Left: Runs Table */}
                <div className="flex-1 p-4 overflow-auto">
                    <RunsTable
                        onSelectRun={setSelectedRun}
                        selectedRunId={selectedRun?.id || null}
                    />
                </div>

                {/* Right: Run Detail Panel */}
                {selectedRun && (
                    <div className="w-96 border-l border-gray-200 overflow-hidden">
                        <RunDetailPanel
                            runId={selectedRun.id}
                            onClose={() => setSelectedRun(null)}
                            onOpenAddEntries={() => setAddEntriesOpen(true)}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateRunModal
                open={createRunOpen}
                onOpenChange={setCreateRunOpen}
            />
            {selectedRun && (
                <AddEntriesToRunModal
                    open={addEntriesOpen}
                    onOpenChange={setAddEntriesOpen}
                    runId={selectedRun.id}
                    typeId={selectedRun.type_id}
                />
            )}
        </div>
    )
}
