# CPR-17 | [Content] Privacy policy draft

**Status:** complete English draft for Founder review, 16 October 2026. Internal review copy, not a published policy or a claim that the planned services are already deployed.

**Reviewer:** Farhan Fadillah Rafi, confirmed by the Founder on 16 October 2026. Review checkpoint: before M4 content freeze and before this policy or either public form is published. A calendar date has not been supplied; no meeting or calendar invitation has been created.

**Publication prerequisites:** confirm the public privacy email, the operator/controller identity, VPS provider and location, off-host backup provider and location, enabled vendor accounts, effective date, retention operation and the legal review questions below. The Founder has deferred the public email and confirmed that VPS/domain and the off-host backup destination are not ready.

**Product sources:** [PRD Rev. 3](../prd/2026-10-14-company-profile-prd.md), [admin plan](../superpowers/plans/2026-10-15-admin-cms.md), [copy rules](../design/copywriting.md). This draft replaces the previous bilingual policy outline; the launch policy is English only.

## Proposed public policy

### Privacy Policy

This policy explains how Sineva handles information collected through our website, consultation form, product waitlist and admin area. It covers the purposes for which we use information, the services that support our website, retention and requests about your data.

Sineva is the name we use for our business. Our published Contact page provides the contact details for privacy requests. We will identify the responsible operator and the effective date before this policy takes effect.

### Information you provide

When you contact us, we collect your name, work email, WhatsApp number, business type, area of interest, message and privacy consent. You may also choose to provide your company name and budget range. We record the language, source page and submission time with the request.

When you join the product waitlist, we collect your email address, consent and submission time. Business type is optional. Joining the waitlist records your interest; it does not create a product account or make the product available.

Please do not include passwords, payment details or other sensitive information in a consultation message. We may ask for further information when we discuss your requirements, but the public form is not a channel for transferring confidential project material.

### Technical information

Our website and infrastructure may process request information such as IP addresses, timestamps, browser details, requested paths and security events. We use this information to operate the website, investigate failures and protect forms and login functions against abuse.

We use Umami for website analytics without advertising cookies. We use error monitoring to identify technical faults. Analytics and error events should not contain consultation messages, passwords or authentication tokens.

The admin area uses authentication cookies to maintain signed-in sessions and apply security controls. We do not use advertising pixels in this version of the website.

### Why we use information

We use consultation details to review your request, communicate with you and manage follow-up. We use waitlist information to send updates about the AI agents product described when you register.

The forms ask for your explicit consent before submission. We record that consent with the submission. You may withdraw consent or ask us to stop using your information by contacting us. Withdrawal does not by itself undo processing that took place before the request.

Technical and security processing supports the operation and protection of the website. We will confirm its applicable legal basis as part of the policy review before launch; the checkbox is not a claim of consent to every form of technical processing.

### Who can access information

Authorised Sineva administrators handle consultation and waitlist records. Content Editors do not have access to those records. Access follows the responsibilities needed to operate the website and respond to requests.

We use service providers for specific website operations:

- Resend delivers consultation notifications and automatic replies.
- Cloudflare supports DNS, proxy/CDN delivery and Turnstile form protection.
- Umami provides website analytics.
- Sentry supports error monitoring.
- Our hosting provider operates the server that stores the application database, media and local backups.
- A separate backup provider will hold the off-host backup copy once that destination has been selected and configured.

SeaweedFS is storage software running on the hosting infrastructure. It is not a separate service provider to which we attribute processing responsibility. Before publication, the provider details and enabled services must match the actual deployment.

### Processing locations

Our hosting and service providers may process information outside Indonesia. Before enabling the relevant services, we review the intended locations, provider terms and safeguards required for those transfers. The final published policy will describe the verified arrangement; it will not treat a vendor name alone as proof of an adequate transfer safeguard.

### Retention

Our proposed consultation-record retention period is 24 months after the last interaction. Our proposed waitlist period runs until 12 months after the product launches, or until an earlier deletion request applies. These periods must be confirmed in the pre-launch review and implemented in the operating process.

Database backups may contain personal data. The planned backup retention period is 14 days. Deletion from the active database may not remove a record from an existing backup immediately; backup access and rotation must follow the approved retention process. A restore must take account of deletion requests before restored records return to active use.

We review whether information is still needed and handle access, withdrawal and deletion requests through the responsible administrator. We do not promise immediate removal from every historical backup while that process is still awaiting verification.

### Requests about your information

You may contact us to request information about processing, access to your data, correction, withdrawal of consent, or deletion where applicable. You may also ask about other rights available under the applicable personal data protection rules.

Use the privacy email published on the Contact page and explain the request. We may need information to confirm your identity and locate the relevant record. Please provide only what is necessary; do not send a password or identity document unless we have agreed a suitable method.

An administrator will review the request and explain the next steps, including any limits that apply to retention or another legal obligation. The final response process and applicable deadlines must be confirmed before launch.

### Updates and contact

We may update this policy when the website, providers or processing practices change. The published version will show its effective date. Changes that require a further notice or consent will follow the reviewed process.

For privacy questions or requests, email the privacy contact listed on the [Contact page](/contact).

## Review questions for Farhan

1. Who is the responsible operator/controller before a legal entity is formed, and what identity/contact details must appear publicly?
2. Which public email will receive access, correction, withdrawal and deletion requests, and who covers those requests when the Founder is unavailable?
3. Which hosting and off-host backup providers and locations will actually be used? Confirm the enabled Resend, Cloudflare, Umami and Sentry arrangements.
4. What cross-border transfer notices, safeguards or consent wording are required for those verified providers and locations?
5. Are the proposed 24-month lead, post-launch waitlist and 14-day backup periods appropriate? How will requests and deletion history be reapplied after a restore?
6. Confirm the legal basis for technical logs, security controls and analytics separately from the form checkbox, and confirm the final checkbox wording.
7. Confirm the rights-request process, identity checks, response deadlines, complaint route and incident notification process.
8. Check current implementing rules and relevant decisions before publication, then set the effective date. No unpublished or third-party-only claim about a new regulation has been treated as verified here.

## Reference material for review

- [Official Law No. 27 of 2022, JDIH Komdigi](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang%2Bnomor%2B27%2Btahun%2B2022), consulted 16 October 2026. The draft's processing information and rights sections require review against the current law; its retention periods come from the PRD, not a claim that the law mandates those numbers.
- [Official BPK regulation record](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022), for status and linked legal developments. Review the current record rather than assuming the original text is the only relevant authority.

## Ticket completion

- [x] English draft covers contact/waitlist data, technical logs, analytics, monitoring, purposes/consent, retention/backups, recipients, storage responsibility, transfer review, requests and contact.
- [x] Founder named as reviewer; review checkpoint recorded before M4/publication.
- [x] Review questions and official source links attached.
- [ ] Calendar timing, provider/contact facts and final policy wording reviewed by Founder. The draft remains unpublished; no compliance certification or policy approval is implied by merging it.
