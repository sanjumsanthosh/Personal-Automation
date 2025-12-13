import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import type { Report, ReportStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X, Check, RefreshCw, ExternalLink, Maximize2 } from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportWithRun extends Report {
    processing_runs: { name: string; type_id: string } | null
}

interface ReportPreviewPanelProps {
    report: ReportWithRun
    onClose: () => void
}

const statusConfig: Record<ReportStatus, { color: string; label: string }> = {
    processed: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Processed' },
    done: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Done' },
}

export function ReportPreviewPanel({ report, onClose }: ReportPreviewPanelProps) {
    const queryClient = useQueryClient()

    const markDoneMutation = useMutation({
        mutationFn: async () => {
            logger.info('ReportPreviewPanel', 'Marking report as done', { reportId: report.id })
            const res = await fetch(`/api/v1/report/${report.id}/done`, { method: 'POST' })
            const result = await res.json()
            logger.info('ReportPreviewPanel', 'Report marked as done', { reportId: report.id, status: res.status })
            return result
        },
        onSuccess: () => {
            logger.info('ReportPreviewPanel', 'Mark done mutation successful', { reportId: report.id })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        },
        onError: (error) => {
            logger.error('ReportPreviewPanel', 'Mark done mutation failed', error, { reportId: report.id })
        },
    })

    const config = statusConfig[report.status]

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold truncate">Report</h2>
                <div className="flex items-center gap-1">
                    <a href={`/report/${report.id}`}>
                        <button className="p-1 hover:bg-gray-100 rounded" title="View Full Screen">
                            <Maximize2 className="h-5 w-5 text-gray-500" />
                        </button>
                    </a>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Metadata Bar */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    {report.processing_runs && (
                        <div>
                            <span className="text-gray-500">Run:</span>{' '}
                            <span className="font-medium">{report.processing_runs.name}</span>
                        </div>
                    )}
                    <div>
                        <span className="text-gray-500">Created:</span>{' '}
                        <span className="font-medium">{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Entries:</span>{' '}
                        <span className="font-medium">{report.entry_ids?.length || 0}</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs border ${config.color}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Summary */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">{report.summary}</p>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-sm max-w-none 
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2
                    prose-h2:text-xl prose-h2:mt-5 prose-h2:mb-3
                    prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                    prose-h4:text-base prose-h4:mt-3 prose-h4:mb-1
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:hover:underline
                    prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg
                    prose-ul:list-disc prose-ul:pl-6
                    prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-1
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {report.markdown_content}
                    </ReactMarkdown>
                </div>

                {/* Sources */}
                {report.sources && Object.keys(report.sources).length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Sources</h3>
                        <ul className="space-y-1">
                            {Object.entries(report.sources).map(([key, value]) => (
                                <li key={key} className="text-sm">
                                    <a
                                        href={value as string}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {key} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                    {report.status === 'processed' && (
                        <Button
                            className="flex-1"
                            onClick={() => markDoneMutation.mutate()}
                            disabled={markDoneMutation.isPending}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            {markDoneMutation.isPending ? 'Marking...' : 'Mark Done'}
                        </Button>
                    )}

                    {report.run_id && (
                        <Button variant="outline" onClick={() => {/* Navigate to run */ }}>
                            View Run
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        disabled
                        title="Coming soon"
                        className="opacity-50 cursor-not-allowed"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                    </Button>
                </div>
            </div>
        </div>
    )
}
