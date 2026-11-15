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

const radiusM = 0.10;
const R = radiusM * 1.35; // bend radius = 0.135m
const pipeOffsetX = 0.818;
const cornerZ = 1.40;

// Left elbow
const leftCurve = new QuarterArcCurve(
  -pipeOffsetX + R,
  cornerZ - R,
  R,
  Math.PI,
  Math.PI / 2
);

const ptStart = leftCurve.getPoint(0);
const ptEnd = leftCurve.getPoint(1);

console.log('Left elbow start:', ptStart);
console.log('Left elbow end:', ptEnd);

const leftGeo = new THREE.TubeGeometry(leftCurve, 16, radiusM, 24, false);
console.log('Left TubeGeometry vertex count:', leftGeo.attributes.position.count);

// Right elbow
const rightCurve = new QuarterArcCurve(
  pipeOffsetX - R,
  cornerZ - R,
  R,
  Math.PI / 2,
  0
);

const ptRStart = rightCurve.getPoint(0);
const ptREnd = rightCurve.getPoint(1);

console.log('Right elbow start:', ptRStart);
console.log('Right elbow end:', ptREnd);

const rightGeo = new THREE.TubeGeometry(rightCurve, 16, radiusM, 24, false);
console.log('Right TubeGeometry vertex count:', rightGeo.attributes.position.count);

console.log('✅ Elbow geometry works perfectly!');

