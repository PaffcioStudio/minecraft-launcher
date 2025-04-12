const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const settingsFile = path.join(__dirname, '..', '..', 'data', 'settings.json');

// Inicjalizacja pliku ustawień
async function initSettingsFile() {
    try {
        await fs.access(settingsFile);
    } catch {
        await fs.writeFile(settingsFile, JSON.stringify({ javaVersion: 'jdk-17', ramAllocation: '4096' }));
        console.log('Utworzono pusty plik settings.json');
    }
}

// Pobieranie ustawień
router.get('/', async (req, res) => {
    try {
        await initSettingsFile();
        const data = await fs.readFile(settingsFile);
        const settings = JSON.parse(data);
        console.log('Wysłano ustawienia:', settings);
        res.json(settings);
    } catch (err) {
        console.error('Błąd przy ładowaniu ustawień:', err.message);
        res.status(500).json({ error: 'Błąd przy ładowaniu ustawień!' });
    }
});

// Zapisywanie ustawień
router.post('/', async (req, res) => {
    try {
        await initSettingsFile();
        const newSettings = {
            javaVersion: String(req.body.javaVersion),
            ramAllocation: String(req.body.ramAllocation),
        };
        await fs.writeFile(settingsFile, JSON.stringify(newSettings, null, 2));
        console.log('Zapisano ustawienia:', newSettings);
        res.json(newSettings);
    } catch (err) {
        console.error('Błąd przy zapisywaniu ustawień:', err.message);
        res.status(500).json({ error: 'Błąd przy zapisywaniu ustawień!' });
    }
});

module.exports = router;