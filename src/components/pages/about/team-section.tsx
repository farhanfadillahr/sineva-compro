import Image from 'next/image'
import { Reveal } from '@/components/motion/Reveal'
import { Card, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { TeamMember } from '@/features/content/types'

/**
 * Up to two initials for the avatar of a member without a photo. Split by code point
 * (`Array.from`), so a name that starts with an emoji or an astral character is not cut in half.
 */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]!.toUpperCase())
    .join('')
}

const AVATAR = 'size-20 shrink-0 rounded-full'

/**
 * Team (page-patterns.md 2.7): one card per member, in the order of the content. The caller
 * decides whether the section exists at all (toggles and an empty list hide it), so this only
 * renders what it is given. The photo and its alt text come from Media; a member without a
 * photo gets an initials avatar, which is decorative because the name sits right beside it.
 */
export function TeamSection({
  title,
  members,
  tone,
}: {
  title: string
  members: readonly TeamMember[]
  tone: SectionTone
}) {
  if (members.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeader title={title} />
        </Reveal>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => (
            <Reveal as="li" key={`${index}-${member.name}`} index={index} className="flex">
              <Card variant="feature" data-team-member="" className="w-full">
                {member.photo ? (
                  <Image
                    src={member.photo.url}
                    width={member.photo.width}
                    height={member.photo.height}
                    alt={member.photo.alt}
                    sizes="80px"
                    placeholder={member.photo.blurDataUrl ? 'blur' : 'empty'}
                    blurDataURL={member.photo.blurDataUrl ?? undefined}
                    className={`${AVATAR} object-cover`}
                  />
                ) : (
                  <span
                    data-team-fallback=""
                    aria-hidden="true"
                    className={`${AVATAR} grid place-items-center bg-surface-tint text-h4 text-text-brand`}
                  >
                    {initialsOf(member.name)}
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="text-h4 text-text">{member.name}</h3>
                  <p className="text-body-sm text-text-secondary">{member.role}</p>
                </div>
                {member.bio ? (
                  <p className="text-body-sm text-pretty text-text-secondary">{member.bio}</p>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
