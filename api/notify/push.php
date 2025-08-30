<?php
// api/notify/push.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$callerId = authGuard();
$input = getJsonInput();

$title = trim((string)($input['title'] ?? ''));
$body  = trim((string)($input['body']  ?? ''));
$data  = is_array($input['data'] ?? null) ? $input['data'] : [];
$toUserIds = array_values(array_filter(array_map('intval', (array)($input['to_user_ids'] ?? []))));
$toRoomId  = isset($input['to_room_id']) ? (int)$input['to_room_id'] : 0;
$toTokens  = array_values(array_filter(array_map('strval', (array)($input['to_tokens'] ?? []))));
$excludeMe = array_key_exists('exclude_me', $input) ? (bool)$input['exclude_me'] : true;

if ($title === '' && $body === '') {
  jsonResponse(false, null, 'ต้องมีอย่างน้อย title หรือ body', 422);
}

// ---- utils ----
function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

function normalizeDataToString(array $arr): array {
  $out = [];
  foreach ($arr as $k => $v) {
    if (is_scalar($v) || $v === null) {
      $out[(string)$k] = (string)($v ?? '');
    } else {
      $out[(string)$k] = (string)json_encode($v, JSON_UNESCAPED_UNICODE);
    }
  }
  return $out;
}

function httpPostJson(string $url, $payload, array $headers = [], int $timeout = 15): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json', 'Accept: application/json'], $headers),
    CURLOPT_POSTFIELDS     => is_string($payload) ? $payload : json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT        => $timeout,
  ]);
  $res  = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['status' => $code, 'body' => $res, 'error' => $err];
}

/** ใช้ส่ง application/x-www-form-urlencoded (จำเป็นสำหรับ Google OAuth token) */
function httpPostForm(string $url, array $form, array $headers = [], int $timeout = 15): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/x-www-form-urlencoded'], $headers),
    CURLOPT_POSTFIELDS     => http_build_query($form, '', '&'),
    CURLOPT_TIMEOUT        => $timeout,
  ]);
  $res  = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['status' => $code, 'body' => $res, 'error' => $err];
}

// ---- รวบรวม token เป้าหมาย ----
$db = pdo();
$tokens = [];

// จาก user ids
if (!empty($toUserIds)) {
  $in = implode(',', array_fill(0, count($toUserIds), '?'));
  $stmt = $db->prepare("SELECT id, device_token FROM users WHERE id IN ($in)");
  $stmt->execute($toUserIds);
  while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if (!empty($r['device_token'])) {
      if (!$excludeMe || (int)$r['id'] !== $callerId) {
        $tokens[] = $r['device_token'];
      }
    }
  }
}

// จาก room id -> สมาชิกทั้งหมด (เฉพาะเจ้าของห้องเท่านั้น)
if ($toRoomId > 0) {
  $q = $db->prepare("SELECT owner_id FROM raid_rooms WHERE id = ?");
  $q->execute([$toRoomId]);
  $room = $q->fetch(PDO::FETCH_ASSOC);
  if (!$room) jsonResponse(false, null, 'ไม่พบห้อง', 404);
  if ((int)$room['owner_id'] !== $callerId) jsonResponse(false, null, 'ต้องเป็นเจ้าของห้องเท่านั้น', 403);

  $stmt = $db->prepare("
    SELECT u.id, u.device_token
    FROM user_raid_rooms ur
    JOIN users u ON u.id = ur.user_id
    WHERE ur.room_id = ?
  ");
  $stmt->execute([$toRoomId]);
  while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if (!empty($r['device_token'])) {
      if (!$excludeMe || (int)$r['id'] !== $callerId) {
        $tokens[] = $r['device_token'];
      }
    }
  }
}

// จาก tokens โดยตรง
foreach ($toTokens as $t) {
  if (is_string($t) && trim($t) !== '') $tokens[] = $t;
}

// กรองซ้ำ/ว่าง
$tokens = array_values(array_unique(array_filter($tokens, fn($t) => is_string($t) && trim($t) !== '')));
if (empty($tokens)) {
  jsonResponse(true, ['targets' => ['expo'=>0,'fcm'=>0], 'sent'=>['expo'=>0,'fcm'=>0], 'errors'=>[]], 'ไม่พบ device_token ปลายทาง', 200);
}

// แยก Expo vs FCM
$expoTokens = [];
$fcmTokens  = [];
foreach ($tokens as $tk) {
  if (str_starts_with($tk, 'ExponentPushToken')) $expoTokens[] = $tk;
  else $fcmTokens[] = $tk;
}

$mode = strtolower(getenv('PUSH_MODE') ?: 'auto');
$dataStr = normalizeDataToString($data);

// ---- ส่งด้วย Expo ----
$expoResults = [];
$expoDelivered = 0; $expoFailed = 0;

if (($mode === 'auto' || $mode === 'expo') && !empty($expoTokens)) {
  $expoUrl = getenv('EXPO_PUSH_URL') ?: 'https://exp.host/--/api/v2/push/send';
  $chunks = array_chunk($expoTokens, 100);
  foreach ($chunks as $chunk) {
    $messages = [];
    foreach ($chunk as $t) {
      $messages[] = [
        'to'    => $t,
        'title' => $title ?: null,
        'body'  => $body  ?: null,
        'data'  => $dataStr,
      ];
    }
    $resp = httpPostJson($expoUrl, $messages);
    $expoResults[] = $resp;

    // พยายาม parse เพื่อนับผลจริงต่อ token (ไม่บังคับ)
    if ($resp['status'] >= 200 && $resp['status'] < 300 && !empty($resp['body'])) {
      $json = json_decode($resp['body'], true);
      if (is_array($json)) {
        // รูปแบบของ Expo: {"data":[{"status":"ok",...}, {"status":"error",...}, ...]}
        $arr = $json['data'] ?? [];
        if (is_array($arr)) {
          foreach ($arr as $one) {
            if (($one['status'] ?? '') === 'ok') $expoDelivered++; else $expoFailed++;
          }
        }
      }
    } else {
      // ทั้งชุดล้มเหลว
      $expoFailed += count($chunk);
    }
  }
}

// ---- ส่งด้วย FCM HTTP v1 ----
$fcmResults = [];
$fcmDelivered = 0; $fcmFailed = 0;

if (($mode === 'auto' || $mode === 'fcm') && !empty($fcmTokens)) {
  $projectId   = getenv('FCM_PROJECT_ID') ?: '';
  $saFile      = getenv('FCM_SA_FILE') ?: '';
  $clientEmail = getenv('FCM_CLIENT_EMAIL') ?: '';
  $privateKey  = getenv('FCM_PRIVATE_KEY') ?: '';

  // โหลด service account ไฟล์ (ถ้ามี)
  if ($saFile && file_exists($saFile)) {
    $sa = json_decode(file_get_contents($saFile), true);
    $clientEmail = $sa['client_email'] ?? $clientEmail;
    $privateKey  = $sa['private_key']  ?? $privateKey;
    if (!$projectId) $projectId = $sa['project_id'] ?? $projectId;
  }
  if ($privateKey !== '') {
    $privateKey = str_replace(["\\n"], "\n", $privateKey);
  }

  if (!$projectId || !$clientEmail || !$privateKey) {
    $fcmResults[] = ['status' => 0, 'body' => null, 'error' => 'FCM config not complete'];
  } else {
    // สร้าง JWT เพื่อขอ access_token
    $now = time();
    $jwtHeader = b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $jwtClaim  = b64url(json_encode([
      'iss'   => $clientEmail,
      'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
      'aud'   => 'https://oauth2.googleapis.com/token',
      'iat'   => $now,
      'exp'   => $now + 3600
    ]));
    $jwtUnsigned = $jwtHeader . '.' . $jwtClaim;

    $signature = '';
    $ok = openssl_sign($jwtUnsigned, $signature, $privateKey, 'sha256');
    if (!$ok) {
      $fcmResults[] = ['status' => 0, 'body' => null, 'error' => 'openssl_sign failed'];
    } else {
      $jwt = $jwtUnsigned . '.' . b64url($signature);

      // ✅ ใช้ form-encoded ไม่ใช่ JSON
      $tokenResp = httpPostForm('https://oauth2.googleapis.com/token', [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt
      ]);

      if ($tokenResp['status'] >= 400 || empty($tokenResp['body'])) {
        $fcmResults[] = ['status' => $tokenResp['status'], 'body' => $tokenResp['body'], 'error' => 'get access_token failed'];
      } else {
        $tokenJson = json_decode($tokenResp['body'], true);
        $accessToken = $tokenJson['access_token'] ?? '';

        if (!$accessToken) {
          $fcmResults[] = ['status' => 0, 'body' => $tokenResp['body'], 'error' => 'no access_token'];
        } else {
          $fcmUrl = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
          foreach ($fcmTokens as $tk) {
            $payload = [
              'message' => [
                'token' => $tk,
                'notification' => [
                  'title' => $title ?: null,
                  'body'  => $body  ?: null
                ],
                'data' => $dataStr,
              ]
            ];
            $resp = httpPostJson($fcmUrl, $payload, ["Authorization: Bearer {$accessToken}"]);
            $fcmResults[] = $resp;

            if ($resp['status'] >= 200 && $resp['status'] < 300) $fcmDelivered++; else $fcmFailed++;
          }
        }
      }
    }
  }
}

// สรุป
$errors = [];
foreach ($expoResults as $r) {
  if (($r['status'] ?? 0) < 200 || ($r['status'] ?? 0) >= 300) {
    $errors[] = ['provider' => 'expo', 'status' => $r['status'], 'error' => $r['error'], 'body' => $r['body']];
  }
}
foreach ($fcmResults as $r) {
  if (($r['status'] ?? 0) < 200 || ($r['status'] ?? 0) >= 300) {
    $errors[] = ['provider' => 'fcm', 'status' => $r['status'], 'error' => $r['error'], 'body' => $r['body']];
  }
}

jsonResponse(true, [
  'targets' => ['expo' => count($expoTokens), 'fcm' => count($fcmTokens)],
  'sent'    => ['expo' => $expoDelivered, 'fcm' => $fcmDelivered],
  'failed'  => ['expo' => $expoFailed, 'fcm' => $fcmFailed],
  'errors'  => $errors,
  'mode'    => $mode,
  'server_time' => now(),
], 'ส่งการแจ้งเตือนเรียบร้อย');
