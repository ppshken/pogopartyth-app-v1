<?php
// api/auth/update_profile.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$db = pdo();

try {
  $in = getJsonInput();

  // อนุญาตเฉพาะ 2 ฟิลด์นี้เท่านั้น
  $username    = isset($in['username']) ? trim((string)$in['username']) : null;
  $friend_code = array_key_exists('friend_code', $in) ? trim((string)$in['friend_code']) : null;

  $set = [];
  $params = [':id' => $userId];

  if ($username !== null) {
    if ($username === '') {
      jsonResponse(false, null, 'username ห้ามว่าง', 422);
    }
    $set[] = 'username = :username';
    $params[':username'] = $username;
  }

  if ($friend_code !== null) {
    $set[] = 'friend_code = :friend_code';
    $params[':friend_code'] = $friend_code;
  }

  if (empty($set)) {
    jsonResponse(false, null, 'ไม่มีข้อมูลให้ปรับปรุง', 422);
  }

  $sql = 'UPDATE users SET ' . implode(', ', $set) . ' WHERE id = :id';
  $stmt = $db->prepare($sql);
  $stmt->execute($params);

  // ส่งข้อมูลล่าสุดกลับ
  $stmt = $db->prepare("
    SELECT id, email, username, avatar, friend_code, created_at
    FROM users WHERE id = :id LIMIT 1
  ");
  $stmt->execute([':id' => $userId]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    jsonResponse(false, null, 'ไม่พบผู้ใช้หลังอัปเดต', 404);
  }

  jsonResponse(true, ['user' => $user], 'อัปเดตโปรไฟล์สำเร็จ');

} catch (PDOException $e) {
  // กันเคส UNIQUE ซ้ำ (เช่น username ซ้ำ)
  if ($e->getCode() === '23000') {
    jsonResponse(false, null, 'ข้อมูลซ้ำ (เช่น username มีผู้ใช้แล้ว)', 409);
  }
  jsonResponse(false, null, 'DB Error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
  jsonResponse(false, null, 'Server Error: ' . $e->getMessage(), 500);
}
