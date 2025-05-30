
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
  options?: FormFieldOption[]; // For select, radio-group
  required?: boolean;
  defaultValue?: string | number | boolean | Date | null;
  validation?: any; // Zod schema for validation
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  iconName?: string; 
  fields: FormField[];
}

export const formDefinitions: FormDefinition[] = [
  {
    id: 'site-inspection',
    name: 'Relatório de Inspeção do Local',
    description: 'Relatório diário para inspeções de canteiros de obras.',
    iconName: 'ClipboardList',
    fields: [
      { id: 'inspectionDate', label: 'Data da Inspeção', type: 'date', required: true },
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
      { id: 'checkDate', label: 'Data da Verificação', type: 'date', required: true },
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
      { id: 'deliveryDate', label: 'Data de Entrega', type: 'date', required: true },
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
        id: 'relatorioInspecaoDia', 
        label: 'Relatório de Inspeção Emitido?', 
        type: 'select', 
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao'
      },
      { 
        id: 'emissaoRNCDia', 
        label: 'Emissão de RNC (Relatório de Não Conformidade)?', 
        type: 'select', 
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao',
        required: true
      },
      { id: 'equipeTrabalhoDia', label: 'Equipe de Trabalho Presente', type: 'textarea', placeholder: 'Nomes ou quantidade por função' },
      { 
        id: 'pteDia', 
        label: 'PTE (Permissão de Trabalho Especial) Emitida?', 
        type: 'select', 
        options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }],
        defaultValue: 'nao'
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
  },
  {
    id: 'rnc-report',
    name: 'Relatório de Não Conformidade (RNC)',
    description: 'Documenta não conformidades identificadas e ações corretivas.',
    iconName: 'FileWarning',
    fields: [
      { id: 'dataRnc', label: 'Data da RNC', type: 'date', required: true, defaultValue: new Date() },
      { id: 'ordemServico', label: 'OS (Ordem de Serviço)', type: 'text', placeholder: 'Número da OS relacionada', required: true },
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
  }
];

export const getFormDefinition = (formId: string): FormDefinition | undefined => {
  return formDefinitions.find(form => form.id === formId);
};

    