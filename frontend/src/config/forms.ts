import type { LucideIcon } from "lucide-react";

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
  options?: FormFieldOption[]; // Para select, radio-group
  required?: boolean;
  defaultValue?: string | number | boolean | Date | null;
  // A propriedade 'validation' foi removida pois não estava sendo utilizada.
  // A validação Zod é construída dinamicamente no DynamicFormRenderer.tsx.
  linkedForm?: {
    // Propriedade para acionar modal de visualização de relatório vinculado
    conditionValue: string; // Valor do campo atual que aciona o link
    targetFormType: string; // ID do tipo de formulário a ser aberto no modal
    linkButtonLabel: string; // Texto para o botão
  };
  /**
   * Define se o campo deve ser exibido com base no valor de outro campo.
   */
  visibilityCondition?: {
    fieldId: string; // ID do campo que este campo depende
    conditionValue: string | string[] | boolean; // Valor(es) que o campo dependente deve ter para este campo aparecer
    operator?: "eq" | "neq" | "in" | "contains"; // Padrão: 'eq'. 'neq' = diferente, 'in' = está na lista, 'contains' = contém string
  };
}

/**
 * Define um parâmetro a ser carregado do formulário atual para o próximo formulário na sequência,
 * via query string na URL.
 */
export interface CarryOverParam {
  /** O ID do campo no formulário *atual* cujo valor será passado para o próximo formulário. */
  fieldIdFromCurrentForm: string;
  /** O nome do parâmetro de query que será usado na URL para o *próximo* formulário.
   *  Ex: se queryParamName for 'meuParam', a URL será ...?meuParam=valorDoFieldIdFromCurrentForm
   */
  queryParamName: string;
}

/**
 * Define uma condição para acionar a navegação para um formulário vinculado após o envio do formulário atual.
 * Se múltiplas condições forem definidas em `linkedFormTriggers`, elas são avaliadas na ordem em que aparecem no array.
 * A primeira condição satisfeita acionará a navegação.
 */
export interface LinkedFormTriggerCondition {
  /**
   * O ID do campo no formulário atual cujo valor será verificado para disparar o gatilho.
   * OU, pode ser uma string prefixada com '_queryParam_' (ex: '_queryParam_nomeDoParametro')
   * para verificar o valor de um parâmetro de URL que foi passado de um formulário anterior
   * (usando `carryOverParams`).
   */
  triggerFieldId: string;
  /** O valor que o campo `triggerFieldId` (ou o query param) deve ter para que este gatilho seja ativado. */
  triggerFieldValue: string;
  /** O ID do formulário (definido neste mesmo arquivo `formDefinitions`) para o qual o usuário será redirecionado. */
  linkedFormId: string;
  /**
   * Opcional. Se fornecido, o valor do campo especificado aqui (que geralmente contém a Ordem de Serviço)
   * no formulário atual será passado como um parâmetro de query `os` para o próximo formulário.
   */
  passOsFieldId?: string;
  /**
   * Opcional. Um array de `CarryOverParam` para passar valores específicos do formulário atual
   * para o próximo formulário como parâmetros de query na URL.
   */
  carryOverParams?: CarryOverParam[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  fields: FormField[];
  /**
   * Opcional. Um array de `LinkedFormTriggerCondition`.
   * Permite definir uma sequência de formulários. Após o envio do formulário atual,
   * as condições em `linkedFormTriggers` são avaliadas em ordem. A primeira condição
   * satisfeita redirecionará o usuário para o `linkedFormId` correspondente.
   */
  linkedFormTriggers?: LinkedFormTriggerCondition[];
}

export const formDefinitions: FormDefinition[] = [
  {
    id: "cronograma-diario-obra",
    name: "DOC-020: Acompanhamento de Cronograma e Diário de Obra",
    description:
      "Registro diário de desenvolvimento da etapa, mão de obra, horários e ocorrências.",
    iconName: "CalendarClock",
    fields: [
      // Cabeçalho / Dados da Etapa
      {
        id: "dataInicial",
        label: "Data Inicial",
        type: "date",
        required: true,
      },
      {
        id: "dataFinalProjetada",
        label: "Data Final Projetada",
        type: "date",
        required: true,
      },
      { id: "ordemServico", label: "OS", type: "text", required: true },

      {
        id: "etapaDescricao",
        label: "ETAPA (Descrição)",
        type: "text",
        required: true,
        placeholder: "Nome/Descrição da etapa",
      },
      {
        id: "dataProjetadaEtapa",
        label: "Data Projetada para a Etapa",
        type: "date",
      },

      // Relatório de Desenvolvimento (Esquerda)
      {
        id: "headerDesenvolvimento",
        label: "--- RELATÓRIO DE DESENVOLVIMENTO ---",
        type: "text",
        defaultValue: "Dados do Dia",
        placeholder: "Seção",
      },
      {
        id: "dataAtual",
        label: "Data Atual",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "situacaoEtapa",
        label: "Situação da Etapa",
        type: "select",
        options: [
          { value: "em_dia", label: "Em Dia" },
          { value: "em_atraso", label: "Em Atraso" },
        ],
        required: true,
      },
      { id: "motivoAtraso", label: "Motivo do Atraso", type: "textarea", visibilityCondition: { fieldId: "situacaoEtapa", conditionValue: "em_atraso" } },
      {
        id: "equipamentosUtilizados",
        label: "Equipamentos Utilizados",
        type: "textarea",
      },

      {
        id: "fotosEtapa",
        label: "Fotos da Etapa?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "uploadFotos",
        label: "Upload Fotos",
        type: "file",
        visibilityCondition: { fieldId: "fotosEtapa", conditionValue: "S" }
      },

      {
        id: "relatorioInspecao",
        label: "Rel. de Insp.?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      // Linked Form RNC
      {
        id: "emissaoRNC",
        label: "Emissão de RNC?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
        linkedForm: {
          conditionValue: "S",
          targetFormType: "rnc-report",
          linkButtonLabel: "Abrir RNC",
        },
      },

      // Relatório de Mão de Obra (Direita)
      {
        id: "headerMaoDeObra",
        label: "--- RELATÓRIO DE MÃO DE OBRA ---",
        type: "text",
        defaultValue: "Equipe e Horários",
        placeholder: "Seção",
      },
      {
        id: "equipeTrabalho",
        label: "Equipe de Trabalho",
        type: "textarea",
        placeholder: "Nomes dos colaboradores",
      },

      // Linked Form PTE
      {
        id: "pteEmitida",
        label: "PTE (Permissão de Trabalho Especial)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
        linkedForm: {
          conditionValue: "S",
          targetFormType: "doc-011-pte",
          linkButtonLabel: "Abrir PTE",
        },
      },

      {
        id: "tempoTotalTrabalho",
        label: "Tempo Total (Horas)",
        type: "text",
        placeholder: "Ex: 8h (07:30 as 17:30)",
      },
      {
        id: "horasRetrabalho",
        label: "Horas de Retrabalho/Paradas",
        type: "text",
      },
      {
        id: "motivoRetrabalho",
        label: "Motivo do Retrabalho/Parada",
        type: "textarea",
        visibilityCondition: { fieldId: "horasRetrabalho", conditionValue: "", operator: "neq" }
      },

      // Horários Início
      {
        id: "horarioInicioJornada",
        label: "Horário Início Jornada (Padrão 07:30h)",
        type: "text",
        defaultValue: "07:30",
      },
      {
        id: "horarioEfetivoInicio",
        label: "Horário Efetivo do Início",
        type: "text",
        placeholder: "HH:MM",
      },
      {
        id: "motivoNaoCumprimentoInicio",
        label: "Motivo atraso início (se houver)",
        type: "text",
      },

      // Horários Término
      {
        id: "horarioTerminoJornada",
        label: "Horário Término Jornada (Padrão 17:30h)",
        type: "text",
        defaultValue: "17:30",
      },
      {
        id: "horarioEfetivoSaida",
        label: "Horário Efetivo de Saída",
        type: "text",
        placeholder: "HH:MM",
      },
      {
        id: "motivoNaoCumprimentoSaida",
        label: "Motivo saída antecipada/tardia (se houver)",
        type: "text",
      },
    ],
    linkedFormTriggers: [
      {
        triggerFieldId: "emissaoRNC",
        triggerFieldValue: "S",
        linkedFormId: "rnc-report",
        passOsFieldId: "ordemServico",
      },
      {
        triggerFieldId: "pteEmitida",
        triggerFieldValue: "S",
        linkedFormId: "doc-011-pte",
        passOsFieldId: "ordemServico",
      },
    ],
  },
  {
    id: "relatorio-inspecao-site",
    name: "Relatório de Inspeção de Site",
    description:
      "Detalha a inspeção de segurança e conformidade realizada no local.",
    iconName: "SearchCheck",
    fields: [
      {
        id: "dataRelatorioInspecao",
        label: "Data da Inspeção",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS (Ordem de Serviço)",
        type: "text",
        placeholder: "Número da OS (pré-preenchido)",
        required: true,
      },
      {
        id: "inspetorNome",
        label: "Nome do Inspetor",
        type: "text",
        placeholder: "Quem realizou a inspeção",
        required: true,
      },
      {
        id: "areaInspecionada",
        label: "Área/Local Inspecionado",
        type: "text",
        placeholder: "Ex: Canteiro de obras, Torre A",
        required: true,
      },
      {
        id: "conformidadeSeguranca",
        label: "Conformidade com Normas de Segurança",
        type: "select",
        options: [
          { value: "sim", label: "Sim, conforme" },
          { value: "nao", label: "Não, com pendências" },
        ],
        required: true,
        defaultValue: "sim",
      },
      {
        id: "itensNaoConformes",
        label: "Itens Não Conformes (se houver)",
        type: "textarea",
        placeholder: "Liste os itens em não conformidade",
        visibilityCondition: { fieldId: "conformidadeSeguranca", conditionValue: "nao" }
      },
      {
        id: "acoesCorretivasSugeridas",
        label: "Ações Corretivas Sugeridas",
        type: "textarea",
        placeholder: "Sugestões para corrigir as não conformidades",
        visibilityCondition: { fieldId: "conformidadeSeguranca", conditionValue: "nao" }
      },
      {
        id: "fotosInspecao",
        label: "Fotos da Inspeção Foram Tiradas?",
        type: "select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
        ],
        defaultValue: "nao",
      },
      {
        id: "uploadFotosInspecao",
        label: "Enviar Fotos da Inspeção",
        type: "file",
        visibilityCondition: { fieldId: "fotosInspecao", conditionValue: "sim" }
      },
      {
        id: "observacoesGeraisInspecao",
        label: "Observações Gerais",
        type: "textarea",
        placeholder: "Outras observações relevantes",
      },
    ],
    linkedFormTriggers: [
      {
        // Se a inspeção NÃO está conforme E o formulário de acompanhamento original indicou que um RNC deveria ser emitido
        triggerFieldId: "_queryParam_rncTriggerValueFromAcompanhamento", // Verifica o valor do query param passado do form de Acompanhamento
        triggerFieldValue: "sim",
        linkedFormId: "rnc-report",
        passOsFieldId: "ordemServico",
        // Pré-condição adicional: este gatilho só deve ser considerado se 'conformidadeSeguranca' for 'nao'.
        // Esta pré-condição mais complexa (AND de um campo do form atual + query param)
        // precisaria ser implementada na lógica de avaliação de gatilhos no DynamicFormRenderer.
        // Por agora, o DynamicFormRenderer só checa triggerFieldId e triggerFieldValue.
        // Para um AND: o ideal seria o `triggerFieldId` ser `conformidadeSeguranca` com valor `nao`
        // E o `_queryParam_rncTriggerValueFromAcompanhamento` com valor `sim` seria avaliado DENTRO dessa condição.
        // Simplificando por agora: se `rncTriggerValueFromAcompanhamento` for 'sim', vai para RNC.
        // Se `conformidadeSeguranca` for `nao` E `rncTriggerValueFromAcompanhamento` for 'nao', não vai para RNC automaticamente por este trigger.
      },
    ],
  },
  {
    id: "doc-001-reuniao-projeto",
    name: "DOC-001: Reunião de Projeto",
    description: "Alinhamento inicial de projeto, mão de obra e equipamentos.",
    iconName: "ClipboardList",
    fields: [
      // Cabeçalho
      {
        id: "dataReuniao",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "projetista",
        label: "Projetista",
        type: "text",
        placeholder: "Nome do projetista",
      },
      {
        id: "gerenteObra",
        label: "Gerente da Obra",
        type: "text",
        placeholder: "Nome do gerente",
      },
      { id: "visto", label: "Visto", type: "text", placeholder: "Visto" },
      {
        id: "cliente",
        label: "Cliente",
        type: "text",
        placeholder: "Nome do cliente",
      },
      {
        id: "local",
        label: "Local",
        type: "text",
        placeholder: "Local da obra",
      },

      // Tipo de Obra e Prazos
      {
        id: "tipoObra",
        label: "Tipo de Obra",
        type: "text",
        placeholder: "Descrição do tipo de obra",
      },
      {
        id: "prazoExecucaoDias",
        label: "Prazo de execução (dias)",
        type: "number",
        placeholder: "0",
      },
      {
        id: "dataInicialProgramada",
        label: "Data inicial programada",
        type: "date",
      },
      {
        id: "dataFinalProgramada",
        label: "Data final programada",
        type: "date",
      },
      {
        id: "dataVisitaCanteiro",
        label: "Data programada para visita no canteiro",
        type: "date",
      },

      {
        id: "projetoApresentado",
        label: "1. O projeto foi apresentado ao Gerente da Obra?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "obsProjetoApresentado",
        label: "Obs (Projeto apresentado)",
        type: "text",
        visibilityCondition: { fieldId: "projetoApresentado", conditionValue: "S" }
      },
      {
        id: "projetosEntregues",
        label: "Os projetos foram entregues ao Gerente e protocolados?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "obsProjetosEntregues",
        label: "Obs (Projetos entregues)",
        type: "text",
        visibilityCondition: { fieldId: "projetosEntregues", conditionValue: "S" }
      },
      {
        id: "projetosPostados",
        label: "Os projetos foram postados no grupo da OS?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "obsProjetosPostados",
        label: "Obs (Projetos postados)",
        type: "text",
        visibilityCondition: { fieldId: "projetosPostados", conditionValue: "S" }
      },

      // 2. Mão de Obra
      {
        id: "necessarioHospedagem",
        label: "Necessário hospedagem?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "numeroPessoasHospedagem",
        label: "Número de pessoas (Hospedagem)",
        type: "number",
        visibilityCondition: { fieldId: "necessarioHospedagem", conditionValue: "S" }
      },
      {
        id: "necessarioRefeicao",
        label: "Necessário refeição?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "numeroRefeicoes", 
        label: "Número de refeições", 
        type: "number",
        visibilityCondition: { fieldId: "necessarioRefeicao", conditionValue: "S" }
      },

      {
        id: "equipeInternaDefinida",
        label: "Equipe interna definida?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "A definir", label: "A definir" },
        ],
      },
      { 
        id: "obsEquipeInterna", 
        label: "Obs (Equipe Interna)", 
        type: "text",
        visibilityCondition: { fieldId: "equipeInternaDefinida", conditionValue: "S" }
      },

      // Equipe (Fields simples para MVP, ideal seria repeater)
      { id: "liderEquipe", label: "Líder", type: "text" },
      { id: "montadorEquipe", label: "Montador", type: "text" },
      { id: "auxiliarEquipe", label: "Auxiliar", type: "text" },
      { id: "outrosEquipe", label: "Outros (Equipe)", type: "text" },

      {
        id: "contratacaoTerceiros",
        label: "Previsão de contratação de mão de obra terceirizada?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "nomesTerceiros", 
        label: "Nomes (Terceiros)", 
        type: "textarea",
        visibilityCondition: { fieldId: "contratacaoTerceiros", conditionValue: "S" }
      },

      {
        id: "treinamentoIntegracao",
        label: "Necessário treinamento ou integração (internos/terceiros)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "tipoTreinamento", 
        label: "Tipo de Treinamento", 
        type: "text",
        visibilityCondition: { fieldId: "treinamentoIntegracao", conditionValue: "S" }
      },
      {
        id: "certificadosValidos",
        label: "Certificados exigidos estão válidos?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { id: "tipoCertificados", label: "Tipo de Certificados", type: "text" },

      // 3. Equipamentos Previstos (Simplificado como Textarea para MVP)
      {
        id: "equipamentosPrevistos",
        label:
          "3. Equipamentos Previstos na Obra (Equipamento / Atividade / Tempo)",
        type: "textarea",
        placeholder: "Liste os equipamentos, atividades e tempo previsto",
      },

      // 4. Documentos Necessários
      // Para cada item vou criar um par Check+Obs simples
      {
        id: "docSegurancaCliente",
        label: "Contato com a Segurança do Trabalho do Cliente",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocSeguranca", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docSegurancaCliente", conditionValue: "S" }
      },

      {
        id: "docManutencaoCaminhao",
        label: "Registro de manutenção de caminhão e MUNK",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocManutencao", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docManutencaoCaminhao", conditionValue: "S" }
      },

      {
        id: "docAPR",
        label: "Analise Preliminar de Risco - APR",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocAPR", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docAPR", conditionValue: "S" }
      },

      {
        id: "docPlanoRigging",
        label: "Plano de rigging",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocRigging", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docPlanoRigging", conditionValue: "S" } 
      },

      {
        id: "docCronograma",
        label: "Cronograma da Obra",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocCronograma", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docCronograma", conditionValue: "S" } 
      },

      {
        id: "docPreObra",
        label: "Formulário Pré-Obra",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocPreObra", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docPreObra", conditionValue: "S" } 
      },

      {
        id: "docInicioObra",
        label: "Formulário Inicio de Obra",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocInicioObra", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docInicioObra", conditionValue: "S" } 
      },

      {
        id: "docDiarioObra",
        label: "Formulário de Diário de Obra",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocDiario", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docDiarioObra", conditionValue: "S" } 
      },

      {
        id: "docDDS",
        label: "Formulário de DDS",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocDDS", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docDDS", conditionValue: "S" } 
      },

      {
        id: "docRNC",
        label: "Relatórios de não-conformidades",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocRNC", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docRNC", conditionValue: "S" } 
      },

      {
        id: "docInspecao",
        label: "Relatório de Inspeção",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocInspecao", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docInspecao", conditionValue: "S" } 
      },

      {
        id: "docARTs",
        label: "ARTs necessárias",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocARTs", 
        label: "Quais?", 
        type: "text",
        visibilityCondition: { fieldId: "docARTs", conditionValue: "S" } 
      },

      {
        id: "docAtividadesAPR",
        label: "Relação de Atividades para incluir no APR",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocAtividadesAPR", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docAtividadesAPR", conditionValue: "S" } 
      },

      {
        id: "docRelacaoCalhas",
        label: "Relação de calhas",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocCalhas", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docRelacaoCalhas", conditionValue: "S" } 
      },

      {
        id: "docCopiaPedido",
        label: "Copia do Pedido",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "obsDocPedido", 
        label: "Obs", 
        type: "text",
        visibilityCondition: { fieldId: "docCopiaPedido", conditionValue: "S" } 
      },

      {
        id: "realizadoPor",
        label: "Realizado por",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "rnc-report",
    name: "DOC-010: Relatório de Não-Conformidade - RNC",
    description:
      "Registro de não conformidades, análise de causa e ações corretivas/preventivas.",
    iconName: "FileWarning",
    fields: [
      // Cabeçalho
      {
        id: "dataEmissao",
        label: "Data de Emissão",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "gerenteObra",
        label: "Gerente da Obra",
        type: "text",
        required: true,
      },
      {
        id: "numeroRNC",
        label: "RNC nº (Nº da OS/ Sequencial)",
        type: "text",
        placeholder: "Ex: 1234/01",
      },

      // Tipo de Ação
      {
        id: "tipoAcao",
        label: "Tipo de Ação",
        type: "select",
        options: [
          { value: "preventiva", label: "Ação Preventiva" },
          { value: "corretiva", label: "Ação Corretiva" },
          { value: "melhoria", label: "Melhoria" },
        ],
        required: true,
      },

      // 1. Descrição
      {
        id: "descricaoProblema",
        label: "1. Descrição do Problema Identificado",
        type: "textarea",
        required: true,
      },
      { id: "dataOcorrencia", label: "Data da Ocorrência", type: "date" },
      { id: "localOrigem", label: "Local de Origem", type: "text" },

      // 2. Pré-Análise (Gerente)
      {
        id: "preAnaliseCausa",
        label: "2. Pré-Análise da Causa (Gerente de Obra)",
        type: "textarea",
        placeholder: "Quando for RNC causada pela montagem",
      },

      // 3. Ação Imediata
      {
        id: "acaoCorretivaImediata",
        label: "3. Ação Corretiva Imediata",
        type: "textarea",
      },

      // 4. Análise Interna
      {
        id: "analiseCausaInterna",
        label: "4. Análise da Causa Interna (PPCP e Gestão)",
        type: "textarea",
      },

      // 5. Ação a ser Tomada
      {
        id: "acaoTomadaOQue",
        label: "5. Ação a ser Tomada - O que?",
        type: "textarea",
        required: true,
      },
      { id: "acaoTomadaQuem", label: "Quem?", type: "text" },
      { id: "acaoTomadaQuando", label: "Quando?", type: "date" },
      { id: "acaoTomadaOnde", label: "Onde?", type: "text" },
      // Anexo de documento ou referências para Ação Tomada
      {
        id: "anexoAcaoTomada",
        label: "Anexar documento ou referências (Ação)",
        type: "file",
      },

      // 6. Método de Avaliação
      {
        id: "metodoAvaliacao",
        label: "6. Método de Avaliação",
        type: "select",
        options: [
          { value: "novo_checklist", label: "Novo Checklist" },
          { value: "registro_fotos", label: "Registro por Fotos" },
          { value: "entrevista", label: "Entrevista" },
          { value: "outro", label: "Outro" },
        ],
      },
      {
        id: "metodoAvaliacaoOutro",
        label: "Outro Método (Descrever)",
        type: "text",
        visibilityCondition: { fieldId: "metodoAvaliacao", conditionValue: "outro" }
      },

      // 6 (Segunda parte) - Eficácia
      {
        id: "solucaoEficaz",
        label: "6. A Solução foi Eficaz?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "obsEficacia",
        label: "Obs Eficácia (Avaliar mensalmente novas ocorrências)",
        type: "textarea",
      },
      { id: "dataAvaliacao", label: "Data da Avaliação", type: "date" },
      {
        id: "responsavelAvaliacao",
        label: "Responsável pela Avaliação",
        type: "text",
      },
      {
        id: "anexoEficacia",
        label: "Anexar documento ou referências (Eficácia)",
        type: "file",
      },

      // 7. Ciência dos Envolvidos
      {
        id: "envolvidosCientes",
        label: "7. Todos os envolvidos estão cientes?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "listaEnvolvidos",
        label: "Lista de Envolvidos (Nome / Cargo / Data)",
        type: "textarea",
        visibilityCondition: { fieldId: "envolvidosCientes", conditionValue: "S" }
      },
      {
        id: "uploadAssinaturas",
        label: "Upload da Lista de Assinaturas (Se houver)",
        type: "file",
        visibilityCondition: { fieldId: "envolvidosCientes", conditionValue: "S" }
      },
    ],
  },
  {
    id: "doc-002-checklist-pre-obra",
    name: "DOC-002: Checklist Pré-Obra",
    description: "Verificação prévia das condições do canteiro e logística.",
    iconName: "ClipboardCheck",
    fields: [
      // Cabeçalho
      {
        id: "dataChecklist",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "engenheiroResponsavel",
        label: "Engenheiro ou Responsável",
        type: "text",
        placeholder: "Nome do responsável",
      },
      {
        id: "gerenteObra",
        label: "Gerente da Obra",
        type: "text",
        placeholder: "Nome do gerente",
      },
      {
        id: "cliente",
        label: "Cliente",
        type: "text",
        placeholder: "Nome do cliente",
      },
      {
        id: "local",
        label: "Local",
        type: "text",
        placeholder: "Local da obra",
      },
      {
        id: "tipoObra",
        label: "Tipo de Obra",
        type: "text",
        placeholder: "Descrição do tipo de obra",
      },
      {
        id: "prazoExecucaoDias",
        label: "Prazo de execução (dias)",
        type: "number",
        placeholder: "0",
      },
      {
        id: "dataInicialProgramada",
        label: "Data inicial programada",
        type: "date",
      },
      {
        id: "dataFinalProgramada",
        label: "Data final programada",
        type: "date",
      },

      // Recursos (Mão de Obra e Logística)
      {
        id: "necessarioHospedagem",
        label: "Necessário hospedagem?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "numeroPessoasHospedagem",
        label: "Número de pessoas (Hospedagem)",
        type: "number",
        visibilityCondition: { fieldId: "necessarioHospedagem", conditionValue: "S" }
      },
      {
        id: "necessarioRefeicao",
        label: "Necessário refeição?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "numeroRefeicoes", 
        label: "Número de refeições", 
        type: "number",
        visibilityCondition: { fieldId: "necessarioRefeicao", conditionValue: "S" }
      },

      {
        id: "equipeInternaDefinida",
        label: "Equipe interna definida?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "A definir", label: "A definir" },
        ],
      },
      { id: "obsEquipeInterna", label: "Obs (Equipe Interna)", type: "text" },

      { id: "liderEquipe", label: "Líder", type: "text" },
      { id: "montadorEquipe", label: "Montador", type: "text" },
      { id: "auxiliarEquipe", label: "Auxiliar", type: "text" },
      { id: "outrosEquipe", label: "Outros (Equipe)", type: "text" },

      {
        id: "contratacaoTerceiros",
        label: "Previsão de contratação de mão de obra terceirizada?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "terceirosTreinamento",
        label: "Necessário treinamento ou integração (internos/terceiros)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "tipoTreinamento", 
        label: "Tipo de Treinamento", 
        type: "text",
        visibilityCondition: { fieldId: "terceirosTreinamento", conditionValue: "S" }
      },
      {
        id: "certificadosValidos",
        label: "Certificados exigidos estão válidos?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "tipoCertificados", 
        label: "Tipo de Certificados", 
        type: "text",
        visibilityCondition: { fieldId: "certificadosValidos", conditionValue: "N" }
      },

      // 1- EQUIPAMENTOS PREVISTOS NA OBRA
      {
        id: "equipamentosPrevistosConferidos",
        label: "1. Equipamentos previstos conferidos conforme Doc. 001?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "obsEquipamentos",
        label: "Observações sobre Equipamentos",
        type: "textarea",
        visibilityCondition: { fieldId: "equipamentosPrevistosConferidos", conditionValue: "N" }
      },

      // 2- AVALIAÇÃO DO CANTEIRO DE OBRA
      // Item 1
      {
        id: "canteiroPronto",
        label: "1. O Canteiro está pronto para iniciar a montagem?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoCanteiro",
        label: "Plano de Ação (Item 1)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "canteiroPronto", conditionValue: "N" }
      },
      // Item 2
      {
        id: "comunicadoLogistica",
        label: "2. Foi comunicado o setor de Logística?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoLogistica",
        label: "Plano de Ação (Item 2)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "comunicadoLogistica", conditionValue: "N" }
      },
      // Item 3
      {
        id: "localDescargaIdentificado",
        label:
          "3. Local de descarga e armazenamento identificado e registros fotográficos informados?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoDescarga",
        label: "Plano de Ação (Item 3)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "localDescargaIdentificado", conditionValue: "N" }
      },
      // Item 4
      {
        id: "cronogramaDisponivel",
        label: "4. Cronograma da obra está disponível?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoCronograma",
        label: "Plano de Ação (Item 4)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "cronogramaDisponivel", conditionValue: "N" }
      },
      // Item 5
      {
        id: "ajusteCliente",
        label: "5. Foi realizado algum ajuste ou acordo Cliente/Metalgalvano?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoAjuste",
        label: "Plano de Ação (Item 5)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "ajusteCliente", conditionValue: "S" }
      },
      // Item 6
      {
        id: "necessidadeConteiner",
        label: "6. Há necessidade de contêiner?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoConteiner",
        label: "Plano de Ação (Item 6)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "necessidadeConteiner", conditionValue: "S" }
      },
      // Item 7
      {
        id: "localMovimentacaoVerificado",
        label: "7. Local de descarregamento e movimentação foi verificado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoMovimentacao",
        label: "Plano de Ação (Item 7)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "localMovimentacaoVerificado", conditionValue: "N" }
      },
      // Item 8
      {
        id: "registroFotosLocal",
        label: "8. Registrar por fotos o local de descarregamento",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "uploadFotosLocal", 
        label: "Upload Fotos (Item 8)", 
        type: "file",
        visibilityCondition: { fieldId: "registroFotosLocal", conditionValue: "S" }
      },
      // Item 9
      {
        id: "sanitariosDisponiveis",
        label: "9. Os Sanitários estão disponíveis ou instalados?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoSanitarios",
        label: "Plano de Ação (Item 9)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "sanitariosDisponiveis", conditionValue: "N" }
      },
      // Item 10
      {
        id: "localRefeicaoProvidenciado",
        label: "10. O local para refeição esta providenciado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoRefeicao",
        label: "Plano de Ação (Item 10)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "localRefeicaoProvidenciado", conditionValue: "N" }
      },
      // Item 11
      {
        id: "docEquipamentosDisponivel",
        label: "11. As documentações dos equipamentos estão disponíveis?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoDocEquipamentos",
        label: "Plano de Ação (Item 11)",
        type: "text",
        placeholder: "Ação se necessário",
        visibilityCondition: { fieldId: "docEquipamentosDisponivel", conditionValue: "N" }
      },
      // Item 12
      {
        id: "telhasJuntoEstrutura",
        label:
          "12. As telhas podem ser entregues na obra juntamente com a estrutura?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoTelhas",
        label: "Plano de Ação (Item 12)",
        type: "text",
        placeholder: "Ação se necessário",
      },
      // Item 13
      {
        id: "liberacaoPortaria",
        label: "13. Há necessidade de liberação de entrada na portaria?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoPortaria",
        label: "Plano de Ação (Item 13)",
        type: "text",
        placeholder: "Ação se necessário",
      },
      // Item 14
      {
        id: "equipamentosDescargaProvidenciados",
        label:
          "14. Equipamentos para descarga estão providenciados, se necessário?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoDescargaEquip",
        label: "Plano de Ação (Item 14)",
        type: "text",
        placeholder: "Ação se necessário",
      },
    ],
  },
  {
    id: "doc-003-checklist-inicio-obra",
    name: "DOC-003: Checklist Inicio de Obra",
    description: "Avaliação Civil e Recebimento de Materiais.",
    iconName: "ClipboardList",
    fields: [
      // Cabeçalho
      {
        id: "dataChecklist",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "engenheiroResponsavel",
        label: "Engenheiro ou Responsável",
        type: "text",
        placeholder: "Nome do responsável",
      },
      {
        id: "gerenteObra",
        label: "Gerente da Obra",
        type: "text",
        placeholder: "Nome do gerente",
      },
      {
        id: "prazoExecucaoDias",
        label: "Prazo de execução (dias)",
        type: "number",
        placeholder: "0",
      },
      {
        id: "dataInicialProgramada",
        label: "Data inicial programada",
        type: "date",
      },
      {
        id: "dataFinalProgramada",
        label: "Data final programada",
        type: "date",
      },

      // AVALIAÇÃO E CONFERENCIA CIVIL (Opções: S, N, NA)
      {
        id: "cotasProjeto",
        label: "1. As cotas estão de acordo com o projeto civil?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { 
        id: "planoAcaoCotas", 
        label: "Plano de Ação (Item 1)", 
        type: "text",
        visibilityCondition: { fieldId: "cotasProjeto", conditionValue: "N" }
      },

      {
        id: "verificarNivel",
        label: "2. Verificar o nível?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { 
        id: "planoAcaoNivel", 
        label: "Plano de Ação (Item 2)", 
        type: "text",
        visibilityCondition: { fieldId: "verificarNivel", conditionValue: "N" }
      },

      {
        id: "conferirEsquadro",
        label: "3. Conferir o esquadro das instalações",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "planoAcaoEsquadro",
        label: "Plano de Ação (Item 3)",
        type: "text",
        visibilityCondition: { fieldId: "conferirEsquadro", conditionValue: "N" }
      },

      {
        id: "conferirPrumo",
        label: "4. Conferir o prumo dos pilares",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { 
        id: "planoAcaoPrumo", 
        label: "Plano de Ação (Item 4)", 
        type: "text",
        visibilityCondition: { fieldId: "conferirPrumo", conditionValue: "N" }
      },

      {
        id: "conferirAlinhamento",
        label: "5. Conferir o alinhamento dos pilares",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "planoAcaoAlinhamento",
        label: "Plano de Ação (Item 5)",
        type: "text",
        visibilityCondition: { fieldId: "conferirAlinhamento", conditionValue: "N" }
      },

      {
        id: "conferirGeometria",
        label: "6. Conferir a geometria dos pilares",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "planoAcaoGeometria",
        label: "Plano de Ação (Item 6)",
        type: "text",
        visibilityCondition: { fieldId: "conferirGeometria", conditionValue: "N" }
      },

      // Item 7 vazio no print, mas vamos manter a estrutura
      {
        id: "itemCivil7",
        label: "7. (Item adicional)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { id: "planoAcaoItem7", label: "Plano de Ação (Item 7)", type: "text" },

      // RECEBIMENTO DOS MATERIAIS
      {
        id: "materiaisAcordoOrdem",
        label:
          "1. Verificar se os materiais enviados estão de acordo com a programação de instalação conforme Ordem de Produção.",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoMateriaisOrdem",
        label: "Plano de Ação (Mat. 1)",
        type: "text",
        visibilityCondition: { fieldId: "materiaisAcordoOrdem", conditionValue: "N" }
      },

      {
        id: "materiaisQualidade",
        label:
          "2. Verificar se os materiais enviados estão com a qualidade especificada para a instalação",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoMateriaisQualidade",
        label: "Plano de Ação (Mat. 2)",
        type: "text",
        visibilityCondition: { fieldId: "materiaisQualidade", conditionValue: "N" }
      },

      {
        id: "acessoriosConforme",
        label:
          "3. Verificar se os acessórios estão conforme especificados em projeto ref. a quantidade, dimensão e qualidade.",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoAcessorios",
        label: "Plano de Ação (Mat. 3)",
        type: "text",
        visibilityCondition: { fieldId: "acessoriosConforme", conditionValue: "N" }
      },

      {
        id: "fixadoresConforme",
        label:
          "4. Verificar e conferir fixadores enviados, conf. lista dos materiais que acompanha.",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoFixadores",
        label: "Plano de Ação (Mat. 4)",
        type: "text",
        visibilityCondition: { fieldId: "fixadoresConforme", conditionValue: "N" }
      },

      {
        id: "telhasConforme",
        label:
          "5. Verificar e conferir as telhas ref. a quantidade e qualidade.",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "planoAcaoTelhas", 
        label: "Plano de Ação (Mat. 5)", 
        type: "text",
        visibilityCondition: { fieldId: "telhasConforme", conditionValue: "N" }
      },

      {
        id: "fotosAreaDescarga",
        label: "6. Fotos da área de descarga",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "uploadFotosDescarga",
        label: "Upload Fotos (Mat. 6)",
        type: "file",
        visibilityCondition: { fieldId: "fotosAreaDescarga", conditionValue: "S" }
      },

      {
        id: "isolamentoIdentificacao",
        label: "7. Isolamento e Identificação quando necessário.",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoIsolamento",
        label: "Plano de Ação (Mat. 7)",
        type: "text",
        visibilityCondition: { fieldId: "isolamentoIdentificacao", conditionValue: "N" }
      },

      {
        id: "segregarMateriais",
        label:
          "8. Segregar e identificar os materiais que não foram utilizados de imediatos em local adequado",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoSegregar",
        label: "Plano de Ação (Mat. 8)",
        type: "text",
        visibilityCondition: { fieldId: "segregarMateriais", conditionValue: "N" }
      },

      {
        id: "apresentacaoAPR",
        label: "9. Apresentação da APR e Cronograma",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "planoAcaoAPR", 
        label: "Plano de Ação (Mat. 9)", 
        type: "text",
        visibilityCondition: { fieldId: "apresentacaoAPR", conditionValue: "N" }
      },

      {
        id: "docEquipamentosDisponiveis",
        label: "10. As documentações dos equipamentos estão disponíveis?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "planoAcaoDocEquip",
        label: "Plano de Ação (Mat. 10)",
        type: "text",
        visibilityCondition: { fieldId: "docEquipamentosDisponiveis", conditionValue: "N" }
      },

      {
        id: "kitFerramentas",
        label:
          "Verificar Kit de ferramentas e acessórios de reserva (furadeira, brocas, trena, EPIs...)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      { 
        id: "planoAcaoFerramentas", 
        label: "Observação ou Ação", 
        type: "text",
        visibilityCondition: { fieldId: "kitFerramentas", conditionValue: "N" }
      },

      // "IMPORTANTE: Em caso de divergência... emitir RNC"
      // Lógica de Trigger para RNC
      {
        id: "divergenciaMateriais",
        label:
          "Houve divergência ou não conformidade no recebimento dos materiais?",
        type: "select",
        options: [
          { value: "sim", label: "Sim (Emitir RNC)" },
          { value: "nao", label: "Não" },
        ],
        required: true,
        defaultValue: "nao",
        linkedForm: {
          conditionValue: "sim",
          targetFormType: "rnc-report",
          linkButtonLabel: "Emitir Relatório de Não Conformidade (RNC)",
        },
      },
    ],
    linkedFormTriggers: [
      {
        triggerFieldId: "divergenciaMateriais",
        triggerFieldValue: "sim",
        linkedFormId: "rnc-report",
        passOsFieldId: "ordemServico",
      },
    ],
  },

  {
    id: "doc-007-apr",
    name: "DOC-007: APR - Análise Preliminar de Risco",
    description:
      "Análise de riscos para atividades de içamento, altura, soldagem, etc.",
    iconName: "ShieldAlert",
    fields: [
      // Cabeçalho
      {
        id: "dataEmissao",
        label: "Data de Emissão",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "dataValidade",
        label: "Data de Validade",
        type: "date",
        required: true,
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "areaLocal",
        label: "Área / Local da Atividade",
        type: "text",
        required: true,
      },
      {
        id: "ferramentasEPIs",
        label: "Ferramentas / Equipamentos e EPIs utilizados",
        type: "textarea",
        placeholder: "Liste ferramentas, equipamentos e EPIs",
      },

      // Responsáveis
      {
        id: "respContratada",
        label: "Responsável Empresa Contratada",
        type: "text",
      },
      {
        id: "respContratante",
        label: "Responsável Empresa Contratante",
        type: "text",
      },
      { id: "segurancaTrabalho", label: "Segurança do Trabalho", type: "text" },

      // Atividades Críticas (Mapeamento dos Riscos do Print)
      {
        id: "atividadeMunk",
        label: "Uso de Caminhão MUNK/Guindaste?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "atividadeAltura",
        label: "Trabalho em Altura (Plataforma/Telhado)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "atividadeSolda",
        label: "Trabalho de Soldagem?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "atividadeEletrica",
        label: "Uso de Ferramentas Elétricas/Lixadeira?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "atividadeMovimentacao",
        label: "Movimentação de Carga Manual/Descarga?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      // Riscos Específicos e Medidas
      {
        id: "riscosObservados",
        label: "Riscos Específicos do Local (Não listados no padrão)",
        type: "textarea",
      },
      {
        id: "medidasControleExtras",
        label: "Medidas de Controle Adicionais",
        type: "textarea",
      },

      // Equipe
      {
        id: "equipeExecucao",
        label: "Nomes da Equipe de Execução (Lista de Presença)",
        type: "textarea",
        placeholder:
          "Liste os nomes dos colaboradores que assinaram a APR física",
      },

      // Encerramento
      {
        id: "cienciaRiscos",
        label:
          "Declaro que a equipe foi orientada (DDS) e está ciente dos riscos e medidas de controle.",
        type: "checkbox",
        defaultValue: false,
      },
      {
        id: "cienciaEmergencia",
        label: "Ciente dos telefones de emergência (Bombeiros 193, SAMU 192)?",
        type: "select",
        options: [{ value: "S", label: "Sim" }],
      },

      {
        id: "uploadFotosAPR",
        label: "Foto da APR Física Assinada (Opcional)",
        type: "file",
      },
    ],
  },
  {
    id: "doc-009-dds",
    name: "DOC-009: Diálogo de Segurança - DDS",
    description: "Registro diário de segurança e presença.",
    iconName: "Users",
    fields: [
      {
        id: "dataDDS",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "obra",
        label: "Obra",
        type: "text",
        placeholder: "Nome da obra ou local",
      },
      {
        id: "gerente",
        label: "Gerente",
        type: "text",
        placeholder: "Nome do gerente",
      },
      {
        id: "responsavel",
        label: "Responsável pelo DDS",
        type: "text",
        required: true,
      },

      {
        id: "temasAbordados",
        label: "Temas Abordados",
        type: "textarea",
        placeholder: "Descreva os temas discutidos",
        required: true,
      },
      {
        id: "episUsoObrigatorio",
        label: "Uso de EPIs (Itens verificados)",
        type: "textarea",
        placeholder: "Liste os EPIs verificados (Ex: Capacete, Botas, Óculos)",
      },

      {
        id: "nomesParticipantes",
        label: "Nomes dos Participantes (Lista)",
        type: "textarea",
        placeholder: "Digite os nomes dos participantes presentes",
      },

      {
        id: "declaracaoTreinamento",
        label:
          "Declaro que recebi treinamento e informações de segurança conforme procedimentos.",
        type: "checkbox",
        defaultValue: true,
      },

      {
        id: "fotoAssinaturas",
        label: "Foto da Lista de Assinaturas (Visto)",
        type: "file",
        required: true,
      },
    ],
  },
  {
    id: "doc-005-relatorio-inspecao-obra",
    name: "DOC-005: Relatório de Inspeção de Obra",
    description: "Inspeção de Içamento, Estrutura Montada, Telhas e Final.",
    iconName: "ClipboardCheck",
    fields: [
      // Cabeçalho
      {
        id: "dataInspecao",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      { id: "obra", label: "Obra", type: "text", placeholder: "Nome da obra" },
      {
        id: "gerente",
        label: "Gerente",
        type: "text",
        placeholder: "Nome do gerente",
      },

      // 1. INSPEÇÃO ANTES DO IÇAMENTO (Montagem no térreo)
      {
        id: "nivelamentoAlinhamento",
        label: "1. Nivelamento e alinhamento (Máx 2%)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "esquadroInstalacoes",
        label: "2. Esquadro das instalações",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "conferenciaMedidas",
        label: "2.1 Conferência das medidas para fixação",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "limpezaPecas",
        label: "2.2 Limpeza das peças (livre de sujeira)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "prumoColunas",
        label: "3. Prumo das colunas ou paredes (1 mm/m)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "retoqueAcabamento",
        label: "4. Necessidade de retoque de acabamento (Pintura/Solda)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "furacaoProjeto",
        label: "5. Furação conforme projeto (qtd e diametro)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "conferenciaParafusos",
        label: "6. Conferência das bitolas e qtde de parafusos",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "qualidadeSolda",
        label: "7. Verificar qualidade da solda (trincas, penetração)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "pesoEstrutura",
        label: "8. Verificação do peso da estrutura a ser içada",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "obsInspecaoIcamento",
        label: "Observações (Antes do Içamento)",
        type: "textarea",
      },
      {
        id: "fotosInspecaoIcamento",
        label: "Fotos (Antes do Içamento)",
        type: "file",
      },

      // 2. ESTRUTURA MONTADA
      {
        id: "instalacaoColunas",
        label: "1. Instalação e fixação de colunas (Torque/Umidade)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "tesourasPrumo",
        label: "2. Tesouras (Prumo/Torque)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "tercasFixacao",
        label: "3. Terças (Fixação e alinhamento)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "tirantesEsticados",
        label: "4. Tirantes (Parafusados e esticados)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "conferenciaTorque",
        label: "5. Conferência de torque (Amostragem 20%)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "calhasFixacao",
        label: "6. Calhas (Fixação, vedação, teste caimento)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "acabamentoCalhas",
        label: "6.1 Acabamento das calhas / amassamento",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "limpezaCalhas",
        label: "6.2 Limpeza das calhas, bocais e dutos",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "obsEstruturaMontada",
        label: "Observações (Estrutura Montada)",
        type: "textarea",
      },
      {
        id: "fotosEstruturaMontada",
        label: "Fotos (Estrutura Montada)",
        type: "file",
      },

      // 3. TELHAS E ACESSORIOS
      {
        id: "alinhamentoTelhas",
        label: "1. Alinhamento de telhas",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "alinhamentoParafusos",
        label: "2. Alinhamento dos parafusos",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "fixacaoTelhas",
        label: "3. Fixação das telhas (Costura)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "mantasDescolamento",
        label: "4. Mantas (Descolamento e rasgos)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "amassamentoTelhas",
        label: "5. Amassamento das telhas",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "limpezaTelhado",
        label: "6. Limpeza do telhado",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "furosSemVedacao",
        label: "7. Furos sem vedação",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { id: "obsTelhas", label: "Observações (Telhas)", type: "textarea" },
      { id: "fotosTelhas", label: "Fotos (Telhas)", type: "file" },

      // 4. INSPEÇÃO FINAL
      {
        id: "limpezaGeral",
        label: "1. Limpeza geral (Sujidade/Água)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "limpezaCanteiro",
        label: "2. Limpeza e arrumação do canteiro",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "sucatasArmazenadas",
        label: "3. Sucatas/restos armazenados em local adequado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "rufosPingadeiras",
        label: "4. Rufos e pingadeiras (Fixação/Vedação)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "bocaisSaida",
        label: "5. Bocais de saída (Vedado/Limpo)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      {
        id: "acabamentoPintura",
        label: "6. Acabamento de pintura (Falhas/Ferrugem)",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
          { value: "NA", label: "N/A" },
        ],
      },
      { id: "obsFinal", label: "Observações (Final)", type: "textarea" },
      { id: "fotosFinal", label: "Fotos (Final)", type: "file" },
    ],
  },

  {
    id: "doc-004-checklist-carga-descarga",
    name: "DOC-004: Checklist de Carga e Descarga",
    description: "Controle de Carga, Descarga e Verificação de Veículos.",
    iconName: "Truck",
    fields: [
      // Cabeçalho
      {
        id: "dataChecklist",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      { id: "motorista", label: "Motorista", type: "text", required: true },
      { id: "veiculo", label: "Veículo", type: "text", required: true },
      { id: "obra", label: "Obra", type: "text", required: true },

      // VERIFICAÇÕES DE PRÉ-CARGA
      {
        id: "materialRetiradoAlmoxarifado",
        label: "Algum material complementar a ser retirado do Almoxarifado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "ordemCompraAlmoxarifado",
        label: "Número da Ordem de Compra (Se houver)",
        type: "text",
        visibilityCondition: { fieldId: "materialRetiradoAlmoxarifado", conditionValue: "S" }
      },
      {
        id: "vistoPPCPPreCarga",
        label: "Visto PPCP (Pré-Carga)",
        type: "checkbox",
      },

      // CARGA (Gerente interno e Motorista)
      {
        id: "manutencaoVeiculo",
        label:
          "Checklist das condições de manutenção de veículo foi preenchido?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "acessoriosDisponiveis",
        label:
          "Acessórios (cintas, cones, calços...) estão disponíveis/condições de uso?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "materialSeparacao",
        label: "Há material para separação das peças metálicas (evitar danos)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "necessidadeBalancim",
        label: "Há necessidade de levar Balancim?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "notaFiscalAcompanha",
        label: "Nota Fiscal acompanha?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "fotosEstadoCarga",
        label: "Está registrado por fotos o estado da carga?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "ordemProducaoAcompanha",
        label: "Ordem de Produção acompanha?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "necessidadeLona",
        label: "Há necessidade de lona?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "necessidadeMadeiras",
        label: "Há necessidade de madeiras?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "vistoriaGerenteProducao",
        label:
          "O carregamento foi vistoriado e aprovado pelo Gerente de Produção?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      { id: "obsCarga", label: "Observações (Carga)", type: "textarea" },
      {
        id: "vistoMotoristaCarga",
        label: "Visto Motorista (Carga)",
        type: "checkbox",
      },
      {
        id: "vistoGerenteCarga",
        label: "Visto Gerente (Carga)",
        type: "checkbox",
      },

      // DESCARGA (Motorista e Gerente de Obra)
      {
        id: "riscoDescarga",
        label: "A carga não oferece risco para descarga?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "guindasteNivelado",
        label: "O guindaste/munk está nivelado e patolado corretamente?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "localIsolado",
        label: "O local está isolado e sinalizado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "quebraCanto",
        label: "A carga a ser içada possui quebra canto (proteger cinta)?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "madeirasRetornando",
        label: "As madeiras da carga estão retornando?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "fotosAntesDescarga",
        label: "Está registrado por fotos o estado da carga antes da descarga?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "checklistInicioObraPreenchido",
        label: "O checklist de Início de Obra esta preenchido?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      { id: "obsDescarga", label: "Observações (Descarga)", type: "textarea" },
      {
        id: "vistoMotoristaDescarga",
        label: "Visto Motorista (Descarga)",
        type: "checkbox",
      },
      {
        id: "vistoGerenteDescarga",
        label: "Visto Gerente (Descarga)",
        type: "checkbox",
      },

      // GERENTE DE OBRA
      {
        id: "treinamentoIcamento",
        label: "Colaboradores possuem treinamento de içamento/movimentação?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "conhecimentoAPR",
        label: "Todos os executantes têm conhecimento da APR?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "espacoArmazenamento",
        label: "Há espaço previsto para armazenamento das peças?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "caibrosApoio",
        label: "Há caibros previstos no piso para apoio das peças?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "fotosCargaArmazenada",
        label: "Foi enviado fotos da carga armazenada?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      {
        id: "vistoGerenteObraFinal",
        label: "Visto Gerente da Obra (Final)",
        type: "checkbox",
      },

      {
        id: "uploadFotosCarregamento",
        label: "Fotos do Carregamento (Enviar ao PCP)",
        type: "file",
      },
    ],
  },

  {
    id: "doc-008-cronograma-obra",
    name: "DOC-008: Cronograma de Execução da Obra",
    description:
      "Planejamento das etapas e prazos da obra (Gráfico de Gantt/Grid).",
    iconName: "CalendarRange",
    fields: [
      {
        id: "dataEmissao",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      { id: "obra", label: "Obra", type: "text", placeholder: "Nome da obra" },
      {
        id: "gerente",
        label: "Gerente",
        type: "text",
        placeholder: "Nome do gerente",
      },
      {
        id: "prazoDias",
        label: "Prazo (Dias)",
        type: "number",
        placeholder: "Ex: 50",
      },

      {
        id: "principaisEtapas",
        label: "Principais Etapas (Resumo)",
        type: "textarea",
        placeholder:
          "Liste as principais etapas (Ex: 1. Fundação, 2. Estrutura...)",
      },

      { id: "dataInicioPrevista", label: "Data Início Prevista", type: "date" },
      {
        id: "dataEntregaPrevista",
        label: "Data de Entrega Prevista",
        type: "date",
        required: true,
      },

      { id: "observacoes", label: "Observações", type: "textarea" },

      {
        id: "uploadCronograma",
        label: "Upload do Cronograma Preenchido (Imagem/PDF do Grid)",
        type: "file",
        required: true,
      },
    ],
  },

  {
    id: "doc-011-pte",
    name: "DOC-011: Permissão de Trabalho Especial (PTE)",
    description:
      "Permissão para trabalhos de risco (Solda, Altura, Elétrica) e Ficha de EPI.",
    iconName: "ShieldAlert",
    fields: [
      // Cabeçalho
      {
        id: "dataPte",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      {
        id: "nomeTrabalhador",
        label: "Nome do Trabalhador",
        type: "text",
        required: true,
      },
      {
        id: "localTrabalho",
        label: "Local do Trabalho",
        type: "text",
        required: true,
      },
      {
        id: "equipamentoEnvolvido",
        label: "Equipamento Envolvido",
        type: "text",
      },
      {
        id: "descricaoTrabalho",
        label: "Descrição do Trabalho",
        type: "textarea",
        required: true,
      },

      {
        id: "horaInicioSolda",
        label: "Hora Início (Atividade Solda)",
        type: "text",
        placeholder: "HH:MM",
      },
      {
        id: "horaTerminoSolda",
        label: "Hora Término (Atividade Solda)",
        type: "text",
        placeholder: "HH:MM",
      },

      // Riscos Potenciais
      {
        id: "riscoExplosao",
        label: "Risco: Explosão / Incêndio",
        type: "checkbox",
      },
      { id: "riscoQueimaduras", label: "Risco: Queimaduras", type: "checkbox" },
      {
        id: "riscoEletricidadeEstatica",
        label: "Risco: Acúmulo de Eletricidade Estática",
        type: "checkbox",
      },
      {
        id: "riscoQuimicos",
        label: "Risco: Produtos Químicos/Corrosivos/Tóxicos",
        type: "checkbox",
      },
      {
        id: "riscoAtropelamento",
        label: "Risco: Atropelamento/Abalroamento",
        type: "checkbox",
      },
      {
        id: "riscoPrensamento",
        label: "Risco: Prensamento de membros / Cortes",
        type: "checkbox",
      },
      {
        id: "riscoProjecaoMateriais",
        label: "Risco: Projeção de materiais/fagulhas",
        type: "checkbox",
      },
      {
        id: "riscoChoqueEletrico",
        label: "Risco: Choque elétrico/Magnéticos",
        type: "checkbox",
      },
      {
        id: "riscoTrabalhosEletricos",
        label: "Risco: Trabalhos elétricos em áreas classificadas",
        type: "checkbox",
      },
      {
        id: "riscoEnergizado",
        label: "Risco: Contato Acidental em partes Energizadas",
        type: "checkbox",
      },
      {
        id: "riscoPisoEscorregadio",
        label: "Risco: Piso escorregadio / Umidade",
        type: "checkbox",
      },
      {
        id: "riscoRupturaCabos",
        label: "Risco: Possibilidade de rupturas em cabos de Aço",
        type: "checkbox",
      },
      {
        id: "riscoQuedaAltura",
        label: "Risco: Queda de diferente nível (escada, plataforma)",
        type: "checkbox",
      },
      {
        id: "riscoQuedaObjetos",
        label: "Risco: Queda material/ objetos",
        type: "checkbox",
      },
      { id: "riscoOutros", label: "Outros Riscos", type: "textarea" },

      // Equipamentos Utilizados
      {
        id: "equipMaquinaSolda",
        label: "Uso de Máquina de Solda",
        type: "checkbox",
      },
      { id: "equipMacarico", label: "Uso de Maçarico", type: "checkbox" },
      { id: "equipOutros", label: "Outros Equipamentos", type: "text" },

      // Precauções - TRABALHO COM SOLDA
      {
        id: "soldaAmbienteAdequado",
        label: "Ambiente adequado para execução?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaConhecimentoEmergencia",
        label: "Equipe conhece sistema de emergência?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaRotasFuga",
        label: "Rotas de fuga desobstruídas?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaIsolamento",
        label: "Local isolado e sinalizado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaProtecaoOleo",
        label: "Protegido contra vazamentos de óleos?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaTrabalhadoresCientes",
        label: "Trabalhadores da área estão cientes?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaEquipInspecionados",
        label: "Equipamentos inspecionados e prontos?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaMateriaisCombustiveis",
        label: "Materiais/gases combustíveis ausentes/controlados?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaLocalAvaliado",
        label: "Local avaliado por bombeiro/brigadista antes?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaConducaoCalor",
        label: "Perigo de condução de calor controlado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaPessoasHabilitadas",
        label: "Há pessoas habilitadas combate a incêndio?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaPrevencaoIncendio",
        label: "Cenário prevenção incêndio montado adequadamente?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaLocalLimpo",
        label: "Local limpo, isolado e sinalizado?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },
      {
        id: "soldaVerificacaoPos",
        label: "Verificar trabalho a quente após 60 min?",
        type: "select",
        options: [
          { value: "S", label: "Sim" },
          { value: "N", label: "Não" },
        ],
      },

      // Assinaturas
      {
        id: "vistoGerenteObra",
        label: "Visto Gerente da Obra",
        type: "checkbox",
      },
      {
        id: "vistoExecutante",
        label: "Visto Executante da Atividade",
        type: "checkbox",
      },

      // Ficha de EPI
      {
        id: "declaracaoEPI",
        label: "Declaração de Recebimento de EPI (Responsabilidade e Guarda)",
        type: "checkbox",
        defaultValue: true,
      },
      {
        id: "uploadFichaEPI",
        label: "Upload da Ficha de EPI Assinada (Obrigatório)",
        type: "file",
        required: true,
      },
    ],
  },

  {
    id: "doc-012-conclusao-obra",
    name: "DOC-012: Relatório Interno de Conclusão de Obra",
    description:
      "Declaração final de conclusão e checklist de documentos complementares (Dossiê).",
    iconName: "ClipboardList",
    fields: [
      {
        id: "dataConclusao",
        label: "Data de Emissão",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },
      { id: "obra", label: "Obra", type: "text", placeholder: "Nome da obra" },
      {
        id: "gerenteObra",
        label: "Gerente da Obra",
        type: "text",
        required: true,
      },

      // Caracterização da Obra
      {
        id: "caracterizacaoObra",
        label: "Caracterização da Obra - Dados da Obra realizada",
        type: "select",
        options: [
          { value: "residencial", label: "Residencial" },
          { value: "misto", label: "Misto" },
          { value: "institucional", label: "Institucional" },
          { value: "comercial_servico", label: "Comercial e Serviço" },
          { value: "industrial", label: "Industrial" },
          { value: "outros", label: "Outros" },
        ],
        required: true,
      },
      {
        id: "caracterizacaoOutros",
        label: "Outros (Especificar)",
        type: "text",
        visibilityCondition: { fieldId: "caracterizacaoObra", conditionValue: "outros" }
      },

      // Declaração
      {
        id: "declaracaoFinal",
        label:
          "DECLARO para os devidos fins que a instalação SE ENCONTRA CONCLUÍDA E EXECUTADA EM CONFORMIDADE COM O PROJETO APROVADO.",
        type: "checkbox",
        defaultValue: true,
      },
      { id: "vistoGerente", label: "Visto Gerente de Obra", type: "checkbox" },

      // Documentos Complementares (Checklist)
      {
        id: "headerDocs",
        label: "DOCUMENTOS COMPLEMENTARES (PPCP) - Checkout do Dossiê",
        type: "text",
        defaultValue: "Marque os documentos anexados/entregues",
        placeholder: "Instrução",
      },

      {
        id: "checkReuniaoProjeto",
        label: "Reunião de Projeto",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkCronograma",
        label: "Cronograma de execução",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkPreObra",
        label: "Checklist de Pré-obra",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkInicioObra",
        label: "Checklist de início de Obra",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkDiarioObra",
        label: "Relatório do Diário de Obra – AS BUILT",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkInspecaoObra",
        label: "Relatório de Inspeção de Obra",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkRNC",
        label: "Relatório de Não Conformidades",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkCAT",
        label: "Relatório de acidentes ou quase acidentes - CAT",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkART",
        label: "ART",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkProjetadoRealizado",
        label: "Demonstrativo do Projetado x Realizado",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },
      {
        id: "checkReuniaoFinal",
        label: "Relatório de Reunião Final da Obra",
        type: "select",
        options: [
          { value: "S", label: "Entregue" },
          { value: "N", label: "Não aplicável" },
        ],
      },

      {
        id: "uploadDossie",
        label: "Upload de Arquivos Complementares (Opcional)",
        type: "file",
      },
    ],
  },

  {
    id: "doc-015-indicadores-obra",
    name: "DOC-015: Indicador de Desempenho de Obra",
    description:
      "Comparativo de Projetado x Realizado (Prazos, Horas, Equipamentos, Financeiro).",
    iconName: "BarChart3",
    fields: [
      {
        id: "dataEmissao",
        label: "Data",
        type: "date",
        required: true,
        defaultValue: new Date(),
      },
      {
        id: "ordemServico",
        label: "OS",
        type: "text",
        placeholder: "Número da OS",
        required: true,
      },

      // PRAZO
      {
        id: "headerPrazo",
        label: "--- PRAZO ---",
        type: "text",
        defaultValue: "Comparativo de Prazos",
        placeholder: "Seção",
      },
      { id: "prazoContratado", label: "Prazo Contratado (Data)", type: "date" },
      {
        id: "dataObraEntregue",
        label: "Obra Entregue (Data Real)",
        type: "date",
      },
      {
        id: "tempoAtrasoAdiantado",
        label: "Tempo de Atraso/Adiantado (Dias)",
        type: "text",
        placeholder: "Ex: +5 dias (Atraso) ou -2 dias (Adiantado)",
      },

      // HORAS
      {
        id: "headerHoras",
        label: "--- HORAS ---",
        type: "text",
        defaultValue: "Projetadas x Realizadas",
        placeholder: "Seção",
      },
      {
        id: "horasProjetadas",
        label: "Horas Projetadas",
        type: "number",
        placeholder: "Total horas",
      },
      {
        id: "horasRealizadas",
        label: "Horas Realizadas",
        type: "number",
        placeholder: "Total horas",
      },
      {
        id: "horasRetrabalho",
        label: "Horas de Retrabalho",
        type: "number",
        placeholder: "Total horas",
      },
      {
        id: "statusHoras",
        label: "Status Horas (Atraso/Adiantado)",
        type: "text",
        placeholder: "Ex: Dentro do previsto",
      },

      // EQUIPAMENTOS (Projetado x Realizado)
      {
        id: "headerEquipamentos",
        label: "--- EQUIPAMENTOS (PPCP) ---",
        type: "text",
        defaultValue: "Comparativo de Equipamentos",
        placeholder: "Seção",
      },

      {
        id: "munkProjetado",
        label: "MUNK (Projetado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },
      {
        id: "munkRealizado",
        label: "MUNK (Realizado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },

      {
        id: "guindasteProjetado",
        label: "Guindaste (Projetado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },
      {
        id: "guindasteRealizado",
        label: "Guindaste (Realizado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },

      {
        id: "plataformaProjetado",
        label: "Plataforma (Projetado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },
      {
        id: "plataformaRealizado",
        label: "Plataforma (Realizado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },

      {
        id: "andaimeProjetado",
        label: "Andaime (Projetado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },
      {
        id: "andaimeRealizado",
        label: "Andaime (Realizado)",
        type: "text",
        placeholder: "Qtd / Horas / Valor",
      },

      // CALHAS
      {
        id: "headerCalhas",
        label: "--- CALHAS (Financeiro) ---",
        type: "text",
        defaultValue: "Comparativo Financeiro",
        placeholder: "Seção",
      },
      {
        id: "calhasProjetado",
        label: "Calhas - Projetado",
        type: "textarea",
        placeholder: "Resumo projetado",
      },
      {
        id: "calhasRealizado",
        label: "Calhas - Realizado",
        type: "textarea",
        placeholder: "Resumo realizado",
      },

      // FRETES
      {
        id: "headerFretes",
        label: "--- FRETES ---",
        type: "text",
        defaultValue: "Comparativo de Fretes",
        placeholder: "Seção",
      },
      {
        id: "fretesProjetado",
        label: "Fretes - Projetado",
        type: "textarea",
        placeholder: "Resumo projetado",
      },
      {
        id: "fretesRealizado",
        label: "Fretes - Realizado",
        type: "textarea",
        placeholder: "Resumo realizado",
      },

      // RNC
      {
        id: "headerRNC",
        label: "--- NÃO CONFORMIDADE (RNC) ---",
        type: "text",
        defaultValue: "Quantitativo por Setor",
        placeholder: "Seção",
      },
      {
        id: "rncEngenharia",
        label: "Engenharia (Qtd)",
        type: "number",
        defaultValue: 0,
      },
      {
        id: "rncCompras",
        label: "Compras (Qtd)",
        type: "number",
        defaultValue: 0,
      },
      {
        id: "rncProducao",
        label: "Produção (Qtd)",
        type: "number",
        defaultValue: 0,
      },
      { id: "rncObra", label: "Obra (Qtd)", type: "number", defaultValue: 0 },
      {
        id: "rncTotal",
        label: "TOTAL de Não Conformidades",
        type: "number",
        defaultValue: 0,
        placeholder: "Soma total",
      },
    ],
  },
];

export const getFormDefinition = (
  formId: string
): FormDefinition | undefined => {
  return formDefinitions.find((form) => form.id === formId);
};
