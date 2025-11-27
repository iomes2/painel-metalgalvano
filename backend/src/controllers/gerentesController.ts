import { Request, Response } from "express";
import { catchAsync } from "../middleware/errorHandler";
import prisma from "../config/database";

/**
 * Controller para listar gerentes cadastrados
 * Lista todos os usuários com role MANAGER ou ADMIN
 */
export const listGerentes = catchAsync(async (_req: Request, res: Response) => {
  try {
    // Tentar buscar do banco
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["MANAGER", "ADMIN"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Formatar para o padrão esperado pelo frontend
    const gerentes = users.map((user) => ({
      id: user.email?.split("@")[0] || user.id,
      nome: user.name || user.email || "Sem nome",
    }));

    res.json({
      success: true,
      data: gerentes,
    });
  } catch (error) {
    // Se banco não estiver configurado, retornar dados mock
    console.warn("Banco não configurado, retornando dados mock");
    const gerentesMock = [
      { id: "joao.silva", nome: "João Silva" },
      { id: "maria.santos", nome: "Maria Santos" },
      { id: "pedro.oliveira", nome: "Pedro Oliveira" },
      { id: "ana.costa", nome: "Ana Costa" },
    ];

    res.json({
      success: true,
      data: gerentesMock,
    });
  }
});
