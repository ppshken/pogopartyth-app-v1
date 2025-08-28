<?php
// api/auth/login.php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  jsonResponse(false, null, 'Method not allowed', 405);
}

$input = getJsonInput();
$emailOrUsername = trim($input['email'] ?? $input['username'] ?? '');
$password = (string)($input['password'] ?? '');

if ($emailOrUsername === '' || $password === '') {
  jsonResponse(false, null, 'กรอกข้อมูลให้ครบถ้วน', 422);
}

$db = pdo();
// รองรับทั้ง email และ username
$stmt = $db->prepare("SELECT id, email, username, password_hash FROM users WHERE email = :u OR username = :u LIMIT 1");
$stmt->execute([':u' => $emailOrUsername]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
  jsonResponse(false, null, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
}

$token = makeToken((int)$user['id'], 86400 * 7); // 7 วัน
jsonResponse(true, [
  'user'  => [
    'id'       => (int)$user['id'],
    'email'    => $user['email'],
    'username' => $user['username'],
  ],
  'token' => $token,
], 'เข้าสู่ระบบสำเร็จ');
