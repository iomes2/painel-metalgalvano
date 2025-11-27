import { Request, Response } from "express";
import { catchAsync } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";
import prisma from "../config/database";

/**
 * Controller para buscar OSs por gerente
 * Retorna lista de Ordens de Serviço baseado no gerenteId
 */
export const getOsByGerente = catchAsync(
  async (req: Request, res: Response) => {
    const { gerenteId } = req.query;

    if (!gerenteId) {
      throw new AppError("Parâmetro 'gerenteId' é obrigatório", 400);
    }

    // Buscar todas as OSs únicas que tem formulários do gerente
    const forms = await prisma.form.findMany({
      where: {
        user: {
          email: {
            startsWith: gerenteId as string,
            mode: "insensitive",
          },
        },
      },
      select: {
        osNumber: true,
        submittedAt: true,
        createdAt: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Agrupar por OS e pegar o último relatório de cada uma
    const osMap = new Map<
      string,
      { os: string; lastReportAt: Date; id: string }
    >();

    forms.forEach((form) => {
      const osNumber = form.osNumber;
      const lastReportAt = form.submittedAt || form.createdAt;

      if (
        !osMap.has(osNumber) ||
        lastReportAt > osMap.get(osNumber)!.lastReportAt
      ) {
        osMap.set(osNumber, {
          id: osNumber, // Usando osNumber como ID
          os: osNumber,
          lastReportAt,
        });
      }
    });

    // Converter Map para array e ordenar
    const osList = Array.from(osMap.values()).sort(
      (a, b) => b.lastReportAt.getTime() - a.lastReportAt.getTime()
    );

    res.json({
      success: true,
      data: osList,
    });
  }
);
