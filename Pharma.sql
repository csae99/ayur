-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2024 at 07:14 PM
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
-- Database: `pharma`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_shop`
--

CREATE TABLE `admin_shop` (
  `admin_id` int(3) NOT NULL,
  `admin_email` varchar(50) NOT NULL,
  `admin_fname` varchar(20) NOT NULL,
  `admin_lname` varchar(20) NOT NULL,
  `admin_password` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_shop`
--

INSERT INTO `admin_shop` (`admin_id`, `admin_email`, `admin_fname`, `admin_lname`, `admin_password`) VALUES
(4, 'admin@gmail.com', 'Shubham', 'Gawade', 'admin'),
(8, 'admin2@gmail.com', 'NITISH', 'SINGH', 'admin'),
(9, 'admin3@gmail.com', 'NAVEEN', 'RAJ', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE `item` (
  `item_id` int(5) NOT NULL,
  `item_title` varchar(250) NOT NULL,
  `item_brand` varchar(250) NOT NULL,
  `item_cat` varchar(15) NOT NULL,
  `item_details` text NOT NULL,
  `item_tags` varchar(250) NOT NULL,
  `item_image` varchar(250) NOT NULL,
  `item_quantity` int(3) NOT NULL,
  `item_price` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `item_title`, `item_brand`, `item_cat`, `item_details`, `item_tags`, `item_image`, `item_quantity`, `item_price`) VALUES
(57, 'Cilliata', 'Cilliata', 'medicine', 'I treats fever and ulcers plus general health of body', 'I treats fever and ulcers plus general health of body', 'med1.webp', 86, 70),
(58, 'Globulus', 'Globulus', 'medicine', 'Treats skin infections and other skin disorders', 'Treats skin infections and other skin disorders', 'med2.jpg', 89, 200),
(59, 'Aristata', 'Aristata', 'medicine', 'Treats both scabiies and other skin infections in the body.', 'Treats both scabiies and other skin infections in the body.', 'med3.webp', 82, 99);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_quantity` int(3) NOT NULL,
  `order_date` date NOT NULL,
  `order_status` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `item_id`, `user_id`, `order_quantity`, `order_date`, `order_status`) VALUES
(230, 59, 55, 1, '2024-04-09', 0),
(231, 57, 87, 1, '2024-04-09', 0),
(232, 59, 87, 1, '2024-04-09', 0),
(233, 59, 87, 1, '2024-04-10', 0),
(234, 59, 87, 1, '2024-04-10', 0),
(235, 57, 87, 1, '2024-04-10', 0),
(236, 59, 87, 1, '2024-04-10', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_Lname` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `user_password` varchar(50) NOT NULL,
  `user_id` int(3) NOT NULL,
  `user_fname` varchar(20) NOT NULL,
  `user_address` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_Lname`, `email`, `user_password`, `user_id`, `user_fname`, `user_address`) VALUES
('user', 'user@gmail.com', 'user', 55, 'user', 'NO.18, 1ST FLOOR, 3RD MAIN, MUNIYELLAPPA LAYOUT, VINAYAKANAGAR, J.P NAGAR, 5TH PHASE BANGALURU, KARNATAKA, INDIA - 560078'),
('Banik', 'kalinda@gmail.com', '5Kalinda', 62, 'Kalinda', '4, Charmuni Compd, Link Road, Malad(w)  Mumbai, Maharashtra, 400064'),
('Krish', 'rani@gmail.com', '1RaniKrish', 63, 'Rani', 'C 50, Opp Mansarover Garden, Sharda Puri  Delhi, Delhi, 110015'),
('Banik', 'shakti@gmail.com', 'Shakti1221', 64, 'Shakti', '3887/1, Military Road Chowk, Anand Parbat  Delhi, Delhi, 110005'),
('Peri', 'mehul@gmail.com', 'DXGDZ6DtkY', 66, 'Mehul', '3887/1, Military Road Chowk, Anand Parbat  Delhi, Delhi, 110005'),
('Goda', 'rajni@gmail.com', 'cp3c2SGrSc', 67, 'Rajni', '1, Basement, Gujarath Indl Estate, Vishweshwar Nagar, Off Aarey Road, Goregaon (e)  Mumbai, Maharashtra, 400063'),
('Raj', 'kashika@gmail.com', 'sjBL6cPhkr', 68, 'Kashika', '115, Tj Complex, Pankaja Mill Road, Ramanathapuram  Coimbatore, Tamil Nadu, 641045'),
('Dubey', 'sahima@gmail.com', 'BvM7pmPxeY', 69, 'Sahima', 'Porbunder Castle, 3rd Pasta Lane, Colaba  Mumbai, Maharashtra, 400005'),
('Iyengar', 'rachana@gmail.com', '52H88tNA7C', 70, 'Rachana', 'E/13, Midc Indl Area, Taloja, Navi Mumbai  Mumbai, Maharashtra, 410208'),
('Luthra', 'viti@gmail.com', 'YtnjB5Uw7n', 71, 'Viti', '128, Venkatranganpillai Street Tripli  Chennai, Tamil Nadu, 600005'),
('Mitra', 'minali@gmail.com', '6qECNmtCXx', 72, 'Minali', 'S-8, Divine Home, Ic Colony, Next To Mary Girls School Bo, Mandapeshwar  Mumbai, Maharashtra, 400103'),
('Vala', 'arjun@gmail.com', 'vLqxtB39DA', 75, 'Arjun', '3887/1, Military Road Chowk, Anand Parbat  Delhi, Delhi, 110005'),
('Iyengar', 'ritika@gmail.com', 'Y89jnWsKNR', 76, 'Ritika', 'F 154, Main Road, Jagat Puri  Delhi, Delhi, 110051'),
('Raju', 'drishya@gmail.com', 'ZDMHs6CYS6', 78, 'Drishya', '1/2, Naaz Complex, 3 Nr, N R Road  Bangalore, Karnataka, 560002'),
('Narasimhan', 'puja@gmail.com', 'wxFuAK3Gxt', 79, 'Puja', 'Shop No.14, Janata Mkt, Nr Rly Stn, Chembur  Mumbai, Maharashtra, 400071'),
('Rajagopal', 'vasu@gmail.com', 'C5UFaSsBdB', 80, 'Vasu', '458/2a, Hanuman Road  Delhi, Delhi, 110017'),
('Goyal', 'jyotsna@gmail.com', 'Rr7dnSuCuM', 81, 'Jyotsna', '33 Dahanukar Bldg, 480 Kalbadevi Road, Kalbadevi  Mumbai, Maharashtra, 400002'),
('Saxena', 'yash@gmail.com', 'HMFRn2RnTv', 82, 'Yash', '14, 50 Rd, Muneshwara Block  Bangalore, Karnataka, 560026'),
('Setty', 'subhash@gmail.com', '5L4xSHcWEu', 83, 'Subhash', 'R No 15 1st Flr, No 23, Bhupat Bhavan, Vaju Kotak Marg, Ballard Estate  Mumbai, Maharashtra, 400038'),
('Sankar', 'narendra@gmail.com', 'YrkMMgsg84', 84, 'Narendra', '194/1/7, G. T. Road, Salkia  Kolkata, West Bengal, 711106'),
('Vala', 'kalind3a@gmail.com', '5Kalinda', 85, 'Arjun', '3887/1, Military Road Chowk, Anand Parbat  Delhi, Delhi, 110005'),
('badhe', 'om@gmail.com', 'pass1234', 87, 'om', 'Kondhwa , Pune');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `item_id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=237;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
