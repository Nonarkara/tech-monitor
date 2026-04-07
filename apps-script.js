/**
 * Google Apps Script — Visitor Tracking Webhook
 *
 * SETUP:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Set SHEET_ID to your spreadsheet ID
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the deployment URL → paste into the tracking snippet
 */

const SHEET_ID = '15wcRoWX-qMsusROgPAablSxV0CgT_Yql5EbQNXsJR90';
const SHEET_NAME = 'Visitors';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'Page', 'Referrer', 'Country', 'City',
        'IP', 'UserAgent', 'Language', 'Screen', 'Timezone',
        'SessionId', 'PageLoadTime'
      ]);
      sheet.getRange('1:1').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.page || '',
      data.referrer || '',
      data.country || '',
      data.city || '',
      data.ip || '',
      data.userAgent || '',
      data.language || '',
      data.screen || '',
      data.timezone || '',
      data.sessionId || '',
      data.loadTime || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Health check
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Visitor tracking webhook active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
