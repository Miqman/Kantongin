import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';

// Layout constants
const HEADER_ROW = 6; // Row where transaction headers are (1-indexed in formulas)
const DATA_START_ROW = 7; // First data row (1-indexed)

/**
 * Create a new spreadsheet with summary section and transaction table
 */
export async function createSpreadsheet(accessToken: string, userEmail: string): Promise<string> {
  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  // Create spreadsheet with a single "Transaksi" sheet
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

  // Build the initial structure
  await writeInitialStructure(auth, spreadsheetId);

  // Apply formatting
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
          range: 'Transaksi!A1:E6',
          values: [
            ['RINGKASAN KEUANGAN', '', '', '', ''],
            ['Total Pemasukan', 'Total Pengeluaran', 'Saldo', '', ''],
            [
              `=IFERROR(SUMIF(E${DATA_START_ROW}:E,"Pemasukan",D${DATA_START_ROW}:D),0)`,
              `=IFERROR(SUMIF(E${DATA_START_ROW}:E,"Pengeluaran",D${DATA_START_ROW}:D),0)`,
              `=A3-B3`,
              '', ''
            ],
            ['', '', '', '', ''],
            ['TRANSAKSI', '', '', '', ''],
            ['Tanggal', 'Kategori', 'Catatan', 'Jumlah', 'Tipe'],
          ]
        }
      ]
    }
  });
}

/**
 * Apply formatting to the spreadsheet (colors, bold, merges, column widths)
 */
async function applyFormatting(auth: any, spreadsheetId: string, sheetId: number) {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Merge title row "RINGKASAN KEUANGAN"
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 3 },
            mergeType: 'MERGE_ALL'
          }
        },
        // Style title row
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 14, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.0, green: 0.35, blue: 0.76 }, // Primary blue
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)'
          }
        },
        // Style summary labels (row 2)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10 },
                backgroundColor: { red: 0.92, green: 0.94, blue: 1.0 },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)'
          }
        },
        // Style summary values (row 3) with currency format
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12 },
                numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' },
                horizontalAlignment: 'CENTER',
                backgroundColor: { red: 0.98, green: 0.99, blue: 1.0 }
              }
            },
            fields: 'userEnteredFormat(textFormat,numberFormat,horizontalAlignment,backgroundColor)'
          }
        },
        // Color the "Total Pemasukan" value green
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { foregroundColor: { red: 0.0, green: 0.5, blue: 0.2 } }
              }
            },
            fields: 'userEnteredFormat.textFormat.foregroundColor'
          }
        },
        // Color the "Total Pengeluaran" value red
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { foregroundColor: { red: 0.75, green: 0.15, blue: 0.15 } }
              }
            },
            fields: 'userEnteredFormat.textFormat.foregroundColor'
          }
        },
        // Merge "TRANSAKSI" title row
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 5 },
            mergeType: 'MERGE_ALL'
          }
        },
        // Style "TRANSAKSI" title
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.15, green: 0.2, blue: 0.3 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)'
          }
        },
        // Style transaction headers (row 6)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10 },
                backgroundColor: { red: 0.9, green: 0.93, blue: 0.98 },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)'
          }
        },
        // Freeze rows up to header
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: HEADER_ROW } },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Set row heights for summary rows
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 40 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 38 },
            fields: 'pixelSize'
          }
        },
        // Column widths
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 110 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 150 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 220 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
            properties: { pixelSize: 130 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
            properties: { pixelSize: 130 },
            fields: 'pixelSize'
          }
        },
      ]
    }
  });
}

/**
 * Full sync: clear transaction data and rewrite from database
 * Keeps the summary section and headers intact
 */
export async function fullSync(
  accessToken: string,
  spreadsheetId: string,
  transactions: any[],
  _categories: any[] // no longer used, kept for API compatibility
) {
  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  // Get the sheet ID for Transaksi (in case structure needs rebuilding)
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const transaksiSheet = meta.data.sheets?.find(s => s.properties?.title === 'Transaksi');
  
  if (!transaksiSheet) {
    // Sheet doesn't exist (user deleted it?) — recreate structure
    throw new Error('Transaksi sheet not found. Please reconnect.');
  }

  const sheetId = transaksiSheet.properties?.sheetId!;

  // Check if structure exists (row 6 should have "Tanggal" header)
  const checkRange = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Transaksi!A6:A6'
  });
  
  const hasStructure = checkRange.data.values?.[0]?.[0] === 'Tanggal';
  
  if (!hasStructure) {
    // Rebuild structure if missing
    await writeInitialStructure(auth, spreadsheetId);
    await applyFormatting(auth, spreadsheetId, sheetId);
  }

  // Clear existing transaction data (keep summary & headers)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `Transaksi!A${DATA_START_ROW}:E`
  });

  // Write transactions if any
  if (transactions.length > 0) {
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

    // Apply currency format to Jumlah column in data rows
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: DATA_START_ROW - 1,
                endRowIndex: DATA_START_ROW - 1 + rows.length,
                startColumnIndex: 3,
                endColumnIndex: 4
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: { type: 'CURRENCY', pattern: '"Rp "#,##0' }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          },
          // Color-code the Tipe column
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [{
                  sheetId,
                  startRowIndex: DATA_START_ROW - 1,
                  endRowIndex: DATA_START_ROW - 1 + rows.length,
                  startColumnIndex: 4,
                  endColumnIndex: 5
                }],
                booleanRule: {
                  condition: {
                    type: 'TEXT_EQ',
                    values: [{ userEnteredValue: 'Pemasukan' }]
                  },
                  format: {
                    textFormat: { foregroundColor: { red: 0.0, green: 0.5, blue: 0.2 }, bold: true }
                  }
                }
              },
              index: 0
            }
          },
          {
            addConditionalFormatRule: {
              rule: {
                ranges: [{
                  sheetId,
                  startRowIndex: DATA_START_ROW - 1,
                  endRowIndex: DATA_START_ROW - 1 + rows.length,
                  startColumnIndex: 4,
                  endColumnIndex: 5
                }],
                booleanRule: {
                  condition: {
                    type: 'TEXT_EQ',
                    values: [{ userEnteredValue: 'Pengeluaran' }]
                  },
                  format: {
                    textFormat: { foregroundColor: { red: 0.75, green: 0.15, blue: 0.15 }, bold: true }
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
}

/**
 * Append new transaction rows (incremental sync, legacy — not used with full sync)
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
