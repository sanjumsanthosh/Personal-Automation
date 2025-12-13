import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase.client'
import type { Entry } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface AddEntriesToRunModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    runId: string
    typeId: string
}

export function AddEntriesToRunModal({ open, onOpenChange, runId, typeId }: AddEntriesToRunModalProps) {
    const queryClient = useQueryClient()
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['pending-entries', typeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('entries')
                .select('*')
                .eq('type_id', typeId)
                .eq('status', 'pending')
                .is('run_id', null)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as Entry[]
        },
        enabled: open && !!typeId,
    })

    const addEntriesMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('entries')
                .update({ run_id: runId, status: 'processing' })
                .in('id', selectedIds)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['run', runId] })
            queryClient.invalidateQueries({ queryKey: ['pending-entries', typeId] })
            queryClient.invalidateQueries({ queryKey: ['entries'] })
            setSelectedIds([])
            onOpenChange(false)
        },
    })

    const toggleEntry = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedIds.length === entries.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(entries.map((e) => e.id))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Entries to Run</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-gray-500">Loading entries...</div>
                ) : entries.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        No pending entries of this type available.
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between py-2 border-b">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedIds.length === entries.length && entries.length > 0}
                                    onCheckedChange={toggleAll}
                                />
                                <span className="text-sm text-gray-600">
                                    {selectedIds.length} of {entries.length} selected
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 py-2">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${selectedIds.includes(entry.id)
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    onClick={() => toggleEntry(entry.id)}
                                >
                                    <Checkbox
                                        checked={selectedIds.includes(entry.id)}
                                        onCheckedChange={() => toggleEntry(entry.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm line-clamp-2">{entry.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t">
                            <Button
                                className="w-full"
                                onClick={() => addEntriesMutation.mutate()}
                                disabled={selectedIds.length === 0 || addEntriesMutation.isPending}
                            >
                                {addEntriesMutation.isPending
                                    ? 'Adding...'
                                    : `Add ${selectedIds.length} ${selectedIds.length === 1 ? 'entry' : 'entries'} to run`}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
