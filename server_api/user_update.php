<?php
// api/user/update.php (ตัวอย่าง)
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$input  = getJsonInput();

$fields = [];
$params = [':id' => $userId];

if (isset($input['username'])) {
  $fields[] = 'username = :username';
  $params[':username'] = trim((string)$input['username']);
}
if (array_key_exists('avatar', $input)) {
  $fields[] = 'avatar = :avatar';
  $params[':avatar'] = $input['avatar'] !== null ? trim((string)$input['avatar']) : null;
}
if (array_key_exists('friend_code', $input)) {
  $fields[] = 'friend_code = :friend_code';
  $params[':friend_code'] = $input['friend_code'] !== null ? trim((string)$input['friend_code']) : null;
}
if (array_key_exists('device_token', $input)) {
  $fields[] = 'device_token = :device_token';
  $params[':device_token'] = $input['device_token'] !== null ? trim((string)$input['device_token']) : null;
}

if (!$fields) {
  jsonResponse(true, null, 'ไม่มีข้อมูลให้แก้ไข');
}

$db = pdo();
$sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
$stmt = $db->prepare($sql);
$stmt->execute($params);

jsonResponse(true, null, 'อัปเดตข้อมูลสำเร็จ');
