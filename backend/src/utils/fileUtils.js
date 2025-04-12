const fs = require('fs-extra');
const path = require('path');

const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Błąd przy wczytywaniu pliku JSON: ${filePath}:`, error);
        return null;
    }
};

const writeJsonFile = (filePath, data) => {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
    } catch (error) {
        console.error(`Błąd przy zapisywaniu pliku JSON: ${filePath}:`, error);
    }
};

const directoryExists = (dirPath) => {
    return fs.existsSync(dirPath);
};

const createDirectory = (dirPath) => {
    if (!directoryExists(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const deleteFile = (filePath) => {
    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error(`Błąd przy usuwaniu pliku: ${filePath}:`, error);
    }
};

const getAbsolutePath = (relativePath) => {
    return path.resolve(__dirname, relativePath);
};

module.exports = {
    readJsonFile,
    writeJsonFile,
    directoryExists,
    createDirectory,
    deleteFile,
    getAbsolutePath,
};