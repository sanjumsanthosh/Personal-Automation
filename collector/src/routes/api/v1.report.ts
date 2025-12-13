import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import type { CreateReportBody } from '../../lib/types'

export const Route = createFileRoute('/api/v1/report')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: CreateReportBody = await request.json()

        const { data: report, error: reportError } = await supabase
          .from('reports')
          .insert({
            summary: body.summary,
            markdown_content: body.markdown_content,
            entry_ids: body.entry_ids,
            status: 'processed'
          })
          .select()
          .single()

        if (reportError) {
          return new Response(JSON.stringify({ error: reportError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const { error: updateError } = await supabase
          .from('entries')
          .update({ status: 'processed' })
          .in('id', body.entry_ids)

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ success: true, report_id: report.id }), {
          headers: { 'Content-Type': 'application/json' }
        })
      },
    },
  },
})
