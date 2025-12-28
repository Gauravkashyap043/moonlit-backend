import { Request, Response, NextFunction } from 'express';
import { Store, StoreStatus } from '../models/Store.model';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { config } from '../config/env';
import { CustomError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';

export const createStore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    const {
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      address,
      currency = 'USD',
      timezone = 'UTC',
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(name);
    
    // Ensure slug is unique
    const uniqueSlug = await generateUniqueSlug(finalSlug, Store);

    // Check if subdomain is available
    const subdomain = uniqueSlug;
    const existingSubdomain = await Store.findOne({
      'domainConfig.subdomain': subdomain,
      isDeleted: false,
    });

    if (existingSubdomain) {
      throw new CustomError('Subdomain already taken', 400);
    }

    // Create store with default values
    const store = new Store({
      name,
      slug: uniqueSlug,
      ownerId: userId,
      description,
      contactEmail,
      contactPhone,
      address,
      currency: currency.toUpperCase(),
      timezone,
      domainConfig: {
        subdomain,
        customDomainVerified: false,
        sslEnabled: false,
      },
      status: StoreStatus.PENDING, // Will be activated after verification
      plan: 'free',
      commissionRate: config.platform.defaultCommissionRate,
      payoutDelayDays: config.platform.defaultPayoutDelayDays,
      settings: {
        allowCod: false,
        allowGuestCheckout: true,
        requireEmailVerification: false,
      },
    });

    await store.save();

    // Audit log
    await AuditService.log(
      req,
      'store.created' as any,
      'store',
      `Store "${name}" created`,
      undefined,
      store._id.toString()
    );

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        subdomain: store.domainConfig.subdomain,
        status: store.status,
        plan: store.plan,
        currency: store.currency,
        timezone: store.timezone,
        createdAt: store.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStores = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    const stores = await Store.find({
      ownerId: userId,
      isDeleted: false,
    })
      .select('-settings')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: stores.map((store) => ({
        id: store._id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone,
        address: store.address,
        domainConfig: store.domainConfig,
        status: store.status,
        plan: store.plan,
        commissionRate: store.commissionRate,
        payoutDelayDays: store.payoutDelayDays,
        currency: store.currency,
        timezone: store.timezone,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId } = req.params;

    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    }).lean();

    if (!store) {
      throw new CustomError('Store not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        banner: store.banner,
        contactEmail: store.contactEmail,
        contactPhone: store.contactPhone,
        address: store.address,
        domainConfig: store.domainConfig,
        status: store.status,
        plan: store.plan,
        commissionRate: store.commissionRate,
        payoutDelayDays: store.payoutDelayDays,
        currency: store.currency,
        timezone: store.timezone,
        settings: store.settings,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId } = req.params;

    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found', 404);
    }

    const {
      name,
      description,
      contactEmail,
      contactPhone,
      address,
      currency,
      timezone,
      settings,
    } = req.body;

    if (name) store.name = name;
    if (description !== undefined) store.description = description;
    if (contactEmail) store.contactEmail = contactEmail;
    if (contactPhone !== undefined) store.contactPhone = contactPhone;
    if (address) store.address = address;
    if (currency) store.currency = currency.toUpperCase();
    if (timezone) store.timezone = timezone;
    if (settings) store.settings = { ...store.settings, ...settings };

    await store.save();

    // Audit log
    await AuditService.log(
      req,
      'store.updated' as any,
      'store',
      `Store "${store.name}" updated`,
      { after: req.body },
      store._id.toString()
    );

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        updatedAt: store.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId } = req.params;

    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found', 404);
    }

    // Soft delete
    store.isDeleted = true;
    store.deletedAt = new Date();
    store.status = StoreStatus.INACTIVE;
    await store.save();

    // Audit log
    await AuditService.log(
      req,
      'store.deleted' as any,
      'store',
      `Store "${store.name}" deleted`,
      undefined,
      store._id.toString()
    );

    res.json({
      success: true,
      message: 'Store deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

