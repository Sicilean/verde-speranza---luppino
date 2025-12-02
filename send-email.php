<?php
/**
 * Script per l'invio email dal form di contatto Verde Speranza
 * Verifica reCAPTCHA v3 e invia email a info@verde-speranza.com
 * Usa SMTP autenticato per migliorare la deliverability
 */

// Carica le variabili d'ambiente dal file .env
function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        throw new Exception("File .env non trovato. Crea il file .env basandoti su .env.example");
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignora commenti
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parsing chiave=valore
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Rimuovi virgolette se presenti
            $value = trim($value, '"\'');
            // Imposta come variabile d'ambiente (non sovrascrive se già esiste)
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $value;
            }
        }
    }
}

// Carica .env
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    try {
        loadEnv($envPath);
    } catch (Exception $e) {
        error_log("Errore nel caricamento del file .env: " . $e->getMessage());
    }
}

// Configurazione reCAPTCHA
$SECRET_KEY = $_ENV['RECAPTCHA_SECRET_KEY'] ?? '6Lc68R4sAAAAAFaHqZXBJBKcDFSNhH9EZmJ_6doE';

// Configurazione email
$TO_EMAIL = $_ENV['TO_EMAIL'] ?? 'info@verde-speranza.com';
$FROM_EMAIL = $_ENV['FROM_EMAIL'] ?? 'info@verde-speranza.com';
$FROM_NAME = $_ENV['FROM_NAME'] ?? 'Verde Speranza';

// Configurazione SMTP Hostinger
$SMTP_HOST = $_ENV['SMTP_HOST'] ?? 'smtp.hostinger.com';
$SMTP_PORT = isset($_ENV['SMTP_PORT']) ? (int)$_ENV['SMTP_PORT'] : 465;
$SMTP_USER = $_ENV['SMTP_USER'] ?? 'info@verde-speranza.com';
$SMTP_PASS = $_ENV['SMTP_PASS'] ?? '';
$SMTP_SECURE = $_ENV['SMTP_SECURE'] ?? 'ssl';

// Verifica che le credenziali SMTP siano configurate
if (empty($SMTP_PASS)) {
    error_log("ERRORE: SMTP_PASS non configurato nel file .env");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Configurazione SMTP non completa. Contatta l\'amministratore del sito.'
    ]);
    exit;
}

// Headers per CORS e JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Gestisci solo richieste POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito']);
    exit;
}

// Leggi i dati JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validazione dati
if (!isset($data['nome']) || !isset($data['cognome']) || !isset($data['email']) || !isset($data['messaggio']) || !isset($data['recaptchaToken'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dati mancanti']);
    exit;
}

$nome = trim($data['nome']);
$cognome = trim($data['cognome']);
$email = trim($data['email']);
$telefono = isset($data['telefono']) ? trim($data['telefono']) : '';
$messaggio = trim($data['messaggio']);
$recaptchaToken = $data['recaptchaToken'];

// Validazione base
if (empty($nome) || empty($cognome) || empty($email) || empty($messaggio)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tutti i campi obbligatori devono essere compilati']);
    exit;
}

// Validazione email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Indirizzo email non valido']);
    exit;
}

// Verifica reCAPTCHA v3
$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$recaptchaData = [
    'secret' => $SECRET_KEY,
    'response' => $recaptchaToken,
    'remoteip' => $_SERVER['REMOTE_ADDR']
];

$recaptchaOptions = [
    'http' => [
        'header' => "Content-type: application/x-www-form-urlencoded\r\n",
        'method' => 'POST',
        'content' => http_build_query($recaptchaData)
    ]
];

$recaptchaContext = stream_context_create($recaptchaOptions);
$recaptchaResult = file_get_contents($recaptchaUrl, false, $recaptchaContext);
$recaptchaResponse = json_decode($recaptchaResult, true);

// Verifica risultato reCAPTCHA
if (!$recaptchaResponse) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Errore nella verifica reCAPTCHA. Riprova.']);
    exit;
}

if (!$recaptchaResponse['success']) {
    $errorCodes = isset($recaptchaResponse['error-codes']) ? implode(', ', $recaptchaResponse['error-codes']) : 'Errore sconosciuto';
    error_log("reCAPTCHA error: " . $errorCodes);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verifica reCAPTCHA fallita: ' . $errorCodes]);
    exit;
}

if (isset($recaptchaResponse['score']) && $recaptchaResponse['score'] < 0.5) {
    error_log("reCAPTCHA score troppo basso: " . $recaptchaResponse['score']);
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verifica reCAPTCHA fallita. Score troppo basso.']);
    exit;
}

// Prepara l'email
$subject = "Nuovo messaggio da {$nome} {$cognome} - Verde Speranza";
$nomeCompleto = "{$nome} {$cognome}";

// Versione testo semplice dell'email
$textBody = "Nuovo Messaggio dal Sito Verde Speranza\n\n";
$textBody .= "Nome: {$nomeCompleto}\n";
$textBody .= "Email: {$email}\n";
if (!empty($telefono)) {
    $textBody .= "Telefono: {$telefono}\n";
}
$textBody .= "\nMessaggio:\n" . strip_tags($messaggio) . "\n\n";
$textBody .= "---\n";
$textBody .= "Questo messaggio è stato inviato dal form di contatto del sito verde-speranza.com\n";

// Corpo email HTML
$htmlBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8bc540; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #5d852c; }
        .value { margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Nuovo Messaggio dal Sito Verde Speranza</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Nome:</div>
                <div class='value'>" . htmlspecialchars($nomeCompleto) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Email:</div>
                <div class='value'>" . htmlspecialchars($email) . "</div>
            </div>
            " . (!empty($telefono) ? "
            <div class='field'>
                <div class='label'>Telefono:</div>
                <div class='value'>" . htmlspecialchars($telefono) . "</div>
            </div>
            " : "") . "
            <div class='field'>
                <div class='label'>Messaggio:</div>
                <div class='value'>" . nl2br(htmlspecialchars($messaggio)) . "</div>
            </div>
        </div>
        <div class='footer'>
            <p>Questo messaggio è stato inviato dal form di contatto del sito verde-speranza.com</p>
        </div>
    </div>
</body>
</html>
";

// Usa SMTP nativo di PHP con autenticazione
if (!function_exists('stream_socket_client')) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Funzione SMTP non disponibile sul server.'
    ]);
    exit;
}

// Helper per leggere tutta la risposta SMTP (anche multi-linea tipo "250-...")
function smtp_get_response($smtp)
{
    $response = '';
    while ($line = fgets($smtp, 515)) {
        $response .= $line;
        // Le risposte multi-linea hanno il formato "XYZ-...", l'ultima è "XYZ ..."
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    return $response;
}

try {
    // Connessione
    if ($SMTP_SECURE === 'ssl') {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
                'allow_self_signed'=> true
            ]
        ]);
        $smtp = stream_socket_client(
            "ssl://{$SMTP_HOST}:{$SMTP_PORT}",
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            $context
        );
    } else {
        $smtp = fsockopen($SMTP_HOST, $SMTP_PORT, $errno, $errstr, 30);
    }

    if (!$smtp) {
        throw new Exception("Impossibile connettersi a SMTP: {$errstr} ({$errno})");
    }

    // Greeting iniziale (220 ...)
    $response = smtp_get_response($smtp);
    if (strpos($response, '220') !== 0) {
        throw new Exception("Risposta inattesa dal server SMTP (greeting): " . trim($response));
    }

    // EHLO
    fputs($smtp, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '250') !== 0) {
        throw new Exception("Risposta inattesa dal server SMTP (EHLO): " . trim($response));
    }

    // STARTTLS solo per TLS (porta 587)
    if ($SMTP_SECURE === 'tls') {
        fputs($smtp, "STARTTLS\r\n");
        $response = smtp_get_response($smtp);
        if (strpos($response, '220') !== 0) {
            throw new Exception("Errore STARTTLS: " . trim($response));
        }
        // Upgrade a TLS
        if (!stream_socket_enable_crypto($smtp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("Impossibile attivare la crittografia TLS");
        }
        // Nuovo EHLO dopo STARTTLS
        fputs($smtp, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n");
        $response = smtp_get_response($smtp);
        if (strpos($response, '250') !== 0) {
            throw new Exception("Risposta inattesa dal server SMTP (EHLO dopo STARTTLS): " . trim($response));
        }
    }

    // AUTH LOGIN
    fputs($smtp, "AUTH LOGIN\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '334') !== 0) {
        throw new Exception("Errore AUTH LOGIN (username): " . trim($response));
    }

    // Username
    fputs($smtp, base64_encode($SMTP_USER) . "\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '334') !== 0) {
        throw new Exception("Errore AUTH LOGIN (password): " . trim($response));
    }

    // Password
    fputs($smtp, base64_encode($SMTP_PASS) . "\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '235') !== 0) {
        throw new Exception("Autenticazione SMTP fallita. Risposta server: " . trim($response));
    }

    // MAIL FROM
    fputs($smtp, "MAIL FROM: <{$FROM_EMAIL}>\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '250') !== 0) {
        throw new Exception("Errore MAIL FROM: " . trim($response));
    }

    // RCPT TO
    fputs($smtp, "RCPT TO: <{$TO_EMAIL}>\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '250') !== 0 && strpos($response, '251') !== 0) {
        throw new Exception("Errore RCPT TO: " . trim($response));
    }

    // DATA
    fputs($smtp, "DATA\r\n");
    $response = smtp_get_response($smtp);
    if (strpos($response, '354') !== 0) {
        throw new Exception("Errore DATA: " . trim($response));
    }

    // Headers email
    $emailHeaders  = "From: {$FROM_NAME} <{$FROM_EMAIL}>\r\n";
    $emailHeaders .= "To: {$TO_EMAIL}\r\n";
    $emailHeaders .= "Reply-To: {$nomeCompleto} <{$email}>\r\n";
    $emailHeaders .= "Subject: {$subject}\r\n";
    $emailHeaders .= "MIME-Version: 1.0\r\n";
    $emailHeaders .= "Content-Type: multipart/alternative; boundary=\"boundary123\"\r\n";
    $emailHeaders .= "Date: " . date('r') . "\r\n";

    // Body completo
    $emailContent  = $emailHeaders . "\r\n";
    $emailContent .= "--boundary123\r\n";
    $emailContent .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $emailContent .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $emailContent .= $textBody . "\r\n";
    $emailContent .= "--boundary123\r\n";
    $emailContent .= "Content-Type: text/html; charset=UTF-8\r\n";
    $emailContent .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $emailContent .= $htmlBody . "\r\n";
    $emailContent .= "--boundary123--\r\n";
    $emailContent .= "\r\n.\r\n";

    fputs($smtp, $emailContent);
    $response = smtp_get_response($smtp);
    if (strpos($response, '250') !== 0) {
        throw new Exception("Errore invio email: " . trim($response));
    }

    // QUIT
    fputs($smtp, "QUIT\r\n");
    fclose($smtp);

    error_log("Email inviata con successo via SMTP da: {$email} a: {$TO_EMAIL}");
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Messaggio inviato con successo! Ti contatteremo presto.'
    ]);
    exit;

} catch (Exception $e) {
    error_log("Errore SMTP: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Errore SMTP: ' . $e->getMessage()
    ]);
    exit;
}