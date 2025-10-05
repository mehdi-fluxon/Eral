-- Add firstName and lastName columns to contacts table
ALTER TABLE `contacts` ADD COLUMN `firstName` VARCHAR(191) NULL AFTER `name`;
ALTER TABLE `contacts` ADD COLUMN `lastName` VARCHAR(191) NULL AFTER `firstName`;

-- Create index on lastName for better sorting performance
CREATE INDEX `contacts_lastName_idx` ON `contacts`(`lastName`);
