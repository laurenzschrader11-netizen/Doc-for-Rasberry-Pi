# Docker-Pi (BerryStack) 🍓🩺

Docker-Pi ist ein leichtgewichtiger Container-Manager für deinen Raspberry Pi, der so einfach zu bedienen ist wie ein Besuch beim Hausarzt.

## Installation auf dem Raspberry Pi

Folge diesen Schritten, um Docker-Pi auf deinem Pi zu installieren:

### 1. Voraussetzungen
Stelle sicher, dass **Node.js** (v18+) und **npm** auf deinem Raspberry Pi installiert sind.
Du kannst dies prüfen mit:
```bash
node -v
npm -v
```

### 2. Code herunterladen
Lade den Code dieses Projekts auf deinen Pi (z.B. per Git Clone oder als ZIP).

### 3. Abhängigkeiten installieren
Navigiere in den Projektordner und installiere die benötigten Pakete:
```bash
npm install
```

### 4. Anwendung starten
Du kannst die App im Entwicklungsmodus oder für den produktiven Einsatz starten:

**Entwicklungsmodus:**
```bash
npm run dev
```

**Produktionsmodus:**
```bash
npm run build
npm start
```

### 5. Zugriff über den Browser
Sobald die App läuft, kannst du von jedem Computer in deinem Netzwerk darauf zugreifen. Öffne einfach deinen Browser und gib die IP-Adresse deines Raspberry Pi gefolgt von Port `3000` ein:

`http://<deine-pi-ip>:3000`

## Funktionen

- **Desktop-Dashboard**: Behalte CPU und RAM im Blick.
- **Container-Management**: Erstelle Container aus Code, Dateien oder direkt von GitHub.
- **App Store**: Installiere beliebte Apps wie Jellyfin oder Minecraft mit einem Klick.
- **System-Diagnose**: Überprüfe den Gesundheitszustand deines Pi.

---
*Hinweis: Docker-Pi ist ein "BerryStack" Projekt und darauf optimiert, Ressourcen zu sparen.*
