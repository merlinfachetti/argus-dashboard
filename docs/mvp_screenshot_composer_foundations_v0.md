# 🧠 MVP Foundations — Screenshot Composer (Working Title)

---

## 📌 1. Visão do Produto

Uma aplicação desktop focada em **captura de tela em fluxo contínuo**, permitindo ao usuário **compor múltiplos screenshots em tempo real dentro de um único canvas**, sem necessidade de alternar entre ferramentas.

---

## 🚀 2. Problema

Ferramentas atuais seguem um fluxo fragmentado:

capturar → salvar → abrir editor → montar

Isso gera:
- Fricção
- Perda de tempo
- Quebra de contexto

---

## 💡 3. Solução Proposta

Novo paradigma:

capturar → capturar → capturar → organizar → exportar

### ✨ Diferencial
- Composição em tempo real
- Fluxo contínuo
- Canvas ativo durante todo o processo

---

## 🎯 4. Proposta de Valor

"Transformar screenshots em uma ferramenta de pensamento visual rápido"

---

## 👥 5. Público-Alvo

### 🧑‍💻 Desenvolvedores / QA
- Documentar bugs
- Mostrar fluxos

### 🧑‍🏫 Educadores / Criadores
- Explicações visuais rápidas

### 🧑‍💼 Suporte / Onboarding
- Guias passo a passo

---

## 🧱 6. Escopo do MVP (V1)

### ✅ Funcionalidades

- Captura de área da tela
- Cada captura vira um bloco
- Canvas vertical automático
- Drag & drop de elementos
- Redimensionamento básico
- Exportação final como imagem (PNG)

---

### ❌ Fora do MVP

- IA
- Cloud / Sync
- Colaboração
- Edição avançada
- Persistência

---

## 🔄 7. Fluxo do Usuário

[HOTKEY]
↓
Seleciona área
↓
Imagem capturada
↓
Adicionada ao canvas
↓
Overlay permanece ativo
↓
Nova captura
↓
Usuário organiza
↓
FINALIZAR → exporta

---

## 🧩 8. Arquitetura Técnica

### Stack

- Tauri
- React + Vite
- Zustand
- Konva.js

---

## 📁 9. Estrutura do Projeto

screen-composer/
├── src/
│   ├── app/
│   ├── features/
│   │   ├── capture/
│   │   ├── canvas/
│   │   └── export/
│   ├── shared/
│   └── main.tsx
├── src-tauri/

---

## 🧠 10. Modelo de Dados

type CanvasItem = {
  id: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
};

---

## 🗃️ 11. Estado Global

type CanvasState = {
  items: CanvasItem[];
  addItem: (item: CanvasItem) => void;
  updateItem: (id: string, updates: Partial<CanvasItem>) => void;
  removeItem: (id: string) => void;
};

---

## 🖥️ 12. Canvas

- Baseado em Konva.js
- Renderização dinâmica
- Elementos arrastáveis

---

## 📸 13. Captura

- Integração via Tauri
- Retorno em base64
- Inserção automática no canvas

---

## 🧪 14. Critérios de Validação

### 🎯 Sucesso do MVP

- Criar composição em < 30 segundos
- Redução de fricção vs print tradicional
- Usuário reutilizaria

---

## 📊 15. Backlog MVP

### Fase 1 — Setup
- Criar projeto
- Configurar estado

### Fase 2 — Canvas
- Renderização
- Drag & drop

### Fase 3 — Captura
- Integração com sistema

### Fase 4 — Layout
- Empilhamento automático

### Fase 5 — Export
- Gerar PNG

---

## ⏱️ 16. Estimativa

- Total: ~27h (~3 dias focados)

---

## ⚠️ 17. Decisões Críticas

- Layout vertical obrigatório (início)
- Sem edição complexa
- Sem persistência

---

## 🧠 18. Insight Estratégico

> Não é uma ferramenta de screenshot.
>
> É uma ferramenta de construção visual.

---

## 🔥 19. Posicionamento

"A forma mais rápida de transformar ideias visuais em imagens compartilháveis"

---

## 🧭 20. Próximos Passos

1. Setup do projeto
2. Canvas funcional
3. Primeira captura integrada
4. Teste real de uso

---

## 🏷️ 21. Naming (Exploração)

- SnapStack
- LayerShot
- ScrollSnap
- ComposeShot
- StackCapture

---

## 🧱 22. Princípios do Produto

- Simplicidade > Features
- Velocidade > Perfeição
- Fluxo contínuo > etapas fragmentadas
- UX invisível > complexidade

---

## 🧨 23. Regra de Ouro

> Se ficar complexo, está errado.

---

## 📌 Status Atual

🟡 Em definição
🔜 Próximo: Setup inicial

---

## 🧠 Nota Final

Este documento representa a fundação do produto.

Ele deve evoluir conforme validação real com usuários.
