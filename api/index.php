<?php
session_start();

header('Content-Type: application/json; charset=UTF-8');

// CORS: In Produktion erlaubte Origin konfigurieren
$allowedOrigin = getenv('ALLOWED_ORIGIN') ?: 'http://localhost:5173';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $allowedOrigin) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$dbFile = __DIR__ . '/data/database.sqlite';
$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA foreign_keys = ON');

$requestUri = $_SERVER['REQUEST_URI'];
$method     = $_SERVER['REQUEST_METHOD'];
$path       = parse_url($requestUri, PHP_URL_PATH);
$pathParts  = explode('/', trim($path, '/'));
$resource   = $pathParts[count($pathParts) - 1] ?? '';
$parent     = $pathParts[count($pathParts) - 2] ?? '';

// Auth-Endpoints brauchen keinen Token
if ($resource === 'auth') {
    handleAuth($method);
    exit;
}
if ($parent === 'auth') {
    if ($resource === 'verify') handleAuthVerify();
    elseif ($resource === 'password') handlePasswordChange($method);
    exit;
}

// Alle anderen Endpoints: Token prüfen
requireAuth();

// Ressource mit ID (z.B. /api/produkte/5)
if (is_numeric($resource) && $parent === 'produkte') {
    handleProduktById($method, (int)$resource);
    exit;
}

switch ($resource) {
    case 'produkte':
        handleProdukte($method);
        break;
    case 'chargen':
        handleChargen($method);
        break;
    case 'inventur':
        handleInventur($method);
        break;
    case 'nachschub':
        handleNachschub($method);
        break;
    case 'logbuch':
        handleLogbuch($method);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Resource not found']);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function requireAuth(): void
{
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (str_starts_with($authHeader, 'Bearer ')) {
        $token = substr($authHeader, 7);
    }
    if (empty($token) || !isset($_SESSION['token']) || !hash_equals($_SESSION['token'], $token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht autorisiert']);
        exit;
    }
}

function handleAuth(string $method): void
{
    global $pdo;
    if ($method !== 'POST') {
        http_response_code(405);
        return;
    }
    $data     = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT value FROM einstellungen WHERE key = 'admin_password'");
    $stmt->execute();
    $row = $stmt->fetch();

    if ($row && password_verify($password, $row['value'])) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['token'] = $token;
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Ungültiges Passwort']);
    }
}

function handleAuthVerify(): void
{
    requireAuth();
    echo json_encode(['valid' => true]);
}

// ── Ressourcen ────────────────────────────────────────────────────────────────

function handleProdukte(string $method): void
{
    global $pdo;
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT id, name, meldebestand_kaesten FROM produkte ORDER BY name');
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $meldebestand = max(0, (int)($data['meldebestand_kaesten'] ?? 5));

        if ($name === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Name erforderlich']);
            return;
        }
        $stmt = $pdo->prepare('INSERT INTO produkte (name, meldebestand_kaesten) VALUES (?, ?)');
        $stmt->execute([$name, $meldebestand]);
        echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId()]);
    }
}

function handleProduktById(string $method, int $id): void
{
    global $pdo;
    if ($method === 'DELETE') {
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM nachschub_anfragen WHERE produkt_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM logbuch WHERE produkt_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM produkte WHERE id = ?')->execute([$id]);
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Datenbankfehler']);
        }
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $meldebestand = max(0, (int)($data['meldebestand_kaesten'] ?? 0));
        $pdo->prepare('UPDATE produkte SET meldebestand_kaesten = ? WHERE id = ?')->execute([$meldebestand, $id]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

function handlePasswordChange(string $method): void
{
    global $pdo;
    if ($method !== 'PUT') {
        http_response_code(405);
        return;
    }
    requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    $oldPassword = $data['old_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['error' => 'Neues Passwort erforderlich']);
        return;
    }

    $stmt = $pdo->prepare("SELECT value FROM einstellungen WHERE key = 'admin_password'");
    $stmt->execute();
    $row = $stmt->fetch();

    if (!$row || !password_verify($oldPassword, $row['value'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Aktuelles Passwort falsch']);
        return;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE einstellungen SET value = ? WHERE key = 'admin_password'")->execute([$hash]);
    echo json_encode(['success' => true]);
}

function handleChargen(string $method): void
{
    global $pdo;
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM chargen');
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method === 'POST') {
        $data        = json_decode(file_get_contents('php://input'), true);
        $produktId   = (int)($data['produkt_id'] ?? 0);
        $anzahl      = max(1, (int)($data['kaesten_anzahl'] ?? 1));
        $mhdMonat    = (int)($data['mhd_monat'] ?? 1);
        $mhdJahr     = (int)($data['mhd_jahr'] ?? date('Y'));

        if ($produktId === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'produkt_id erforderlich']);
            return;
        }
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO chargen (produkt_id, kaesten_anzahl, mhd_monat, mhd_jahr) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$produktId, $anzahl, $mhdMonat, $mhdJahr]);
            $newId = (int)$pdo->lastInsertId();

            $log = $pdo->prepare(
                "INSERT INTO logbuch (produkt_id, differenz, grund, benutzerrolle) VALUES (?, ?, 'Neue Charge', 'Admin')"
            );
            $log->execute([$produktId, $anzahl]);

            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Datenbankfehler']);
        }
    }
}

function handleInventur(string $method): void
{
    global $pdo;
    if ($method !== 'POST') return;

    $data      = json_decode(file_get_contents('php://input'), true);
    $chargeId  = (int)($data['charge_id'] ?? 0);
    $produktId = (int)($data['produkt_id'] ?? 0);
    $differenz = (int)($data['differenz'] ?? 0);
    $grund     = trim($data['grund'] ?? 'Korrektur');
    $rolle     = trim($data['benutzerrolle'] ?? 'Admin');

    if ($chargeId === 0 || $differenz === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'charge_id und differenz erforderlich']);
        return;
    }

    $pdo->beginTransaction();
    try {
        // Prüfen ob Bestand ins Negative gehen würde
        $check = $pdo->prepare('SELECT kaesten_anzahl FROM chargen WHERE id = ?');
        $check->execute([$chargeId]);
        $row = $check->fetch();
        if (!$row) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Charge nicht gefunden']);
            return;
        }
        if ($row['kaesten_anzahl'] + $differenz < 0) {
            $pdo->rollBack();
            http_response_code(422);
            echo json_encode(['error' => 'Bestand kann nicht negativ werden']);
            return;
        }

        $stmt = $pdo->prepare('UPDATE chargen SET kaesten_anzahl = kaesten_anzahl + ? WHERE id = ?');
        $stmt->execute([$differenz, $chargeId]);

        $log = $pdo->prepare(
            'INSERT INTO logbuch (produkt_id, differenz, grund, benutzerrolle) VALUES (?, ?, ?, ?)'
        );
        $log->execute([$produktId, $differenz, $grund, $rolle]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Datenbankfehler']);
    }
}

function handleLogbuch(string $method): void
{
    global $pdo;
    if ($method !== 'GET') { http_response_code(405); return; }
    $stmt = $pdo->query(
        "SELECT l.id, l.zeitstempel, l.differenz, l.grund, l.benutzerrolle, p.name AS produkt_name
         FROM logbuch l
         LEFT JOIN produkte p ON l.produkt_id = p.id
         ORDER BY l.zeitstempel DESC
         LIMIT 200"
    );
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handleNachschub(string $method): void
{
    global $pdo;
    if ($method === 'POST') {
        $data      = json_decode(file_get_contents('php://input'), true);
        $produktId = (int)($data['produkt_id'] ?? 0);
        if ($produktId === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'produkt_id erforderlich']);
            return;
        }
        // Keine Duplikate: prüfen ob bereits offene Anfrage existiert
        $check = $pdo->prepare(
            "SELECT id FROM nachschub_anfragen WHERE produkt_id = ? AND status = 'offen'"
        );
        $check->execute([$produktId]);
        if ($check->fetch()) {
            echo json_encode(['success' => true, 'duplicate' => true]);
            return;
        }
        $stmt = $pdo->prepare('INSERT INTO nachschub_anfragen (produkt_id) VALUES (?)');
        $stmt->execute([$produktId]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT n.*, p.name FROM nachschub_anfragen n
             JOIN produkte p ON n.produkt_id = p.id
             WHERE n.status = 'offen'
             ORDER BY n.zeitstempel DESC"
        );
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
