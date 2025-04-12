const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const configDir = path.join(os.homedir(), '.minecraft-launcher');
const configPath = path.join(configDir, 'config.json');

function saveConfig(config) {
    try {
        fs.ensureDirSync(configDir);
        fs.writeJsonSync(configPath, {
            javaVersion: config.javaVersion || '',
            debugMode: config.debugMode || false,
            pastebinEnabled: config.pastebinEnabled || false,
            pastebinApiKey: config.pastebinApiKey || ''
        }, { spaces: 2 });
        console.log('Konfiguracja zapisana:', config);
    } catch (error) {
        console.error('Błąd zapisu konfiguracji:', error.message);
        throw error;
    }
}

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const config = fs.readJsonSync(configPath);
            console.log('Wczytano konfigurację:', config);
            return config;
        }
        console.log('Brak pliku konfiguracji, zwracam domyślne');
    } catch (error) {
        console.error('Błąd wczytywania konfiguracji:', error.message);
    }
    return {
        javaVersion: '',
        debugMode: false,
        pastebinEnabled: false,
        pastebinApiKey: ''
    };
}

module.exports = { saveConfig, loadConfig };