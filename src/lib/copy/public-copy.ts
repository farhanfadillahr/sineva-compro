import { findForbiddenDashes, type DashViolation } from './dash-rule'

export type CopyViolation = DashViolation & { rule: string }

export type CopyRule = {
  id: string
  find: (text: string) => DashViolation[]
}

/**
 * Rules applied to public copy. Add a rule by appending an entry; callers need no change.
 * Style rules that cannot be checked mechanically (sentence case, headline length) do not
 * belong here.
 */
export const COPY_RULES: readonly CopyRule[] = [{ id: 'forbidden-dash', find: findForbiddenDashes }]

export type PublicCopyResult =
  { ok: true; violations: [] } | { ok: false; violations: CopyViolation[] }

/** Runs every rule in `COPY_RULES` over `text`. Violations are ordered by rule, then index. */
export function validatePublicCopy(text: string | null | undefined): PublicCopyResult {
  if (!text) return { ok: true, violations: [] }
  const violations = COPY_RULES.flatMap((rule) =>
    rule.find(text).map((violation) => ({ ...violation, rule: rule.id })),
  )
  return violations.length === 0 ? { ok: true, violations: [] } : { ok: false, violations }
}
