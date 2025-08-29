<?php
// api/raid/ready_friend.php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$input = getJsonInput();

$roomId   = (int)($input['room_id'] ?? 0);
$targetId = isset($input['user_id']) ? (int)$input['user_id'] : $userId; // ถ้าไม่ส่ง แปลว่าแก้ของตัวเอง
$readyIn  = $input['ready'] ?? null; // null = toggle

if ($roomId <= 0) {
  jsonResponse(false, null, 'room_id ไม่ถูกต้อง', 422);
}

$db = pdo();

// อ่านข้อมูลห้อง + owner
$stmt = $db->prepare("SELECT id, owner_id, status, start_time FROM raid_rooms WHERE id = :id");
$stmt->execute([':id' => $roomId]);
$room = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$room) {
  jsonResponse(false, null, 'ไม่พบห้อง', 404);
}

// ตรวจว่า caller เป็น owner ไหม (ใช้เพื่อแก้ของคนอื่น)
$isCallerOwner = ((int)$room['owner_id'] === $userId);

// อ่าน membership ของ target
$stmt = $db->prepare("
  SELECT role, friend_ready
  FROM user_raid_rooms
  WHERE room_id = :r AND user_id = :u
  LIMIT 1
");
$stmt->execute([':r' => $roomId, ':u' => $targetId]);
$target = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$target) {
  jsonResponse(false, null, 'ไม่พบสมาชิกเป้าหมายในห้องนี้', 404);
}

// ห้ามตั้งสถานะให้ owner (ไม่มีความหมาย)
if ($target['role'] === 'owner') {
  jsonResponse(false, null, 'ไม่ต้องตั้งสถานะให้เจ้าของห้อง', 422);
}

// ถ้าจะแก้ของ “คนอื่น” ต้องเป็นเจ้าของห้องเท่านั้น
if ($targetId !== $userId && !$isCallerOwner) {
  jsonResponse(false, null, 'ไม่มีสิทธิ์แก้สถานะของสมาชิกคนอื่น', 403);
}

// กำหนดค่าสถานะใหม่
$current = (int)($target['friend_ready'] ?? 0);
$newReady = ($readyIn === null) ? (int)!$current : ((int)$readyIn ? 1 : 0);

// อัปเดต
$up = $db->prepare("
  UPDATE user_raid_rooms
  SET friend_ready = :fr, friend_ready_at = :at
  WHERE room_id = :r AND user_id = :u
");
$up->execute([
  ':fr' => $newReady,
  ':at' => now(),
  ':r'  => $roomId,
  ':u'  => $targetId,
]);

// นับสรุป (เฉพาะสมาชิก ไม่รวม owner)
$cnt = $db->prepare("
  SELECT
    SUM(CASE WHEN role <> 'owner' THEN 1 ELSE 0 END) AS total_members,
    SUM(CASE WHEN role <> 'owner' AND friend_ready = 1 THEN 1 ELSE 0 END) AS ready_count
  FROM user_raid_rooms
  WHERE room_id = :r
");
$cnt->execute([':r' => $roomId]);
$agg = $cnt->fetch(PDO::FETCH_ASSOC);

$totalMembers = (int)($agg['total_members'] ?? 0);
$readyCount   = (int)($agg['ready_count'] ?? 0);
$allReady     = ($totalMembers > 0 && $readyCount === $totalMembers);

jsonResponse(true, [
  'room_id'       => $roomId,
  'user_id'       => $targetId,
  'ready'         => $newReady,
  'ready_count'   => $readyCount,
  'total_members' => $totalMembers,
  'all_ready'     => $allReady,
], 'อัปเดตสถานะเพิ่มเพื่อนแล้วสำเร็จ', 200);
