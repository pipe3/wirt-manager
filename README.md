# Wirt Manager

Getränkeinventur-App für Bars und Gastronomiebetriebe. Verwaltet Produkte, Chargen mit MHD, Lagerbestände und Nachschub-Anfragen. Lauffähig als PWA (installierbar auf Mobilgeräten), mit Offline-Sync-Queue.

## Features

- **Admin-Dashboard** – Produktübersicht mit Bestandsampel (grün/gelb/rot nach MHD & Meldebestand)
- **Inventur** – Chargenbasierte Zu-/Abgänge mit Grundangabe
- **Einstellungen** – Produkte anlegen/löschen, Meldebestand anpassen, Admin-Passwort ändern
- **Gast-Ansicht** – Read-only-Sicht ohne Login (`?gast` URL-Parameter)
- **Nachschub-Anfragen** – Automatische Anfragen bei Unterschreitung des Meldebestands
- **Offline-first** – Inventurbuchungen werden bei fehlendem Netz in der Queue gepuffert und automatisch synchronisiert
- **PWA** – Installierbar als App auf Android/iOS

## Tech Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | React 19, React Router 7, Vite 8 |
| PWA | vite-plugin-pwa, Web App Manifest |
| Icons | lucide-react |
| Backend | PHP (kein Framework) |
| Datenbank | SQLite 3 via PDO |

## Voraussetzungen

- **Node.js** ≥ 18
- **PHP** ≥ 8.1 mit PDO SQLite-Erweiterung

## Lokaler Start

### 1. Datenbank initialisieren

```bash
php api/src/init_db.php
php api/src/setup_admin.php   # setzt Standard-Passwort: admin123
```

### 2. PHP-Backend starten

```bash
php -S localhost:8000 -t api/
```

### 3. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Die App ist unter **http://localhost:5173** erreichbar.  
API-Anfragen (`/api/*`) werden automatisch an `localhost:8000` weitergeleitet.

## Login

Standard-Zugangsdaten nach `setup_admin.php`:

| Rolle | Passwort |
|-------|----------|
| Admin | `admin123` |

Passwort kann nach dem Login unter **Einstellungen** geändert werden.

Gast-Ansicht: `http://localhost:5173?gast` (kein Login erforderlich)

## Projektstruktur

```
wirt-manager/
├── frontend/               # React + Vite App
│   ├── src/
│   │   ├── components/     # Dashboard, Inventur, Einstellungen, GastView, AdminLogin
│   │   ├── utils/sync.ts   # Offline-Queue-Logik
│   │   └── App.tsx         # Router & Auth-Gate
│   └── public/             # PWA-Icons, manifest.json
└── api/                    # PHP-Backend
    ├── index.php            # API-Router (Auth, Produkte, Chargen, Inventur, Nachschub)
    ├── src/
    │   ├── init_db.php      # Tabellen anlegen
    │   └── setup_admin.php  # Admin-Passwort setzen
    └── data/
        └── database.sqlite  # SQLite-Datenbank
```

## Datenmodell

- **produkte** – Produkt mit Name und Meldebestand
- **chargen** – Liefercharge je Produkt mit MHD (Monat/Jahr) und Kastenanzahl
- **logbuch** – Inventurprotokoll aller Bestandsänderungen
- **nachschub_anfragen** – Offene Nachschub-Anfragen
- **einstellungen** – Admin-Passwort (bcrypt)

## Produktion

```bash
cd frontend
npm run build   # erzeugt frontend/dist/
```

`frontend/dist/` über einen Webserver (Nginx/Apache) ausliefern, PHP-Backend separat hosten. API-Proxy im Webserver entsprechend konfigurieren.
