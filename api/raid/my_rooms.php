<?php
// api/raid/my_rooms.php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard(); // จะ throw/ส่ง 401 ในตัวถ้าไม่มี/ผิด token

// รับพารามิเตอร์
$status = isset($_GET['status']) ? trim((string)$_GET['status']) : null; // active|closed|canceled (ถ้าใช้)
$page   = max(1, (int)($_GET['page']  ?? 1));
$limit  = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

// validate ค่าสถานะ (เลือกใช้ตามระบบจริง)
$allowStatus = ['active','closed','canceled'];
if ($status !== null && $status !== '' && !in_array($status, $allowStatus, true)) {
  jsonResponse(false, null, 'status ไม่ถูกต้อง', 422);
}

$db = pdo();

try {
  // นับจำนวนทั้งหมด (distinct room) ที่ผู้ใช้อยู่ในห้อง
  $sqlCount = "
    SELECT COUNT(DISTINCT r.id)
    FROM raid_rooms r
    JOIN user_raid_rooms ur ON ur.room_id = r.id
    WHERE ur.user_id = :uid
  ";
  if ($status) {
    $sqlCount .= " AND r.status = :status";
  }
  $stmt = $db->prepare($sqlCount);
  $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
  if ($status) $stmt->bindValue(':status', $status, PDO::PARAM_STR);
  $stmt->execute();
  $total = (int)$stmt->fetchColumn();

  // ดึงรายการห้องของฉัน (owner หรือ member)
  $sql = "
    SELECT
      r.id,
      r.boss,
      r.start_time,
      r.status,
      r.max_members,
      r.note,
      r.created_at,
      r.owner_id,
      o.username AS owner_username,
      o.avatar   AS owner_avatar,
      (SELECT COUNT(*) FROM user_raid_rooms ur2 WHERE ur2.room_id = r.id) AS current_members,
      CASE WHEN r.owner_id = :uid THEN 1 ELSE 0 END AS is_owner
    FROM raid_rooms r
    JOIN user_raid_rooms ur ON ur.room_id = r.id
    LEFT JOIN users o ON o.id = r.owner_id
    WHERE ur.user_id = :uid
  ";
  if ($status) {
    $sql .= " AND r.status = :status";
  }
  $sql .= "
    GROUP BY r.id
    ORDER BY r.start_time DESC
    LIMIT :limit OFFSET :offset
  ";

  $stmt = $db->prepare($sql);
  $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
  if ($status) $stmt->bindValue(':status', $status, PDO::PARAM_STR);
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

  // shape ข้อมูลให้อยู่รูปแบบสวยงาม/คงที่
  $items = array_map(function(array $r) {
    $current = (int)$r['current_members'];
    $max     = (int)$r['max_members'];
    return [
      'id'               => (int)$r['id'],
      'boss'             => $r['boss'],
      'start_time'       => $r['start_time'],
      'status'           => $r['status'],
      'max_members'      => $max,
      'current_members'  => $current,
      'is_full'          => $current >= $max,
      'note'             => $r['note'],
      'created_at'       => $r['created_at'],
      'is_owner'         => (bool)$r['is_owner'],
      'owner'            => [
        'id'       => (int)$r['owner_id'],
        'username' => $r['owner_username'],
        'avatar'   => $r['owner_avatar'],
      ],
    ];
  }, $rows);

  jsonResponse(true, [
    'items'    => $items,
    'page'     => $page,
    'limit'    => $limit,
    'total'    => $total,
    'has_more' => ($page * $limit) < $total,
  ], 'โหลดห้องของฉันสำเร็จ', 200);

} catch (Throwable $e) {
  jsonResponse(false, null, 'ไม่สามารถโหลดข้อมูลได้: '.$e->getMessage(), 500);
}
