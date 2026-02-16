import { useState, useMemo } from 'react';
import { formatDate, CATEGORY_ICONS } from '../utils';

function MonthlyTab({ records }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [toastMsg, setToastMsg] = useState('');

    const changeMonth = (dir) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + dir);
        setCurrentMonth(newDate);
    };

    const { monthRecs, stats, exportText } = useMemo(() => {
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

        // Export Text
        let text = '（記録がありません）';
        if (recs.length > 0) {
            const byDay = {};
            recs.forEach(r => {
                const { day, wd } = formatDate(r.date);
                if (!byDay[day]) byDay[day] = { day, wd, items: [] };
                let line = r.content;
                if (r.place) line += `（${r.place}）`;
                byDay[day].items.push(line);
            });
            text = Object.values(byDay).map(g =>
                `${g.day}\t${g.wd}\t${g.items.join('　／　')}`
            ).join('\n');
        }

        return { monthRecs: recs, stats: { days, events, people }, exportText: text };
    }, [records, currentMonth]);

    const copyExport = () => {
        navigator.clipboard.writeText(exportText).then(() => {
            setToastMsg('📋 コピーしました');
            setTimeout(() => setToastMsg(''), 2000);
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = exportText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setToastMsg('📋 コピーしました');
            setTimeout(() => setToastMsg(''), 2000);
        });
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
                    monthRecs.map(r => {
                        const { day, wd } = formatDate(r.date);
                        return (
                            <div key={r.id} className="monthly-log-item">
                                <div className="monthly-date">{day}日（{wd}）</div>
                                <div className="monthly-content">
                                    {CATEGORY_ICONS[r.category]} {r.content}
                                    {r.place ? ` ／${r.place}` : ''}
                                    {r.count ? ` ／${r.count}名` : ''}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="card">
                <div className="card-title">コピー用テキスト</div>
                <div className="export-area">{exportText}</div>
                <button className="btn-secondary" onClick={copyExport} style={{ marginTop: '10px' }}>📋 コピーする</button>
            </div>

            <div className={`toast ${toastMsg ? 'show' : ''}`} style={{ transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)' }}>
                {toastMsg}
            </div>
        </div>
    );
}

export default MonthlyTab;
