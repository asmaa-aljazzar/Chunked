-- CHUNKED MVP DATABASE
-- 15 core tables for the first backend milestone.
-- Compatible with XAMPP MariaDB 10.4 and MySQL 8.x.
-- Imports into a separate `chunked_mvp` database and never drops existing data.
-- Demo passwords are invalid placeholders; these accounts cannot sign in.
-- Validate ownership, dates, permissions, and habit streaks in the PHP backend.

CREATE DATABASE IF NOT EXISTS `chunked_mvp`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `chunked_mvp`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `display_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `account_status` ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  `email_verified_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_status_role` (`account_status`,`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `plan_type` ENUM('free','premium') NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `billing_interval` ENUM('none','month','year') NOT NULL DEFAULT 'none',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plans_name_interval` (`name`,`billing_interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('active','trial','canceled','expired','past_due') NOT NULL,
  `started_at` DATETIME NOT NULL,
  `ends_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_subscriptions_user_status` (`user_id`,`status`,`ends_at`),
  KEY `ix_subscriptions_plan_status` (`plan_id`,`status`),
  CONSTRAINT `fk_mvp_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_mvp_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `themes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `theme_key` VARCHAR(40) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `theme_type` ENUM('base','seasonal','style','event') NOT NULL DEFAULT 'base',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mvp_themes_key` (`theme_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `theme_id` BIGINT UNSIGNED NULL,
  `language` ENUM('en','ar') NOT NULL DEFAULT 'en',
  `timezone` VARCHAR(80) NOT NULL DEFAULT 'Asia/Amman',
  `day_organization` ENUM('prayer','custom') NOT NULL DEFAULT 'prayer',
  `prayer_times` JSON NULL,
  `prayer_offsets` JSON NULL,
  `enabled_modules` JSON NULL,
  `onboarded` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_mvp_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_settings_theme` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `goals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `parent_goal_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('active','paused','completed','archived') NOT NULL DEFAULT 'active',
  `progress` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `target_date` DATE NULL,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_goals_user_status` (`user_id`,`status`,`target_date`),
  CONSTRAINT `fk_mvp_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_goals_parent` FOREIGN KEY (`parent_goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `period_key` VARCHAR(40) NULL COMMENT 'fajr, dhuhr, asr, maghrib, isha, or custom key',
  `planned_date` DATE NOT NULL,
  `priority` ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  `effort_minutes` SMALLINT UNSIGNED NULL,
  `status` ENUM('open','done','postponed','archived') NOT NULL DEFAULT 'open',
  `completed_at` DATETIME NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_tasks_user_date_status` (`user_id`,`planned_date`,`status`,`sort_order`),
  KEY `ix_tasks_goal` (`goal_id`),
  CONSTRAINT `fk_mvp_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_tasks_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `name` VARCHAR(140) NOT NULL,
  `description` TEXT NULL,
  `schedule_type` ENUM('daily','selected_days') NOT NULL DEFAULT 'daily',
  `schedule_days` JSON NULL COMMENT 'Array of ISO weekdays 1-7; used for selected_days',
  `start_date` DATE NOT NULL,
  `status` ENUM('active','paused','archived') NOT NULL DEFAULT 'active',
  `longest_streak` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_habits_user_status` (`user_id`,`status`),
  CONSTRAINT `fk_mvp_habits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_habits_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `habit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `habit_id` BIGINT UNSIGNED NOT NULL,
  `log_date` DATE NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mvp_habit_log_date` (`habit_id`,`log_date`),
  CONSTRAINT `fk_mvp_habit_logs_habit` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_choices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `goal_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_focus_choices_user_active` (`user_id`,`is_active`),
  CONSTRAINT `fk_mvp_focus_choices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_focus_choices_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_checkins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `focus_choice_id` BIGINT UNSIGNED NOT NULL,
  `checkin_date` DATE NOT NULL,
  `readiness` ENUM('ready','prepare','blocked') NOT NULL,
  `blocker_note` TEXT NULL,
  `next_step` TEXT NULL,
  `estimated_minutes` SMALLINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mvp_focus_checkin_day` (`user_id`,`focus_choice_id`,`checkin_date`),
  CONSTRAINT `fk_mvp_focus_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_focus_checkins_choice` FOREIGN KEY (`focus_choice_id`) REFERENCES `focus_choices` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `focus_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `focus_choice_id` BIGINT UNSIGNED NULL,
  `task_id` BIGINT UNSIGNED NULL,
  `session_type` ENUM('focus','break') NOT NULL DEFAULT 'focus',
  `status` ENUM('running','completed','stopped') NOT NULL DEFAULT 'completed',
  `planned_seconds` INT UNSIGNED NULL,
  `elapsed_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_focus_sessions_user_started` (`user_id`,`started_at`),
  CONSTRAINT `fk_mvp_focus_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_mvp_focus_sessions_choice` FOREIGN KEY (`focus_choice_id`) REFERENCES `focus_choices` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_mvp_focus_sessions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reflections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `entry_date` DATE NOT NULL,
  `body` TEXT NOT NULL,
  `mood` VARCHAR(40) NULL,
  `energy` VARCHAR(40) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_reflections_user_date` (`user_id`,`entry_date`),
  CONSTRAINT `fk_mvp_reflections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `template_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(110) NOT NULL,
  `description` VARCHAR(500) NULL,
  `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mvp_template_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `slug` VARCHAR(140) NOT NULL,
  `title_en` VARCHAR(180) NOT NULL,
  `title_ar` VARCHAR(180) NULL,
  `description` TEXT NULL,
  `language` ENUM('en','ar','bilingual') NOT NULL DEFAULT 'en',
  `access_type` ENUM('free','premium') NOT NULL DEFAULT 'free',
  `file_path` VARCHAR(500) NOT NULL COMMENT 'Private PDF storage path; serve through an authorized backend endpoint',
  `preview_image` VARCHAR(500) NULL,
  `publication_status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mvp_templates_slug` (`slug`),
  KEY `ix_mvp_templates_catalog` (`publication_status`,`category_id`,`access_type`),
  CONSTRAINT `fk_mvp_templates_category` FOREIGN KEY (`category_id`) REFERENCES `template_categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_mvp_templates_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Baseline catalog and clearly fictional sample records.
INSERT INTO `plans` (`name`,`plan_type`,`price`,`currency`,`billing_interval`) VALUES
  ('Free','free',0.00,'USD','none'),
  ('Premium monthly','premium',4.99,'USD','month'),
  ('Premium yearly','premium',49.99,'USD','year')
ON DUPLICATE KEY UPDATE `plan_type`=VALUES(`plan_type`),`price`=VALUES(`price`),`currency`=VALUES(`currency`);

INSERT INTO `themes` (`theme_key`,`name`,`theme_type`) VALUES
  ('light','Daylight','base'),('dark','Night','base'),('autumn','Autumn','seasonal'),
  ('summer','Summer','seasonal'),('spring','Spring','seasonal'),('winter','Winter','seasonal'),
  ('gothic','Gothic','style'),('ramadan','Ramadan','event'),('eid','Eid','event')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`theme_type`=VALUES(`theme_type`);

INSERT INTO `template_categories` (`name`,`slug`,`description`,`display_order`) VALUES
  ('DAY','day','Daily and chunk planning printables.',1),
  ('GROW','grow','Goals and personal growth printables.',2),
  ('FOCUS','focus','Focus session printables.',3),
  ('Habits','habits','Habit tracking printables.',4),
  ('Study','study','Study planning printables.',5),
  ('Work','work','Work planning printables.',6),
  ('Self-care','self-care','Gentle self-care printables.',7)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`description`=VALUES(`description`),`display_order`=VALUES(`display_order`);

-- Demo logins use non-hash markers so they cannot authenticate.
INSERT INTO `users` (`display_name`,`email`,`password_hash`,`role`,`account_status`) VALUES
  ('Chunked Admin','admin@chunked.example.test','DEMO_INVALID_PASSWORD','admin','active'),
  ('Demo Free User','free@chunked.example.test','DEMO_INVALID_PASSWORD','user','active'),
  ('Demo Premium User','premium@chunked.example.test','DEMO_INVALID_PASSWORD','user','active')
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`),`role`=VALUES(`role`),`account_status`=VALUES(`account_status`);

INSERT INTO `subscriptions` (`user_id`,`plan_id`,`status`,`started_at`,`ends_at`)
SELECT u.`id`,p.`id`,'active',CURRENT_TIMESTAMP,NULL
FROM `users` u JOIN `plans` p ON p.`plan_type`='free'
WHERE u.`email`='free@chunked.example.test' AND p.`billing_interval`='none'
AND NOT EXISTS (SELECT 1 FROM `subscriptions` s WHERE s.`user_id`=u.`id` AND s.`status`='active');

INSERT INTO `subscriptions` (`user_id`,`plan_id`,`status`,`started_at`,`ends_at`)
SELECT u.`id`,p.`id`,'active',CURRENT_TIMESTAMP,DATE_ADD(CURRENT_TIMESTAMP,INTERVAL 1 MONTH)
FROM `users` u JOIN `plans` p ON p.`name`='Premium monthly'
WHERE u.`email`='premium@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `subscriptions` s WHERE s.`user_id`=u.`id` AND s.`status`='active');

INSERT INTO `user_settings` (`user_id`,`theme_id`,`language`,`timezone`,`enabled_modules`)
SELECT u.`id`,t.`id`,'en','Asia/Amman',JSON_ARRAY('day','grow','focus')
FROM `users` u JOIN `themes` t ON t.`theme_key`='light'
WHERE u.`email` IN ('admin@chunked.example.test','free@chunked.example.test','premium@chunked.example.test')
ON DUPLICATE KEY UPDATE `theme_id`=VALUES(`theme_id`);

INSERT INTO `goals` (`user_id`,`title`,`description`,`status`,`progress`,`target_date`)
SELECT u.`id`,'Build a steady study rhythm','Study in small, repeatable sessions.','active',35,DATE_ADD(CURDATE(),INTERVAL 30 DAY)
FROM `users` u WHERE u.`email`='free@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `goals` g WHERE g.`user_id`=u.`id` AND g.`title`='Build a steady study rhythm');

INSERT INTO `tasks` (`user_id`,`goal_id`,`title`,`description`,`period_key`,`planned_date`,`priority`,`effort_minutes`,`sort_order`)
SELECT u.`id`,g.`id`,'Review one JavaScript concept','A small sample task for the DAY page.','dhuhr',CURDATE(),'high',25,1
FROM `users` u LEFT JOIN `goals` g ON g.`user_id`=u.`id` AND g.`title`='Build a steady study rhythm'
WHERE u.`email`='free@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `tasks` t WHERE t.`user_id`=u.`id` AND t.`title`='Review one JavaScript concept' AND t.`planned_date`=CURDATE());

INSERT INTO `habits` (`user_id`,`name`,`description`,`schedule_type`,`schedule_days`,`start_date`,`status`)
SELECT u.`id`,'Read for 15 minutes','A gentle daily reading habit.','daily',JSON_ARRAY(),CURDATE(),'active'
FROM `users` u WHERE u.`email`='free@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `habits` h WHERE h.`user_id`=u.`id` AND h.`name`='Read for 15 minutes');

INSERT INTO `habit_logs` (`habit_id`,`log_date`,`is_completed`,`completed_at`)
SELECT h.`id`,CURDATE(),1,CURRENT_TIMESTAMP FROM `habits` h
JOIN `users` u ON u.`id`=h.`user_id`
WHERE u.`email`='free@chunked.example.test' AND h.`name`='Read for 15 minutes'
ON DUPLICATE KEY UPDATE `is_completed`=VALUES(`is_completed`),`completed_at`=VALUES(`completed_at`);

INSERT INTO `focus_choices` (`user_id`,`goal_id`,`title`,`description`)
SELECT u.`id`,g.`id`,'Improve my JavaScript','Continue one concept at a time.'
FROM `users` u LEFT JOIN `goals` g ON g.`user_id`=u.`id` AND g.`title`='Build a steady study rhythm'
WHERE u.`email`='free@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `focus_choices` f WHERE f.`user_id`=u.`id` AND f.`title`='Improve my JavaScript');

INSERT INTO `focus_checkins` (`user_id`,`focus_choice_id`,`checkin_date`,`readiness`,`next_step`,`estimated_minutes`)
SELECT u.`id`,f.`id`,CURDATE(),'ready','Review one JavaScript concept',25
FROM `users` u JOIN `focus_choices` f ON f.`user_id`=u.`id` AND f.`title`='Improve my JavaScript'
WHERE u.`email`='free@chunked.example.test'
ON DUPLICATE KEY UPDATE `readiness`=VALUES(`readiness`),`next_step`=VALUES(`next_step`);

INSERT INTO `reflections` (`user_id`,`entry_date`,`body`,`mood`,`energy`)
SELECT u.`id`,CURDATE(),'A small step still counts.','calm','steady'
FROM `users` u WHERE u.`email`='free@chunked.example.test'
AND NOT EXISTS (SELECT 1 FROM `reflections` r WHERE r.`user_id`=u.`id` AND r.`body`='A small step still counts.' AND r.`entry_date`=CURDATE());

INSERT INTO `templates` (`category_id`,`created_by`,`slug`,`title_en`,`title_ar`,`description`,`language`,`access_type`,`file_path`,`publication_status`)
SELECT c.`id`,u.`id`,'calm-day-plan','A Calm Day Plan','خطة يوم هادئ','A printable daily plan with room to pause.','bilingual','free','private/templates/calm-day-plan.pdf','published'
FROM `template_categories` c JOIN `users` u ON u.`email`='admin@chunked.example.test'
WHERE c.`slug`='day' AND NOT EXISTS (SELECT 1 FROM `templates` t WHERE t.`slug`='calm-day-plan');

INSERT INTO `templates` (`category_id`,`created_by`,`slug`,`title_en`,`title_ar`,`description`,`language`,`access_type`,`file_path`,`publication_status`)
SELECT c.`id`,u.`id`,'gentle-habit-tracker','Gentle Habit Tracker','متتبع العادات اللطيف','A printable tracker for gentle consistency.','bilingual','free','private/templates/gentle-habit-tracker.pdf','published'
FROM `template_categories` c JOIN `users` u ON u.`email`='admin@chunked.example.test'
WHERE c.`slug`='habits' AND NOT EXISTS (SELECT 1 FROM `templates` t WHERE t.`slug`='gentle-habit-tracker');

-- MVP scope deliberately defers milestones, custom period tables, download history,
-- purchases/transactions, notifications, AI conversations, and audit history.
-- Add these in later migrations only when their features are implemented.
