import { useState, useEffect } from 'react';
import { WEEKDAYS } from './utils';
import RecordTab from './components/RecordTab';
import ListTab from './components/ListTab';
import MonthlyTab from './components/MonthlyTab';

function App() {
  const [activeTab, setActiveTab] = useState('record');
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('activity_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [headerDate, setHeaderDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const wd = WEEKDAYS[now.getDay()];
    setHeaderDate(`${now.getMonth() + 1}月${now.getDate()}日（${wd}）`);
  }, []);

  useEffect(() => {
    localStorage.setItem('activity_records', JSON.stringify(records));
  }, [records]);

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
          <div className="header-date">{headerDate}</div>
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
    </>
  );
}

export default App;
