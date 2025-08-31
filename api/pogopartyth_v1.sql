-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 28, 2025 at 01:03 PM
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
(1, 2, 1, 'สวัสดีทุกคน! เตรียมพร้อมยัง?', '2025-08-28 10:50:17'),
(2, 2, 1, 'เดียวจะเชิญละนะครับ', '2025-08-28 10:51:25'),
(3, 7, 1, 'เทส', '2025-08-28 12:39:00'),
(4, 9, 1, 'อิอิ', '2025-08-28 12:39:43'),
(5, 2, 2, 'ขอบคุณครับ', '2025-08-28 12:52:55'),
(6, 2, 2, 'ใกล้แล้ว จัดมาครับ', '2025-08-28 12:53:06');

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
  `status` enum('active','closed','canceled') NOT NULL DEFAULT 'active',
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
(1, 'Mewtwo', '2025-08-31 20:00:00', 6, 'closed', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 10:21:19'),
(2, 'Mewtwo', '2025-08-28 16:00:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 10:23:43'),
(3, 'Mewtwo', '2025-08-28 17:00:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:09:01'),
(4, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:09:14'),
(5, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:12:59'),
(6, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:13:01'),
(7, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:13:04'),
(8, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:13:05'),
(9, 'Mewtwo', '2025-08-28 17:16:00', 6, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:13:05'),
(10, 'Mew', '2025-08-28 18:00:00', 4, 'active', 1, 'ขอคนมี remote pass', NULL, 0, '2025-08-28 11:24:26'),
(11, 'Mewtwo', '2025-09-01 20:00:00', 6, 'active', 1, 'เทส', NULL, 0, '2025-08-28 12:39:54'),
(12, 'Mewtwo', '2025-09-01 20:00:00', 6, 'active', 2, 'เทส', NULL, 0, '2025-08-28 12:40:47');

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
(1, 'demo@ppth.com', 'demo_user', '$2y$10$bzDOiUCy.YXXcKCsKlRrzOcnShkR9WQjtbl3m5jPuLOFx6uh6lJ8m', NULL, '1234-5678-9012', NULL, '2025-08-28 10:00:24'),
(2, 'kensaohin@gmail.com', 'AvenderMasterTH', '$2y$10$CqfdPoqv0ZXJqwa6pgpAyegB9TnZGOJBnR/5oS0UZHuzxHlEAzoLi', NULL, '3934-8614-8074', NULL, '2025-08-28 10:17:10'),
(3, 'kenzanaqq@gmail.com', 'AkenzaMasterTH', '$2y$10$zp4ZkkFrVFnNRQtdh3P4Cu5m.TreAuW68emxLMBJ3FOPNGQeVJdU2', NULL, '3324-7735-6637', NULL, '2025-08-28 11:23:31'),
(4, 'test@gmail.com', 'admin', '$2y$10$OwaquWF3BCi2D1ThwAwjOO1E0kMdi5jWt6GXtqcpdBekInWQSAEGK', NULL, NULL, NULL, '2025-08-28 12:30:53');

-- --------------------------------------------------------

--
-- Table structure for table `user_raid_rooms`
--

CREATE TABLE `user_raid_rooms` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','member') NOT NULL DEFAULT 'member',
  `joined_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_raid_rooms`
--

INSERT INTO `user_raid_rooms` (`id`, `room_id`, `user_id`, `role`, `joined_at`) VALUES
(1, 1, 1, 'owner', '2025-08-28 10:21:19'),
(2, 2, 1, 'owner', '2025-08-28 10:23:43'),
(5, 1, 2, 'member', '2025-08-28 10:39:22'),
(6, 3, 1, 'owner', '2025-08-28 11:09:01'),
(7, 4, 1, 'owner', '2025-08-28 11:09:14'),
(8, 5, 1, 'owner', '2025-08-28 11:12:59'),
(9, 6, 1, 'owner', '2025-08-28 11:13:01'),
(10, 7, 1, 'owner', '2025-08-28 11:13:04'),
(11, 8, 1, 'owner', '2025-08-28 11:13:05'),
(12, 9, 1, 'owner', '2025-08-28 11:13:05'),
(13, 10, 1, 'owner', '2025-08-28 11:24:26'),
(14, 11, 1, 'owner', '2025-08-28 12:39:54'),
(15, 12, 2, 'owner', '2025-08-28 12:40:47'),
(16, 8, 2, 'member', '2025-08-28 12:40:52'),
(17, 7, 2, 'member', '2025-08-28 12:40:58'),
(18, 3, 2, 'member', '2025-08-28 12:44:36'),
(19, 9, 2, 'member', '2025-08-28 12:44:49'),
(20, 2, 2, 'member', '2025-08-28 12:46:59');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
