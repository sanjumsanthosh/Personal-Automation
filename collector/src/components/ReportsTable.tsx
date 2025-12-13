import { useMemo } from 'react'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    type ColumnDef,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase.client'
import type { Report, ReportStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Eye, Check } from 'lucide-react'
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
                    </div>
                ),
                size: 140,
            }),
        ],
        [onSelectReport]
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
