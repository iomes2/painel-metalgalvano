# Capa
- **Título do Projeto**: Sistema Empresarial Painel Metalgalvano para Gerenciamento de Processos de Obras
- **Nome do Estudante**: Renan Iomes
- **Curso**: Engenharia de Software
- **Instituição**: Centro Universitário Católica de Santa Catarina - Joinville
- **Data de Entrega**: 30 de Novembro de 2025

# Resumo
Este documento apresenta o Request for Comments (RFC) para o desenvolvimento do sistema Painel Metalgalvano, uma aplicação web full-stack criada por Renan Iomes como Trabalho de Conclusão de Curso (TCC) do 7º semestre de Engenharia de Software. O sistema foi projetado para atender gerentes de obra da Metalgalvano, permitindo login seguro, preenchimento de múltiplos modelos de documentos (Cronograma, Diário de Obra, Checklists, etc.), upload de fotos, geração de relatórios em PDF, busca/filtro avançado e controle de acesso por níveis de usuário. A solução utiliza **Next.js 15**, **TypeScript**, **Tailwind CSS** e **Shadcn/UI** no frontend; **Node.js**, **Express.js**, **Prisma ORM** e **PostgreSQL** no backend; e **Firebase** para autenticação e armazenamento de arquivos. Além disso, o projeto integra recursos de **Inteligência Artificial** (Google Gemini via Genkit) para otimização de processos. Este RFC detalha os requisitos, design arquitetural (com diagramas C4), stack tecnológica, segurança, MVP e cronograma de execução.

## 1. Introdução
- **Contexto**: A Metalgalvano, empresa do setor de galvanização localizada em Araquari/Joinville, enfrenta desafios na gestão de documentos de obra devido a processos manuais e falta de centralização. O Painel Metalgalvano foi idealizado para digitalizar e agilizar essas tarefas, focando especificamente nos gerentes de obra.
- **Justificativa**: A automação de documentos e o uso de uma aplicação web com backend robusto são relevantes para a Engenharia de Software, pois promovem eficiência, escalabilidade e integração de dados em tempo real, atendendo às demandas do setor de construção.
- **Objetivos**:
  - **Principal**: Desenvolver um painel web para gerenciar documentos e imagens de obras da Metalgalvano.
  - **Secundários**:
    - Criar uma interface intuitiva e responsiva com Next.js e Tailwind CSS.
    - Garantir segurança nos dados por meio de autenticação via Firebase Authentication e banco PostgreSQL.
    - Facilitar a geração de relatórios em PDF personalizados.
    - Permitir filtragem e organização de documentos por obra.
    - Estabelecer controle de acesso por nível de usuário (ex: editor, visualizador).

## 2. Descrição do Projeto
- **Tema do Projeto**: O Painel Metalgalvano é um sistema web full-stack que permite a gerentes de obra gerenciar documentos, fazer upload de fotos e gerar relatórios em PDF, utilizando Node.js/Express.js com PostgreSQL (via Prisma ORM) para backend e Firebase para autenticação e armazenamento de arquivos.
- **Problemas a Resolver**:
  - Falta de centralização dos documentos de obra.
  - Processos manuais e lentos para geração de relatórios.
  - Dificuldade em acompanhar visualmente o progresso das obras.
- **Limitações**:
  - O sistema não incluirá o gerenciamento de processos de produção ou estoque.
  - Integrações com sistemas legados não fazem parte da fase inicial.

## 3. Especificação Técnica
### 3.1. Requisitos de Software
- **Lista de Requisitos**:
  - **Funcionais (RF)**:
    - RF01: O sistema deve permitir que o usuário faça login com e-mail e senha.
    - RF02: O sistema deve disponibilizar, no mínimo, cinco modelos de documentos editáveis (Cronograma, Diário de Obra, Checklists, Relatório Fotográfico, Medições).
    - RF03: O sistema deve permitir upload de fotos para anexar aos relatórios de obra.
    - RF04: O sistema deve gerar relatórios com os dados preenchidos pelos usuários.
    - RF05: O sistema deve permitir busca e filtro de documentos por nome da obra ou período.
    - RF06: O sistema deve suportar a edição de documentos antes da submissão final.
    - RF07: O sistema deve permitir o download de relatórios gerados.
    - RF08: O sistema deve oferecer histórico de documentos por obra.
    - RF09: O sistema deve notificar o usuário sobre atualizações em documentos.
    - RF10: O sistema deve permitir a exclusão de fotos enviadas.
    - RF11: O sistema deve suportar múltiplos usuários com níveis de acesso (editor, visualizador).
    - RF12: O sistema deve incluir logout seguro.
    - RF13: O sistema deve permitir recuperação de senha por e-mail.
    - RF14: O sistema deve oferecer painel de controle para monitoramento de obras.
    - RF15: O sistema deve permitir exportar dados das obras (Excel).
    - RF16: O sistema deve realizar backups automáticos periódicos.
    - RF17: O sistema deve oferecer tutorial interativo para novos usuários.
    - RF18: O sistema deve permitir personalização de modelos por administrador.
    - RF19: O sistema deve permitir agendamento de tarefas associadas às obras.
    - RF20: O sistema deve utilizar Inteligência Artificial para auxiliar no preenchimento e correção de relatórios.

  - **Não-Funcionais (RNF)**:
    - RNF01: Carregamento de páginas em menos de 3 segundos.
    - RNF02: Compatibilidade com Chrome e Firefox.
    - RNF03: Suporte a até 50 usuários simultâneos.
    - RNF04: Disponibilidade de 99,9% por mês.
    - RNF05: Resolução mínima suportada: 1280x720 pixels.
    - RNF06: Upload de fotos até 10 MB em menos de 5 segundos.
    - RNF07: Criptografia AES-256 para dados sensíveis no PostgreSQL.
    - RNF08: Backups diários em servidor secundário.
    - RNF09: Suporte a autenticação de dois fatores (2FA) via Firebase.
    - RNF10: Interface totalmente responsiva para dispositivos móveis.
    - RNF11: Logs de ações por 90 dias.
    - RNF12: Até 1 GB de armazenamento de fotos por obra.
    - RNF13: Geração de PDFs em menos de 10 segundos (até 50 páginas).
    - RNF14: Acessibilidade WCAG 2.1 nível AA.
    - RNF15: Atualizações automáticas sem downtime.
    - RNF16: Latência máxima de 200 ms nas chamadas de API.
    - RNF17: Testado para pico de 100 usuários simultâneos.
    - RNF18: Suporte a UTF-8 para qualquer idioma.
    - RNF19: Tamanho total da aplicação ≤ 50 MB.
    - RNF20: Conformidade total com a LGPD.

- **Representação dos Requisitos**: Diagrama de Casos de Uso UML incluído abaixo (ver Apêndices ou arquivo tcc.drawio.png).

### 3.2. Considerações de Design
- **Visão Inicial da Arquitetura**: Arquitetura cliente-servidor com frontend em Next.js (SSR), backend em Node.js/Express.js, banco de dados PostgreSQL (acessado via Prisma ORM) e serviços Firebase para autenticação e armazenamento.
- **Padrões de Arquitetura**: MVC no backend, componentes reutilizáveis e design atômico no frontend.
- **Modelos C4**:
  - **Contexto**: Sistema voltado para gerentes de obra da Metalgalvano (ver diagrama structurizr-SystemContext-001.png).
  - **Contêineres**: Frontend (Next.js), Backend API (Express.js), Banco de Dados (PostgreSQL), Firebase Auth & Storage (ver structurizr-Container-001.png).
  - **Componentes**: Módulos de autenticação, gerenciamento de obras, formulários dinâmicos, upload de fotos, geração de PDF (ver structurizr-Component-001.png).
  - **Código**: APIs RESTful + componentes React funcionais com hooks.

### 3.3. Stack Tecnológica
- **Linguagens de Programação**: TypeScript (Frontend e Backend), JavaScript ES6+.
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, Shadcn/UI, TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- **Backend**: Node.js, Express.js, Prisma ORM, Firebase Admin SDK, PDFMake, Puppeteer, Winston.
- **Inteligência Artificial**: Google Genkit, Google Gemini 2.0 Flash.
- **Ferramentas de Desenvolvimento e Gestão de Projeto**: Git, GitHub, VS Code, Draw.io/Structurizr (diagramas).

### 3.4. Considerações de Segurança
- **Autenticação**: Firebase Authentication com e-mail/senha, recuperação de senha e regras baseadas em roles.
- **Proteção de Dados**: URLs privadas no Firebase Storage (tokens temporários), criptografia AES-256 no PostgreSQL.
- **Prevenção de Ataques**: Validação rigorosa no backend, proteção contra XSS/SQL Injection (Prisma), regras de segurança no Firebase, conformidade LGPD.

## 4. MVP Planejado
O Produto Mínimo Viável incluirá:
- Login autenticado via Firebase
- Preenchimento e submissão de 5 modelos de documentos
- Upload de fotos por obra
- Geração e download de relatório em PDF
- Filtro por obra e período

## 5. Próximos Passos
- **Junho 2025**: Protótipo com login, consulta e upload de fotos (até 15/06/2025).
- **Julho 2025**: Implementação completa de geração de PDFs e backend funcional (até 31/07/2025).
- **Setembro 2025**: Entrega do Portfólio I (15/09/2025).
- **Novembro 2025**: Ajustes finais, testes de desempenho e entrega do Portfólio II (30/11/2025).

## 6. Referências
- Documentação oficial do Next.js
- Documentação oficial do Tailwind CSS
- Documentação oficial do Node.js
- Documentação oficial do Express.js
- Documentação oficial do Prisma ORM
- Documentação oficial do Firebase

## 7. Apêndices (Opcionais)
- Diagrama de Casos de Uso UML (`tcc.drawio.png`)
- Diagrama C4 Nível 1 – Contexto do Sistema (`structurizr-SystemContext-001.png`)
- Diagrama C4 Nível 2 – Contêineres (`structurizr-Container-001.png`)
- Diagrama C4 Nível 3 – Componentes (`structurizr-Component-001.png`)

## 8. Avaliações de Professores
- **Considerações Professor/a**:  
  ____________________________________________________________________
- **Considerações Professor/a**:  
  ____________________________________________________________________
- **Considerações Professor/a**:  
  ____________________________________________________________________
- **Considerações Professor/a**:  
  ____________________________________________________________________
