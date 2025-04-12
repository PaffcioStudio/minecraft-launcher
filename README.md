# Minecraft Launcher

## Opis projektu
**Minecraft Launcher** to zaawansowana aplikacja do zarządzania instancjami gry Minecraft. Pozwala na wygodne pobieranie wersji gry i Javy, konfigurację środowiska, obsługę wielu kont oraz uruchamianie gry z poziomu nowoczesnego interfejsu opartego na **Electronie**, **Express.js** i technologii webowej.

## Funkcjonalności

### 🔧 Zarządzanie środowiskiem uruchomieniowym
- Automatyczne pobieranie i wypakowywanie wybranej wersji Javy z adoptium.net.
- Wybór wersji Javy w ustawieniach launchera.
- Możliwość przypisania ilości RAM do konkretnej instancji.

### 🎮 Instancje Minecraft
- Tworzenie wielu niezależnych instancji gry z osobnymi wersjami, kontami i ilością RAM.
- Edytowanie nazw, wersji i parametrów instancji.
- Usuwanie instancji.
- Uruchamianie gry z poziomu launchera (obsługa progresu przez SSE).

### 👤 Konta użytkowników
- Dodawanie kont offline (z nazwą użytkownika).
- Przełączanie pomiędzy aktywnymi kontami.
- Usuwanie kont z launchera.
- Przechowywanie konfiguracji kont lokalnie.

### 🌐 Wersje Minecraft
- Pobieranie dostępnych wersji z oficjalnego API Mojanga.
- Obsługa pełnego procesu pobierania JARów, bibliotek i assetów.
- Procentowy progres pobierania wersji i bibliotek.
- Wybór wersji podczas tworzenia nowej instancji.

### ⚙️ Ustawienia globalne
- Ustawienia przechowywane lokalnie w pliku JSON.
- Edycja domyślnej wersji Javy i ilości RAM.
- Automatyczny zapis zmian po kliknięciu „Zapisz”.

### 💻 Frontend
- Nowoczesny interfejs użytkownika z sidebarową nawigacją.
- Sekcje: Instancje, Konta, Wersje, Ustawienia.
- W pełni responsywny layout (RWD).
- Animacje, modale, dynamiczny progres uruchamiania i pobierania.

### 🖥️ Backend
- API REST na Express.js.
- Obsługa CORS, Helmet, body-parser.
- Serwowanie frontendowego buildu.
- SSE (Server-Sent Events) do komunikacji progresu uruchamiania.

### 📦 Inne:
- Obsługa instalacji przez `start.bat` (dla Windows).
- Skrypt `npm run dev` uruchamiający backend i Electron równolegle.
- Zarządzanie folderami: `java`, `versions`, `assets`, `libraries`, `data`.

## Struktura projektu
```
minecraft-launcher
├── backend            # API, logika instancji, kont, wersji
├── frontend           # Publiczny frontend z UI i JS
├── electron           # Pliki Electron + preload
├── shared             # Pliki konfiguracyjne
├── start.bat          # Skrót do uruchomienia
└── README.md
```

## Jak uruchomić projekt
1. **Backend**:  
   ```bash
   cd backend
   npm install
   node src/app.js
   ```

2. **Frontend**:  
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Electron**:  
   ```bash
   cd electron
   npm install
   npm start
   ```

Lub użyj `start.bat`, aby uruchomić wszystko razem (Windows).

## Wymagania
- Node.js (min. v14)
- NPM
- Połączenie z internetem (do pobierania wersji)
- System Windows (dla `java.exe` i ścieżek)

## Licencja
Projekt dostępny na licencji MIT.
