import { Router } from 'express';
import authRoutes from './auth.routes';
import storeRoutes from './store.routes';
import productRoutes from './product.routes';
import collectionRoutes from './collection.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/stores', productRoutes);
router.use('/stores', collectionRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

