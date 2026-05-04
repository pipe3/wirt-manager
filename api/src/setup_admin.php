<?php
$dbFile = __DIR__ . '/../data/database.sqlite';
$pdo = new PDO('sqlite:' . $dbFile);

$password = 'admin123';
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT OR REPLACE INTO einstellungen (key, value) VALUES ('admin_password', ?)");
$stmt->execute([$hash]);

echo "Admin-Passwort wurde auf '$password' gesetzt. Bitte nach dem ersten Login ändern.\n";
