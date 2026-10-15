-- Chunked starter database for phpMyAdmin (MySQL / MariaDB, InnoDB).
-- Paste this whole file into phpMyAdmin's SQL tab for a fresh local prototype.
-- Safe to run again: tables are preserved and demo records are upserted.
-- No table is dropped. Review the CREATE DATABASE / USE names before running.
-- Seed accounts use example.test emails and cannot log in; replace them when
-- a real authentication backend is added. No real payment or AI prompt data is stored.

CREATE DATABASE IF NOT EXISTS `chunked`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `chunked`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `display_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `account_status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_status_created` (`account_status`, `created_at`),
  KEY `ix_users_role` (`role`),
  KEY `ix_users_demo_status` (`is_demo`, `account_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `plan_type` ENUM('free', 'premium') NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `billing_interval` ENUM('none', 'month', 'year') NOT NULL DEFAULT 'none',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plans_name_interval` (`name`, `billing_interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('active', 'trial', 'canceled', 'expired', 'past_due') NOT NULL,
  `starts_at` DATETIME NOT NULL,
  `current_period_end` DATETIME NULL,
  `canceled_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_subscriptions_user_status` (`user_id`, `status`, `current_period_end`),
  KEY `ix_subscriptions_plan_status` (`plan_id`, `status`),
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `template_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(90) NOT NULL,
  `description` VARCHAR(255) NULL,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_categories_name` (`name`),
  UNIQUE KEY `uq_template_categories_slug` (`slug`),
  KEY `ix_template_categories_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `access_type` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `preview_image_url` VARCHAR(2048) NULL,
  `publication_status` ENUM('draft', 'review', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `creator_id` BIGINT UNSIGNED NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `published_at` DATETIME NULL,
  `archived_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_templates_slug` (`slug`),
  KEY `ix_templates_status_updated` (`publication_status`, `updated_at`),
  KEY `ix_templates_category_access_status` (`category_id`, `access_type`, `publication_status`),
  KEY `ix_templates_creator` (`creator_id`),
  KEY `ix_templates_demo` (`is_demo`, `deleted_at`),
  CONSTRAINT `fk_templates_category` FOREIGN KEY (`category_id`) REFERENCES `template_categories` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_templates_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `template_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('task', 'goal', 'milestone', 'habit', 'focus') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `item_data` LONGTEXT NULL COMMENT 'Optional JSON payload; validate JSON in the PHP application for MariaDB compatibility.',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_template_items_order` (`template_id`, `display_order`),
  CONSTRAINT `fk_template_items_template` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `subscription_id` BIGINT UNSIGNED NULL,
  `reference_code` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `status` ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `provider` VARCHAR(80) NULL,
  `processed_at` DATETIME NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transactions_reference` (`reference_code`),
  KEY `ix_transactions_user_date` (`user_id`, `created_at`),
  KEY `ix_transactions_status_date` (`status`, `created_at`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_transactions_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `announcement_key` VARCHAR(100) NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `audience` ENUM('all', 'free', 'premium', 'new_users') NOT NULL DEFAULT 'all',
  `status` ENUM('draft', 'scheduled', 'sent', 'archived') NOT NULL DEFAULT 'draft',
  `scheduled_at` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_announcements_key` (`announcement_key`),
  KEY `ix_announcements_status_schedule` (`status`, `scheduled_at`),
  CONSTRAINT `fk_announcements_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_usage_daily` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usage_date` DATE NOT NULL,
  `requests_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `success_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `error_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `average_latency_ms` INT UNSIGNED NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_usage_date` (`usage_date`),
  KEY `ix_ai_usage_demo_date` (`is_demo`, `usage_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action_type` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `metadata` LONGTEXT NULL COMMENT 'Optional JSON metadata; do not store passwords, payment details, or private reflection content.',
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_admin_audit_created` (`created_at`),
  KEY `ix_admin_audit_entity` (`entity_type`, `entity_id`),
  KEY `ix_admin_audit_actor` (`admin_user_id`, `created_at`),
  CONSTRAINT `fk_admin_audit_actor` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Starter plans (prices are examples; change them before taking payments).
INSERT INTO `plans` (`name`, `plan_type`, `price`, `currency`, `billing_interval`, `is_active`)
VALUES
  ('Free', 'free', 0.00, 'USD', 'none', 1),
  ('Premium monthly', 'premium', 4.99, 'USD', 'month', 1),
  ('Premium yearly', 'premium', 49.99, 'USD', 'year', 1)
ON DUPLICATE KEY UPDATE
  `plan_type` = VALUES(`plan_type`), `price` = VALUES(`price`),
  `currency` = VALUES(`currency`), `is_active` = 1;

-- Printable template categories used by the frontend.
INSERT INTO `template_categories` (`name`, `slug`, `description`, `display_order`, `is_active`)
VALUES
  ('DAY', 'day', 'Daily planning and gentle priorities.', 1, 1),
  ('GROW', 'grow', 'Goals, milestones, and habits.', 2, 1),
  ('FOCUS', 'focus', 'Focus sessions and single-task planning.', 3, 1),
  ('Habits', 'habits', 'Printable habit trackers.', 4, 1),
  ('Study', 'study', 'Study plans, revision, and learning.', 5, 1),
  ('Work', 'work', 'Workday planning and project resets.', 6, 1),
  ('Self-care', 'self-care', 'Rest, reflection, and personal care.', 7, 1)
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`), `display_order` = VALUES(`display_order`), `is_active` = 1;

-- Fictional preview accounts. Their password values are intentionally invalid
-- placeholders, so they cannot be used to sign in. Do not use as admin credentials.
INSERT INTO `users` (`display_name`, `email`, `password_hash`, `role`, `account_status`, `is_demo`)
VALUES
  ('Maya Chen', 'maya.chen@example.test', '!DEMO_NO_LOGIN!', 'user', 'active', 1),
  ('Omar Haddad', 'omar.haddad@example.test', '!DEMO_NO_LOGIN!', 'user', 'active', 1),
  ('Leah Brooks', 'leah.brooks@example.test', '!DEMO_NO_LOGIN!', 'user', 'active', 1),
  ('Sam Rivera', 'sam.rivera@example.test', '!DEMO_NO_LOGIN!', 'user', 'active', 1),
  ('Demo Admin', 'demo-admin@example.test', '!DEMO_NO_LOGIN!', 'admin', 'suspended', 1)
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`), `is_demo` = 1;

-- Sample premium subscriptions for fictional accounts. Free demo users have
-- no subscription rows; the reporting query below treats them as Free.
INSERT INTO `subscriptions` (`user_id`, `plan_id`, `status`, `starts_at`, `current_period_end`, `is_demo`)
SELECT u.`id`, p.`id`, 'active', CURRENT_TIMESTAMP,
       DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY), 1
FROM `users` AS u
JOIN `plans` AS p ON p.`name` = 'Premium monthly'
WHERE u.`email` = 'omar.haddad@example.test'
  AND NOT EXISTS (
    SELECT 1 FROM `subscriptions` AS existing
    WHERE existing.`user_id` = u.`id` AND existing.`plan_id` = p.`id` AND existing.`is_demo` = 1
  );

INSERT INTO `subscriptions` (`user_id`, `plan_id`, `status`, `starts_at`, `current_period_end`, `is_demo`)
SELECT u.`id`, p.`id`, 'active', CURRENT_TIMESTAMP,
       DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 365 DAY), 1
FROM `users` AS u
JOIN `plans` AS p ON p.`name` = 'Premium yearly'
WHERE u.`email` = 'sam.rivera@example.test'
  AND NOT EXISTS (
    SELECT 1 FROM `subscriptions` AS existing
    WHERE existing.`user_id` = u.`id` AND existing.`plan_id` = p.`id` AND existing.`is_demo` = 1
  );

-- Sample templates. `slug` is the stable unique key, making this seed rerunnable.
INSERT INTO `templates`
  (`title`, `slug`, `description`, `category_id`, `access_type`, `price`, `publication_status`, `creator_id`, `is_demo`, `published_at`)
SELECT seed.`title`, seed.`slug`, seed.`description`, c.`id`, seed.`access_type`, seed.`price`, seed.`publication_status`, NULL, 1,
       CASE WHEN seed.`publication_status` = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END
FROM (
  SELECT 'A Calm Day Plan' AS `title`, 'a-calm-day-plan' AS `slug`, 'Shape a manageable day with thoughtful priorities and room to pause.' AS `description`, 'day' AS `category_slug`, 'free' AS `access_type`, 0.00 AS `price`, 'published' AS `publication_status`
  UNION ALL SELECT 'Study Week', 'study-week', 'A flexible study rhythm with focused sessions, review, and rest built in.', 'study', 'free', 0.00, 'published'
  UNION ALL SELECT 'Gentle Morning Routine', 'gentle-morning-routine', 'Start with a few easy habits that help the morning feel more settled.', 'habits', 'free', 0.00, 'published'
  UNION ALL SELECT 'Quiet Focus Sprint', 'quiet-focus-sprint', 'A printable focus guide for one meaningful task at a time.', 'focus', 'premium', 4.99, 'published'
  UNION ALL SELECT 'Workday Reset', 'workday-reset', 'A practical reset for planning priorities and clearing mental clutter.', 'work', 'premium', 5.99, 'review'
  UNION ALL SELECT 'Small Self-care Menu', 'small-self-care-menu', 'A gentle menu of simple ways to make a little room for yourself.', 'self-care', 'free', 0.00, 'draft'
) AS seed
JOIN `template_categories` AS c ON c.`slug` = seed.`category_slug`
LEFT JOIN `templates` AS already_seeded ON already_seeded.`slug` = seed.`slug`
WHERE already_seeded.`id` IS NULL;

-- Example template contents (these are printable template prompts, not user data).
INSERT INTO `template_items` (`template_id`, `item_type`, `title`, `description`, `display_order`)
SELECT t.`id`, seed.`item_type`, seed.`title`, seed.`description`, seed.`display_order`
FROM (
  SELECT 'a-calm-day-plan' AS `template_slug`, 'task' AS `item_type`, 'Choose three gentle priorities' AS `title`, 'Pick a small number of meaningful tasks for today.' AS `description`, 1 AS `display_order`
  UNION ALL SELECT 'a-calm-day-plan', 'focus', 'Leave room to pause', 'Add breathing space between planned tasks.', 2
  UNION ALL SELECT 'a-calm-day-plan', 'task', 'Notice one small win', 'Write down one thing that moved forward.', 3
  UNION ALL SELECT 'study-week', 'task', 'Plan focused study blocks', 'Choose realistic sessions and include breaks.', 1
  UNION ALL SELECT 'study-week', 'task', 'Review the week', 'Set aside time to revisit key ideas.', 2
  UNION ALL SELECT 'study-week', 'focus', 'Choose a stopping point', 'Keep the plan sustainable.', 3
) AS seed
JOIN `templates` AS t ON t.`slug` = seed.`template_slug`
LEFT JOIN `template_items` AS existing ON existing.`template_id` = t.`id` AND existing.`title` = seed.`title`
WHERE existing.`id` IS NULL;

-- Example transaction rows use fictional references and no card/bank data.
INSERT INTO `transactions`
  (`user_id`, `subscription_id`, `reference_code`, `amount`, `currency`, `status`, `provider`, `processed_at`, `is_demo`)
SELECT u.`id`, s.`id`, seed.`reference_code`, seed.`amount`, 'USD', seed.`status`, 'demo', CURRENT_TIMESTAMP, 1
FROM (
  SELECT 'omar.haddad@example.test' AS `email`, 'DEMO-TX-1048' AS `reference_code`, 4.99 AS `amount`, 'succeeded' AS `status`
  UNION ALL SELECT 'sam.rivera@example.test', 'DEMO-TX-1047', 49.99, 'succeeded'
  UNION ALL SELECT 'omar.haddad@example.test', 'DEMO-TX-1046', 4.99, 'refunded'
) AS seed
JOIN `users` AS u ON u.`email` = seed.`email`
LEFT JOIN `subscriptions` AS s ON s.`user_id` = u.`id` AND s.`is_demo` = 1
LEFT JOIN `transactions` AS existing ON existing.`reference_code` = seed.`reference_code`
WHERE existing.`id` IS NULL;

-- Example announcements are drafts or clearly marked as demo activity; none are sent.
INSERT INTO `announcements`
  (`announcement_key`, `title`, `message`, `audience`, `status`, `created_by`, `is_demo`)
VALUES
  ('demo-weekly-planning', 'A calmer way to plan your week', 'A fictional preview announcement for the admin interface.', 'all', 'draft', NULL, 1),
  ('demo-study-printables', 'New printable study templates', 'A fictional sample announcement. It has not been delivered to users.', 'all', 'draft', NULL, 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`), `message` = VALUES(`message`), `is_demo` = 1;

-- Aggregate-only AI metrics: deliberately no prompts, response text, or user content.
INSERT INTO `ai_usage_daily` (`usage_date`, `requests_count`, `success_count`, `error_count`, `average_latency_ms`, `is_demo`)
VALUES
  (CURRENT_DATE - INTERVAL 6 DAY, 920, 900, 20, 1810, 1),
  (CURRENT_DATE - INTERVAL 5 DAY, 1210, 1190, 20, 1760, 1),
  (CURRENT_DATE - INTERVAL 4 DAY, 1080, 1065, 15, 1790, 1),
  (CURRENT_DATE - INTERVAL 3 DAY, 1420, 1390, 30, 1840, 1),
  (CURRENT_DATE - INTERVAL 2 DAY, 1310, 1290, 20, 1770, 1),
  (CURRENT_DATE - INTERVAL 1 DAY, 1580, 1545, 35, 1880, 1),
  (CURRENT_DATE, 900, 885, 15, 1800, 1)
ON DUPLICATE KEY UPDATE
  `requests_count` = VALUES(`requests_count`), `success_count` = VALUES(`success_count`),
  `error_count` = VALUES(`error_count`), `average_latency_ms` = VALUES(`average_latency_ms`), `is_demo` = 1;

-- A couple of sample audit entries. Production audit records must be written
-- by trusted server code, never by the browser.
INSERT INTO `admin_audit_logs` (`admin_user_id`, `action_type`, `entity_type`, `entity_id`, `metadata`, `is_demo`)
SELECT u.`id`, seed.`action_type`, seed.`entity_type`, t.`id`, seed.`metadata`, 1
FROM (
  SELECT 'publish' AS `action_type`, 'template' AS `entity_type`, 'a-calm-day-plan' AS `template_slug`, '{"source":"SQL demo seed"}' AS `metadata`
  UNION ALL SELECT 'create', 'template', 'study-week', '{"source":"SQL demo seed"}'
) AS seed
JOIN `users` AS u ON u.`email` = 'demo-admin@example.test'
JOIN `templates` AS t ON t.`slug` = seed.`template_slug`
LEFT JOIN `admin_audit_logs` AS existing ON existing.`admin_user_id` = u.`id`
  AND existing.`action_type` = seed.`action_type` AND existing.`entity_type` = seed.`entity_type`
  AND existing.`entity_id` = t.`id` AND existing.`is_demo` = 1
WHERE existing.`id` IS NULL;

-- Quick check: demo users by plan. Remove `AND u.is_demo = 1` to include all accounts.
SELECT
  COUNT(*) AS total_demo_active_users,
  SUM(CASE WHEN premium.user_id IS NULL THEN 1 ELSE 0 END) AS demo_free_users,
  SUM(CASE WHEN premium.user_id IS NOT NULL THEN 1 ELSE 0 END) AS demo_premium_users
FROM `users` AS u
LEFT JOIN (
  SELECT DISTINCT s.`user_id`
  FROM `subscriptions` AS s
  JOIN `plans` AS p ON p.`id` = s.`plan_id`
  WHERE p.`plan_type` = 'premium' AND p.`is_active` = 1
    AND s.`status` IN ('active', 'trial')
    AND (s.`current_period_end` IS NULL OR s.`current_period_end` >= CURRENT_TIMESTAMP)
) AS premium ON premium.`user_id` = u.`id`
WHERE u.`account_status` = 'active' AND u.`is_demo` = 1;

-- Quick check: templates by status.
SELECT `publication_status`, COUNT(*) AS `template_count`
FROM `templates`
WHERE `deleted_at` IS NULL
GROUP BY `publication_status`
ORDER BY `publication_status`;

-- Template library query for the future PHP page (use prepared LIMIT/OFFSET).
-- SELECT t.id, t.title, t.slug, t.description, c.name AS category,
--        t.access_type, t.price, t.currency, t.preview_image_url,
--        t.publication_status, u.display_name AS creator, t.created_at, t.updated_at
-- FROM templates AS t
-- JOIN template_categories AS c ON c.id = t.category_id
-- LEFT JOIN users AS u ON u.id = t.creator_id
-- WHERE t.deleted_at IS NULL
-- ORDER BY t.updated_at DESC
-- LIMIT ? OFFSET ?;

-- For production: generate password hashes with PHP password_hash(), create
-- the first admin deliberately, remove demo rows, use prepared statements,
-- enforce authorization on the server, and write audit records transactionally.
