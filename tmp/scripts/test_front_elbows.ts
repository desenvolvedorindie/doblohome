import * as THREE from 'three';

class QuarterArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    public centerX: number,
    public centerZ: number,
    public radius: number,
    public startAngle: number,
    public endAngle: number
  ) {
    super();
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const angle = this.startAngle + t * (this.endAngle - this.startAngle);
    return optionalTarget.set(
      this.centerX + this.radius * Math.cos(angle),
      0,
      this.centerZ + this.radius * Math.sin(angle)
    );
  }
}

const pipeOffsetX = 0.56;
const zFrontPipe = -0.56;
const bendR = 0.135;

// Left elbow:
// Connects (X = -pipeOffsetX, Z = zFrontPipe + bendR) to (X = -pipeOffsetX + bendR, Z = zFrontPipe)
const leftCurve = new QuarterArcCurve(
  -pipeOffsetX + bendR,
  zFrontPipe + bendR,
  bendR,
  Math.PI,
  (3 * Math.PI) / 2
);

const ptL0 = leftCurve.getPoint(0);
const ptL1 = leftCurve.getPoint(1);

console.log('Left Elbow Start (lateral pipe junction):', ptL0);
console.log('Left Elbow End   (front pipe junction):  ', ptL1);

// Right elbow:
// Connects (X = +pipeOffsetX - bendR, Z = zFrontPipe) to (X = +pipeOffsetX, Z = zFrontPipe + bendR)
const rightCurve = new QuarterArcCurve(
  pipeOffsetX - bendR,
  zFrontPipe + bendR,
  bendR,
  (3 * Math.PI) / 2,
  2 * Math.PI
);

const ptR0 = rightCurve.getPoint(0);
const ptR1 = rightCurve.getPoint(1);

console.log('Right Elbow Start (front pipe junction):  ', ptR0);
console.log('Right Elbow End   (lateral pipe junction):', ptR1);

const expectedL0 = new THREE.Vector3(-pipeOffsetX, 0, zFrontPipe + bendR);
const expectedL1 = new THREE.Vector3(-pipeOffsetX + bendR, 0, zFrontPipe);
const expectedR0 = new THREE.Vector3(pipeOffsetX - bendR, 0, zFrontPipe);
const expectedR1 = new THREE.Vector3(pipeOffsetX, 0, zFrontPipe + bendR);

const matchL0 = ptL0.distanceTo(expectedL0) < 0.0001;
const matchL1 = ptL1.distanceTo(expectedL1) < 0.0001;
const matchR0 = ptR0.distanceTo(expectedR0) < 0.0001;
const matchR1 = ptR1.distanceTo(expectedR1) < 0.0001;

console.log('Match L0:', matchL0 ? '✅' : '❌');
console.log('Match L1:', matchL1 ? '✅' : '❌');
console.log('Match R0:', matchR0 ? '✅' : '❌');
console.log('Match R1:', matchR1 ? '✅' : '❌');

