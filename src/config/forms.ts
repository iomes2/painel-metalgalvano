
import type { LucideIcon } from 'lucide-react';

export interface FormFieldOption {
  value: string;
  label: string;
}
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';
  placeholder?: string;
  options?: FormFieldOption[]; // Para select, radio-group
  required?: boolean;
  defaultValue?: string | number | boolean | Date | null;
  validation?: any; // Zod schema para validação
  linkedForm?: { // Propriedade para acionar modal de visualização de relatório vinculado
    conditionValue: string; // Valor do campo atual que aciona o link
    targetFormType: string; // ID do tipo de formulário a ser aberto no modal
    linkButtonLabel: string; // Texto para o botão
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
    id: 'site-inspection',
    name: 'Relatório de Inspeção do Local (Genérico)',
    description: 'Relatório diário para inspeções de canteiros de obras.',
    iconName: 'ClipboardList',
    fields: [
      { id: 'inspectionDate', label: 'Data da Inspeção', type: 'date', required: true, defaultValue: new Date() },
      { id: 'inspectorName', label: 'Nome do Inspetor', type: 'text', placeholder: 'Ex: João Silva', required: true },
      { id: 'siteLocation', label: 'Localização/Área do Site', type: 'text', placeholder: 'Ex: Setor A, Prédio 2', required: true },
      {
        id: 'weatherConditions',
        label: 'Condições Climáticas',
        type: 'select',
        options: [
          { value: 'sunny', label: 'Ensolarado' },
          { value: 'cloudy', label: 'Nublado' },
          { value: 'rainy', label: 'Chuvoso' },
          { value: 'windy', label: 'Ventoso' },
        ],
        required: true
      },
      { id: 'observations', label: 'Observações e Problemas', type: 'textarea', placeholder: 'Descreva quaisquer observações ou problemas encontrados...', required: true },
      { id: 'safetyCompliance', label: 'Conformidade com Equipamentos de Segurança (EPI)', type: 'checkbox', defaultValue: true },
      { id: 'correctiveActions', label: 'Ações Corretivas Tomadas', type: 'textarea', placeholder: 'Detalhe quaisquer ações corretivas implementadas.' },
    ],
  },
  {
    id: 'equipment-check',
    name: 'Verificação de Manutenção de Equipamento',
    description: 'Formulário para verificações de rotina de manutenção de equipamentos.',
    iconName: 'Wrench',
    fields: [
      { id: 'checkDate', label: 'Data da Verificação', type: 'date', required: true, defaultValue: new Date() },
      { id: 'equipmentId', label: 'ID do Equipamento', type: 'text', placeholder: 'Ex: EXCV-003', required: true },
      {
        id: 'equipmentType',
        label: 'Tipo de Equipamento',
        type: 'select',
        options: [
          { value: 'excavator', label: 'Escavadeira' },
          { value: 'crane', label: 'Guindaste' },
          { value: 'generator', label: 'Gerador' },
          { value: 'welder', label: 'Máquina de Solda' },
        ],
        required: true
      },
      { id: 'operatorName', label: 'Operador/Técnico', type: 'text', required: true, placeholder: 'Ex: Carlos Alberto' },
      { id: 'hoursMeter', label: 'Leitura do Horímetro', type: 'number', placeholder: 'Ex: 1250,5' },
      { id: 'fuelLevel', label: 'Nível de Combustível (%)', type: 'number', placeholder: 'Ex: 75' },
      { id: 'oilLevelOk', label: 'Nível de Óleo OK', type: 'checkbox', defaultValue: false },
      { id: 'maintenanceNotes', label: 'Notas de Manutenção', type: 'textarea', placeholder: 'Quaisquer notas específicas sobre a manutenção realizada ou necessária.' },
    ],
  },
  {
    id: 'material-delivery',
    name: 'Recibo de Entrega de Material',
    description: 'Registrar detalhes dos materiais entregues no local.',
    iconName: 'Truck',
    fields: [
      { id: 'deliveryDate', label: 'Data de Entrega', type: 'date', required: true, defaultValue: new Date() },
      { id: 'supplierName', label: 'Nome do Fornecedor', type: 'text', placeholder: 'Ex: Concreto Ltda.', required: true },
      { id: 'vehicleReg', label: 'Placa do Veículo', type: 'text', placeholder: 'Ex: ABC-1234' },
      { id: 'driverName', label: 'Nome do Motorista', type: 'text', placeholder: 'Ex: José Oliveira' },
      { id: 'materialType', label: 'Tipo de Material', type: 'text', placeholder: 'Ex: Sacos de Cimento, Vergalhões de Aço', required: true },
      { id: 'quantity', label: 'Quantidade Entregue', type: 'number', placeholder: 'Ex: 100', required: true },
      {
        id: 'unit',
        label: 'Unidade',
        type: 'select',
        options: [
          { value: 'bags', label: 'Sacos' },
          { value: 'tons', label: 'Toneladas' },
          { value: 'm3', label: 'Metros Cúbicos (m³)' },
          { value: 'units', label: 'Unidades' },
          { value: 'length_m', label: 'Metros (comprimento)' },
        ],
        required: true
      },
      { id: 'qualityCheckPassed', label: 'Verificação de Qualidade Aprovada', type: 'checkbox', defaultValue: false },
      { id: 'receivedBy', label: 'Recebido Por (Gerente do Local)', type: 'text', required: true, placeholder: 'Ex: Ana Paula Souza' },
      { id: 'deliveryNotes', label: 'Notas de Entrega/Discrepâncias', type: 'textarea', placeholder: 'Alguma observação sobre a entrega ou material.' },
    ],
  },
  {
    id: 'cronograma-diario-obra',
    name: 'Acompanhamento de Cronograma e Diário de Obra',
    description: 'Registra o progresso diário da obra, incluindo cronograma, mão de obra e ocorrências.',
    iconName: 'CalendarClock',
    fields: [
      { id: 'etapaDescricao', label: 'ETAPA (Descrição)', type: 'text', placeholder: 'Descreva a etapa atual da obra', required: true },
      { id: 'dataInicialEtapa', label: 'Data Inicial da Etapa', type: 'date', required: true },
      { id: 'dataFinalProjetadaEtapa', label: 'Data Final Projetada da Etapa', type: 'date', required: true },
      { id: 'ordemServico', label: 'OS (Ordem de Serviço)', type: 'text', placeholder: 'Número da OS', required: true },
      { id: 'acompanhamentoDataAtual', label: 'Data do Acompanhamento Diário', type: 'date', required: true, defaultValue: new Date() },
      {
        id: 'situacaoEtapaDia',
        label: 'Situação da Etapa no Dia',
        type: 'select',
        options: [
          { value: 'em_dia', label: 'Em dia' },
          { value: 'em_atraso', label: 'Em atraso' },
        ],
        required: true
      },
      { id: 'motivoAtrasoDia', label: 'Motivo do Atraso (se aplicável)', type: 'textarea', placeholder: 'Descreva o motivo do atraso' },
      { id: 'equipamentosUtilizadosDia', label: 'Equipamentos Utilizados no Dia', type: 'textarea', placeholder: 'Liste os equipamentos' },
      {
        id: 'fotosEtapaDia',
        label: 'Fotos da Etapa Foram Tiradas?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao'
      },
      {
        id: 'uploadFotosEtapaDia',
        label: 'Enviar Fotos da Etapa',
        type: 'file',
      },
      {
        id: 'relatorioInspecaoEmitidoDia',
        label: 'Relatório de Inspeção Emitido no Dia?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao',
        required: true,
        linkedForm: { // Para visualização em modal
          conditionValue: 'sim',
          targetFormType: 'relatorio-inspecao-site',
          linkButtonLabel: 'Visualizar Relatório de Inspeção'
        }
      },
      {
        id: 'emissaoRNCDia',
        label: 'Emissão de RNC (Relatório de Não Conformidade)?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao',
        required: true,
        linkedForm: { // Para visualização em modal
          conditionValue: 'sim',
          targetFormType: 'rnc-report',
          linkButtonLabel: 'Visualizar RNC Associado'
        }
      },
      { id: 'equipeTrabalhoDia', label: 'Equipe de Trabalho Presente', type: 'textarea', placeholder: 'Nomes ou quantidade por função' },
      {
        id: 'pteDia',
        label: 'PTE (Permissão de Trabalho Especial) Emitida?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao'
        // Poderia ter um linkedForm para um futuro formulário de PTE aqui também
      },
      { id: 'tempoTotalTrabalhoDia', label: 'Tempo Total de Trabalho (Ex: 07:30-17:30 +2h extra)', type: 'text', placeholder: 'HH:MM-HH:MM ou Total de Horas' },
      { id: 'horasRetrabalhoParadasDia', label: 'Horas de Retrabalho/Paradas', type: 'text', placeholder: 'Ex: 1.5h' },
      { id: 'motivoRetrabalhoParadaDia', label: 'Motivo do Retrabalho/Parada', type: 'textarea', placeholder: 'Descreva o motivo' },
      { id: 'horarioInicioJornadaPrevisto', label: 'Horário Previsto Início Jornada (07:30h)', type: 'text', defaultValue: '07:30', placeholder: 'HH:MM' },
      { id: 'horarioEfetivoInicioAtividades', label: 'Horário Efetivo Início Atividades', type: 'text', placeholder: 'HH:MM' },
      { id: 'motivoNaoCumprimentoHorarioInicio', label: 'Motivo Não Cumprimento Horário Início', type: 'textarea' },
      { id: 'horarioTerminoJornadaPrevisto', label: 'Horário Previsto Término Jornada (17:30h)', type: 'text', defaultValue: '17:30', placeholder: 'HH:MM' },
      { id: 'horarioEfetivoSaidaObra', label: 'Horário Efetivo Saída da Obra', type: 'text', placeholder: 'HH:MM' },
      { id: 'motivoNaoCumprimentoHorarioSaida', label: 'Motivo Não Cumprimento Horário Saída', type: 'textarea' },
    ],
    /**
     * Exemplo de configuração de formulários encadeados (fila):
     * A ordem no array 'linkedFormTriggers' determina a prioridade. O primeiro gatilho
     * na lista que tiver sua condição (triggerFieldId/triggerFieldValue) satisfeita será acionado.
     */
    linkedFormTriggers: [
      {
        // GATILHO 1: Para Relatório de Inspeção
        // Se 'relatorioInspecaoEmitidoDia' for 'sim', navega para 'relatorio-inspecao-site'.
        triggerFieldId: 'relatorioInspecaoEmitidoDia',
        triggerFieldValue: 'sim',
        linkedFormId: 'relatorio-inspecao-site',
        passOsFieldId: 'ordemServico', // Passa a OS para o formulário de inspeção.
        carryOverParams: [
          // Passa o valor do campo 'emissaoRNCDia' deste formulário de acompanhamento
          // como um parâmetro de URL chamado 'rncTriggerValue' para o formulário de inspeção.
          // Isso permite que o formulário de inspeção saiba se deve, posteriormente, acionar um RNC.
          { fieldIdFromCurrentForm: 'emissaoRNCDia', queryParamName: 'rncTriggerValue' }
        ]
      },
      {
        // GATILHO 2: Para Relatório de Não Conformidade (RNC)
        // Este gatilho só será avaliado se o GATILHO 1 (para inspeção) não for satisfeito.
        // Se 'emissaoRNCDia' for 'sim', navega para 'rnc-report'.
        triggerFieldId: 'emissaoRNCDia',
        triggerFieldValue: 'sim',
        linkedFormId: 'rnc-report',
        passOsFieldId: 'ordemServico', // Passa a OS para o formulário RNC.
      }
    ],
  },
  {
    id: 'relatorio-inspecao-site',
    name: 'Relatório de Inspeção do Site (Diário)',
    description: 'Documenta inspeções diárias do site vinculadas ao acompanhamento.',
    iconName: 'SearchCheck',
    fields: [
      { id: 'ordemServico', label: 'OS (Ordem de Serviço)', type: 'text', placeholder: 'Número da OS (pré-preenchido)', required: true },
      { id: 'dataInspecao', label: 'Data da Inspeção', type: 'date', required: true, defaultValue: new Date() },
      { id: 'inspetorNome', label: 'Nome do Inspetor', type: 'text', placeholder: 'Ex: João Silva', required: true },
      { id: 'areaInspecionada', label: 'Área Inspecionada', type: 'text', placeholder: 'Ex: Setor A, Andar 2', required: true },
      { id: 'observacoesInspecao', label: 'Observações da Inspeção', type: 'textarea', placeholder: 'Descreva os achados da inspeção...', required: true },
      {
        id: 'conformidadeSeguranca',
        label: 'Conformidade de Segurança Atendida?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'sim',
        required: true
      },
      { id: 'itensNaoConformes', label: 'Itens Não Conformes (se houver)', type: 'textarea', placeholder: 'Liste os itens não conformes' },
      { id: 'acoesCorretivasSugeridas', label: 'Ações Corretivas Sugeridas/Tomadas', type: 'textarea', placeholder: 'Detalhe as ações' },
       {
        id: 'fotosInspecao',
        label: 'Fotos da Inspeção Foram Tiradas?',
        type: 'select',
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao'
      },
      {
        id: 'uploadFotosInspecao',
        label: 'Enviar Fotos da Inspeção',
        type: 'file',
      },
    ],
    linkedFormTriggers: [
      {
        // GATILHO ÚNICO: Para Relatório de Não Conformidade (RNC)
        // Este gatilho é baseado em um parâmetro de URL que foi passado do formulário de 'Acompanhamento'.
        // Se o parâmetro de URL 'rncTriggerValue' (cujo valor original veio do campo 'emissaoRNCDia'
        // do formulário de acompanhamento) for 'sim', então, após este formulário de inspeção,
        // navega para 'rnc-report'.
        triggerFieldId: '_queryParam_rncTriggerValue', // Nota o prefixo '_queryParam_'
        triggerFieldValue: 'sim',
        linkedFormId: 'rnc-report',
        passOsFieldId: 'ordemServico', // Passa a OS (que também foi passada para este form) para o RNC.
        // Não há 'carryOverParams' aqui, pois o RNC não depende de outros dados específicos da inspeção para ser acionado.
      }
    ]
  },
  {
    id: 'rnc-report',
    name: 'Relatório de Não Conformidade (RNC)',
    description: 'Documenta não conformidades identificadas e ações corretivas.',
    iconName: 'FileWarning',
    fields: [
      { id: 'dataRnc', label: 'Data da RNC', type: 'date', required: true, defaultValue: new Date() },
      { id: 'ordemServico', label: 'OS (Ordem de Serviço)', type: 'text', placeholder: 'Número da OS relacionada (pré-preenchido)', required: true },
      { id: 'descricaoNaoConformidade', label: 'Descrição da Não Conformidade', type: 'textarea', placeholder: 'Detalhe a não conformidade observada', required: true },
      { id: 'localOcorrencia', label: 'Local da Ocorrência', type: 'text', placeholder: 'Ex: Setor B, Andar 3', required: true },
      {
        id: 'fotosNaoConformidade',
        label: 'Fotos da Não Conformidade Tiradas?',
        type: 'select',
        options: [{value: 'sim', label: 'Sim'}, {value: 'nao', label: 'Não'}],
        defaultValue: 'nao'
      },
      {
        id: 'uploadFotosNaoConformidade',
        label: 'Enviar Fotos da Não Conformidade',
        type: 'file',
      },
      { id: 'causaRaizIdentificada', label: 'Causa Raiz Identificada', type: 'textarea', placeholder: 'Descreva a causa fundamental do problema' },
      { id: 'acoesCorretivasPropostas', label: 'Ações Corretivas Propostas/Executadas', type: 'textarea', placeholder: 'Detalhe as ações para corrigir e prevenir a recorrência', required: true },
      { id: 'responsavelImplementacao', label: 'Responsável pela Implementação das Ações', type: 'text', placeholder: 'Nome do responsável' },
      { id: 'prazoConclusaoAcoes', label: 'Prazo para Conclusão das Ações', type: 'date' },
      {
        id: 'statusRnc',
        label: 'Status da RNC',
        type: 'select',
        options: [
          { value: 'aberta', label: 'Aberta' },
          { value: 'em_andamento', label: 'Em Andamento' },
          { value: 'concluida', label: 'Concluída' },
          { value: 'cancelada', label: 'Cancelada' },
        ],
        defaultValue: 'aberta',
        required: true
      },
      { id: 'observacoesAdicionaisRnc', label: 'Observações Adicionais', type: 'textarea', placeholder: 'Qualquer informação relevante adicional' },
    ],
    // Este formulário é o último na sequência RNC, então não tem 'linkedFormTriggers' por padrão.
  }
];

export const getFormDefinition = (formId: string): FormDefinition | undefined => {
  return formDefinitions.find(form => form.id === formId);
};

    
