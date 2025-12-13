import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Check, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase.client'
import type { Report } from '@/lib/types'

export const Route = createFileRoute('/explore')({
    component: ExplorePage,
})

function ExplorePage() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ['reports', 'processed'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('status', 'processed')
                .order('created_at', { ascending: false })

            if (error) throw error
            return (data || []) as Report[]
        },
    })

    const markAsDone = useMutation({
        mutationFn: async (reportId: string) => {
            const response = await fetch(`/api/v1/report/${reportId}/done`, {
                method: 'POST',
            })
            if (!response.ok) throw new Error('Failed to mark as done')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            queryClient.invalidateQueries({ queryKey: ['entries'] })
        },
    })

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-gray-700" />
                        <h1 className="text-xl font-semibold text-gray-900">Explore Reports</h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Review and complete processed reports
                    </p>
                </div>
            </div>

            {/* Reports List */}
            <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
                {isLoading ? (
                    <div className="text-center py-16 text-gray-500">Loading...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No reports to review</p>
                        <p className="text-sm mt-1">Reports will appear here after processing</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                            >
                                {/* Report Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(report.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {report.summary}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{report.entry_ids.length} entries</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    markAsDone.mutate(report.id)
                                                }}
                                                disabled={markAsDone.isPending}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Done
                                            </Button>
                                            {expandedId === report.id ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedId === report.id && (
                                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                                        <div className="prose prose-sm max-w-none 
                                            prose-headings:font-bold prose-headings:text-gray-900
                                            prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
                                            prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-3
                                            prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                                            prose-p:text-gray-700 prose-p:leading-relaxed
                                            prose-a:text-blue-600 prose-a:hover:underline
                                            prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                                            prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg
                                            prose-ul:list-disc prose-ul:pl-6
                                            prose-ol:list-decimal prose-ol:pl-6">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {report.markdown_content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
