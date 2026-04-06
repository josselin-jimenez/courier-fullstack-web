CREATE DATABASE  IF NOT EXISTS `railway` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `railway`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: gondola.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `address_id` bigint unsigned NOT NULL,
  `addr_type` enum('facility','residential','apartment','business','military') DEFAULT NULL,
  `street_addr` varchar(70) NOT NULL,
  `apartment_num` int unsigned DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(60) NOT NULL,
  `postal_code` varchar(16) DEFAULT NULL COMMENT 'postal codes not used everywhere, can be alphanumeric',
  `country` varchar(80) NOT NULL,
  PRIMARY KEY (`address_id`),
  CONSTRAINT `chk_city_valid` CHECK (regexp_like(`city`,_utf8mb4'^[A-Za-z .-]{2,100}$')),
  CONSTRAINT `chk_country_valid` CHECK (regexp_like(`country`,_utf8mb4'^[A-Za-z .-]{2,80}$')),
  CONSTRAINT `chk_postal_code` CHECK (((`postal_code` is null) or (regexp_like(`postal_code`,_utf8mb4'^[A-Z0-9][A-Z0-9 -]{1,15}$') and (not(regexp_like(`postal_code`,_utf8mb4'^[[:space:]-]'))) and (not(regexp_like(`postal_code`,_utf8mb4'[[:space:]-]$')))))),
  CONSTRAINT `chk_state_valid` CHECK (regexp_like(`state`,_utf8mb4'^[A-Za-z .-]{2,60}$')),
  CONSTRAINT `chk_street_addr_valid` CHECK (regexp_like(`street_addr`,_utf8mb4'^[A-Za-z0-9 .-]+$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='addresses stored in table for easier readability';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address`
--

LOCK TABLES `address` WRITE;
/*!40000 ALTER TABLE `address` DISABLE KEYS */;
/*!40000 ALTER TABLE `address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `container`
--

DROP TABLE IF EXISTS `container`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `container` (
  `container_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cont_type` enum('roll cage','pallet','air container','full trailer','ship container') NOT NULL,
  `cont_weight` int unsigned NOT NULL,
  `cont_sqft_dimension` int unsigned NOT NULL,
  `destined_dist_center` int unsigned NOT NULL,
  `cont_loaded_on` bigint unsigned DEFAULT NULL,
  `cont_route` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`container_id`),
  KEY `cont_destined_dist_center_idx` (`destined_dist_center`),
  KEY `cont_loaded_on_idx` (`cont_loaded_on`),
  KEY `cont_route_idx` (`cont_route`),
  CONSTRAINT `cont_destined_dist_center` FOREIGN KEY (`destined_dist_center`) REFERENCES `facility` (`facility_id`),
  CONSTRAINT `cont_loaded_on` FOREIGN KEY (`cont_loaded_on`) REFERENCES `vehicle` (`vehicle_id`),
  CONSTRAINT `cont_route` FOREIGN KEY (`cont_route`) REFERENCES `route` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='container can be a pallet, cage, anything that contains more than one package where all packages are destined to the same regional distribution facility';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `container`
--

LOCK TABLES `container` WRITE;
/*!40000 ALTER TABLE `container` DISABLE KEYS */;
/*!40000 ALTER TABLE `container` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_container_vehicle_status` BEFORE INSERT ON `container` FOR EACH ROW BEGIN
  DECLARE v_status ENUM('en route','not in use');
  SELECT vehicle_status INTO v_status
  FROM vehicle WHERE vehicle_id = NEW.cont_loaded_on;
  IF v_status = 'not in use' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot load container onto a vehicle that is not in use';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `cust_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `business_name` varchar(100) DEFAULT NULL COMMENT 'First + Last Name/Comany name; Per IRS, only symbols allowed in a company''''s name are alphabet, numbers, and &',
  `cust_type` enum('normal','business') NOT NULL DEFAULT 'normal' COMMENT 'business customers allowed drop off at processing facilities; they can also create multiple shipments at once with same service type but different destinations through the API',
  `cust_addr` bigint unsigned NOT NULL,
  `cust_billing_addr` bigint unsigned NOT NULL,
  `cust_phone_num` bigint unsigned NOT NULL COMMENT 'longest phone num is 15 digits long',
  `customer_account` bigint unsigned NOT NULL,
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `cust_phone_num_UNIQUE` (`cust_phone_num`),
  UNIQUE KEY `customer_account_UNIQUE` (`customer_account`),
  KEY `cust_bill_addr_idx` (`cust_billing_addr`),
  KEY `cust_addr_idx` (`cust_addr`),
  KEY `cust_account_idx` (`customer_account`),
  CONSTRAINT `cust_account` FOREIGN KEY (`customer_account`) REFERENCES `users` (`user_id`),
  CONSTRAINT `cust_addr` FOREIGN KEY (`cust_addr`) REFERENCES `address` (`address_id`),
  CONSTRAINT `cust_bill_addr` FOREIGN KEY (`cust_billing_addr`) REFERENCES `address` (`address_id`),
  CONSTRAINT `chk_business_name` CHECK (((`business_name` is null) or regexp_like(`business_name`,_utf8mb4'^[A-Za-z0-9 &]+$'))),
  CONSTRAINT `chk_business_name_required` CHECK ((((`cust_type` = _utf8mb4'business') and (`business_name` is not null)) or (`cust_type` = _utf8mb4'normal'))),
  CONSTRAINT `chk_phone_valid` CHECK (regexp_like(`cust_phone_num`,_utf8mb4'^[0-9]{7,15}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_type_requests`
--

DROP TABLE IF EXISTS `customer_type_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_type_requests` (
  `request_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cust_id` bigint unsigned NOT NULL,
  `requested_type` enum('business') NOT NULL DEFAULT 'business',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `request_reason` text NOT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `fk_request_customer` (`cust_id`),
  KEY `fk_request_admin` (`reviewed_by`),
  CONSTRAINT `fk_request_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_request_customer` FOREIGN KEY (`cust_id`) REFERENCES `customer` (`cust_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_type_requests`
--

LOCK TABLES `customer_type_requests` WRITE;
/*!40000 ALTER TABLE `customer_type_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_type_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `employee_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `works_at` int unsigned NOT NULL,
  `employee_account` bigint unsigned NOT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `employee_account_UNIQUE` (`employee_account`),
  KEY `employee_works_at_idx` (`works_at`),
  KEY `employee_account_idx` (`employee_account`),
  CONSTRAINT `employee_account` FOREIGN KEY (`employee_account`) REFERENCES `users` (`user_id`),
  CONSTRAINT `employee_works_at` FOREIGN KEY (`works_at`) REFERENCES `facility` (`facility_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='use to track employee that drives a vehicle or handles a package in courier process';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility`
--

DROP TABLE IF EXISTS `facility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility` (
  `facility_id` int unsigned NOT NULL AUTO_INCREMENT,
  `department_type` enum('storefront','processing','distribution','administration') NOT NULL,
  `facility_name` varchar(60) NOT NULL,
  `facility_addr` bigint unsigned NOT NULL,
  PRIMARY KEY (`facility_id`),
  KEY `facility_addr_idx` (`facility_addr`),
  CONSTRAINT `facility_addr` FOREIGN KEY (`facility_addr`) REFERENCES `address` (`address_id`),
  CONSTRAINT `chk_facility_name` CHECK (((`facility_name` <> _utf8mb4'') and regexp_like(`facility_name`,_utf8mb4'^[A-Za-z0-9 .&,\\-]+$')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility`
--

LOCK TABLES `facility` WRITE;
/*!40000 ALTER TABLE `facility` DISABLE KEYS */;
/*!40000 ALTER TABLE `facility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `package_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `part_of_shipment` bigint unsigned NOT NULL,
  `pkg_weight` int unsigned NOT NULL,
  `pkg_length` int unsigned NOT NULL,
  `pkg_width` int unsigned NOT NULL,
  `pkg_height` int unsigned NOT NULL,
  `pkg_value` decimal(10,2) unsigned DEFAULT NULL,
  PRIMARY KEY (`package_id`),
  KEY `pkg_for_shipment_idx` (`part_of_shipment`),
  CONSTRAINT `pkg_for_shipment` FOREIGN KEY (`part_of_shipment`) REFERENCES `shipment` (`shipment_id`),
  CONSTRAINT `chk_pkg_height_min` CHECK ((`pkg_height` >= 1)),
  CONSTRAINT `chk_pkg_length_min` CHECK ((`pkg_length` >= 1)),
  CONSTRAINT `chk_pkg_weight_min` CHECK ((`pkg_weight` >= 1)),
  CONSTRAINT `chk_pkg_width_min` CHECK ((`pkg_width` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package`
--

LOCK TABLES `package` WRITE;
/*!40000 ALTER TABLE `package` DISABLE KEYS */;
/*!40000 ALTER TABLE `package` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_status`
--

DROP TABLE IF EXISTS `package_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package_status` (
  `status_no` int unsigned NOT NULL AUTO_INCREMENT,
  `status_type` enum('pre-processing','processing','transit','delivery','damage','flags') NOT NULL,
  `status_name` varchar(50) NOT NULL,
  PRIMARY KEY (`status_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_status`
--

LOCK TABLES `package_status` WRITE;
/*!40000 ALTER TABLE `package_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `package_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_tracking_event`
--

DROP TABLE IF EXISTS `package_tracking_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package_tracking_event` (
  `pkg_tracking_event_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `for_package` bigint unsigned NOT NULL,
  `status` int unsigned NOT NULL,
  `event_time` timestamp NOT NULL,
  `happened_at` int unsigned DEFAULT NULL,
  `loaded_on` bigint unsigned DEFAULT NULL,
  `handled_by` bigint unsigned NOT NULL,
  PRIMARY KEY (`pkg_tracking_event_id`),
  KEY `trck_evnt_for_pkg_idx` (`for_package`),
  KEY `trck_evnt_status_idx` (`status`),
  KEY `trck_evnt_location_idx` (`happened_at`),
  KEY `track_evnt_transport_idx` (`loaded_on`),
  KEY `trck_evnt_handling_idx` (`handled_by`),
  CONSTRAINT `track_evnt_transport` FOREIGN KEY (`loaded_on`) REFERENCES `vehicle` (`vehicle_id`),
  CONSTRAINT `trck_evnt_for_pkg` FOREIGN KEY (`for_package`) REFERENCES `package` (`package_id`),
  CONSTRAINT `trck_evnt_handling` FOREIGN KEY (`handled_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `trck_evnt_location` FOREIGN KEY (`happened_at`) REFERENCES `facility` (`facility_id`),
  CONSTRAINT `trck_evnt_status` FOREIGN KEY (`status`) REFERENCES `package_status` (`status_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_tracking_event`
--

LOCK TABLES `package_tracking_event` WRITE;
/*!40000 ALTER TABLE `package_tracking_event` DISABLE KEYS */;
/*!40000 ALTER TABLE `package_tracking_event` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_event_time_not_future` BEFORE INSERT ON `package_tracking_event` FOR EACH ROW BEGIN
  IF NEW.event_time > NOW() THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tracking event time cannot be in the future';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_paid` date NOT NULL,
  `total_paid` decimal(10,2) unsigned NOT NULL,
  `payment_method` enum('credit','debit','cash','check') NOT NULL,
  PRIMARY KEY (`payment_id`),
  CONSTRAINT `chk_total_paid_positive` CHECK ((`total_paid` > 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route`
--

DROP TABLE IF EXISTS `route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route` (
  `route_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_type` enum('drop-off','delivery','line haul') NOT NULL,
  `start_location` bigint unsigned NOT NULL,
  PRIMARY KEY (`route_id`),
  KEY `route_start_location_idx` (`start_location`),
  CONSTRAINT `route_start_location` FOREIGN KEY (`start_location`) REFERENCES `address` (`address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route`
--

LOCK TABLES `route` WRITE;
/*!40000 ALTER TABLE `route` DISABLE KEYS */;
/*!40000 ALTER TABLE `route` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_stop`
--

DROP TABLE IF EXISTS `route_stop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_stop` (
  `route_stop_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stop_order_no` int unsigned NOT NULL,
  `stop_location` bigint unsigned NOT NULL,
  `est_start_time` timestamp NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `est_time_arrival` timestamp NOT NULL,
  `actual_arrival_time` timestamp NULL DEFAULT NULL,
  `for_route` bigint unsigned NOT NULL,
  PRIMARY KEY (`route_stop_id`),
  KEY `rt_stop_end_idx` (`stop_location`),
  KEY `rt_stop_for_route_idx` (`for_route`),
  CONSTRAINT `rt_stop_end` FOREIGN KEY (`stop_location`) REFERENCES `address` (`address_id`),
  CONSTRAINT `rt_stop_for_route` FOREIGN KEY (`for_route`) REFERENCES `route` (`route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_stop`
--

LOCK TABLES `route_stop` WRITE;
/*!40000 ALTER TABLE `route_stop` DISABLE KEYS */;
/*!40000 ALTER TABLE `route_stop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_type`
--

DROP TABLE IF EXISTS `service_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_type` (
  `service_type_no` int unsigned NOT NULL AUTO_INCREMENT,
  `service_category` enum('region','time','method','handling','military','caution','add-on','created') NOT NULL,
  `service_name` varchar(30) NOT NULL,
  `base_cost` decimal(10,2) unsigned NOT NULL,
  PRIMARY KEY (`service_type_no`),
  UNIQUE KEY `service_type_id_UNIQUE` (`service_type_no`),
  CONSTRAINT `chk_base_cost_positive` CHECK ((`base_cost` >= 0.00)),
  CONSTRAINT `chk_service_name` CHECK (((`service_name` <> _utf8mb4'') and regexp_like(`service_name`,_utf8mb4'^[A-Za-z0-9 \\-]+$')))
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_type`
--

LOCK TABLES `service_type` WRITE;
/*!40000 ALTER TABLE `service_type` DISABLE KEYS */;
INSERT INTO `service_type` VALUES (1,'region','US',1.00),(2,'region','International',5.00),(3,'region','Military - AA',5.00),(4,'region','Military - AE',25.00),(5,'region','Military - AP',30.00),(10,'time','Regular',4.00),(11,'time','Express',10.00),(12,'time','Two-Day',25.00),(13,'time','Overnight',45.00),(20,'add-on','Signature',3.00),(21,'add-on','Pickup',5.00),(22,'add-on','Age Verification',3.00),(23,'add-on','Insurance',2.00),(30,'handling','Refridgerate',15.00),(40,'caution','Hazmat',10.00),(50,'created','Retail',2.00);
/*!40000 ALTER TABLE `service_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment`
--

DROP TABLE IF EXISTS `shipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment` (
  `shipment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tracking_number` varchar(40) NOT NULL,
  `for_customer` bigint unsigned NOT NULL,
  `shipment_transaction` bigint unsigned NOT NULL,
  `receiver_name` varchar(100) NOT NULL,
  `receiver_addr` bigint unsigned NOT NULL,
  `service_types` int unsigned NOT NULL,
  `insur_amt` int unsigned DEFAULT '0',
  PRIMARY KEY (`shipment_id`),
  UNIQUE KEY `tracking_number_UNIQUE` (`tracking_number`),
  KEY `shipment_for_customer_idx` (`for_customer`),
  KEY `transaction_for_shipment_idx` (`shipment_transaction`),
  KEY `shipment_reciever_address_idx` (`receiver_addr`),
  KEY `shipment_service_types_idx` (`service_types`),
  CONSTRAINT `shipment_for_customer` FOREIGN KEY (`for_customer`) REFERENCES `customer` (`cust_id`),
  CONSTRAINT `shipment_reciever_address` FOREIGN KEY (`receiver_addr`) REFERENCES `address` (`address_id`),
  CONSTRAINT `shipment_service_types` FOREIGN KEY (`service_types`) REFERENCES `service_type` (`service_type_no`),
  CONSTRAINT `transaction_for_shipment` FOREIGN KEY (`shipment_transaction`) REFERENCES `payment` (`payment_id`),
  CONSTRAINT `chk_insur_amt` CHECK ((`insur_amt` <= 100000)),
  CONSTRAINT `chk_receiver_name` CHECK (((`receiver_name` <> _utf8mb4'') and regexp_like(`receiver_name`,_utf8mb4'^[A-Za-z &]+$'))),
  CONSTRAINT `chk_tracking_number` CHECK (regexp_like(`tracking_number`,_utf8mb4'^[A-Z0-9]{8,40}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment`
--

LOCK TABLES `shipment` WRITE;
/*!40000 ALTER TABLE `shipment` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_service_type`
--

DROP TABLE IF EXISTS `shipment_service_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment_service_type` (
  `shipment_id` bigint unsigned NOT NULL,
  `service_type_no` int unsigned NOT NULL,
  PRIMARY KEY (`shipment_id`,`service_type_no`),
  KEY `shipment map to service_idx` (`shipment_id`),
  KEY `service type reference_idx` (`service_type_no`),
  CONSTRAINT `service type reference` FOREIGN KEY (`service_type_no`) REFERENCES `service_type` (`service_type_no`),
  CONSTRAINT `shipment id map to service type` FOREIGN KEY (`shipment_id`) REFERENCES `shipment` (`shipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='junction table since shipment can contain more than one service type';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_service_type`
--

LOCK TABLES `shipment_service_type` WRITE;
/*!40000 ALTER TABLE `shipment_service_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipment_service_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_rates`
--

DROP TABLE IF EXISTS `shipping_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_rates` (
  `shipping_rate_no` int NOT NULL AUTO_INCREMENT,
  `rate_type` varchar(20) NOT NULL,
  `rate_amount` decimal(4,2) unsigned NOT NULL,
  PRIMARY KEY (`shipping_rate_no`),
  UNIQUE KEY `rate_type_UNIQUE` (`rate_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_rates`
--

LOCK TABLES `shipping_rates` WRITE;
/*!40000 ALTER TABLE `shipping_rates` DISABLE KEYS */;
INSERT INTO `shipping_rates` VALUES (1,'weight',0.10),(2,'distance',0.01),(3,'handling_fee',1.50),(4,'insurance',0.15);
/*!40000 ALTER TABLE `shipping_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'First and Last',
  `email` varchar(254) NOT NULL COMMENT 'username',
  `password` varchar(255) NOT NULL COMMENT 'hashed',
  `phone_num` varchar(16) NOT NULL,
  `role` enum('customer','admin','driver','handler','customer service','uma') NOT NULL DEFAULT 'customer',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `phone_num_UNIQUE` (`phone_num`),
  UNIQUE KEY `username_email_UNIQUE` (`email`),
  CONSTRAINT `chk_name_of_user` CHECK (regexp_like(`name`,_utf8mb4'^[A-Za-z]+(?:[ \'-][A-Za-z]+)+$')),
  CONSTRAINT `chk_phone` CHECK (regexp_like(`phone_num`,_utf8mb4'^\\+[1-9][0-9]{7,14}$')),
  CONSTRAINT `chk_users_email` CHECK (((`email` <> _utf8mb4'') and regexp_like(`email`,_utf8mb4'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'))),
  CONSTRAINT `chk_users_password_bcrypt` CHECK (((char_length(`password`) = 60) and regexp_like(`password`,_utf8mb4'^\\$2[ab]\\$[0-9]{2}\\$.{53}$')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Uma Ramamurthy','uramamur@bcm.edu','$2b$10$3aZy.eyLqsgPjHOUC0cix.mAgrJElZAYkF3U3VAOPTdABhfcafBKq','+11234567890','uma'),(2,'Test Customer','test@customer.com','$2b$10$xUVdmA9riWdISc7hIGEZiOQZBwcYqVx81x1F7B.VuKuhKk0UXNrHm','+19876543210','customer'),(3,'Labubu Jones','c@g.com','$2b$10$dd205/Gs26MBB4JnDoPtzOq4US2K4Aj.l7yQdpKrBCo7m/U6vSMOy','+11111111111','customer');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle` (
  `vehicle_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_type` enum('Trailer','Ship','Aircraft','Delivery Vehicle') NOT NULL,
  `vehicle_transit_identifier` varchar(15) NOT NULL COMMENT 'can be car planes, plane tail number, or ship imo',
  `vehicle_status` enum('en route','not in use') NOT NULL,
  `weight_cap_lbs` int unsigned NOT NULL,
  `sqft_cap` int unsigned NOT NULL,
  `max_height_inch` int unsigned NOT NULL,
  `last_location` bigint unsigned NOT NULL,
  PRIMARY KEY (`vehicle_id`),
  KEY `vehicle_last_location_idx` (`last_location`),
  CONSTRAINT `vehicle_last_location` FOREIGN KEY (`last_location`) REFERENCES `address` (`address_id`),
  CONSTRAINT `chk_vehicle_height_cap` CHECK ((`max_height_inch` >= 1)),
  CONSTRAINT `chk_vehicle_identifier` CHECK (regexp_like(`vehicle_transit_identifier`,_utf8mb4'^[A-Z0-9 \\-]{2,15}$')),
  CONSTRAINT `chk_vehicle_sqft_cap` CHECK ((`sqft_cap` >= 1)),
  CONSTRAINT `chk_vehicle_weight_cap` CHECK ((`weight_cap_lbs` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle`
--

LOCK TABLES `vehicle` WRITE;
/*!40000 ALTER TABLE `vehicle` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'railway'
--

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-06  3:33:26
