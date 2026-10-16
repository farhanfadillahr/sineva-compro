import type { ReactNode } from 'react'
import { FinalCta, HeroSplit } from '@/components/sections'
import type { ActionLinkComponent, SectionTone } from '@/components/ui'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { poseImage } from '../home/poses'
import type { AboutLabels } from './about-labels'
import {
  ABOUT_HREFS,
  ABOUT_POSES,
  planAboutSections,
  storyBlocks,
  type AboutModel,
  type AboutSectionId,
} from './about-model'
import { AboutMeetSinoSection } from './meet-sino-section'
import { MissionSection } from './mission-section'
import { StorySection } from './story-section'
import { TeamSection } from './team-section'
import { ValuesSection } from './values-section'

export type AboutViewProps = {
  model: AboutModel
  labels: AboutLabels
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
}

/**
 * The About page body (page-patterns.md 2.7), composed from the shared section blocks. A pure
 * function of the model: the page loads the content, this renders it.
 *
 * Which sections exist and which tone each gets is decided once, by `planAboutSections`, after
 * hidden sections are removed. The view only renders that plan, so the order and the tone rules
 * cannot drift from what the tests check. Every section sits in a wrapper that records its id and
 * planned tone, which is also what the tests read.
 */
export function AboutView({ model, labels, linkComponent }: AboutViewProps) {
  const { page, settings } = model
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'general' })
  const whatsappCta =
    whatsappHref && labels.chatOnWhatsapp
      ? { label: labels.chatOnWhatsapp, href: whatsappHref }
      : null
  const secondaryCta = page.finalCta.secondaryCtaLabel
    ? { label: page.finalCta.secondaryCtaLabel, href: ABOUT_HREFS.product }
    : null

  const render: Record<AboutSectionId, (tone: SectionTone) => ReactNode> = {
    hero: () => (
      <HeroSplit
        variant="sino-still"
        headline={page.hero.title}
        lead={page.hero.lead}
        // The hero content has no CTA label, and the closing CTA is the page's one action.
        primaryCta={null}
        // The scene (C3, Sino with two people at a table) when it exists, else S13. `priority`
        // stays off on purpose: that path draws a plain image with no reveal, and this hero asks
        // for the animated pose (mascot-sino.md section 8: every pose still uses AnimatedPose).
        image={page.hero.scene ?? poseImage(ABOUT_POSES.hero)}
        linkComponent={linkComponent}
      />
    ),
    story: (tone) => <StorySection blocks={storyBlocks(page.story)} tone={tone} />,
    mission: (tone) => (
      <MissionSection title={page.mission.title} body={page.mission.body} tone={tone} />
    ),
    values: (tone) => (
      <ValuesSection title={page.values.title} items={page.values.items} tone={tone} />
    ),
    meetSino: (tone) => (
      <AboutMeetSinoSection
        title={page.meetSino.title}
        body={page.meetSino.body}
        pose={ABOUT_POSES.meetSino}
        tone={tone}
      />
    ),
    team: (tone) => <TeamSection title={page.team.title} members={model.team} tone={tone} />,
    finalCta: () => (
      <FinalCta
        headline={page.finalCta.headline}
        body={page.finalCta.body}
        primaryCta={{ label: page.finalCta.primaryCtaLabel, href: ABOUT_HREFS.contact }}
        secondaryCta={secondaryCta}
        whatsappCta={whatsappCta}
        image={poseImage(ABOUT_POSES.finalCta)}
        linkComponent={linkComponent}
      />
    ),
  }

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      {planAboutSections(model).map(({ id, tone }) => (
        <div key={id} data-about-section={id} data-about-tone={tone}>
          {render[id](tone)}
        </div>
      ))}
    </main>
  )
}
