import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.server'

export const Route = createFileRoute('/api/v1/list/$type')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const typeId = params.type as string
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') || '5', 10)

        const { data, error } = await supabase
          .from('entries')
          .select('id, content, created_at')
          .eq('type_id', typeId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(limit)

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }

        const formatted = (data || [])
          .map((entry: any, idx: number) =>
            `${idx + 1}. ID: ${entry.id}\n   Content: ${entry.content}\n   Date: ${entry.created_at}\n`
          )
          .join('\n')

        return new Response(formatted, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      },
    },
  },
})
