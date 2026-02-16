import { useState, useEffect } from 'react';
import { WEEKDAYS } from './utils';
import RecordTab from './components/RecordTab';
import ListTab from './components/ListTab';
import MonthlyTab from './components/MonthlyTab';
import SettingsModal from './components/SettingsModal';

function App() {
  const [activeTab, setActiveTab] = useState('record');
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('activity_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [headerDate, setHeaderDate] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('gas_webapp_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const now = new Date();
    const wd = WEEKDAYS[now.getDay()];
    setHeaderDate(`${now.getMonth() + 1}月${now.getDate()}日（${wd}）`);
  }, []);

  useEffect(() => {
    localStorage.setItem('activity_records', JSON.stringify(records));
  }, [records]);

  // Sync to GAS when records change (Debounced to avoid too many requests)
  useEffect(() => {
    if (!gasUrl || records.length === 0) return;

    const timer = setTimeout(() => {
      syncToGas(records);
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [records, gasUrl]);

  // Initial Fetch
  useEffect(() => {
    if (gasUrl) {
      fetchFromGas();
    }
  }, [gasUrl]);

  const syncToGas = async (currentRecords) => {
    if (!gasUrl) return;
    setIsSyncing(true);
    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', // GAS Web App limitation with JSON
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRecords)
      });
      // no-cors means we can't read response, but request is sent
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchFromGas = async () => {
    if (!gasUrl) return;
    setIsSyncing(true);
    try {
      const res = await fetch(gasUrl);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(r => {
          if (r.count) r.count = parseInt(r.count);
        });
        setRecords(data);
      }
    } catch (e) {
      console.error('Fetch failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const addRecord = (record) => {
    const newRecords = [...records, record];
    newRecords.sort((a, b) => `${a.date}${a.time}` > `${b.date}${b.time}` ? -1 : 1);
    setRecords(newRecords);
  };

  const updateRecord = (updatedRecord) => {
    const newRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    newRecords.sort((a, b) => `${a.date}${a.time}` > `${b.date}${b.time}` ? -1 : 1);
    setRecords(newRecords);
  };

  const deleteRecord = (id) => {
    if (!window.confirm('この記録を削除しますか？')) return;
    setRecords(records.filter(r => r.id !== id));
  };

  return (
    <>
      <div className="header">
        <div className="header-top">
          <div>
            <div className="app-title">🌱 活動記録</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isSyncing && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>⟳ Sync...</span>}
            <div className="header-date">{headerDate}</div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'rgba(255,255,255,0.8)', padding: 0 }}
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          ✏️ 記録
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 一覧
        </button>
        <button
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          📊 月報
        </button>
      </div>

      <div className="main">
        {activeTab === 'record' && (
          <RecordTab onAdd={addRecord} />
        )}
        {activeTab === 'list' && (
          <ListTab
            records={records}
            onUpdate={updateRecord}
            onDelete={deleteRecord}
          />
        )}
        {activeTab === 'monthly' && (
          <MonthlyTab records={records} />
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveUrl={(url) => { setGasUrl(url); }}
      />
    </>
  );
}

export default App;
