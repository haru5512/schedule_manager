import { useState, useEffect } from 'react';

function SettingsModal({ isOpen, onClose, onSaveUrl }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('gas_webapp_url');
        if (saved) setUrl(saved);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        const cleanUrl = url.trim();
        localStorage.setItem('gas_webapp_url', cleanUrl);
        onSaveUrl(cleanUrl);
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            display: 'flex', position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center'
        }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div style={{
                background: 'white', width: '90%', maxWidth: '400px', borderRadius: '16px',
                padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ fontFamily: "'Shippori Mincho',serif", fontSize: '18px', color: 'var(--forest)', marginBottom: '16px' }}>
                    ⚙️ 設定 (Google連携)
                </h3>

                <label>GAS WebアプリのURL</label>
                <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '20px', lineHeight: '1.5' }}>
                    ※ Googleスプレッドシートの「拡張機能 &gt; Apps Script」にコードを貼り付け、「デプロイ &gt; 新しいデプロイ」から発行されたURLを入力してください。
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={onClose} style={{ flex: 1, margin: 0 }}>キャンセル</button>
                    <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>保存</button>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
