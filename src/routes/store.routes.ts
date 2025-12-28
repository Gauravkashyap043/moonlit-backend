import { Router } from 'express';
import * as storeController from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

const createStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(1000).optional(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  timezone: Joi.string().optional(),
});

const updateStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  timezone: Joi.string().optional(),
  settings: Joi.object({
    allowCod: Joi.boolean().optional(),
    allowGuestCheckout: Joi.boolean().optional(),
    requireEmailVerification: Joi.boolean().optional(),
  }).optional(),
});

// All store routes require authentication
router.use(authenticate);

router.post('/', validate(createStoreSchema), storeController.createStore);
router.get('/', storeController.getStores);
router.get('/:storeId', storeController.getStoreById);
router.put('/:storeId', validate(updateStoreSchema), storeController.updateStore);
router.delete('/:storeId', storeController.deleteStore);

export default router;

