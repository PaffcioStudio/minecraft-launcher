const fs = require('fs').promises;
const path = require('path');

async function findJavaExecutable(javaDir) {
    console.log('Szukam java.exe w folderze:', javaDir);
    try {
        const files = await fs.readdir(javaDir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(javaDir, file.name);
            if (file.isDirectory()) {
                const result = await findJavaExecutable(fullPath);
                if (result) return result;
            } else if (file.name === 'java.exe') {
                console.log('Znaleziono java.exe:', fullPath);
                return fullPath;
            }
        }
    } catch (err) {
        console.error('Błąd przy szukaniu Javy:', err.message);
    }
    return null;
}

async function getJavaPath() {
    const javaDir = path.join(__dirname, '..', '..', 'java');
    const javaExe = await findJavaExecutable(javaDir);
    if (!javaExe) {
        throw new Error('Nie znaleziono java.exe w folderze java!');
    }
    return javaExe;
}

module.exports = { getJavaPath };