import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateStoreOwnership } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

const productVariantSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().required(),
  price: Joi.number().min(0).required(),
  compareAtPrice: Joi.number().min(0).optional(),
  cost: Joi.number().min(0).required(),
  inventory: Joi.number().min(0).default(0),
  weight: Joi.number().min(0).optional(),
  barcode: Joi.string().optional(),
});

const productImageSchema = Joi.object({
  url: Joi.string().uri().required(),
  alt: Joi.string().optional(),
  isPrimary: Joi.boolean().default(false),
});

const createProductSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  slug: Joi.string().min(1).max(200).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(5000).optional(),
  sku: Joi.string().optional(),
  status: Joi.string().valid('draft', 'active', 'out_of_stock', 'archived').optional(),
  type: Joi.string().valid('physical', 'digital', 'service').optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(productImageSchema).optional(),
  variants: Joi.array().items(productVariantSchema).optional(),
  metaTitle: Joi.string().max(200).optional(),
  metaDescription: Joi.string().max(500).optional(),
  requiresShipping: Joi.boolean().optional(),
  weight: Joi.number().min(0).optional(),
  taxable: Joi.boolean().optional(),
  taxCode: Joi.string().optional(),
  trackInventory: Joi.boolean().optional(),
  allowBackorder: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  slug: Joi.string().min(1).max(200).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(5000).optional(),
  sku: Joi.string().optional(),
  status: Joi.string().valid('draft', 'active', 'out_of_stock', 'archived').optional(),
  type: Joi.string().valid('physical', 'digital', 'service').optional(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(productImageSchema).optional(),
  variants: Joi.array().items(productVariantSchema).optional(),
  metaTitle: Joi.string().max(200).optional(),
  metaDescription: Joi.string().max(500).optional(),
  requiresShipping: Joi.boolean().optional(),
  weight: Joi.number().min(0).optional(),
  taxable: Joi.boolean().optional(),
  taxCode: Joi.string().optional(),
  trackInventory: Joi.boolean().optional(),
  allowBackorder: Joi.boolean().optional(),
});

// All product routes require authentication and store ownership
router.use(authenticate);

// Store-scoped routes
router.post('/:storeId/products', validateStoreOwnership, validate(createProductSchema), productController.createProduct);
router.get('/:storeId/products', validateStoreOwnership, productController.getProducts);
router.get('/:storeId/products/:productId', validateStoreOwnership, productController.getProductById);
router.put('/:storeId/products/:productId', validateStoreOwnership, validate(updateProductSchema), productController.updateProduct);
router.delete('/:storeId/products/:productId', validateStoreOwnership, productController.deleteProduct);

export default router;

