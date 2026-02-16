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
    return {
        m: d.getMonth() + 1,
        day: d.getDate(),
        wd: WEEKDAYS[d.getDay()]
    };
}
