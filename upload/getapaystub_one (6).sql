-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 28, 2026 at 05:18 PM
-- Server version: 10.11.11-MariaDB-cll-lve
-- PHP Version: 8.3.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `getapaystub_one`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(2, 'Admin', 'getapaystub@gmail.com', '$2y$10$wH8mPp9zE6R0wYxYpX1J1u8mQ3GmK8Yw0m3m0QY7m6vY8g9kQzG3K', '2026-02-22 19:58:23');

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `meta_description` varchar(255) NOT NULL,
  `featured_image` varchar(255) DEFAULT 'default-blog.jpg',
  `status` enum('published','draft') DEFAULT 'published',
  `views` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `slug`, `content`, `meta_description`, `featured_image`, `status`, `views`, `created_at`) VALUES
(1, 'How to Get a Pay Stub Online in Minutes (Fast & Secure)', 'how-to-get-pay-stub-online', '<p data-path-to-node=\"7\"><strong data-path-to-node=\"7\" data-index-in-node=\"0\">Why Do You Need a Pay Stub?</strong></p>\r\n<p data-path-to-node=\"8\">Whether you are trying to rent a new apartment, apply for an auto loan, or simply keep track of your personal finances, a pay stub is your most vital financial document. It acts as verified proof of income, showing exactly how much you earn and what taxes have been deducted.</p>\r\n<p data-path-to-node=\"9\">But what if your employer doesn\'t provide digital pay stubs? Or what if you are a freelancer, an independent contractor, or a small business owner?</p>\r\n<p data-path-to-node=\"10\">In the past, generating a professional pay stub meant hiring an expensive accountant or struggling with confusing Excel templates. Today, learning how to get a pay stub online is easier, faster, and more secure than ever before.</p>\r\n<p data-path-to-node=\"11\"><strong data-path-to-node=\"11\" data-index-in-node=\"0\">The Easiest Way to Generate a Pay Stub Online</strong></p>\r\n<p data-path-to-node=\"12\">You don\'t need to be a math genius or a tax professional to create accurate financial documents. By using a professional document generation service like <strong data-path-to-node=\"12\" data-index-in-node=\"154\">Get A Paystub</strong>, you can have your documents ready in three simple steps:</p>\r\n<p data-path-to-node=\"13\"><strong data-path-to-node=\"13\" data-index-in-node=\"0\">1. Enter Your Basic Information</strong> Start by selecting the type of document you need (e.g., standard pay stub, W-2, or 1099 form). You will need to input basic details such as your company name, your personal name, your salary or hourly rate, and the pay period dates.</p>\r\n<p data-path-to-node=\"14\"><strong data-path-to-node=\"14\" data-index-in-node=\"0\">2. Let the System Do the Math</strong> A high-quality pay stub generator doesn\'t just put your numbers on a piece of paper; it calculates everything for you. The system will automatically calculate your gross pay, state taxes, federal taxes, Medicare, and Social Security deductions based on the latest tax laws.</p>\r\n<p data-path-to-node=\"15\"><strong data-path-to-node=\"15\" data-index-in-node=\"0\">3. Secure Checkout and Instant Download</strong> Once your information is submitted, you proceed to a secure, 256-bit encrypted checkout. After verification, your high-quality, watermark-free PDF document is instantly delivered to your secure dashboard, ready to be downloaded and printed.</p>\r\n<p data-path-to-node=\"16\"><strong data-path-to-node=\"16\" data-index-in-node=\"0\">What Makes a Great Pay Stub Generator?</strong></p>\r\n<p data-path-to-node=\"17\">When searching for online document services, make sure the platform offers:</p>\r\n<ul data-path-to-node=\"18\">\r\n<li>\r\n<p data-path-to-node=\"18,0,0\"><strong data-path-to-node=\"18,0,0\" data-index-in-node=\"0\">100% Accurate Calculations:</strong> Tax brackets change, and your generator needs to be up-to-date to avoid legal and financial headaches.</p>\r\n</li>\r\n<li>\r\n<p data-path-to-node=\"18,1,0\"><strong data-path-to-node=\"18,1,0\" data-index-in-node=\"0\">Professional Templates:</strong> Landlords and banks look for standard, professional layouts. A messy document can lead to instant rejection.</p>\r\n</li>\r\n<li>\r\n<p data-path-to-node=\"18,2,0\"><strong data-path-to-node=\"18,2,0\" data-index-in-node=\"0\">Absolute Privacy:</strong> Your financial data is sensitive. Ensure the service uses SSL encryption and does not store your credit card information.</p>\r\n</li>\r\n</ul>\r\n<p data-path-to-node=\"19\"><strong data-path-to-node=\"19\" data-index-in-node=\"0\">Ready to Create Your Pay Stub?</strong></p>\r\n<p data-path-to-node=\"20\">Don\'t let missing paperwork stand between you and your goals. If you need verified, accurate, and professional proof of income, you are in the right place.</p>\r\n<p data-path-to-node=\"21\">Skip the hassle of manual calculations and expensive accountants.&nbsp;https://getapaystub.com/login.php and get your digital documents delivered instantly!</p>', 'Need proof of income? Learn how to get a pay stub online instantly. Discover the easiest way to generate accurate, secure, and professional pay stubs today.', '1772358538_photo-1554224155-8d04cb21cd6c.avif', 'published', 34, '2026-03-01 09:48:58');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_percent` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_percent`, `status`, `created_at`) VALUES
(1, 'NEW USER', 20, 'Active', '2026-02-28 09:00:36');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `order_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 1, 'Order Placed', 'Your order #1 has been submitted. We will start working soon.', 0, '2026-02-22 19:52:47'),
(2, 1, 1, 'Order Completed', 'Your order #1 is completed. Please login to download your file.', 0, '2026-02-22 20:06:44'),
(5, 2, 3, 'Order Placed', 'Your order #3 has been submitted. We will start working soon.', 0, '2026-02-23 14:11:54'),
(7, 5, 10, 'Order Completed', 'Your order #10 is completed. Please login to download your file.', 0, '2026-02-27 19:51:30');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `details` text DEFAULT NULL,
  `file_uploaded` varchar(255) DEFAULT NULL,
  `completed_file` varchar(255) DEFAULT NULL,
  `status` enum('Pending Payment','Paid','In Progress','Completed','Cancelled') NOT NULL DEFAULT 'Pending Payment',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `payment_provider` varchar(20) DEFAULT NULL,
  `payment_status` varchar(30) DEFAULT NULL,
  `paypal_txn_id` varchar(32) DEFAULT NULL,
  `payer_email` varchar(150) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `ipn_verified` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `service_id`, `details`, `file_uploaded`, `completed_file`, `status`, `total_amount`, `created_at`, `payment_provider`, `payment_status`, `paypal_txn_id`, `payer_email`, `paid_at`, `ipn_verified`) VALUES
(1, 1, 7, 'cdcdrcdcdfcdfcdctd', 'cb8cddd26cb27c76322b2ad79dbd6908.pdf', 'order_1_66d4171b6ba15f605191b69738d1911c.pdf', 'Completed', 70.00, '2026-02-22 19:52:47', NULL, NULL, NULL, NULL, NULL, 0),
(3, 2, 7, 'jvjsfjks', '273938c160c406f8f42a98c087efe00a.pdf', NULL, 'Completed', 70.00, '2026-02-23 14:11:54', NULL, NULL, NULL, NULL, NULL, 0),
(5, 2, 2, 'qqqqqqqqqqqqqqqqqqq', NULL, NULL, 'Cancelled', 30.00, '2026-02-23 14:20:30', 'paypal', NULL, NULL, NULL, NULL, 0),
(6, 2, 16, 'edudedjejededweweed', NULL, NULL, 'Pending Payment', 45.00, '2026-02-23 14:23:31', NULL, NULL, NULL, NULL, NULL, 0),
(7, 2, 15, 'opopoosososososososososossosossosososososs', NULL, NULL, 'In Progress', 20.00, '2026-02-23 14:27:57', NULL, NULL, NULL, NULL, NULL, 0),
(8, 3, 11, 'hcasbjcjckancklanckkjc', 'da1caff945d7aa18e2daf02fc964b052.pdf', NULL, 'Completed', 20.00, '2026-02-23 16:28:43', NULL, NULL, NULL, NULL, NULL, 0),
(10, 5, 15, 'dsfsm,', NULL, 'order_10_53bdbd9cf52d1d58a1a089058b8054a0.pdf', 'Completed', 20.00, '2026-02-23 17:23:30', NULL, NULL, NULL, NULL, NULL, 0),
(11, 5, 17, 'Test', NULL, NULL, 'Completed', 60.00, '2026-02-23 18:16:55', NULL, NULL, NULL, NULL, NULL, 0),
(13, 5, 14, 'najkan\n\n=== PROMO APPLIED ===\nCode: NEW USER (20% OFF)\nDiscount Saved: $6.00', '4a0b91107088e7725ea8cc0dfe6069bc.pdf', 'order_13_5b91bbecbbec680e9921dc31f7681592.pdf', 'Cancelled', 24.00, '2026-02-28 09:07:42', NULL, NULL, NULL, NULL, NULL, 0),
(14, 6, 1, 'David S Neely ss# 9027\r\n449 E Arenas Rd  apt 403 Palm Springs Ca 92262\r\nIncome is about $26,400 and that is from a trus and non taxable. Not sure if I even need to mention that. Then self employment is about $12,000. I need to tax Toney this  amount', NULL, NULL, '', 10.00, '2026-02-28 14:15:57', NULL, NULL, NULL, NULL, NULL, 0),
(15, 5, 1, 'Employee Info: jdahkjah\nEmployer Info: dakdkljdas\nMonthly Income: cajkl\nPay Cycle: Weekly\nStub Dates: cacjcj\nSsn: yy65\n', NULL, NULL, 'Completed', 10.00, '2026-02-28 15:09:11', NULL, NULL, NULL, NULL, NULL, 0),
(16, 5, 12, 'jakcjk', NULL, NULL, '', 25.00, '2026-03-01 16:40:45', NULL, NULL, NULL, NULL, NULL, 0),
(17, 5, 11, 'jasjhajks', NULL, NULL, '', 25.00, '2026-03-01 16:50:07', NULL, NULL, NULL, NULL, NULL, 0),
(18, 5, 11, 'jasjhajks', NULL, NULL, '', 25.00, '2026-03-01 16:58:25', NULL, NULL, NULL, NULL, NULL, 0),
(19, 5, 11, 'jasjhajks', NULL, NULL, '', 25.00, '2026-03-01 17:00:49', NULL, NULL, NULL, NULL, NULL, 0),
(20, 5, 16, 'test', NULL, NULL, '', 50.00, '2026-03-01 17:48:15', NULL, NULL, NULL, NULL, NULL, 0),
(21, 5, 16, 'Test order', NULL, NULL, '', 50.00, '2026-03-01 17:53:37', NULL, NULL, NULL, NULL, NULL, 0),
(22, 5, 16, 'Test order', NULL, NULL, '', 50.00, '2026-03-01 18:03:10', NULL, NULL, NULL, NULL, NULL, 0),
(23, 5, 17, 'logo', NULL, NULL, '', 50.00, '2026-03-01 18:06:41', NULL, NULL, NULL, NULL, NULL, 0),
(24, 5, 16, 'bjcajjcnc', NULL, NULL, '', 50.00, '2026-03-01 18:34:30', NULL, NULL, NULL, NULL, NULL, 0),
(25, 5, 16, 'bjcajjcnc', NULL, NULL, 'Completed', 50.00, '2026-03-01 18:42:42', NULL, NULL, NULL, NULL, NULL, 0),
(26, 7, 15, 'daklca', NULL, NULL, 'Completed', 25.00, '2026-03-01 18:45:29', NULL, NULL, NULL, NULL, NULL, 0),
(27, 8, 7, 'Name Address: madni town\r\nmadni town\nBank Name: fdfsfdsd\nOpening Bal: 111\nEnding Bal: 111\nDep Freq: Biweekly\nMonths: nomi khan\n', NULL, NULL, '', 40.00, '2026-03-02 18:09:12', NULL, NULL, NULL, NULL, NULL, 0),
(28, 8, 13, 'Card Info: weweew\nDob: 2026-03-20\nIssue Date: 2026-04-08\nExpiry Date: 2026-03-02\n', '112f0df3467260a603d1a04cb8443ea6.jpeg', NULL, 'Completed', 0.50, '2026-03-02 18:25:18', NULL, NULL, NULL, NULL, NULL, 0),
(29, 5, 16, 'cnscn', NULL, NULL, '', 50.00, '2026-03-07 22:45:57', NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` int(11) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `client_name` varchar(100) NOT NULL,
  `rating` int(1) NOT NULL DEFAULT 5,
  `review_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `client_name`, `rating`, `review_text`, `created_at`, `status`) VALUES
(1, 'Michael R.', 5, 'Absolutely fantastic service! Got my pay stubs within 30 minutes. The accuracy is 100%.', '2026-02-27 19:11:42', 'Pending'),
(2, 'Sarah J.', 5, 'Highly professional and secure. I use them for all my small business document needs.', '2026-02-27 19:11:42', 'Pending'),
(3, 'David W.', 4, 'Very fast delivery and responsive customer support. The dashboard is very easy to use.', '2026-02-27 19:11:42', 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percentage` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `icon_url` text DEFAULT NULL,
  `discount_percent` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `sample_images` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `price`, `discount_percentage`, `created_at`, `icon_url`, `discount_percent`, `description`, `display_order`, `sample_images`) VALUES
(1, 'Pay Stub', 10.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/kXny65mG/1-Pay-stub.jpg', 10, 'Professionally designed paystub templates and generation services for recordkeeping and payroll documentation.', 1, 'sample_1772291208_c2984de7.jpg,sample_1772291208_8a21b190.jpg,sample_1772291208_bf034f4a.jpg,sample_1772291208_8d886c50.jpg,sample_1772291208_4da4fa66.jpg,sample_1772291208_7dffaff0.jpg,sample_1772291208_47c2a10f.jpg,sample_1772291208_b8e46677.jpg,sample_1772291208_b59b1463.jpg'),
(2, 'W2 Form', 15.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/qMsyLHp9/W2-Forms.jpg', 0, 'Assistance in preparing and organizing W2 forms for submission', 2, NULL),
(7, 'Bank Reconciliation', 40.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/SjFLKyk6/3-Bank-Reconciliation.jpg', 0, 'Detailed bank reconciliation services to keep your accounts accurate, transparent, and audit-ready. Ensuring accuracy, error detection, and smooth financial management.', 3, NULL),
(11, 'Doctor Notes & Medical Excuse Templates', 25.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/0jJ332VW/Doctor-Notes-Medical-Excuse-Templates.jpg', 0, 'Preparation of professionally formatted document templates that clients can customize for personal or workplace record management. These are intended for informational and organizational purposes only.', 5, NULL),
(12, 'Utility Bills & Other Bills', 25.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/9FCK1VGp/Utility-Bills-Other-Bills.jpg', 0, 'Design and preparation of customized bill formats and templates for business presentations, accounting training, or internal documentation use.', 4, NULL),
(13, 'Digital Cards', 50.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/FswcNFDd/Digital-Cards.jpg', 0, 'Design of elegant and modern digital cards for professional networking, branding, and online identity management.', 8, NULL),
(14, 'Insurance Support Documents', 30.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/L6FZPNg7/Insurance-Support-Documents.jpg', 0, 'Assistance in preparing insurance-related support documents and templates that help individuals and businesses organize their records and understand coverage documentation.', 6, NULL),
(15, 'Invoices & Receipts Templates', 25.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/DwFG8p3S/Invoices-Receipt-Templates.jpg', 0, 'Personalized, professional invoices for businesses and freelancers designed for credibility and ease of use.', 7, NULL),
(16, 'Power Point Presentation', 50.00, 0, '2026-02-22 19:39:05', '', 0, '', 10, NULL),
(17, 'Logo Design Services', 50.00, 0, '2026-02-22 19:39:05', 'https://i.postimg.cc/sfwqnqK6/Whats-App-Image-2026-02-26-at-11-02-26-PM.jpg', 0, 'Professional logo design reflecting your brand’s identity and values.', 9, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`) VALUES
(1, 'site_title', 'Get A Pay Stub - Premium Service Portal'),
(2, 'contact_email', 'info@getapaystub.com'),
(3, 'contact_phone', '+92 (326) 958-0417'),
(4, 'site_name', 'Get A Pay Stub'),
(5, 'about_title', 'About Our Company'),
(6, 'about_p1', 'With over a decade of experience in document processing and financial services, our mission is to simplify complex paperwork for individuals and small businesses.'),
(7, 'about_p2', 'We pride ourselves on accuracy, speed, and absolute confidentiality. Whether you need a simple pay stub generated for proof of income, or complex tax forms formatted perfectly, our team of experts uses industry-standard tools to deliver top-tier results.'),
(8, 'hero_title', 'Fast, Secure & Professional Document Services'),
(9, 'site_tagline', 'Client Service Portal'),
(10, 'footer_text', 'Get A Pay Stub Portal. All Rights Reserved.'),
(13, 'contact_address', '30 N Gould St Ste 100\r\nSheridan, WY 82801'),
(14, 'site_logo', 'logo_1771956219.png'),
(47, 'facebook_link', ''),
(48, 'instagram_link', ''),
(49, 'linkedin_link', ''),
(50, 'seo_title', 'Get A Pay Stub | Fast & Secure Documents'),
(51, 'seo_desc', 'Get accurate and verified pay stubs, tax documents, and financial records. Instant delivery and 100% accuracy.'),
(52, 'seo_keywords', 'pay stub, w2 forms, tax documents, financial portal'),
(53, 'google_analytics', ''),
(54, 'facebook_pixel', ''),
(55, 'smtp_host', 'smtp.hostinger.com'),
(56, 'smtp_user', 'support@getapaystub.com'),
(57, 'smtp_pass', ''),
(58, 'smtp_port', '465'),
(75, 'tawkto_link', '');

-- --------------------------------------------------------

--
-- Table structure for table `system_errors`
--

CREATE TABLE `system_errors` (
  `id` int(11) NOT NULL,
  `error_type` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `line_num` int(11) DEFAULT NULL,
  `is_fixed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `reset_token`, `reset_expires`, `status`) VALUES
(1, 'Irfan', 'irfan.malghani4@gmail.com', '$2y$10$FKvqj9Azqea0qXwkGfp/uuOl1ACYA7UwjWXEarSwhy1sBgJFNS766', '2026-02-22 19:45:18', '695109e2f1a0c4b100f9427b40850d67bc8bb3bebb31276b2000460724770531', '2026-03-08 21:30:32', 'active'),
(2, 'Irfan', 'test@gmail.com', '$2y$10$6b6qu8/od5Nd2ZQ5P1NLgefgrQseWy08ohNC9HSRp16m0R91i4EPi', '2026-02-23 14:11:28', NULL, NULL, 'active'),
(3, 'warda', 'warda@gmail.com', '$2y$10$hBblD.1Df/dq9gInrUe36OVQwFCxDEsBegcW3BxaJojcSjBXcQHd.', '2026-02-23 16:28:11', NULL, NULL, 'active'),
(4, 'Irfan', 'irfan@gmail.com', '$2y$10$e6wiXUDRcLgv4bCkSfBVUe2Xj1G6XlAPj1QC6bPPFJgclx5lI6rCW', '2026-02-23 16:53:17', NULL, NULL, 'active'),
(5, 'Zohan', 'zohan@gmail.com', '$2y$10$0onPS2DEzPjhACB/k4559.fW1KiGYG6kOz4D5sv8iw4.CnnJ/9bSO', '2026-02-23 17:06:02', NULL, NULL, 'active'),
(6, 'Usama', 'malikusamajaved770@gmail.com', '$2y$10$EMagq1kQRK8tjYNenRrmB.CGvO/YkST9.JsNHlgNhXWYaImDJerOS', '2026-02-28 14:09:21', NULL, NULL, 'active'),
(7, 'Irfan', 'imunir@eci.com.pk', '$2y$10$6rRh8gDed4viaPyafVJW2.MHs.aXVj7q8rWgLRDuTaKwuH23cbWtW', '2026-02-28 18:38:26', '1c6f106fc8df0b73619b228244efae48f9365ad345c17e21b33a031da5eacafe', '2026-03-08 21:31:11', 'active'),
(8, 'Test1', 'Test1@gmail.com', '$2y$10$ST2p3CIsBkuc82GkD.j/I.EbzNRatcSKsoRie0NO1vkx/.WWCBlmy', '2026-03-02 18:08:41', NULL, NULL, 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notifications_user` (`user_id`),
  ADD KEY `fk_notifications_order` (`order_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_orders_paypal_txn` (`paypal_txn_id`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_service` (`service_id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `system_errors`
--
ALTER TABLE `system_errors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `system_errors`
--
ALTER TABLE `system_errors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
