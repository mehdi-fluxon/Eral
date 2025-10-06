-- DropIndex
DROP INDEX `contacts_fulltext_search_idx` ON `contacts`;

-- AlterTable
ALTER TABLE `interactions` ADD COLUMN `pipedriveNoteId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `interactions_pipedriveNoteId_idx` ON `interactions`(`pipedriveNoteId`);
