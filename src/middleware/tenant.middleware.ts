import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/Store.model';

export const tenantIsolation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hostname = req.get('host') || '';
    const subdomain = hostname.split('.')[0];

    // Find store by subdomain or custom domain
    const store = await Store.findOne({
      $or: [
        { 'domainConfig.subdomain': subdomain },
        { 'domainConfig.customDomain': hostname },
      ],
      isDeleted: false,
      status: 'active',
    });

    if (!store) {
      res.status(404).json({ message: 'Store not found' });
      return;
    }

    req.storeId = store._id.toString();
    req.store = store;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error identifying store' });
  }
};

export const validateStoreOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const storeId = req.params.storeId || req.body.storeId || req.storeId;

    if (!storeId) {
      res.status(400).json({ message: 'Store ID required' });
      return;
    }

    const store = await Store.findOne({
      _id: storeId,
      ownerId: req.user._id,
      isDeleted: false,
    });

    if (!store) {
      res.status(403).json({ message: 'Access denied to this store' });
      return;
    }

    req.store = store;
    req.storeId = storeId;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating store ownership' });
  }
};

export const requireStoreContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.storeId) {
    res.status(400).json({ message: 'Store context required' });
    return;
  }
  next();
};

