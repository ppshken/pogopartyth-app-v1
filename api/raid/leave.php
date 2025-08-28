<?php
// api/raid/leave.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();
$input  = getJsonInput();

$roomId = (int)($input['room_id'] ?? 0);
if ($roomId <= 0) {
  jsonResponse(false, null, 'room_id ไม่ถูกต้อง', 422);
}

$db = pdo();

try {
  $db->beginTransaction();

  // ตรวจว่ามีห้องไหม (ล็อกแถวป้องกัน race)
  $qRoom = $db->prepare("SELECT id, owner_id, status, start_time FROM raid_rooms WHERE id = :id FOR UPDATE");
  $qRoom->execute([':id' => $roomId]);
  $room = $qRoom->fetch();
  if (!$room) {
    $db->rollBack();
    jsonResponse(false, null, 'ไม่พบห้อง', 404);
  }

  // ตรวจสมาชิกของผู้ใช้ในห้อง (ล็อกแถว)
  $qMem = $db->prepare("
    SELECT id, role FROM user_raid_rooms 
    WHERE room_id = :r AND user_id = :u 
    FOR UPDATE
  ");
  $qMem->execute([':r' => $roomId, ':u' => $userId]);
  $mem = $qMem->fetch();
  if (!$mem) {
    $db->rollBack();
    jsonResponse(false, null, 'คุณไม่ได้เป็นสมาชิกห้องนี้', 409);
  }

  // เจ้าของห้องไม่สามารถ "ออก" ได้ (ให้ปิดห้องหรือโอนสิทธิ์)
  if ($mem['role'] === 'owner') {
    $db->rollBack();
    jsonResponse(false, null, 'เจ้าของห้องไม่สามารถออกได้ โปรดปิดห้องหรือโอนสิทธิ์ให้ผู้อื่น', 409);
  }

  // ออกจากห้อง
  $del = $db->prepare("DELETE FROM user_raid_rooms WHERE id = :id");
  $del->execute([':id' => (int)$mem['id']]);

  // คำนวณจำนวนสมาชิกปัจจุบันหลังออก
  $qCount = $db->prepare("SELECT COUNT(*) FROM user_raid_rooms WHERE room_id = :r");
  $qCount->execute([':r' => $roomId]);
  $current = (int)$qCount->fetchColumn();

  $db->commit();

  jsonResponse(true, [
    'room_id'          => $roomId,
    'current_members'  => $current,
    'you_left_at'      => now(),
  ], 'ออกจากห้องสำเร็จ');
} catch (Throwable $e) {
  if ($db->inTransaction()) $db->rollBack();
  jsonResponse(false, null, 'ออกจากห้องล้มเหลว', 500);
}
