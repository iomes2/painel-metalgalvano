# Mapeamento Completo das Operações Firebase no Frontend

**Data:** 23/11/2025  
**Objetivo:** Documentar todas as operações do Firestore para migração segura para o backend

---

## 📊 RESUMO EXECUTIVO

### Arquivos com Operações Firestore:

1. **`src/app/dashboard/search/page.tsx`** (570 linhas) - Busca de relatórios
2. **`src/app/dashboard/view-report/[osId]/[reportId]/page.tsx`** (328 linhas) - Visualização de relatório
3. **`src/components/forms/DynamicFormRenderer.tsx`** (566 linhas) - Submissão de formulários

---

## 🔍 OPERAÇÕES POR ARQUIVO

### 1. **BUSCA DE RELATÓRIOS** (`search/page.tsx`)

#### 1.1 Buscar Gerentes (Load inicial)

```typescript
// Linha ~66-78
const gerentesCollectionRef = collection(db, "gerentes_cadastrados");
const q = query(gerentesCollectionRef, orderBy("nome", "asc"));
const querySnapshot = await getDocs(q);
```

**Lógica:**

- Busca todos os gerentes cadastrados ordenados por nome
- Popula dropdown de seleção
- **Migrar para:** `GET /api/gerentes`

---

#### 1.2 Buscar Relatórios por OS

```typescript
// Linha ~142-164
const reportsSubCollectionRef = collection(
  db,
  "ordens_servico",
  trimmedOsToSearch,
  "relatorios"
);
const q = query(reportsSubCollectionRef, orderBy("submittedAt", "desc"));
const querySnapshot = await getDocs(q);
```

**Lógica:**

- Busca todos os relatórios de uma OS específica
- Subcoleção aninhada: `ordens_servico/{osId}/relatorios`
- Ordenação por data de submissão (mais recente primeiro)
- Extrai fotos de cada relatório (função `extractPhotos`)
- **Migrar para:** `GET /api/relatorios?os={osNumber}`

**Resposta esperada:**

```typescript
{
  id: string;
  formName: string;
  formType: string;
  submittedAt: Timestamp;
  formData: Record<string, any>;
  photoUrls?: ReportPhoto[];
}[]
```

---

#### 1.3 Buscar OSs por Gerente

```typescript
// Linha ~217-235
const osCollectionRef = collection(db, "ordens_servico");
const q = query(
  osCollectionRef,
  where("updatedByGerenteId", "==", gerenteIdToSearch),
  orderBy("lastReportAt", "desc")
);
const querySnapshot = await getDocs(q);
```

**Lógica:**

- Busca todas as OSs atualizadas por um gerente específico
- Ordenação por última atualização
- Retorna apenas: id, os, lastReportAt
- **Migrar para:** `GET /api/ordens-servico?gerenteId={id}`

**Resposta esperada:**

```typescript
{
  id: string;
  os: string;
  lastReportAt: Timestamp;
}
[];
```

---

### 2. **VISUALIZAÇÃO DE RELATÓRIO** (`view-report/[osId]/[reportId]/page.tsx`)

#### 2.1 Buscar Relatório Individual

```typescript
// Linha ~93-103
const reportDocRef = doc(db, "ordens_servico", osId, "relatorios", reportId);
const docSnap = await getDoc(reportDocRef);
```

**Lógica:**

- Busca um relatório específico por OS + ReportID
- Caminho: `ordens_servico/{osId}/relatorios/{reportId}`
- **Migrar para:** `GET /api/relatorios/{reportId}?os={osId}`

**Resposta esperada:**

```typescript
{
  id: string;
  formName: string;
  formType: string;
  formData: Record<string, any>;
  submittedAt: Timestamp;
  submittedBy: string;
  gerenteId?: string;
  originatingFormId?: string;
}
```

---

### 3. **SUBMISSÃO DE FORMULÁRIOS** (`DynamicFormRenderer.tsx`)

#### 3.1 Upload de Arquivos (Firebase Storage)

```typescript
// Linha ~222-238
const filePath = `reports/${currentUser.uid}/${formDefinition.id}/${
  osValue || "general"
}/${submissionTimestamp}/${file.name}`;
const fileStorageRef = storageRef(storage, filePath);
const uploadTask = uploadBytesResumable(fileStorageRef, file);
// ... await upload completion
const url = await getDownloadURL(fileRef);
```

**Lógica:**

- Upload de múltiplos arquivos para Firebase Storage
- Estrutura: `reports/{userId}/{formType}/{os}/{timestamp}/{filename}`
- Retorna URLs públicas de download
- **Migrar para:** `POST /api/upload` (multipart/form-data)

**Resposta esperada:**

```typescript
{
  name: string;
  url: string;
  type: string;
  size: number;
}
[];
```

---

#### 3.2 Salvar Relatório

```typescript
// Linha ~282-297
// 1. Atualizar documento da OS
const osDocRef = doc(db, "ordens_servico", osValue.trim());
await setDoc(
  osDocRef,
  {
    lastReportAt: Timestamp.fromMillis(submissionTimestamp),
    os: osValue.trim(),
    updatedBy: currentUser.uid,
    updatedByGerenteId: reportPayload.gerenteId,
  },
  { merge: true }
);

// 2. Adicionar relatório na subcoleção
const reportsSubCollectionRef = collection(
  db,
  "ordens_servico",
  osValue.trim(),
  "relatorios"
);
savedDocRef = await addDoc(reportsSubCollectionRef, reportPayload);
```

**Lógica:**

- **Operação 1:** Atualiza/cria documento da OS (merge: true)
- **Operação 2:** Adiciona novo relatório na subcoleção
- Conversão de campos Date para Timestamp
- Extração de gerenteId do email do usuário
- **Migrar para:** `POST /api/relatorios`

**Payload esperado:**

```typescript
{
  formType: string;
  formName: string;
  formData: Record<string, any>; // com Timestamps
  submittedBy: string; // userId
  submittedAt: Timestamp;
  gerenteId: string;
  originatingFormId?: string;
  os: string; // se disponível
}
```

---

## 🎯 ESTRUTURA DO FIRESTORE (ATUAL)

```
firestore/
├── gerentes_cadastrados/
│   └── {gerenteId}
│       └── nome: string
│
└── ordens_servico/
    └── {osNumber}/
        ├── os: string
        ├── lastReportAt: Timestamp
        ├── updatedBy: string (userId)
        ├── updatedByGerenteId: string
        └── relatorios/ (subcoleção)
            └── {reportId}
                ├── formType: string
                ├── formName: string
                ├── formData: object
                ├── submittedBy: string
                ├── submittedAt: Timestamp
                ├── gerenteId: string
                └── originatingFormId?: string
```

---

## 🔐 AUTENTICAÇÃO

**Atual:** Firebase Auth (`auth.currentUser`)

- Todos os endpoints precisam do `userId` e `gerenteId`
- Token JWT do Firebase deve ser enviado no header `Authorization: Bearer {token}`

---

## 📦 ENDPOINTS NECESSÁRIOS NO BACKEND

### GET `/api/gerentes`

- Retorna lista de gerentes ordenada por nome
- Sem parâmetros

### GET `/api/relatorios`

- Query params: `?os={osNumber}` OU `?gerenteId={id}`
- Retorna lista de relatórios com fotos extraídas

### GET `/api/relatorios/{reportId}`

- Query params: `?os={osNumber}`
- Retorna relatório individual completo

### POST `/api/relatorios`

- Body: reportPayload + os (se disponível)
- Cria/atualiza OS e adiciona relatório
- Retorna: `{ reportId, osId }`

### POST `/api/upload`

- Multipart form-data com múltiplos arquivos
- Retorna array de objetos com URLs
- Usa Firebase Storage ou AWS S3

### GET `/api/relatorios/{reportId}/pdf`

- Query params: `?os={osNumber}`
- Gera PDF do relatório com dados preenchidos
- Retorna: arquivo PDF (Content-Type: application/pdf)
- Headers: `Content-Disposition: attachment; filename="relatorio-{formType}-{os}-{reportId}.pdf"`

**Funcionalidades do PDF:**
- Cabeçalho com logo Metalgalvano + dados da OS
- Todos os campos do formulário com labels e valores
- Imagens embutidas ou links para download
- Rodapé com: usuário, data de submissão, gerente responsável
- Formatação condicional baseada no tipo de formulário

**Backend já tem:**
- ✅ `pdfmake` instalado (linha 39 do package.json)
- ✅ `puppeteer` instalado (linha 40 do package.json)

**Implementação recomendada:**
- Usar **pdfmake** para formulários simples (mais leve)
- Usar **puppeteer** para formulários complexos com muitas imagens (renderiza HTML)
- Criar templates específicos por `formType` se necessário

---

## ⚠️ PONTOS CRÍTICOS DE ATENÇÃO

### 1. **Conversão de Timestamps**

- Firestore usa `Timestamp` do Firebase
- Backend (PostgreSQL) usa ISO 8601 strings ou Date objects
- **Solução:** Converter `Timestamp.toDate()` → `Date.toISOString()` no frontend

### 2. **Subcoleções Aninhadas**

- Firestore: `ordens_servico/{os}/relatorios/{id}`
- PostgreSQL: Tabela `reports` com FK `ordem_servico_id`
- **Solução:** Backend precisa manter relacionamento correto

### 3. **Extração de Fotos**

- Função `extractPhotos()` vasculha `formData` procurando arrays de objetos com `url`
- **Solução:** Backend deve retornar fotos já extraídas OU frontend mantém lógica

### 4. **Merge de Documentos**

- Firestore `setDoc(..., { merge: true })` atualiza apenas campos enviados
- PostgreSQL: `UPSERT` ou `UPDATE ... WHERE`
- **Solução:** Backend implementa lógica de merge/upsert

### 5. **Upload Paralelo de Arquivos**

- Frontend usa `Promise.all()` para uploads simultâneos
- **Solução:** Backend deve aceitar múltiplos arquivos em uma requisição

### 6. **Ordenação e Filtros**

- Firestore: `orderBy()`, `where()`, `query()`
- PostgreSQL: `ORDER BY`, `WHERE`, queries SQL
- **Solução:** Backend implementa mesmos filtros

### 7. **Geração de PDF**

- **Não está implementado no frontend atual** (funcionalidade futura)
- Backend precisa gerar PDF a partir dos dados do relatório
- Incluir imagens do Firebase Storage ou URLs públicas
- **Desafio:** Fotos podem ser grandes → comprimir ou usar thumbnails
- **Desafio:** Campos dinâmicos por formType → template flexível necessário
- **Solução:** Criar serviço `pdfService.ts` que recebe `formDefinition` + `reportData`

---

## 🧪 ESTRATÉGIA DE MIGRAÇÃO RECOMENDADA

### Fase 1: CRIAR ENDPOINTS SEM ALTERAR FRONTEND ✅

1. Implementar todos os endpoints listados acima
2. Testar com Postman/Insomnia
3. Garantir paridade de resposta com Firestore

### Fase 2: CRIAR CAMADA DE ABSTRAÇÃO

1. Criar `src/lib/api-client.ts` no frontend
2. Funções que abstraem Firebase OU Backend
3. Toggle via variável de ambiente

### Fase 3: MIGRAÇÃO GRADUAL

1. Começar com endpoint menos crítico (ex: GET gerentes)
2. A/B testing com flag de feature
3. Monitorar erros e performance

### Fase 4: LIMPEZA

1. Remover dependências do Firestore
2. Deletar código morto
3. Atualizar documentação

---

## 📝 CHECKLIST DE VALIDAÇÃO

Antes de migrar, o backend DEVE:

- [ ] Autenticar via Firebase JWT
- [ ] Retornar mesma estrutura de dados
- [ ] Suportar ordenação e filtros
- [ ] Implementar upload de arquivos
- [ ] Fazer UPSERT de OS corretamente
- [ ] Manter relacionamento OS ↔ Relatórios
- [ ] Retornar Timestamps em formato compatível
- [ ] Ter mesmos tratamentos de erro
- [ ] Implementar geração de PDF com pdfmake ou puppeteer
- [ ] Suportar imagens no PDF (embeded ou links)
- [ ] Criar templates de PDF por tipo de formulário

---

## 🚀 PRÓXIMOS PASSOS

**Opção A - Conservadora:**

1. Você revisa este documento
2. Aponto ajustes necessários no backend atual
3. Criamos camada de abstração no frontend
4. Migramos endpoint por endpoint

**Opção B - Ágil:**

1. Implemento todos os endpoints de uma vez
2. Crio camada de abstração com feature flag
3. Você testa e valida
4. Switch completo após validação

---

**Qual opção você prefere?** Ou quer que eu comece criando a camada de abstração primeiro?
