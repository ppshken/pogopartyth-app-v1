<?php
// api/raid/my_rooms.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$db = pdo();

// paginate ปกติ
[$page, $limit, $offset] = paginateParams();

/**
 * เงื่อนไขรวม:
 * - อยู่ในห้อง: ur.user_id = :uid
 * - เวลาเริ่มยังไม่ถึง: r.start_time > NOW()
 * - แยกตามบทบาท:
 *    - owner   : r.status <> 'closed'
 *    - member  : ยังไม่ได้รีวิวห้องนี้
 */
$params = [':uid' => $userId];

$where = "
  WHERE ur.user_id = :uid
    AND r.start_time > NOW()
    AND (
      (ur.role = 'owner' AND r.status <> 'closed')
      OR
      (ur.role <> 'owner' AND NOT EXISTS (
         SELECT 1 FROM raid_reviews rv
         WHERE rv.room_id = r.id AND rv.user_id = :uid
      ))
    )
";

$countSql = "
  SELECT COUNT(*)
  FROM raid_rooms r
  JOIN user_raid_rooms ur ON ur.room_id = r.id
  $where
";
$stmt = $db->prepare($countSql);
$stmt->execute($params);
$total = (int)$stmt->fetchColumn();

$sql = "
  SELECT
    r.id,
    r.boss,
    r.start_time,
    r.status,
    r.max_members,
    r.owner_id,
    ur.role,
    u.username AS owner_username,
    u.avatar   AS owner_avatar,
    (
      SELECT COUNT(*) FROM user_raid_rooms ur2 WHERE ur2.room_id = r.id
    ) AS current_members
  FROM raid_rooms r
  JOIN user_raid_rooms ur ON ur.room_id = r.id
  JOIN users u ON u.id = r.owner_id
  $where
  ORDER BY r.start_time ASC, r.id ASC
  LIMIT :limit OFFSET :offset
";
$stmt = $db->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// map ออกเป็นรูปแบบเดียวกับฝั่งแอปใช้
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
    'note'             => null, // ต้องการ note ให้ SELECT เพิ่ม
    'owner_id'         => (int)$r['owner_id'],
    'role'             => $r['role'], // owner | member
    'owner'            => [
      'id'       => (int)$r['owner_id'],
      'username' => $r['owner_username'],
      'avatar'   => $r['owner_avatar'],
    ],
  ];
}, $rows);

jsonResponse(true, [
  'items'       => $items,
  'page'        => $page,
  'limit'       => $limit,
  'total'       => $total,
  'total_pages' => (int)ceil($total / $limit),
], 'โหลดห้องของฉัน: ยังไม่หมดเวลา • owner=ยังไม่ปิด • member=ยังไม่รีวิว');
