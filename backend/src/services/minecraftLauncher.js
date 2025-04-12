const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

async function launchMinecraft(javaPath, instance, versionDetails) {
    console.log(`Uruchamiam Minecraft z Javy: ${javaPath}`);
    console.log(`Instancja:`, instance);
    console.log(`Wersja:`, versionDetails.id);

    const instanceDir = path.join(os.homedir(), '.minecraft-launcher', ' instances', instance.name);
    const nativesDir = path.join(instanceDir, 'natives');
    const assetsDir = path.join(os.homedir(), '.minecraft-launcher', 'assets');
    const librariesDir = path.join(os.homedir(), '.minecraft-launcher', 'libraries');

    const classpath = [
        ...versionDetails.libraries
            .filter(lib => lib.downloads && lib.downloads.artifact)
            .map(lib => path.join(librariesDir, lib.downloads.artifact.path)),
        path.join(os.homedir(), '.minecraft-launcher', 'versions', versionDetails.id, `${versionDetails.id}.jar`)
    ].join(';');

    const args = [
        `-Xmx${instance.ram}M`,
        `-Djava.library.path=${nativesDir}`,
        '-cp', classpath,
        versionDetails.mainClass,
        `--username`, instance.account || 'default',
        `--version`, versionDetails.id,
        `--gameDir`, instanceDir,
        `--assetsDir`, assetsDir,
        `--assetIndex`, versionDetails.assets,
        `--accessToken`, '0',
        `--userType`, 'mojang'
    ];

    console.log('Argumenty do Javy:', args);

    return new Promise((resolve, reject) => {
        const process = spawn(javaPath, args, { cwd: instanceDir });

        process.stdout.on('data', data => {
            console.log(`Minecraft stdout: ${data}`);
        });

        process.stderr.on('data', data => {
            console.error(`Minecraft stderr: ${data}`);
        });

        process.on('close', code => {
            if (code === 0) {
                console.log('Minecraft uruchomiony poprawnie');
                resolve();
            } else {
                console.error(`Minecraft zakończony z kodem: ${code}`);
                reject(new Error(`Minecraft zakończony z kodem: ${code}`));
            }
        });

        process.on('error', error => {
            console.error('Błąd uruchamiania Minecrafta:', error.message);
            reject(error);
        });
    });
}

module.exports = { launchMinecraft };