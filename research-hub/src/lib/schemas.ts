import { z } from 'zod'

export const researchSchema = z.object({
  notes: z
    .string()
    .min(5, 'Notes must be at least 5 characters')
    .max(2000, 'Notes too long (max 2000 characters)'),
  type: z.enum(['university', 'person', 'paper', 'generic'], {
    errorMap: () => ({ message: 'Please select a research type' })
  })
})

export type ResearchFormData = z.infer<typeof researchSchema>

// Server-side extended schema (includes extracted URLs)
export const researchWithUrlsSchema = researchSchema.extend({
  urls: z.array(z.string().url()).optional()
})
