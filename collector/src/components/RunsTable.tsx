import { useMemo, useState } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    type ColumnDef,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase.client'
import { logger } from '@/lib/logger'
import type { Run, RunStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Play, FileText, Trash2, Eye } from 'lucide-react'

interface RunWithType extends Run {
    types: { name: string } | null
}

const columnHelper = createColumnHelper<RunWithType>()

const statusConfig: Record<RunStatus, { emoji: string; color: string; label: string }> = {
    created: { emoji: '🟡', color: 'bg-yellow-100 text-yellow-800', label: 'Created' },
    running: { emoji: '🔵', color: 'bg-blue-100 text-blue-800', label: 'Running' },
    completed: { emoji: '✅', color: 'bg-green-100 text-green-800', label: 'Completed' },
    failed: { emoji: '❌', color: 'bg-red-100 text-red-800', label: 'Failed' },
}

interface RunsTableProps {
    onSelectRun: (run: RunWithType | null) => void
    selectedRunId: string | null
}

export function RunsTable({ onSelectRun, selectedRunId }: RunsTableProps) {
    const queryClient = useQueryClient()

    const { data: runs = [], isLoading } = useQuery({
        queryKey: ['runs'],
        queryFn: async () => {
            logger.info('RunsTable', 'Fetching runs from Supabase')
            const { data, error } = await supabase
                .from('processing_runs')
                .select('*, types:type_id(name)')
                .order('created_at', { ascending: false })

            if (error) {
                logger.error('RunsTable', 'Failed to fetch runs', error)
                throw error
            }
            logger.info('RunsTable', 'Runs fetched successfully', { count: data?.length || 0 })
            return (data || []) as RunWithType[]
        },
    })

    const updateRunMutation = useMutation({
        mutationFn: async ({ id, ...data }: { id: string; status?: RunStatus; started_at?: string }) => {
            logger.info('RunsTable', 'Updating run', { id, updateData: data })
            const res = await fetch(`/api/v1/run/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            const result = await res.json()
            logger.info('RunsTable', 'Run updated', { id, status: res.status })
            return result
        },
        onSuccess: () => {
            logger.info('RunsTable', 'Update mutation successful')
            queryClient.invalidateQueries({ queryKey: ['runs'] })
        },
        onError: (error) => {
            logger.error('RunsTable', 'Update mutation failed', error)
        },
    })

    const deleteRunMutation = useMutation({
        mutationFn: async (id: string) => {
            logger.info('RunsTable', 'Deleting run', { id })
            const res = await fetch(`/api/v1/run/${id}`, { method: 'DELETE' })
            const result = await res.json()
            logger.info('RunsTable', 'Run deleted', { id, status: res.status })
            return result
        },
        onSuccess: () => {
            logger.info('RunsTable', 'Delete mutation successful')
            queryClient.invalidateQueries({ queryKey: ['runs'] })
            onSelectRun(null)
        },
        onError: (error) => {
            logger.error('RunsTable', 'Delete mutation failed', error)
        },
    })

    const handleRunNow = async (run: RunWithType) => {
        logger.info('RunsTable', 'Run now triggered', { runId: run.id, runName: run.name })

        // Update status to running
        await updateRunMutation.mutateAsync({
            id: run.id,
            status: 'running',
            started_at: new Date().toISOString(),
        })

        // Trigger n8n webhook (fire and forget)
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
        if (webhookUrl) {
            logger.info('RunsTable', 'Triggering n8n webhook (deprecated - should use server endpoint)', {
                runId: run.id,
                webhookUrl
            })
            fetch(`${webhookUrl}?runId=${run.id}`)
                .then(() => logger.info('RunsTable', 'Webhook triggered', { runId: run.id }))
                .catch((error) => logger.error('RunsTable', 'Webhook failed', error, { runId: run.id }))
        } else {
            logger.warn('RunsTable', 'No webhook URL configured', { runId: run.id })
        }
    }

    const columns = useMemo<ColumnDef<RunWithType, unknown>[]>(
        () => [
            columnHelper.accessor('status', {
                header: 'Status',
                cell: (info) => {
                    const status = info.getValue() as RunStatus
                    const config = statusConfig[status]
                    return (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${config.color}`}>
                            {config.emoji} {config.label}
                        </span>
                    )
                },
                size: 120,
            }),
            columnHelper.accessor('name', {
                header: 'Run Name',
                cell: (info) => <span className="font-medium">{info.getValue()}</span>,
            }),
            columnHelper.accessor('types', {
                header: 'Type',
                cell: (info) => info.getValue()?.name || 'Unknown',
                size: 150,
            }),
            columnHelper.accessor('limit_count', {
                header: 'Limit',
                cell: (info) => info.getValue(),
                size: 80,
            }),
            columnHelper.accessor('created_at', {
                header: 'Created',
                cell: (info) => {
                    const date = new Date(info.getValue())
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                size: 160,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const run = row.original
                    return (
                        <div className="flex gap-1">
                            {run.status === 'created' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRunNow(run)
                                        }}
                                        disabled={updateRunMutation.isPending}
                                    >
                                        <Play className="h-3 w-3 mr-1" /> Run
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm('Delete this run?')) {
                                                deleteRunMutation.mutate(run.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                            {run.status === 'running' && (
                                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                                    <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                            )}
                            {run.status === 'completed' && (
                                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                                    <FileText className="h-3 w-3 mr-1" /> Report
                                </Button>
                            )}
                        </div>
                    )
                },
                size: 180,
            }),
        ],
        [updateRunMutation.isPending, deleteRunMutation]
    )

    const table = useReactTable({
        data: runs,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">Loading runs...</div>
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
                <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                                    style={{ width: header.getSize() }}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                                No runs yet. Create your first run to get started.
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`cursor-pointer hover:bg-gray-50 ${selectedRunId === row.original.id ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => onSelectRun(row.original)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-3 text-sm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
