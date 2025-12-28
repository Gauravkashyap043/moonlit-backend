import { LedgerEntry, ILedgerEntry, LedgerEntryType } from '../models/LedgerEntry.model';
import { IOrder } from '../models/Order.model';
import { IPayment } from '../models/Payment.model';
import { IPayout } from '../models/Payout.model';

export class LedgerService {
  static async getStoreBalance(storeId: string): Promise<number> {
    const lastEntry = await LedgerEntry.findOne({
      storeId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return lastEntry?.balanceAfter || 0;
  }

  static async createEntry(
    storeId: string,
    entryType: LedgerEntryType,
    amount: number,
    currency: string,
    description: string,
    references?: {
      orderId?: string;
      paymentId?: string;
      payoutId?: string;
    }
  ): Promise<ILedgerEntry> {
    const balanceBefore = await this.getStoreBalance(storeId);
    const balanceAfter = balanceBefore + amount;

    const entry = new LedgerEntry({
      storeId,
      entryType,
      amount,
      currency,
      description,
      balanceBefore,
      balanceAfter,
      ...references,
    });

    await entry.save();
    return entry;
  }

  static async recordOrderPayment(order: IOrder, payment: IPayment): Promise<void> {
    await this.createEntry(
      order.storeId.toString(),
      LedgerEntryType.ORDER_PAYMENT,
      order.total,
      order.currency || 'USD',
      `Payment received for order ${order.orderNumber}`,
      {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
      }
    );

    await this.createEntry(
      order.storeId.toString(),
      LedgerEntryType.COMMISSION,
      -order.commission,
      order.currency || 'USD',
      `Commission deducted for order ${order.orderNumber}`,
      {
        orderId: order._id.toString(),
      }
    );
  }

  static async recordPayout(payout: IPayout): Promise<void> {
    await this.createEntry(
      payout.storeId.toString(),
      LedgerEntryType.PAYOUT,
      -payout.amount,
      payout.currency,
      `Payout ${payout.payoutNumber}`,
      {
        payoutId: payout._id.toString(),
      }
    );
  }
}

