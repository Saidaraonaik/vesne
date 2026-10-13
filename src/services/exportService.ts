import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { utils, write, writeFile } from 'xlsx'
import type { ReportRow } from '../utils/reports.ts'
import { downloadBlob } from '../utils/download.ts'
import { renderGpsStamp } from '../utils/gpsStamp.ts'
import { dataUrlBytes, toJpegDataUrl } from '../utils/images.ts'
import { zipStore } from '../utils/zip.ts'

async function proofJpeg(row: ReportRow) {
  if (!row.imageDataUrl) return ''
  if (row.lat == null || row.lng == null || !row.capturedAt) return toJpegDataUrl(row.imageDataUrl)
  try {
    return await renderGpsStamp(row.imageDataUrl, {
      placeName: row.placeName || row.location,
      address: row.proofAddress || row.address,
      lat: row.lat,
      lng: row.lng,
      at: row.capturedAt,
    })
  } catch {
    return toJpegDataUrl(row.imageDataUrl)
  }
}

function sheetRows(rows: ReportRow[]) {
  return rows.map((row) => ({
    Record: 'Demo',
    'Task ID': row.taskCode,
    Project: row.project,
    Campaign: row.campaign,
    Client: row.client,
    Location: row.location,
    Address: row.address,
    Executor: row.executor,
    Status: row.status,
    'Target date': row.targetDate,
    Submitted: row.submittedAt,
    'Approval date': row.approvalDate,
    Coordinates: row.coordinates,
    'Proof reference': row.proofRef,
    'Proof image': row.imageName || '—',
    Quantity: row.quantity,
  }))
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function csvText(rows: ReportRow[]) {
  const records = sheetRows(rows)
  const headers = Object.keys(records[0] ?? { Record: 'Demo' })
  const lines = [
    headers.join(','),
    ...records.map((record) => headers.map((header) => csvEscape(String(record[header as keyof typeof record] ?? ''))).join(',')),
  ]
  return `\uFEFF${lines.join('\n')}`
}

async function photoFiles(rows: ReportRow[]) {
  const files: { name: string; data: Uint8Array }[] = []
  for (const row of rows) {
    if (!row.imageDataUrl || !row.imageName) continue
    const jpeg = await proofJpeg(row)
    files.push({ name: `photos/${row.imageName}`, data: dataUrlBytes(jpeg) })
  }
  return files
}

export function datedName(base: string, extension: string) {
  const day = new Date().toISOString().slice(0, 10)
  return `${base}-${day}.${extension}`
}

export async function exportCsv(filename: string, rows: ReportRow[]) {
  const photos = await photoFiles(rows)
  const csv = new TextEncoder().encode(csvText(rows))
  if (photos.length === 0) {
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
    return
  }
  const zipName = filename.replace(/\.csv$/, '.zip')
  downloadBlob(zipStore([{ name: filename, data: csv }, ...photos]), zipName)
}

export async function exportXlsx(filename: string, rows: ReportRow[]) {
  const sheet = utils.json_to_sheet(sheetRows(rows))
  const book = utils.book_new()
  utils.book_append_sheet(book, sheet, 'Vesne demo')
  const photos = await photoFiles(rows)
  if (photos.length === 0) {
    writeFile(book, filename)
    return
  }
  const workbook = write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const zipName = filename.replace(/\.xlsx$/, '.zip')
  downloadBlob(zipStore([{ name: filename, data: new Uint8Array(workbook) }, ...photos]), zipName)
}

export async function exportPdf(filename: string, title: string, rows: ReportRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.setTextColor(63, 44, 30)
  doc.text(title, 40, 36)
  doc.setFontSize(10)
  doc.setTextColor(122, 91, 69)
  doc.text('Proof photographs include a location card with the place, address, coordinates, and time.', 40, 56)
  autoTable(doc, {
    startY: 72,
    head: [['Task', 'Project', 'Client', 'Location', 'Executor', 'Status', 'Target', 'Proof image']],
    body: rows.map((row) => [
      row.taskCode,
      row.project,
      row.client,
      row.location,
      row.executor,
      row.status,
      row.targetDate,
      row.imageName || row.proofRef,
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [224, 106, 18] },
  })
  for (const row of rows) {
    if (!row.imageDataUrl) continue
    const jpeg = await proofJpeg(row)
    doc.addPage()
    doc.setFontSize(14)
    doc.setTextColor(63, 44, 30)
    doc.text(`${row.taskCode} · ${row.location}`, 40, 40)
    doc.setFontSize(10)
    doc.setTextColor(122, 91, 69)
    doc.text(`${row.project} · ${row.status} · ${row.imageName}`, 40, 58)
    doc.addImage(jpeg, 'JPEG', 40, 76, 520, 340)
    doc.text('The photograph includes the location card: place, address, coordinates, and time.', 40, 436)
  }
  doc.save(filename)
}
