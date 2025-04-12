import React, { useState, useEffect } from 'react';
import './Accounts.css';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [error, setError] = useState(null);
    const [newUsername, setNewUsername] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:3000/accounts');
            if (!response.ok) throw new Error('Błąd przy ładowaniu kont!');
            const data = await response.json();
            console.log('Pobrano konta:', data);
            setAccounts(data);
            setError(null);
        } catch (err) {
            console.error('Błąd:', err.message);
            setError('Nie udało się załadować kont. Sprawdź, czy serwer działa!');
        }
    };

    const addAccount = async () => {
        try {
            const response = await fetch('http://localhost:3000/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername }),
            });
            if (!response.ok) throw new Error('Błąd przy dodawaniu konta!');
            setNewUsername('');
            fetchAccounts();
        } catch (err) {
            setError('Nie udało się dodać konta!');
        }
    };

    return (
        <div className="accounts">
            <h2>Konta</h2>
            {error && <p className="error">{error}</p>}
            <div className="add-account">
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Nazwa użytkownika"
                />
                <button onClick={addAccount}>Dodaj konto</button>
            </div>
            <ul>
                {accounts.map((account) => (
                    <li key={account.id}>{account.username} ({account.type})</li>
                ))}
            </ul>
        </div>
    );
};

export default Accounts;