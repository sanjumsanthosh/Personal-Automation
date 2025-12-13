import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'
import { logger } from '../../lib/logger'

interface CreateRunBody {
    name: string
    type_id: string
    limit_count?: number
}

export const Route = createFileRoute('/api/v1/run')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                logger.info('v1.run', 'POST request received')

                const body: CreateRunBody = await request.json()
                logger.debug('v1.run', 'Request body parsed', { body })

                if (!body.name || !body.type_id) {
                    logger.warn('v1.run', 'Validation failed: missing required fields', { body })
                    return new Response(JSON.stringify({ error: 'name and type_id are required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run', 'Creating new run', {
                    name: body.name,
                    type_id: body.type_id,
                    limit_count: body.limit_count ?? 5
                })

                const { data: run, error } = await supabase
                    .from('processing_runs')
                    .insert({
                        name: body.name,
                        type_id: body.type_id,
                        limit_count: body.limit_count ?? 5,
                        status: 'created'
                    })
                    .select()
                    .single()

                if (error) {
                    logger.error('v1.run', 'Database error creating run', error, { body })
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run', 'Run created successfully', { run_id: run.id, name: run.name })
                return new Response(JSON.stringify({ run_id: run.id }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },

            GET: async () => {
                logger.info('v1.run', 'GET request received - fetching all runs')

                const { data: runs, error } = await supabase
                    .from('processing_runs')
                    .select('*, types:type_id(name)')
                    .order('created_at', { ascending: false })

                if (error) {
                    logger.error('v1.run', 'Database error fetching runs', error)
                    return new Response(JSON.stringify({ error: error.message }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    })
                }

                logger.info('v1.run', 'Runs fetched successfully', { count: runs?.length || 0 })
                return new Response(JSON.stringify(runs), {
                    headers: { 'Content-Type': 'application/json' }
                })
            },
        },
    },
})
