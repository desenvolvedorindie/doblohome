# ☀️ Visualizador 3D de Painéis Solares Retráteis para Fiat Doblò (React + TypeScript + Three.js)

Sistema moderno desenvolvido em **React**, **TypeScript**, **Vite** e **Three.js** para visualização, simulação e dimensionamento da estrutura de painéis solares retráteis sobre o teto de uma **Fiat Doblò**, reproduzindo com precisão milimétrica os projetos técnicos com perfis de alumínio T-Slot 40x40 e oferecendo modos de **maximização extrema de potência fotovoltaica**, gerenciamento de cargas elétricas, dimensionamento de bateria LiFePO4 Kingbo 560Ah e controlador MPPT Kingbo 60A.

---

## 🚀 Como Executar

### Opção 1: Via Terminal
Na pasta do projeto, execute:
```bash
npm run dev
```
O servidor de desenvolvimento do Vite iniciará em `http://localhost:5173` com suporte total a **Hot Module Replacement (HMR)**!

### Opção 2: Com 1 Clique (Windows)
Basta dar dois cliques no arquivo:
```
iniciar.bat
```

### Opção 3: Build de Produção
Para compilar e validar o TypeScript e empacotar para produção:
```bash
npm run build
```

---

## 🏗️ Arquitetura Moderna (Migração Concluída)

- **Frontend**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite com `@vitejs/plugin-react`
- **Renderização 3D**: Three.js oficial via npm (`three` + `@types/three`)
- **Organização Modular**:
  - `src/types/`: Tipagens TypeScript completas para configurações, simulação solar e medições.
  - `src/three/`: Modelos e subsistemas 3D (SceneManager, SolarSystem, DobloModel, AluminumExtrusion, SolarSimulation, Materials, Textures, Audio).
  - `src/context/`: `SolarContext` para estado compartilhado reativo e persistência no LocalStorage.
  - `src/components/`: Componentes React decompostos (Header, Sidebar, RightPanel, CanvasViewport, BarTooltip, Toast e Modais).
  - `src/components/modals/`: LoadsModal (Editor de Cargas & Balanço), BatteryModal (Kingbo 560Ah), MpptModal (MPPT 60A) e BomModal (Lista de Materiais e Cortes).
