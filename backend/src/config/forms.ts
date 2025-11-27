// Definições dos formulários (espelhado do frontend)
// Este arquivo deve ser mantido sincronizado com painel-metalgalvano/src/config/forms.ts

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "date"
    | "file";
  placeholder?: string;
  options?: FormFieldOption[];
  required?: boolean;
  defaultValue?: string | number | boolean | Date | null;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  fields: FormField[];
}

/**
 * Busca definição de formulário por tipo
 */
export function getFormDefinition(formType: string): FormDefinition | null {
  return formDefinitions.find((form) => form.id === formType) || null;
}

/**
 * Definições de todos os formulários do sistema
 * TODO: Manter sincronizado com frontend ou buscar de uma fonte única (ex: banco de dados)
 */
export const formDefinitions: FormDefinition[] = [
  {
    id: "cronograma-diario-obra",
    name: "Acompanhamento de Cronograma e Diário de Obra",
    description:
      "Registra o progresso diário da obra, incluindo cronograma, mão de obra e ocorrências.",
    iconName: "CalendarClock",
    fields: [
      {
        id: "etapaDescricao",
        label: "ETAPA (Descrição)",
        type: "text",
        required: true,
      },
      {
        id: "dataInicialEtapa",
        label: "Data Inicial da Etapa",
        type: "date",
        required: true,
      },
      {
        id: "dataFinalProjetadaEtapa",
        label: "Data Final Projetada da Etapa",
        type: "date",
        required: true,
      },
      {
        id: "ordemServico",
        label: "OS (Ordem de Serviço)",
        type: "text",
        required: true,
      },
      {
        id: "acompanhamentoDataAtual",
        label: "Data do Acompanhamento Diário",
        type: "date",
        required: true,
      },
      {
        id: "situacaoEtapaDia",
        label: "Situação da Etapa no Dia",
        type: "select",
        options: [
          { value: "em_dia", label: "Em dia" },
          { value: "em_atraso", label: "Em atraso" },
          { value: "adiantada", label: "Adiantada" },
          { value: "parada", label: "Obra Parada" },
        ],
        required: true,
      },
      { id: "fotosEtapaDia", label: "Fotos da Etapa do Dia", type: "file" },
      {
        id: "horasRetrabalhoParadasDia",
        label: "Horas de Retrabalho/Paradas no Dia",
        type: "number",
      },
      {
        id: "horarioEfetivoInicioAtividades",
        label: "Horário Efetivo de Início das Atividades",
        type: "text",
      },
      {
        id: "horarioInicioJornadaPrevisto",
        label: "Horário de Início de Jornada Previsto",
        type: "text",
      },
      {
        id: "horarioEfetivoSaidaObra",
        label: "Horário Efetivo de Saída da Obra",
        type: "text",
      },
      {
        id: "horarioTerminoJornadaPrevisto",
        label: "Horário de Término de Jornada Previsto",
        type: "text",
      },
      {
        id: "observacoesOcorrencias",
        label: "Observações/Ocorrências",
        type: "textarea",
      },
      {
        id: "emissaoRNCDia",
        label: "Houve emissão de RNC no dia?",
        type: "select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
        ],
        required: true,
      },
    ],
  },
  {
    id: "rnc",
    name: "Registro de Não Conformidade (RNC)",
    description:
      "Documenta não conformidades identificadas e ações corretivas.",
    iconName: "AlertTriangle",
    fields: [
      {
        id: "ordemServico",
        label: "OS (Ordem de Serviço)",
        type: "text",
        required: true,
      },
      {
        id: "dataIdentificacao",
        label: "Data de Identificação",
        type: "date",
        required: true,
      },
      {
        id: "descricaoNaoConformidade",
        label: "Descrição da Não Conformidade",
        type: "textarea",
        required: true,
      },
      {
        id: "fotosNaoConformidade",
        label: "Fotos da Não Conformidade",
        type: "file",
      },
      {
        id: "gravidade",
        label: "Gravidade",
        type: "select",
        options: [
          { value: "baixa", label: "Baixa" },
          { value: "media", label: "Média" },
          { value: "alta", label: "Alta" },
          { value: "critica", label: "Crítica" },
        ],
        required: true,
      },
      {
        id: "acaoCorretivaImediata",
        label: "Ação Corretiva Imediata",
        type: "textarea",
      },
      { id: "responsavelAcao", label: "Responsável pela Ação", type: "text" },
      { id: "prazoResolucao", label: "Prazo para Resolução", type: "date" },
    ],
  },
  {
    id: "inspecao-qualidade",
    name: "Inspeção de Qualidade",
    description: "Verificação dos padrões de qualidade durante a execução.",
    iconName: "ClipboardCheck",
    fields: [
      {
        id: "ordemServico",
        label: "OS (Ordem de Serviço)",
        type: "text",
        required: true,
      },
      {
        id: "dataInspecao",
        label: "Data da Inspeção",
        type: "date",
        required: true,
      },
      {
        id: "etapaInspecionada",
        label: "Etapa Inspecionada",
        type: "text",
        required: true,
      },
      {
        id: "resultadoInspecao",
        label: "Resultado da Inspeção",
        type: "select",
        options: [
          { value: "aprovado", label: "Aprovado" },
          { value: "aprovado_com_ressalvas", label: "Aprovado com Ressalvas" },
          { value: "reprovado", label: "Reprovado" },
        ],
        required: true,
      },
      { id: "fotosInspecao", label: "Fotos da Inspeção", type: "file" },
      { id: "observacoesInspecao", label: "Observações", type: "textarea" },
      {
        id: "conformidadeSeguranca",
        label: "Conformidade com Normas de Segurança",
        type: "select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
          { value: "parcial", label: "Parcial" },
        ],
        required: true,
      },
    ],
  },
];
