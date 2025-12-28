import { Request, Response, NextFunction } from 'express';
import { Collection } from '../models/Collection.model';
import { Store } from '../models/Store.model';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { CustomError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';

export const createCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const storeId = req.storeId || req.params.storeId || req.body.storeId;

    if (!userId) {
      throw new CustomError('Authentication required', 401);
    }

    if (!storeId) {
      throw new CustomError('Store ID required', 400);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const {
      name,
      slug,
      description,
      image,
      banner,
      isActive = true,
      sortOrder = 0,
      productIds = [],
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(name);
    const uniqueSlug = await generateUniqueSlug(finalSlug, Collection, storeId);

    const collection = new Collection({
      storeId,
      name,
      slug: uniqueSlug,
      description,
      image,
      banner,
      isActive,
      sortOrder,
      productIds,
    });

    await collection.save();

    // Audit log
    await AuditService.log(
      req,
      'create' as any,
      'collection',
      `Collection "${name}" created`,
      undefined,
      collection._id.toString()
    );

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: {
        id: collection._id,
        name: collection.name,
        slug: collection.slug,
        isActive: collection.isActive,
        createdAt: collection.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCollections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const storeId = req.storeId || req.params.storeId;

    if (!userId || !storeId) {
      throw new CustomError('Authentication and store ID required', 401);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const { isActive, search, page = 1, limit = 20 } = req.query;

    const query: any = {
      storeId,
      isDeleted: false,
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [collections, total] = await Promise.all([
      Collection.find(query)
        .populate('productIds', 'title slug images status')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Collection.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: collections.map((collection) => ({
        id: collection._id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image: collection.image,
        banner: collection.banner,
        isActive: collection.isActive,
        sortOrder: collection.sortOrder,
        productIds: collection.productIds,
        productCount: collection.productIds?.length || 0,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCollectionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, collectionId } = req.params;

    if (!userId || !storeId || !collectionId) {
      throw new CustomError('Authentication, store ID, and collection ID required', 401);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      storeId,
      isDeleted: false,
    })
      .populate('productIds', 'title slug images status price variants')
      .lean();

    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: collection._id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image: collection.image,
        banner: collection.banner,
        isActive: collection.isActive,
        sortOrder: collection.sortOrder,
        productIds: collection.productIds,
        productCount: collection.productIds?.length || 0,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, collectionId } = req.params;

    if (!userId || !storeId || !collectionId) {
      throw new CustomError('Authentication, store ID, and collection ID required', 401);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      storeId,
      isDeleted: false,
    });

    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    const updateData = req.body;

    // Update slug if name changed
    if (updateData.name && updateData.name !== collection.name) {
      const newSlug = updateData.slug || generateSlug(updateData.name);
      updateData.slug = await generateUniqueSlug(newSlug, Collection, storeId, collectionId);
    }

    Object.assign(collection, updateData);
    await collection.save();

    // Audit log
    await AuditService.log(
      req,
      'update' as any,
      'collection',
      `Collection "${collection.name}" updated`,
      { after: updateData },
      collection._id.toString()
    );

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: {
        id: collection._id,
        name: collection.name,
        slug: collection.slug,
        isActive: collection.isActive,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, collectionId } = req.params;

    if (!userId || !storeId || !collectionId) {
      throw new CustomError('Authentication, store ID, and collection ID required', 401);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      storeId,
      isDeleted: false,
    });

    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    // Soft delete
    collection.isDeleted = true;
    collection.deletedAt = new Date();
    collection.isActive = false;
    await collection.save();

    // Audit log
    await AuditService.log(
      req,
      'delete' as any,
      'collection',
      `Collection "${collection.name}" deleted`,
      undefined,
      collection._id.toString()
    );

    res.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addProductsToCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, collectionId } = req.params;
    const { productIds } = req.body;

    if (!userId || !storeId || !collectionId) {
      throw new CustomError('Authentication, store ID, and collection ID required', 401);
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new CustomError('Product IDs array is required', 400);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      storeId,
      isDeleted: false,
    });

    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    // Add products (avoid duplicates)
    const existingIds = collection.productIds.map((id) => id.toString());
    const newIds = productIds.filter((id: string) => !existingIds.includes(id));
    collection.productIds.push(...newIds);

    await collection.save();

    res.json({
      success: true,
      message: 'Products added to collection successfully',
      data: {
        id: collection._id,
        productCount: collection.productIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeProductsFromCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, collectionId } = req.params;
    const { productIds } = req.body;

    if (!userId || !storeId || !collectionId) {
      throw new CustomError('Authentication, store ID, and collection ID required', 401);
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new CustomError('Product IDs array is required', 400);
    }

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!store) {
      throw new CustomError('Store not found or access denied', 404);
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      storeId,
      isDeleted: false,
    });

    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    // Remove products
    collection.productIds = collection.productIds.filter(
      (id) => !productIds.includes(id.toString())
    );

    await collection.save();

    res.json({
      success: true,
      message: 'Products removed from collection successfully',
      data: {
        id: collection._id,
        productCount: collection.productIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

