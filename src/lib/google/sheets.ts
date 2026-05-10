import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth';

/**
 * Create a new spreadsheet for the user with formatted headers
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
        {
          properties: { title: 'Transaksi', index: 0 },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'Tanggal' } },
                { userEnteredValue: { stringValue: 'Kategori' } },
                { userEnteredValue: { stringValue: 'Catatan' } },
                { userEnteredValue: { stringValue: 'Jumlah' } },
                { userEnteredValue: { stringValue: 'Tipe' } },
                { userEnteredValue: { stringValue: 'ID' } },
              ]
            }]
          }]
        },
        {
          properties: { title: 'Kategori', index: 1 },
          data: [{
            startRow: 0,
            startColumn: 0,
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'Nama' } },
                { userEnteredValue: { stringValue: 'Ikon' } },
                { userEnteredValue: { stringValue: 'Warna' } },
                { userEnteredValue: { stringValue: 'Default' } },
              ]
            }]
          }]
        }
      ]
    }
  });

  const spreadsheetId = response.data.spreadsheetId!;

  // Format headers (bold, freeze first row)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Bold headers for Transaksi sheet
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.93, blue: 0.98 }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)'
          }
        },
        // Bold headers for Kategori sheet
        {
          repeatCell: {
            range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.93, blue: 0.98 }
              }
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)'
          }
        },
        // Freeze header row for Transaksi
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Freeze header row for Kategori
        {
          updateSheetProperties: {
            properties: { sheetId: 1, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Auto-resize columns for Transaksi
        {
          autoResizeDimensions: {
            dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 6 }
          }
        }
      ]
    }
  });

  return spreadsheetId;
}

/**
 * Full sync: clear all data and rewrite from database
 */
export async function fullSync(
  accessToken: string,
  spreadsheetId: string,
  transactions: any[],
  categories: any[]
) {
  const auth = getAuthenticatedClient(accessToken);
  const sheets = google.sheets({ version: 'v4', auth });

  // Clear existing data (keep headers)
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: {
      ranges: ['Transaksi!A2:F', 'Kategori!A2:D']
    }
  });

  // Write transactions
  if (transactions.length > 0) {
    const txRows = transactions.map(tx => {
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
        type,
        tx.id
      ];
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transaksi!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: txRows }
    });
  }

  // Write categories
  if (categories.length > 0) {
    const catRows = categories.map(cat => [
      cat.name,
      cat.icon,
      cat.color,
      cat.is_default ? 'Ya' : 'Tidak'
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Kategori!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: catRows }
    });
  }
}

/**
 * Append new transaction rows (incremental sync)
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
    
    return [date, tx.category?.name || 'Tanpa Kategori', tx.note || '-', amount, type, tx.id];
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Transaksi!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows }
  });
}
