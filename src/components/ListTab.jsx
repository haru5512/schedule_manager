import { useState, useEffect } from 'react';
import { formatDate, CATEGORY_ICONS, generateCalendarUrl } from '../utils';
import EditModal from './EditModal';

function ListTab({ records, onUpdate, onDelete, onBulkDelete }) {
    const [filterCat, setFilterCat] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Clear selection when filters or search change to prevent accidental operations on hidden items
    useEffect(() => {
        setSelectedIds(new Set());
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
        if (selectedIds.size === filteredRecords.length && filteredRecords.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRecords.map(r => r.id)));
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

    // Extract unique months (YYYY-MM)
    const availableMonths = [...new Set(records.map(r => r.date.substring(0, 7)))]
        .sort((a, b) => b.localeCompare(a));

    const categories = [
        { name: '', label: 'すべて', icon: '' },
        { name: '訪問', label: '訪問', icon: '🚶' },
        { name: '会議', label: '会議', icon: '🤝' },
        { name: 'イベント', label: 'イベント', icon: '🎪' },
        { name: '資料作成', label: '資料作成', icon: '📝' },
        { name: '事務作業', label: '事務作業', icon: '🗂️' },
        { name: 'その他', label: 'その他', icon: '🌿' },
    ];

    const isAllSelected = filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;

    return (
        <div className="page active">
            <div className="card" style={{ padding: '14px 16px', marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="🔍 キーワードで検索"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <div style={{ marginBottom: '10px' }}>
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff' }}
                    >
                        <option value="">📅 すべての期間</option>
                        {availableMonths.map(m => {
                            const [y, mon] = m.split('-');
                            return <option key={m} value={m}>{y}年{parseInt(mon)}月</option>;
                        })}
                    </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.label}
                            className={`filter-btn ${filterCat === cat.name ? 'active' : ''}`}
                            onClick={() => setFilterCat(cat.name)}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                            <div className="result-count" style={{ fontSize: '11px', color: '#aaa' }}>
                                {filteredRecords.length}件
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={toggleSelectAll}
                                    style={{
                                        background: isAllSelected ? '#e0e0e0' : '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    {isAllSelected ? '解除' : '全選択'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.size === 0}
                                    style={{
                                        background: selectedIds.size > 0 ? '#ef4444' : '#e0e0e0',
                                        color: selectedIds.size > 0 ? 'white' : '#aaa',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: selectedIds.size > 0 ? 'pointer' : 'default',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    削除 ({selectedIds.size})
                                </button>
                            </div>
                        </div>

                        {filteredRecords.map((r) => {
                            const { m, day, wd } = formatDate(r.date);
                            const meta = [
                                r.place && `📍 ${r.place}`,
                                r.count && `👥 ${r.count}名`,
                                r.note && `💬 ${r.note}`
                            ].filter(Boolean).join('　');

                            const isSelected = selectedIds.has(r.id);

                            return (
                                <div key={r.id} className={`log-item cat-${r.category} ${isSelected ? 'selected-item' : ''}`} style={{ opacity: r.excludeFromReport ? 0.6 : 1 }}>
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
                                    </div>
                                    <div className="log-body">
                                        <span className="log-cat-badge">{CATEGORY_ICONS[r.category]} {r.category}</span>
                                        <div className="log-content">{r.content}</div>
                                        {meta && <div className="log-meta">{meta}</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
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
                                        <button className="action-btn" onClick={() => setEditingRecord(r)}>✏️</button>
                                        <button className="action-btn" onClick={() => onDelete(r.id)}>✕</button>
                                    </div>
                                </div>
                            );
                        })}
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
