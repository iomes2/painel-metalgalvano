
# Painel da Metalgalvano

Bem-vindo ao repositório do projeto **Painel da Metalgalvano**, desenvolvido como Trabalho de Conclusão de Curso (TCC) para criar uma aplicação web que auxilie gerentes de obra a preencherem formulários de processos de construção, gerarem relatórios em PDF e armazenarem dados de forma segura. Este projeto está em fase inicial e será implementado usando tecnologias modernas como React, Firebase e pdfmake.

## **RFC: Proposta do Projeto**

### **1. Objetivo**
Desenvolver uma aplicação web chamada "Painel da Metalgalvano" que permita aos gerentes de obra da empresa Metalgalvano:
- Fazer login de forma segura.
- Escolher entre 20 tipos de documentos de processos (ex.: Acompanhamento de Cronograma e Diário de Obra).
- Preencher formulários específicos com perguntas relacionadas ao documento escolhido.
- Enviar fotos em alguns formulários, quando aplicável.
- Gerar PDFs com base nas respostas, seguindo templates predefinidos.
- Armazenar os dados e PDFs para consulta futura, vinculados à Ordem de Serviço (OS).

O objetivo principal é facilitar o gerenciamento de relatórios de obras, reduzindo o uso de papel e centralizando as informações em um sistema digital.

### **2. Escopo**
O projeto abrange as seguintes funcionalidades principais:
- **Autenticação**: Login seguro para gerentes usando Firebase Authentication.
- **Dashboard**: Interface para inserir a OS e selecionar o tipo de documento (20 opções).
- **Formulários**:
  - Para o documento "Acompanhamento de Cronograma e Diário de Obra" (opção 1):
    - Campos como data inicial, data final, etapa, situação da etapa (em atraso ou não), motivo do atraso, equipamentos utilizados, fotos da etapa, equipe de trabalho, horário de jornada, entre outros.
    - Suporte a upload de fotos se o gerente indicar que há fotos da etapa.
    - Formulário adicional para Relatório de Inspeção ou RNC (Relatório de Não Conformidade), se aplicável.
  - Para os outros 19 documentos (opções 2 a 20), os formulários serão implementados futuramente.
- **Geração de PDF**: Geração de relatórios em PDF com base nas respostas, seguindo o layout do template "Acompanhamento de Cronograma e Diário de Obra".
- **Armazenamento**:
  - Dados dos formulários e URLs dos PDFs salvos no Firebase Firestore.
  - Fotos e PDFs salvos no Firebase Storage.
- **Consulta**: Futura funcionalidade para consultar formulários salvos por OS.

### **3. Tecnologias**
- **Frontend**: React com Tailwind CSS para uma interface responsiva e amigável.
- **Backend**: Firebase (Authentication para login, Firestore para dados, Storage para arquivos).
- **Geração de PDF**: Biblioteca pdfmake para criar PDFs no lado do cliente.
- **Desenvolvimento**: Firebase Studio para prototipagem e testes iniciais.

### **4. Estrutura Atual**
- O projeto está em fase inicial, com foco na implementação do formulário "Acompanhamento de Cronograma e Diário de Obra".
- A autenticação e o dashboard já foram planejados, e o suporte a upload de fotos foi incluído.
- O PDF gerado segue o layout do template fornecido, com tabelas para relatórios de desenvolvimento e mão de obra.

### **5. Próximos Passos**
- Implementar a tela de consulta para visualizar formulários salvos por OS.
- Desenvolver os formulários para os outros 19 tipos de documentos.
- Adicionar validações nos formulários (ex.: campos obrigatórios, limite de tamanho para fotos).
- Melhorar a experiência do usuário com loading spinners e mensagens de erro claras.
- (Opcional) Incluir as fotos enviadas diretamente no PDF gerado.

### **6. Justificativa**
Este projeto foi escolhido para o TCC porque:
- Atende a uma necessidade real da empresa Metalgalvano, digitalizando o processo de geração de relatórios.
- Permite aplicar conhecimentos de desenvolvimento web (React, Firebase) e gestão de projetos.
- Contribui para a sustentabilidade ao reduzir o uso de papel.

### **7. Contato**
Para feedback ou dúvidas, entre em contato com o desenvolvedor:
- Nome: Renan Iomes
- Email: renaniomes10@gmail.com
- GitHub: [iomes2](https://github.com/iomes2)

---

## **Estado Atual do Projeto e Funcionalidades Implementadas**

Esta seção descreve o estado atual do projeto "Painel da Metalgalvano", detalhando as funcionalidades que foram efetivamente implementadas.

### **Visão Geral Atual**
O sistema permite que gerentes de obra autenticados preencham formulários dinâmicos relacionados a processos de construção. Os dados e arquivos (fotos) são armazenados de forma segura no Firebase. Atualmente, a geração de arquivos PDF é simulada, sendo um dos próximos passos para desenvolvimento. O sistema suporta o encadeamento de formulários, onde o preenchimento de um pode levar a outro formulário relacionado.

### **Tecnologias Utilizadas**
*   **Frontend:** Next.js 15 (utilizando React 18 e App Router), TypeScript, Tailwind CSS, ShadCN UI (para componentes de interface).
*   **Backend & Armazenamento:**
    *   Firebase Authentication: Para login e gerenciamento de usuários.
    *   Firebase Firestore: Banco de dados NoSQL para armazenar dados dos formulários e metadados.
    *   Firebase Storage: Para armazenamento de arquivos (fotos enviadas nos formulários).
*   **Ferramentas de Desenvolvimento:** Firebase Studio, Visual Studio Code.

### **Estrutura de Dados (Firebase)**
*   **Firestore:**
    *   `gerentes_cadastrados/{gerenteId}`:
        *   `nome`: (String) Nome completo do gerente.
        *   *O ID do documento (`gerenteId`) é o identificador único do gerente (ex: "mg01").*
    *   `ordens_servico/{osId}`:
        *   `os`: (String) Número da Ordem de Serviço.
        *   `lastReportAt`: (Timestamp) Data e hora do último relatório submetido para esta OS.
        *   `updatedByGerenteId`: (String) ID do gerente que submeteu o último relatório para esta OS.
    *   `ordens_servico/{osId}/relatorios/{reportId}`:
        *   `formType`: (String) ID do tipo de formulário (ex: 'cronograma-diario-obra').
        *   `formName`: (String) Nome legível do formulário.
        *   `formData`: (Object) Contém todos os dados preenchidos no formulário específico.
        *   `submittedAt`: (Timestamp) Data e hora da submissão.
        *   `submittedBy`: (String) UID do usuário Firebase que submeteu.
        *   `gerenteId`: (String) ID do gerente (ex: 'mg01').
        *   `originatingFormId`: (String, Opcional) ID do relatório principal que iniciou uma sequência de formulários.
    *   `submitted_reports/{reportId}`: (Estrutura similar a `relatorios/{reportId}`) Usada para relatórios que podem não ter uma OS associada diretamente no momento da criação (atualmente, se o campo OS ficar vazio).
*   **Storage:**
    *   Fotos enviadas são armazenadas em: `reports/{userId}/{formId}/{osValue_ou_general}/{timestamp}/{fileName}`.

### **Componentes Funcionais Chave Implementados**
1.  **Autenticação (`src/components/auth`, `src/app/login`):**
    *   Login seguro utilizando e-mail e senha. O e-mail do gerente é construído no formato `id_gerente@metalgalvano.forms` (ex: `mg01@metalgalvano.forms`).
    *   Redirecionamento automático para o dashboard após login ou para a tela de login se não autenticado.

2.  **Dashboard Principal (`src/app/dashboard/page.tsx`):**
    *   Saudação ao usuário.
    *   Dropdown (`Select`) para escolher o tipo de formulário a ser preenchido. A lista de formulários é carregada de `src/config/forms.ts`.
    *   Atualmente, 3 tipos de formulários estão configurados:
        *   "Acompanhamento de Cronograma e Diário de Obra"
        *   "Relatório de Inspeção de Site"
        *   "Relatório de Não Conformidade (RNC)"

3.  **Formulários Dinâmicos (`src/components/forms/DynamicFormRenderer.tsx`, `src/config/forms.ts`):**
    *   Renderização de formulários com base nas definições em `src/config/forms.ts`.
    *   Validação de campos utilizando Zod.
    *   Suporte a diversos tipos de campos: texto, número, data, select, checkbox, upload de arquivos (fotos).
    *   **Lógica de Encadeamento de Formulários:**
        *   Um formulário pode acionar outro após sua submissão, com base em condições definidas em `linkedFormTriggers` (em `src/config/forms.ts`).
        *   Dados (como OS e outros parâmetros customizados via `carryOverParams`) podem ser passados para o próximo formulário na sequência através de parâmetros na URL.
        *   Exemplo de fluxo implementado: "Acompanhamento de Cronograma" pode levar ao "Relatório de Inspeção", que por sua vez pode levar a um "RNC".
    *   Upload de fotos para o Firebase Storage.

4.  **Tela de Consulta (`src/app/dashboard/search/page.tsx`):**
    *   **Busca por Ordem de Serviço (OS):** Permite ao usuário digitar um número de OS e listar todos os relatórios associados.
    *   **Busca de OS por Gerente (Desktop):**
        *   Um dropdown (`Select`) permite escolher um gerente. A lista de gerentes é carregada dinamicamente da coleção `gerentes_cadastrados` no Firestore.
        *   Exibe todas as OSs que tiveram relatórios atualizados pelo gerente selecionado, ordenadas pela data do último relatório.
        *   Permite clicar em uma OS para visualizar seus relatórios detalhados.
    *   **Visualização de Resultados:**
        *   Tabela com os relatórios encontrados (nome, data, etc.).
        *   Botão para visualizar os detalhes completos de cada relatório em uma nova página (`src/app/dashboard/view-report/[osId]/[reportId]/page.tsx`).
        *   Modal para visualização das fotos anexadas a um relatório.
        *   Modal para visualizar relatórios vinculados (ex: se um "Acompanhamento de Cronograma" tem um "RNC" associado, é possível abri-lo diretamente da tela de visualização do acompanhamento).

### **Geração de PDF (Estado Atual)**
*   A funcionalidade de gerar um arquivo PDF físico **não está implementada**.
*   Após a submissão bem-sucedida de um formulário, um diálogo de alerta (`AlertDialog`) é exibido, simulando a conclusão do processo e perguntando se o usuário gostaria de "compartilhar ou baixar o PDF" (ação atualmente indisponível).
*   A biblioteca `pdfmake` está listada como uma tecnologia na RFC, mas ainda não foi integrada ao código para geração real de PDFs.

### **Limitações Atuais e Próximos Passos Conhecidos**
*   **Implementação da Geração de PDF:** A principal funcionalidade pendente é a criação real de arquivos PDF a partir dos dados dos formulários.
*   **Desenvolvimento de Novos Formulários:** A RFC menciona 20 tipos de documentos; atualmente, 3 estão implementados. Os demais precisam ser definidos e configurados.
*   **Melhorias na Interface do Usuário (UX):**
    *   Indicador visual de progresso para sequências de formulários encadeados.
    *   Validações de formulário mais detalhadas e feedback ao usuário.
    *   Loading spinners durante operações demoradas.
*   **(Opcional, conforme RFC) Inclusão de imagens diretamente no PDF gerado.**

---

## **Instruções de Instalação**
1. Clone o repositório:
   ```
   git clone https://github.com/iomes2/painel-metalgalvano.git
   ```
2. Entre no diretório do projeto:
   ```
   cd painel-metalgalvano
   ```
3. Instale as dependências:
   ```
   npm install
   ```
4. Configure o Firebase:
   - Crie um projeto no Firebase.
   - Ative Authentication (Email/Senha), Firestore e Storage.
   - Adicione um aplicativo da Web ao seu projeto Firebase e copie as credenciais de configuração.
   - Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais do Firebase, seguindo o exemplo de `src/lib/firebase.ts` para os nomes das variáveis (ex: `NEXT_PUBLIC_FIREBASE_API_KEY=...`).
   - Configure as coleções no Firestore conforme descrito na seção "Estrutura de Dados (Firebase)" acima (especialmente `gerentes_cadastrados` se for usar a busca por gerente).
5. Inicie a aplicação:
   ```
   npm run dev
   ```

## **Uso**
1. Acesse a aplicação no navegador (geralmente `http://localhost:3000`).
2. Faça login com as credenciais de um gerente (ex: `mg01@metalgalvano.forms` e a senha definida no Firebase Authentication). Certifique-se de que este gerente existe na coleção `gerentes_cadastrados` no Firestore.
3. No dashboard, selecione o tipo de formulário que deseja preencher.
4. Preencha os campos do formulário. Se o formulário permitir upload de fotos, anexe-as.
5. Clique em "Enviar Formulário". Se o formulário fizer parte de uma sequência, você poderá ser redirecionado para o próximo.
6. Utilize a tela "Consultar Formulários" para buscar relatórios por OS ou por gerente.

## **Contribuições**
Este projeto é parte de um TCC e, no momento, não aceita contribuições externas. No entanto, sugestões e feedback são bem-vindos via GitHub Issues.

