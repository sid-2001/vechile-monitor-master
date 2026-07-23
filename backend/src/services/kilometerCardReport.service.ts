import PDFDocument from 'pdfkit'
import { Response } from 'express'
import KilometerCard from '../models/KilometerCard'

const MONTH_NAMES = [
  '',
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

const drawCell = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text = '',
  options: {
    fontSize?: number
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    padding?: number
  } = {}
) => {
  const {
    fontSize = 6,
    align = 'center',
    bold = false,
    padding = 2,
  } = options

  doc
    .lineWidth(0.5)
    .rect(x, y, width, height)
    .stroke('#000000')

  doc
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(fontSize)
    .fillColor('#000000')

  const textHeight = doc.heightOfString(String(text), {
    width: width - padding * 2,
    align,
  })

  const textY = y + Math.max((height - textHeight) / 2, 1)

  doc.text(String(text), x + padding, textY, {
    width: width - padding * 2,
    align,
    lineBreak: false,
  })
}

const drawUnderlinedField = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number,
  x: number,
  y: number,
  valueX: number,
  lineWidth: number
) => {
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('black')
    .text(label, x, y)

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('black')
    .text(String(value ?? ''), valueX, y)

  doc
    .moveTo(valueX, y + 10)
    .lineTo(valueX + lineWidth, y + 10)
    .lineWidth(0.6)
    .strokeColor('black')
    .stroke()
}

export const generateKilometerCardReport = async (
  vehicleId: string,
  month: number,
  year: number,
  res: Response
) => {
  const card = await KilometerCard.findOne({
    vehicleId,
    month,
    year,
  }).lean()

  if (!card) {
    throw new Error('Kilometer card not found')
  }

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 18,
  })

  const monthName = MONTH_NAMES[month]

  const fileName = `Kilometer-Card-${card.vehicleNo}-${monthName}-${year}.pdf`

  res.setHeader('Content-Type', 'application/pdf')

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"`
  )

  doc.pipe(res)

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  // Yellow Kilometer Card background
  doc
    .rect(0, 0, pageWidth, pageHeight)
    .fill('#E3D329')

  doc.fillColor('#000000')

  const left = 22
  const right = 22
  const contentWidth = pageWidth - left - right

  // =========================
  // TOP HEADING
  // =========================

  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('KILOMETER CARD', left, 18, {
      width: contentWidth,
      align: 'center',
    })

  doc
    .font('Helvetica')
    .fontSize(6)
    .text(
      'In lieu of AFZ-2212 (Revised)',
      left,
      20,
      {
        width: contentWidth,
        align: 'right',
      }
    )

  // =========================
  // VEHICLE DETAILS
  // =========================
doc
  .font('Helvetica')
  .fontSize(7)
  .text('Vehicle No.', left, 45)

doc
  .font('Helvetica-Bold')
  .text(String(card.vehicleNo ?? ''), left + 52, 45)

doc
  .moveTo(left + 52, 54)
  .lineTo(left + 170, 54)
  .lineWidth(0.5)
  .strokeColor('black')
  .stroke()


doc
  .font('Helvetica')
  .fontSize(7)
  .text('Nomenclature', left + 220, 45)

doc
  .font('Helvetica-Bold')
  .text(
    String(card.nomenclature ?? ''),
    left + 280,
    45
  )

doc
  .moveTo(left + 280, 54)
  .lineTo(left + 390, 54)
  .lineWidth(0.5)
  .strokeColor('black')
  .stroke()


doc
  .font('Helvetica')
  .fontSize(7)
  .text('Balance in Tank', left + 440, 45)

doc
  .font('Helvetica-Bold')
  .text(
    String(card.balanceInTank ?? ''),
    left + 510,
    45
  )

doc
  .moveTo(left + 510, 54)
  .lineTo(left + 600, 54)
  .lineWidth(0.5)
  .strokeColor('black')
  .stroke()


doc
  .font('Helvetica')
  .fontSize(7)
  .text('Target as per Workshop', left, 58)

doc
  .font('Helvetica-Bold')
  .text(
    String(card.targetAsPerWorkshop ?? ''),
    left + 100,
    58
  )

doc
  .moveTo(left + 100, 67)
  .lineTo(left + 220, 67)
  .lineWidth(0.5)
  .strokeColor('black')
  .stroke()


doc
  .font('Helvetica')
  .fontSize(7)
  .text('Target KPL as per AO', left + 350, 58)

doc
  .font('Helvetica-Bold')
  .text(
    String(card.targetKplAsPerAo ?? ''),
    left + 445,
    58
  )

doc
  .moveTo(left + 445, 67)
  .lineTo(left + 555, 67)
  .lineWidth(0.5)
  .strokeColor('black')
  .stroke()

  // =========================
  // MONTH HEADING
  // =========================

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(
      `${monthName} ${year}`,
      left,
      75,
      {
        width: contentWidth,
        align: 'center',
      }
    )

  // =========================
  // TABLE DIMENSIONS
  // =========================

  const tableX = left
  const tableY = 92

  const dateWidth = 45
  const mileageWidth = 300
  const srWidth = 85
  const trgWidth = 85
  const polWidth = 120
  const engineOilWidth = 120

  const headerHeight = 36
  const subHeaderHeight = 18
  const rowHeight = 10

  const tableWidth =
    dateWidth +
    mileageWidth +
    srWidth +
    trgWidth +
    polWidth +
    engineOilWidth

  // =========================
  // TABLE HEADER
  // =========================

  drawCell(
    doc,
    tableX,
    tableY,
    dateWidth,
    headerHeight + subHeaderHeight,
    'DATE',
    {
      fontSize: 7,
      bold: true,
    }
  )

  drawCell(
    doc,
    tableX + dateWidth,
    tableY,
    mileageWidth,
    headerHeight + subHeaderHeight,
    'DUTY INCLUDING AMENITY',
    {
      fontSize: 7,
      bold: true,
    }
  )

  drawCell(
    doc,
    tableX + dateWidth + mileageWidth,
    tableY,
    srWidth,
    headerHeight + subHeaderHeight,
    'SR',
    {
      fontSize: 7,
      bold: true,
    }
  )

  drawCell(
    doc,
    tableX + dateWidth + mileageWidth + srWidth,
    tableY,
    trgWidth,
    headerHeight + subHeaderHeight,
    'TRG',
    {
      fontSize: 7,
      bold: true,
    }
  )

  const fuelX =
    tableX +
    dateWidth +
    mileageWidth +
    srWidth +
    trgWidth

  drawCell(
    doc,
    fuelX,
    tableY,
    polWidth + engineOilWidth,
    headerHeight,
    'FUEL DRAWN',
    {
      fontSize: 7,
      bold: true,
    }
  )

  drawCell(
    doc,
    fuelX,
    tableY + headerHeight,
    polWidth,
    subHeaderHeight,
    'POL',
    {
      fontSize: 7,
      bold: true,
    }
  )

  drawCell(
    doc,
    fuelX + polWidth,
    tableY + headerHeight,
    engineOilWidth,
    subHeaderHeight,
    'ENG. OIL',
    {
      fontSize: 7,
      bold: true,
    }
  )

  // =========================
  // DAILY ROWS 1 - 31
  // =========================

  const dailyStartY =
    tableY + headerHeight + subHeaderHeight

  for (let day = 1; day <= 31; day++) {
    const rowY =
      dailyStartY + (day - 1) * rowHeight

    const entry = card.dailyEntries.find(
      (item) => item.date === day
    )

    drawCell(
      doc,
      tableX,
      rowY,
      dateWidth,
      rowHeight,
      String(day),
      {
        fontSize: 5.5,
        bold: true,
      }
    )

    drawCell(
      doc,
      tableX + dateWidth,
      rowY,
      mileageWidth,
      rowHeight,
      entry
        ? String(entry.dailyMileageIncludingAmenity ?? '')
        : '',
      {
        fontSize: 5.5,
      }
    )

    drawCell(
      doc,
      tableX + dateWidth + mileageWidth,
      rowY,
      srWidth,
      rowHeight,
      entry ? String(entry.sr ?? '') : '',
      {
        fontSize: 5.5,
      }
    )

    drawCell(
      doc,
      tableX + dateWidth + mileageWidth + srWidth,
      rowY,
      trgWidth,
      rowHeight,
      entry ? String(entry.trg ?? '') : '',
      {
        fontSize: 5.5,
      }
    )

    drawCell(
      doc,
      fuelX,
      rowY,
      polWidth,
      rowHeight,
      entry ? String(entry.fuelDrawnPol ?? '') : '',
      {
        fontSize: 5.5,
      }
    )

    drawCell(
      doc,
      fuelX + polWidth,
      rowY,
      engineOilWidth,
      rowHeight,
      entry
        ? String(entry.fuelDrawnEngineOil ?? '')
        : '',
      {
        fontSize: 5.5,
      }
    )
  }

  // =========================
  // TOTAL ROW
  // =========================

  const totalY =
    dailyStartY + 31 * rowHeight

  drawCell(
    doc,
    tableX,
    totalY,
    dateWidth,
    16,
    'TOTAL',
    {
      fontSize: 6,
      bold: true,
    }
  )

  const totalMileage = card.dailyEntries.reduce(
    (sum, entry) =>
      sum +
      Number(
        entry.dailyMileageIncludingAmenity || 0
      ),
    0
  )

  const totalSr = card.dailyEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.sr || 0),
    0
  )

  const totalTrg = card.dailyEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.trg || 0),
    0
  )

  const totalPol = card.dailyEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.fuelDrawnPol || 0),
    0
  )

  const totalEngineOil = card.dailyEntries.reduce(
    (sum, entry) =>
      sum +
      Number(entry.fuelDrawnEngineOil || 0),
    0
  )

  drawCell(
    doc,
    tableX + dateWidth,
    totalY,
    mileageWidth,
    16,
    String(totalMileage),
    {
      bold: true,
    }
  )

  drawCell(
    doc,
    tableX + dateWidth + mileageWidth,
    totalY,
    srWidth,
    16,
    String(totalSr),
    {
      bold: true,
    }
  )

  drawCell(
    doc,
    tableX + dateWidth + mileageWidth + srWidth,
    totalY,
    trgWidth,
    16,
    String(totalTrg),
    {
      bold: true,
    }
  )

  drawCell(
    doc,
    fuelX,
    totalY,
    polWidth,
    16,
    String(totalPol),
    {
      bold: true,
    }
  )

  drawCell(
    doc,
    fuelX + polWidth,
    totalY,
    engineOilWidth,
    16,
    String(totalEngineOil),
    {
      bold: true,
    }
  )

  // =========================
  // MONTHLY SUMMARY
  // =========================

  const summaryY = totalY + 16
  const summaryLabelWidth = 600
  const summaryValueWidth =
    tableWidth - summaryLabelWidth
  const summaryRowHeight = 14

  const summaryRows = [
    {
      label:
        '1. Balance fuel in the tank on last day of month',
      value: card.balanceFuelInTank,
    },
    {
      label:
        '2. Total fuel consumed for the month',
      value: card.totalFuelConsumed,
    },
    {
      label:
        '3. Total fuel consumed for his static running',
      value:
        card.totalFuelConsumedStaticEngineDuty,
    },
    {
      label:
        '4. Total fuel consumed for duty and trg.',
      value: card.totalFuelConsumedIdling,
    },
    {
      label: '5. Total Kms run',
      value: card.totalKmsRun,
    },
    {
      label: '6. K.L. achieved',
      value: card.kplAchieved,
    },
  ]

  summaryRows.forEach((row, index) => {
    const rowY =
      summaryY + index * summaryRowHeight

    drawCell(
      doc,
      tableX,
      rowY,
      summaryLabelWidth,
      summaryRowHeight,
      row.label,
      {
        fontSize: 6,
        align: 'left',
        bold: true,
        padding: 5,
      }
    )

    drawCell(
      doc,
      tableX + summaryLabelWidth,
      rowY,
      summaryValueWidth,
      summaryRowHeight,
      String(row.value ?? ''),
      {
        fontSize: 6,
        bold: true,
      }
    )
  })

  // =========================
  // SIGNATURE
  // =========================

  const signatureY =
    summaryY +
    summaryRows.length * summaryRowHeight +
    8

  doc
    .font('Helvetica')
    .fontSize(7)
    .text(
      'Sig of OC/Representative',
      tableX,
      signatureY,
      {
        width: tableWidth,
        align: 'right',
      }
    )

  doc.end()
}