import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { logger } from '../../lib/logger'

interface ClaimEntriesBody {
    type_id: string
    limit: number
}

export const Route = createFileRoute('/api/v1/run/$runId/claim')({
    server: {
        handlers: {
            POST: async ({ request, params }) => {
                const runId = params.runId as string
                logger.info('v1.run.$runId.claim', 'POST request received', { runId })

                const body: ClaimEntriesBody = await request.json()
                logger.debug('v1.run.$runId.claim', 'Request body parsed', { runId, body })

                if (!body.type_id || !body.limit) {
                    logger.warn('v1.run.$runId.claim', 'Validation failed: missing required fields', { runId, body })
                    return new Response(JSON.stringify({ error: 'type_id and limit are required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run.$runId.claim', 'Fetching pending entries', {
                    runId,
                    type_id: body.type_id,
                    limit: body.limit
                })

                const { data: pendingEntries, error: fetchError } = await supabase
                    .from('entries')
                    .select('id, content')
                    .eq('type_id', body.type_id)
                    .eq('status', 'pending')
                    .is('run_id', null)
                    .order('created_at', { ascending: true })
                    .limit(body.limit)

                if (fetchError) {
                    logger.error('v1.run.$runId.claim', 'Database error fetching pending entries', fetchError, {
                        runId,
                        type_id: body.type_id
                    })
                    return new Response(JSON.stringify({ error: fetchError.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                if (!pendingEntries || pendingEntries.length === 0) {
                    logger.info('v1.run.$runId.claim', 'No pending entries found', { runId, type_id: body.type_id })
                    return new Response(JSON.stringify({ entries: [], message: 'No pending entries found' }), {
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                const entryIds = pendingEntries.map(e => e.id)
                logger.info('v1.run.$runId.claim', 'Claiming entries', {
                    runId,
                    entryCount: entryIds.length,
                    entryIds
                })

                const { error: updateError } = await supabase
                    .from('entries')
                    .update({
                        status: 'processing',
                        run_id: runId
                    })
                    .in('id', entryIds)

                if (updateError) {
                    logger.error('v1.run.$runId.claim', 'Database error updating entries', updateError, {
                        runId,
                        entryIds
                    })
                    return new Response(JSON.stringify({ error: updateError.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run.$runId.claim', 'Entries claimed successfully', {
                    runId,
                    claimed_count: pendingEntries.length
                })

                return new Response(JSON.stringify({
                    entries: pendingEntries,
                    claimed_count: pendingEntries.length
                }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },
        },
    },
})
