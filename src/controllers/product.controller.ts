import { Request, Response, NextFunction } from 'express';
import { Product, ProductStatus } from '../models/Product.model';
import { Store } from '../models/Store.model';
import { generateSlug, generateUniqueSlug } from '../utils/slug';
import { CustomError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';

export const createProduct = async (
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
      title,
      slug,
      description,
      sku,
      status = ProductStatus.DRAFT,
      type = 'physical',
      category,
      tags = [],
      images = [],
      variants = [],
      metaTitle,
      metaDescription,
      requiresShipping = true,
      weight,
      taxable = true,
      taxCode,
      trackInventory = true,
      allowBackorder = false,
    } = req.body;

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);
    const uniqueSlug = await generateUniqueSlug(finalSlug, Product, storeId);

    // Validate variants if provided
    if (variants.length > 0) {
      for (const variant of variants) {
        if (!variant.name || !variant.sku || variant.price === undefined || variant.cost === undefined) {
          throw new CustomError('Variant must have name, sku, price, and cost', 400);
        }
        // Convert prices to integers (smallest currency unit)
        variant.price = Math.round(variant.price * 100);
        variant.cost = Math.round(variant.cost * 100);
        if (variant.compareAtPrice) {
          variant.compareAtPrice = Math.round(variant.compareAtPrice * 100);
        }
      }
    }

    // Validate images
    if (images.length > 0) {
      const primaryCount = images.filter((img: any) => img.isPrimary).length;
      if (primaryCount > 1) {
        throw new CustomError('Only one image can be marked as primary', 400);
      }
    }

    const product = new Product({
      storeId,
      title,
      slug: uniqueSlug,
      description,
      sku,
      status,
      type,
      category,
      tags,
      images,
      variants,
      metaTitle,
      metaDescription,
      requiresShipping,
      weight,
      taxable,
      taxCode,
      trackInventory,
      allowBackorder,
    });

    await product.save();

    // Audit log
    await AuditService.log(
      req,
      'create' as any,
      'product',
      `Product "${title}" created`,
      undefined,
      product._id.toString()
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (
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

    const { status, category, search, page = 1, limit = 20 } = req.query;

    const query: any = {
      storeId,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products.map((product) => ({
        id: product._id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        status: product.status,
        type: product.type,
        category: product.category,
        tags: product.tags,
        images: product.images,
        variants: product.variants.map((v: any) => ({
          ...v,
          price: v.price / 100, // Convert back to decimal
          cost: v.cost / 100,
          compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : undefined,
        })),
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        requiresShipping: product.requiresShipping,
        weight: product.weight,
        taxable: product.taxable,
        taxCode: product.taxCode,
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder,
        viewCount: product.viewCount,
        salesCount: product.salesCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
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

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, productId } = req.params;

    if (!userId || !storeId || !productId) {
      throw new CustomError('Authentication, store ID, and product ID required', 401);
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

    const product = await Product.findOne({
      _id: productId,
      storeId,
      isDeleted: false,
    })
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        status: product.status,
        type: product.type,
        category: product.category,
        tags: product.tags,
        images: product.images,
        variants: product.variants.map((v: any) => ({
          ...v,
          price: v.price / 100,
          cost: v.cost / 100,
          compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : undefined,
        })),
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        requiresShipping: product.requiresShipping,
        weight: product.weight,
        taxable: product.taxable,
        taxCode: product.taxCode,
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder,
        viewCount: product.viewCount,
        salesCount: product.salesCount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, productId } = req.params;

    if (!userId || !storeId || !productId) {
      throw new CustomError('Authentication, store ID, and product ID required', 401);
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

    const product = await Product.findOne({
      _id: productId,
      storeId,
      isDeleted: false,
    });

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    const updateData = req.body;

    // Convert prices to integers if variants are updated
    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((variant: any) => ({
        ...variant,
        price: Math.round(variant.price * 100),
        cost: Math.round(variant.cost * 100),
        compareAtPrice: variant.compareAtPrice ? Math.round(variant.compareAtPrice * 100) : undefined,
      }));
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== product.title) {
      const newSlug = updateData.slug || generateSlug(updateData.title);
      updateData.slug = await generateUniqueSlug(newSlug, Product, storeId, productId);
    }

    Object.assign(product, updateData);
    await product.save();

    // Audit log
    await AuditService.log(
      req,
      'update' as any,
      'product',
      `Product "${product.title}" updated`,
      { after: updateData },
      product._id.toString()
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: product._id,
        title: product.title,
        slug: product.slug,
        status: product.status,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { storeId, productId } = req.params;

    if (!userId || !storeId || !productId) {
      throw new CustomError('Authentication, store ID, and product ID required', 401);
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

    const product = await Product.findOne({
      _id: productId,
      storeId,
      isDeleted: false,
    });

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    // Soft delete
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.status = ProductStatus.ARCHIVED;
    await product.save();

    // Audit log
    await AuditService.log(
      req,
      'delete' as any,
      'product',
      `Product "${product.title}" deleted`,
      undefined,
      product._id.toString()
    );

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

