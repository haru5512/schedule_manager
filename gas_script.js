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

    const response = {
        records: records,
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
    };

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const sheet = getSheet();

    try {
        const jsonString = e.postData.contents;
        const data = JSON.parse(jsonString);

        // Case 1: Parse Voice (Gemini API Proxy)
        if (data.action === 'parseVoice') {
            const result = parseVoiceWithGemini(data.transcript, data.currentDate);
            return ContentService.createTextOutput(JSON.stringify(result))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // Case 2: Import Action
        if (data.action === 'import') {
            const count = importFromCalendar(data.startDate, data.endDate);
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: count }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // Case 2: Sync (Array of records)
        let records = [];
        if (Array.isArray(data)) {
            records = data;
        } else {
            // Fallback if wrapped
            records = data.records || [];
        }

        // Clear and Write
        if (sheet.getLastRow() > 1) {
            sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }

        if (records.length > 0) {
            const rows = records.map(r => [
                r.id, r.date, r.time, r.category, r.content, r.place, r.count, r.note
            ]);
            sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: records.length }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function importFromCalendar(startStr, endStr) {
    const sheet = getSheet();
    const start = new Date(startStr);
    const end = new Date(endStr);
    // Set end to end of day
    end.setHours(23, 59, 59);

    const events = CalendarApp.getDefaultCalendar().getEvents(start, end);
    const newRows = [];

    events.forEach(e => {
        // Skip all-day events if preferred, or include them. Here we include them.
        const d = e.getStartTime();
        const date = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        const time = e.isAllDayEvent() ? '' : Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm');

        newRows.push([
            Utilities.getUuid(), // Generate ID
            date,
            time,
            'その他', // Default category
            e.getTitle(),
            e.getLocation(),
            '', // count
            e.getDescription()
        ]);
    });

    if (newRows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    return newRows.length;
}

/**
 * Parse voice transcription using Gemini API
 * API Key is stored in Script Properties (safer than client-side)
 */
function parseVoiceWithGemini(transcript, currentDateStr) {
    // Get API key from Script Properties
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    if (!apiKey) {
        return {
            status: 'error',
            message: 'Gemini APIキーが設定されていません。\\nGASのスクリプトプロパティで「GEMINI_API_KEY」を設定してください。'
        };
    }

    const prompt = `以下の音声入力テキストから、活動記録の各フィールドを抽出してJSON形式で返してください。

音声入力: ${transcript}

現在の日時: ${currentDateStr}

抽出するフィールド:
- date: YYYY/MM/DD形式
    - 「今日」「明日」「昨日」などは現在の時間を基準に計算
    - 「3月10日」のように年が省略された場合は、現在の日時（${currentDateStr}）と同じ年を補完
    - 日付への言及がない場合は、現在の日付を使用
- time: HH:MM形式（24時間表記、言及されていない場合は現在の時刻）
- category: 訪問/会議/イベント/資料作成/事務作業/その他 のいずれか（内容から最も適切なものを推測）
- content: 活動内容の簡潔な説明（50文字以内）
- place: 場所（言及されていなければ空文字）
- count: 参加人数（数値のみ、言及されていなければ0）
- note: その他のメモ（補足情報があれば）

注意事項:
- 日付の相対表現（今日、明日など）は必ず具体的な日付に変換してください
- カテゴリは必ず上記6つのいずれかから選択してください
- 数値は必ず数字のみで返してください
- JSONのみを返し、説明文は含めないでください

JSON形式:
{
  "date": "YYYY/MM/DD",
  "time": "HH:MM",
  "category": "カテゴリ名",
  "content": "活動内容",
  "place": "場所",
  "count": 0,
  "note": "メモ"
}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        const response = UrlFetchApp.fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'post',
                contentType: 'application/json',
                payload: JSON.stringify(requestBody),
                muteHttpExceptions: true
            }
        );

        const responseCode = response.getResponseCode();

        if (responseCode !== 200) {
            return {
                status: 'error',
                message: `Gemini API エラー (${responseCode}): ${response.getContentText()}`
            };
        }

        const data = JSON.parse(response.getContentText());

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            return {
                status: 'error',
                message: '解析結果を取得できませんでした'
            };
        }

        let text = data.candidates[0].content.parts[0].text.trim();

        // Remove markdown code blocks if present
        if (text.startsWith('```json')) {
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(text);

        return {
            status: 'success',
            data: {
                date: parsed.date || '',
                time: parsed.time || '',
                category: parsed.category || '',
                content: parsed.content || transcript,
                place: parsed.place || '',
                count: parseInt(parsed.count) || 0,
                note: parsed.note || ''
            }
        };

    } catch (error) {
        return {
            status: 'error',
            message: `解析エラー: ${error.toString()}`
        };
    }
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
