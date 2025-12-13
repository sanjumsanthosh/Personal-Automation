import { useMemo } from 'react'
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
import type { Report, ReportStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Eye, Check, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ReportWithRun extends Report {
    processing_runs: { name: string; type_id: string } | null
}

const columnHelper = createColumnHelper<ReportWithRun>()

const statusConfig: Record<ReportStatus, { color: string; label: string }> = {
    processed: { color: 'bg-blue-100 text-blue-800', label: 'Processed' },
    done: { color: 'bg-green-100 text-green-800', label: 'Done' },
}

interface ReportsTableProps {
    onSelectReport: (report: ReportWithRun | null) => void
    selectedReportId: string | null
}

export function ReportsTable({ onSelectReport, selectedReportId }: ReportsTableProps) {
    const queryClient = useQueryClient()

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*, processing_runs:run_id(name, type_id)')
                .order('created_at', { ascending: false })

            if (error) throw error
            return (data || []) as ReportWithRun[]
        },
    })

    // Delete report mutation - also resets associated entries and deletes associated run
    const deleteReportMutation = useMutation({
        mutationFn: async (report: ReportWithRun) => {
            logger.info('ReportsTable', 'Deleting report', { reportId: report.id, runId: report.run_id, entryIds: report.entry_ids })

            // First, delete associated entries
            if (report.entry_ids && report.entry_ids.length > 0) {
                const { error: entriesError } = await supabase
                    .from('entries')
                    .delete()
                    .in('id', report.entry_ids)

                if (entriesError) {
                    logger.error('ReportsTable', 'Failed to delete entries', entriesError, { reportId: report.id })
                    throw entriesError
                }
                logger.info('ReportsTable', 'Deleted entries', { count: report.entry_ids.length })
            }

            // Delete the report
            const { error: reportError } = await supabase
                .from('reports')
                .delete()
                .eq('id', report.id)

            if (reportError) {
                logger.error('ReportsTable', 'Failed to delete report', reportError, { reportId: report.id })
                throw reportError
            }

            // Delete the associated run if it exists
            if (report.run_id) {
                const { error: runError } = await supabase
                    .from('processing_runs')
                    .delete()
                    .eq('id', report.run_id)

                if (runError) {
                    logger.error('ReportsTable', 'Failed to delete run', runError, { runId: report.run_id })
                    // Don't throw here - report is already deleted, just log the error
                } else {
                    logger.info('ReportsTable', 'Run deleted successfully', { runId: report.run_id })
                }
            }

            logger.info('ReportsTable', 'Report deleted successfully', { reportId: report.id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            queryClient.invalidateQueries({ queryKey: ['entries'] })
            queryClient.invalidateQueries({ queryKey: ['runs'] })
            onSelectReport(null)
        },
        onError: (error) => {
            logger.error('ReportsTable', 'Delete report mutation failed', error)
        },
    })

    const columns = useMemo<ColumnDef<ReportWithRun, unknown>[]>(
        () => [
            columnHelper.accessor('created_at', {
                header: 'Date',
                cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
                size: 120,
            }),
            columnHelper.accessor('processing_runs', {
                header: 'Run',
                cell: (info) => info.getValue()?.name || '—',
                size: 180,
            }),
            columnHelper.accessor('summary', {
                header: 'Summary',
                cell: (info) => (
                    <div className="max-w-md truncate text-gray-600" title={info.getValue()}>
                        {info.getValue()}
                    </div>
                ),
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: (info) => {
                    const status = info.getValue() as ReportStatus
                    const config = statusConfig[status]
                    return (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${config.color}`}>
                            {config.label}
                        </span>
                    )
                },
                size: 100,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelectReport(row.original)
                            }}
                        >
                            <Eye className="h-3 w-3 mr-1" /> Read
                        </Button>
                        {row.original.status === 'processed' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Mark done action will be in preview panel
                                }}
                            >
                                <Check className="h-3 w-3" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                                e.stopPropagation()
                                const entryCount = row.original.entry_ids?.length || 0
                                const message = entryCount > 0
                                    ? `Delete this report, ${entryCount} entries, and associated run?`
                                    : 'Delete this report?'
                                if (confirm(message)) {
                                    deleteReportMutation.mutate(row.original)
                                }
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ),
                size: 180,
            }),
        ],
        [onSelectReport, deleteReportMutation]
    )

    const table = useReactTable({
        data: reports,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">Loading reports...</div>
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
                                No reports yet. Complete a run to generate reports.
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`cursor-pointer hover:bg-gray-50 ${selectedReportId === row.original.id ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => onSelectReport(row.original)}
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
