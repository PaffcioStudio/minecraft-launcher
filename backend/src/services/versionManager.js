const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class VersionManager {
    constructor() {
        this.versionsDir = path.join(__dirname, '../..', 'versions');
        this.assetsDir = path.join(__dirname, '../..', 'assets');
        this.librariesDir = path.join(__dirname, '../..', 'libraries');
        this.onProgress = null;
    }

    async fetchVersions() {
        try {
            console.log('Pobieranie manifestu wersji Minecrafta...');
            const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            return response.data.versions.map(v => ({
                id: v.id,
                type: v.type,
                releaseTime: v.releaseTime
            }));
        } catch (error) {
            console.error('Błąd przy pobieraniu wersji:', error.message);
            throw error;
        }
    }

    async downloadVersion(versionId) {
        try {
            await fs.ensureDir(this.versionsDir);

            console.log(`Szukam wersji ${versionId} w manifeście...`);
            const manifest = await this.fetchVersions();
            const version = manifest.find(v => v.id === versionId);
            if (!version) {
                throw new Error(`Wersja ${versionId} nie znaleziona`);
            }

            console.log(`Pobieranie szczegółów wersji ${versionId}...`);
            const versionResponse = await axios.get(`https://piston-meta.mojang.com/mc/game/version_manifest_v2.json`);
            const versionDetails = versionResponse.data.versions.find(v => v.id === versionId);
            if (!versionDetails) {
                throw new Error(`Szczegóły wersji ${versionId} nie znalezione`);
            }

            const versionUrl = versionDetails.url;
            const versionDataResponse = await axios.get(versionUrl);
            const versionData = versionDataResponse.data;

            const versionDir = path.join(this.versionsDir, versionId);
            await fs.ensureDir(versionDir);

            // Pobierz client.jar
            const jarPath = path.join(versionDir, `${versionId}.jar`);
            if (!await fs.pathExists(jarPath)) {
                console.log(`Pobieranie ${versionId}.jar...`);
                const clientUrl = versionData.downloads.client.url;
                const clientResponse = await axios({
                    url: clientUrl,
                    method: 'GET',
                    responseType: 'stream',
                });

                const totalLength = parseInt(clientResponse.headers['content-length'], 10) || 0;
                let downloadedLength = 0;
                let lastUpdate = Date.now();

                clientResponse.data.on('data', (chunk) => {
                    downloadedLength += chunk.length;
                    const now = Date.now();
                    if (this.onProgress && now - lastUpdate >= 1000) {
                        const percent = totalLength ? Math.min(100, Math.round((downloadedLength / totalLength) * 100)) : 0;
                        const speed = ((chunk.length * 8 / 1024 / 1024) / ((now - lastUpdate) / 1000)).toFixed(2);
                        this.onProgress(1, 3, percent, downloadedLength / 1024 / 1024, totalLength / 1024 / 1024, speed);
                        lastUpdate = now;
                    }
                });

                const writer = fs.createWriteStream(jarPath);
                clientResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                console.log(`${versionId}.jar pobrany`);
            } else {
                console.log(`${versionId}.jar już istnieje, pomijam.`);
            }

            // Pobierz biblioteki
            let downloadedFiles = 0;
            let totalFiles = versionData.libraries.length;
            console.log(`Pobieranie ${totalFiles} bibliotek...`);

            for (const lib of versionData.libraries) {
                if (lib.downloads?.artifact) {
                    const libPath = path.join(this.librariesDir, lib.downloads.artifact.path);
                    await fs.ensureDir(path.dirname(libPath));

                    if (!await fs.pathExists(libPath)) {
                        console.log(`Pobieranie biblioteki: ${lib.downloads.artifact.path}`);
                        const libResponse = await axios({
                            url: lib.downloads.artifact.url,
                            method: 'GET',
                            responseType: 'stream',
                        });

                        const totalLength = parseInt(libResponse.headers['content-length'], 10) || 0;
                        let downloadedLength = 0;
                        let lastUpdate = Date.now();

                        libResponse.data.on('data', (chunk) => {
                            downloadedLength += chunk.length;
                            const now = Date.now();
                            if (this.onProgress && now - lastUpdate >= 1000) {
                                const percent = totalLength ? Math.min(100, Math.round((downloadedLength / totalLength) * 100)) : 0;
                                const speed = ((chunk.length * 8 / 1024 / 1024) / ((now - lastUpdate) / 1000)).toFixed(2);
                                this.onProgress(2, 3, percent, downloadedLength / 1024 / 1024, totalLength / 1024 / 1024, speed);
                                lastUpdate = now;
                            }
                        });

                        const libWriter = fs.createWriteStream(libPath);
                        libResponse.data.pipe(libWriter);

                        await new Promise((resolve, reject) => {
                            libWriter.on('finish', resolve);
                            libWriter.on('error', reject);
                        });
                        console.log(`Pobrano bibliotekę: ${lib.downloads.artifact.path}`);
                    } else {
                        console.log(`Biblioteka ${lib.downloads.artifact.path} już istnieje, pomijam.`);
                    }

                    downloadedFiles++;
                    if (this.onProgress) {
                        this.onProgress(2, 3, Math.min(100, Math.round((downloadedFiles / totalFiles) * 100)), downloadedFiles, totalFiles);
                    }
                }
            }

            // Pobierz assetsy
            console.log('Pobieranie assetów...');
            const assetIndex = versionData.assetIndex;
            const assetsResponse = await axios.get(assetIndex.url);
            const assets = assetsResponse.data.objects;

            let assetDownloadedFiles = 0;
            const assetKeys = Object.keys(assets);
            totalFiles += assetKeys.length;
            console.log(`Pobieranie ${assetKeys.length} assetów...`);

            for (const key of assetKeys) {
                const asset = assets[key];
                const assetPath = path.join(this.assetsDir, 'objects', asset.hash.substring(0, 2), asset.hash);
                await fs.ensureDir(path.dirname(assetPath));

                if (!await fs.pathExists(assetPath)) {
                    console.log(`Pobieranie assetu: ${key}`);
                    const assetUrl = `https://resources.download.minecraft.net/${asset.hash.substring(0, 2)}/${asset.hash}`;
                    const assetResponse = await axios({
                        url: assetUrl,
                        method: 'GET',
                        responseType: 'stream',
                    });

                    const totalLength = parseInt(assetResponse.headers['content-length'], 10) || 0;
                    let downloadedLength = 0;
                    let lastUpdate = Date.now();

                    assetResponse.data.on('data', (chunk) => {
                        downloadedLength += chunk.length;
                        const now = Date.now();
                        if (this.onProgress && now - lastUpdate >= 1000) {
                            const percent = totalLength ? Math.min(100, Math.round((downloadedLength / totalLength) * 100)) : 0;
                            const speed = ((chunk.length * 8 / 1024 / 1024) / ((now - lastUpdate) / 1000)).toFixed(2);
                            this.onProgress(3, 3, percent, downloadedLength / 1024 / 1024, totalLength / 1024 / 1024, speed);
                            lastUpdate = now;
                        }
                    });

                    const assetWriter = fs.createWriteStream(assetPath);
                    assetResponse.data.pipe(assetWriter);

                    await new Promise((resolve, reject) => {
                        assetWriter.on('finish', resolve);
                        assetWriter.on('error', reject);
                    });
                    console.log(`Pobrano asset: ${key}`);
                } else {
                    console.log(`Asset ${key} już istnieje, pomijam.`);
                }

                assetDownloadedFiles++;
                if (this.onProgress) {
                    this.onProgress(3, 3, Math.min(100, Math.round((assetDownloadedFiles / assetKeys.length) * 100)), assetDownloadedFiles, assetKeys.length);
                }
            }

            console.log(`Pobrano wszystkie pliki dla wersji ${versionId}`);
            return versionData;
        } catch (error) {
            console.error(`Błąd przy pobieraniu wersji ${versionId}:`, error.message);
            throw error;
        }
    }
}

module.exports = { VersionManager };