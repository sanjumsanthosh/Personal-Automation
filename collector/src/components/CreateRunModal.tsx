import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase.client'
import { logger } from '@/lib/logger'
import type { Type } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface CreateRunModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRunModal({ open, onOpenChange }: CreateRunModalProps) {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [typeId, setTypeId] = useState('')
    const [limit, setLimit] = useState(5)
    const [autoAdd, setAutoAdd] = useState(true)

    const { data: types = [] } = useQuery({
        queryKey: ['types'],
        queryFn: async () => {
            logger.info('CreateRunModal', 'Fetching types from Supabase')
            const { data } = await supabase.from('types').select('*').order('name')
            logger.info('CreateRunModal', 'Types fetched', { count: data?.length || 0 })
            return data as Type[]
        },
    })

    const createRunMutation = useMutation({
        mutationFn: async () => {
            // Step 1: Create the run
            logger.info('CreateRunModal', 'Creating run', { name, typeId, limit })

            const createRes = await fetch('/api/v1/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    type_id: typeId,
                    limit_count: limit,
                }),
            })

            const createData = await createRes.json()
            logger.info('CreateRunModal', 'Create run response', {
                status: createRes.status,
                run_id: createData.run_id
            })

            const { run_id, error } = createData
            if (error) {
                logger.error('CreateRunModal', 'Failed to create run', error)
                throw new Error(error)
            }

            // Step 2: If auto-add is checked, claim entries
            if (autoAdd && run_id) {
                logger.info('CreateRunModal', 'Auto-add enabled, claiming entries', {
                    run_id,
                    typeId,
                    limit
                })

                const claimRes = await fetch(`/api/v1/run/${run_id}/claim`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type_id: typeId,
                        limit,
                    }),
                })

                const claimData = await claimRes.json()
                logger.info('CreateRunModal', 'Claim entries response', {
                    status: claimRes.status,
                    claimed_count: claimData.claimed_count
                })
            }

            return { run_id }
        },
        onSuccess: (data) => {
            logger.info('CreateRunModal', 'Run created successfully', { run_id: data.run_id })
            queryClient.invalidateQueries({ queryKey: ['runs'] })
            queryClient.invalidateQueries({ queryKey: ['entries'] })
            setName('')
            setTypeId('')
            setLimit(5)
            setAutoAdd(true)
            onOpenChange(false)
        },
        onError: (error) => {
            logger.error('CreateRunModal', 'Mutation failed', error)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && typeId) {
            createRunMutation.mutate()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Run</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="runName">Name</Label>
                        <Input
                            id="runName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., AI Papers Dec 13"
                            autoFocus
                        />
                    </div>

                    <div>
                        <Label htmlFor="runType">Type</Label>
                        <Select value={typeId} onValueChange={setTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type..." />
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

                    <div>
                        <Label htmlFor="runLimit">Limit (max 50)</Label>
                        <Input
                            id="runLimit"
                            type="number"
                            min={1}
                            max={50}
                            value={limit}
                            onChange={(e) => setLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 5)))}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="autoAdd"
                            checked={autoAdd}
                            onCheckedChange={(checked) => setAutoAdd(checked === true)}
                        />
                        <Label htmlFor="autoAdd" className="text-sm font-normal cursor-pointer">
                            Auto-add pending entries matching this type
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!name.trim() || !typeId || createRunMutation.isPending}
                    >
                        {createRunMutation.isPending ? 'Creating...' : 'Create Run'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
