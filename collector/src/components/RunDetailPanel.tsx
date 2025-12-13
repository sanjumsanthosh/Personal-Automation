import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase.client'
import { logger } from '@/lib/logger'
import type { Run, RunStatus, Entry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Play, Trash2, FileText, X, Plus, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'

interface RunWithType extends Run {
    types: { name: string } | null
    entries?: Array<{ id: string; content: string; status: string; created_at: string }>
}

interface RunDetailPanelProps {
    runId: string
    onClose: () => void
    onOpenAddEntries: () => void
}

const statusConfig: Record<RunStatus, { emoji: string; color: string; label: string }> = {
    created: { emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Created' },
    running: { emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Running' },
    completed: { emoji: '✅', color: 'bg-green-100 text-green-800 border-green-300', label: 'Completed' },
    failed: { emoji: '❌', color: 'bg-red-100 text-red-800 border-red-300', label: 'Failed' },
}

export function RunDetailPanel({ runId, onClose, onOpenAddEntries }: RunDetailPanelProps) {
    const queryClient = useQueryClient()
    const [webhookError, setWebhookError] = useState<string | null>(null)

    const { data: run, isLoading } = useQuery({
        queryKey: ['run', runId],
        queryFn: async () => {
            logger.info('RunDetailPanel', 'Fetching run details', { runId })
            const res = await fetch(`/api/v1/run/${runId}`)
            if (!res.ok) {
                logger.error('RunDetailPanel', 'Failed to fetch run', undefined, { runId, status: res.status })
                throw new Error('Failed to fetch run')
            }
            const data = await res.json() as RunWithType
            logger.info('RunDetailPanel', 'Run details fetched', { runId, status: data.status, entriesCount: data.entries?.length })
            return data
        },
    })

    const updateRunMutation = useMutation({
        mutationFn: async (data: { status?: RunStatus; started_at?: string }) => {
            logger.info('RunDetailPanel', 'Updating run', { runId, updateData: data })
            const res = await fetch(`/api/v1/run/${runId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            const result = await res.json()
            logger.info('RunDetailPanel', 'Run updated', { runId, status: res.status })
            return result
        },
        onSuccess: () => {
            logger.info('RunDetailPanel', 'Update mutation successful', { runId })
            queryClient.invalidateQueries({ queryKey: ['run', runId] })
            queryClient.invalidateQueries({ queryKey: ['runs'] })
        },
        onError: (error) => {
            logger.error('RunDetailPanel', 'Update mutation failed', error, { runId })
        },
    })

    const deleteRunMutation = useMutation({
        mutationFn: async () => {
            logger.info('RunDetailPanel', 'Deleting run', { runId })
            const res = await fetch(`/api/v1/run/${runId}`, { method: 'DELETE' })
            const result = await res.json()
            logger.info('RunDetailPanel', 'Run deleted', { runId, status: res.status })
            return result
        },
        onSuccess: () => {
            logger.info('RunDetailPanel', 'Delete mutation successful', { runId })
            queryClient.invalidateQueries({ queryKey: ['runs'] })
            onClose()
        },
        onError: (error) => {
            logger.error('RunDetailPanel', 'Delete mutation failed', error, { runId })
        },
    })

    const removeEntryFromRun = useMutation({
        mutationFn: async (entryId: string) => {
            logger.info('RunDetailPanel', 'Removing entry from run', { runId, entryId })
            const { error } = await supabase
                .from('entries')
                .update({ run_id: null, status: 'pending' })
                .eq('id', entryId)
            if (error) {
                logger.error('RunDetailPanel', 'Failed to remove entry', error, { runId, entryId })
                throw error
            }
            logger.info('RunDetailPanel', 'Entry removed successfully', { runId, entryId })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['run', runId] })
        },
        onError: (error) => {
            logger.error('RunDetailPanel', 'Remove entry mutation failed', error, { runId })
        },
    })

    const handleRunNow = async () => {
        setWebhookError(null)
        logger.info('RunDetailPanel', 'Run now button clicked', { runId })

        try {
            // Update status to running
            logger.info('RunDetailPanel', 'Updating run status to running', { runId })
            await updateRunMutation.mutateAsync({
                status: 'running',
                started_at: new Date().toISOString(),
            })

            // Call server-side trigger endpoint (not directly to n8n)
            logger.info('RunDetailPanel', 'Triggering run via server', { runId })

            const response = await fetch(`/api/v1/run/${runId}/trigger`, { method: 'POST' })
            const result = await response.json()

            logger.info('RunDetailPanel', 'Server trigger response', {
                runId,
                status: response.status,
                success: result.success
            })

            if (!response.ok) {
                logger.error('RunDetailPanel', 'Server trigger failed', undefined, {
                    runId,
                    status: response.status,
                    error: result.error
                })
                throw new Error(result.error || `Server returned ${response.status}`)
            }

            logger.info('RunDetailPanel', 'Run triggered successfully', { runId })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            logger.error('RunDetailPanel', 'Trigger error', error, { runId })
            setWebhookError(`Failed to trigger run: ${errorMessage}`)

            // Revert status back to created if trigger failed
            try {
                logger.info('RunDetailPanel', 'Reverting run status to created', { runId })
                await updateRunMutation.mutateAsync({
                    status: 'created',
                    started_at: undefined,
                })
            } catch (revertError) {
                logger.error('RunDetailPanel', 'Failed to revert status', revertError, { runId })
            }
        }
    }

    if (isLoading || !run) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                Loading...
            </div>
        )
    }

    const config = statusConfig[run.status]

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold truncate">{run.name}</h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-5 w-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Status & Info */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${config.color}`}>
                            {config.emoji} {config.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <div className="text-gray-500">Type</div>
                            <div className="font-medium">{run.types?.name || 'Unknown'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Limit</div>
                            <div className="font-medium">{run.limit_count}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Created</div>
                            <div className="font-medium">{format(new Date(run.created_at), 'MMM d, yyyy h:mm a')}</div>
                        </div>
                        {run.started_at && (
                            <div>
                                <div className="text-gray-500">Started</div>
                                <div className="font-medium">{formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}</div>
                            </div>
                        )}
                        {run.completed_at && (
                            <div>
                                <div className="text-gray-500">Completed</div>
                                <div className="font-medium">{format(new Date(run.completed_at), 'MMM d, yyyy h:mm a')}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Timeline</h3>
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`px-2 py-1 rounded ${run.status === 'created' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                            Created
                        </div>
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className={`px-2 py-1 rounded ${run.status === 'running' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            Running
                        </div>
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className={`px-2 py-1 rounded ${run.status === 'completed' ? 'bg-green-100' : run.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'}`}>
                            {run.status === 'failed' ? 'Failed' : 'Completed'}
                        </div>
                    </div>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                            Entries ({run.entries?.length || 0})
                        </h3>
                        {run.status === 'created' && (
                            <Button size="sm" variant="outline" onClick={onOpenAddEntries}>
                                <Plus className="h-3 w-3 mr-1" /> Add entries
                            </Button>
                        )}
                    </div>

                    {run.entries && run.entries.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {run.entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start justify-between p-2 rounded border border-gray-200 bg-gray-50 text-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate">{entry.content}</p>
                                        <p className="text-xs text-gray-500">{entry.status}</p>
                                    </div>
                                    {run.status === 'created' && (
                                        <button
                                            onClick={() => removeEntryFromRun.mutate(entry.id)}
                                            className="p-1 hover:bg-gray-200 rounded ml-2"
                                        >
                                            <X className="h-3 w-3 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No entries in this run yet.</p>
                    )}
                </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-gray-200 p-4 space-y-2">
                {webhookError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{webhookError}</span>
                    </div>
                )}
                {run.status === 'created' && (
                    <div className="flex gap-2">
                        <Button
                            className="flex-1"
                            onClick={handleRunNow}
                            disabled={updateRunMutation.isPending || !run.entries?.length}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {updateRunMutation.isPending ? 'Starting...' : 'Run now'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (confirm('Delete this run?')) {
                                    deleteRunMutation.mutate()
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {run.status === 'completed' && (
                    <Link to="/reports" search={{ runId: runId }} className="w-full block">
                        <Button className="w-full" variant="outline">
                            <FileText className="h-4 w-4 mr-2" /> View Report
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
