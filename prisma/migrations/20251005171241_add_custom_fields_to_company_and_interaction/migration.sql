-- AlterTable
ALTER TABLE `companies` ADD COLUMN `customFields` JSON NULL;

-- AlterTable
ALTER TABLE `interactions` ADD COLUMN `customFields` JSON NULL;
