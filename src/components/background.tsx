"use client";

import { useEffect, useRef } from "react";
import {
  BACKGROUND_ROUTE_INTENT_EVENT,
  type BackgroundRouteIntentDetail,
} from "@/components/background-route-intent";
import StarField from "@/components/star-field";

const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform float colorNum;
uniform float pixelSize;
uniform float nebulaVisibility;
uniform float transitionSeed;

out vec4 fragmentColor;

vec4 mod289(vec4 value) {
  return value - floor(value * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 value) {
  return mod289(((value * 34.0) + 1.0) * value);
}

vec4 taylorInvSqrt(vec4 value) {
  return 1.79284291400159 - 0.85373472095314 * value;
}

vec2 fade(vec2 value) {
  return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
}

float cnoise(vec2 position) {
  vec4 cell = floor(position.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 local = fract(position.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  cell = mod289(cell);
  vec4 cellX = cell.xzxz;
  vec4 cellY = cell.yyww;
  vec4 localX = local.xzxz;
  vec4 localY = local.yyww;
  vec4 gradientIndex = permute(permute(cellX) + cellY);
  vec4 gradientX = fract(gradientIndex * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gradientY = abs(gradientX) - 0.5;
  vec4 offset = floor(gradientX + 0.5);
  gradientX -= offset;
  vec2 gradient00 = vec2(gradientX.x, gradientY.x);
  vec2 gradient10 = vec2(gradientX.y, gradientY.y);
  vec2 gradient01 = vec2(gradientX.z, gradientY.z);
  vec2 gradient11 = vec2(gradientX.w, gradientY.w);
  vec4 normalization = taylorInvSqrt(
    vec4(
      dot(gradient00, gradient00),
      dot(gradient01, gradient01),
      dot(gradient10, gradient10),
      dot(gradient11, gradient11)
    )
  );
  gradient00 *= normalization.x;
  gradient01 *= normalization.y;
  gradient10 *= normalization.z;
  gradient11 *= normalization.w;
  float value00 = dot(gradient00, vec2(localX.x, localY.x));
  float value10 = dot(gradient10, vec2(localX.y, localY.y));
  float value01 = dot(gradient01, vec2(localX.z, localY.z));
  float value11 = dot(gradient11, vec2(localX.w, localY.w));
  vec2 fadePosition = fade(local.xy);
  vec2 xMix = mix(vec2(value00, value01), vec2(value10, value11), fadePosition.x);
  return 2.3 * mix(xMix.x, xMix.y, fadePosition.y);
}

const int OCTAVES = 4;

float fbm(vec2 position) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = waveFrequency;

  for (int octave = 0; octave < OCTAVES; octave += 1) {
    value += amplitude * abs(cnoise(position));
    position *= frequency;
    amplitude *= waveAmplitude;
  }

  return value;
}

float pattern(vec2 position) {
  return fbm(position + fbm(position - time * waveSpeed));
}

vec3 nebulaPalette(float field, float whiteProtection) {
  float energy = clamp(field * 1.35, 0.0, 1.0);
  vec3 color = vec3(0.008, 0.012, 0.04);
  color = mix(color, vec3(0.025, 0.11, 0.3), smoothstep(0.05, 0.3, energy));
  color = mix(color, waveColor, smoothstep(0.2, 0.55, energy) * 0.68);
  float blueHighlight = smoothstep(0.42, 0.78, energy) * 0.68;
  color = mix(color, vec3(0.2, 0.48, 0.86), blueHighlight);
  float whiteHighlight = smoothstep(0.72, 1.0, energy) * 0.58;
  whiteHighlight *= 1.0 - whiteProtection;
  color = mix(color, vec3(0.62, 0.78, 1.0), whiteHighlight);
  return color;
}

const float BAYER_8X8[64] = float[64](
  0.0 / 64.0, 48.0 / 64.0, 12.0 / 64.0, 60.0 / 64.0,
  3.0 / 64.0, 51.0 / 64.0, 15.0 / 64.0, 63.0 / 64.0,
  32.0 / 64.0, 16.0 / 64.0, 44.0 / 64.0, 28.0 / 64.0,
  35.0 / 64.0, 19.0 / 64.0, 47.0 / 64.0, 31.0 / 64.0,
  8.0 / 64.0, 56.0 / 64.0, 4.0 / 64.0, 52.0 / 64.0,
  11.0 / 64.0, 59.0 / 64.0, 7.0 / 64.0, 55.0 / 64.0,
  40.0 / 64.0, 24.0 / 64.0, 36.0 / 64.0, 20.0 / 64.0,
  43.0 / 64.0, 27.0 / 64.0, 39.0 / 64.0, 23.0 / 64.0,
  2.0 / 64.0, 50.0 / 64.0, 14.0 / 64.0, 62.0 / 64.0,
  1.0 / 64.0, 49.0 / 64.0, 13.0 / 64.0, 61.0 / 64.0,
  34.0 / 64.0, 18.0 / 64.0, 46.0 / 64.0, 30.0 / 64.0,
  33.0 / 64.0, 17.0 / 64.0, 45.0 / 64.0, 29.0 / 64.0,
  10.0 / 64.0, 58.0 / 64.0, 6.0 / 64.0, 54.0 / 64.0,
  9.0 / 64.0, 57.0 / 64.0, 5.0 / 64.0, 53.0 / 64.0,
  42.0 / 64.0, 26.0 / 64.0, 38.0 / 64.0, 22.0 / 64.0,
  41.0 / 64.0, 25.0 / 64.0, 37.0 / 64.0, 21.0 / 64.0
);

vec3 applyDither(vec3 color) {
  vec2 screenCell = floor(gl_FragCoord.xy / pixelSize);
  int x = int(mod(screenCell.x, 8.0));
  int y = int(mod(screenCell.y, 8.0));
  float threshold = BAYER_8X8[y * 8 + x] - 0.25;
  float stepSize = 1.0 / (colorNum - 1.0);
  color += threshold * stepSize;
  color = clamp(color - 0.2, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  vec2 pixelCoord = floor(gl_FragCoord.xy / pixelSize) * pixelSize * 2.0;
  vec2 rawUv = pixelCoord / resolution.xy;
  vec2 uv = rawUv;
  uv -= 0.5;
  uv.x *= resolution.x / resolution.y;

  float field = pattern(uv);

  float edgeFade = smoothstep(0.0, 0.24, rawUv.y)
    * (1.0 - smoothstep(0.76, 1.0, rawUv.y));
  field *= edgeFade;

  if (nebulaVisibility <= 0.0) {
    field = 0.0;
  } else if (transitionSeed != 0.0 && nebulaVisibility < 1.0) {
    float fixedSeed = abs(transitionSeed);
    float lowNoise = 0.5 + 0.5 * cnoise(
      rawUv * 3.6 + vec2(fixedSeed * 17.0, fixedSeed * 29.0)
    );
    float midNoise = 0.5 + 0.5 * cnoise(
      rawUv * 9.0 + vec2(fixedSeed * 23.0, fixedSeed * 37.0)
    );
    float fixedNoise = mix(lowNoise, midNoise, 0.38);
    float extinction = 1.0 - nebulaVisibility;
    float erosionProgress = pow(
      smoothstep(0.05, 0.95, extinction),
      2.0
    );
    float localExtinction = extinction + (fixedNoise - 0.5) * 0.24;
    float localReveal = 1.0 - smoothstep(0.1, 1.0, localExtinction);
    field *= localReveal;
    field *= mix(1.0, 0.5, erosionProgress);
    field *= smoothstep(0.0, 0.18, nebulaVisibility);
  }

  float lowerText = smoothstep(0.04, 0.18, rawUv.y - 0.506);
  float textCenterX = 0.5;
  float textRadiusX = clamp(0.22, 240.0 / resolution.x, 0.42);
  float textRadiusY = mix(0.42, 0.38, lowerText);
  vec2 textZone = (rawUv - vec2(textCenterX, 0.506)) / vec2(textRadiusX, textRadiusY);
  float protectionNoise = cnoise(
    rawUv * 3.0 + vec2(time * 0.003, -time * 0.002)
  );
  float protectionDistance = length(textZone) + protectionNoise * 0.08;
  float whiteProtection = 1.0 - smoothstep(0.0, 1.8, protectionDistance);
  vec3 color = applyDither(nebulaPalette(field, whiteProtection));
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float alpha = smoothstep(0.0, 0.05, luminance);

  fragmentColor = vec4(color, alpha);
}
`;

const WAVE_CONFIG = {
  colorNum: 4.3,
  pixelSize: 1,
  waveAmplitude: 0.44,
  waveColor: [0.32, 0.55, 0.95] as const,
  waveFrequency: 2.3,
  waveSpeed: 0.03,
};

type NebulaTransition = {
  duration: number;
  seed: number;
  startScale: number;
  startTime: number;
  startVisibility: number;
  targetVisibility: number;
};

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const FRAME_INTERVAL = 1000 / 60;
const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);

type NebulaUniforms = {
  nebulaVisibility: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
  transitionSeed: WebGLUniformLocation;
};

type NebulaRenderer = {
  buffer: WebGLBuffer;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniforms: NebulaUniforms;
};

type NebulaAnimation = {
  currentRouteIsHome: boolean;
  disabled: boolean;
  lastTime: number;
  nextDrawTime: number;
  targetIsHome: boolean;
  transition: NebulaTransition | null;
  transitionIndex: number;
  visibility: number;
  waveScale: number;
  waveTime: number;
};

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create nebula shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function assertShaderCompiled(gl: WebGL2RenderingContext, shader: WebGLShader) {
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return;
  }

  throw new Error(gl.getShaderInfoLog(shader) ?? "Unable to compile shader");
}

function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(`Unable to find nebula uniform: ${name}`);
  }
  return location;
}

function createNebulaRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
  });
  if (!gl) {
    throw new Error("WebGL2 is unavailable");
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Unable to create nebula program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  assertShaderCompiled(gl, vertexShader);
  assertShaderCompiled(gl, fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link shaders");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("Unable to create nebula geometry");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  gl.uniform1f(
    getUniformLocation(gl, program, "waveSpeed"),
    WAVE_CONFIG.waveSpeed,
  );
  gl.uniform1f(
    getUniformLocation(gl, program, "waveFrequency"),
    WAVE_CONFIG.waveFrequency,
  );
  gl.uniform1f(
    getUniformLocation(gl, program, "waveAmplitude"),
    WAVE_CONFIG.waveAmplitude,
  );
  gl.uniform3f(
    getUniformLocation(gl, program, "waveColor"),
    ...WAVE_CONFIG.waveColor,
  );
  gl.uniform1f(
    getUniformLocation(gl, program, "colorNum"),
    WAVE_CONFIG.colorNum,
  );
  gl.uniform1f(
    getUniformLocation(gl, program, "pixelSize"),
    WAVE_CONFIG.pixelSize,
  );

  return {
    buffer,
    gl,
    program,
    uniforms: {
      nebulaVisibility: getUniformLocation(gl, program, "nebulaVisibility"),
      resolution: getUniformLocation(gl, program, "resolution"),
      time: getUniformLocation(gl, program, "time"),
      transitionSeed: getUniformLocation(gl, program, "transitionSeed"),
    },
  } satisfies NebulaRenderer;
}

function resizeRenderer(renderer: NebulaRenderer, canvas: HTMLCanvasElement) {
  const displayWidth = Math.max(1, Math.round(canvas.clientWidth));
  const displayHeight = Math.max(1, Math.round(canvas.clientHeight));
  const renderWidth = Math.max(1, Math.ceil(displayWidth / 2));
  const renderHeight = Math.max(1, Math.ceil(displayHeight / 2));

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth;
    canvas.height = renderHeight;
  }

  renderer.gl.viewport(0, 0, renderWidth, renderHeight);
  renderer.gl.useProgram(renderer.program);
  renderer.gl.uniform2f(
    renderer.uniforms.resolution,
    displayWidth,
    displayHeight,
  );
}

function drawNebula(renderer: NebulaRenderer, animation: NebulaAnimation) {
  const { gl, uniforms } = renderer;
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(renderer.program);
  gl.uniform1f(uniforms.time, animation.waveTime);
  gl.uniform1f(uniforms.nebulaVisibility, animation.visibility);
  gl.uniform1f(uniforms.transitionSeed, animation.transition?.seed ?? 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

type BackgroundProps = {
  isHome: boolean;
  onReady: () => void;
};

export default function Background({ isHome, onReady }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialIsHomeRef = useRef(isHome);
  const requestTargetRef = useRef<(nextIsHome: boolean) => void>(() => {});

  useEffect(() => {
    requestTargetRef.current(isHome);
  }, [isHome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const motionQuery = window.matchMedia(MOTION_QUERY);
    const animation: NebulaAnimation = {
      currentRouteIsHome: false,
      disabled: motionQuery.matches || document.visibilityState !== "visible",
      lastTime: 0,
      nextDrawTime: 0,
      targetIsHome: initialIsHomeRef.current,
      transition: null,
      transitionIndex: 0,
      visibility: 0,
      waveScale: 1,
      waveTime: 0,
    };
    let renderer: NebulaRenderer | null = null;
    let frameId: number | null = null;
    let disposed = false;
    let didMarkReady = false;

    const scheduleFrame = () => {
      if (frameId === null && document.visibilityState === "visible") {
        frameId = requestAnimationFrame(renderFrame);
      }
    };

    const startRouteTransition = (nextIsHome: boolean) => {
      animation.targetIsHome = nextIsHome;
      if (!renderer || animation.currentRouteIsHome === nextIsHome) {
        return;
      }

      animation.currentRouteIsHome = nextIsHome;
      animation.transitionIndex += 1;
      const now = performance.now();
      const activeTransition = animation.transition;
      const seed = activeTransition
        ? Math.abs(activeTransition.seed)
        : 0.2 +
          seededValue((now / 1000) * 17.3 + animation.transitionIndex * 31.7) *
            0.8;

      animation.transition = {
        duration: animation.disabled ? 150 : nextIsHome ? 2800 : 3000,
        seed: nextIsHome ? -seed : seed,
        startScale: animation.waveScale,
        startTime: now,
        startVisibility: animation.visibility,
        targetVisibility: nextIsHome ? 1 : 0,
      };
      animation.lastTime = now;
      animation.nextDrawTime = now;
      scheduleFrame();
    };

    const updateMotionPreference = () => {
      animation.disabled =
        motionQuery.matches || document.visibilityState !== "visible";
      animation.lastTime = performance.now();
      animation.nextDrawTime = animation.lastTime;

      if (document.visibilityState !== "visible") {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        return;
      }

      scheduleFrame();
    };

    function renderFrame(now: number) {
      frameId = null;
      if (!renderer || disposed) {
        return;
      }

      if (now < animation.nextDrawTime) {
        scheduleFrame();
        return;
      }

      animation.nextDrawTime = Math.max(
        animation.nextDrawTime + FRAME_INTERVAL,
        now,
      );

      const delta = animation.lastTime
        ? Math.max(0, (now - animation.lastTime) / 1000)
        : 0;
      animation.lastTime = now;
      const transition = animation.transition;
      let scale = 1;

      if (transition) {
        const progress = clamp(
          (now - transition.startTime) / transition.duration,
          0,
          1,
        );
        const eased = progress * (2 - progress);
        animation.visibility = lerp(
          transition.startVisibility,
          transition.targetVisibility,
          eased,
        );
        scale = lerp(
          transition.startScale,
          transition.targetVisibility === 0 && !animation.disabled ? 1.32 : 1,
          eased,
        );

        if (progress >= 1) {
          animation.visibility = transition.targetVisibility;
          animation.transition = null;
          scale = 1;
        }
      }

      animation.waveScale = scale;
      if (!animation.disabled) {
        animation.waveTime += delta * scale;
      }

      drawNebula(renderer, animation);

      if (
        animation.transition ||
        (!animation.disabled && animation.currentRouteIsHome)
      ) {
        scheduleFrame();
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      if (renderer) {
        resizeRenderer(renderer, canvas);
        scheduleFrame();
      }
    });

    const initializeRenderer = () => {
      try {
        const nextRenderer = createNebulaRenderer(canvas);
        if (disposed) {
          nextRenderer.gl.deleteBuffer(nextRenderer.buffer);
          nextRenderer.gl.deleteProgram(nextRenderer.program);
          return;
        }

        renderer = nextRenderer;
        resizeRenderer(renderer, canvas);
        animation.lastTime = performance.now();
        startRouteTransition(animation.targetIsHome);
        scheduleFrame();

        if (!didMarkReady) {
          didMarkReady = true;
          onReady();
        }
      } catch (error) {
        console.error(error);
        if (!didMarkReady && !disposed) {
          didMarkReady = true;
          onReady();
        }
      }
    };

    const handleRouteIntent = (event: Event) => {
      const routeEvent = event as CustomEvent<BackgroundRouteIntentDetail>;
      startRouteTransition(routeEvent.detail.isHome);
    };
    const handlePopState = () => {
      startRouteTransition(window.location.pathname === "/");
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      renderer = null;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };
    const handleContextRestored = () => {
      initializeRenderer();
    };

    requestTargetRef.current = startRouteTransition;
    resizeObserver.observe(canvas);
    motionQuery.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updateMotionPreference);
    window.addEventListener(BACKGROUND_ROUTE_INTENT_EVENT, handleRouteIntent);
    window.addEventListener("popstate", handlePopState);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    initializeRenderer();

    return () => {
      disposed = true;
      requestTargetRef.current = () => {};
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updateMotionPreference);
      window.removeEventListener(
        BACKGROUND_ROUTE_INTENT_EVENT,
        handleRouteIntent,
      );
      window.removeEventListener("popstate", handlePopState);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (renderer) {
        renderer.gl.deleteBuffer(renderer.buffer);
        renderer.gl.deleteProgram(renderer.program);
      }
    };
  }, [onReady]);

  return (
    <div className="relative size-full" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block size-full bg-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_78%,transparent_100%)] [image-rendering:pixelated]"
      />
      <StarField />
    </div>
  );
}
