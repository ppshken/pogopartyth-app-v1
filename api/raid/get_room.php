<?php
// api/raid/get_room.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$roomId = (int)($_GET['room_id'] ?? 0);
if ($roomId <= 0) {
  jsonResponse(false, null, 'room_id ไม่ถูกต้อง', 422);
}

// ----- อ่าน user_id จาก token แบบ OPTIONAL -----
// ถ้ามี Authorization: Bearer ... จะตรวจและดึง user_id ออกมา
// แต่ถ้าไม่มี ก็ยังเรียกดูข้อมูลห้องได้ตามปกติ
$authedUserId = null;
$hdr = function_exists('readAuthHeader') ? readAuthHeader() : ($_SERVER['HTTP_AUTHORIZATION'] ?? null);
$token = null;
if ($hdr && stripos($hdr, 'Bearer ') === 0) {
  $token = trim(substr($hdr, 7));
} elseif (!empty($_GET['token'])) { // fallback debug เท่านั้น
  $token = trim($_GET['token']);
}
if ($token) {
  $payload = verifyToken($token);
  if ($payload && !empty($payload['user_id'])) {
    $authedUserId = (int)$payload['user_id'];
  }
}

$db = pdo();

// ดึงรายละเอียดห้อง + เจ้าของ
$stmt = $db->prepare("
  SELECT
    r.id, r.boss, r.start_time, r.max_members, r.status, r.owner_id, r.note, r.created_at,
    u.username AS owner_username,
    u.avatar   AS owner_avatar
  FROM raid_rooms r
  JOIN users u ON u.id = r.owner_id
  WHERE r.id = :id
  LIMIT 1
");
$stmt->execute([':id' => $roomId]);
$room = $stmt->fetch();

if (!$room) {
  jsonResponse(false, null, 'ไม่พบห้อง', 404);
}

// จำนวนสมาชิกปัจจุบัน
$qCount = $db->prepare("SELECT COUNT(*) FROM user_raid_rooms WHERE room_id = :rid");
$qCount->execute([':rid' => $roomId]);
$currentMembers = (int)$qCount->fetchColumn();
$isFull = $currentMembers >= (int)$room['max_members'];

// รายชื่อสมาชิกในห้อง
$qMembers = $db->prepare("
  SELECT
    ur.user_id,
    ur.role,
    ur.joined_at,
    uu.username,
    uu.avatar
  FROM user_raid_rooms ur
  JOIN users uu ON uu.id = ur.user_id
  WHERE ur.room_id = :rid
  ORDER BY (ur.role = 'owner') DESC, ur.joined_at ASC
");
$qMembers->execute([':rid' => $roomId]);
$members = $qMembers->fetchAll();

// สถานะของผู้เรียกดู (ถ้ามี token)
$you = null;
if ($authedUserId !== null) {
  $youRole = null;
  foreach ($members as $m) {
    if ((int)$m['user_id'] === $authedUserId) {
      $youRole = $m['role'];
      break;
    }
  }
  $you = [
    'user_id'   => $authedUserId,
    'is_member' => $youRole !== null,
    'role'      => $youRole,                 // owner | member | null
    'is_owner'  => $youRole === 'owner',
  ];
}

jsonResponse(true, [
  'room' => [
    'id'              => (int)$room['id'],
    'boss'            => $room['boss'],
    'start_time'      => $room['start_time'],
    'max_members'     => (int)$room['max_members'],
    'status'          => $room['status'],
    'owner'           => [
      'id'       => (int)$room['owner_id'],
      'username' => $room['owner_username'],
      'avatar'   => $room['owner_avatar'],
    ],
    'note'            => $room['note'],
    'created_at'      => $room['created_at'],
    'current_members' => $currentMembers,
    'is_full'         => $isFull,
  ],
  'members' => $members,
  'you'     => $you, // null ถ้าไม่ได้ส่ง token มา
], 'โหลดรายละเอียดห้องสำเร็จ');
