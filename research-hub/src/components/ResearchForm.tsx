'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { researchSchema, type ResearchFormData } from '@/lib/schemas'
import { useState } from 'react'

export function ResearchForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<ResearchFormData>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      notes: '',
      type: 'generic'
    }
  })

  const [success, setSuccess] = useState<{ message: string; urlCount: number } | null>(null)
  const notesValue = watch('notes')

  const onSubmit = async (data: ResearchFormData) => {
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to add research')
      }

      const result = await response.json()
      setSuccess({
        message: 'Research added!',
        urlCount: result.data.urls_found
      })
      reset()
      setTimeout(() => setSuccess(null), 4000)
    } catch (error) {
      console.error(error)
      alert('Failed to add research. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-4 max-w-2xl mx-auto">
      {/* Research Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Research Type
        </label>
        <select
          {...register('type')}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base"
        >
          <option value="generic">General Research</option>
          <option value="university">University</option>
          <option value="person">Person/Professor</option>
          <option value="paper">Research Paper</option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Notes Input (Main Field) */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Research Notes
          <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
            (Add URLs naturally in your text)
          </span>
        </label>
        <textarea
          {...register('notes')}
          placeholder="Example: Check https://stanford.edu and https://mit.edu for their CS programs. I heard Stanford has a strong AI lab."
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base resize-y"
        />
        {errors.notes && (
          <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
        )}

        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{notesValue?.length || 0} / 2000 characters</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-[0.98]"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : (
          '+ Add Research'
        )}
      </button>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg text-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="font-medium">{success.message}</p>
              {success.urlCount > 0 && (
                <p className="text-xs mt-1 opacity-90">
                  Found {success.urlCount} URL{success.urlCount > 1 ? 's' : ''} in your notes
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Include URLs naturally: "Check https://example.com for details"</li>
          <li>Multiple URLs? No problem! Add as many as you need</li>
          <li>No URLs? That's fine too—just describe what to research</li>
        </ul>
      </div>
    </form>
  )
}
