# Deployment

Das Deployment läuft vollautomatisch per GitHub Actions bei jedem Push auf `main`.  
Alle sensiblen Werte werden ausschließlich über GitHub Secrets konfiguriert — keine Zugangsdaten im Repo.

---

## GitHub Secrets konfigurieren

Unter **GitHub → Repository → Settings → Secrets and variables → Actions** folgende Secrets anlegen:

| Secret | Beschreibung | Beispiel |
|--------|-------------|---------|
| `SSH_HOST` | Hostname des Servers | `ssh.example.com` |
| `SSH_USER` | SSH-Benutzername | `myuser` |
| `SSH_PORT` | SSH-Port | `22` |
| `SSH_PRIVATE_KEY` | Privater SSH-Key (ganzer Inhalt der Keyfile) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | Absoluter Zielpfad auf dem Server | `/html` |
| `ALLOWED_ORIGIN` | Domain der App (für CORS) | `https://example.com` |

---

## Was die Pipeline macht

Bei jedem Push auf `main`:

1. Frontend bauen (`npm ci && npm run build`)
2. `frontend/dist/` → Webroot auf dem Server (`--delete`, ohne `api/`)
3. `deployment/.htaccess` → Webroot (React Router Routing)
4. `api/` → `DEPLOY_PATH/api/` (`--delete`, ohne `data/` — Datenbank bleibt unangetastet)
5. `api/.htaccess` mit `SetEnv ALLOWED_ORIGIN ...` aus dem Secret generieren und deployen

---

## Voraussetzungen am Server

- PHP ≥ 8.1 mit SQLite3-Extension
- `mod_rewrite` aktiviert (Kundencenter → Experten-Einstellungen → Servereinstellungen)
- SSH-Zugang eingerichtet, Public Key des Deploy-Keys hinterlegt
- Ordner `DEPLOY_PATH/api/data/` muss existieren und schreibbar sein (`chmod 755`)

---

## Ersteinrichtung (einmalig nach erstem Deployment)

Nach dem allerersten Deployment die Datenbank initialisieren:

```
https://deine-domain.de/api/src/init_db.php
https://deine-domain.de/api/src/setup_admin.php
```

`setup_admin.php` setzt das Standard-Passwort `admin123` — danach sofort unter **Einstellungen** ändern.

Anschließend beide Dateien löschen oder in `deployment/.htaccess` sperren:

```apache
<Files "setup_admin.php">
  Order Allow,Deny
  Deny from all
</Files>
```

---

## Troubleshooting

| Problem | Lösung |
|--------|--------|
| Weiße Seite / 404 nach Reload | `mod_rewrite` nicht aktiv oder `.htaccess` fehlt |
| API antwortet nicht | PHP aktiv? `DEPLOY_PATH/api/index.php` vorhanden? |
| SQLite-Fehler | `api/data/` Rechte auf `755` setzen |
| CORS-Fehler | Secret `ALLOWED_ORIGIN` prüfen, Pipeline neu starten |
| PWA nicht installierbar | HTTPS muss aktiv sein (SSL im Kundencenter aktivieren) |
| Pipeline schlägt fehl | GitHub Actions Logs prüfen, Secrets vollständig? |
