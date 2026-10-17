'use client'

/**
 * Anti-spam honeypot for the public intake forms (CPR-49, wired in CPR-105). The field sits off
 * screen, is hidden from assistive technology and out of the tab order, so people never fill it.
 * A bot that fills every input sends a value, and the server then drops the submission silently.
 * It has no `name`, like every control of these forms: the value is sent as `website` only by the
 * form's handler. The label is fixed English bait text, not visitor-facing copy.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  )
}
