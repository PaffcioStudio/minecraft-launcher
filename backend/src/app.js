const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const fs = require('fs-extra');
const axios = require('axios');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'", "http://localhost:3000", "https://launchermeta.mojang.com", "https://resources.download.minecraft.net", "https://api.adoptium.net", "https://pastebin.com"],
            fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Services
const JavaManager = require('./services/javaManager');
const VersionManager = require('./services/versionManager').VersionManager;
const AccountManager = require('./services/accountManager');
const InstanceManager = require('./services/instanceManager');
const { saveConfig, loadConfig } = require('./services/configManager');

const javaManager = new JavaManager();
const versionManager = new VersionManager();
const accountManager = new AccountManager();
const instanceManager = new InstanceManager();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public', 'index.html'));
});

// Java
app.get('/api/java/versions', async (req, res) => {
    try {
        const versions = await javaManager.getAvailableJavaVersions();
        res.json(versions);
    } catch (error) {
        console.error('Błąd przy pobieraniu wersji Javy:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać wersji Javy' });
    }
});

app.post('/api/java/download/:version', async (req, res) => {
    const { version } = req.params;
    try {
        await javaManager.downloadJava(version);
        res.json({ message: `Java ${version} pobrana` });
    } catch (error) {
        console.error('Błąd przy pobieraniu Javy:', error.message);
        res.status(500).json({ error: `Nie udało się pobrać Javy: ${error.message}` });
    }
});

// Versions
app.get('/api/minecraft/versions', async (req, res) => {
    try {
        const versions = await versionManager.fetchVersions();
        res.json(versions);
    } catch (error) {
        console.error('Błąd przy pobieraniu wersji:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać wersji Minecrafta' });
    }
});

app.post('/api/versions/download/:versionId', async (req, res) => {
    const { versionId } = req.params;
    try {
        await versionManager.downloadVersion(versionId);
        res.json({ message: `Wersja ${versionId} pobrana` });
    } catch (error) {
        console.error('Błąd przy pobieraniu wersji:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać wersji' });
    }
});

// Accounts
app.get('/api/accounts', (req, res) => {
    res.json(accountManager.getAccounts());
});

app.post('/api/accounts', (req, res) => {
    const { username, type } = req.body;
    if (!username) return res.status(400).json({ error: 'Nazwa użytkownika wymagana' });
    const success = type === 'offline' ? accountManager.addOfflineAccount(username) : accountManager.addAccount({ username, type });
    if (success) {
        accountManager.saveAccounts();
        res.status(201).json({ message: 'Konto dodane', username });
    } else {
        res.status(400).json({ error: 'Konto już istnieje' });
    }
});

app.post('/api/accounts/switch', (req, res) => {
    const { username } = req.body;
    const account = accountManager.switchAccount(username);
    if (account) {
        accountManager.saveAccounts();
        res.json({ message: `Przełączono na ${username}` });
    } else {
        res.status(404).json({ error: 'Konto nie znalezione' });
    }
});

app.delete('/api/accounts', (req, res) => {
    const { username } = req.body;
    const success = accountManager.removeAccount(username);
    if (success) {
        accountManager.saveAccounts();
        res.json({ message: 'Konto usunięte' });
    } else {
        res.status(404).json({ error: 'Konto nie znalezione' });
    }
});

app.post('/api/accounts/default', (req, res) => {
    const { username } = req.body;
    const success = accountManager.setDefaultAccount(username);
    if (success) {
        accountManager.saveAccounts();
        res.json({ message: `Ustawiono domyślne konto: ${username}` });
    } else {
        res.status(404).json({ error: 'Konto nie znalezione' });
    }
});

// Instances
app.get('/api/instances', async (req, res) => {
    try {
        res.json(instanceManager.listInstances());
    } catch (error) {
        console.error('Błąd przy pobieraniu instancji:', error.message);
        res.status(500).json({ error: 'Nie udało się pobrać instancji' });
    }
});

app.post('/api/instances', async (req, res) => {
    const { instanceName, version, ram, account } = req.body;
    if (!instanceName || !version) return res.status(400).json({ error: 'Nazwa i wersja wymagane' });
    try {
        const instance = instanceManager.createInstance(instanceName, version, ram || 2048, account || 'default');
        res.status(201).json({ message: 'Instancja utworzona', instance });
    } catch (error) {
        console.error('Błąd przy tworzeniu instancji:', error.message);
        res.status(500).json({ error: `Nie udało się utworzyć instancji: ${error.message}` });
    }
});

app.put('/api/instances', async (req, res) => {
    const { oldName, newDetails } = req.body;
    try {
        const instance = instanceManager.editInstance(oldName, newDetails);
        res.json({ message: 'Instancja zaktualizowana', instance });
    } catch (error) {
        console.error('Błąd przy edycji instancji:', error.message);
        res.status(404).json({ error: `Instancja nie znaleziona: ${error.message}` });
    }
});

app.delete('/api/instances', async (req, res) => {
    const { instanceName } = req.body;
    try {
        instanceManager.deleteInstance(instanceName);
        res.json({ message: 'Instancja usunięta' });
    } catch (error) {
        console.error('Błąd przy usuwaniu instancji:', error.message);
        res.status(404).json({ error: `Instancja nie znaleziona: ${error.message}` });
    }
});

// Config
app.post('/api/config', async (req, res) => {
    try {
        saveConfig(req.body);
        res.json({ message: 'Konfiguracja zapisana' });
    } catch (error) {
        console.error('Błąd przy zapisywaniu konfiguracji:', error.message);
        res.status(500).json({ error: 'Nie udało się zapisać konfiguracji' });
    }
});

app.get('/api/config', async (req, res) => {
    try {
        res.json(loadConfig());
    } catch (error) {
        console.error('Błąd przy wczytywaniu konfiguracji:', error.message);
        res.status(500).json({ error: 'Nie udało się wczytać konfiguracji' });
    }
});

// Pastebin upload
app.post('/api/pastebin/upload', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'Klucz API wymagany' });

    try {
        const logsPath = path.join(os.homedir(), '.minecraft-launcher', 'logs.log');
        const logs = await fs.readFile(logsPath, 'utf-8');
        const response = await axios.post('https://pastebin.com/api/api_post.php', new URLSearchParams({
            api_dev_key: apiKey,
            api_option: 'paste',
            api_paste_code: logs,
            api_paste_private: '1',
            api_paste_name: `Minecraft Launcher Logs - ${new Date().toISOString()}`,
            api_paste_expire_date: '1W'
        }));

        if (response.data.startsWith('http')) {
            res.json({ url: response.data });
            console.log('Logi wysłane na Pastebin:', response.data);
        } else {
            throw new Error(response.data);
        }
    } catch (error) {
        console.error('Błąd wysyłania na Pastebin:', error.message);
        res.status(500).json({ error: `Nie udało się wysłać logów: ${error.message}` });
    }
});

// Start gry z progresem
app.get('/api/minecraft/launch/:instanceName', async (req, res) => {
    const { instanceName } = req.params;

    // Ustaw SSE
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    try {
        console.log(`Próba uruchomienia instancji: ${instanceName}`);
        const instance = instanceManager.getInstance(instanceName);
        if (!instance) {
            console.error(`Instancja ${instanceName} nie znaleziona`);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Instancja nie znaleziona' })}\n\n`);
            res.end();
            return;
        }

        // Krok 1: Java
        console.log(`Pobieranie Javy dla wersji: ${instance.javaVersion || '17'}`);
        const javaPath = javaManager.getJavaPath(instance.javaVersion || '17');
        if (!await fs.exists(javaPath) || !javaManager.isJavaDownloaded(instance.javaVersion || '17')) {
            console.log(`Java nie znaleziona lub uszkodzona, pobieranie...`);
            await javaManager.downloadJava(instance.javaVersion || '17', (percent, downloaded, total) => {
                res.write(`data: ${JSON.stringify({
                    type: 'progress',
                    step: 1,
                    totalSteps: 3,
                    message: 'Pobieranie Javy',
                    percent,
                    bytesDownloaded: downloaded,
                    bytesTotal: total,
                    speed: downloaded && total ? ((downloaded * 8 / 1024 / 1024) / (total / 1000)).toFixed(2) : undefined
                })}\n\n`);
            });
        } else {
            console.log(`Java znaleziona w: ${javaPath}`);
            res.write(`data: ${JSON.stringify({ type: 'progress', step: 1, totalSteps: 3, message: 'Java już pobrana', percent: 100 })}\n\n`);
        }

        // Krok 2: Wersja i assetsy
        console.log(`Pobieranie wersji Minecrafta: ${instance.version}`);
        versionManager.onProgress = (step, totalSteps, percent, downloadedMB, totalMB, speed) => {
            res.write(`data: ${JSON.stringify({
                type: 'progress',
                step,
                totalSteps,
                message: step === 2 ? 'Pobieranie bibliotek' : 'Pobieranie Assetsów',
                percent,
                bytesDownloaded: downloadedMB ? downloadedMB * 1024 * 1024 : undefined,
                bytesTotal: totalMB ? totalMB * 1024 * 1024 : undefined,
                speed
            })}\n\n`);
        };
        const versionDetails = await versionManager.downloadVersion(instance.version);
        if (!versionDetails) {
            throw new Error('Nie udało się pobrać szczegółów wersji');
        }

        // Krok 3: Uruchamianie
        console.log(`Uruchamianie Minecrafta dla instancji: ${instanceName}`);
        for (let i = 0; i <= 100; i += 10) {
            res.write(`data: ${JSON.stringify({ type: 'progress', step: 3, totalSteps: 3, message: 'Uruchamianie', percent: i })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const { launchMinecraft } = require('./services/minecraftLauncher');
        await launchMinecraft(javaPath, instance, versionDetails);

        res.write(`data: ${JSON.stringify({ type: 'complete', message: `Uruchomiono Minecraft: ${instanceName}` })}\n\n`);
        res.end();
    } catch (error) {
        console.error(`Błąd przy uruchamianiu instancji ${instanceName}:`, error.message);
        res.write(`data: ${JSON.stringify({ type: 'error', message: `Nie udało się uruchomić Minecrafta: ${error.message}` })}\n\n`);
        res.end();
    }
});

// Start serwera
const server = app.listen(PORT, () => {
    console.log(`Serwer śmiga na http://localhost:${PORT}`);
});

// Zamykanie serwera
process.on('SIGTERM', () => {
    console.log('Zamykanie serwera...');
    server.close(() => {
        console.log('Serwer zamknięty');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Zamykanie serwera...');
    server.close(() => {
        console.log('Serwer zamknięty');
        process.exit(0);
    });
});