<?php
// api/auth/update_avatar.php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$userId = authGuard();

if (!isset($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
  jsonResponse(false, null, 'ไม่พบไฟล์ avatar', 422);
}

$file = $_FILES['avatar'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  jsonResponse(false, null, 'อัปโหลดไฟล์ไม่สำเร็จ (error '.$file['error'].')', 422);
}

// ป้องกันกรณี tmp_name ไม่ใช่ไฟล์อัปโหลดจริง
if (!is_uploaded_file($file['tmp_name'])) {
  jsonResponse(false, null, 'อัปโหลดไม่ถูกต้อง', 422);
}

// จำกัดขนาดไฟล์ (<= 3MB)
$maxBytes = 3 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
  jsonResponse(false, null, 'ไฟล์ใหญ่เกิน 3MB', 413);
}

// ตรวจ MIME
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);
$allow = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if (!isset($allow[$mime])) {
  jsonResponse(false, null, 'รองรับเฉพาะ JPG, PNG, WEBP', 415);
}
$ext = $allow[$mime];

// โฟลเดอร์เก็บไฟล์ (บนดิสก์)
$root = realpath(__DIR__ . '/../'); // รากโปรเจ็กต์ (โฟลเดอร์ที่มี uploads/)
$uploadDir = $root . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'avatars';
if (!is_dir($uploadDir)) {
  if (!@mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
    jsonResponse(false, null, 'ไม่สามารถสร้างโฟลเดอร์อัปโหลดได้', 500);
  }
}

// ตั้งชื่อไฟล์
$basename = 'u'.$userId.'_'.time().'_'.bin2hex(random_bytes(4)).'.'.$ext;
$target = $uploadDir . DIRECTORY_SEPARATOR . $basename;

// ย้ายไฟล์
if (!move_uploaded_file($file['tmp_name'], $target)) {
  jsonResponse(false, null, 'บันทึกไฟล์ไม่สำเร็จ', 500);
}

/**
 * ทำ URL แบบเต็ม (absolute) เพื่อให้ RN โหลดได้ชัวร์
 * ตัวอย่างผลลัพธ์: http://localhost/pogopartyth_api/uploads/avatars/xxxx.jpg
 * อิงจากตำแหน่งไฟล์นี้อยู่ใน /api/auth/ จึงถอยขึ้น 2 ชั้นไปยัง base path ของโปรเจ็กต์
 */
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
$basePath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/'); // two-level up: /<project-base>
$publicUrl = $scheme . '://' . $host . $basePath . '/uploads/avatars/' . $basename;

// TIP: ถ้าคุณรันใต้โฟลเดอร์อื่น เช่น /pogopartyth-app-v1 ให้แน่ใจว่า uploads อยู่ใต้โฟลเดอร์เดียวกัน

$db = pdo();

// อัปเดต URL แบบเต็มลง DB (แนะนำสำหรับ React Native)
$upd = $db->prepare("UPDATE users SET avatar = :a WHERE id = :id");
$upd->execute([':a' => $publicUrl, ':id' => $userId]);

$stmt = $db->prepare("
  SELECT id, email, username, avatar, friend_code, created_at
  FROM users WHERE id = :id LIMIT 1
");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

jsonResponse(true, ['user' => $user], 'อัปเดตรูปโปรไฟล์สำเร็จ', 200);
