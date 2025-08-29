<?php
// api/raid/ready_status.php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$roomId = (int)($_GET['room_id'] ?? 0);
if ($roomId <= 0) {
  jsonResponse(false, null, 'room_id ไม่ถูกต้อง', 422);
}

$db = pdo();

// ห้องมีจริงไหม
$stmt = $db->prepare("SELECT id, owner_id FROM raid_rooms WHERE id = :id");
$stmt->execute([':id' => $roomId]);
$room = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$room) {
  jsonResponse(false, null, 'ไม่พบห้อง', 404);
}

// ผู้เรียกต้องเป็นสมาชิกห้อง
$stmt = $db->prepare("
  SELECT role FROM user_raid_rooms
  WHERE room_id = :r AND user_id = :u
  LIMIT 1
");
$stmt->execute([':r' => $roomId, ':u' => $userId]);
$me = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$me) {
  jsonResponse(false, null, 'ต้องเป็นสมาชิกของห้องนี้จึงจะดูสถานะได้', 403);
}

// ดึงสมาชิกทั้งหมด + friend_ready
$stmt = $db->prepare("
  SELECT
    ur.user_id,
    ur.role,
    ur.joined_at,
    ur.friend_ready,
    ur.friend_ready_at,
    u.username,
    u.avatar,
    u.friend_code
  FROM user_raid_rooms ur
  JOIN users u ON u.id = ur.user_id
  WHERE ur.room_id = :r
  ORDER BY (ur.role = 'owner') DESC, ur.joined_at ASC
");
$stmt->execute([':r' => $roomId]);
$members = $stmt->fetchAll(PDO::FETCH_ASSOC);

// รวมสรุป (เฉพาะสมาชิก ไม่รวม owner)
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
  'members'       => $members,
  'summary'       => [
    'ready_count'   => $readyCount,
    'total_members' => $totalMembers,
    'all_ready'     => $allReady,
  ],
], 'โหลดสถานะเพิ่มเพื่อนแล้วสำเร็จ');
