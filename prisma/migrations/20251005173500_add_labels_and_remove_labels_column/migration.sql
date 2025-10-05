-- CreateTable
CREATE TABLE `labels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `pipedriveId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `labels_name_key`(`name`),
    UNIQUE INDEX `labels_pipedriveId_key`(`pipedriveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_labels` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_labels_contactId_idx`(`contactId`),
    INDEX `contact_labels_labelId_idx`(`labelId`),
    UNIQUE INDEX `contact_labels_contactId_labelId_key`(`contactId`, `labelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- DropIndex
DROP INDEX `contacts_labels_idx` ON `contacts`;

-- AlterTable
ALTER TABLE `contacts` DROP COLUMN `labels`;

-- AddForeignKey
ALTER TABLE `contact_labels` ADD CONSTRAINT `contact_labels_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_labels` ADD CONSTRAINT `contact_labels_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `labels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
