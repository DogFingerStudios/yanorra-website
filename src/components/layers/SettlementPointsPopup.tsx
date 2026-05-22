import './SettlmentPoints.css'

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

  const descriptionValue = feature.properties?.description
  let descriptionText = ''
  if (typeof descriptionValue === 'string' && descriptionValue.trim() !== '')
  {
    descriptionText = descriptionValue.trim()
  }

  const safeName = escapeHtml(settlementName)
  const safeDescription = escapeHtml(descriptionText)

  let safeLinkText = '';
  let linkText = feature.properties?.target_id;
  if (typeof linkText === 'string' && linkText.trim() !== '')
  {
    safeLinkText = `<a href="${escapeHtml(linkText.trim())}">More info</a>`
  }

  return `
    <div class="settlement-popup-content">
      <div class="settlement-popup-title">${safeName}</div>
      <div class="settlement-popup-description">${safeDescription}</div>
      ${safeLinkText}
    </div>
  `
}
