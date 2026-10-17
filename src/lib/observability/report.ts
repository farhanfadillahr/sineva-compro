/**
 * Error reporting without personal data. Until Sentry is set up (CPR-14) this logs a fixed
 * category, the error class and a non-personal reference (for example a lead id). Messages and
 * stacks are never logged here: provider errors can echo addresses or names.
 */
export type ReportContext = Readonly<{ area: string; reference?: string }>

type Reporter = (category: string, context: ReportContext, errorName: string) => void

let reporter: Reporter = (category, context, errorName) =>
  console.error(
    `[${context.area}] ${category} (${errorName})${context.reference ? ` ref=${context.reference}` : ''}`,
  )

/** Sentry integration point (CPR-14) and test hook. */
export function setErrorReporter(next: Reporter | null) {
  reporter =
    next ??
    ((category, context, errorName) =>
      console.error(
        `[${context.area}] ${category} (${errorName})${context.reference ? ` ref=${context.reference}` : ''}`,
      ))
}

export function reportError(category: string, context: ReportContext, error?: unknown) {
  reporter(category, context, error instanceof Error ? error.name : typeof error)
}
