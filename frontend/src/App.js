import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Versions from './components/Versions';
import Settings from './components/Settings';
import Accounts from './components/Accounts';
import Instances from './components/Instances';
import './App.css';

// Modal błędów
const ErrorModal = ({ error, onClose, onCopy, onDelete }) => (
  <div className="modal">
    <div className="modal-content">
      <h3>Błąd!</h3>
      <textarea readOnly value={error} />
      <div className="modal-buttons">
        <button onClick={onCopy}>Skopiuj</button>
        <button onClick={onDelete}>Usuń</button>
        <button onClick={onClose}>Zamknij</button>
      </div>
    </div>
  </div>
);

// Popup powiadomień
const Popup = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="popup">
      {message}
      <button onClick={onClose}>X</button>
    </div>
  );
};

const App = () => {
  const [tab, setTab] = useState('instances');
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null);
  const [progress, setProgress] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Wczytaj konta
  useEffect(() => {
    axios.get('/api/accounts').then(res => setAccounts(res.data.accounts));
  }, []);

  // Obsługa błędów
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setProgress(null); // Reset paska postępu
  };

  // Pokaż popup
  const showPopup = (message) => {
    setPopup(message);
    setTimeout(() => setPopup(null), 3000);
  };

  // Skopiuj błąd
  const copyError = () => {
    navigator.clipboard.writeText(error);
    showPopup('Skopiowano błąd do schowka');
  };

  // Usuń plik błędu
  const deleteErrorFile = async () => {
    try {
      await axios.post('/api/delete-error');
      showPopup('Usunięto plik błędu');
      setError(null);
    } catch (err) {
      showPopup('Błąd usuwania pliku');
    }
  };

  return (
    <div className="app">
      {accounts.length === 0 && (
        <div className="no-account">
          <p>Brak konta! Dodaj konto, by odblokować opcje.</p>
        </div>
      )}
      <nav>
        <button disabled={accounts.length === 0} onClick={() => setTab('instances')}>Instancje</button>
        <button disabled={accounts.length === 0} onClick={() => setTab('versions')}>Wersje</button>
        <button disabled={accounts.length === 0} onClick={() => setTab('settings')}>Ustawienia</button>
        <button onClick={() => setTab('accounts')}>Konta</button>
      </nav>
      <main>
        {tab === 'instances' && <Instances />}
        {tab === 'versions' && <Versions />}
        {tab === 'settings' && <Settings showPopup={showPopup} />}
        {tab === 'accounts' && <Accounts showPopup={showPopup} />}
      </main>
      {progress && (
        <div className="progress">
          <p>{progress.status}</p>
          <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
        </div>
      )}
      {error && (
        <ErrorModal
          error={error}
          onClose={() => setError(null)}
          onCopy={copyError}
          onDelete={deleteErrorFile}
        />
      )}
      {popup && <Popup message={popup} onClose={() => setPopup(null)} />}
    </div>
  );
};

export default App;