/**
 * DNGWS Visitor Tracker — Google Apps Script
 * Deployed URL: https://script.google.com/macros/s/AKfycbyfdZwRQY6HNBUAyAQQjRW8H9EGCKqMbSEg0IIbPW2y1HLMXV5C19zPaLbj-nEkUAVGrw/exec
 */

var SHEET_ID = '15wcRoWX-qMsusROgPAablSxV0CgT_Yql5EbQNXsJR90';
var SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'IP Address', 'Country', 'Region', 'City',
        'User Agent', 'Referrer'
      ]);
    }

    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }),
      data.ip        || 'Unknown',
      data.country    || 'Unknown',
      data.region     || 'Unknown',
      data.city       || 'Unknown',
      data.userAgent  || 'Unknown',
      data.referrer   || 'Direct'
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
  return doPost(e);
}
