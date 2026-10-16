type PanelGeometry = Readonly<{
  centred: number
  rootWidth: number
  width: number
  padLeft: number
  padRight: number
}>

/**
 * Horizontal offset of the dropdown panel inside the nav root. The root is the full-width
 * container, so its gutter padding is part of its box: clamping to 0 alone let the panel touch
 * the viewport edge. The panel stays inside the padded content box, and pins to the left gutter
 * when it is wider than that box.
 */
export function clampPanelX({ centred, rootWidth, width, padLeft, padRight }: PanelGeometry) {
  const max = rootWidth - padRight - width
  return Math.max(Math.min(centred, max), padLeft)
}
