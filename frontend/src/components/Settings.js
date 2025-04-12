import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
    const [javaVersion, setJavaVersion] = useState('jdk-17');
    const [ramAllocation, setRamAllocation] = useState('4096');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/settings');
            if (!response.ok) throw new Error('Błąd przy ładowaniu ustawień!');
            const data = await response.json();
            setJavaVersion(data.javaVersion || 'jdk-17');
            setRamAllocation(data.ramAllocation || '4096');
        } catch (err) {
            console.error('Błąd:', err.message);
        }
    };

    const saveSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ javaVersion, ramAllocation }),
            });
            if (!response.ok) throw new Error('Błąd przy zapisywaniu ustawień!');
            console.log('Zapisano ustawienia:', { javaVersion, ramAllocation });
        } catch (err) {
            console.error('Błąd:', err.message);
        }
    };

    return (
        <div className="settings">
            <h2>Ustawienia</h2>
            <div className="setting">
                <label>Wersja Javy:</label>
                <input
                    type="text"
                    value={javaVersion}
                    onChange={(e) => setJavaVersion(e.target.value)}
                />
            </div>
            <div className="setting">
                <label>RAM (MB):</label>
                <input
                    type="number"
                    value={ramAllocation}
                    onChange={(e) => setRamAllocation(e.target.value)}
                />
            </div>
            <button onClick={saveSettings}>Zapisz</button>
        </div>
    );
};

export default Settings;