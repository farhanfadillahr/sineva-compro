import type { TeamMember, WorkDetail, WorkSummary } from '../../features/content/types'

// Empty on purpose. There are no real client or internal projects to show and no team members who
// have agreed to be listed, and an empty list is the honest state (the contract says `[]`, never
// placeholder rows). Add entries here when real ones exist: the Work link, the Work page and the
// Selected work sections then switch on without further changes, because they all key off these
// lists and the `features` flags in site settings.
export const work: readonly WorkSummary[] = []
export const workDetails: readonly WorkDetail[] = []
export const team: readonly TeamMember[] = []
