import { useEffect, useRef } from 'react';
import './SlicedWaves.css';

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uColumns;
uniform float uRows;
uniform float uThickness;
uniform float uSpeed;
uniform float uTravel;
uniform float uWaveSpread;
uniform float uRowOffset;
uniform float uSoftness;
uniform float uGlow;
uniform float uBrightness;
uniform float uContrast;
uniform float uOpacity;
uniform float uVertical;
uniform float uAlternate;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uEnableMouse;
uniform float uMouseActive;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 grid = vec2(max(uColumns, 1.0), max(uRows, 1.0));
  vec2 p = uv * grid;
  vec2 gv = fract(p) - 0.5;
  vec2 id = floor(p);

  float barCoord, waveId, offId, along;
  if (uVertical > 0.5) {
    barCoord = gv.x; waveId = id.y; offId = id.x; along = uv.y;
  } else {
    barCoord = gv.y; waveId = id.x; offId = id.y; along = uv.x;
  }

  float dir = 1.0;
  if (uAlternate > 0.5 && mod(offId, 2.0) >= 1.0) dir = -1.0;

  float phase = iTime * uSpeed + waveId * uWaveSpread + cos(offId * uRowOffset);
  float mv = sin(phase) * 0.5 + 0.5;
  if (dir < 0.0) mv = 1.0 - mv;

  float infl = 0.0;
  if (uEnableMouse > 0.5) {
    float md = distance(uv, uMouse);
    infl = smoothstep(uMouseRadius, 0.0, md) * uMouseStrength * uMouseActive;
  }

  float thick = clamp(uThickness + infl * 0.25, 0.0, 1.0);
  float startPos = (0.5 - thick * 0.5) * uTravel;
  float endPos = (-0.5 + thick * 0.5) * uTravel;
  float pos = mix(startPos, endPos, mv);

  float aa = max(uSoftness, 0.0005);
  float d = abs(barCoord + pos) - thick * 0.5;
  float aaWidth = fwidth(uVertical > 0.5 ? p.x : p.y);
  float edge = max(aa, aaWidth);
  float mask = smoothstep(edge, -edge, d);
  float glow = exp(-max(d, 0.0) * (7.0 / (uGlow + 0.001))) * clamp(uGlow, 0.0, 1.0);
  float intensity = clamp(mask + glow * (1.0 - mask), 0.0, 1.0);

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    intensity = clamp(intensity + (g - 0.5) * uGrainIntensity, 0.0, 1.0);
  }

  float tint = mv;
  vec3 grad = mix(uColor2, uColor1, tint);
  grad = mix(grad, uColor3, clamp(along, 0.0, 1.0) * 0.45);

  vec3 col = grad * uBrightness * (1.0 + infl * 0.6);
  col = (col - 0.5) * uContrast + 0.5;
  col = clamp(col, 0.0, 1.0);

  float a = intensity * uOpacity;
  fragColor = vec4(col * a, a);
}
`;

export interface SlicedWavesProps {
  color1?: string;
  color2?: string;
  color3?: string;
  columns?: number;
  rows?: number;
  barThickness?: number;
  speed?: number;
  travel?: number;
  waveSpread?: number;
  rowOffset?: number;
  softness?: number;
  glow?: number;
  brightness?: number;
  contrast?: number;
  opacity?: number;
  orientation?: 'horizontal' | 'vertical';
  alternate?: boolean;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

const SlicedWaves = ({
  color1 = '#FF9FFC',
  color2 = '#5227FF',
  color3 = '#B497CF',
  columns = 14,
  rows = 8,
  barThickness = 0.1,
  speed = 0.35,
  travel = 0.7,
  waveSpread = 0.9,
  rowOffset = 1.0,
  softness = 0.05,
  glow = 0,
  brightness = 1.0,
  contrast = 1.0,
  opacity = 0.5,
  orientation = 'horizontal',
  alternate = false,
  mouseInteraction = true,
  mouseStrength = 1,
  mouseRadius = 0.3,
  grain = true,
  grainIntensity = 0.05,
  className = '',
}: SlicedWavesProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const glRef = useRef<WebGL2RenderingContext | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile Shaders
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen triangle buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posAttribLocation = gl.getAttribLocation(program, 'position');
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(posAttribLocation);
    gl.vertexAttribPointer(posAttribLocation, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const uniformNames = [
      'iTime', 'iResolution', 'uColumns', 'uRows', 'uThickness', 'uSpeed',
      'uTravel', 'uWaveSpread', 'uRowOffset', 'uSoftness', 'uGlow', 'uBrightness',
      'uContrast', 'uOpacity', 'uVertical', 'uAlternate', 'uMouse', 'uMouseStrength',
      'uMouseRadius', 'uEnableMouse', 'uMouseActive', 'uGrain', 'uGrainIntensity',
      'uColor1', 'uColor2', 'uColor3'
    ];

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    uniformNames.forEach((name) => {
      uniforms[name] = gl.getUniformLocation(program, name);
    });
    uniformsRef.current = uniforms;

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uniforms.iResolution, w, h);
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];
    let currentActive = 0;
    let targetActive = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
      targetActive = 1;
    };
    const onMouseLeave = () => {
      targetActive = 0;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const renderFrame = (t: number) => {
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(uniforms.iTime, (t - t0) * 0.001);

      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      currentActive += 0.05 * (targetActive - currentActive);

      gl.uniform2f(uniforms.uMouse, currentMouse[0], currentMouse[1]);
      gl.uniform1f(uniforms.uMouseActive, currentActive);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(renderFrame);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(renderFrame);
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      try {
        container.removeChild(canvas);
      } catch {}
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    if (!gl || !uniforms.uColumns) return;

    gl.uniform1f(uniforms.uColumns, Math.max(1, Math.round(columns)));
    gl.uniform1f(uniforms.uRows, Math.max(1, Math.round(rows)));
    gl.uniform1f(uniforms.uThickness, barThickness);
    gl.uniform1f(uniforms.uSpeed, speed);
    gl.uniform1f(uniforms.uTravel, travel);
    gl.uniform1f(uniforms.uWaveSpread, waveSpread);
    gl.uniform1f(uniforms.uRowOffset, rowOffset);
    gl.uniform1f(uniforms.uSoftness, softness);
    gl.uniform1f(uniforms.uGlow, glow);
    gl.uniform1f(uniforms.uBrightness, brightness);
    gl.uniform1f(uniforms.uContrast, contrast);
    gl.uniform1f(uniforms.uOpacity, opacity);
    gl.uniform1f(uniforms.uVertical, orientation === 'vertical' ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uAlternate, alternate ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uMouseStrength, mouseStrength);
    gl.uniform1f(uniforms.uMouseRadius, mouseRadius);
    gl.uniform1f(uniforms.uEnableMouse, mouseInteraction ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uGrain, grain ? 1.0 : 0.0);
    gl.uniform1f(uniforms.uGrainIntensity, grainIntensity);

    const c1 = hexToRgb(color1);
    gl.uniform3f(uniforms.uColor1, c1[0], c1[1], c1[2]);
    const c2 = hexToRgb(color2);
    gl.uniform3f(uniforms.uColor2, c2[0], c2[1], c2[2]);
    const c3 = hexToRgb(color3);
    gl.uniform3f(uniforms.uColor3, c3[0], c3[1], c3[2]);
  }, [
    color1, color2, color3, columns, rows, barThickness, speed, travel,
    waveSpread, rowOffset, softness, glow, brightness, contrast, opacity,
    orientation, alternate, mouseInteraction, mouseStrength, mouseRadius,
    grain, grainIntensity
  ]);

  return <div ref={containerRef} className={`sliced-waves-container ${className}`.trim()} />;
};

export default SlicedWaves;
