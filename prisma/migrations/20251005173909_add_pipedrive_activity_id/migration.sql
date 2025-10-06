-- AlterTable
ALTER TABLE `interactions` ADD COLUMN `pipedriveActivityId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `interactions_pipedriveActivityId_idx` ON `interactions`(`pipedriveActivityId`);

-- CreateIndex (unique constraint added separately to allow for duplicates to be cleaned up first)
-- This will be added after cleaning up duplicates
-- CREATE UNIQUE INDEX `interactions_pipedriveActivityId_key` ON `interactions`(`pipedriveActivityId`);
