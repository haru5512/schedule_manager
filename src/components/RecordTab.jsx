import { useState, useEffect, useRef } from 'react';
import { toDateStr, toTimeStr, generateCalendarUrl } from '../utils';
import { SpeechRecognizer } from '../utils/speechRecognition';
import { parseVoiceInput } from '../utils/geminiParser';

function RecordTab({ onAdd, gasUrl }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [place, setPlace] = useState('');
    const [count, setCount] = useState('');
    const [note, setNote] = useState('');
    const [toastMsg, setToastMsg] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const recognizerRef = useRef(null);

    useEffect(() => {
        const now = new Date();
        setDate(toDateStr(now));
        setTime(toTimeStr(now));

        // Initialize speech recognizer
        recognizerRef.current = new SpeechRecognizer();

        recognizerRef.current.onStart(() => {
            setIsListening(true);
            showToast('🎤 聞いています...');
        });

        recognizerRef.current.onResult(async (transcript) => {
            showToast(`認識: ${transcript}`);
            setIsParsing(true);

            try {
                if (!gasUrl) {
                    alert('GAS WebアプリのURLが設定されていません。\n設定画面で設定してください。');
                    setIsParsing(false);
                    return;
                }

                const parsed = await parseVoiceInput(transcript, gasUrl);

                // Populate fields
                if (parsed.date) setDate(parsed.date);
                if (parsed.time) setTime(parsed.time);
                if (parsed.category) setCategory(parsed.category);
                if (parsed.content) setContent(parsed.content);
                if (parsed.place) setPlace(parsed.place);
                if (parsed.count) setCount(parsed.count.toString());
                if (parsed.note) setNote(parsed.note);

                showToast('✅ フィールドに入力しました');
            } catch (error) {
                alert(`解析エラー: ${error.message}`);
            } finally {
                setIsParsing(false);
            }
        });

        recognizerRef.current.onError((errorMessage) => {
            alert(errorMessage);
            setIsListening(false);
            setIsParsing(false);
        });

        recognizerRef.current.onEnd(() => {
            setIsListening(false);
        });

        return () => {
            if (recognizerRef.current) {
                recognizerRef.current.stop();
            }
        };
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
        setTimeout(() => setToastMsg(''), 2500);
    };

    const handleVoiceInput = () => {
        if (isListening || isParsing) {
            return;
        }

        if (!recognizerRef.current || !recognizerRef.current.supported) {
            alert('このブラウザは音声入力に対応していません。\nChrome、Edge、Safariをお試しください。');
            return;
        }

        if (!gasUrl) {
            alert('GAS WebアプリのURLが設定されていません。\n設定画面で設定してください。');
            return;
        }

        recognizerRef.current.start();
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>活動内容</label>
                    {/* <button
                        type="button"
                        className={`mic-btn ${isListening ? 'listening' : ''} ${isParsing ? 'parsing' : ''}`}
                        onClick={handleVoiceInput}
                        disabled={isListening || isParsing}
                        title="音声入力"
                    >
                        {isParsing ? '⏳' : isListening ? '🔴' : '🎤'}
                    </button> */}
                </div>
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
