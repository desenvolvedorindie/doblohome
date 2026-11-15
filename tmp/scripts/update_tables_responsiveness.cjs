const fs = require('fs');

function updateDinette() {
  const file = 'src/components/planner/PlannerDinetteTableSection.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '10px' : '0' }}>`,
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: (selectedBox.hasCentralTable || selectedBox.centralTable?.enabled) ? '10px' : '0', flexWrap: 'wrap' }}>`
  );
  content = content.replace(
    `<div style={{ flex: 1 }}>\r\n                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>`,
    `<div style={{ flex: 1, minWidth: '220px' }}>\r\n                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>`
  );
  content = content.replace(
    `style={{\r\n                    fontSize: '11px',\r\n                    fontWeight: 700,\r\n                    padding: '6px 12px',\r\n                    whiteSpace: 'nowrap',`,
    `style={{\r\n                    fontSize: '11px',\r\n                    fontWeight: 700,\r\n                    padding: '6px 12px',\r\n                    whiteSpace: 'nowrap',\r\n                    flexShrink: 0,`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Dinette updated');
}

function updateRear() {
  const file = 'src/components/planner/PlannerRearTableSection.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.rearFoldShelf ? '10px' : '0' }}>`,
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: selectedBox.rearFoldShelf ? '10px' : '0', flexWrap: 'wrap' }}>`
  );
  content = content.replace(
    `<div style={{ flex: 1 }}>\r\n                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>`,
    `<div style={{ flex: 1, minWidth: '220px' }}>\r\n                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>`
  );
  content = content.replace(
    `style={{\r\n                  fontSize: '11px',\r\n                  fontWeight: 700,\r\n                  padding: '6px 12px',\r\n                  whiteSpace: 'nowrap',`,
    `style={{\r\n                  fontSize: '11px',\r\n                  fontWeight: 700,\r\n                  padding: '6px 12px',\r\n                  whiteSpace: 'nowrap',\r\n                  flexShrink: 0,`
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log('Rear updated');
}

updateDinette();
updateRear();
