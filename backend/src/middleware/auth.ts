import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import prisma from "../config/database";
import logger from "../utils/logger";
import { UserRole } from "@prisma/client";

// Estender o Request do Express para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        userId: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware de autenticação Firebase
 * Valida o token JWT do Firebase e adiciona dados do usuário ao request
 */
export const authenticateFirebase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Token não fornecido no header Authorization");
      res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido",
      });
      return;
    }

    const token = authHeader.split("Bearer ")[1];
    logger.info(`Verificando token: ${token.substring(0, 20)}...`);

    // Verificar token com Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    logger.info(
      `Token válido para UID: ${decodedToken.uid}, Email: ${decodedToken.email}`
    );

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    // Se o usuário não existe, retornar erro
    // Se o usuário não existe pelo UID, tentar encontrar pelo email antigo (migração)
    if (!user) {
      const email = decodedToken.email;
      if (email && email.endsWith("@gmail.com")) {
        const oldEmail = email.replace("@gmail.com", "@metalgalvano.forms");
        logger.info(`Tentando encontrar usuário pelo email antigo: ${oldEmail}`);

        const existingUser = await prisma.user.findUnique({
          where: { email: oldEmail },
        });

        if (existingUser) {
          logger.info(`Usuário encontrado para migração: ${existingUser.id}. Atualizando UID e Email...`);
          
          // Atualizar o usuário com o novo UID e novo Email
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firebaseUid: decodedToken.uid,
              email: email,
            },
          });
          
          // Usar o usuário atualizado
          req.user = {
            uid: updatedUser.firebaseUid,
            email: updatedUser.email,
            userId: updatedUser.id,
            role: updatedUser.role,
          };
          
          // Atualizar último login
          await prisma.user.update({
            where: { id: updatedUser.id },
            data: { lastLoginAt: new Date() },
          });

          logger.info(`Migração concluída e autenticação bem-sucedida para: ${updatedUser.name}`);
          next();
          return;
        }
      }

      logger.warn(
        `Usuário não encontrado no banco: Firebase UID ${decodedToken.uid}`
      );
      res.status(403).json({
        success: false,
        message: "Usuário não cadastrado no sistema",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Usuário inativo",
      });
      return;
    }

    // Adicionar dados do usuário ao request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      userId: user.id,
      role: user.role,
    };

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(
      `Autenticação bem-sucedida para usuário: ${user.name} (${user.email})`
    );
    next();
  } catch (error: any) {
    logger.error("Erro na autenticação:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.split("\n")[0],
    });
    res.status(401).json({
      success: false,
      message: "Token inválido ou expirado",
    });
  }
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem permissão para acessar o recurso
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Não autenticado",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Permissão negada",
      });
      return;
    }

    next();
  };
};

/**
 * Middleware opcional de autenticação
 * Permite acesso mesmo sem token, mas adiciona dados do usuário se presente
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(token);

      const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (user && user.isActive) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          userId: user.id,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continua sem autenticar
    logger.warn("Token inválido em auth opcional:", error);
    next();
  }
};
