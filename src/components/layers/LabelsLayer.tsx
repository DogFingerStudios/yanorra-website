import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

type LabelsLayerEntry =
{
  id: string
  data: GeoJSON.GeoJsonObject
  options?:
  {
    color?: string
  }
}

type LabelProperties = GeoJSON.GeoJsonProperties &
{
  label_text?: unknown
  label_type?: unknown
  min_zoom?: unknown
  max_zoom?: unknown
  font_size?: unknown
  font_family?: unknown
  font_style?: unknown
  font_weight?: unknown
  text_transform?: unknown
  letter_spacing?: unknown
  placement?: unknown
  start_offset?: unknown
  text_anchor?: unknown
  repeat?: unknown
}

type NormalizedLabelOptions =
{
  labelText: string
  fontSize: number
  fontFamily: string
  fontStyle: string
  fontWeight: string
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  letterSpacing: number
  placement: string
  startOffset: string
  textAnchor: 'start' | 'middle' | 'end'
  repeat: boolean
  fill: string
}

const DEFAULT_FONT_SIZE = 18
const DEFAULT_FONT_FAMILY = 'Cinzel, Georgia, serif'
const DEFAULT_FONT_STYLE = 'normal'
const DEFAULT_FONT_WEIGHT = '700'
const DEFAULT_TEXT_TRANSFORM: NormalizedLabelOptions['textTransform'] = 'none'
const DEFAULT_LETTER_SPACING = 0
const DEFAULT_PLACEMENT = 'along_line'
const DEFAULT_START_OFFSET = '50%'
const DEFAULT_TEXT_ANCHOR: NormalizedLabelOptions['textAnchor'] = 'middle'
const DEFAULT_REPEAT = false
const DEFAULT_WATER_LABEL_FILL = '#2f6ea5'

function parseFiniteNumber(value: unknown): number | null
{
  if (typeof value === 'number' && Number.isFinite(value))
  {
    return value
  }

  if (typeof value === 'string')
  {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue))
    {
      return parsedValue
    }
  }

  return null
}

function parseBoolean(value: unknown): boolean | null
{
  if (typeof value === 'boolean')
  {
    return value
  }

  if (typeof value === 'string')
  {
    const normalizedValue = value.trim().toLowerCase()

    if (normalizedValue === 'true')
    {
      return true
    }

    if (normalizedValue === 'false')
    {
      return false
    }
  }

  return null
}

function parseTextTransform(value: unknown): NormalizedLabelOptions['textTransform']
{
  if (typeof value !== 'string')
  {
    return DEFAULT_TEXT_TRANSFORM
  }

  const normalizedValue = value.trim().toLowerCase()

  if (normalizedValue === 'uppercase')
  {
    return 'uppercase'
  }

  if (normalizedValue === 'lowercase')
  {
    return 'lowercase'
  }

  if (normalizedValue === 'capitalize')
  {
    return 'capitalize'
  }

  return 'none'
}

function parseTextAnchor(value: unknown): NormalizedLabelOptions['textAnchor']
{
  if (typeof value !== 'string')
  {
    return DEFAULT_TEXT_ANCHOR
  }

  const normalizedValue = value.trim().toLowerCase()

  if (normalizedValue === 'start' || normalizedValue === 'middle' || normalizedValue === 'end')
  {
    return normalizedValue
  }

  return DEFAULT_TEXT_ANCHOR
}

function sanitizeId(value: string): string
{
  return value.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function applyTextTransform(inputText: string, transform: NormalizedLabelOptions['textTransform']): string
{
  if (transform === 'uppercase')
  {
    return inputText.toUpperCase()
  }

  if (transform === 'lowercase')
  {
    return inputText.toLowerCase()
  }

  if (transform === 'capitalize')
  {
    return inputText.replace(/\b\p{L}/gu, (match) =>
    {
      return match.toUpperCase()
    })
  }

  return inputText
}

function normalizeLabelOptions(properties: LabelProperties, fallbackColor: string): NormalizedLabelOptions | null
{
  if (!properties)
  {
    return null
  }

  if (typeof properties.label_text !== 'string' || properties.label_text.trim() === '')
  {
    return null
  }

  let fontSize = DEFAULT_FONT_SIZE
  const parsedFontSize = parseFiniteNumber(properties.font_size)

  if (parsedFontSize !== null)
  {
    fontSize = parsedFontSize
  }

  let fontFamily = DEFAULT_FONT_FAMILY

  if (typeof properties.font_family === 'string' && properties.font_family.trim() !== '')
  {
    fontFamily = properties.font_family.trim()
  }

  let fontStyle = DEFAULT_FONT_STYLE

  if (typeof properties.font_style === 'string' && properties.font_style.trim() !== '')
  {
    fontStyle = properties.font_style.trim()
  }

  let fontWeight = DEFAULT_FONT_WEIGHT

  if (typeof properties.font_weight === 'string' && properties.font_weight.trim() !== '')
  {
    fontWeight = properties.font_weight.trim()
  }
  else if (typeof properties.font_weight === 'number' && Number.isFinite(properties.font_weight))
  {
    fontWeight = String(properties.font_weight)
  }

  let letterSpacing = DEFAULT_LETTER_SPACING
  const parsedLetterSpacing = parseFiniteNumber(properties.letter_spacing)

  if (parsedLetterSpacing !== null)
  {
    letterSpacing = parsedLetterSpacing
  }

  let placement = DEFAULT_PLACEMENT

  if (typeof properties.placement === 'string' && properties.placement.trim() !== '')
  {
    placement = properties.placement.trim().toLowerCase()
  }

  let startOffset = DEFAULT_START_OFFSET

  if (typeof properties.start_offset === 'string' && properties.start_offset.trim() !== '')
  {
    startOffset = properties.start_offset.trim()
  }

  const parsedRepeat = parseBoolean(properties.repeat)
  let repeat = DEFAULT_REPEAT

  if (parsedRepeat !== null)
  {
    repeat = parsedRepeat
  }

  return {
    labelText: properties.label_text.trim(),
    fontSize,
    fontFamily,
    fontStyle,
    fontWeight,
    textTransform: parseTextTransform(properties.text_transform),
    letterSpacing,
    placement,
    startOffset,
    textAnchor: parseTextAnchor(properties.text_anchor),
    repeat,
    fill: fallbackColor,
  }
}

function buildRepeatedText(baseText: string, fontSize: number, letterSpacing: number, pathLength: number): string
{
  const averageCharacterWidth = (fontSize * 0.6) + letterSpacing

  if (averageCharacterWidth <= 0)
  {
    return baseText
  }

  const estimatedSingleLabelLength = Math.max(1, baseText.length) * averageCharacterWidth
  const estimatedRepeatCount = Math.floor(pathLength / estimatedSingleLabelLength)
  let repeatCount = Math.max(2, estimatedRepeatCount)

  if (repeatCount > 24)
  {
    repeatCount = 24
  }

  return Array.from({ length: repeatCount }, () =>
  {
    return baseText
  }).join('   ')
}

function ensurePathId(pathElement: SVGPathElement, rawId: string): string
{
  if (pathElement.id.trim() !== '')
  {
    return pathElement.id
  }

  const sanitizedId = sanitizeId(rawId)
  pathElement.id = sanitizedId

  return sanitizedId
}

function renderTextAlongPolyline(feature: GeoJSON.Feature, polyline: L.Polyline, rawOptions: NormalizedLabelOptions, textElements: SVGTextElement[], pathIdSeed: string)
{
  const polylineWithPath = polyline as L.Polyline &
  {
    _path?: SVGPathElement
  }

  const pathElement = polylineWithPath._path

  if (!pathElement)
  {
    console.error('LabelsLayer: missing SVG path for label feature.', feature)
    return
  }

  if (rawOptions.placement !== 'along_line')
  {
    console.warn(`LabelsLayer: unsupported placement "${rawOptions.placement}". Falling back to along_line.`)
  }

  const pathId = ensurePathId(pathElement, pathIdSeed)
  const svgRoot = pathElement.ownerSVGElement

  if (!svgRoot)
  {
    console.error('LabelsLayer: missing SVG root for label feature.', feature)
    return
  }

  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  const textPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'textPath')

  const transformedLabelText = applyTextTransform(rawOptions.labelText, rawOptions.textTransform)
  let finalLabelText = transformedLabelText

  if (rawOptions.repeat)
  {
    const pathLength = pathElement.getTotalLength()
    finalLabelText = buildRepeatedText(transformedLabelText, rawOptions.fontSize, rawOptions.letterSpacing, pathLength)
  }

  textElement.setAttribute('fill', rawOptions.fill)
  textElement.setAttribute('font-size', `${rawOptions.fontSize}`)
  textElement.setAttribute('font-family', rawOptions.fontFamily)
  textElement.setAttribute('font-style', rawOptions.fontStyle)
  textElement.setAttribute('font-weight', rawOptions.fontWeight)
  textElement.setAttribute('text-anchor', rawOptions.textAnchor)
  textElement.setAttribute('letter-spacing', `${rawOptions.letterSpacing}`)
  textElement.style.textTransform = rawOptions.textTransform
  textElement.style.pointerEvents = 'none'

  textPathElement.setAttribute('href', `#${pathId}`)
  textPathElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`)
  textPathElement.setAttribute('startOffset', rawOptions.startOffset)
  textPathElement.textContent = finalLabelText

  textElement.appendChild(textPathElement)
  svgRoot.appendChild(textElement)
  textElements.push(textElement)
}

function renderWaterLabel(feature: GeoJSON.Feature, polyline: L.Polyline, properties: LabelProperties, textElements: SVGTextElement[], pathIdSeed: string, fallbackColor: string)
{
  const options = normalizeLabelOptions(properties, fallbackColor)

  if (!options)
  {
    return
  }

  renderTextAlongPolyline(feature, polyline, options, textElements, pathIdSeed)
}

function isLineLayer(layer: L.Layer): layer is L.Polyline
{
  if (layer instanceof L.Polygon)
  {
    return false
  }

  if (layer instanceof L.Polyline)
  {
    return true
  }

  return false
}

function isLabelVisibleAtZoom(properties: LabelProperties, currentZoom: number): boolean
{
  const minZoom = parseFiniteNumber(properties.min_zoom)
  const maxZoom = parseFiniteNumber(properties.max_zoom)

  if (minZoom !== null)
  {
    if (currentZoom < minZoom)
    {
      return false
    }
  }

  if (maxZoom !== null)
  {
    if (currentZoom > maxZoom)
    {
      return false
    }
  }

  return true
}

function LabelsLayer({ entry }: { entry: LabelsLayerEntry })
{
  const map = useMap()

  useEffect(() =>
  {
    const textElements: SVGTextElement[] = []
    const labelLayers: Array<{ feature: GeoJSON.Feature, layer: L.Polyline }> = []

    const clearTextElements = () =>
    {
      textElements.forEach((textElement) =>
      {
        textElement.remove()
      })

      textElements.length = 0
    }

    const renderQueuedLabels = () =>
    {
      clearTextElements()
      const currentZoom = map.getZoom()

      labelLayers.forEach((labelEntry) =>
      {
        const feature = labelEntry.feature
        const lineLayer = labelEntry.layer
        const properties = (feature.properties ?? {}) as LabelProperties

        if (!isLabelVisibleAtZoom(properties, currentZoom))
        {
          return
        }

        const labelTypeRaw = properties.label_type

        if (typeof labelTypeRaw !== 'string' || labelTypeRaw.trim() === '')
        {
          console.error('LabelsLayer: missing or invalid label_type.', feature)
          return
        }

        const labelType = labelTypeRaw.trim().toLowerCase()
        const pathIdSeed = `labels-path-${entry.id}-${L.stamp(lineLayer)}`
        let fallbackColor = DEFAULT_WATER_LABEL_FILL

        if (entry.options?.color)
        {
          fallbackColor = entry.options.color
        }

        if (labelType === 'ocean' || labelType === 'sea' || labelType === 'lake')
        {
          renderWaterLabel(feature, lineLayer, properties, textElements, pathIdSeed, fallbackColor)
          return
        }

        console.error(new Error(`LabelsLayer: unknown label_type "${labelType}"`))
      })
    }

    const labelsLayer = L.geoJSON(entry.data, {
      style: () =>
      {
        return {
          color: 'transparent',
          weight: 0,
          opacity: 0,
        }
      },
      onEachFeature: (feature, layer) =>
      {
        if (!isLineLayer(layer))
        {
          return
        }

        labelLayers.push({
          feature,
          layer,
        })
      },
    })

    labelsLayer.addTo(map)
    requestAnimationFrame(() =>
    {
      requestAnimationFrame(() =>
      {
        renderQueuedLabels()
      })
    })

    map.on('zoomend', renderQueuedLabels)
    map.on('moveend', renderQueuedLabels)
    map.on('viewreset', renderQueuedLabels)

    return () =>
    {
      map.off('zoomend', renderQueuedLabels)
      map.off('moveend', renderQueuedLabels)
      map.off('viewreset', renderQueuedLabels)
      clearTextElements()

      map.removeLayer(labelsLayer)
    }
  }, [entry, map])

  return null
}

export function getLabelsLayer(entry: LabelsLayerEntry)
{
  return <LabelsLayer key={entry.id} entry={entry} />
}