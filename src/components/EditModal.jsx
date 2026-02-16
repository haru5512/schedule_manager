import { useState, useEffect } from 'react';

function EditModal({ record, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        date: '', time: '', category: '', content: '', place: '', count: '', note: ''
    });

    useEffect(() => {
        if (record) {
            setFormData({
                date: record.date || '',
                time: record.time || '',
                category: record.category || '',
                content: record.content || '',
                place: record.place || '',
                count: record.count || '',
                note: record.note || '',
                excludeFromReport: record.excludeFromReport || false
            });
        }
    }, [record]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCategory = (cat) => {
        setFormData(prev => ({ ...prev, category: cat }));
    };

    const handleSubmit = () => {
        if (!formData.content || !formData.category) {
            alert('カテゴリと活動内容を入力してください');
            return;
        }
        onSave({
            ...record,
            ...formData,
            content: formData.content.trim(),
            place: formData.place.trim(),
            count: parseInt(formData.count) || 0,
            note: formData.note.trim(),
            excludeFromReport: formData.excludeFromReport
        });
        onClose();
    };

    const categories = [
        { name: '訪問', icon: '🚶' },
        { name: '会議', icon: '🤝' },
        { name: 'イベント', icon: '🎪' },
        { name: '資料作成', icon: '📝' },
        { name: '事務作業', icon: '🗂️' },
        { name: 'その他', icon: '🌿' },
    ];

    return (
        <div id="editModal" style={{
            display: 'flex', position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', alignItems: 'flex-end', justifyContent: 'center',
            opacity: 1, transition: 'opacity 0.2s'
        }} onClick={(e) => e.target.id === 'editModal' && onClose()}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '480px', borderRadius: '20px 20px 0 0',
                padding: '24px 20px 36px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 -4px 30px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ fontFamily: "'Shippori Mincho',serif", fontSize: '16px', color: 'var(--forest)' }}>記録を修正</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#aaa', cursor: 'pointer' }}>✕</button>
                </div>

                <label>日付・時間</label>
                <div className="sub-row">
                    <input type="date" id="date" value={formData.date} onChange={handleChange} />
                    <input type="time" id="time" value={formData.time} onChange={handleChange} />
                </div>

                <label>カテゴリ</label>
                <div className="category-grid">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            className={`cat-btn ${formData.category === cat.name ? 'selected' : ''}`}
                            onClick={() => handleCategory(cat.name)}
                        >
                            <span className="cat-icon">{cat.icon}</span>{cat.name}
                        </button>
                    ))}
                </div>

                <label>活動内容</label>
                <textarea id="content" value={formData.content} onChange={handleChange} style={{ height: '80px' }}></textarea>

                <div className="sub-row">
                    <div>
                        <label>場所</label>
                        <input type="text" id="place" value={formData.place} onChange={handleChange} />
                    </div>
                    <div>
                        <label>参加人数</label>
                        <input type="number" id="count" min="0" value={formData.count} onChange={handleChange} />
                    </div>
                </div>

                <label>メモ（任意）</label>
                <input type="text" id="note" value={formData.note} onChange={handleChange} />

                <div style={{ margin: '12px 0', padding: '10px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        id="excludeFromReport"
                        checked={formData.excludeFromReport || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, excludeFromReport: e.target.checked }))}
                        style={{ width: 'auto', margin: '0 8px 0 0' }}
                    />
                    <label htmlFor="excludeFromReport" style={{ margin: 0, color: '#666', fontWeight: 'normal', cursor: 'pointer' }}>
                        この記録を月報（集計・出力）に含めない
                    </label>
                </div>

                <button className="btn-primary" onClick={handleSubmit} style={{ marginTop: '6px' }}>変更を保存する</button>
            </div>
        </div>
    );
}

export default EditModal;
