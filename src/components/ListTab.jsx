import { useState, useEffect } from 'react';
import { formatDate, CATEGORY_ICONS, generateCalendarUrl } from '../utils';
import EditModal from './EditModal';

function ListTab({ records, onUpdate, onDelete, onBulkDelete }) {
    const [filterCat, setFilterCat] = useState('');

    // Default to current month
    const current = new Date();
    const currentMonthLink = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const [filterMonth, setFilterMonth] = useState(currentMonthLink);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Pagination state for "All Periods"
    const [visibleCount, setVisibleCount] = useState(30);

    // Clear selection and reset pagination when filters or search change
    useEffect(() => {
        setSelectedIds(new Set());
        setVisibleCount(30);
    }, [filterCat, filterMonth, searchKeyword]);

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        // Use displayedRecords for selection to be intuitive
        if (selectedIds.size === displayedRecords.length && displayedRecords.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(displayedRecords.map(r => r.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const filteredRecords = records.filter(r => {
        const matchesCat = filterCat ? r.category === filterCat : true;
        const matchesMonth = filterMonth ? r.date.startsWith(filterMonth) : true;
        const lowerKey = searchKeyword.toLowerCase();
        const matchesKey = !searchKeyword ||
            r.content.toLowerCase().includes(lowerKey) ||
            (r.place && r.place.toLowerCase().includes(lowerKey)) ||
            (r.note && r.note.toLowerCase().includes(lowerKey));
        return matchesCat && matchesMonth && matchesKey;
    });

    // Sort order: Oldest first (ASC) if currently filtering/searching, otherwise Newest first (DESC)
    const isFiltering = Boolean(filterCat || filterMonth || searchKeyword);
    filteredRecords.sort((a, b) => {
        const dateA = (a.date || '') + (a.time || '');
        const dateB = (b.date || '') + (b.time || '');
        if (dateA < dateB) return isFiltering ? -1 : 1;
        if (dateA > dateB) return isFiltering ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const displayedRecords = filteredRecords.slice(0, visibleCount);

    // Extract unique months (YYYY-MM) and ensure current month is available
    const rawMonths = [...new Set(records.map(r => r.date.substring(0, 7)))];
    if (currentMonthLink && !rawMonths.includes(currentMonthLink)) {
        rawMonths.push(currentMonthLink);
    }
    const availableMonths = rawMonths.sort((a, b) => b.localeCompare(a));

    const categories = [
        { name: '', label: 'すべて', icon: '' },
        { name: '訪問', label: '訪問', icon: '🚶' },
        { name: '会議', label: '会議', icon: '🤝' },
        { name: 'イベント', label: 'イベント', icon: '🎪' },
        { name: '資料作成', label: '資料作成', icon: '📝' },
        { name: '事務作業', label: '事務作業', icon: '🗂️' },
        { name: 'その他', label: 'その他', icon: '🌿' },
    ];

    const isAllSelected = displayedRecords.length > 0 && selectedIds.size === displayedRecords.length;

    const scrollToToday = () => {
        // Reset filters to default (Current Month)
        setSearchKeyword('');
        setFilterCat('');
        setFilterMonth(currentMonthLink);

        // Use timeout to allow render to complete after state change
        setTimeout(() => {
            const todayStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
            // Try to find exact date match
            const target = document.querySelector(`.log-item[data-date="${todayStr}"]`);

            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight momentarily
                target.style.transition = 'background 0.5s';
                target.style.background = '#fff3cd';
                setTimeout(() => {
                    target.style.background = '';
                }, 1500);
            } else {
                alert('本日の記録は見つかりませんでした');
            }
        }, 100);
    };

    return (
        <div className="page active">
            <div className="card" style={{ marginBottom: '12px' }}>
                <input
                    type="search"
                    placeholder="🔍 キーワードで検索"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="search-input"
                    lang="ja"
                    inputMode="search"
                />
                <div style={{ marginBottom: '10px' }}>
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="month-select"
                    >
                        <option value="">📅 すべての期間</option>
                        {availableMonths.map(m => {
                            const [y, mon] = m.split('-');
                            return <option key={m} value={m}>{y}年{parseInt(mon)}月</option>;
                        })}
                    </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '100%', alignItems: 'center' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.label}
                            className={`filter-btn ${filterCat === cat.name ? 'active' : ''}`}
                            onClick={() => setFilterCat(cat.name)}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                    <button onClick={scrollToToday} className="today-btn">
                        📍 本日
                    </button>
                </div>
            </div>

            <div>
                {records.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '50px 20px', color: '#bbb' }}>
                        <div className="empty-icon" style={{ fontSize: '40px', marginBottom: '10px' }}>🌱</div>
                        <div className="empty-text">まだ記録がありません</div>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '50px 20px', color: '#bbb' }}>
                        <div className="empty-icon" style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                        <div className="empty-text">該当する記録がありません</div>
                    </div>
                ) : (
                    <>
                        <div className="result-header">
                            <div className="result-count">
                                {filteredRecords.length}件
                                {filteredRecords.length > displayedRecords.length && (
                                    <span style={{ marginLeft: '4px' }}>(表示中: {displayedRecords.length})</span>
                                )}
                            </div>
                            <div className="bulk-actions">
                                <button
                                    onClick={toggleSelectAll}
                                    className="bulk-select-btn"
                                    style={{ background: isAllSelected ? '#e0e0e0' : '#f5f5f5' }}
                                >
                                    {isAllSelected ? '解除' : '全選択'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.size === 0}
                                    className="bulk-delete-btn"
                                    style={{
                                        background: selectedIds.size > 0 ? '#ef4444' : '#e0e0e0',
                                        color: selectedIds.size > 0 ? 'white' : '#aaa',
                                        cursor: selectedIds.size > 0 ? 'pointer' : 'default',
                                    }}
                                >
                                    削除 ({selectedIds.size})
                                </button>
                            </div>
                        </div>

                        {displayedRecords.map((r) => {
                            const { m, day, wd } = formatDate(r.date);
                            const meta = [
                                r.place && `📍 ${r.place}`,
                                r.count && `👥 ${r.count}名`,
                                r.note && `💬 ${r.note}`
                            ].filter(Boolean).join('　');

                            const isSelected = selectedIds.has(r.id);

                            return (
                                <div key={r.id} data-date={r.date} className={`log-item cat-${r.category} ${isSelected ? 'selected-item' : ''}`} style={{ opacity: r.excludeFromReport ? 0.6 : 1 }}>
                                    {/* Checkbox Column */}
                                    <div className="log-check-col">
                                        <div
                                            className={`sq-checkbox ${isSelected ? 'checked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}
                                        >
                                            {isSelected && '✓'}
                                        </div>
                                    </div>

                                    <div className="log-date-col">
                                        <div className="log-month">{m}月</div>
                                        <div className="log-day">{day}日</div>
                                        <div className="log-weekday">（{wd}）</div>
                                        {r.time && <div className="log-time">{r.time}</div>}
                                    </div>

                                    <div className="log-body">
                                        {/* Top Row: Badge & Content */}
                                        <div className="log-top-row">
                                            <div>
                                                <span className="log-cat-badge">{CATEGORY_ICONS[r.category]} {r.category}</span>
                                                <div className="log-content">{r.content}</div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: Actions & Meta */}
                                        <div className="log-bottom-row">
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <button
                                                    className="action-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdate({ ...r, excludeFromReport: !r.excludeFromReport });
                                                    }}
                                                    title={r.excludeFromReport ? "月報に含める" : "月報から除外"}
                                                    style={{ opacity: r.excludeFromReport ? 1 : 0.3 }}
                                                >
                                                    {r.excludeFromReport ? '🚫' : '👁️'}
                                                </button>
                                                <a
                                                    href={generateCalendarUrl(r)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="action-btn"
                                                    title="Googleカレンダーに追加"
                                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    📅
                                                </a>
                                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setEditingRecord(r); }} title="編集">✏️</button>
                                            </div>
                                            {meta && <div className="log-meta">{meta}</div>}
                                        </div>

                                        {/* Delete Button - Absolute positioned at top-right */}
                                        <button
                                            className="action-btn delete-btn-abs"
                                            onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                                            title="削除"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {filteredRecords.length > displayedRecords.length && (
                            <div className="load-more-container">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 30)}
                                    className="load-more-btn"
                                >
                                    <span>⬇️</span> もっと見る
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <EditModal
                isOpen={!!editingRecord}
                record={editingRecord}
                onClose={() => setEditingRecord(null)}
                onSave={onUpdate}
            />
        </div>
    );
}

export default ListTab;
