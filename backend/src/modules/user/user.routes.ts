import { Router } from 'express';
import * as UserController from './user.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

router.get('/:id', UserController.getPublicProfile);

router.use(requireAuth);
router.get('/me', UserController.getMe);
router.patch('/profile', upload.single('avatar'), UserController.updateProfile);
router.delete('/account', UserController.deleteAccount);

export default router;
