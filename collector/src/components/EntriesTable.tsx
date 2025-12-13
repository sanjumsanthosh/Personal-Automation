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
import type { EntryStatus } from '@/lib/types'

interface Entry {
  id: string
  type_id: string
  content: string
  status: EntryStatus
  created_at: string
  modified_at: string
}

const columnHelper = createColumnHelper<Entry>()

export function EntriesTable({ selectedTypes, status = 'pending' }: { selectedTypes: string[]; status?: EntryStatus }) {
  const { data: entries = [] } = useQuery({
    queryKey: ['entries', selectedTypes, status],
    queryFn: async () => {
      let query = supabase
        .from('entries')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (selectedTypes.length > 0) {
        query = query.in('type_id', selectedTypes)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Entry[]
    },
    enabled: selectedTypes.length > 0,
  })

  const columns = useMemo<ColumnDef<Entry, any>[]>(
    () => [
      columnHelper.display({ id: 'index', header: '#', cell: (info) => info.row.index + 1, size: 50 }),
      columnHelper.accessor('content', { header: 'Content', cell: (info) => <div className="max-w-md truncate">{info.getValue()}</div> }),
      columnHelper.accessor('created_at', { header: 'Created', cell: (info) => new Date(info.getValue()).toLocaleDateString(), size: 120 }),
      columnHelper.accessor('modified_at', { header: 'Modified', cell: (info) => new Date(info.getValue()).toLocaleDateString(), size: 120 }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
            info.getValue() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            info.getValue() === 'processed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {info.getValue()}
          </span>
        ),
        size: 100,
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
