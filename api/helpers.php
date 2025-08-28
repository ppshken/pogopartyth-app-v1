<?php
// api/helpers.php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function cors(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: ' . (getenv('CORS_ORIGIN') ?: '*'));
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function jsonResponse(bool $success, $data = null, string $message = '', int $code = 200): void {
  http_response_code($code);
  echo json_encode([
    'success' => $success,
    'message' => $message,
    'data'    => $data,
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

function getJsonInput(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/** Simple HMAC token (ไม่ใช่ JWT มาตรฐาน แต่เบาและพอใช้ได้)
 * payload: user_id, exp (unix)
 */
function makeToken(int $userId, int $ttlSeconds = 86400): string {
  $secret = getenv('APP_KEY') ?: 'change_me';
  $payload = [
    'user_id' => $userId,
    'exp'     => time() + $ttlSeconds,
  ];
  $b64 = base64_encode(json_encode($payload));
  $sig = hash_hmac('sha256', $b64, $secret);
  return $b64 . '.' . $sig;
}

function verifyToken(?string $token): ?array {
  if (!$token) return null;
  $secret = getenv('APP_KEY') ?: 'change_me';
  $parts = explode('.', $token);
  if (count($parts) !== 2) return null;
  [$b64, $sig] = $parts;
  $calc = hash_hmac('sha256', $b64, $secret);
  if (!hash_equals($calc, $sig)) return null;
  $payload = json_decode(base64_decode($b64), true);
  if (!is_array($payload) || empty($payload['user_id']) || empty($payload['exp'])) return null;
  if ($payload['exp'] < time()) return null;
  return $payload;
}

function readAuthHeader(): ?string {
  // 1) มาตรฐาน
  $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? null;

  // 2) บางเซิร์ฟเวอร์จะวิ่งมาเป็นตัวนี้
  if (!$hdr && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $hdr = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
  }

  // 3) Apache specific
  if (!$hdr && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    foreach ($headers as $k => $v) {
      if (strcasecmp($k, 'Authorization') === 0) {
        $hdr = $v; break;
      }
    }
  }

  return $hdr ? trim($hdr) : null;
}

function authGuard(): int {
  $hdr = readAuthHeader();
  $token = null;

  if ($hdr && stripos($hdr, 'Bearer ') === 0) {
    $token = trim(substr($hdr, 7));
  }

  // Fallback เพื่อดีบัก (อย่าลืมเอาออกภายหลังเมื่อขึ้นโปรดักชัน)
  if (!$token && !empty($_GET['token'])) {
    $token = trim($_GET['token']);
  }

  $payload = verifyToken($token);
  if (!$payload) {
    jsonResponse(false, null, 'Unauthorized', 401);
  }
  return (int)$payload['user_id'];
}

function paginateParams(): array {
  $page = max(1, (int)($_GET['page'] ?? 1));
  $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
  $offset = ($page - 1) * $limit;
  return [$page, $limit, $offset];
}

function now(): string {
  return date('Y-m-d H:i:s');
}
