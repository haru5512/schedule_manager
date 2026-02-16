export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export const CATEGORY_ICONS = {
    '訪問': '🚶',
    '会議': '🤝',
    'イベント': '🎪',
    '資料作成': '📝',
    '事務作業': '🗂️',
    'その他': '🌿'
};

export function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toTimeStr(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const wd = WEEKDAYS[d.getDay()];
    return { m, day, wd };
}

export function generateCalendarUrl(record) {
    const { date, time, content, place, note, category } = record;
    if (!date) return '';

    // Format dates for Google Calendar (YYYYMMDDTHHMMSS)

    // Start Time
    let startDateTime = date.replace(/-/g, '');
    if (time) {
        startDateTime += 'T' + time.replace(':', '') + '00';
    } else {
        // All day event if no time
        // startDateTime remains just date
    }

    // End Time (assume 1 hour duration if time exists, or next day if all day)
    let endDateTime = '';
    function toDateStr(d) {
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }
    function toTimeStr(d) {
        return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    }

    if (time) {
        const d = new Date(`${date}T${time}`);
        d.setHours(d.getHours() + 1);
        endDateTime = toDateStr(d) + 'T' + toTimeStr(d);
    } else {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        endDateTime = toDateStr(d);
    }

    const details = `${note || ''}\n\n[カテゴリー] ${category}`;
    const location = place || '';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `【${category}】${content}`,
        dates: `${startDateTime}/${endDateTime}`,
        details: details,
        location: location,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
}
