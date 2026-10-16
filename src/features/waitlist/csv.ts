/**
 * CSV for spreadsheet tools. A cell starting with `=`, `+`, `-`, `@`, tab or carriage return could
 * run as a formula, so it is prefixed with an apostrophe (OWASP CSV injection guidance). Every
 * cell is quoted.
 */
export function csvCell(value: string | null | undefined): string {
  const text = value ?? ''
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | null)[])[],
): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
