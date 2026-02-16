import { useState } from 'react';
import { formatDate, CATEGORY_ICONS, generateCalendarUrl } from '../utils';
import EditModal from './EditModal';

function ListTab({ records, onUpdate, onDelete, onBulkDelete }) {
    const [filterCat, setFilterCat] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

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

    const isAllSelected = filteredRecords.length > 0 && selectedIds.size === filteredRecords.length;

    // Scroll to Top Logic
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    // Use a ref to track scroll timeout
    const scrollTimeoutRef = useState(null); // Actually we need useRef for logic in event listener, but simple state might work if attached to div scroll

    // Better approach: attach scroll listener to the scrollable container (window or main div)
    // Since layout might change on desktop/mobile, let's attach to window for simplicity or the specific container if known.
    // In mobile, 'window' scrolls. In desktop '.panel-record' might scroll. 
    // Let's use a useEffect to attach listener to window and also handle local component scrolling if needed.

    // Correction: In index.css, body has overflow-x hidden but not y. So window scrolls on mobile.
    // On desktop .panel-record has overflow-y auto.

    // Let's simplify and use a fixed button that shows when > 300px. 
    // "Disappear while scrolling" means we need to detect scroll events.

    const handleScroll = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > 300) {
            setShowScrollBtn(true);
        } else {
            setShowScrollBtn(false);
        }

        // Fade out while scrolling
        setIsScrolling(true);
        clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => {
            setIsScrolling(false);
        }, 150); // Show again 150ms after scroll stops
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Attach listener
    // Note: React 18 strict mode might double invoke, but that's fine for listeners.
    if (typeof window !== 'undefined') {
        window.onscroll = handleScroll;
    }


    return (
        <div className="page active" style={{ paddingBottom: '60px' }}>
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

            {/* Bulk Action Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                padding: '0 4px',
                height: '32px'
            }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={toggleSelectAll}
                >
                    <div className={`sq-checkbox ${isAllSelected ? 'checked' : ''}`}>
                        {isAllSelected && '✓'}
                    </div>
                    <label style={{ fontSize: '14px', cursor: 'pointer', userSelect: 'none', color: '#666' }}>
                        すべて選択 ({filteredRecords.length})
                    </label>
                </div>
                {selectedIds.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        🗑️ {selectedIds.size}件削除
                    </button>
                )}
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
                        {filteredRecords.map((r) => {
                            const { y, m, day, wd } = formatDate(r.date);
                            const meta = [
                                r.place && `📍 ${r.place}`,
                                r.count && `👥 ${r.count}名`,
                                r.note && `💬 ${r.note}`
                            ].filter(Boolean).join('　');
                            const isSelected = selectedIds.has(r.id);

                            return (
                                <div
                                    key={r.id}
                                    className={`log-item cat-${r.category} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleSelect(r.id)} // Allow clicking anywhere to toggle
                                >
                                    {/* Left Side: Checkbox */}
                                    <div className="log-left-col">
                                        <div className={`sq-checkbox ${isSelected ? 'checked' : ''}`}>
                                            {isSelected && '✓'}
                                        </div>
                                    </div>

                                    {/* Center: Date & Content */}
                                    <div className="log-center-col">
                                        <div className="log-date-row">
                                            <span className="log-year">{y}年</span>
                                            <span className="log-month">{m}月</span>
                                            <span className="log-day">{day}日</span>
                                            <span className="log-weekday">（{wd}）</span>
                                        </div>
                                        <div className="log-body-content">
                                            <div style={{ marginBottom: '4px' }}>
                                                <span className="log-cat-badge">{CATEGORY_ICONS[r.category]} {r.category}</span>
                                            </div>
                                            <div className="log-content">{r.content}</div>
                                            {meta && <div className="log-meta">{meta}</div>}
                                        </div>
                                    </div>

                                    {/* Right/Top: Actions */}
                                    {/* Used absolute positioning for desktop/mobile consistency or flex */}
                                    <div className="log-action-overlay" onClick={(e) => e.stopPropagation()}>
                                        <button className="icon-btn edit-btn" onClick={() => setEditingRecord(r)} title="編集">✏️</button>
                                        <a
                                            href={generateCalendarUrl(r)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="icon-btn cal-btn"
                                            title="Googleカレンダーに追加"
                                        >
                                            📅
                                        </a>
                                        <button className="icon-btn del-btn" onClick={() => onDelete(r.id)} title="削除">✕</button>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Scroll to Top Button */}
            <button
                className={`scroll-top-btn ${showScrollBtn ? 'show' : ''} ${isScrolling ? 'scrolling' : ''}`}
                onClick={scrollToTop}
            >
                ⬆
            </button>

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
