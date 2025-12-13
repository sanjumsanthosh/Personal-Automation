import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { logger } from '../../lib/logger'

export const Route = createFileRoute('/api/v1/report/$id/done')({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const reportId = params.id as string
        logger.info('v1.report.$id.done', 'POST request received', { reportId })

        logger.debug('v1.report.$id.done', 'Fetching report entry_ids', { reportId })
        const { data: report, error: fetchError } = await supabase
          .from('reports')
          .select('entry_ids')
          .eq('id', reportId)
          .single()

        if (fetchError) {
          logger.error('v1.report.$id.done', 'Database error fetching report', fetchError, { reportId })
          return new Response(JSON.stringify({ error: fetchError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        logger.info('v1.report.$id.done', 'Marking report as done', {
          reportId,
          entry_count: report.entry_ids?.length
        })

        await supabase
          .from('reports')
          .update({ status: 'done' })
          .eq('id', reportId)

        logger.debug('v1.report.$id.done', 'Archiving entries', {
          reportId,
          entry_ids: report.entry_ids
        })

        await supabase
          .from('entries')
          .update({ status: 'archived' })
          .in('id', report.entry_ids)

        logger.info('v1.report.$id.done', 'Report marked as done successfully', {
          reportId,
          archived_count: report.entry_ids?.length
        })

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        })
      },
    },
  },
})
