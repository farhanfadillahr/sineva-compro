import type { EmailTemplateKey } from './render'

/**
 * Starting template copy for the base seed. Plain and short; the final wording is CPR-50.
 * The waitlist confirmation exists for later: sending it needs a product owner decision.
 */
export const DEFAULT_TEMPLATES: Record<EmailTemplateKey, { subject: string; body: string }> = {
  'lead-notification': {
    subject: 'New lead from {name}',
    body: 'Name: {name}\nEmail: {email}\nPhone: {phone}\nCompany: {company}\nService: {service}\nBusiness type: {segment}\n\n{message}',
  },
  'lead-auto-reply': {
    subject: 'Thanks for reaching out, {name}',
    body: 'Hi {name},\n\nThanks for telling us about your project. We read every message and will reply with next steps.\n\nThe {site} team',
  },
  'waitlist-confirmation': {
    subject: 'You are on the list for {product}',
    body: 'Thanks for your interest in {product}. We will let you know when it is ready.\n\nThe {site} team',
  },
}

export const DEFAULT_SETTINGS = {
  mode: 'resend-api' as const,
  fromName: 'Sineva',
  fromEmail: 'hello@example.com',
}
