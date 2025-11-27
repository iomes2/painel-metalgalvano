import { Router, Request, Response } from 'express';
import { authenticateFirebase } from '../middleware/auth';
import prisma from '../config/database';
import { catchAsync } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Obter dados do usuário autenticado
 * @access  Private
 */
router.get(
  '/me',
  authenticateFirebase,
  catchAsync(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Obter dados de um usuário específico
 * @access  Private
 */
router.get(
  '/:id',
  authenticateFirebase,
  catchAsync(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;
