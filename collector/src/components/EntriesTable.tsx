import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase.client'
import type { EntryStatus } from '@/lib/types'
import { Play, FileText } from 'lucide-react'

interface EntryWithRelations {
  id: string
  type_id: string
  content: string
  status: EntryStatus
  run_id: string | null
  created_at: string
  modified_at: string
  processing_runs: { name: string; status: string } | null
  reports: { id: string; status: string } | null
}

const columnHelper = createColumnHelper<EntryWithRelations>()

export function EntriesTable({ selectedTypes, status = 'pending' }: { selectedTypes: string[]; status?: EntryStatus }) {
  const { data: entries = [] } = useQuery({
    queryKey: ['entries', selectedTypes, status],
    queryFn: async () => {
      let query = supabase
        .from('entries')
        .select(`
          *,
          processing_runs:run_id(name, status)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (selectedTypes.length > 0) {
        query = query.in('type_id', selectedTypes)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as EntryWithRelations[]
    },
    enabled: selectedTypes.length > 0,
  })

  const columns = useMemo<ColumnDef<EntryWithRelations, unknown>[]>(
    () => [
      columnHelper.display({ id: 'index', header: '#', cell: (info) => info.row.index + 1, size: 50 }),
      columnHelper.accessor('content', {
        header: 'Content',
        cell: (info) => <div className="max-w-md truncate">{info.getValue()}</div>
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
        size: 120
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const statusValue = info.getValue() as EntryStatus
          const statusColors: Record<EntryStatus, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            processed: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800',
          }
          return (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs ${statusColors[statusValue]}`}>
              {statusValue}
            </span>
          )
        },
        size: 100,
      }),
      columnHelper.accessor('processing_runs', {
        header: 'Run/Report',
        cell: (info) => {
          const run = info.getValue()
          const entry = info.row.original

          if (!run && !entry.run_id) {
            return <span className="text-gray-400 text-xs">—</span>
          }

          if (run) {
            return (
              <Link
                to="/runs"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Play className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{run.name}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${run.status === 'completed' ? 'bg-green-100 text-green-700' :
                    run.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      run.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                  }`}>
                  {run.status}
                </span>
              </Link>
            )
          }

          return <span className="text-gray-400 text-xs">—</span>
        },
        size: 180,
      }),
    ],
    []
  )

  const table = useReactTable({ data: entries, columns, getCoreRowModel: getCoreRowModel() })

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
          {entries.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                No entries found. Add some entries to get started.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
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
