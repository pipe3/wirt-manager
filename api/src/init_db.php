<?php
$dbFile = __DIR__ . '/../data/database.sqlite';
$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = [
    "CREATE TABLE IF NOT EXISTS produkte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        meldebestand_kaesten INTEGER DEFAULT 5
    )",
    "CREATE TABLE IF NOT EXISTS chargen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produkt_id INTEGER NOT NULL,
        kaesten_anzahl INTEGER NOT NULL,
        mhd_monat INTEGER NOT NULL,
        mhd_jahr INTEGER NOT NULL,
        FOREIGN KEY (produkt_id) REFERENCES produkte(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS logbuch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP,
        produkt_id INTEGER NOT NULL,
        differenz INTEGER NOT NULL,
        grund TEXT,
        benutzerrolle TEXT,
        FOREIGN KEY (produkt_id) REFERENCES produkte(id)
    )",
    "CREATE TABLE IF NOT EXISTS nachschub_anfragen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produkt_id INTEGER NOT NULL,
        zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'offen',
        FOREIGN KEY (produkt_id) REFERENCES produkte(id)
    )",
    "CREATE TABLE IF NOT EXISTS einstellungen (
        key TEXT PRIMARY KEY,
        value TEXT
    )"
];

foreach ($tables as $sql) {
    $db->exec($sql);
}

echo "Datenbank erfolgreich initialisiert.\n";
