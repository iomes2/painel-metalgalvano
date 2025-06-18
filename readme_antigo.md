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
   - Crie um projeto no Firebase e adicione as credenciais no arquivo `src/firebaseConfig.js` (exemplo de configuração será fornecido no repositório).
5. Inicie a aplicação:
   ```
   npm start
   ```

## **Uso**
1. Faça login com suas credenciais na tela inicial.
2. No dashboard, insira a Ordem de Serviço (OS) e selecione o tipo de documento.
3. Preencha o formulário e envie fotos, se necessário.
4. Clique em "Gerar e Salvar PDF" para criar o relatório e salvá-lo no Firebase.

## **Contribuições**
Este projeto é parte de um TCC e, no momento, não aceita contribuições externas. No entanto, sugestões e feedback são bem-vindos via GitHub Issues.
