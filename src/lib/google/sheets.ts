import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';

// Layout constants — updated for new clean design
// Row 1: Title bar
// Row 2: Spacer
// Row 3: Card labels (PEMASUKAN, PENGELUARAN, SALDO)
// Row 4: Card values (large currency)
// Row 5: Spacer
// Row 6: TRANSAKSI title
// Row 7: Column headers
// Row 8+: Data
const HEADER_ROW = 7;
const DATA_START_ROW = 8;

/**
 * Create a new spreadsheet with summary section and transaction table
 */
export async function createSpreadsheet(accessToken: string, userEmail: string): Promise<string> {
  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: `Dompetku - Keuangan (${userEmail})`,
      },
      sheets: [
        { properties: { title: 'Transaksi', index: 0 } }
      ]
    }
  });

  const spreadsheetId = response.data.spreadsheetId!;
  const sheetId = response.data.sheets?.[0]?.properties?.sheetId ?? 0;

  await writeInitialStructure(auth, spreadsheetId);
  await applyFormatting(auth, spreadsheetId, sheetId);

  return spreadsheetId;
}

/**
 * Write the initial structure (summary + headers) to a fresh spreadsheet
 */
async function writeInitialStructure(auth: any, spreadsheetId: string) {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Transaksi!A1:E7',
          values: [
            // Row 1: Main title
            ['💰 RINGKASAN KEUANGAN', '', '', '', ''],
            // Row 2: spacer
            ['', '', '', '', ''],
            // Row 3: Labels
            ['PEMASUKAN', '', 'PENGELUARAN', '', 'SALDO'],
            // Row 4: Values (with formulas) — note columns: A merges with B, C with D, E standalone
            [
              `=IFERROR(SUMIF(E${DATA_START_ROW}:E,"Pemasukan",D${DATA_START_ROW}:D),0)`,
              '',
              `=IFERROR(SUMIF(E${DATA_START_ROW}:E,"Pengeluaran",D${DATA_START_ROW}:D),0)`,
              '',
              `=A4-C4`
            ],
            // Row 5: spacer
            ['', '', '', '', ''],
            // Row 6: TRANSAKSI title
            ['📋 RIWAYAT TRANSAKSI', '', '', '', ''],
            // Row 7: Column headers
            ['Tanggal', 'Kategori', 'Catatan', 'Jumlah', 'Tipe'],
          ]
        }
      ]
    }
  });
}

/**
 * Apply formatting to the spreadsheet
 */
async function applyFormatting(auth: any, spreadsheetId: string, sheetId: number) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Color palette (RGB 0-1 range)
  const colors = {
    primary: { red: 0.0, green: 0.35, blue: 0.76 },
    primaryLight: { red: 0.92, green: 0.94, blue: 1.0 },
    primaryVeryLight: { red: 0.97, green: 0.98, blue: 1.0 },
    success: { red: 0.0, green: 0.55, blue: 0.3 },
    successLight: { red: 0.90, green: 0.97, blue: 0.92 },
    danger: { red: 0.80, green: 0.18, blue: 0.18 },
    dangerLight: { red: 0.99, green: 0.92, blue: 0.92 },
    neutralDark: { red: 0.15, green: 0.20, blue: 0.30 },
    white: { red: 1, green: 1, blue: 1 },
    border: { red: 0.82, green: 0.85, blue: 0.90 },
    textDark: { red: 0.15, green: 0.20, blue: 0.30 },
    textMuted: { red: 0.45, green: 0.50, blue: 0.58 },
  };

  const thinBorder = { style: 'SOLID', color: colors.border, width: 1 };
  const mediumBorder = { style: 'SOLID_MEDIUM', color: colors.border, width: 1 };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // ═══ ROW 1: Main Title Bar ═══
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
            mergeType: 'MERGE_ALL'
          }
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 16, foregroundColor: colors.white },
                backgroundColor: colors.primary,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)'
          }
        },

        // ═══ ROW 2: Spacer (no background) ═══
        
        // ═══ ROW 3-4: Summary Cards ═══
        // Merge labels: A3:B3, C3:D3, E3 (single)
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
            mergeType: 'MERGE_ALL'
          }
        },
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 2, endColumnIndex: 4 },
            mergeType: 'MERGE_ALL'
          }
        },
        // Merge values: A4:B4, C4:D4, E4 (single)
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 2 },
            mergeType: 'MERGE_ALL'
          }
        },
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 2, endColumnIndex: 4 },
            mergeType: 'MERGE_ALL'
          }
        },
        
        // Label styling (row 3)
        // PEMASUKAN label (green tint)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: colors.success },
                backgroundColor: colors.successLight,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: mediumBorder, left: thinBorder, right: thinBorder, bottom: { style: 'NONE' }
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,borders)'
          }
        },
        // PENGELUARAN label (red tint)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 2, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: colors.danger },
                backgroundColor: colors.dangerLight,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: mediumBorder, left: thinBorder, right: thinBorder, bottom: { style: 'NONE' }
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,borders)'
          }
        },
        // SALDO label (blue tint)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 4, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: colors.primary },
                backgroundColor: colors.primaryLight,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: mediumBorder, left: thinBorder, right: thinBorder, bottom: { style: 'NONE' }
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,borders)'
          }
        },

        // Value styling (row 4)
        // PEMASUKAN value
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 18, foregroundColor: colors.success },
                backgroundColor: colors.white,
                numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: { style: 'NONE' }, left: thinBorder, right: thinBorder, bottom: mediumBorder
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,numberFormat,horizontalAlignment,verticalAlignment,borders)'
          }
        },
        // PENGELUARAN value
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 2, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 18, foregroundColor: colors.danger },
                backgroundColor: colors.white,
                numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: { style: 'NONE' }, left: thinBorder, right: thinBorder, bottom: mediumBorder
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,numberFormat,horizontalAlignment,verticalAlignment,borders)'
          }
        },
        // SALDO value
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 18, foregroundColor: colors.primary },
                backgroundColor: colors.white,
                numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: { style: 'NONE' }, left: thinBorder, right: thinBorder, bottom: mediumBorder
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,numberFormat,horizontalAlignment,verticalAlignment,borders)'
          }
        },

        // ═══ ROW 6: TRANSAKSI Title ═══
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 5 },
            mergeType: 'MERGE_ALL'
          }
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 13, foregroundColor: colors.white },
                backgroundColor: colors.neutralDark,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)'
          }
        },

        // ═══ ROW 7: Column Headers ═══
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 6, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: colors.textDark },
                backgroundColor: colors.primaryLight,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
                borders: {
                  top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
                }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,borders)'
          }
        },

        // ═══ Row Heights ═══
        // Row 1 (title) — taller
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 48 },
            fields: 'pixelSize'
          }
        },
        // Row 2 (spacer) — thin
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 12 },
            fields: 'pixelSize'
          }
        },
        // Row 3 (card labels)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 32 },
            fields: 'pixelSize'
          }
        },
        // Row 4 (card values) — tallest
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 3, endIndex: 4 },
            properties: { pixelSize: 56 },
            fields: 'pixelSize'
          }
        },
        // Row 5 (spacer)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 4, endIndex: 5 },
            properties: { pixelSize: 16 },
            fields: 'pixelSize'
          }
        },
        // Row 6 (TRANSAKSI title)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 5, endIndex: 6 },
            properties: { pixelSize: 38 },
            fields: 'pixelSize'
          }
        },
        // Row 7 (headers)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 6, endIndex: 7 },
            properties: { pixelSize: 32 },
            fields: 'pixelSize'
          }
        },

        // ═══ Column Widths ═══
        // A: Tanggal
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 110 },
            fields: 'pixelSize'
          }
        },
        // B: Kategori
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 150 },
            fields: 'pixelSize'
          }
        },
        // C: Catatan (lebar untuk notes)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 260 },
            fields: 'pixelSize'
          }
        },
        // D: Jumlah
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
            properties: { pixelSize: 140 },
            fields: 'pixelSize'
          }
        },
        // E: Tipe
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
            properties: { pixelSize: 130 },
            fields: 'pixelSize'
          }
        },

        // ═══ Freeze header rows ═══
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: HEADER_ROW } },
            fields: 'gridProperties.frozenRowCount'
          }
        },

        // Hide gridlines for cleaner look
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { hideGridlines: true } },
            fields: 'gridProperties.hideGridlines'
          }
        },
      ]
    }
  });
}

/**
 * Full sync: clear transaction data and rewrite from database
 * Keeps summary section and headers intact
 */
export async function fullSync(
  accessToken: string,
  spreadsheetId: string,
  transactions: any[],
  _categories: any[] // no longer used
) {
  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const transaksiSheet = meta.data.sheets?.find(s => s.properties?.title === 'Transaksi');
  
  if (!transaksiSheet) {
    throw new Error('Transaksi sheet not found. Please reconnect.');
  }

  const sheetId = transaksiSheet.properties?.sheetId!;

  // Check if structure exists by verifying the header row
  const checkRange = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Transaksi!A${HEADER_ROW}:A${HEADER_ROW}`
  });
  
  const hasStructure = checkRange.data.values?.[0]?.[0] === 'Tanggal';
  
  if (!hasStructure) {
    await writeInitialStructure(auth, spreadsheetId);
    await applyFormatting(auth, spreadsheetId, sheetId);
  }

  // Clear existing transaction data (keep summary & headers)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `Transaksi!A${DATA_START_ROW}:E`
  });

  if (transactions.length === 0) return;

  const rows = transactions.map(tx => {
    const amount = Math.abs(Number(tx.amount));
    const type = Number(tx.amount) < 0 ? 'Pemasukan' : 'Pengeluaran';
    const date = new Date(tx.date).toLocaleDateString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    
    return [
      date,
      tx.category?.name || 'Tanpa Kategori',
      tx.note || '-',
      amount,
      type
    ];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Transaksi!A${DATA_START_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });

  // Format transaction data rows
  const dataStartIdx = DATA_START_ROW - 1; // 0-indexed
  const dataEndIdx = dataStartIdx + rows.length;
  const borderColor = { red: 0.88, green: 0.91, blue: 0.95 };
  const thinBorder = { style: 'SOLID', color: borderColor, width: 1 };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Apply base styling to all data rows
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: dataStartIdx,
              endRowIndex: dataEndIdx,
              startColumnIndex: 0,
              endColumnIndex: 5
            },
            cell: {
              userEnteredFormat: {
                textFormat: { fontSize: 10 },
                verticalAlignment: 'MIDDLE',
                borders: { bottom: thinBorder }
              }
            },
            fields: 'userEnteredFormat(textFormat,verticalAlignment,borders)'
          }
        },
        // Center align date column
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: dataStartIdx,
              endRowIndex: dataEndIdx,
              startColumnIndex: 0,
              endColumnIndex: 1
            },
            cell: {
              userEnteredFormat: { horizontalAlignment: 'CENTER' }
            },
            fields: 'userEnteredFormat.horizontalAlignment'
          }
        },
        // Currency format & right align for Jumlah column
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: dataStartIdx,
              endRowIndex: dataEndIdx,
              startColumnIndex: 3,
              endColumnIndex: 4
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' },
                horizontalAlignment: 'RIGHT',
                textFormat: { bold: true, fontSize: 10 }
              }
            },
            fields: 'userEnteredFormat(numberFormat,horizontalAlignment,textFormat)'
          }
        },
        // Center align Tipe column with bold
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: dataStartIdx,
              endRowIndex: dataEndIdx,
              startColumnIndex: 4,
              endColumnIndex: 5
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: 'CENTER',
                textFormat: { bold: true, fontSize: 10 }
              }
            },
            fields: 'userEnteredFormat(horizontalAlignment,textFormat)'
          }
        },
        // Add cell padding by adjusting row height
        {
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: dataStartIdx,
              endIndex: dataEndIdx
            },
            properties: { pixelSize: 30 },
            fields: 'pixelSize'
          }
        },
        // Conditional formatting: Pemasukan (green)
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId,
                startRowIndex: dataStartIdx,
                endRowIndex: dataEndIdx,
                startColumnIndex: 4,
                endColumnIndex: 5
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'Pemasukan' }]
                },
                format: {
                  textFormat: { foregroundColor: { red: 0.0, green: 0.55, blue: 0.3 }, bold: true },
                  backgroundColor: { red: 0.90, green: 0.97, blue: 0.92 }
                }
              }
            },
            index: 0
          }
        },
        // Conditional formatting: Pengeluaran (red)
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{
                sheetId,
                startRowIndex: dataStartIdx,
                endRowIndex: dataEndIdx,
                startColumnIndex: 4,
                endColumnIndex: 5
              }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'Pengeluaran' }]
                },
                format: {
                  textFormat: { foregroundColor: { red: 0.80, green: 0.18, blue: 0.18 }, bold: true },
                  backgroundColor: { red: 0.99, green: 0.92, blue: 0.92 }
                }
              }
            },
            index: 0
          }
        }
      ]
    }
  });
}

/**
 * Append new transaction rows (legacy, kept for API compat)
 */
export async function appendTransactionRows(
  accessToken: string,
  spreadsheetId: string,
  transactions: any[]
) {
  if (transactions.length === 0) return;

  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  const rows = transactions.map(tx => {
    const amount = Math.abs(Number(tx.amount));
    const type = Number(tx.amount) < 0 ? 'Pemasukan' : 'Pengeluaran';
    const date = new Date(tx.date).toLocaleDateString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    
    return [date, tx.category?.name || 'Tanpa Kategori', tx.note || '-', amount, type];
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `Transaksi!A${DATA_START_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });
}
