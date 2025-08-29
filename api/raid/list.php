<?php
// api/raid/list.php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$db = pdo();

// ----- พารามิเตอร์ -----
$boss            = trim($_GET['boss'] ?? '');
$status          = trim($_GET['status'] ?? 'active'); // active|closed|canceled (default active)
$timeFrom        = trim($_GET['time_from'] ?? '');    // "YYYY-MM-DD HH:MM:SS"
$timeTo          = trim($_GET['time_to'] ?? '');
$excludeExpired  = (int)($_GET['exclude_expired'] ?? 1) === 1; // ✅ ค่าเริ่มต้น: ซ่อนห้องหมดเวลา
$isAll           = (int)($_GET['all'] ?? 0) === 1;    // ดึงทั้งหมด (ภายใต้ filter)
$HARD_CAP        = 5000;

// paginate ปกติ
[$page, $limit, $offset] = paginateParams();

// ----- เงื่อนไขค้นหา -----
$cond = [];
$params = [];

if ($boss !== '') {
  $cond[] = 'r.boss LIKE :boss';
  $params[':boss'] = '%' . $boss . '%';
}
if ($status !== '') {
  $cond[] = 'r.status = :status';
  $params[':status'] = $status;
}
if ($timeFrom !== '' && strtotime($timeFrom) !== false) {
  $cond[] = 'r.start_time >= :from';
  $params[':from'] = $timeFrom;
}
if ($timeTo !== '' && strtotime($timeTo) !== false) {
  $cond[] = 'r.start_time <= :to';
  $params[':to'] = $timeTo;
}

// ✅ กรองเฉพาะห้องที่ "ยังไม่หมดเวลา" (start_time > ตอนนี้)
// ใช้ค่าเวลา "ตอนนี้" จาก PHP เพื่อให้ตรง timezone ที่ตั้งไว้ใน helpers.php
if ($excludeExpired) {
  $cond[] = 'r.start_time > :now';
  $params[':now'] = now(); // e.g. "2025-08-29 13:45:00"
}

$where = $cond ? ('WHERE ' . implode(' AND ', $cond)) : '';

// ----- นับทั้งหมด -----
$countSql = "SELECT COUNT(*) AS cnt FROM raid_rooms r $where";
$stmt = $db->prepare($countSql);
$stmt->execute($params);
$total = (int)$stmt->fetchColumn();

// ----- ดึงรายการ -----
$sql = "
  SELECT
    r.id, r.boss, r.start_time, r.max_members, r.status, r.owner_id, r.note, r.created_at,
    (SELECT COUNT(*) FROM user_raid_rooms ur WHERE ur.room_id = r.id) AS current_members
  FROM raid_rooms r
  $where
  ORDER BY r.start_time DESC, r.id ASC
";

// โหมด all=1
if ($isAll) {
  $fetchLimit = min($total, $HARD_CAP);
  $sql .= " LIMIT :limit_all";
  $stmt = $db->prepare($sql);
  foreach ($params as $k => $v) $stmt->bindValue($k, $v);
  $stmt->bindValue(':limit_all', $fetchLimit, PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll();

  jsonResponse(true, [
    'items'        => $rows,
    'page'         => 1,
    'limit'        => count($rows),
    'total'        => $total,
    'total_pages'  => 1,
    'returned'     => count($rows),
    'truncated'    => $total > $HARD_CAP,
  ], 'ดึงรายการห้อง (all=1) สำเร็จ');
  exit;
}

// โหมดปกติ: LIMIT/OFFSET
$sql .= " LIMIT :limit OFFSET :offset";
$stmt = $db->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll();

jsonResponse(true, [
  'items'       => $rows,
  'page'        => $page,
  'limit'       => $limit,
  'total'       => $total,
  'total_pages' => (int)ceil($total / $limit),
], 'ดึงรายการห้องสำเร็จ');
