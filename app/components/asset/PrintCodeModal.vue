<template>
  <UModal
    v-model:open="open"
    :title="$t('component.asset.printCodeModal.title')"
    :description="$t('component.asset.printCodeModal.description', { count: assets.length })"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="space-y-4">

        <!-- Code Type -->
        <UFormField :label="$t('component.asset.printCodeModal.codeType')">
          <URadioGroup
            v-model="settings.codeType"
            :items="codeTypeOptions"
            orientation="horizontal"
          />
        </UFormField>

        <!-- Label Size & Columns -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="$t('component.asset.printCodeModal.labelSize')">
            <USelectMenu
              v-model="settings.labelSize"
              :items="labelSizeOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="$t('component.asset.printCodeModal.columns')">
            <USelectMenu
              v-model="settings.columns"
              :items="columnOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Display Options -->
        <UFormField :label="$t('component.asset.printCodeModal.displayOptions')">
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <UCheckbox
              v-model="settings.showAssetName"
              :label="$t('component.asset.printCodeModal.showAssetName')"
            />
            <UCheckbox
              v-model="settings.showAssetCode"
              :label="$t('component.asset.printCodeModal.showAssetCode')"
            />
            <UCheckbox
              v-model="settings.showCategoryName"
              :label="$t('component.asset.printCodeModal.showCategoryName')"
            />
            <UCheckbox
              v-model="settings.showCutMarks"
              :label="$t('component.asset.printCodeModal.showCutMarks')"
            />
          </div>
        </UFormField>

        <!-- PDF Preview (rendered via pdf.js canvas) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-neutral-700">{{ $t('component.asset.printCodeModal.preview') }}</label>
            <span class="text-xs text-neutral-400">
              <template v-if="totalPages > 1">{{ currentPage }} / {{ totalPages }} &mdash; </template>
              {{ $t('component.asset.printCodeModal.totalLabels', { count: assets.length }) }}
            </span>
          </div>
          <div class="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100 relative" style="height: 380px;">
            <!-- Loading -->
            <div v-if="isGenerating" class="flex items-center justify-center h-full">
              <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-neutral-400" />
            </div>

            <!-- Canvas pages -->
            <div v-else ref="previewContainer" class="h-full overflow-y-auto p-3 flex flex-col items-center gap-3">
              <canvas
                v-for="n in totalPages"
                :key="n"
                :ref="(el) => { if (el) pageCanvasRefs[n] = el as HTMLCanvasElement }"
                class="shadow-md rounded bg-white max-w-full"
              />
            </div>

            <!-- Page nav (multi-page) -->
            <div v-if="totalPages > 1" class="absolute bottom-3 right-3 flex items-center gap-1">
              <UButton size="xs" color="neutral" variant="solid" icon="i-lucide-chevron-up" :disabled="currentPage <= 1" @click="scrollToPage(currentPage - 1)" />
              <UButton size="xs" color="neutral" variant="solid" icon="i-lucide-chevron-down" :disabled="currentPage >= totalPages" @click="scrollToPage(currentPage + 1)" />
            </div>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <UButton
        :label="$t('common.cancel')"
        color="neutral"
        variant="outline"
        @click="() => { open = false }"
      />
      <UButton
        :label="$t('component.asset.printCodeModal.downloadPdf')"
        color="primary"
        icon="i-lucide-download"
        :disabled="!currentPdf"
        @click="handleDownload"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Asset } from '~/types/asset'

// pdf.js always loads its worker as an ES module (`new Worker(src, { type: 'module' })`),
// which browsers reject unless the response has a JS/module MIME type. Some static hosts
// serve .mjs as application/octet-stream, which silently falls back to pdf.js's slow
// single-threaded "fake worker". Re-wrapping the script in a Blob with an explicit JS
// type sidesteps the host's Content-Type header entirely, since blob: URLs carry their
// own type.
let pdfWorkerReady: Promise<void> | null = null
const ensurePdfWorker = () => {
  if (!pdfWorkerReady) {
    pdfWorkerReady = fetch(pdfjsWorkerUrl)
      .then(res => res.blob())
      .then((blob) => {
        const jsBlob = new Blob([blob], { type: 'text/javascript' })
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(jsBlob)
      })
      .catch(() => {
        // Fall back to the direct URL; pdf.js itself will fall back to the fake worker if this fails too.
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
      })
  }
  return pdfWorkerReady
}

const { t } = useI18n()

const props = defineProps<{
  assets: Asset[]
}>()

const open = defineModel<boolean>({ default: false })

const isGenerating = ref(false)
const totalPages = ref(0)
const currentPage = ref(1)
const previewContainer = ref<HTMLElement | null>(null)
const pageCanvasRefs = reactive<Record<number, HTMLCanvasElement>>({})
let currentPdf: jsPDF | null = null

const settings = reactive({
  codeType: 'qrcode' as 'qrcode' | 'barcode128',
  labelSize: 'medium' as 'small' | 'medium' | 'large',
  columns: 3,
  showAssetName: false,
  showAssetCode: true,
  showCategoryName: false,
  showCutMarks: true,
})

const codeTypeOptions = computed(() => [
  { label: t('component.asset.printCodeModal.qrCode'), value: 'qrcode' },
  { label: t('component.asset.printCodeModal.barcode128'), value: 'barcode128' },
])

const labelSizeOptions = computed(() => [
  { label: t('component.asset.printCodeModal.sizeSmall'), value: 'small' },
  { label: t('component.asset.printCodeModal.sizeMedium'), value: 'medium' },
  { label: t('component.asset.printCodeModal.sizeLarge'), value: 'large' },
])

const columnOptions = computed(() => [
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
])

// --- Build PDF (same as before) ---
const buildPdf = async (): Promise<jsPDF> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const margin = settings.showCutMarks ? 15 : 8
  const regMarkSize = 4
  const usableW = pageW - margin * 2
  const cols = settings.columns
  const gap = settings.showCutMarks ? 0 : 1.5
  const cellW = (usableW - gap * (cols - 1)) / cols
  const codeSizeMm = { small: 12, medium: 18, large: 24 }[settings.labelSize]
  const fontName = { small: 5, medium: 6.5, large: 8 }[settings.labelSize]
  const fontSub = { small: 4, medium: 5.5, large: 7 }[settings.labelSize]
  const padCell = { small: 1.5, medium: 2.5, large: 3.5 }[settings.labelSize]

  // Generate code images
  const codeImages: Record<number, string> = {}
  for (const asset of props.assets) {
    const offscreen = document.createElement('canvas')
    try {
      if (settings.codeType === 'qrcode') {
        await QRCode.toCanvas(offscreen, asset.code, {
          width: 200, margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        })
      } else {
        JsBarcode(offscreen, asset.code, {
          format: 'CODE128', width: 2, height: 60,
          displayValue: false, margin: 4,
          background: '#ffffff', lineColor: '#000000',
        })
      }
      codeImages[asset.id] = offscreen.toDataURL('image/png')
    } catch { /* skip */ }
  }

  const drawRegistrationMarks = () => {
    if (!settings.showCutMarks) return
    pdf.setFillColor(0, 0, 0)
    pdf.rect(margin - regMarkSize - 2, margin - regMarkSize - 2, regMarkSize, regMarkSize, 'F')
    pdf.rect(pageW - margin + 2, margin - regMarkSize - 2, regMarkSize, regMarkSize, 'F')
    pdf.rect(margin - regMarkSize - 2, pageH - margin + 2, regMarkSize, regMarkSize, 'F')
  }

  drawRegistrationMarks()

  let curX = margin
  let curY = margin
  let col = 0

  for (const asset of props.assets) {
    let labelH = padCell * 2
    let codeH = codeSizeMm
    if (settings.codeType === 'barcode128') codeH = codeSizeMm * 0.5
    labelH += codeH + 3
    if (settings.showAssetName) labelH += fontName * 0.5 + 1.5
    if (settings.showAssetCode) labelH += fontSub * 0.5 + 0.8
    if (settings.showCategoryName) labelH += fontSub * 0.5 + 0.8

    if (curY + labelH > pageH - margin) {
      pdf.addPage()
      drawRegistrationMarks()
      curY = margin
      col = 0
      curX = margin
    }

    if (settings.showCutMarks) {
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.15)
      pdf.rect(curX, curY, cellW, labelH)
    }

    let drawY = curY + padCell
    const imgSrc = codeImages[asset.id]
    if (imgSrc) {
      const imgW = settings.codeType === 'qrcode' ? codeSizeMm : cellW - padCell * 2
      const imgX = curX + (cellW - imgW) / 2
      pdf.addImage(imgSrc, 'PNG', imgX, drawY, imgW, codeH)
      drawY += codeH + 3
    }

    const textX = curX + cellW / 2
    const maxTextW = cellW - padCell * 2

    if (settings.showAssetName) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(fontName)
      pdf.setTextColor(26, 26, 26)
      const nameLines = pdf.splitTextToSize(asset.name, maxTextW).slice(0, 2) as string[]
      nameLines.forEach((line: string) => {
        pdf.text(line, textX, drawY, { align: 'center' })
        drawY += fontName * 0.4 + 0.3
      })
      drawY += 0.3
    }

    if (settings.showAssetCode) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(fontSub)
      pdf.setTextColor(102, 102, 102)
      const codeTxt = pdf.splitTextToSize(asset.code, maxTextW)[0] as string
      pdf.text(codeTxt, textX, drawY, { align: 'center' })
      drawY += fontSub * 0.4 + 0.5
    }

    if (settings.showCategoryName && asset.subCategory) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(fontSub)
      pdf.setTextColor(153, 153, 153)
      const catTxt = pdf.splitTextToSize(asset.subCategory.name, maxTextW)[0] as string
      pdf.text(catTxt, textX, drawY, { align: 'center' })
    }

    col++
    if (col >= cols) {
      col = 0
      curX = margin
      curY += labelH + gap
    } else {
      curX += cellW + gap
    }
  }

  return pdf
}


let debounceTimer: ReturnType<typeof setTimeout>
const generatePreview = async () => {
  isGenerating.value = true
  try {
    await ensurePdfWorker()
    currentPdf = await buildPdf()
    const data = currentPdf.output('arraybuffer')
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise
    totalPages.value = pdfDoc.numPages
    currentPage.value = 1

    // Hide spinner so canvases mount
    isGenerating.value = false
    await nextTick()
    await nextTick()

    const containerWidth = previewContainer.value?.clientWidth ?? 500
    const renderWidth = containerWidth - 24

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      const scale = (renderWidth / viewport.width) * 2
      const scaledViewport = page.getViewport({ scale })

      const canvas = pageCanvasRefs[i]
      if (!canvas) continue
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      canvas.style.width = `${scaledViewport.width / 2}px`
      canvas.style.height = `${scaledViewport.height / 2}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      await page.render({ canvasContext: ctx, canvas, viewport: scaledViewport }).promise
    }
  } catch {
    isGenerating.value = false
  }
}

const debouncedPreview = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => generatePreview(), 300)
}

watch(
  () => [settings.codeType, settings.labelSize, settings.columns, settings.showAssetName, settings.showAssetCode, settings.showCategoryName, settings.showCutMarks],
  () => { if (open.value) debouncedPreview() },
)

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    generatePreview()
  } else {
    currentPdf = null
    totalPages.value = 0
  }
})

const scrollToPage = (page: number) => {
  currentPage.value = page
  const canvas = pageCanvasRefs[page]
  if (canvas) canvas.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleDownload = () => {
  if (!currentPdf) return
  currentPdf.save(`asset-codes-${new Date().toISOString().slice(0, 10)}.pdf`)
}
</script>
