import { createFileRoute } from '@tanstack/react-router'
import { logger } from '../../lib/logger'

export const Route = createFileRoute('/api/v1/run/$id/trigger')({
    server: {
        handlers: {
            POST: async ({ params }) => {
                const runId = params.id as string
                logger.info('v1.run.$id.trigger', 'POST request received', { runId })

                // Server-side env var (no VITE_ prefix = not exposed to client)
                const webhookUrl = process.env.N8N_WEBHOOK_URL

                if (!webhookUrl) {
                    logger.error('v1.run.$id.trigger', 'N8N_WEBHOOK_URL not configured', undefined, { runId })
                    return new Response(
                        JSON.stringify({ error: 'n8n webhook URL not configured on server. Add N8N_WEBHOOK_URL to .env.local' }),
                        { status: 500, headers: { 'Content-Type': 'application/json' } }
                    )
                }

                const fullUrl = `${webhookUrl}?runId=${runId}`
                logger.info('v1.run.$id.trigger', 'Calling n8n webhook', { runId, url: fullUrl })

                try {
                    const startTime = Date.now()
                    const response = await fetch(fullUrl)
                    const responseTime = Date.now() - startTime
                    const responseText = await response.text()

                    logger.info('v1.run.$id.trigger', 'n8n webhook response received', {
                        runId,
                        status: response.status,
                        responseTime: `${responseTime}ms`,
                        responseBody: responseText.substring(0, 200) // Log first 200 chars
                    })

                    if (!response.ok) {
                        logger.error('v1.run.$id.trigger', 'n8n webhook returned error status', undefined, {
                            runId,
                            status: response.status,
                            responseBody: responseText
                        })
                        return new Response(
                            JSON.stringify({
                                error: `n8n webhook failed with status ${response.status}`,
                                details: responseText
                            }),
                            { status: 502, headers: { 'Content-Type': 'application/json' } }
                        )
                    }

                    logger.info('v1.run.$id.trigger', 'Webhook triggered successfully', { runId })
                    return new Response(
                        JSON.stringify({ success: true, message: 'Webhook triggered successfully' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    )
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    logger.error('v1.run.$id.trigger', 'Webhook call failed', error, { runId, url: fullUrl })

                    return new Response(
                        JSON.stringify({ error: `Failed to call webhook: ${errorMessage}` }),
                        { status: 502, headers: { 'Content-Type': 'application/json' } }
                    )
                }
            },
        },
    },
})
