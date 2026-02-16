// Google Apps Script Code
// 1. Copy this code into your Google Sheet's Script Editor (Extensions > Apps Script)
// 2. Run the 'setup' function once to create the 'db' sheet.
// 3. Deploy as Web App (Execute as: Me, Who has access: Anyone)

const SHEET_NAME = 'db';

function doGet(e) {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove header row

    // Convert rows to array of objects
    const records = data.map(row => {
        return {
            id: row[0],
            date: formatDate(row[1]),
            time: formatTime(row[2]),
            category: row[3],
            content: row[4],
            place: row[5],
            count: row[6],
            note: row[7]
        };
    }).filter(r => r.id); // Filter empty rows

    return ContentService.createTextOutput(JSON.stringify(records))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const sheet = getSheet();

    // Parse incoming JSON data
    const records = JSON.parse(e.postData.contents);

    // Clear existing data (keeping headers)
    if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }

    if (records.length > 0) {
        // Prepare rows for insertion
        const rows = records.map(r => [
            r.id,
            r.date,
            r.time,
            r.category,
            r.content,
            r.place,
            r.count,
            r.note
        ]);

        // Write new data
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: records.length }))
        .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers
        sheet.appendRow(['id', 'date', 'time', 'category', 'content', 'place', 'count', 'note']);
        // Format headers
        sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f3f3');
        sheet.setFrozenRows(1);
    }
}

function getSheet() {
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
}

function formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string') return date;
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatTime(time) {
    if (!time) return '';
    if (typeof time === 'string') return time;
    // If it's a date object (Google Sheets treats time as date sometimes), extract HH:mm
    return Utilities.formatDate(time, Session.getScriptTimeZone(), 'HH:mm');
}
