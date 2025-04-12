const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

class JavaManager {
    constructor() {
        this.javaBasePath = path.join(__dirname, '../../java');
    }

    async getAvailableJavaVersions() {
        try {
            const response = await axios.get('https://api.adoptium.net/v3/info/available_releases');
            const versions = response.data.available_releases.map(version => ({
                version: version.toString(),
                downloaded: this.isJavaDownloaded(version.toString()),
                size: 'Unknown'
            }));
            console.log('Dostępne wersje Javy:', versions);
            return versions;
        } catch (error) {
            console.error('Błąd pobierania wersji Javy:', error.message);
            return [];
        }
    }

    isJavaDownloaded(version) {
        const javaPath = this.getJavaPath(version);
        try {
            if (fs.existsSync(javaPath)) {
                execSync(`"${javaPath}" -version`, { stdio: 'ignore' });
                console.log(`Java ${version} znaleziona i zweryfikowana w: ${javaPath}`);
                return true;
            }
            console.log(`Java ${version} nie znaleziona w: ${javaPath}`);
            return false;
        } catch (error) {
            console.error(`Błąd weryfikacji Javy ${version} w ${javaPath}:`, error.message);
            // Usuń folder, jeśli Java jest uszkodzona
            const javaDir = path.join(this.javaBasePath, `jdk-${version}`);
            console.log(`Usuwam uszkodzony folder Javy: ${javaDir}`);
            fs.removeSync(javaDir);
            return false;
        }
    }

    getJavaPath(version) {
        const javaDir = path.join(this.javaBasePath, `jdk-${version}`);
        const javaPath = path.join(javaDir, 'bin', 'java.exe');
        console.log(`Sprawdzam ścieżkę Javy ${version}: ${javaPath}`);
        return javaPath;
    }

    async downloadJava(version, onProgress = () => {}) {
        if (this.isJavaDownloaded(version)) {
            console.log(`Java ${version} już pobrana, pomijam pobieranie`);
            onProgress(100, 0, 0);
            return;
        }

        console.log(`Rozpoczynam pobieranie Javy ${version}`);
        const javaDir = path.join(this.javaBasePath, `jdk-${version}`);
        const url = `https://api.adoptium.net/v3/binary/latest/${version}/ga/windows/x64/jdk/hotspot/normal/eclipse`;

        try {
            await fs.ensureDir(javaDir);
            const response = await axios.get(url, { responseType: 'stream' });

            const total = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;

            response.data.on('data', chunk => {
                downloaded += chunk.length;
                const percent = Math.round((downloaded / total) * 100);
                onProgress(percent, downloaded, total);
                console.log(`Pobieranie Javy ${version}: ${percent}% (${downloaded}/${total} bajtów)`);
            });

            const zipPath = path.join(javaDir, 'jdk.zip');
            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`Rozpakowuję Javę ${version}`);
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(javaDir, true);
            await fs.unlink(zipPath);
            console.log(`Java ${version} pobrana i rozpakowana`);

            // Sprawdź, czy java.exe działa
            const javaPath = this.getJavaPath(version);
            if (fs.existsSync(javaPath)) {
                execSync(`"${javaPath}" -version`, { stdio: 'ignore' });
                console.log(`Weryfikacja Javy ${version} zakończona sukcesem`);
            } else {
                throw new Error(`Plik java.exe nie znaleziony po rozpakowaniu w: ${javaPath}`);
            }
        } catch (error) {
            console.error(`Błąd pobierania Javy ${version}:`, error.message);
            await fs.remove(javaDir); // Wyczyść przy błędzie
            throw error;
        }
    }
}

module.exports = JavaManager;