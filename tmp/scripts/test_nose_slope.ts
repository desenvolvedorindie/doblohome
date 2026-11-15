import * as THREE from 'three';

// If a box is centered at (0, 0, -1):
// Top face is at Y = +h/2.
// Front face (towards -Z) has vertices at Z = -1 - d/2.
// Rear face (towards +Z) has vertices at Z = -1 + d/2.
// If we rotate around X by angle theta:
// y' = y * cos(theta) - z * sin(theta)
// z' = y * sin(theta) + z * cos(theta)

// We want the front of the nose (more negative Z) to slope DOWNWARD (lower Y).
// Let's test for theta > 0 vs theta < 0:
const h = 0.2;
const d = 0.2;
const yTop = h / 2; // +0.10
const zFront = -d / 2; // -0.10 (local)

for (const angle of [-0.22, 0.22]) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const yRotFront = yTop * cosA - zFront * sinA;
  const yRotRear  = yTop * cosA - (+d/2) * sinA;
  console.log(`Angle: ${angle} -> yFront (at -Z): ${yRotFront.toFixed(4)}, yRear (at +Z): ${yRotRear.toFixed(4)}`);
}

