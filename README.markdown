# Capa

- **Título do Projeto**: Sistema Painel Metalgalvano para Gerenciamento de Obras
- **Nome do Estudante**: Renan Iomes
- **Curso**: Engenharia de Software
- **Data de Entrega**: 10 de Junho de 2025

# Resumo

Este documento apresenta o Request for Comments (RFC) para o desenvolvimento do sistema Painel Metalgalvano, uma aplicação web criada como Trabalho de Conclusão de Curso (TCC) do 7º semestre de Engenharia de Software. O sistema visa atender gerentes de obra da Metalgalvano, permitindo login seguro, seleção e preenchimento de até 20 modelos de documentos (ex.: Cronograma, Diário de Obra), upload de fotos e geração de PDFs. Utilizando Next.js, TypeScript, Tailwind CSS e Firebase (para autenticação, banco de dados e armazenamento), o projeto otimiza a gestão de obras. Este RFC detalha os requisitos, design, stack tecnológica, segurança e cronograma.

## 1. Introdução

- **Contexto**: A Metalgalvano, empresa do setor de galvanização, enfrenta desafios na gestão de documentos de obra devido a processos manuais e falta de centralização. O Painel Metalgalvano foi desenvolvido para digitalizar e agilizar essas tarefas, focando em gerentes de obra.
- **Justificativa**: A automação de documentos e o uso de um painel web são relevantes para a Engenharia de Software, pois promovem eficiência, escalabilidade e integração de dados em tempo real, atendendo às demandas do setor.
- **Objetivos**:
  - **Principal**: Desenvolver um painel web para gerenciar documentos e fotos de obras da Metalgalvano.
  - **Secundários**: 
    - Garantir interface intuitiva e responsiva.
    - Assegurar segurança nos dados via Firebase.
    - Facilitar a geração de relatórios em PDF.

## 2. Descrição do Projeto

- **Tema do Projeto**: O Painel Metalgalvano é um sistema web que permite a gerentes de obra gerenciar documentos, upload de fotos e geração de PDFs personalizados, usando Firebase para backend.
- **Problemas a Resolver**:
  - Falta de centralização de documentos de obra.
  - Processos manuais demorados para relatórios.
  - Dificuldade em acompanhar fotos e progressos em campo.
- **Limitações**: 
  - O sistema não gerenciará processos de produção ou estoque da Metalgalvano.
  - Não incluirá integração com sistemas legados na fase inicial.

## 3. Especificação Técnica

### 3.1. Requisitos de Software
- **Lista de Requisitos**:
  - **Funcionais (RF)**:
    - RF01: O sistema deve permitir login autenticado com e-mail e senha via Firebase.
    - RF02: O sistema deve oferecer até 20 modelos de documentos para preenchimento.
    - RF03: O sistema deve permitir upload de fotos para relatórios.
    - RF04: O sistema deve gerar PDFs personalizados com base nos dados inseridos.
  - **Não-Funcionais (RNF)**:
    - RNF01: O sistema deve carregar páginas em menos de 3 segundos.
    - RNF02: O sistema deve ser compatível com Chrome e Firefox.
    - RNF03: O sistema deve suportar até 50 usuários simultâneos.
- **Representação dos Requisitos**: Um Diagrama de Casos de Uso UML será incluído no apêndice, com atores (ex.: Gerente de Obra) e casos (ex.: Fazer Login, Gerar PDF).

### 3.2. Considerações de Design
- **Visão Inicial da Arquitetura**: O sistema utiliza Next.js para renderização no lado do servidor, com frontend em TypeScript e Tailwind CSS. O Firebase gerencia autenticação, Firestore (banco de dados) e Storage (arquivos).
- **Padrões de Arquitetura**: Padrão MVC implícito no frontend via componentes React, com Firebase como backend sem servidor.
- **Modelos C4**:
  - **Contexto**: O sistema atende gerentes da Metalgalvano, interagindo com dados de obras.
  - **Contêineres**: Frontend (Next.js), Firebase (Autenticação, Firestore, Storage).
  - **Componentes**: Módulos de login, formulários, upload de fotos, geração de PDFs.
  - **Código**: Componentes React para formulários, APIs Firebase para dados.

### 3.3. Stack Tecnológica
- **Linguagens de Programação**: TypeScript para tipagem estática e manutenção.
- **Frameworks e Bibliotecas**: Next.js para SSR, Tailwind CSS para estilização.
- **Ferramentas de Desenvolvimento e Gestão de Projeto**: Git, GitHub, VS Code.

### 3.4. Considerações de Segurança
- **Autenticação**: Firebase Authentication com e-mail/senha e regras de acesso.
- **Proteção de Dados**: Fotos armazenadas no Firebase Storage com URLs privadas.
- **Prevenção de Ataques**: Regras do Firestore para evitar acesso não autorizado.

## 4. Próximos Passos
- **Junho 2025**: Finalização do protótipo com login, consulta e formulários com upload de fotos (até 15/06/2025).
- **Julho 2025**: Implementação de PDFs (até 31/07/2025).
- **Setembro 2025**: Entrega do Portfólio I (15/09/2025).
- **Novembro 2025**: Ajustes finais e Portfólio II (30/11/2025).

## 5. Referências
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação do Firebase](https://firebase.google.com/docs)

## 6. Apêndices (Opcionais)
- Diagrama de Casos de Uso UML (a ser elaborado).

## 7. Avaliações de Professores
- Considerações Professor/a:  
- Considerações Professor/a:  
- Considerações Professor/a:
