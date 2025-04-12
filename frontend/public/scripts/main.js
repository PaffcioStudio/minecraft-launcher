// Obsługa nawigacji i UI
document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000';

    // Elementy DOM
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.sidebar a');
    const addAccountButton = document.getElementById('add-account');
    const accountModal = document.getElementById('account-modal');
    const saveAccountButton = document.getElementById('save-account');
    const closeAccountModal = accountModal.querySelector('.close-button');
    const accountUsernameInput = document.getElementById('account-username');
    const offlineAccountCheckbox = document.getElementById('offline-account');
    const accountList = document.getElementById('account-list');
    const addInstanceButton = document.getElementById('add-instance-button');
    const instanceModal = document.getElementById('instance-modal');
    const saveInstanceButton = document.getElementById('save-instance');
    const closeInstanceModal = instanceModal.querySelector('.close-button');
    const instanceNameInput = document.getElementById('instance-name');
    const instanceVersionSelect = document.getElementById('instance-version');
    const instanceList = document.getElementById('instance-list');
    const versionList = document.getElementById('version-list');
    const refreshVersionsButton = document.getElementById('refresh-versions');
    const javaVersionSelect = document.getElementById('java-version');
    const downloadJavaButton = document.getElementById('download-java');
    const ramInput = document.getElementById('ram-amount');
    const ramValue = document.getElementById('ram-value');
    const saveSettingsButton = document.getElementById('save-settings');
    const progressPanel = document.getElementById('progress-panel');
    const progressText = document.getElementById('progress-text');
    const progressFiles = document.getElementById('progress-files');
    const progressBar = document.getElementById('progress-bar');

    let isDownloading = false; // Stan pobierania

    // Nawigacja
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (window.innerWidth <= 768) sidebar.classList.remove('active');
        });
    });

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Modale
    const openModal = (modal) => {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Funkcje progresu
    const showProgress = (step, totalSteps, message, percent, downloadedMB, totalMB, speed) => {
        progressPanel.classList.remove('hidden');
        progressText.textContent = `${step}/${totalSteps} ${message} (${percent}%)`;
        if (downloadedMB !== undefined && totalMB !== undefined) {
            progressFiles.textContent = `${downloadedMB.toFixed(2)} MB / ${totalMB.toFixed(2)} MB (${speed ? speed + ' Mb/s' : '??? Mb/s'})`;
        } else if (downloadedMB !== undefined) {
            progressFiles.textContent = `${downloadedMB.toFixed(2)} MB / ??? MB (${speed ? speed + ' Mb/s' : '??? Mb/s'})`;
        } else {
            progressFiles.textContent = '';
        }
        progressBar.value = percent;
    };

    const hideProgress = () => {
        progressPanel.classList.add('hidden');
        progressText.textContent = '';
        progressFiles.textContent = '';
        progressBar.value = 0;
        isDownloading = false;
        saveSettingsButton.disabled = false;
        saveSettingsButton.textContent = 'Zapisz';
    };

    // Konta
    const fetchAccounts = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/accounts`);
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            const accounts = await response.json();
            accountList.innerHTML = '';
            accounts.forEach(account => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${account.username} (${account.type || 'online'})
                    <button class="switch-account">Przełącz</button>
                    <button class="delete-account">Usuń</button>
                `;
                li.querySelector('.switch-account').addEventListener('click', () => switchAccount(account.username));
                li.querySelector('.delete-account').addEventListener('click', () => deleteAccount(account.username));
                accountList.appendChild(li);
            });
        } catch (error) {
            console.error('Nie udało się pobrać kont:', error);
            alert('Błąd przy ładowaniu kont. Sprawdź, czy serwer działa!');
        }
    };

    const addAccount = async () => {
        const username = accountUsernameInput.value.trim();
        const isOffline = offlineAccountCheckbox.checked;
        if (!username) return alert('Nazwa użytkownika wymagana!');
        try {
            const response = await fetch(`${BASE_URL}/api/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, type: isOffline ? 'offline' : 'online' }),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            closeModal(accountModal);
            accountUsernameInput.value = '';
            offlineAccountCheckbox.checked = false;
            fetchAccounts();
        } catch (error) {
            console.error('Błąd przy dodawaniu konta:', error);
            alert('Nie udało się dodać konta. Sprawdź serwer!');
        }
    };

    const switchAccount = async (username) => {
        try {
            const response = await fetch(`${BASE_URL}/api/accounts/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            alert(`Przełączono na konto: ${username}`);
            fetchAccounts();
        } catch (error) {
            console.error('Błąd przy przełączaniu konta:', error);
            alert('Nie udało się przełączyć konta. Sprawdź serwer!');
        }
    };

    const deleteAccount = async (username) => {
        try {
            const response = await fetch(`${BASE_URL}/api/accounts`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            fetchAccounts();
        } catch (error) {
            console.error('Błąd przy usuwaniu konta:', error);
            alert('Nie udało się usunąć konta. Sprawdź serwer!');
        }
    };

    // Instancje
    const fetchInstances = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/instances`);
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            const instances = await response.json();
            instanceList.innerHTML = '';
            instances.forEach(instance => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${instance.name} (v${instance.version}, ${instance.ram}MB)
                    <button class="launch-instance">Uruchom</button>
                    <button class="edit-instance">Edytuj</button>
                    <button class="delete-instance">Usuń</button>
                `;
                const launchButton = li.querySelector('.launch-instance');
                const editButton = li.querySelector('.edit-instance');
                const deleteButton = li.querySelector('.delete-instance');
                launchButton.addEventListener('click', () => launchInstance(instance.name, launchButton, editButton, deleteButton));
                editButton.addEventListener('click', () => editInstance(instance));
                deleteButton.addEventListener('click', () => deleteInstance(instance.name));
                instanceList.appendChild(li);
            });
        } catch (error) {
            console.error('Nie udało się pobrać instancji:', error);
            alert('Błąd przy ładowaniu instancji. Sprawdź serwer!');
        }
    };

    const launchInstance = async (instanceName, launchButton, editButton, deleteButton) => {
        launchButton.disabled = true;
        editButton.disabled = true;
        deleteButton.disabled = true;
        launchButton.classList.add('loading');
        launchButton.textContent = 'Uruchamianie';
        isDownloading = true;
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Zapis niedostępny';
        showProgress(1, 3, 'Pobieranie Javy', 0);

        let eventSource;

        try {
            eventSource = new EventSource(`${BASE_URL}/api/minecraft/launch/${instanceName}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'progress') {
                    showProgress(
                        data.step,
                        data.totalSteps,
                        data.message,
                        data.percent,
                        data.bytesDownloaded ? data.bytesDownloaded / 1024 / 1024 : undefined,
                        data.bytesTotal ? data.bytesTotal / 1024 / 1024 : undefined,
                        data.speed
                    );
                } else if (data.type === 'complete') {
                    alert(`Uruchomiono instancję: ${instanceName}`);
                    eventSource.close();
                    launchButton.disabled = false;
                    editButton.disabled = false;
                    deleteButton.disabled = false;
                    launchButton.classList.remove('loading');
                    launchButton.textContent = 'Uruchom';
                    hideProgress();
                } else if (data.type === 'error') {
                    throw new Error(data.message);
                }
            };

            eventSource.onerror = (error) => {
                console.error('Błąd EventSource:', error);
                eventSource.close();
                throw new Error('Błąd połączenia z serwerem');
            };
        } catch (error) {
            console.error('Błąd przy uruchamianiu instancji:', error);
            alert(`Nie udało się uruchomić gry: ${error.message}`);
            if (eventSource) eventSource.close();
            launchButton.disabled = false;
            editButton.disabled = false;
            deleteButton.disabled = false;
            launchButton.classList.remove('loading');
            launchButton.textContent = 'Uruchom';
            hideProgress();
        }
    };

    const addInstance = async () => {
        const name = instanceNameInput.value.trim();
        const version = instanceVersionSelect.value;
        if (!name || !version) return alert('Nazwa i wersja wymagane!');
        try {
            const response = await fetch(`${BASE_URL}/api/instances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName: name, version, ram: parseInt(ramInput.value), account: accountUsernameInput.value || 'default' }),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            closeModal(instanceModal);
            instanceNameInput.value = '';
            fetchInstances();
        } catch (error) {
            console.error('Błąd przy dodawaniu instancji:', error);
            alert('Nie udało się dodać instancji. Sprawdź serwer!');
        }
    };

    const editInstance = async (instance) => {
        instanceNameInput.value = instance.name;
        instanceVersionSelect.value = instance.version;
        openModal(instanceModal);
        saveInstanceButton.onclick = async () => {
            const name = instanceNameInput.value.trim();
            const version = instanceVersionSelect.value;
            try {
                const response = await fetch(`${BASE_URL}/api/instances`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldName: instance.name, newDetails: { name, version, ram: instance.ram } }),
                });
                if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
                closeModal(instanceModal);
                fetchInstances();
            } catch (error) {
                console.error('Błąd przy edycji instancji:', error);
                alert('Nie udało się edytować instancji. Sprawdź serwer!');
            }
        };
    };

    const deleteInstance = async (name) => {
        try {
            const response = await fetch(`${BASE_URL}/api/instances`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName: name }),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            fetchInstances();
        } catch (error) {
            console.error('Błąd przy usuwaniu instancji:', error);
            alert('Nie udało się usunąć instancji. Sprawdź serwer!');
        }
    };

    // Wersje Minecraft
    const fetchVersions = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/minecraft/versions`);
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            const versions = await response.json();
            versionList.innerHTML = '';
            instanceVersionSelect.innerHTML = '';
            versions.forEach(version => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${version.id} (${version.type})
                    <span class="release-date">${new Date(version.releaseTime).toLocaleDateString('pl-PL')}</span>
                    <button class="download-version">Pobierz</button>
                `;
                li.querySelector('.download-version').addEventListener('click', () => downloadVersion(version.id));
                versionList.appendChild(li);

                const option = document.createElement('option');
                option.value = version.id;
                option.textContent = version.id;
                instanceVersionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Nie udało się pobrać wersji:', error);
            alert('Błąd przy ładowaniu wersji Minecraft. Sprawdź serwer!');
        }
    };

    const downloadVersion = async (versionId) => {
        progressBar.value = 0;
        isDownloading = true;
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Zapis niedostępny';
        try {
            const response = await fetch(`${BASE_URL}/api/versions/download/${versionId}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            progressBar.value = 100;
            alert(`Pobrano wersję ${versionId}`);
            fetchVersions();
            isDownloading = false;
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Zapisz';
        } catch (error) {
            console.error('Błąd przy pobieraniu wersji:', error);
            alert('Nie udało się pobrać wersji. Sprawdź serwer!');
            isDownloading = false;
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Zapisz';
        }
    };

    // Java
    const fetchJavaVersions = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/java/versions`);
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            const versions = await response.json();
            javaVersionSelect.innerHTML = '';
            versions.forEach(version => {
                const option = document.createElement('option');
                option.value = version;
                option.textContent = `Java ${version}`;
                javaVersionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Nie udało się pobrać wersji Javy:', error);
            alert('Błąd przy ładowaniu wersji Javy. Sprawdź serwer!');
        }
    };

    const downloadJava = async () => {
        const version = javaVersionSelect.value;
        if (!version) return alert('Wybierz wersję Javy!');
        progressBar.value = 0;
        isDownloading = true;
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Zapis niedostępny';
        try {
            const response = await fetch(`${BASE_URL}/api/java/download/${version}`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            progressBar.value = 100;
            alert(`Pobrano Javę ${version}`);
            isDownloading = false;
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Zapisz';
        } catch (error) {
            console.error('Błąd przy pobieraniu Javy:', error);
            alert('Nie udało się pobrać Javy. Sprawdź serwer!');
            isDownloading = false;
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Zapisz';
        }
    };

    // Ustawienia
    ramInput.addEventListener('input', () => {
        ramValue.textContent = `${ramInput.value} MB`;
    });

    const saveSettings = async () => {
        if (isDownloading) {
            alert('Nie można zapisać ustawień podczas pobierania!');
            return;
        }
        const config = {
            javaVersion: javaVersionSelect.value,
            ramAllocation: ramInput.value,
        };
        try {
            const response = await fetch(`${BASE_URL}/api/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            alert('Zapisano ustawienia!');
        } catch (error) {
            console.error('Błąd przy zapisywaniu ustawień:', error);
            alert('Nie udało się zapisać ustawień. Sprawdź serwer!');
        }
    };

    // Event Listeners
    addAccountButton.addEventListener('click', () => openModal(accountModal));
    closeAccountModal.addEventListener('click', () => closeModal(accountModal));
    saveAccountButton.addEventListener('click', addAccount);
    addInstanceButton.addEventListener('click', () => openModal(instanceModal));
    closeInstanceModal.addEventListener('click', () => closeModal(instanceModal));
    saveInstanceButton.addEventListener('click', addInstance);
    refreshVersionsButton.addEventListener('click', fetchVersions);
    downloadJavaButton.addEventListener('click', downloadJava);
    saveSettingsButton.addEventListener('click', saveSettings);

    // Init
    fetchAccounts();
    fetchInstances();
    fetchVersions();
    fetchJavaVersions();
});