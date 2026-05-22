function escapeHtml(inputValue: string): string
{
  return inputValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getSettlementPointsPopup(feature: GeoJSON.Feature): string
{
  const nameValue = feature.properties?.name
  let settlementName = 'Unknown settlement'

  if (typeof nameValue === 'string' && nameValue.trim() !== '')
  {
    settlementName = nameValue.trim()
  }

  const safeName = escapeHtml(settlementName)

  return `
    <div class="settlement-popup-content">
      <div class="settlement-popup-title">${safeName}</div>
      <a href="https://yanorra.world" target="_blank" rel="noopener noreferrer">yanorra.world</a>
    </div>
  `
}
