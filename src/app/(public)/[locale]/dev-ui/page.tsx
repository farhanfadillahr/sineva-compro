import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Eyebrow,
  Field,
  Input,
  Section,
  SectionHeader,
  Select,
  Split,
  Textarea,
} from '@/components/ui'

// Developer gallery of the base components. It does not exist in production builds: the page
// returns 404 there, so it never ships content, links or indexable markup. The copy below is
// placeholder text for layout checks only and is not part of the public site.
const SWATCHES = [
  ['canvas', 'bg-canvas'],
  ['canvas-alt', 'bg-canvas-alt'],
  ['surface-tint', 'bg-surface-tint'],
  ['surface-warm', 'bg-surface-warm'],
  ['surface-inverse', 'bg-surface-inverse'],
  ['action-primary', 'bg-action-primary'],
  ['action-primary-hover', 'bg-action-primary-hover'],
  ['action-dark', 'bg-action-dark'],
  ['border-input', 'bg-border-input'],
  ['focus', 'bg-focus'],
  ['danger', 'bg-danger'],
  ['success', 'bg-success'],
] as const

const TYPE_SCALE = [
  ['text-display', 'Display'],
  ['text-h1', 'Heading one'],
  ['text-h2', 'Heading two'],
  ['text-h3', 'Heading three'],
  ['text-h4', 'Heading four'],
  ['text-lead', 'Lead paragraph'],
  ['text-body', 'Body text'],
  ['text-body-sm', 'Small body text'],
  ['text-label', 'Label text'],
  ['text-micro', 'Micro text'],
] as const

const EASINGS = [
  ['ease-out', 'out'],
  ['ease-out-expo', 'out-expo'],
  ['ease-bounce', 'bounce'],
  ['ease-in-out', 'in-out'],
] as const

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  )
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main>
      <Section tone="aurora">
        <Container className="flex flex-col gap-12">
          <SectionHeader
            titleAs="h1"
            align="start"
            eyebrow="Dev only"
            title="Base components"
            lead="Every primitive from src/components/ui in its states. Tab through the page to check focus rings."
          />

          <Block title="Colour tokens">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {SWATCHES.map(([name, swatch]) => (
                <li key={name} className="flex flex-col gap-2">
                  <span className={`h-12 rounded-sm ${swatch} [border:var(--border-hairline)]`} />
                  <span className="font-mono text-micro text-text-secondary">{name}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Type scale">
            <div className="flex flex-col gap-3">
              {TYPE_SCALE.map(([cls, sample]) => (
                <p key={cls} className={`${cls} text-text`}>
                  {sample} <span className="font-mono text-micro text-text-tertiary">{cls}</span>
                </p>
              ))}
            </div>
          </Block>

          <Block title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="primary" withArrow>
                Primary arrow
              </Button>
              <Button variant="dark">Dark</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="whatsapp">WhatsApp</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra large</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button loading loadingLabel="Sending" withArrow>
                Loading
              </Button>
              <Button href="/dev-ui" variant="secondary">
                As link
              </Button>
              <Button href="/dev-ui" variant="dark" disabled>
                Disabled link
              </Button>
            </div>
          </Block>

          <Block title="Badges and chips">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Brand</Badge>
              <Badge tone="warm">Warm</Badge>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge soon>Coming soon</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Chip selected>Selected</Chip>
              <Chip>Unselected</Chip>
              <Chip disabled>Disabled</Chip>
              <Chip href="/dev-ui">Link chip</Chip>
            </div>
          </Block>

          <Block title="Motion easing (hover)">
            <div className="flex flex-wrap gap-3">
              {EASINGS.map(([cls, name]) => (
                <div
                  key={cls}
                  className={`group/ease flex h-11 w-40 items-center rounded-pill bg-canvas-alt p-1 ${cls}`}
                >
                  <span
                    className={`h-9 w-9 rounded-pill bg-action-primary transition-[translate] duration-(--dur-slow) group-hover/ease:translate-x-[7.5rem] ${cls}`}
                  />
                  <span className="sr-only">{name}</span>
                </div>
              ))}
            </div>
          </Block>
        </Container>
      </Section>

      <Section tone="alt">
        <Container className="flex flex-col gap-12">
          <Block title="Cards">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <p className="text-h4 text-text">Base card</p>
                <p className="text-body-sm text-text-secondary">Surface, hairline, small shadow.</p>
              </Card>
              <Card interactive>
                <p className="text-h4 text-text">Interactive</p>
                <p className="text-body-sm text-text-secondary">Lifts on hover.</p>
              </Card>
              <Card variant="feature">
                <p className="text-h4 text-text">Feature</p>
                <p className="text-body-sm text-text-secondary">Icon, title and short text.</p>
              </Card>
              <Card variant="stat">
                <p className="text-h1 text-text">128</p>
                <p className="text-body-sm text-text-secondary">Placeholder statistic</p>
              </Card>
              <Card variant="path" tone="tint">
                <Eyebrow>Path</Eyebrow>
                <p className="text-h3 text-text">Path card, tint</p>
              </Card>
              <Card variant="path" tone="warm">
                <Eyebrow>Path</Eyebrow>
                <p className="text-h3 text-text">Path card, warm</p>
              </Card>
              <Card variant="task" tone="alt" featured>
                <p className="text-h3 text-text">Featured task card</p>
              </Card>
              <Card variant="step">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-tint font-mono text-micro text-text-brand">
                  1
                </span>
                <div>
                  <p className="text-h4 text-text">Step card</p>
                  <p className="text-body-sm text-text-secondary">Number, title and body.</p>
                </div>
              </Card>
            </div>
          </Block>

          <Block title="Forms">
            <Card className="grid gap-6 md:grid-cols-2">
              <Field label="Name" requiredLabel="(required)" required helper="As on your invoice">
                {(control) => <Input autoComplete="name" {...control} />}
              </Field>
              <Field label="Email" requiredLabel="(required)" required error="Enter a valid email">
                {(control) => <Input type="email" defaultValue="not-an-email" {...control} />}
              </Field>
              <Field label="Topic">
                {(control) => (
                  <Select defaultValue="" {...control}>
                    <option value="">Choose a topic</option>
                    <option value="build">Build</option>
                    <option value="enable">Enablement</option>
                  </Select>
                )}
              </Field>
              <Field label="Disabled">
                {(control) => <Input disabled defaultValue="Locked" {...control} />}
              </Field>
              <div className="md:col-span-2">
                <Field label="Message" helper="A few sentences is enough">
                  {(control) => <Textarea {...control} />}
                </Field>
              </div>
              <Checkbox label="I agree to the privacy policy" helper="You can withdraw any time" />
              <Checkbox label="Checkbox with an error" error="Please accept to continue" />
            </Card>
          </Block>
        </Container>
      </Section>

      <Section tone="tint">
        <Container>
          <Split
            text={
              <SectionHeader
                align="start"
                eyebrow="Split"
                title="Text five columns, visual seven"
                lead="Stacks on mobile with the visual second."
                action={<Button withArrow>Primary action</Button>}
              />
            }
            visual={<Card variant="task" tone="warm" className="min-h-64" />}
          />
        </Container>
      </Section>

      <Section tone="warm">
        <Container>
          <SectionHeader eyebrow="Warm" title="Section tone warm" lead="Centred section header." />
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <SectionHeader
            inverse
            eyebrow="Inverse"
            title="Section tone inverse"
            lead="At most one dark section per page."
            action={<Button variant="secondary">Secondary on dark</Button>}
          />
        </Container>
      </Section>
    </main>
  )
}
