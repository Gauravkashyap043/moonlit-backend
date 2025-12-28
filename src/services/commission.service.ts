import { IOrder } from '../models/Order.model';
import { IStore } from '../models/Store.model';

export class CommissionService {
  static calculateCommission(order: IOrder, store: IStore): {
    commission: number;
    sellerAmount: number;
  } {
    const commissionRate = store.commissionRate / 100;
    const commission = Math.round(order.total * commissionRate);
    const sellerAmount = order.total - commission;

    return {
      commission,
      sellerAmount,
    };
  }

  static calculateSettlementDate(orderDate: Date, payoutDelayDays: number): Date {
    const settlementDate = new Date(orderDate);
    settlementDate.setDate(settlementDate.getDate() + payoutDelayDays);
    return settlementDate;
  }
}

