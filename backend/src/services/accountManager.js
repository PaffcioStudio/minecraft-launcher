const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class AccountManager {
    constructor() {
        this.accounts = [];
        this.defaultAccount = null;
        this.loadAccounts();
    }

    async loadAccounts() {
        try {
            const accountsPath = path.join(os.homedir(), '.minecraft-launcher', 'accounts.json');
            if (await fs.exists(accountsPath)) {
                const data = await fs.readJson(accountsPath);
                this.accounts = data.accounts || [];
                this.defaultAccount = data.default || null;
                console.log('Konta wczytane:', this.accounts);
            } else {
                console.log('Brak pliku kont, inicjalizuję pustą listę');
            }
        } catch (error) {
            console.error('Błąd wczytywania kont:', error.message);
            this.accounts = [];
            this.defaultAccount = null;
        }
    }

    async saveAccounts() {
        try {
            const accountsPath = path.join(os.homedir(), '.minecraft-launcher', 'accounts.json');
            await fs.ensureDir(path.dirname(accountsPath));
            await fs.writeJson(accountsPath, {
                accounts: this.accounts,
                default: this.defaultAccount
            }, { spaces: 2 });
            console.log('Konta zapisane:', this.accounts);
        } catch (error) {
            console.error('Błąd zapisu kont:', error.message);
            throw error;
        }
    }

    getAccounts() {
        console.log('Zwracam konta:', { accounts: this.accounts, default: this.defaultAccount });
        return { accounts: this.accounts, default: this.defaultAccount };
    }

    addAccount(account) {
        if (this.accounts.some(acc => acc.username === account.username)) {
            console.log(`Konto ${account.username} już istnieje`);
            return false;
        }
        this.accounts.push(account);
        if (this.accounts.length === 1) {
            this.defaultAccount = account.username;
        }
        console.log(`Dodano konto: ${account.username}`);
        return true;
    }

    addOfflineAccount(username) {
        return this.addAccount({ username, type: 'offline' });
    }

    switchAccount(username) {
        const account = this.accounts.find(acc => acc.username === username);
        if (account) {
            this.defaultAccount = username;
            console.log(`Przełączono na konto: ${username}`);
            return account;
        }
        console.log(`Konto ${username} nie znalezione`);
        return null;
    }

    removeAccount(username) {
        const index = this.accounts.findIndex(acc => acc.username === username);
        if (index !== -1) {
            this.accounts.splice(index, 1);
            if (this.defaultAccount === username) {
                this.defaultAccount = this.accounts.length > 0 ? this.accounts[0].username : null;
            }
            console.log(`Usunięto konto: ${username}`);
            return true;
        }
        console.log(`Konto ${username} nie znalezione`);
        return false;
    }

    setDefaultAccount(username) {
        if (this.accounts.some(acc => acc.username === username)) {
            this.defaultAccount = username;
            console.log(`Ustawiono domyślne konto: ${username}`);
            return true;
        }
        console.log(`Konto ${username} nie znalezione`);
        return false;
    }
}

module.exports = AccountManager;