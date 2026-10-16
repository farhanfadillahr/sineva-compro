/** Real email only on preview and production (`EMAIL_DELIVERY=live`); local and CI use the mock. */
export function emailDeliveryIsLive(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  return (
    env.EMAIL_DELIVERY === 'live' ||
    (env.NODE_ENV === 'production' && env.EMAIL_DELIVERY !== 'mock')
  )
}
