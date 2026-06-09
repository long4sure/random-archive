-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 19, 2026 at 07:12 AM
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
-- Database: `lipas_volpas_db`
--
-- CREATE DATABASE IF NOT EXISTS `lipas_volpas_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- USE `lipas_volpas_db`;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `role` varchar(20) NOT NULL,
  `action` varchar(50) NOT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `a_report_line`
--

CREATE TABLE `a_report_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `SHIFT_OUTPUT` int(11) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` int(11) DEFAULT NULL,
  `TARGET_RUNRATE` decimal(10,2) DEFAULT NULL,
  `WTG_RUNRATE` decimal(10,2) DEFAULT NULL,
  `LIPAS_COUNT` char(1) DEFAULT NULL,
  `VOLPAS` decimal(10,4) DEFAULT NULL,
  `REPORT_DATE` date DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL,
  `SHIFT_NUMBER` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `a_summary_line`
--

CREATE TABLE `a_summary_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(100) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` varchar(255) DEFAULT NULL,
  `1ST_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `b_report_line`
--

CREATE TABLE `b_report_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `SHIFT_OUTPUT` int(11) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` int(11) DEFAULT NULL,
  `TARGET_RUNRATE` decimal(10,2) DEFAULT NULL,
  `WTG_RUNRATE` decimal(10,2) DEFAULT NULL,
  `LIPAS_COUNT` char(1) DEFAULT NULL,
  `VOLPAS` decimal(10,4) DEFAULT NULL,
  `REPORT_DATE` date DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL,
  `SHIFT_NUMBER` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `b_summary_line`
--

CREATE TABLE `b_summary_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(100) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` varchar(255) DEFAULT NULL,
  `1ST_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `c_report_line`
--

CREATE TABLE `c_report_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `SHIFT_OUTPUT` int(11) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` int(11) DEFAULT NULL,
  `TARGET_RUNRATE` decimal(10,2) DEFAULT NULL,
  `WTG_RUNRATE` decimal(10,2) DEFAULT NULL,
  `LIPAS_COUNT` char(1) DEFAULT NULL,
  `VOLPAS` decimal(10,4) DEFAULT NULL,
  `REPORT_DATE` date DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL,
  `SHIFT_NUMBER` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `c_summary_line`
--

CREATE TABLE `c_summary_line` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(100) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `QUANTITY` int(11) DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL,
  `CUMULATIVE_OUTPUT` varchar(255) DEFAULT NULL,
  `1ST_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_1` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_2` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_3` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_4` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_5` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_6` int(11) DEFAULT NULL,
  `1ST_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `2ND_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `3RD_SHIFT_DAY_7` int(11) DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lipas_record`
--

CREATE TABLE `lipas_record` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_1` int(11) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_1` int(11) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_2` int(11) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_2` int(11) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_3` int(11) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_3` int(11) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_4` int(11) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_4` int(11) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_5` int(11) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_5` int(11) DEFAULT NULL,
  `TOTAL_PLAN` int(11) DEFAULT NULL,
  `TOTAL_ACTUAL` int(11) DEFAULT NULL,
  `PERCENTAGE` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sku_master`
--

CREATE TABLE `sku_master` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `SKU_CODE` varchar(50) DEFAULT NULL,
  `SKU_DESCRIPTION` text DEFAULT NULL,
  `UOM` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL DEFAULT '',
  `last_name` varchar(50) NOT NULL DEFAULT '',
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('system_admin','admin','data_entry','viewer') NOT NULL DEFAULT 'viewer',
  `team` varchar(10) DEFAULT NULL,
  `line` varchar(50) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` varchar(50) DEFAULT NULL,
  `approved_date` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved') DEFAULT 'approved',
  `session_token` varchar(128) DEFAULT NULL,
  `last_active` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `volpas_record`
--

CREATE TABLE `volpas_record` (
  `id` int(11) NOT NULL,
  `TEAM` varchar(10) DEFAULT NULL,
  `MONTH` varchar(20) DEFAULT NULL,
  `YEAR` int(11) DEFAULT NULL,
  `OPERATING_DAYS_START` date DEFAULT NULL,
  `OPERATING_DAYS_END` date DEFAULT NULL,
  `LINE` varchar(50) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_1` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_1` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_2` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_2` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_3` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_3` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_4` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_4` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_PLAN_5` decimal(12,2) DEFAULT NULL,
  `OPERATING_DAYS_ACTUAL_5` decimal(12,2) DEFAULT NULL,
  `TOTAL_PLAN` decimal(12,2) DEFAULT NULL,
  `TOTAL_ACTUAL` decimal(12,2) DEFAULT NULL,
  `PERCENTAGE` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Indexes for dumped tables
--

-- Indexes for table `audit_log`
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_date` (`created_at`);

-- Indexes for table `a_report_line`
ALTER TABLE `a_report_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `a_summary_line`
ALTER TABLE `a_summary_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `b_report_line`
ALTER TABLE `b_report_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `b_summary_line`
ALTER TABLE `b_summary_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `c_report_line`
ALTER TABLE `c_report_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `c_summary_line`
ALTER TABLE `c_summary_line`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ops_days` (`OPERATING_DAYS_START`,`OPERATING_DAYS_END`),
  ADD KEY `idx_team_line_sku_month_year` (`TEAM`,`LINE`,`SKU_CODE`,`MONTH`,`YEAR`);

-- Indexes for table `lipas_record`
ALTER TABLE `lipas_record`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_lipas_unique` (`TEAM`,`LINE`,`MONTH`,`YEAR`,`OPERATING_DAYS_START`);

-- Indexes for table `sku_master`
ALTER TABLE `sku_master`
  ADD PRIMARY KEY (`id`);

-- Indexes for table `users`
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_session_token` (`session_token`),
  ADD KEY `idx_approval_status` (`approval_status`);

-- Indexes for table `volpas_record`
ALTER TABLE `volpas_record`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_volpas_unique` (`TEAM`,`LINE`,`MONTH`,`YEAR`,`OPERATING_DAYS_START`);

-- --------------------------------------------------------

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE `audit_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `a_report_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `a_summary_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `b_report_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `b_summary_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `c_report_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `c_summary_line`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `lipas_record`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sku_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `volpas_record`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Triggers
--

DELIMITER $$
CREATE TRIGGER `trg_a_summary_line_cumulative_insert` BEFORE INSERT ON `a_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT =
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_a_summary_line_cumulative_update` BEFORE UPDATE ON `a_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT = 
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_b_summary_line_cumulative_insert` BEFORE INSERT ON `b_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT = 
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_b_summary_line_cumulative_update` BEFORE UPDATE ON `b_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT = 
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_c_summary_line_cumulative_insert` BEFORE INSERT ON `c_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT = 
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_c_summary_line_cumulative_update` BEFORE UPDATE ON `c_summary_line` FOR EACH ROW BEGIN
    SET NEW.CUMULATIVE_OUTPUT = 
        COALESCE(NEW.1ST_SHIFT_DAY_1,0) + COALESCE(NEW.2ND_SHIFT_DAY_1,0) + COALESCE(NEW.3RD_SHIFT_DAY_1,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_2,0) + COALESCE(NEW.2ND_SHIFT_DAY_2,0) + COALESCE(NEW.3RD_SHIFT_DAY_2,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_3,0) + COALESCE(NEW.2ND_SHIFT_DAY_3,0) + COALESCE(NEW.3RD_SHIFT_DAY_3,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_4,0) + COALESCE(NEW.2ND_SHIFT_DAY_4,0) + COALESCE(NEW.3RD_SHIFT_DAY_4,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_5,0) + COALESCE(NEW.2ND_SHIFT_DAY_5,0) + COALESCE(NEW.3RD_SHIFT_DAY_5,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_6,0) + COALESCE(NEW.2ND_SHIFT_DAY_6,0) + COALESCE(NEW.3RD_SHIFT_DAY_6,0) +
        COALESCE(NEW.1ST_SHIFT_DAY_7,0) + COALESCE(NEW.2ND_SHIFT_DAY_7,0) + COALESCE(NEW.3RD_SHIFT_DAY_7,0);
END$$
DELIMITER ;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;