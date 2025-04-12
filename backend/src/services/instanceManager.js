const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class InstanceManager {
    constructor() {
        this.instances = [];
        this.loadInstances();
    }

    async loadInstances() {
        try {
            const instancesPath = path.join(os.homedir(), '.minecraft-launcher', 'instances.json');
            if (await fs.exists(instancesPath)) {
                const data = await fs.readJson(instancesPath);
                this.instances = Array.isArray(data) ? data : [];
                console.log('Wczytano instancje:', this.instances);
            } else {
                console.log('Brak pliku instancji, inicjalizuję pustą listę');
                this.instances = [];
            }
        } catch (error) {
            console.error('Błąd wczytywania instancji:', error.message);
            this.instances = [];
        }
    }

    async saveInstances() {
        try {
            const instancesPath = path.join(os.homedir(), '.minecraft-launcher', 'instances.json');
            await fs.ensureDir(path.dirname(instancesPath));
            await fs.writeJson(instancesPath, this.instances, { spaces: 2 });
            console.log('Zapisano instancje:', this.instances);
        } catch (error) {
            console.error('Błąd zapisu instancji:', error.message);
            throw error;
        }
    }

    listInstances() {
        console.log('Zwracam instancje:', this.instances);
        return this.instances;
    }

    createInstance(name, version, ram, account) {
        if (this.instances.some(i => i.name === name)) {
            console.log(`Instancja ${name} już istnieje`);
            throw new Error(`Instancja ${name} już istnieje`);
        }
        const instance = { name, version, ram, account, javaVersion: '17' };
        this.instances.push(instance);
        this.saveInstances();
        console.log(`Utworzono instancję: ${name}`);
        return instance;
    }

    editInstance(oldName, newDetails) {
        const instance = this.getInstance(oldName);
        if (!instance) throw new Error(`Instancja ${oldName} nie znaleziona`);
        Object.assign(instance, newDetails);
        this.saveInstances();
        console.log(`Zaktualizowano instancję: ${oldName}`);
        return instance;
    }

    deleteInstance(name) {
        const index = this.instances.findIndex(i => i.name === name);
        if (index === -1) throw new Error(`Instancja ${name} nie znaleziona`);
        this.instances.splice(index, 1);
        this.saveInstances();
        console.log(`Usunięto instancję: ${name}`);
    }

    getInstance(name) {
        const instance = this.instances.find(i => i.name === name);
        if (instance) {
            console.log(`Znaleziono instancję: ${name}`);
        } else {
            console.log(`Instancja ${name} nie znaleziona`);
        }
        return instance;
    }
}

module.exports = InstanceManager;