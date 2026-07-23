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
    .fontSize(7)
    .fillColor('#000000')
    .text(label, x, y)

  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor('#000000')
    .text(String(value ?? ''), valueX, y)

  doc
    .moveTo(valueX, y + 9)
    .lineTo(valueX + lineWidth, y + 9)
    .lineWidth(0.5)
    .strokeColor('#000000')
    .stroke()
}

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
    fontSize = 5,
    align = 'center',
    bold = false,
    padding = 1,
  } = options

  doc
    .lineWidth(0.4)
    .rect(x, y, width, height)
    .stroke('#000000')

  doc
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(fontSize)
    .fillColor('#000000')

  const value = String(text ?? '')

  const textHeight = doc.heightOfString(value, {
    width: width - padding * 2,
    align,
  })

  const textY =
    y + Math.max((height - textHeight) / 2, 1)

  doc.text(
    value,
    x + padding,
    textY,
    {
      width: width - padding * 2,
      align,
      lineBreak: false,
    }
  )
}

const getFinancialWindow = (
  selectedMonth: number,
  selectedYear: number
) => {
  if (
    selectedMonth >= 4 &&
    selectedMonth <= 9
  ) {
    return {
      months: [4, 5, 6, 7, 8, 9],
      startYear: selectedYear,
      endYear: selectedYear,
      label: `APRIL - SEPTEMBER ${selectedYear}`,
    }
  }

  if (selectedMonth >= 10) {
    return {
      months: [10, 11, 12, 1, 2, 3],
      startYear: selectedYear,
      endYear: selectedYear + 1,
      label: `OCTOBER ${selectedYear} - MARCH ${
        selectedYear + 1
      }`,
    }
  }

  return {
    months: [10, 11, 12, 1, 2, 3],
    startYear: selectedYear - 1,
    endYear: selectedYear,
    label: `OCTOBER ${
      selectedYear - 1
    } - MARCH ${selectedYear}`,
  }
}

export const generateKilometerCardHalfYearReport =
  async (
    vehicleId: string,
    month: number,
    year: number,
    res: Response
  ) => {
    const window = getFinancialWindow(
      month,
      year
    )

    const monthQueries =
      window.months.map((monthNumber) => {
        const cardYear =
          monthNumber >= 10
            ? window.startYear
            : window.endYear

        return {
          vehicleId,
          month: monthNumber,
          year: cardYear,
        }
      })

    const cards = await KilometerCard.find({
      $or: monthQueries,
    }).lean()

    if (!cards.length) {
      throw new Error(
        'No kilometer card data found for selected six month window'
      )
    }
    const detailCard = cards[0]

    const firstCard = cards[0]

    const cardMap = new Map<string, any>()

    cards.forEach((card) => {
      cardMap.set(
        `${card.year}-${card.month}`,
        card
      )
    })

    const doc = new PDFDocument({
      size: 'A3',
      layout: 'landscape',
      margin: 12,
    })

    const fileName =
      `Kilometer-Card-${firstCard.vehicleNo}-${window.label.replace(
        /\s+/g,
        '-'
      )}.pdf`

    res.setHeader(
      'Content-Type',
      'application/pdf'
    )

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    )

    doc.pipe(res)

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height

    doc
      .rect(
        0,
        0,
        pageWidth,
        pageHeight
      )
      .fill('#E3D329')

    doc.fillColor('#000000')

    const left = 20
    const right = 20

    const contentWidth =
      pageWidth - left - right

    // =========================
    // TITLE
    // =========================

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(
        'KILOMETER CARD',
        left,
        14,
        {
          width: contentWidth,
          align: 'center',
        }
      )

    doc
      .font('Helvetica')
      .fontSize(6) 
      .text(
        'In lieu of IAFZ-2212 (Revised)',
        left,
        18,
        {
          width: contentWidth,
          align: 'right',
        }
      )

    // =========================
    // VEHICLE DETAILS
    // =========================

   // =========================
// VEHICLE DETAILS - SINGLE HORIZONTAL LINE
// =========================

const detailY = 45

drawUnderlinedField(
  doc,
  'Vehicle No.',
  detailCard.vehicleNo ?? '',
  left,
  detailY,
  left + 42,
  72
)

drawUnderlinedField(
  doc,
  'Nomenclature',
  detailCard.nomenclature ?? '',
  left + 125,
  detailY,
  left + 183,
  72
)

drawUnderlinedField(
  doc,
  'Balance in Tank',
  detailCard.balanceInTank ?? '',
  left + 270,
  detailY,
  left + 337,
  55
)

drawUnderlinedField(
  doc,
  'Target as per Workshop',
  detailCard.targetAsPerWorkshop ?? '',
  left + 405,
  detailY,
  left + 500,
  55
)

drawUnderlinedField(
  doc,
  'Target KPL as per AO',
  detailCard.targetKplAsPerAo ?? '',
  left + 575,
  detailY,
  left + 663,
  55
)

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(
        window.label,
        left,
        detailY + 14,
        {
          width: contentWidth,
          align: 'right',
        }
      )

    // =========================
    // TABLE DIMENSIONS
    // =========================

    const tableX = left
    const tableY = 78

    const dateWidth = 42

    const monthWidth =
      (contentWidth - dateWidth) / 6

    const dutyWidth =
      monthWidth * 0.28

    const srWidth =
      monthWidth * 0.13

    const trgWidth =
      monthWidth * 0.13

    const polWidth =
      monthWidth * 0.23

    const oilWidth =
      monthWidth * 0.23

    const monthHeaderHeight = 20
    const columnHeaderHeight = 28
    const rowHeight = 13

    // =========================
    // DATE HEADER
    // =========================

    drawCell(
      doc,
      tableX,
      tableY,
      dateWidth,
      monthHeaderHeight +
        columnHeaderHeight,
      'DATE',
      {
        bold: true,
        fontSize: 6,
      }
    )

    // =========================
    // MONTH HEADERS
    // =========================

    window.months.forEach(
      (monthNumber, monthIndex) => {
        const monthX =
          tableX +
          dateWidth +
          monthIndex * monthWidth

        drawCell(
          doc,
          monthX,
          tableY,
          monthWidth,
          monthHeaderHeight,
          MONTH_NAMES[monthNumber],
          {
            bold: true,
            fontSize: 7,
          }
        )

        drawCell(
          doc,
          monthX,
          tableY + monthHeaderHeight,
          dutyWidth,
          columnHeaderHeight,
          'DUTY INCLUDING AMENITY',
          {
            bold: true,
            fontSize: 4.5,
          }
        )

        drawCell(
          doc,
          monthX + dutyWidth,
          tableY + monthHeaderHeight,
          srWidth,
          columnHeaderHeight,
          'SR',
          {
            bold: true,
            fontSize: 5,
          }
        )

        drawCell(
          doc,
          monthX +
            dutyWidth +
            srWidth,
          tableY + monthHeaderHeight,
          trgWidth,
          columnHeaderHeight,
          'TRG',
          {
            bold: true,
            fontSize: 5,
          }
        )

       drawCell(
  doc,
  monthX +
    dutyWidth +
    srWidth +
    trgWidth,
  tableY + monthHeaderHeight,
  polWidth + oilWidth,
  columnHeaderHeight / 2,
  'FUEL DRAWN',
  {
    bold: true,
    fontSize: 5,
  }
)

drawCell(
  doc,
  monthX +
    dutyWidth +
    srWidth +
    trgWidth,
  tableY +
    monthHeaderHeight +
    columnHeaderHeight / 2,
  polWidth,
  columnHeaderHeight / 2,
  'POL',
  {
    bold: true,
    fontSize: 4.5,
  }
)

drawCell(
  doc,
  monthX +
    dutyWidth +
    srWidth +
    trgWidth +
    polWidth,
  tableY +
    monthHeaderHeight +
    columnHeaderHeight / 2,
  oilWidth,
  columnHeaderHeight / 2,
  'ENG. OIL',
  {
    bold: true,
    fontSize: 4.5,
  }
)
      }
    )

    // =========================
    // DAILY ROWS
    // =========================

    const dailyStartY =
      tableY +
      monthHeaderHeight +
      columnHeaderHeight

    for (
      let day = 1;
      day <= 31;
      day++
    ) {
      const rowY =
        dailyStartY +
        (day - 1) * rowHeight

      drawCell(
        doc,
        tableX,
        rowY,
        dateWidth,
        rowHeight,
        String(day),
        {
          bold: true,
          fontSize: 5,
        }
      )

      window.months.forEach(
        (monthNumber, monthIndex) => {
          const cardYear =
            monthNumber >= 10
              ? window.startYear
              : window.endYear

          const card = cardMap.get(
            `${cardYear}-${monthNumber}`
          )

          const entry =
            card?.dailyEntries?.find(
              (item: any) =>
                item.date === day
            )

          const monthX =
            tableX +
            dateWidth +
            monthIndex * monthWidth

          drawCell(
            doc,
            monthX,
            rowY,
            dutyWidth,
            rowHeight,
            entry
              ? String(
                  entry.dailyMileageIncludingAmenity ??
                    ''
                )
              : '',
            {
              fontSize: 5,
            }
          )

          drawCell(
            doc,
            monthX + dutyWidth,
            rowY,
            srWidth,
            rowHeight,
            entry
              ? String(entry.sr ?? '')
              : '',
            {
              fontSize: 5,
            }
          )

          drawCell(
            doc,
            monthX +
              dutyWidth +
              srWidth,
            rowY,
            trgWidth,
            rowHeight,
            entry
              ? String(entry.trg ?? '')
              : '',
            {
              fontSize: 5,
            }
          )

          drawCell(
            doc,
            monthX +
              dutyWidth +
              srWidth +
              trgWidth,
            rowY,
            polWidth,
            rowHeight,
            entry
              ? String(
                  entry.fuelDrawnPol ??
                    ''
                )
              : '',
            {
              fontSize: 5,
            }
          )

          drawCell(
            doc,
            monthX +
              dutyWidth +
              srWidth +
              trgWidth +
              polWidth,
            rowY,
            oilWidth,
            rowHeight,
            entry
              ? String(
                  entry.fuelDrawnEngineOil ??
                    ''
                )
              : '',
            {
              fontSize: 5,
            }
          )
        }
      )
    }

    // =========================
    // TOTAL ROW
    // =========================

    const totalY =
      dailyStartY +
      31 * rowHeight

    drawCell(
      doc,
      tableX,
      totalY,
      dateWidth,
      18,
      'TOTAL',
      {
        bold: true,
        fontSize: 5,
      }
    )

    window.months.forEach(
      (monthNumber, monthIndex) => {
        const cardYear =
          monthNumber >= 10
            ? window.startYear
            : window.endYear

        const card = cardMap.get(
          `${cardYear}-${monthNumber}`
        )

        const monthX =
          tableX +
          dateWidth +
          monthIndex * monthWidth

        const totalDuty =
          card?.dailyEntries?.reduce(
            (
              sum: number,
              entry: any
            ) =>
              sum +
              Number(
                entry.dailyMileageIncludingAmenity ||
                  0
              ),
            0
          ) || 0

        const totalSr =
          card?.dailyEntries?.reduce(
            (
              sum: number,
              entry: any
            ) =>
              sum +
              Number(entry.sr || 0),
            0
          ) || 0

        const totalTrg =
          card?.dailyEntries?.reduce(
            (
              sum: number,
              entry: any
            ) =>
              sum +
              Number(entry.trg || 0),
            0
          ) || 0

        const totalPol =
          card?.dailyEntries?.reduce(
            (
              sum: number,
              entry: any
            ) =>
              sum +
              Number(
                entry.fuelDrawnPol || 0
              ),
            0
          ) || 0

        const totalOil =
          card?.dailyEntries?.reduce(
            (
              sum: number,
              entry: any
            ) =>
              sum +
              Number(
                entry.fuelDrawnEngineOil ||
                  0
              ),
            0
          ) || 0

        const totals = [
          {
            width: dutyWidth,
            value: totalDuty,
          },
          {
            width: srWidth,
            value: totalSr,
          },
          {
            width: trgWidth,
            value: totalTrg,
          },
          {
            width: polWidth,
            value: totalPol,
          },
          {
            width: oilWidth,
            value: totalOil,
          },
        ]

        let currentX = monthX

        totals.forEach((total) => {
          drawCell(
            doc,
            currentX,
            totalY,
            total.width,
            18,
            String(total.value),
            {
              bold: true,
              fontSize: 5,
            }
          )

          currentX += total.width
        })
      }
    )

    // =========================
    // MONTHLY SUMMARY
    // =========================

    const summaryY = totalY + 18

    const summaryRows = [
      {
        label:
          '1. Balance fuel in the tank on last day of month',
        key: 'balanceFuelInTank',
      },
      {
        label:
          '2. Total fuel consumed for the month',
        key: 'totalFuelConsumed',
      },
      {
        label:
          '3. Total fuel consumed for his static running',
        key:
          'totalFuelConsumedStaticEngineDuty',
      },
      {
        label:
          '4. Total fuel consumed for duty and trg.',
        key: 'totalFuelConsumedIdling',
      },
      {
        label: '5. Total Kms run',
        key: 'totalKmsRun',
      },
      {
        label: '6. K.L. achieved',
        key: 'kplAchieved',
      },
    ]

    const summaryLabelWidth = dateWidth
    const summaryRowHeight = 16

    summaryRows.forEach(
      (summary, rowIndex) => {
        const rowY =
          summaryY +
          rowIndex *
            summaryRowHeight

        drawCell(
          doc,
          tableX,
          rowY,
          summaryLabelWidth,
          summaryRowHeight,
          String(rowIndex + 1),
          {
            bold: true,
            fontSize: 5,
          }
        )

        window.months.forEach(
          (
            monthNumber,
            monthIndex
          ) => {
            const cardYear =
              monthNumber >= 10
                ? window.startYear
                : window.endYear

            const card = cardMap.get(
              `${cardYear}-${monthNumber}`
            )

            const monthX =
              tableX +
              dateWidth +
              monthIndex *
                monthWidth

            drawCell(
              doc,
              monthX,
              rowY,
              monthWidth,
              summaryRowHeight,
              card
                ? String(
                    (card as any)[
                      summary.key
                    ] ?? ''
                  )
                : '',
              {
                bold: true,
                fontSize: 5,
              }
            )
          }
        )

        doc
          .font('Helvetica')
          .fontSize(4)
          .fillColor('#000000')
          .text(
            summary.label,
            tableX + 2,
            rowY + 2,
            {
              width:
                summaryLabelWidth - 4,
              align: 'left',
            }
          )
      }
    )

    // =========================
    // SIGNATURE ROW
    // =========================

    const signatureY =
      summaryY +
      summaryRows.length *
        summaryRowHeight

    drawCell(
      doc,
      tableX,
      signatureY,
      dateWidth,
      24,
      '',
      {
        fontSize: 5,
      }
    )

    window.months.forEach(
      (_, monthIndex) => {
        const monthX =
          tableX +
          dateWidth +
          monthIndex * monthWidth

        drawCell(
          doc,
          monthX,
          signatureY,
          monthWidth,
          24,
          'Sig of OC/Representative',
          {
            fontSize: 5,
          }
        )
      }
    )

    doc.end()
  }