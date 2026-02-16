import { useState, useEffect } from 'react';
import { toDateStr, toTimeStr, generateCalendarUrl } from '../utils';

function RecordTab({ onAdd }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [place, setPlace] = useState('');
    const [count, setCount] = useState('');
    const [note, setNote] = useState('');
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        const now = new Date();
        setDate(toDateStr(now));
        setTime(toTimeStr(now));
    }, []);

    const handleSubmit = () => {
        if (!date || !content || !category) {
            alert('日付・カテゴリ・活動内容を入力してください');
            return;
        }

        const record = {
            id: Date.now(),
            date,
            time,
            category,
            content: content.trim(),
            place: place.trim(),
            count: parseInt(count) || 0,
            note: note.trim(),
        };

        onAdd(record);
        resetForm();

        // Calendar Prompt
        const calendarUrl = generateCalendarUrl(record);
        // Use a slight delay to allow React to render/process, though not strictly necessary for alert
        setTimeout(() => {
            if (window.confirm('✅ 記録しました！\n📅 Googleカレンダーにも登録しますか？')) {
                window.open(calendarUrl, '_blank');
            } else {
                showToast('✅ 記録しました');
            }
        }, 100);
    };

    const resetForm = () => {
        const now = new Date();
        setDate(toDateStr(now));
        setTime(toTimeStr(now));
        setContent('');
        setPlace('');
        setCount('');
        setNote('');
        setCategory('');
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2200);
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
        <div className="page active">
            <div className="card">
                <div className="card-title">今日の活動を記録</div>

                <label>日付・時間</label>
                <div className="sub-row">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>

                <label>カテゴリ</label>
                <div className="category-grid">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            className={`cat-btn ${category === cat.name ? 'selected' : ''}`}
                            onClick={() => setCategory(cat.name)}
                        >
                            <span className="cat-icon">{cat.icon}</span>{cat.name}
                        </button>
                    ))}
                </div>

                <label>活動内容</label>
                <textarea
                    placeholder="例：地域住民との意見交換会に参加"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                ></textarea>

                <div className="sub-row">
                    <div>
                        <label>場所</label>
                        <input
                            type="text"
                            placeholder="例：町役場"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>参加人数</label>
                        <input
                            type="number"
                            placeholder="例：10"
                            min="0"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                        />
                    </div>
                </div>

                <label>メモ（任意）</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <button className="btn-primary" onClick={handleSubmit}>記録を保存する</button>
            </div>

            <div className={`toast ${toastMsg ? 'show' : ''}`} style={{ transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)' }}>
                {toastMsg}
            </div>
        </div>
    );
}

export default RecordTab;
