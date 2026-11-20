import React, { createContext, useContext } from 'react';

const ElectricalIconScaleContext = createContext<number>(1);

export const ElectricalIconScaleProvider: React.FC<{
  scale: number;
  children: React.ReactNode;
}> = ({ scale, children }) => (
  <ElectricalIconScaleContext.Provider value={scale}>
    {children}
  </ElectricalIconScaleContext.Provider>
);

export function useElectricalIconScale(): number {
  return useContext(ElectricalIconScaleContext);
}
