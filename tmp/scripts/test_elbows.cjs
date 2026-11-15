class QuarterArcCurve {
  constructor(centerX, centerZ, radius, startAngle, endAngle) {
    this.centerX = centerX;
    this.centerZ = centerZ;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }
  getPoint(t) {
    const angle = this.startAngle + (this.endAngle - this.startAngle) * t;
    return {
      x: this.centerX + Math.cos(angle) * this.radius,
      z: this.centerZ + Math.sin(angle) * this.radius
    };
  }
}

const pipeOffsetX = 0.5;
const bendR = 0.1;
const zFrontPipe = 0.4;

// Left elbow (negative X):
// Starts at x = -pipeOffsetX + bendR, z = zFrontPipe
// Ends at x = -pipeOffsetX, z = zFrontPipe - bendR
// Angle: at t=0, x = -0.5 + 0.1 + cos(a)*0.1 = -0.4 -> cos(a) = 0 -> a = PI/2 (sin(a) = 1 -> z = centerZ + 0.1 = zFrontPipe -> centerZ = zFrontPipe - bendR)
// at t=1, x = -0.5 -> cos(a) = -1 -> a = PI (sin(a) = 0 -> z = centerZ = zFrontPipe - bendR)
const leftElbow = new QuarterArcCurve(
  -pipeOffsetX + bendR,
  zFrontPipe - bendR,
  bendR,
  Math.PI / 2,
  Math.PI
);

console.log('Left Elbow t=0 (connects to front pipe):', leftElbow.getPoint(0));
console.log('Left Elbow t=1 (connects to lateral pipe):', leftElbow.getPoint(1));

// Right elbow (positive X):
// Starts at x = pipeOffsetX - bendR, z = zFrontPipe
// Ends at x = pipeOffsetX, z = zFrontPipe - bendR
// at t=0, a = PI/2 (x = 0.4, z = 0.4)
// at t=1, a = 0 (x = 0.5, z = 0.3)
const rightElbow = new QuarterArcCurve(
  pipeOffsetX - bendR,
  zFrontPipe - bendR,
  bendR,
  Math.PI / 2,
  0
);

console.log('Right Elbow t=0 (connects to front pipe):', rightElbow.getPoint(0));
console.log('Right Elbow t=1 (connects to lateral pipe):', rightElbow.getPoint(1));

