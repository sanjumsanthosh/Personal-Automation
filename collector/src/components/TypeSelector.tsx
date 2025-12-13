import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase.client'
import type { Type } from '@/lib/types'

export function TypeSelector({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const queryClient = useQueryClient()

  const { data: types = [] } = useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const { data } = await supabase.from('types').select('*').order('name')
      return data as Type[]
    },
  })

  const createType = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('types').insert({ name }).select().single()
      if (error) throw error
      return data as Type
    },
    onSuccess: (newType) => {
      queryClient.invalidateQueries({ queryKey: ['types'] })
      setNewTypeName('')
      setAddOpen(false)
      // Auto-select the new type
      onChange([...value, newType.id])
    },
  })

  const toggleType = (typeId: string) => {
    onChange(
      value.includes(typeId)
        ? value.filter((id) => id !== typeId)
        : [...value, typeId]
    )
  }

  const selectedLabels = types
    .filter((t: Type) => value.includes(t.id))
    .map((t: Type) => t.name)
    .join(', ')

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between truncate"
          >
            <span className="truncate">{selectedLabels || 'Select types...'}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search types..." />
            <CommandList>
              <CommandEmpty>No types found.</CommandEmpty>
              <CommandGroup>
                {types.map((type: Type) => (
                  <CommandItem
                    key={type.id}
                    value={type.name}
                    onSelect={() => toggleType(type.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(type.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {type.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Add new type">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Type</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newTypeName.trim()) {
                createType.mutate(newTypeName.trim())
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="typeName">Type Name</Label>
              <Input
                id="typeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., AI Research"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={!newTypeName.trim() || createType.isPending}>
              {createType.isPending ? 'Creating...' : 'Create Type'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
