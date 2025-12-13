import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { logger } from '../../lib/logger'
import type { CreateReportBody } from '../../lib/types'

export const Route = createFileRoute('/api/v1/report')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        logger.info('v1.report', 'POST request received')

        const body: CreateReportBody = await request.json()
        logger.debug('v1.report', 'Request body parsed', {
          entryCount: body.entry_ids?.length,
          run_id: body.run_id
        })

        logger.info('v1.report', 'Creating report', {
          run_id: body.run_id,
          entry_count: body.entry_ids?.length
        })

        const { data: report, error: reportError } = await supabase
          .from('reports')
          .insert({
            summary: body.summary,
            markdown_content: body.markdown_content,
            entry_ids: body.entry_ids,
            run_id: body.run_id || null,
            status: 'processed'
          })
          .select()
          .single()

        if (reportError) {
          logger.error('v1.report', 'Database error creating report', reportError, {
            run_id: body.run_id
          })
          return new Response(JSON.stringify({ error: reportError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        logger.info('v1.report', 'Report created, updating entries status', {
          report_id: report.id,
          entry_count: body.entry_ids?.length
        })

        const { error: updateError } = await supabase
          .from('entries')
          .update({ status: 'processed' })
          .in('id', body.entry_ids)

        if (updateError) {
          logger.error('v1.report', 'Database error updating entries', updateError, {
            report_id: report.id,
            entry_ids: body.entry_ids
          })
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        logger.info('v1.report', 'Report created successfully', {
          report_id: report.id,
          entry_count: body.entry_ids?.length
        })

        return new Response(JSON.stringify({ success: true, report_id: report.id }), {
          headers: { 'Content-Type': 'application/json' }
        })
      },
    },
  },
})
