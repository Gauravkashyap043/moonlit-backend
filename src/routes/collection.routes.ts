import { Router } from 'express';
import * as collectionController from '../controllers/collection.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateStoreOwnership } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

const createCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().min(1).max(100).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(1000).optional(),
  image: Joi.string().uri().optional(),
  banner: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().default(0).optional(),
  productIds: Joi.array().items(Joi.string()).optional(),
});

const updateCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  slug: Joi.string().min(1).max(100).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(1000).optional(),
  image: Joi.string().uri().optional(),
  banner: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
  productIds: Joi.array().items(Joi.string()).optional(),
});

const productIdsSchema = Joi.object({
  productIds: Joi.array().items(Joi.string()).min(1).required(),
});

// All collection routes require authentication and store ownership
router.use(authenticate);

// Store-scoped routes
router.post('/:storeId/collections', validateStoreOwnership, validate(createCollectionSchema), collectionController.createCollection);
router.get('/:storeId/collections', validateStoreOwnership, collectionController.getCollections);
router.get('/:storeId/collections/:collectionId', validateStoreOwnership, collectionController.getCollectionById);
router.put('/:storeId/collections/:collectionId', validateStoreOwnership, validate(updateCollectionSchema), collectionController.updateCollection);
router.delete('/:storeId/collections/:collectionId', validateStoreOwnership, collectionController.deleteCollection);
router.post('/:storeId/collections/:collectionId/products', validateStoreOwnership, validate(productIdsSchema), collectionController.addProductsToCollection);
router.delete('/:storeId/collections/:collectionId/products', validateStoreOwnership, validate(productIdsSchema), collectionController.removeProductsFromCollection);

export default router;

