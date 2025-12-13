import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'

export const Route = createFileRoute('/api/v1/report/$id/done')({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const reportId = params.id as string

        const { data: report, error: fetchError } = await supabase
          .from('reports')
          .select('entry_ids')
          .eq('id', reportId)
          .single()

        if (fetchError) {
          return new Response(JSON.stringify({ error: fetchError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        await supabase
          .from('reports')
          .update({ status: 'done' })
          .eq('id', reportId)

        await supabase
          .from('entries')
          .update({ status: 'archived' })
          .in('id', report.entry_ids)

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      },
    },
  },
})
