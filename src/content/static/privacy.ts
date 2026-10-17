import type { RichTextDocument } from '../../features/content/types'
import { bulletList, doc, heading, paragraph } from './helpers'

// The privacy policy as published on 17 October 2026 (CPR-17), describing the live website: the
// contact form and the waitlist store what visitors send in our database, Turnstile screens the
// forms, and Google Analytics runs only after cookie consent (CPR-109). Founder decisions of that
// day: the controller is named as "Sineva" (no legal entity yet), privacy requests go to the team
// inbox, and the retention periods are the ones proposed in the PRD. Update this text, and its
// Indonesian translation, whenever a provider or a data flow changes.

export const privacyBody: RichTextDocument = doc(
  paragraph(
    'This policy explains how Sineva handles personal data collected through this website: what we collect, why, which services help us, how long we keep it, and how you can make a request about your data. It applies to the contact form, the waitlist for our product, analytics cookies and our admin area.',
  ),
  paragraph(
    'Sineva is responsible for the personal data described here. For privacy questions or requests, email sinevatech@gmail.com.',
  ),

  heading('Information you give us'),
  paragraph(
    'When you send the contact form, we store your name, email address, WhatsApp number, business type, area of interest and message, plus your company name and budget range if you add them. We also record the page you sent it from, the language of the page and the time you agreed to this policy. After saving it, the website opens WhatsApp with your message ready, so you can also reach us there.',
  ),
  paragraph(
    'When you join the waitlist for our product, we store your email address, your business type if you add it, the language of the page and the time you agreed. Joining the waitlist does not create an account or make the product available.',
  ),
  paragraph(
    'Please do not include passwords, payment details or other sensitive information in a message.',
  ),

  heading('Information collected automatically'),
  paragraph(
    'To protect our forms from spam, Cloudflare Turnstile checks your browser when you use them, and Cloudflare receives your IP address and browser details for that check. We also keep a scrambled form of your IP address for 24 hours to limit how often a form can be sent. It cannot be turned back into your IP address.',
  ),
  paragraph(
    'Our hosting provider processes request details such as IP addresses, times, browser details and requested pages to deliver the website and keep it secure.',
  ),

  heading('Cookies and similar storage'),
  paragraph(
    'We use Google Analytics to understand how visitors use the website, but only if you accept analytics cookies in the banner. Until then, nothing from Google Analytics loads. If you accept, Google sets cookies named _ga and _ga_ followed by an ID, which can last up to two years. You can withdraw at any time with Cookie settings at the bottom of every page; we then stop Google Analytics and remove its cookies from this website.',
  ),
  paragraph(
    'Your browser also stores your cookie choice, your light or dark theme and similar display settings. These stay on your device and are not sent to us. Our admin area uses login cookies for our team only. We do not use advertising cookies.',
  ),

  heading('Why we use your information'),
  bulletList(
    'To reply to your message and follow up on your request. The basis is the consent you give on the form.',
    'To tell you when our product is ready, if you joined the waitlist. The basis is your consent.',
    'To measure how the website is used, only with your consent to analytics cookies.',
    'To keep the website and our forms secure and free of spam. The basis is our legitimate interest in protecting the website and the people who use it.',
  ),
  paragraph(
    'You can withdraw your consent at any time. Withdrawing does not affect processing that took place before.',
  ),

  heading('Who receives your information'),
  paragraph(
    'Only authorized Sineva team members can see the messages and waitlist entries in our admin area. We use these service providers:',
  ),
  bulletList(
    'Vercel hosts the website. Its servers are in the United States.',
    'Neon hosts our database, in Singapore.',
    'Cloudflare runs Turnstile, the spam check on our forms.',
    'Google runs Google Analytics, only if you accept analytics cookies.',
    'WhatsApp carries the messages you choose to send us there.',
    'An email delivery provider sends our replies and notifications by email.',
  ),
  paragraph('We do not sell your personal data.'),

  heading('Transfers outside Indonesia'),
  paragraph(
    'Some of these providers process data outside Indonesia, including in Singapore and the United States. We choose providers that protect personal data under their own terms and safeguards, and we share only what each service needs.',
  ),

  heading('How long we keep it'),
  bulletList(
    'Contact form messages: 24 months after our last contact with you.',
    'Waitlist entries: until 12 months after the product launches, or earlier if you ask us to delete them.',
    'The scrambled IP address used to limit form sending: 24 hours.',
    'Google Analytics cookies: up to two years, or until you withdraw your consent.',
  ),
  paragraph(
    'When a period ends, we delete the data or make it anonymous. Copies of messages you sent through WhatsApp or email stay with those services under their own terms.',
  ),

  heading('Your rights'),
  paragraph(
    'Under the Indonesian personal data protection law, you can ask to see the personal data we hold about you, correct it, delete it, withdraw your consent, or object to how we use it. Email sinevatech@gmail.com with your request. We may ask for information to confirm it is you, and we will reply within the time the law requires.',
  ),

  heading('Changes to this policy'),
  paragraph(
    'We update this policy when the website, our providers or our practices change. The date at the top shows when the current version took effect.',
  ),
)
