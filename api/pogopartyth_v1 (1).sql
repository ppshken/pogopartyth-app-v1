-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 29, 2025 at 12:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pogopartyth_v1`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `id` int(11) NOT NULL,
  `raid_rooms_id` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat`
--

INSERT INTO `chat` (`id`, `raid_rooms_id`, `sender`, `message`, `created_at`) VALUES
(18, 24, 2, 'สวัสดีครับ จะตีกี่โมงหรอครับ พอดีผมต้องมีไปทำธุระต่อ กลัวไม่ทัน', '2025-08-29 15:29:08'),
(19, 25, 4, 'ควย', '2025-08-29 15:46:21'),
(20, 29, 1, 'ทักครับ', '2025-08-29 16:50:37'),
(21, 29, 1, 'ทดสอบ', '2025-08-29 16:50:41'),
(22, 29, 1, 'เทสๆๆๆ', '2025-08-29 16:50:44'),
(23, 29, 2, 'ครับ', '2025-08-29 16:51:49');

-- --------------------------------------------------------

--
-- Table structure for table `raid_reviews`
--

CREATE TABLE `raid_reviews` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `raid_rooms`
--

CREATE TABLE `raid_rooms` (
  `id` int(11) NOT NULL,
  `boss` varchar(100) NOT NULL,
  `start_time` datetime NOT NULL,
  `max_members` int(11) NOT NULL,
  `status` enum('active','closed','canceled','invited') NOT NULL DEFAULT 'active',
  `owner_id` int(11) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `avg_rating` decimal(3,2) DEFAULT NULL,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raid_rooms`
--

INSERT INTO `raid_rooms` (`id`, `boss`, `start_time`, `max_members`, `status`, `owner_id`, `note`, `avg_rating`, `review_count`, `created_at`) VALUES
(24, 'Mewtwo', '2025-08-29 15:30:00', 3, 'active', 1, 'หาคนตีบอสไกลครับ เริ่มประมาณ 4 โมงเย็นครับ', NULL, 0, '2025-08-29 15:26:02'),
(25, 'Groudon', '2025-08-29 16:05:00', 4, 'active', 2, 'หาคนตีบอสครับ มีไหม', NULL, 0, '2025-08-29 15:27:46'),
(26, 'Kyogre', '2025-08-29 15:35:00', 6, 'active', 5, 'ตีไคโอก้าครับ', NULL, 0, '2025-08-29 15:31:27'),
(27, 'Mewtwo', '2025-08-29 16:15:00', 6, 'active', 4, NULL, NULL, 0, '2025-08-29 16:06:59'),
(28, 'Mewtwo', '2025-08-29 16:50:00', 6, 'active', 4, NULL, NULL, 0, '2025-08-29 16:43:51'),
(29, 'Mewtwo', '2025-08-29 16:55:00', 6, 'active', 1, NULL, NULL, 0, '2025-08-29 16:50:30'),
(30, 'Rayquaza', '2025-08-29 17:10:00', 6, 'active', 2, NULL, NULL, 0, '2025-08-29 17:07:27'),
(31, 'Mewtwo', '2025-08-29 17:50:00', 6, 'active', 1, NULL, NULL, 0, '2025-08-29 17:11:46'),
(32, 'Mewtwo', '2025-08-29 17:25:00', 6, 'active', 2, NULL, NULL, 0, '2025-08-29 17:16:45'),
(33, 'Rayquaza', '2025-08-29 17:25:00', 6, 'active', 7, NULL, NULL, 0, '2025-08-29 17:20:57');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `username` varchar(191) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `friend_code` varchar(32) DEFAULT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `avatar`, `friend_code`, `device_token`, `created_at`) VALUES
(1, 'demo@ppth.com', 'demo_user', '$2y$10$bzDOiUCy.YXXcKCsKlRrzOcnShkR9WQjtbl3m5jPuLOFx6uh6lJ8m', 'http://172.20.10.11/pogopartyth-app-v1/api/uploads/avatars/u1_1756461007_80b9ed56.jpg', '123456789012', NULL, '2025-08-28 10:00:24'),
(2, 'kensaohin@gmail.com', 'PikaMaster', '$2y$10$CqfdPoqv0ZXJqwa6pgpAyegB9TnZGOJBnR/5oS0UZHuzxHlEAzoLi', 'http://172.20.10.11/pogopartyth-app-v1/api/uploads/avatars/u2_1756461096_7594cb62.jpg', '1234 5678 9234', NULL, '2025-08-28 10:17:10'),
(3, 'kenzanaqq@gmail.com', 'AkenzaMasterTH', '$2y$10$zp4ZkkFrVFnNRQtdh3P4Cu5m.TreAuW68emxLMBJ3FOPNGQeVJdU2', NULL, '3324-7735-6637', NULL, '2025-08-28 11:23:31'),
(4, 'test@gmail.com', 'adminyyy', '$2y$10$OwaquWF3BCi2D1ThwAwjOO1E0kMdi5jWt6GXtqcpdBekInWQSAEGK', 'http://172.20.10.11/pogopartyth-app-v1/api/uploads/avatars/u4_1756460607_bd6bd09e.jpg', '3328-5567-8849', NULL, '2025-08-28 12:30:53'),
(5, 'lovekenza_007@hotmail.com', 'Lovekenza007', '$2y$10$vjgLtcL64l3Uv26rwHTfB.leXK5NTbN3iYmT78/5vp0.BB5UnPrle', NULL, '554348184946', NULL, '2025-08-29 14:01:41'),
(6, 'test2@gmail.com', 'Test2', '$2y$10$j1ufX.p9P2CgVs7aO4zqgucOrt3tuPit7LjviBVuSsejcoqen7Nau', NULL, '546465846464', NULL, '2025-08-29 14:03:00'),
(7, 'test3@gmail.com', 'Test3', '$2y$10$CI.mTM0UU6.Y4SFCdBLwrOtbnWFl4ZEMg8YmL/DuH6w2Axrc1biFW', 'http://172.20.10.11/pogopartyth-app-v1/api/uploads/avatars/u7_1756462893_4f1bf04e.jpg', '515464848048', NULL, '2025-08-29 14:03:31');

-- --------------------------------------------------------

--
-- Table structure for table `user_raid_rooms`
--

CREATE TABLE `user_raid_rooms` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','member') NOT NULL DEFAULT 'member',
  `joined_at` datetime NOT NULL,
  `friend_ready` tinyint(1) NOT NULL DEFAULT 0,
  `friend_ready_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_raid_rooms`
--

INSERT INTO `user_raid_rooms` (`id`, `room_id`, `user_id`, `role`, `joined_at`, `friend_ready`, `friend_ready_at`) VALUES
(54, 24, 1, 'owner', '2025-08-29 15:26:02', 0, NULL),
(55, 25, 2, 'owner', '2025-08-29 15:27:46', 0, NULL),
(59, 24, 2, 'member', '2025-08-29 15:28:41', 0, NULL),
(60, 26, 5, 'owner', '2025-08-29 15:31:27', 0, NULL),
(61, 25, 5, 'member', '2025-08-29 15:31:39', 0, NULL),
(62, 25, 4, 'member', '2025-08-29 15:32:33', 0, NULL),
(63, 27, 4, 'owner', '2025-08-29 16:06:59', 0, NULL),
(64, 28, 4, 'owner', '2025-08-29 16:43:51', 0, NULL),
(65, 28, 1, 'member', '2025-08-29 16:46:51', 0, NULL),
(66, 29, 1, 'owner', '2025-08-29 16:50:30', 0, NULL),
(67, 29, 2, 'member', '2025-08-29 16:51:42', 0, NULL),
(68, 30, 2, 'owner', '2025-08-29 17:07:27', 0, NULL),
(69, 31, 1, 'owner', '2025-08-29 17:11:46', 0, NULL),
(70, 32, 2, 'owner', '2025-08-29 17:16:45', 0, NULL),
(71, 33, 7, 'owner', '2025-08-29 17:20:57', 0, NULL),
(72, 31, 7, 'member', '2025-08-29 17:21:45', 0, NULL),
(73, 32, 7, 'member', '2025-08-29 17:21:48', 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_id_id` (`raid_rooms_id`,`id`),
  ADD KEY `idx_room_created` (`raid_rooms_id`,`created_at`),
  ADD KEY `fk_chat_user` (`sender`);

--
-- Indexes for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `fk_rr_user` (`user_id`);

--
-- Indexes for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_start_status` (`start_time`,`status`),
  ADD KEY `fk_rooms_owner` (`owner_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `uniq_users_email` (`email`),
  ADD UNIQUE KEY `uniq_users_username` (`username`);

--
-- Indexes for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `fk_urr_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `fk_chat_room` FOREIGN KEY (`raid_rooms_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_user` FOREIGN KEY (`sender`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  ADD CONSTRAINT `fk_rr_room` FOREIGN KEY (`room_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  ADD CONSTRAINT `fk_rooms_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  ADD CONSTRAINT `fk_urr_room` FOREIGN KEY (`room_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_urr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
