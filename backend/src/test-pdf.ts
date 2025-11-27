/**
 * Script de teste para geração de PDF
 * Execute com: npx ts-node src/test-pdf.ts
 */

import pdfService from "./services/pdfService";
import { getFormDefinition } from "./config/forms";
import { writeFileSync } from "fs";
import { join } from "path";

async function testPdfGeneration() {
  console.log("🧪 Iniciando teste de geração de PDF...\n");

  // Dados de teste simulando um relatório real
  const reportData = {
    id: "test-report-123",
    formType: "cronograma-diario-obra",
    formName: "Acompanhamento de Cronograma e Diário de Obra",
    formData: {
      etapaDescricao: "Montagem de Estrutura Metálica",
      dataInicialEtapa: new Date("2025-11-15"),
      dataFinalProjetadaEtapa: new Date("2025-11-30"),
      ordemServico: "OS-2025-001",
      acompanhamentoDataAtual: new Date(),
      situacaoEtapaDia: "em_dia",
      horasRetrabalhoParadasDia: 2.5,
      horarioEfetivoInicioAtividades: "07:30",
      horarioInicioJornadaPrevisto: "07:00",
      horarioEfetivoSaidaObra: "17:15",
      horarioTerminoJornadaPrevisto: "17:00",
      observacoesOcorrencias:
        "Chuva pela manhã atrasou início em 30 minutos. Equipe compensou estendendo horário.",
      emissaoRNCDia: "nao",
      fotosEtapaDia: [
        {
          name: "estrutura-frente.jpg",
          url: "https://example.com/photo1.jpg",
          type: "image/jpeg",
          size: 2048000,
        },
        {
          name: "estrutura-lateral.jpg",
          url: "https://example.com/photo2.jpg",
          type: "image/jpeg",
          size: 1856000,
        },
      ],
    },
    submittedAt: new Date(),
    submittedBy: "user-firebase-uid-123",
    gerenteId: "joao.silva",
  };

  const osData = {
    osNumber: "OS-2025-001",
    lastReportAt: new Date(),
  };

  try {
    // Buscar definição do formulário
    const formDefinition = getFormDefinition("cronograma-diario-obra");

    if (!formDefinition) {
      console.error("❌ Definição do formulário não encontrada");
      return;
    }

    console.log("✅ Definição do formulário carregada");
    console.log(`   Formulário: ${formDefinition.name}`);
    console.log(`   Campos: ${formDefinition.fields.length}\n`);

    // Gerar PDF
    console.log("📄 Gerando PDF...");
    const startTime = Date.now();

    const pdfBuffer = await pdfService.generateReportPdf(
      reportData,
      formDefinition,
      osData
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ PDF gerado com sucesso em ${duration}ms`);
    console.log(`   Tamanho: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    // Salvar PDF
    const outputPath = join(__dirname, "../test-output.pdf");
    writeFileSync(outputPath, pdfBuffer);

    console.log(`💾 PDF salvo em: ${outputPath}`);
    console.log("\n🎉 Teste concluído com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
    throw error;
  }
}

// Executar teste
testPdfGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Teste falhou:", error);
    process.exit(1);
  });
