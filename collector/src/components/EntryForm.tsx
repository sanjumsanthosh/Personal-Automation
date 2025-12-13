import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase.client'
import { TypeSelector } from './TypeSelector'

export function EntryForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      typeIds: [] as string[],
      content: '',
    },
    onSubmit: async ({ value }) => {
      await createEntry.mutateAsync(value)
      form.reset()
      setOpen(false)
    },
  })

  const createEntry = useMutation({
    mutationFn: async (data: { typeIds: string[]; content: string }) => {
      const entries = data.typeIds.map((typeId) => ({
        type_id: typeId,
        content: data.content,
        status: 'pending',
      }))
      return supabase.from('entries').insert(entries)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
    },
  })

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    form.setFieldValue('content', text)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <Label>Type(s)</Label>
            <form.Field name="typeIds">
              {(field) => (
                <TypeSelector value={field.state.value} onChange={field.handleChange} />
              )}
            </form.Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Content</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handlePaste}>
                <Clipboard className="h-4 w-4 mr-1" />
                Paste
              </Button>
            </div>
            <form.Field name="content">
              {(field) => (
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter content or paste from clipboard..."
                  rows={6}
                />
              )}
            </form.Field>
          </div>

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
