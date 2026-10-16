// Shared section blocks (docs/design/page-patterns.md section 3). Pages compose these; every
// string, link and image arrives through props.
//
// Page rules the blocks cannot enforce alone: at most one inverse section per page (FinalCta is
// it), adjacent sections never share a non-white tone (check a composition with
// `checkSectionTones`), and at most one hero-size Sino per viewport.
export { AudienceCards, type AudienceCardsProps } from './audience-cards'
export { FaqSection, type FaqSectionProps } from './faq-section'
export { FINAL_CTA_TONE, FinalCta, type FinalCtaProps } from './final-cta'
export { HeroSplit, type HeroMockup, type HeroSplitProps, type HeroVariant } from './hero-split'
export { StickyCtaBar, type StickyCtaBarProps } from './sticky-cta-bar'
export { StickySteps, type StickyStep, type StickyStepsProps } from './sticky-steps'
export { TaskCardGrid, type TaskCardGridProps, type TaskCardItem } from './task-card-grid'
export { TwoPaths, type TwoPathsCard, type TwoPathsProps } from './two-paths'

// Local primitives pages need to build mockup screens and stages.
export { MediaFrame } from './_internal/media-frame'
export { ChatBubbles, PhoneFrame, type PhoneChrome } from './_internal/phone-frame'
export { SinoStage } from './_internal/sino-stage'
export { UiChip } from './_internal/ui-chip'

// Helpers.
export { faqEntriesFromDto, type FaqEntry } from './_internal/faq'
export { assertSectionTones, checkSectionTones, type ToneViolation } from './_internal/tone'
export type { CtaLink } from './_internal/types'
