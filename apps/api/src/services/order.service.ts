import prisma from '@/prisma';
import { CheckoutBody } from '@/types/order.type';
import { findNearestWarehouse } from './warehouse.service';
import {
  PaymentStatus,
  CancellationSource,
  TransactionType,
  TransferStatus,
} from '@prisma/client';
import { calculateDistance } from '@/utils/distance.utils';

export const handleCheckout = async (id: number, body: CheckoutBody) => {
  const {
    name,
    paymentStatus,
    shippingCost,
    total,
    paymentMethod,
    warehouseId,
    cartId,
    addressId,
    orderItems,
    latitude,
    longitude,
  } = body;

  const expirePayment = new Date(Date.now() + 2 * 60 * 1000); // in 2 minutes

  const warehouse = await findNearestWarehouse({ latitude, longitude });
  if (!warehouse) {
    throw new Error('No warehouse found');
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        name,
        paymentStatus,
        shippingCost,
        total,
        paymentMethod,
        expirePayment,
        warehouseId,
        cartId,
        addressId,
      },
    });

    await tx.orderItem.createMany({
      data: orderItems.map((item: any) => ({
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        orderId: order.id,
        productId: item.productId,
      })),
    });

    for (const item of orderItems) {
      await tx.productStock.updateMany({
        where: {
          productId: item.productId,
          warehouseId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      const productInfo = await tx.product.findUnique({
        where: {
          id: item.productId,
        },
        select: { name: true },
      });

      const productStock = await tx.productStock.findFirst({
        where: {
          productId: item.productId,
          warehouseId,
        },
      });

      if (productStock) {
        await tx.stockTransferLog.create({
          data: {
            quantity: item.quantity,
            transactionType: 'OUT',
            description: `Stock OUT ${productInfo?.name} from ${warehouse?.name} for ORDER, qty: ${item.quantity}`,
            productStockId: productStock.id,
            warehouseId,
          },
        });
      }
    }

    await tx.cart.update({
      where: { id: cartId },
      data: { isActive: false },
    });

    await tx.transactionHistory.create({
      data: {
        userId: id,
        orderId: order.id,
        amount: total,
        type: 'PURCHASE',
      },
    });

    return order;
  });
};

export const cancelExpiredOrders = async () => {
  const now = new Date();
  return await prisma.$transaction(async (tx) => {
    const expiredOrders = await tx.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        paymentProof: null,
        expirePayment: {
          lt: now,
        },
      },
      include: {
        cart: {
          include: {
            user: true,
          },
        },
        items: true,
      },
    });

    let canceledCount = 0;
    for (const order of expiredOrders) {
      try {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.CANCELED,
            cancellationSource: CancellationSource.SYSTEM,
          },
        });

        // Reactivate the cart
        await tx.cart.update({
          where: { id: order.cartId },
          data: { isActive: true },
        });

        // Return stock to warehouse and create stock transfer logs
        for (const item of order.items) {
          const productStock = await tx.productStock.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: order.warehouseId,
              },
            },
            data: {
              stock: { increment: item.quantity },
            },
          });

          const productInfo = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          await tx.stockTransferLog.create({
            data: {
              quantity: item.quantity,
              transactionType: 'IN',
              description: `Stock IN ${productInfo?.name} to ${order.warehouseId} warehouse for CANCELED ORDER, qty: ${item.quantity}`,
              productStockId: productStock.id,
              warehouseId: order.warehouseId,
            },
          });
        }

        // Create transaction history entry
        await tx.transactionHistory.create({
          data: {
            userId: order.cart.user.id,
            orderId: order.id,
            amount: order.total,
            type: TransactionType.REFUND,
          },
        });

        canceledCount++;
      } catch (error) {
        console.error(`Failed to cancel order ${order.id}:`, error);
      }
    }

    return canceledCount;
  });
};

export const cancelOrder = async (
  userId: number,
  orderId: number,
  source: CancellationSource,
) => {
  return await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: {
        id: orderId,
        paymentStatus: PaymentStatus.PENDING,
        paymentProof: null,
        cart: {
          userId: userId,
        },
      },
      data: {
        paymentStatus: PaymentStatus.CANCELED,
        cancellationSource: source,
      },
      include: {
        items: true,
      },
    });

    if (!updatedOrder) {
      throw new Error('Order not found OR cannot be cancelled');
    }

    // Reactivate the cart
    await tx.cart.update({
      where: { id: updatedOrder.cartId },
      data: { isActive: true },
    });

    for (const item of updatedOrder.items) {
      const productStock = await tx.productStock.update({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: updatedOrder.warehouseId,
          },
        },
        data: {
          stock: { increment: item.quantity },
        },
      });

      const productInfo = await tx.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });

      await tx.stockTransferLog.create({
        data: {
          quantity: item.quantity,
          transactionType: TransactionType.IN,
          description: `Stock IN ${productInfo?.name} to warehouse ${updatedOrder.warehouseId} due to order cancellation, qty: ${item.quantity}`,
          productStockId: productStock.id,
          warehouseId: updatedOrder.warehouseId,
        },
      });
    }

    await tx.transactionHistory.create({
      data: {
        userId: userId,
        orderId: updatedOrder.id,
        amount: updatedOrder.total,
        type: TransactionType.REFUND,
      },
    });

    return updatedOrder;
  });
};

export const uploadPaymentProof = async (
  userId: number,
  orderId: number,
  file: Express.Multer.File,
) => {
  const shippedAtLimit = new Date(Date.now() + 2 * 60 * 1000); // in 2 minutes
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      cart: {
        userId: userId,
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentProof: `/assets/payment/${file.filename}`,
      paymentStatus: PaymentStatus.PAID,
      shippedAt: shippedAtLimit,
    },
  });
};

export const checkAndMutateStock = async (
  warehouseId: number,
  products: Array<{ productId: number; quantity: number }>,
  latitude: number,
  longitude: number,
) => {
  return await prisma.$transaction(async (tx) => {
    for (const product of products) {
      let stockInWarehouse = await tx.productStock.findFirst({
        where: { productId: product.productId, warehouseId: warehouseId },
        include: {
          product: true,
          warehouse: true,
        },
      });

      let remainingQuantity = product.quantity;
      const availableStock = stockInWarehouse ? stockInWarehouse.stock : 0;
      const deficitQuantity = remainingQuantity - availableStock;

      if (deficitQuantity > 0) {
        const warehousesWithStock = await tx.productStock.findMany({
          where: {
            productId: product.productId,
            stock: { gt: 0 },
            NOT: { warehouseId: warehouseId },
          },
          include: {
            product: true,
            warehouse: true,
          },
        });

        const sortedWarehouses = warehousesWithStock.sort((a, b) => {
          const distanceA = calculateDistance(
            latitude,
            longitude,
            a.warehouse.latitude!,
            a.warehouse.longitude!,
          );
          const distanceB = calculateDistance(
            latitude,
            longitude,
            b.warehouse.latitude!,
            b.warehouse.longitude!,
          );
          return distanceA - distanceB;
        });

        let currentDeficit = deficitQuantity;
        for (const warehouseWithStock of sortedWarehouses) {
          if (currentDeficit <= 0) break;

          const transferQuantity = Math.min(
            warehouseWithStock.stock,
            currentDeficit,
          );

          const stockTransfer = await tx.stockTransfer.create({
            data: {
              stockRequest: transferQuantity,
              stockProcess: transferQuantity,
              note: `Stock transfer for order fulfillment`,
              productId: product.productId,
              status: TransferStatus.COMPLETED,
            },
          });

          await tx.stockTransferLog.create({
            data: {
              quantity: transferQuantity,
              transactionType: TransactionType.OUT,
              description: `Stock OUT ${warehouseWithStock.product.name} from ${warehouseWithStock.warehouse.name} to ${stockInWarehouse?.warehouse.name}, qty: ${transferQuantity} for ORDER. (Automatic Transfer)`,
              productStockId: warehouseWithStock.id,
              warehouseId: warehouseWithStock.warehouseId,
            },
          });

          await tx.productStock.update({
            where: { id: warehouseWithStock.id },
            data: { stock: { decrement: transferQuantity } },
          });

          if (stockInWarehouse) {
            await tx.productStock.update({
              where: { id: stockInWarehouse.id },
              data: { stock: { increment: transferQuantity } },
            });
          } else {
            stockInWarehouse = await tx.productStock.create({
              data: {
                stock: transferQuantity,
                productId: product.productId,
                warehouseId: warehouseId,
              },
              include: {
                product: true,
                warehouse: true,
              },
            });
          }

          await tx.stockTransferLog.create({
            data: {
              quantity: transferQuantity,
              transactionType: TransactionType.IN,
              description: `Stock IN ${stockInWarehouse.product.name} to ${stockInWarehouse.warehouse.name} from ${warehouseWithStock.warehouse.name}, qty: ${transferQuantity} for ORDER. (Automatic Transfer)`,
              productStockId: stockInWarehouse.id,
              warehouseId: warehouseId,
            },
          });

          currentDeficit -= transferQuantity;
        }

        if (currentDeficit > 0) {
          throw new Error('Insufficient stock available in nearby warehouses');
        }
      }

      if (stockInWarehouse) {
        await tx.productStock.update({
          where: { id: stockInWarehouse.id },
          data: { stock: { decrement: remainingQuantity } },
        });
      }
    }
  });
};