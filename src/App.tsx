import React from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { BarTooltip } from './components/BarTooltip';
import { Toast } from './components/Toast';
import { LoadsModal } from './components/modals/LoadsModal';
import { BatteryModal } from './components/modals/BatteryModal';
import { MpptModal } from './components/modals/MpptModal';
import { B2bModal } from './components/modals/B2bModal';
import { UsinaModal } from './components/modals/UsinaModal';
import { BomModal } from './components/modals/BomModal';

export const App: React.FC = () => {
  return (
    <>
      <CanvasViewport />
      <Header />
      <Sidebar />
      <RightPanel />
      <BarTooltip />
      <Toast />

      {/* Modais */}
      <LoadsModal />
      <BatteryModal />
      <MpptModal />
      <B2bModal />
      <UsinaModal />
      <BomModal />
    </>
  );
};

