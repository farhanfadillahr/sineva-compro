import type { RichTextDocument } from '../../features/content/types'
import { bulletList, doc, heading, paragraph } from './helpers'

// Adapted from the English privacy policy draft in docs/content/privacy-policy-en.md, keeping its
// sections in order. The draft was written for a launch with stored leads, a waitlist database and
// named vendors. The static launch has none of those: the contact form only prepares a message,
// and no form data reaches a server. So the sections that described stored records now describe
// what actually happens, and vendor names are left out until the live deployment confirms them.
//
// Still open, and stated in the text instead of hidden: the responsible operator, the final
// retention periods, the response process and the legal basis for technical processing. The
// draft remains a Founder and legal review item; publishing this page does not complete it.

export const privacyBody: RichTextDocument = doc(
  paragraph(
    'This policy explains how Sineva handles information collected through our website, including the contact form, the option to be notified about our product, and our admin area. It covers why we use information, the services that support our website, how long we keep information, and how to make a request about your data.',
  ),
  paragraph(
    'Sineva is the name we use for our business. Our Contact page shows how to reach us about privacy requests. We will identify the responsible operator and the effective date before this policy takes effect.',
  ),

  heading('Information you provide'),
  paragraph(
    'The contact form on this website does not send your details to our servers. It prepares a message from what you enter: your name, business type, area of interest and message, plus your company name and budget range if you choose to add them. You then send that message yourself through WhatsApp or your email app. We do not store form entries on our servers.',
  ),
  paragraph(
    'When you send the message, we receive what you wrote, together with your WhatsApp number or email address, through that service. WhatsApp and your email provider handle the message under their own terms and privacy policies.',
  ),
  paragraph(
    'If you ask to be notified about our AI agents product, you do it by sending us a message in the same way. Asking to be notified records your interest only. It does not create a product account or make the product available.',
  ),
  paragraph(
    'Please do not include passwords, payment details or other sensitive information in a message. We may ask for more information when we discuss your needs, but the contact form is not a channel for confidential project material.',
  ),

  heading('Technical information'),
  paragraph(
    'Our website and hosting infrastructure may process request information such as IP addresses, timestamps, browser details, requested paths and security events. We use this information to operate the website, investigate failures and protect it against abuse.',
  ),
  paragraph(
    'We may use website analytics without advertising cookies, and error monitoring to find technical faults. Analytics and error events should not contain your messages, passwords or authentication tokens.',
  ),
  paragraph(
    'The admin area is for our team. It uses authentication cookies to keep signed-in sessions and apply security controls. We do not use advertising pixels on this website.',
  ),

  heading('Why we use information'),
  paragraph(
    'We use the messages you send us to review your request, reply to you and manage follow-up. We use notification requests to tell you when the AI agents product is ready.',
  ),
  paragraph(
    'Sending us a message is your choice, and the form asks you to confirm that you understand how the message is sent. You can ask us to stop using your information, or to delete it, by contacting us. Withdrawing does not undo processing that took place before your request.',
  ),
  paragraph(
    'Technical and security processing supports the operation and protection of the website. We will confirm its legal basis as part of our policy review before launch. The confirmation on the form does not cover every kind of technical processing.',
  ),

  heading('Who can access information'),
  paragraph(
    'Authorized Sineva team members handle the messages we receive. Access follows the responsibilities needed to operate the website and respond to requests.',
  ),
  paragraph('We use service providers for specific website operations:'),
  bulletList(
    'Our hosting provider runs the servers that deliver this website.',
    'Network and delivery services help serve the website and protect it against abuse.',
    'WhatsApp and your email provider carry the messages you choose to send us.',
    'Analytics and error monitoring services, if enabled, help us understand and fix the website.',
  ),
  paragraph(
    'We will name these providers in this policy once they are confirmed for the live website.',
  ),

  heading('Processing locations'),
  paragraph(
    'Our hosting and service providers may process information outside Indonesia. Before we enable a service, we review its intended locations, its terms and the safeguards needed for those transfers. The final policy will describe the verified arrangement. It will not treat a provider name alone as proof of an adequate safeguard.',
  ),

  heading('Retention'),
  paragraph(
    'Our proposed retention period for messages is 24 months after our last interaction with you. Our proposed period for notification requests runs until 12 months after the product launches, or until an earlier deletion request applies. We will confirm these periods before launch.',
  ),
  paragraph(
    'This website does not store form entries, so they do not sit in our website backups. Messages you send through WhatsApp or email stay in those accounts and follow the same periods. Deleting a message in one place may not delete copies kept by the services that carried it.',
  ),

  heading('Requests about your information'),
  paragraph(
    'You may contact us to ask how we process your information, or to request access, correction, withdrawal of consent or deletion where applicable. You may also ask about other rights available under the applicable personal data protection rules.',
  ),
  paragraph(
    'Message us using the contact options on our Contact page and explain your request. We may need information to confirm your identity and find the relevant message. Please provide only what is necessary, and do not send a password or an identity document unless we have agreed a suitable method.',
  ),
  paragraph(
    'A team member will review the request and explain the next steps, including any limits that apply because of retention or another legal obligation. We will confirm our response process and its deadlines before launch.',
  ),

  heading('Updates and contact'),
  paragraph(
    'We may update this policy when the website, our providers or our practices change. The published version shows its effective date. Changes that need a further notice or consent will follow the reviewed process.',
  ),
  paragraph('For privacy questions or requests, use the contact options on the Contact page.'),
)
