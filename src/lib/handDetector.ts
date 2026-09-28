export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'horizontal_edge' | 'vertical_edge' | 'none';

export interface GestureDetectionResult {
  gesture: GestureType;
  confidence: number;
  angleDeg: number;
  landmarks: Landmark[] | null;
  message: string;
}

/**
 * Calculates gesture from 21 MediaPipe hand landmarks.
 * Vertical edge = Stressed syllable (_)
 * Horizontal edge = Unstressed syllable (U)
 */
export function detectEdgeGesture(landmarks: Landmark[]): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'none',
      confidence: 0,
      angleDeg: 0,
      landmarks: null,
      message: 'Поместите ладонь перед камерой',
    };
  }

  // Landmark 0: Wrist
  // Landmark 9: Middle finger MCP
  // Landmark 12: Middle finger TIP
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const middleTip = landmarks[12];

  // Vector: Main longitudinal axis of the hand (Wrist to Middle Knuckle & Tip)
  const avgX = (middleTip.x + middleMcp.x) / 2;
  const avgY = (middleTip.y + middleMcp.y) / 2;
  const dx = avgX - wrist.x;
  // Invert y coordinate for standard Cartesian angle
  const dy = -(avgY - wrist.y);

  // Compute angle in degrees from 0 to 360
  let rad = Math.atan2(dy, dx);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;

  // Measure deviation from vertical axis (90° pointing up or 270° pointing down)
  const vertDiff = Math.min(Math.abs(deg - 90), Math.abs(deg - 270));
  // Measure deviation from horizontal axis (0° / 360° pointing right or 180° pointing left)
  const horizDiff = Math.min(Math.abs(deg - 0), Math.abs(deg - 180), Math.abs(deg - 360));

  let gesture: GestureType = 'none';
  let confidence = 0;
  let message = '';

  // Zero-dead-zone instant classification:
  // If angle is closer to vertical (or within +/- 48° of vertical axis) => vertical edge
  if (vertDiff <= 48 || vertDiff <= horizDiff) {
    gesture = 'vertical_edge';
    confidence = Math.max(0.85, 1 - vertDiff / 50);
    message = 'Вертикальное ребро: Ударный слог [ _ ]';
  } else {
    gesture = 'horizontal_edge';
    confidence = Math.max(0.85, 1 - horizDiff / 50);
    message = 'Горизонтальное ребро: Безударный слог [ U ]';
  }

  return {
    gesture,
    confidence: Number(confidence.toFixed(2)),
    angleDeg: Math.round(deg),
    landmarks,
    message,
  };
}

/**
 * Draws a futuristic, clean schematic model of the hand without showing the real video feed.
 * Highlights anatomical bones, joint telemetry, palm surface mesh, and rhythmic orientation axis.
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[] | null,
  gesture: GestureType,
  canvasWidth: number,
  canvasHeight: number,
  angleDeg: number = 0
) {
  // 1. Clear and render digital dark schematic background
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Subtle dark gradient background
  const bgGrad = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    50,
    canvasWidth / 2,
    canvasHeight / 2,
    canvasWidth * 0.7
  );
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle digital grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Optical alignment guides (corner reticles)
  const cornerSize = 16;
  const margin = 16;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1.5;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(canvasWidth - margin - cornerSize, margin);
  ctx.lineTo(canvasWidth - margin, margin);
  ctx.lineTo(canvasWidth - margin, margin + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(margin, canvasHeight - margin - cornerSize);
  ctx.lineTo(margin, canvasHeight - margin);
  ctx.lineTo(margin + cornerSize, canvasHeight - margin);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(canvasWidth - margin - cornerSize, canvasHeight - margin);
  ctx.lineTo(canvasWidth - margin, canvasHeight - margin);
  ctx.lineTo(canvasWidth - margin, canvasHeight - margin - cornerSize);
  ctx.stroke();

  // Center optical crosshair
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.stroke();

  // 2. If NO hand landmarks detected: draw a stylish dashed holographic hand silhouette guide
  if (!landmarks || landmarks.length < 21) {
    drawHologramHandGuide(ctx, cx, cy);
    return;
  }

  // 3. Hand landmark transformation (Flip X for natural mirror interaction)
  const pts = landmarks.map(lm => ({
    x: (1 - lm.x) * canvasWidth,
    y: lm.y * canvasHeight,
    z: lm.z,
  }));

  // Hand anatomical segments
  const fingers = [
    [0, 1, 2, 3, 4], // Thumb
    [0, 5, 6, 7, 8], // Index
    [0, 9, 10, 11, 12], // Middle
    [0, 13, 14, 15, 16], // Ring
    [0, 17, 18, 19, 20], // Pinky
  ];

  // Palm boundary polygon
  const palmIndices = [0, 1, 2, 5, 9, 13, 17];

  // Theme palettes based on gesture
  let primaryGlow = '#a855f7'; // Purple default
  let strokeColor = 'rgba(192, 132, 252, 0.9)';
  let meshFill = 'rgba(168, 85, 247, 0.08)';
  let accentTag = 'КАЛИБРОВКА ЖЕСТА';

  if (gesture === 'vertical_edge') {
    primaryGlow = '#f59e0b'; // Amber / Gold for Stressed
    strokeColor = 'rgba(251, 191, 36, 0.95)';
    meshFill = 'rgba(245, 158, 11, 0.15)';
    accentTag = 'УДАРНЫЙ СЛОГ [ _ ]';
  } else if (gesture === 'horizontal_edge') {
    primaryGlow = '#38bdf8'; // Cyan / Electric Blue for Unstressed
    strokeColor = 'rgba(56, 189, 248, 0.95)';
    meshFill = 'rgba(56, 189, 248, 0.15)';
    accentTag = 'БЕЗУДАРНЫЙ СЛОГ [ U ]';
  }

  // A. Draw Palm Holographic Surface Mesh
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[palmIndices[0]].x, pts[palmIndices[0]].y);
  for (let i = 1; i < palmIndices.length; i++) {
    const idx = palmIndices[i];
    ctx.lineTo(pts[idx].x, pts[idx].y);
  }
  ctx.closePath();
  ctx.fillStyle = meshFill;
  ctx.fill();
  ctx.strokeStyle = gesture !== 'none' ? primaryGlow : 'rgba(168, 85, 247, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Internal palm triangulation lines (gives authentic 3D wireframe schematic look)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[9].x, pts[9].y);
  ctx.moveTo(pts[5].x, pts[5].y);
  ctx.lineTo(pts[17].x, pts[17].y);
  ctx.stroke();
  ctx.restore();

  // B. Draw Bones (Multi-layered luminous neon strokes)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Soft outer bloom
  ctx.strokeStyle = primaryGlow;
  ctx.shadowColor = primaryGlow;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 6;
  for (const finger of fingers) {
    ctx.beginPath();
    ctx.moveTo(pts[finger[0]].x, pts[finger[0]].y);
    for (let i = 1; i < finger.length; i++) {
      ctx.lineTo(pts[finger[i]].x, pts[finger[i]].y);
    }
    ctx.stroke();
  }

  // 2. Crisp inner laser bone
  ctx.shadowBlur = 0;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3.5;
  for (const finger of fingers) {
    ctx.beginPath();
    ctx.moveTo(pts[finger[0]].x, pts[finger[0]].y);
    for (let i = 1; i < finger.length; i++) {
      ctx.lineTo(pts[finger[i]].x, pts[finger[i]].y);
    }
    ctx.stroke();
  }

  // 3. High-intensity center core
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  for (const finger of fingers) {
    ctx.beginPath();
    ctx.moveTo(pts[finger[0]].x, pts[finger[0]].y);
    for (let i = 1; i < finger.length; i++) {
      ctx.lineTo(pts[finger[i]].x, pts[finger[i]].y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // C. Draw Joints & Sensors (Nodes)
  pts.forEach((p, idx) => {
    const isWrist = idx === 0;
    const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
    const radius = isWrist ? 7 : isTip ? 5 : 3.5;

    ctx.save();
    // Outer halo
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = primaryGlow;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center node
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? '#ffffff' : primaryGlow;
    ctx.fill();

    // Concentric ring on wrist
    if (isWrist) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  });

  // D. Draw Rhythmic Orientation Axis & Blade Line
  const wristPt = pts[0];
  const midTipPt = pts[12];
  const midMcpPt = pts[9];

  // Extension laser line along hand blade axis
  const vdx = midTipPt.x - wristPt.x;
  const vdy = midTipPt.y - wristPt.y;
  const len = Math.hypot(vdx, vdy);

  if (len > 10) {
    const normX = vdx / len;
    const normY = vdy / len;

    // Laser axis line extending from wrist through middle finger
    ctx.save();
    ctx.strokeStyle = gesture !== 'none' ? primaryGlow : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = gesture !== 'none' ? 2 : 1;
    if (gesture !== 'none') {
      ctx.shadowColor = primaryGlow;
      ctx.shadowBlur = 10;
    } else {
      ctx.setLineDash([4, 4]);
    }

    ctx.beginPath();
    ctx.moveTo(wristPt.x - normX * 25, wristPt.y - normY * 25);
    ctx.lineTo(midTipPt.x + normX * 45, midTipPt.y + normY * 45);
    ctx.stroke();
    ctx.restore();
  }

  // E. Digital Telemetry HUD Overlay
  ctx.save();
  // Callout box near hand
  const tagX = Math.min(Math.max(wristPt.x - 70, 20), canvasWidth - 160);
  const tagY = Math.min(Math.max(wristPt.y + 24, 40), canvasHeight - 35);

  ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
  ctx.strokeStyle = primaryGlow;
  ctx.lineWidth = 1;
  ctx.roundRect(tagX, tagY, 140, 24, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Plus Jakarta Sans", monospace';
  ctx.fillText(`${accentTag} • ${angleDeg}°`, tagX + 8, tagY + 16);
  ctx.restore();
}

/**
 * Animated schematic hand guide when camera is waiting for hand entry
 */
function drawHologramHandGuide(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);

  // Schematic palm & fingers outline
  ctx.beginPath();
  // Wrist
  ctx.moveTo(cx - 30, cy + 60);
  ctx.lineTo(cx + 30, cy + 60);
  // Pinky
  ctx.lineTo(cx + 42, cy - 10);
  ctx.lineTo(cx + 36, cy - 55);
  ctx.lineTo(cx + 25, cy - 55);
  ctx.lineTo(cx + 25, cy - 15);
  // Ring
  ctx.lineTo(cx + 16, cy - 75);
  ctx.lineTo(cx + 5, cy - 75);
  ctx.lineTo(cx + 5, cy - 20);
  // Middle
  ctx.lineTo(cx - 5, cy - 85);
  ctx.lineTo(cx - 16, cy - 85);
  ctx.lineTo(cx - 16, cy - 20);
  // Index
  ctx.lineTo(cx - 26, cy - 70);
  ctx.lineTo(cx - 37, cy - 70);
  ctx.lineTo(cx - 37, cy + 10);
  // Thumb
  ctx.lineTo(cx - 55, cy - 5);
  ctx.lineTo(cx - 62, cy + 15);
  ctx.lineTo(cx - 40, cy + 35);
  ctx.lineTo(cx - 30, cy + 60);
  ctx.stroke();

  // Instructional label in center
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
  ctx.font = '12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Схематический режим распознавания руки', cx, cy + 95);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '10px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Поместите ладонь перед камерой ребром к объективу', cx, cy + 112);

  ctx.restore();
}
