# Deployment auf Shared Hosting (PHP)

## Voraussetzungen

- Webhosting-Paket mit PHP ≥ 8.1 und SQLite3
- FTP-Zugangsdaten (aus dem Kundencenter)
- `mod_rewrite` aktiviert (s. Schritt 1)

---

## Schritt 1 — mod_rewrite im Kundencenter aktivieren

1. Im Kundencenter des Hosting-Providers einloggen
2. **Meine Tarife → Tarifname → Experten-Einstellungen → Servereinstellungen**
3. `mod_rewrite` auf **On** setzen und speichern
4. Kurz deaktivieren, erneut speichern, dann wieder aktivieren und speichern
5. **~8 Minuten warten**, bis die Einstellung aktiv ist

---

## Schritt 2 — Frontend bauen

```bash
cd frontend
npm run build
```

Ergebnis: `frontend/dist/` mit allen statischen Dateien.

---

## Schritt 3 — CORS in der API anpassen

In [api/index.php](api/index.php) Zeile 6 die Domain eintragen:

```php
$allowedOrigin = getenv('ALLOWED_ORIGIN') ?: 'https://deine-domain.de';
```

Da Frontend und API auf derselben Domain laufen, kann der Wert auf die eigene Domain gesetzt werden.

---

## Schritt 4 — `.htaccess` erstellen

Neue Datei `.htaccess` im Projektroot erstellen (landet später in `html/`):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(?!api/).*$ /index.html [L]
</IfModule>
```

Diese Regel leitet alle Nicht-API-Requests an `index.html` weiter (React Router), lässt `/api/...` aber durch.

---

## Schritt 5 — Dateien per FTP hochladen

Der Webroot beim Hosting-Provider ist das Verzeichnis `html/`.

Folgende Struktur auf dem Server anlegen:

```
html/
├── .htaccess                ← neu erstellt (Schritt 4)
├── index.html               ← aus frontend/dist/
├── assets/                  ← aus frontend/dist/assets/
├── sw.js                    ← aus frontend/dist/
├── manifest.webmanifest     ← aus frontend/dist/
└── api/
    ├── index.php            ← api/index.php
    ├── data/                ← leer, muss schreibbar sein
    └── src/
        ├── init_db.php
        └── setup_admin.php
```

**FTP-Upload:**
1. Inhalt von `frontend/dist/` → `html/`
2. `.htaccess` → `html/`
3. `api/index.php` → `html/api/index.php`
4. `api/src/` → `html/api/src/`
5. Ordner `html/api/data/` anlegen (leer lassen)

---

## Schritt 6 — Datei- und Ordnerrechte setzen

Im FTP-Client oder Dateimanager des Hosters:

| Pfad | Rechte |
|------|--------|
| `html/api/data/` | `755` |
| `html/api/data/database.sqlite` (nach Init) | `644` |
| `html/.htaccess` | `644` |

---

## Schritt 7 — Datenbank initialisieren

Einmalig im Browser aufrufen:

```
https://deine-domain.de/api/src/init_db.php
https://deine-domain.de/api/src/setup_admin.php
```

`setup_admin.php` setzt das Standard-Passwort `admin123`.

**Danach sofort das Passwort unter Einstellungen ändern!**

Anschließend beide Dateien per FTP löschen oder mit `.htaccess` sperren:

```apache
<Files "setup_admin.php">
  Order Allow,Deny
  Deny from all
</Files>
```

---

## Schritt 8 — App aufrufen und testen

```
https://deine-domain.de          → Login
https://deine-domain.de?gast     → Gast-Ansicht (kein Login)
```

---

## Troubleshooting

| Problem | Lösung |
|--------|--------|
| Weiße Seite / 404 nach Reload | mod_rewrite nicht aktiv oder `.htaccess` fehlt |
| API antwortet nicht | Prüfen ob `html/api/index.php` vorhanden und PHP aktiv |
| SQLite-Fehler | `html/api/data/` Rechte auf `755` setzen |
| Login schlägt fehl | `setup_admin.php` nochmals aufrufen |
| PWA wird nicht installiert | HTTPS muss aktiv sein (SSL im Kundencenter aktivieren) |

---

## SSL / HTTPS aktivieren

Im Kundencenter des Hosters unter **Domains → SSL-Zertifikat** ein kostenloses Let's-Encrypt-Zertifikat aktivieren. Die PWA-Funktionalität (installierbare App, Service Worker) erfordert zwingend HTTPS.
