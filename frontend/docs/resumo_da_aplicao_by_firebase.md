Contexto do Projeto: Estou trabalhando em uma aplicação web chamada "Painel da Metalgalvano", desenvolvida para gerentes de obra. O objetivo é digitalizar o processo de preenchimento de relatórios de construção, permitindo que os gerentes preencham formulários, enviem fotos e consultem relatórios salvos. O projeto já possui uma base funcional e agora estou planejando expandi-lo com um backend mais robusto.

Pilha de Tecnologias (Tech Stack):

Frontend: Next.js 14+ (com App Router), React, TypeScript.
UI: Tailwind CSS e componentes ShadCN UI.
Backend (BaaS): Firebase
Authentication: Para login de usuários (gerentes).
Firestore: Para armazenamento de dados dos relatórios e metadados.
Storage: Para armazenamento de fotos enviadas nos formulários.
Validação de Formulários: Zod (integrado com react-hook-form).
Estrutura do Projeto e Lógicas Principais:

Autenticação (src/components/auth/):

O login não usa um e-mail tradicional. O gerente insere um id_gerente (ex: mg01) e uma senha.
A lógica em LoginForm.tsx transforma o id_gerente em um e-mail formatado (ex: mg01@metalgalvano.forms) para realizar a autenticação com o Firebase Auth.
O componente AuthInitializer.tsx envolve a aplicação, protegendo as rotas do dashboard e redirecionando usuários não autenticados para a página de login.
Estrutura de Dados no Firestore:

gerentes_cadastrados/{id_gerente}: Coleção que armazena os nomes dos gerentes. O ID do documento é o id_gerente. É populada automaticamente no primeiro envio de formulário por um novo gerente.
ordens_servico/{id_da_os}: Coleção principal para cada Ordem de Serviço. Armazena metadados como lastReportAt e um contador reportCounter para gerar IDs sequenciais.
ordens_servico/{id_da_os}/relatorios/{id_do_relatorio}: Subcoleção onde cada documento é um relatório enviado. Contém formType, formName, formData (um objeto com os dados do formulário), submittedAt, gerenteId, e originatingFormId (se for um relatório filho).
Lógica de Formulários Dinâmicos (src/config/forms.ts e src/components/forms/DynamicFormRenderer.tsx):

Coração do Sistema: O arquivo src/config/forms.ts exporta um array formDefinitions que define a estrutura de todos os formulários da aplicação (campos, tipos, obrigatoriedade, placeholders).
Renderizador Dinâmico: O componente DynamicFormRenderer.tsx lê uma definição de formulário e renderiza a UI e a lógica de validação (usando Zod) dinamicamente. É o motor que permite criar novos formulários apenas editando o arquivo de configuração.
Envio e Geração de ID: Ao enviar, este componente:
Faz upload de arquivos para o Firebase Storage.
Salva os dados do formulário no Firestore, seguindo a estrutura de subcoleção mencionada acima.
Gera IDs de forma inteligente:
Para relatórios "pai" (como 'Acompanhamento de Cronograma'), gera um ID sequencial (1, 2, 3...) dentro da OS.
Para relatórios "filho" (como 'RNC'), gera um ID composto que o vincula ao pai (ex: 1-rnc-report).
Fluxo de Formulários Encadeados: A propriedade linkedFormTriggers na definição de um formulário permite criar uma sequência lógica (ex: após preencher um 'Acompanhamento de Cronograma' e marcar "Sim" para 'Emissão de RNC', o usuário é redirecionado para o formulário de RNC).
Consulta de Relatórios (src/app/dashboard/search/page.tsx):

Busca por OS: Permite buscar todos os relatórios de uma Ordem de Serviço específica.
Busca por Gerente (Desktop): Permite selecionar um gerente (de uma lista carregada da coleção gerentes_cadastrados) e listar todas as OSs em que ele trabalhou. Clicar em uma OS nessa lista executa uma busca pelos relatórios daquela OS.
Visualização Hierárquica: Os resultados são exibidos em uma tabela que aninha visualmente os relatórios "filho" sob seus respectivos relatórios "pai", usando um recuo e ícones para indicar a hierarquia.
Geração de PDF (Simulada):

Atualmente, a geração de PDF não está implementada. Após o envio de um formulário, um diálogo de alerta (AlertDialog) é exibido para o usuário, simulando a conclusão do fluxo. A implementação real é um próximo passo.