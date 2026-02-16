import { useState, useMemo } from 'react';
import { formatDate, CATEGORY_ICONS } from '../utils';

function MonthlyTab({ records }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [toastMsg, setToastMsg] = useState('');
    const [previewMode, setPreviewMode] = useState('report'); // 'report' or 'discord'

    const changeMonth = (dir) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + dir);
        setCurrentMonth(newDate);
    };

    const { monthRecs, stats, exportText, discordText } = useMemo(() => {
        const y = currentMonth.getFullYear();
        const m = currentMonth.getMonth() + 1;

        // Filter records for current month
        const recs = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === y && d.getMonth() + 1 === m;
        }).sort((a, b) => a.date > b.date ? 1 : -1);

        // Stats
        const days = new Set(recs.map(r => r.date)).size;
        const events = recs.filter(r => ['イベント'].includes(r.category)).length;
        const people = recs.reduce((sum, r) => sum + (r.count || 0), 0);

        // Export Text (Full Month)
        const daysInMonth = new Date(y, m, 0).getDate();
        const exportLines = [];
        const discordLines = [`**【${y}年${m}月 活動報告】**\n`];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(y, m - 1, d);
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const { m: mm, day: dd, wd: w } = formatDate(dateStr);
            const dateHeader = `${mm}/${dd}(${w})`;

            // Find records for this day
            const dayRecs = recs.filter(r => r.date === dateStr);

            // Generate content string
            let content = '';
            if (dayRecs.length > 0) {
                content = dayRecs.map(r => {
                    let line = r.content;
                    if (r.place) line += `（${r.place}）`;
                    return line;
                }).join('、');
            }

            // 1. Daily Report Format (Content Only - Single Column)
            // User pastes this into C9 (activity content column)
            // Empty days output as blank lines to maintain alignment
            exportLines.push(content);

            // 2. Discord Format (Rich Text - All Days)
            discordLines.push(`**${dateHeader}**`);
            if (dayRecs.length > 0) {
                dayRecs.forEach(r => {
                    const icon = CATEGORY_ICONS[r.category] || '';
                    const parts = [r.content];
                    if (r.place) parts.push(`📍${r.place}`);
                    if (r.count) parts.push(`👥${r.count}名`);
                    if (r.note) parts.push(`(Note: ${r.note})`);

                    // User asked to remove icons entirely
                    discordLines.push(`> ${parts.join(' ')}`);
                });
            }
            // Add empty line for separation
            discordLines.push('');
        }

        const text = exportLines.join('\n');
        const discord = discordLines.join('\n');

        return { monthRecs: recs, stats: { days, events, people }, exportText: text, discordText: discord };
    }, [records, currentMonth]);

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMsg(`📋 ${label}をコピーしました`);
            setTimeout(() => setToastMsg(''), 2000);
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setToastMsg(`📋 ${label}をコピーしました`);
            setTimeout(() => setToastMsg(''), 2000);
        });
    };

    const handleCopy = () => {
        const text = previewMode === 'report' ? exportText : discordText;
        const label = previewMode === 'report' ? '日報用テキスト' : 'Discord用テキスト';
        copyToClipboard(text, label);
    };

    return (
        <div className="page active">
            <div className="card">
                <div className="month-header">
                    <div className="month-nav">
                        <button className="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
                        <div className="month-label">
                            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                        </div>
                        <button className="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-num">{stats.days}</div>
                        <div className="stat-label">活動日数</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num">{stats.events}</div>
                        <div className="stat-label">イベント数</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num">{stats.people}</div>
                        <div className="stat-label">延べ参加者</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-title">月間活動ログ</div>
                {monthRecs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px' }}>
                        <div className="empty-text" style={{ color: '#ccc', textAlign: 'center' }}>この月の記録はありません</div>
                    </div>
                ) : (
                    (() => {
                        // Group by date
                        const grouped = {};
                        monthRecs.forEach(r => {
                            if (!grouped[r.date]) grouped[r.date] = [];
                            grouped[r.date].push(r);
                        });

                        return Object.entries(grouped).map(([date, groupRecs]) => {
                            const { day, wd } = formatDate(date);
                            return (
                                <div key={date} className="monthly-group" style={{ marginBottom: '16px' }}>
                                    <div className="monthly-group-header" style={{
                                        fontWeight: 'bold',
                                        color: 'var(--forest)',
                                        background: '#f4f7f6',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        marginBottom: '6px',
                                        fontSize: '14px'
                                    }}>
                                        {day}日（{wd}）
                                    </div>
                                    <div className="monthly-group-items" style={{ paddingLeft: '8px' }}>
                                        {groupRecs.map(r => (
                                            <div key={r.id} className="monthly-log-item" style={{
                                                display: 'flex',
                                                padding: '6px 0',
                                                borderBottom: '1px solid #eee',
                                                fontSize: '14px',
                                                alignItems: 'baseline'
                                            }}>
                                                <div style={{ width: '45px', fontSize: '11px', color: '#888', flexShrink: 0 }}>
                                                    {r.time || '--:--'}
                                                </div>
                                                <div className="monthly-content" style={{ flex: 1 }}>
                                                    <span style={{ marginRight: '6px' }}>{CATEGORY_ICONS[r.category]}</span>
                                                    <span style={{ fontWeight: '500', marginRight: '8px' }}>{r.content}</span>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        {[
                                                            r.place && `📍${r.place}`,
                                                            r.count && `👥${r.count}名`
                                                        ].filter(Boolean).join(' ')}
                                                    </span>
                                                    {r.note && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', paddingLeft: '22px' }}>Note: {r.note}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                )}
            </div>


            <div className="card">
                <div className="card-title" style={{ justifyContent: 'space-between' }}>
                    <span>出力</span>
                    <div className="toggle-group" style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setPreviewMode('report')}
                            style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: '1px solid var(--forest)',
                                background: previewMode === 'report' ? 'var(--forest)' : 'white',
                                color: previewMode === 'report' ? 'white' : 'var(--forest)',
                                cursor: 'pointer'
                            }}
                        >
                            報告書
                        </button>
                        <button
                            onClick={() => setPreviewMode('discord')}
                            style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: '1px solid #5865F2',
                                background: previewMode === 'discord' ? '#5865F2' : 'white',
                                color: previewMode === 'discord' ? 'white' : '#5865F2',
                                cursor: 'pointer'
                            }}
                        >
                            Discord
                        </button>
                    </div>
                </div>
                <div className="export-area" style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px' }}>
                    {previewMode === 'report' ? exportText : discordText}
                </div>
                <button className="btn-secondary" onClick={handleCopy} style={{ marginTop: '10px', borderColor: previewMode === 'discord' ? '#5865F2' : '', color: previewMode === 'discord' ? '#5865F2' : '' }}>
                    📋 {previewMode === 'report' ? '報告書用コピー' : 'Discord形式でコピー'}
                </button>
                {previewMode === 'report' && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff3cd', borderRadius: '8px', fontSize: '11px', color: '#856404', lineHeight: '1.5' }}>
                        💡 <strong>報告書への貼り付け方：</strong>スプレッドシートの<strong>活動内容列の最初のセル</strong>（例：C9）を選択して貼り付けてください。日と曜日はそのまま残ります。
                    </div>
                )}
            </div>

            <div className={`toast ${toastMsg ? 'show' : ''}`} style={{ transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)' }}>
                {toastMsg}
            </div>
        </div>
    );
}

export default MonthlyTab;
