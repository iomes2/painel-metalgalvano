# 📋 Requisitos do RFC - Painel Metalgalvano

**Documento de Rastreamento de Requisitos**  
**Autor:** Renan Iomes  
**Curso:** Engenharia de Software - 7º Semestre  
**Data:** Novembro 2025

---

## ✅ Requisitos Funcionais (RF) - 20 Total

| ID       | Descrição                                                                                | Status                    | Observações                         |
| -------- | ---------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| **RF01** | O sistema deve permitir que o usuário faça login com e-mail e senha                      | ✅ **IMPLEMENTADO**       | Firebase Authentication configurado |
| **RF02** | O sistema deve disponibilizar, no mínimo, cinco modelos de documentos editáveis          | ⚠️ **PARCIAL**            | Apenas 3 de 20 implementados        |
| **RF03** | O sistema deve permitir upload de fotos para anexar aos relatórios                       | ✅ **IMPLEMENTADO**       | Campo `file` nos formulários        |
| **RF04** | O sistema deve gerar relatórios com os dados preenchidos                                 | ⚠️ **EM DESENVOLVIMENTO** | Próxima fase (Julho 2025)           |
| **RF05** | O sistema deve permitir busca e filtro de documentos por nome da obra ou período         | ✅ **IMPLEMENTADO**       | Página `/dashboard/search`          |
| **RF06** | O sistema deve suportar a edição de documentos preenchidos antes da submissão final      | ❌ **PENDENTE**           | Não implementado                    |
| **RF07** | O sistema deve permitir o download de relatórios gerados pelo usuário                    | ❌ **PENDENTE**           | Depende de RF04                     |
| **RF08** | O sistema deve oferecer uma interface para visualizar o histórico de documentos por obra | ✅ **IMPLEMENTADO**       | Página `/dashboard/view-report`     |
| **RF09** | O sistema deve notificar o usuário quando houver atualizações em documentos              | ❌ **PENDENTE**           | Não implementado                    |
| **RF10** | O sistema deve permitir a exclusão de fotos enviadas pelo usuário                        | ❌ **PENDENTE**           | Não implementado                    |
| **RF11** | O sistema deve suportar múltiplos usuários com níveis de acesso                          | ❌ **PENDENTE**           | Não implementado                    |
| **RF12** | O sistema deve incluir uma funcionalidade de logout seguro                               | ✅ **IMPLEMENTADO**       | Firebase signOut                    |
| **RF13** | O sistema deve permitir que o usuário recupere sua senha por e-mail                      | ❌ **PENDENTE**           | Firebase Authentication suporta     |
| **RF14** | O sistema deve oferecer um painel de controle para gerentes monitorarem o progresso      | ⚠️ **PARCIAL**            | Dashboard básico implementado       |
| **RF15** | O sistema deve permitir importar dados para preenchimento automático de documentos       | ❌ **PENDENTE**           | Não implementado                    |
| **RF16** | O sistema deve permitir exportar dados das obras cadastradas                             | ❌ **PENDENTE**           | Não implementado                    |
| **RF17** | O sistema deve realizar backups automáticos periódicos dos dados                         | ❌ **PENDENTE**           | Firestore tem backup nativo         |
| **RF18** | O sistema deve oferecer um tutorial interativo para novos usuários                       | ❌ **PENDENTE**           | Não implementado                    |
| **RF19** | O sistema deve permitir a personalização de modelos de documentos por administrador      | ❌ **PENDENTE**           | Página `/admin/form-builder` existe |
| **RF20** | O sistema deve permitir o agendamento de tarefas associadas às obras                     | ❌ **PENDENTE**           | Não implementado                    |

**Progresso RF:** 5/20 completos (25%) | 3 parciais (15%) | 12 pendentes (60%)

---

## 🔧 Requisitos Não-Funcionais (RNF) - 30 Total

| ID        | Descrição                                                          | Status              | Observações                               |
| --------- | ------------------------------------------------------------------ | ------------------- | ----------------------------------------- |
| **RNF01** | O sistema deve carregar páginas em menos de 3 segundos             | ⚠️ **A VALIDAR**    | Next.js SSR otimizado                     |
| **RNF02** | O sistema deve ser compatível com Chrome e Firefox                 | ✅ **IMPLEMENTADO** | React/Next.js compatível                  |
| **RNF03** | O sistema deve suportar até 50 usuários simultâneos                | ⚠️ **A VALIDAR**    | Firebase suporta, precisa teste de carga  |
| **RNF04** | O sistema deve ter disponibilidade de 99,9% por mês                | ⚠️ **DEPENDENTE**   | Depende do Firebase/hosting               |
| **RNF05** | O sistema deve suportar resolução mínima de 1280x720px             | ✅ **IMPLEMENTADO** | Tailwind CSS responsivo                   |
| **RNF06** | O sistema deve processar uploads de até 10MB em <5s                | ⚠️ **A VALIDAR**    | Firebase Storage configurado              |
| **RNF07** | O sistema deve garantir criptografia AES-256 para dados sensíveis  | ❌ **PENDENTE**     | PostgreSQL não implementado ainda         |
| **RNF08** | O sistema deve realizar backups diários em servidor secundário     | ❌ **PENDENTE**     | PostgreSQL não implementado               |
| **RNF09** | O sistema deve suportar autenticação de dois fatores (2FA)         | ❌ **PENDENTE**     | Firebase Authentication suporta           |
| **RNF10** | O sistema deve ter interface responsiva para dispositivos móveis   | ✅ **IMPLEMENTADO** | Tailwind CSS + `use-mobile` hook          |
| **RNF11** | O sistema deve manter logs de ações do usuário por 90 dias         | ❌ **PENDENTE**     | Não implementado                          |
| **RNF12** | O sistema deve suportar até 1GB de armazenamento de fotos por obra | ⚠️ **DEPENDENTE**   | Firebase Storage (validar regras)         |
| **RNF13** | O sistema deve gerar PDFs em <10s para documentos até 50 páginas   | ❌ **PENDENTE**     | Geração de PDF não implementada           |
| **RNF14** | O sistema deve ser acessível conforme WCAG 2.1 (nível AA)          | ⚠️ **PARCIAL**      | Shadcn/UI tem acessibilidade básica       |
| **RNF15** | O sistema deve suportar atualizações automáticas sem interrupção   | ⚠️ **DEPENDENTE**   | Next.js suporta, precisa CI/CD            |
| **RNF16** | O sistema deve ter latência máxima de 200ms para chamadas de API   | ⚠️ **A VALIDAR**    | Firebase/Firestore otimizado              |
| **RNF17** | O sistema deve ser testado para 100 usuários simultâneos (pico)    | ❌ **PENDENTE**     | Teste de carga não realizado              |
| **RNF18** | O sistema deve suportar UTF-8 para entrada de texto                | ✅ **IMPLEMENTADO** | Next.js/React UTF-8 nativo                |
| **RNF19** | A interface não deve exceder 50MB de tamanho total                 | ⚠️ **A VALIDAR**    | Next.js otimiza bundle                    |
| **RNF20** | O sistema deve estar em conformidade com a LGPD                    | ⚠️ **PARCIAL**      | Firebase GDPR compliant, precisa política |
| **RNF21** | A autenticação deve usar Firebase Authentication                   | ✅ **IMPLEMENTADO** | Configurado e funcionando                 |
| **RNF22** | As fotos devem ser armazenadas no Firebase Storage                 | ⚠️ **PARCIAL**      | Upload implementado, storage a validar    |
| **RNF23** | Os relatórios devem ser gerados no formato PDF                     | ❌ **PENDENTE**     | Próxima fase (Julho 2025)                 |
| **RNF24** | Os relatórios devem estar disponíveis para download em PDF         | ❌ **PENDENTE**     | Depende de RNF23                          |
| **RNF25** | As notificações devem ser enviadas por e-mail                      | ❌ **PENDENTE**     | Não implementado                          |
| **RNF26** | A recuperação de senha deve utilizar Firebase Authentication       | ❌ **PENDENTE**     | Firebase suporta, precisa implementar UI  |
| **RNF27** | O formato de importação deve ser CSV com validação                 | ❌ **PENDENTE**     | Não implementado                          |
| **RNF28** | Os dados exportados devem estar no formato Excel (.xlsx)           | ❌ **PENDENTE**     | Não implementado                          |
| **RNF29** | Os backups devem ser realizados sobre o PostgreSQL                 | ❌ **PENDENTE**     | PostgreSQL não implementado               |
| **RNF30** | Integração de calendário com API externa (Google Calendar)         | ❌ **PENDENTE**     | Não implementado                          |

**Progresso RNF:** 5/30 completos (17%) | 14 parciais/dependentes (47%) | 11 pendentes (36%)

---

## 📊 Resumo Geral

### Status Atual do Projeto

- ✅ **Completo:** 10 requisitos (20%)
- ⚠️ **Parcial/A Validar:** 17 requisitos (34%)
- ❌ **Pendente:** 23 requisitos (46%)

### Prioridades por Cronograma

#### 🎯 **Até 31/07/2025 (Julho):**

1. **RF04** - Geração de PDFs ⚡ PRIORITÁRIO
2. **RNF23/RNF24** - PDFs em formato correto com download
3. **RF02** - Completar 17 formulários faltantes (mínimo 5 total)
4. **RNF13** - Performance de geração de PDF

#### 📅 **Até 15/09/2025 (Portfólio I):**

1. **RF06** - Edição de documentos preenchidos
2. **RF07** - Download de relatórios
3. **RF10** - Exclusão de fotos
4. **RF13** - Recuperação de senha
5. **RNF09** - 2FA (opcional)

#### 🏁 **Até 30/11/2025 (Portfólio II):**

1. **RF11** - Níveis de acesso de usuários
2. **RF09** - Sistema de notificações
3. **RF15/RF16** - Importação/Exportação de dados
4. **RF17** - Backups automáticos
5. **RF18** - Tutorial interativo
6. **RF19** - Personalização de modelos (admin)
7. **RF20** - Agendamento de tarefas
8. **RNF07-RNF08** - PostgreSQL + backups
9. **RNF11** - Sistema de logs
10. **RNF17** - Testes de carga
11. **RNF20** - Conformidade LGPD completa
12. **RNF25-RNF30** - Funcionalidades avançadas

---

## 📝 Notas Importantes

### ⚠️ Divergências Arquiteturais

O RFC especifica:

- **Backend:** Node.js + Express.js + PostgreSQL + Prisma ORM
- **Implementação Atual:** Firebase (Firestore) apenas

**Decisão Necessária:**

- Manter Firebase (mais simples para TCC) ✅ Recomendado
- Ou migrar para PostgreSQL conforme RFC ⚠️ Mais complexo

### 🎓 Recomendações para o TCC

1. **Manter Firebase** para MVP e Portfólio I
2. **Justificar tecnicamente** a escolha no documento
3. **Opcionalmente** adicionar PostgreSQL no Portfólio II
4. Focar em **completar os 20 formulários** (RF02 crítico)
5. **Priorizar geração de PDF** (deadline 31/07/2025)

---

## 🔗 Links Úteis

- [RFC Original](../README.markdown)
- [Blueprint do Projeto](./blueprint.md)
- [Configuração de Formulários](../src/config/forms.ts)
- [Firebase Console](https://console.firebase.google.com/)

---

**Última Atualização:** 22/11/2025  
**Próxima Revisão:** 15/12/2024 (após implementação de PDFs)
