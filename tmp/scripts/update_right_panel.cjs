const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../src/components/rightpanel/RightPanelChargersCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'Carregador DC-DC B2B1230 (30A)',
  '{b2b.name} ({b2b.chargingAmps}A)'
);

content = content.replace(
  "b2bCharger.isEngineRunning ? '🚗 ALTERNADOR ATIVO (30A)' : '🅿️ MOTOR DESLIGADO'",
  "b2bCharger.isEngineRunning ? `🚗 ALTERNADOR ATIVO (${b2b.chargingAmps}A)` : '🅿️ MOTOR DESLIGADO'"
);

content = content.replace(
  '`+${Math.round(b2bCharger.engineHoursPerDay * 30)} Ah/dia injetados`',
  '`+${Math.round(b2bCharger.engineHoursPerDay * b2b.chargingAmps)} Ah/dia injetados`'
);

content = content.replace(
  '`+${Math.round(b2bCharger.engineHoursPerDay * 390)} Wh/dia`',
  '`+${Math.round(b2bCharger.engineHoursPerDay * b2bWatts)} Wh/dia`'
);

content = content.replace(
  "b2bCharger.isEngineRunning ? '+30.0 A' : '0.0 A'",
  "b2bCharger.isEngineRunning ? `+${b2b.chargingAmps}.0 A` : '0.0 A'"
);

content = content.replace(
  "b2bCharger.isEngineRunning ? '+390 W' : '0 W'",
  "b2bCharger.isEngineRunning ? `+${b2bWatts} W` : '0 W'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('RightPanelChargersCard updated successfully');
