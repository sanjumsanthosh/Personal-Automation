import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Inbox, Plus, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TypeSelector } from '@/components/TypeSelector'
import { EntriesDataTable } from '@/components/EntriesDataTable'
import { supabase } from '@/lib/supabase.client'
import type { Entry, EntryStatus, Type } from '@/lib/types'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)
  const [statusFilter, setStatusFilter] = useState<EntryStatus>('pending')
  const [addOpen, setAddOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTypeIds, setNewTypeIds] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: types = [] } = useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const { data } = await supabase.from('types').select('*').order('name')
      return data as Type[]
    },
  })

  // Auto-select all types on initial load
  useEffect(() => {
    if (types.length > 0 && !hasInitialized) {
      setSelectedTypes(types.map((t: Type) => t.id))
      setHasInitialized(true)
    }
  }, [types, hasInitialized])

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', selectedTypes, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('entries')
        .select('*')
        .eq('status', statusFilter)
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

  const createEntry = useMutation({
    mutationFn: async (data: { typeIds: string[]; content: string }) => {
      const entries = data.typeIds.map((typeId) => ({
        type_id: typeId,
        content: data.content,
        status: 'pending' as EntryStatus,
      }))
      return supabase.from('entries').insert(entries)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      setNewContent('')
      setNewTypeIds([])
      setAddOpen(false)
    },
  })

  const updateEntry = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { content?: string; type_id?: string; status?: EntryStatus } }) => {
      return supabase.from('entries').update(updates).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      return supabase.from('entries').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const bulkUpdateEntries = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: { type_id?: string; status?: EntryStatus } }) => {
      return supabase.from('entries').update(updates).in('id', ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const bulkDeleteEntries = useMutation({
    mutationFn: async (ids: string[]) => {
      return supabase.from('entries').delete().in('id', ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setNewContent(text)
  }

  const handleEdit = (id: string, updates: { content?: string; type_id?: string; status?: EntryStatus }) => {
    updateEntry.mutate({ id, updates })
  }

  const handleBulkEdit = (ids: string[], updates: { type_id?: string; status?: EntryStatus }) => {
    bulkUpdateEntries.mutate({ ids, updates })
  }

  const handleDelete = (id: string) => {
    deleteEntry.mutate(id)
  }

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteEntries.mutate(ids)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">Collector</h1>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type(s)</Label>
                  <TypeSelector value={newTypeIds} onChange={setNewTypeIds} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Content</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handlePaste}>
                      <Clipboard className="h-4 w-4 mr-1" />
                      Paste
                    </Button>
                  </div>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter content or paste from clipboard..."
                    rows={6}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createEntry.mutate({ typeIds: newTypeIds, content: newContent })}
                  disabled={!newContent.trim() || newTypeIds.length === 0}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div>
          <Label className="text-sm text-gray-600 mb-1 block">Filter by Type</Label>
          <TypeSelector value={selectedTypes} onChange={setSelectedTypes} />
        </div>
        <div className="flex gap-2">
          {(['pending', 'processed'] as EntryStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${statusFilter === status
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {selectedTypes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a type to view entries</p>
          </div>
        ) : (
          <EntriesDataTable
            data={entries}
            types={types}
            onEdit={handleEdit}
            onBulkEdit={handleBulkEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
