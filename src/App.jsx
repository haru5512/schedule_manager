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
    console.log('App Version: 1.2.0 (Dual Pane)'); // Debug for deployment
    const now = new Date();
    const wd = WEEKDAYS[now.getDay()];
    setHeaderDate(`${now.getMonth() + 1}月${now.getDate()}日（${wd}）`);

    // Check for setup magic link
    const params = new URLSearchParams(window.location.search);
    const setupGas = params.get('setup_gas');
    if (setupGas) {
      if (window.confirm('設定を引き継ぎますか？')) {
        localStorage.setItem('gas_webapp_url', setupGas);
        setGasUrl(setupGas);
        alert('✅ 設定を完了しました！');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
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
    console.log('[GAS] Syncing to:', gasUrl);

    // Use text/plain to avoid CORS preflight and allow simple request
    const payload = JSON.stringify(currentRecords);

    try {
      await fetch(gasUrl, {
        method: 'POST',
        // mode: 'no-cors', // standard fetch should work if GAS returns correct headers, but let's try 'no-cors' with plain text
        // actually, GAS Web App *redirects* which fetch follows.
        // Let's try standard fetch first, but with text/plain to avoid complex CORS
        headers: { 'Content-Type': 'text/plain' },
        body: payload
      });
      console.log('[GAS] Sync request sent');
    } catch (e) {
      console.error('[GAS] Sync failed:', e);
      // In no-cors or successful redirect, we might not catch error here unless network fails
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchFromGas = async () => {
    if (!gasUrl) return;
    setIsSyncing(true);
    console.log('[GAS] Fetching from:', gasUrl);
    try {
      const res = await fetch(gasUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log('[GAS] Data received:', data);

      // Handle both old format (array) and new format (object with records + spreadsheetUrl)
      const fetchedRecords = Array.isArray(data) ? data : data.records;

      if (Array.isArray(fetchedRecords) && fetchedRecords.length > 0) {
        fetchedRecords.forEach(r => {
          if (r.count) r.count = parseInt(r.count);
        });
        // Ensure fetched data is sorted (Newest first) to match App logic
        fetchedRecords.sort((a, b) => {
          const dateA = (a.date || '') + (a.time || '');
          const dateB = (b.date || '') + (b.time || '');
          return dateA > dateB ? -1 : 1;
        });

        setRecords(fetchedRecords);
        console.log('[GAS] Local records updated from SpreadSheet');
      } else {
        console.log('[GAS] No data in SpreadSheet or empty array');
      }

      // Save spreadsheet URL if available
      if (data.spreadsheetUrl) {
        localStorage.setItem('spreadsheet_url', data.spreadsheetUrl);
      }
    } catch (e) {
      console.error('[GAS] Fetch failed:', e);
      // Don't alert on fetch fail to avoid annoying popup on load, just log
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

  const bulkDeleteRecords = (ids) => {
    if (window.confirm(`${ids.length}件の記録を削除しますか？`)) {
      setRecords(records.filter(r => !ids.includes(r.id)));
    }
  };

  const handleImportCompleted = () => {
    // Called when import is done in settings. Fetch fresh data.
    fetchFromGas();
  };

  // Responsive check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      // If switching to desktop and on record tab, switch to list (since record is side-panel)
      if (desktop && activeTab === 'record') {
        setActiveTab('list');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

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
          data-tab="record"
        >
          ✏️ 記録
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
          data-tab="list"
        >
          📋 一覧
        </button>
        <button
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
          data-tab="monthly"
        >
          📊 月報
        </button>
      </div>

      <div className="main">
        {/* Record Panel: Visible if tab is record OR if on desktop (side panel) */}
        <div className="panel-record" style={{ display: (activeTab === 'record' || isDesktop) ? 'block' : 'none' }}>
          <RecordTab onAdd={addRecord} gasUrl={gasUrl} />
        </div>

        {/* Content Panel: Visible if tab is NOT record OR if on desktop (main panel) */}
        <div className="panel-content" style={{ display: (activeTab !== 'record' || isDesktop) ? 'block' : 'none' }}>
          {(activeTab === 'list' || (isDesktop && activeTab === 'record')) && (
            <ListTab
              records={records}
              onUpdate={updateRecord}
              onDelete={deleteRecord}
              onBulkDelete={bulkDeleteRecords}
            />
          )}
          {activeTab === 'monthly' && (
            <MonthlyTab records={records} />
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveUrl={(url) => { setGasUrl(url); }}
        onImportCompleted={handleImportCompleted}
        gasUrl={gasUrl}
      />
    </>
  );
}

export default App;
