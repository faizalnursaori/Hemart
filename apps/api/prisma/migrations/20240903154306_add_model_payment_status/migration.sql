-- AlterTable
ALTER TABLE `order` MODIFY `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELED') NOT NULL;
