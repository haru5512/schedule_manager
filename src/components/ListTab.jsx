import { useState } from 'react';
import { formatDate, CATEGORY_ICONS } from '../utils';
import EditModal from './EditModal';

function ListTab({ records, onUpdate, onDelete }) {
    const [filterCat, setFilterCat] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);

    const filteredRecords = records.filter(r => {
        const matchesCat = filterCat ? r.category === filterCat : true;
        const lowerKey = searchKeyword.toLowerCase();
        const matchesKey = !searchKeyword ||
            r.content.toLowerCase().includes(lowerKey) ||
            (r.place && r.place.toLowerCase().includes(lowerKey)) ||
            (r.note && r.note.toLowerCase().includes(lowerKey));
        return matchesCat && matchesKey;
    });

    const categories = [
        { name: '', label: 'すべて', icon: '' },
        { name: '訪問', label: '訪問', icon: '🚶' },
        { name: '会議', label: '会議', icon: '🤝' },
        { name: 'イベント', label: 'イベント', icon: '🎪' },
        { name: '資料作成', label: '資料作成', icon: '📝' },
        { name: '事務作業', label: '事務作業', icon: '🗂️' },
        { name: 'その他', label: 'その他', icon: '🌿' },
    ];

    return (
        <div className="page active">
            <div className="card" style={{ padding: '14px 16px', marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="🔍 キーワードで検索"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ marginBottom: '10px' }}
                />
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
                        <div className="result-count" style={{ fontSize: '11px', color: '#aaa', textAlign: 'right', marginBottom: '8px', paddingRight: '2px' }}>
                            {filteredRecords.length}件
                        </div>
                        {filteredRecords.map((r) => {
                            const { m, day, wd } = formatDate(r.date);
                            const meta = [
                                r.place && `📍 ${r.place}`,
                                r.count && `👥 ${r.count}名`,
                                r.note && `💬 ${r.note}`
                            ].filter(Boolean).join('　');

                            return (
                                <div key={r.id} className={`log-item cat-${r.category}`}>
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
