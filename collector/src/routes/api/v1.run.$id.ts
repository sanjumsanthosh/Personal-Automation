import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { logger } from '../../lib/logger'

interface UpdateRunBody {
    name?: string
    status?: 'created' | 'running' | 'completed' | 'failed'
    started_at?: string
    completed_at?: string
}

export const Route = createFileRoute('/api/v1/run/$id')({
    server: {
        handlers: {
            PATCH: async ({ request, params }) => {
                const runId = params.id as string
                logger.info('v1.run.$id', 'PATCH request received', { runId })

                const body: UpdateRunBody = await request.json()
                logger.debug('v1.run.$id', 'Update data parsed', { runId, body })

                // current time
                const currentTime = new Date().toISOString()

                const updateData: Record<string, unknown> = {}
                if (body.name !== undefined) updateData.name = body.name
                if (body.status !== undefined) updateData.status = body.status
                if (body.started_at !== undefined) {
                    updateData.started_at = body.started_at
                } else if (body.status === 'running') {
                    updateData.started_at = currentTime
                }
                if (body.completed_at !== undefined) updateData.completed_at = body.completed_at
                else if (body.status === 'completed' || body.status === 'failed') {
                    updateData.completed_at = currentTime
                }

                logger.info('v1.run.$id', 'Updating run', { runId, updateData })

                const { data: run, error } = await supabase
                    .from('processing_runs')
                    .update(updateData)
                    .eq('id', runId)
                    .select()
                    .single()

                if (error) {
                    logger.error('v1.run.$id', 'Database error updating run', error, { runId, updateData })
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run.$id', 'Run updated successfully', { runId, status: run.status })
                return new Response(JSON.stringify({ success: true, run }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },

            GET: async ({ params }) => {
                const runId = params.id as string
                logger.info('v1.run.$id', 'GET request received', { runId })

                const { data: run, error } = await supabase
                    .from('processing_runs')
                    .select('*, types:type_id(name)')
                    .eq('id', runId)
                    .single()

                if (error) {
                    logger.error('v1.run.$id', 'Database error fetching run', error, { runId })
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.debug('v1.run.$id', 'Fetching entries for run', { runId })
                const { data: entries } = await supabase
                    .from('entries')
                    .select('id, content, status, created_at')
                    .eq('run_id', runId)
                    .order('created_at', { ascending: true })

                logger.info('v1.run.$id', 'Run fetched successfully', {
                    runId,
                    status: run.status,
                    entriesCount: entries?.length || 0
                })

                return new Response(JSON.stringify({ ...run, entries: entries || [] }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },

            DELETE: async ({ params }) => {
                const runId = params.id as string
                logger.info('v1.run.$id', 'DELETE request received', { runId })

                logger.debug('v1.run.$id', 'Unlinking entries from run', { runId })
                await supabase
                    .from('entries')
                    .update({ run_id: null })
                    .eq('run_id', runId)

                logger.debug('v1.run.$id', 'Deleting run', { runId })
                const { error } = await supabase
                    .from('processing_runs')
                    .delete()
                    .eq('id', runId)

                if (error) {
                    logger.error('v1.run.$id', 'Database error deleting run', error, { runId })
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run.$id', 'Run deleted successfully', { runId })
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },
        },
    },
})
