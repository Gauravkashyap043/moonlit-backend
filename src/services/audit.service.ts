import { AuditLog, AuditAction } from '../models/AuditLog.model';
import { Request } from 'express';

export class AuditService {
  static async log(
    req: Request,
    action: AuditAction,
    resourceType: string,
    description: string,
    changes?: {
      before?: any;
      after?: any;
    },
    resourceId?: string
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        userId: req.user?._id,
        storeId: req.storeId,
        action,
        resourceType,
        resourceId,
        description,
        changes,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      });

      await auditLog.save();
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

