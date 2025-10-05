-- Add FULLTEXT index for faster search across name, email, and jobTitle
-- Check if index doesn't already exist before adding
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'contacts' AND index_name = 'contacts_fulltext_search_idx');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `contacts` ADD FULLTEXT INDEX `contacts_fulltext_search_idx` (`name`, `email`, `jobTitle`)', 'SELECT ''Index already exists'' AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
