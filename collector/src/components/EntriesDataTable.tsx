import * as React from 'react'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal, Trash2, Pencil, Settings2, LayoutGrid, LayoutList, Play } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { Entry, EntryStatus, Type } from '@/lib/types'

interface EntryWithRun extends Entry {
    processing_runs?: { name: string; status: string } | null
}

interface EntriesDataTableProps {
    data: EntryWithRun[]
    types: Type[]
    onEdit: (id: string, updates: { content?: string; type_id?: string; status?: EntryStatus }) => void
    onBulkEdit: (ids: string[], updates: { type_id?: string; status?: EntryStatus }) => void
    onDelete: (id: string) => void
    onBulkDelete: (ids: string[]) => void
    isLoading?: boolean
}

const STATUS_OPTIONS: { value: EntryStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { value: 'processed', label: 'Processed', color: 'bg-green-100 text-green-800' },
    { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800' },
]

const RUN_STATUS_COLORS: Record<string, string> = {
    created: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    running: 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    failed: 'bg-red-100 text-red-700 border-red-300',
}

// Hook for detecting mobile screen
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [breakpoint])

    return isMobile
}

// Single Entry Edit Popover
function EditPopover({
    entry,
    types,
    onSave,
    children,
}: {
    entry: Entry
    types: Type[]
    onSave: (updates: { content?: string; type_id?: string; status?: EntryStatus }) => void
    children: React.ReactNode
}) {
    const [open, setOpen] = React.useState(false)
    const [content, setContent] = React.useState(entry.content)
    const [typeId, setTypeId] = React.useState(entry.type_id)
    const [status, setStatus] = React.useState<EntryStatus>(entry.status)

    const handleSave = () => {
        onSave({ content, type_id: typeId, status })
        setOpen(false)
    }

    React.useEffect(() => {
        if (open) {
            setContent(entry.content)
            setTypeId(entry.type_id)
            setStatus(entry.status)
        }
    }, [open, entry])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-96" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Edit Entry</h4>
                        <p className="text-sm text-muted-foreground">
                            Update the entry details below.
                        </p>
                    </div>
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                className="text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={typeId} onValueChange={setTypeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as EntryStatus)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// Bulk Edit Popover
function BulkEditPopover({
    selectedCount,
    types,
    onSave,
    children,
}: {
    selectedCount: number
    types: Type[]
    onSave: (updates: { type_id?: string; status?: EntryStatus }) => void
    children: React.ReactNode
}) {
    const [open, setOpen] = React.useState(false)
    const [typeId, setTypeId] = React.useState<string>('')
    const [status, setStatus] = React.useState<string>('')

    const handleSave = () => {
        const updates: { type_id?: string; status?: EntryStatus } = {}
        if (typeId) updates.type_id = typeId
        if (status) updates.status = status as EntryStatus
        if (Object.keys(updates).length > 0) {
            onSave(updates)
        }
        setOpen(false)
        setTypeId('')
        setStatus('')
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Bulk Edit</h4>
                        <p className="text-sm text-muted-foreground">
                            Update {selectedCount} selected entries.
                        </p>
                    </div>
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="bulk-type">Type</Label>
                            <Select value={typeId} onValueChange={setTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Keep current" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bulk-status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Keep current" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Update {selectedCount} Entries
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

// Entry Card Component for Card View
function EntryCard({
    entry,
    types,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
}: {
    entry: EntryWithRun
    types: Type[]
    isSelected: boolean
    onSelect: (checked: boolean) => void
    onEdit: (updates: { content?: string; type_id?: string; status?: EntryStatus }) => void
    onDelete: () => void
}) {
    const getTypeName = (typeId: string) => types.find((t) => t.id === typeId)?.name || 'Unknown'
    const statusOption = STATUS_OPTIONS.find((s) => s.value === entry.status)

    return (
        <Card className={`transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onSelect}
                        className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-3 mb-2">{entry.content}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {getTypeName(entry.type_id)}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${statusOption?.color || 'bg-gray-100'}`}>
                                {statusOption?.label || entry.status}
                            </span>
                            {entry.processing_runs && (
                                <Link
                                    to="/runs"
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${RUN_STATUS_COLORS[entry.processing_runs.status] || 'bg-gray-100'}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Play className="h-3 w-3" />
                                    <span className="truncate max-w-[80px]">{entry.processing_runs.name}</span>
                                </Link>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <EditPopover entry={entry} types={types} onSave={onEdit}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </EditPopover>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => {
                                if (confirm('Delete this entry?')) onDelete()
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function EntriesDataTable({
    data,
    types,
    onEdit,
    onBulkEdit,
    onDelete,
    onBulkDelete,
    isLoading,
}: EntriesDataTableProps) {
    const isMobile = useIsMobile()
    const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    // Auto-switch to card view on mobile
    React.useEffect(() => {
        setViewMode(isMobile ? 'card' : 'table')
    }, [isMobile])

    const getTypeName = React.useCallback(
        (typeId: string) => {
            const type = types.find((t) => t.id === typeId)
            return type?.name || 'Unknown'
        },
        [types]
    )

    const selectedRows = Object.keys(rowSelection).filter((key) => rowSelection[key as keyof typeof rowSelection])
    const selectedEntries = data.filter((_, index) => selectedRows.includes(String(index)))

    const handleBulkEdit = (updates: { type_id?: string; status?: EntryStatus }) => {
        const ids = selectedEntries.map((e) => e.id)
        onBulkEdit(ids, updates)
        setRowSelection({})
    }

    const handleBulkDelete = () => {
        if (confirm(`Delete ${selectedEntries.length} entries?`)) {
            const ids = selectedEntries.map((e) => e.id)
            onBulkDelete(ids)
            setRowSelection({})
        }
    }

    const columns: ColumnDef<EntryWithRun>[] = React.useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && 'indeterminate')
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'content',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Content
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="max-w-md truncate" title={row.original.content}>
                        {row.original.content}
                    </div>
                ),
            },
            {
                accessorKey: 'type_id',
                header: 'Type',
                cell: ({ row }) => (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {getTypeName(row.original.type_id)}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const statusOption = STATUS_OPTIONS.find((s) => s.value === row.original.status)
                    return (
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${statusOption?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusOption?.label || row.original.status}
                        </span>
                    )
                },
            },
            {
                id: 'run',
                header: 'Run',
                cell: ({ row }) => {
                    const entry = row.original
                    if (!entry.processing_runs) {
                        return <span className="text-gray-400 text-xs">—</span>
                    }
                    return (
                        <Link
                            to="/runs"
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${RUN_STATUS_COLORS[entry.processing_runs.status] || 'bg-gray-100'}`}
                        >
                            <Play className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{entry.processing_runs.name}</span>
                        </Link>
                    )
                },
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
            },
            {
                accessorKey: 'modified_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Modified
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => new Date(row.getValue('modified_at')).toLocaleDateString(),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const entry = row.original
                    return (
                        <div className="flex items-center gap-1">
                            <EditPopover
                                entry={entry}
                                types={types}
                                onSave={(updates) => onEdit(entry.id, updates)}
                            >
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </EditPopover>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(entry.id)}>
                                        Copy ID
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(entry.content)}>
                                        Copy Content
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (confirm('Delete this entry?')) {
                                                onDelete(entry.id)
                                            }
                                        }}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                },
            },
        ],
        [getTypeName, types, onDelete, onEdit]
    )

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center py-4 gap-2">
                <Input
                    placeholder="Filter content..."
                    value={(table.getColumn('content')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('content')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                {/* Bulk actions when rows are selected */}
                {selectedEntries.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {selectedEntries.length} selected
                        </span>
                        <BulkEditPopover
                            selectedCount={selectedEntries.length}
                            types={types}
                            onSave={handleBulkEdit}
                        >
                            <Button variant="outline" size="sm">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Bulk Edit
                            </Button>
                        </BulkEditPopover>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setViewMode('table')}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8"
                            onClick={() => setViewMode('card')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    {viewMode === 'table' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id.replace('_', ' ')}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="h-24 flex items-center justify-center text-gray-500">
                    Loading...
                </div>
            ) : viewMode === 'card' ? (
                /* Card View */
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                            <EntryCard
                                key={row.id}
                                entry={row.original}
                                types={types}
                                isSelected={row.getIsSelected()}
                                onSelect={(checked) => row.toggleSelected(checked)}
                                onEdit={(updates) => onEdit(row.original.id, updates)}
                                onDelete={() => onDelete(row.original.id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 text-gray-500">
                            No entries found.
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No entries found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-gray-500">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
