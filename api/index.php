<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

$dbFile = __DIR__ . '/data/database.sqlite';
$pdo = new PDO('sqlite:' . $dbFile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

file_put_contents(__DIR__ . '/data/debug.log', "[" . date('Y-m-d H:i:s') . "] " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Routing Logik (Annahme: /api/index.php/produkte)
$resource = $pathParts[count($pathParts) - 1] ?? '';

switch ($resource) {
    case 'auth':
        handleAuth($method);
        break;
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
    default:
        http_response_code(404);
        echo json_encode(["error" => "Resource not found", "path" => $path]);
        break;
}

function handleAuth($method)
{
    global $pdo;
    if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $password = $data['password'] ?? '';
        $stmt = $pdo->prepare("SELECT value FROM einstellungen WHERE key = 'admin_password'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row && password_verify($password, $row['value'])) {
            echo json_encode(["success" => true, "token" => "admin_token_placeholder"]); // In Production: JWT
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Ungültiges Passwort"]);
        }
    }
}

function handleProdukte($method)
{
    global $pdo;
    if ($method == 'GET') {
        $stmt = $pdo->query("SELECT * FROM produkte");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO produkte (name, kategorie, meldebestand_kaesten) VALUES (?, ?, ?)");
        $stmt->execute([$data['name'], $data['kategorie'], $data['meldebestand_kaesten']]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    }
}

function handleChargen($method)
{
    global $pdo;
    if ($method == 'GET') {
        $stmt = $pdo->query("SELECT * FROM chargen");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO chargen (produkt_id, kaesten_anzahl, mhd_monat, mhd_jahr) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['produkt_id'], $data['kaesten_anzahl'], $data['mhd_monat'], $data['mhd_jahr']]);

        // Loggen
        $logStmt = $pdo->prepare("INSERT INTO logbuch (produkt_id, differenz, grund, benutzerrolle) VALUES (?, ?, 'Neue Charge', 'Admin')");
        $logStmt->execute([$data['produkt_id'], $data['kaesten_anzahl']]);

        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    }
}

function handleInventur($method)
{
    global $pdo;
    if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        // data: { produkt_id, charge_id, differenz, grund }

        // Bestand in Charge anpassen
        $stmt = $pdo->prepare("UPDATE chargen SET kaesten_anzahl = kaesten_anzahl + ? WHERE id = ?");
        $stmt->execute([$data['differenz'], $data['charge_id']]);

        // Logbuch
        $logStmt = $pdo->prepare("INSERT INTO logbuch (produkt_id, differenz, grund, benutzerrolle) VALUES (?, ?, ?, ?)");
        $logStmt->execute([$data['produkt_id'], $data['differenz'], $data['grund'], $data['benutzerrolle'] ?? 'Admin']);

        echo json_encode(["success" => true]);
    }
}

function handleNachschub($method)
{
    global $pdo;
    if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $stmt = $pdo->prepare("INSERT INTO nachschub_anfragen (produkt_id) VALUES (?)");
        $stmt->execute([$data['produkt_id']]);
        echo json_encode(["success" => true]);
    } elseif ($method == 'GET') {
        $stmt = $pdo->query("SELECT n.*, p.name FROM nachschub_anfragen n JOIN produkte p ON n.produkt_id = p.id WHERE n.status = 'offen'");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
