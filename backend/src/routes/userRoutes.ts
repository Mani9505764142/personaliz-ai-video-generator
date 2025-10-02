import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { userValidation } from '../utils/validationSchemas';

const router = Router();
const userController = new UserController();

// POST /api/v1/users/register - Register new user
router.post(
  '/register',
  validateRequest(userValidation.register),
  userController.register
);

// POST /api/v1/users/login - Login user
router.post(
  '/login',
  validateRequest(userValidation.login),
  userController.login
);

// GET /api/v1/users/profile - Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// PUT /api/v1/users/profile - Update user profile
router.put(
  '/profile',
  authMiddleware,
  validateRequest(userValidation.updateProfile),
  userController.updateProfile
);

// POST /api/v1/users/logout - Logout user
router.post('/logout', authMiddleware, userController.logout);

export default router;
