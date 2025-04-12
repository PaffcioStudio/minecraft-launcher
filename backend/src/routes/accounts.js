const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const accountsFile = path.join(__dirname, '..', '..', 'data', 'accounts.json');

// Inicjalizacja pliku kont, jeśli nie istnieje
async function initAccountsFile() {
    try {
        await fs.access(accountsFile);
    } catch {
        await fs.writeFile(accountsFile, JSON.stringify([]));
        console.log('Utworzono pusty plik accounts.json');
    }
}

// Pobieranie wszystkich kont
router.get('/', async (req, res) => {
    try {
        await initAccountsFile();
        const data = await fs.readFile(accountsFile);
        const accounts = JSON.parse(data);
        console.log('Wysłano listę kont:', accounts);
        res.json(accounts);
    } catch (err) {
        console.error('Błąd przy ładowaniu kont:', err.message);
        res.status(500).json({ error: 'Błąd przy ładowaniu kont. Sprawdź, czy serwer działa!' });
    }
});

// Dodawanie konta
router.post('/', async (req, res) => {
    try {
        await initAccountsFile();
        const data = await fs.readFile(accountsFile);
        const accounts = JSON.parse(data);
        const newAccount = { id: Date.now(), username: req.body.username, type: 'offline' };
        accounts.push(newAccount);
        await fs.writeFile(accountsFile, JSON.stringify(accounts, null, 2));
        console.log('Dodano konto:', newAccount);
        res.json(newAccount);
    } catch (err) {
        console.error('Błąd przy dodawaniu konta:', err.message);
        res.status(500).json({ error: 'Błąd przy dodawaniu konta!' });
    }
});

module.exports = router;