"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useBackgroundReady } from "@/components/background-ready-context";
import {
  BACKGROUND_ROUTE_INTENT_EVENT,
  type BackgroundRouteIntentDetail,
} from "@/components/background-route-intent";

const VERTEX_SHADER = `
precision highp float;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
}
`;

const FRAGMENT_SHADER = `
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
  vec2 pixelCoord = floor(gl_FragCoord.xy / pixelSize) * pixelSize;
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

  gl_FragColor = vec4(color, alpha);
}
`;

const WAVE_CONFIG = {
  colorNum: 4.3,
  pixelSize: 2,
  waveAmplitude: 0.44,
  waveColor: [0.32, 0.55, 0.95] as const,
  waveFrequency: 2.3,
  waveSpeed: 0.03,
};

function createWaveUniforms(initialVisibility: number) {
  return {
    time: new THREE.Uniform(0),
    resolution: new THREE.Uniform(new THREE.Vector2()),
    waveSpeed: new THREE.Uniform(WAVE_CONFIG.waveSpeed),
    waveFrequency: new THREE.Uniform(WAVE_CONFIG.waveFrequency),
    waveAmplitude: new THREE.Uniform(WAVE_CONFIG.waveAmplitude),
    waveColor: new THREE.Uniform(new THREE.Color(...WAVE_CONFIG.waveColor)),
    colorNum: new THREE.Uniform(WAVE_CONFIG.colorNum),
    pixelSize: new THREE.Uniform(WAVE_CONFIG.pixelSize),
    nebulaVisibility: new THREE.Uniform(initialVisibility),
    transitionSeed: new THREE.Uniform(0),
  };
}

type WaveUniforms = ReturnType<typeof createWaveUniforms>;

function updateWaveResolution(
  uniforms: WaveUniforms,
  width: number,
  height: number,
  pixelRatio: number,
) {
  const resolution = uniforms.resolution.value;
  const nextWidth = Math.floor(width * pixelRatio);
  const nextHeight = Math.floor(height * pixelRatio);

  if (resolution.x === nextWidth && resolution.y === nextHeight) {
    return false;
  }

  resolution.set(nextWidth, nextHeight);
  return true;
}

type NebulaTransition = {
  duration: number;
  startScale: number;
  startTime: number;
  startVisibility: number;
  targetVisibility: number;
  seed: number;
};

function WaveLayer({
  isHome,
  disableAnimation,
  onReady,
  onTransitionChange,
}: {
  disableAnimation: boolean;
  onReady: () => void;
  onTransitionChange: (active: boolean) => void;
  isHome: boolean;
}) {
  const { camera, clock, viewport, size, gl, invalidate, scene } = useThree();
  const [uniforms] = useState(() => createWaveUniforms(isHome ? 1 : 0));
  const uniformsRef = useRef(uniforms);
  const visibilityRef = useRef(isHome ? 1 : 0);
  const transitionRef = useRef<NebulaTransition | null>(null);
  const transitionIndex = useRef(0);
  const routeRef = useRef(isHome);
  const waveScaleRef = useRef(1);
  const waveTimeRef = useRef(0);
  const lastClockTimeRef = useRef(0);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) {
        onReady();
      }
    };

    const hasParallelShaderCompile = Boolean(
      gl.getContext().getExtension("KHR_parallel_shader_compile"),
    );
    const compile = Promise.resolve().then(() => {
      if (hasParallelShaderCompile) {
        return gl.compileAsync(scene, camera);
      }

      gl.compile(scene, camera);
      return scene;
    });

    void compile.then(markReady, markReady);

    return () => {
      cancelled = true;
    };
  }, [camera, gl, onReady, scene]);

  useEffect(() => {
    if (
      updateWaveResolution(
        uniformsRef.current,
        size.width,
        size.height,
        gl.getPixelRatio(),
      )
    ) {
      invalidate();
    }
  }, [gl, invalidate, size.height, size.width, uniforms]);

  useEffect(() => {
    const canvas = gl.domElement;
    const preventContextLoss = (event: Event) => event.preventDefault();
    const restoreContext = () => {
      updateWaveResolution(
        uniformsRef.current,
        size.width,
        size.height,
        gl.getPixelRatio(),
      );
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", preventContextLoss);
    canvas.addEventListener("webglcontextrestored", restoreContext);

    return () => {
      canvas.removeEventListener("webglcontextlost", preventContextLoss);
      canvas.removeEventListener("webglcontextrestored", restoreContext);
    };
  }, [gl, invalidate, size.height, size.width, uniforms]);

  useEffect(() => {
    lastClockTimeRef.current = clock.getElapsedTime();
  }, [clock, disableAnimation]);

  useEffect(() => {
    if (routeRef.current === isHome) {
      return;
    }

    routeRef.current = isHome;
    lastClockTimeRef.current = clock.getElapsedTime();
    transitionIndex.current += 1;
    const activeTransition = transitionRef.current;
    const seed = activeTransition
      ? Math.abs(activeTransition.seed)
      : 0.2 +
        seededValue(
          clock.getElapsedTime() * 17.3 + transitionIndex.current * 31.7,
        ) *
          0.8;

    transitionRef.current = {
      duration: disableAnimation ? 150 : isHome ? 2800 : 3000,
      startScale: waveScaleRef.current,
      startTime: clock.getElapsedTime(),
      startVisibility: visibilityRef.current,
      targetVisibility: isHome ? 1 : 0,
      seed: isHome ? -seed : seed,
    };
    uniformsRef.current.transitionSeed.value = isHome ? -seed : seed;
    onTransitionChange(true);
    invalidate();
  }, [clock, disableAnimation, invalidate, isHome, onTransitionChange]);

  useFrame(() => {
    const currentClockTime = clock.getElapsedTime();
    const delta = Math.max(0, currentClockTime - lastClockTimeRef.current);
    lastClockTimeRef.current = currentClockTime;
    const transition = transitionRef.current;
    let scale = 1;

    if (transition) {
      const elapsed =
        ((currentClockTime - transition.startTime) * 1000) /
        transition.duration;
      const progress = THREE.MathUtils.clamp(elapsed, 0, 1);
      const eased = progress * (2 - progress);
      const visibility = THREE.MathUtils.lerp(
        transition.startVisibility,
        transition.targetVisibility,
        eased,
      );
      scale = THREE.MathUtils.lerp(
        transition.startScale,
        transition.targetVisibility === 0 && !disableAnimation ? 1.32 : 1,
        eased,
      );
      visibilityRef.current = visibility;
      uniformsRef.current.nebulaVisibility.value = visibility;
    }

    waveScaleRef.current = scale;
    if (!disableAnimation) {
      waveTimeRef.current += delta * scale;
      uniformsRef.current.time.value = waveTimeRef.current;
    }

    if (!transition) {
      return;
    }

    const progress = THREE.MathUtils.clamp(
      ((currentClockTime - transition.startTime) * 1000) / transition.duration,
      0,
      1,
    );

    if (progress >= 1) {
      transitionRef.current = null;
      visibilityRef.current = transition.targetVisibility;
      uniformsRef.current.nebulaVisibility.value = transition.targetVisibility;
      uniformsRef.current.transitionSeed.value = 0;
      waveScaleRef.current = 1;
      onTransitionChange(false);
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getMotionPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia(MOTION_QUERY).matches ||
    document.visibilityState !== "visible"
  );
}

function useMotionPreference() {
  const [disableAnimation, setDisableAnimation] = useState(getMotionPreference);

  useEffect(() => {
    const motionQuery = window.matchMedia(MOTION_QUERY);
    const updateMotion = () => {
      setDisableAnimation(
        motionQuery.matches || document.visibilityState !== "visible",
      );
    };

    updateMotion();
    motionQuery.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);

    return () => {
      motionQuery.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
    };
  }, []);

  return disableAnimation;
}

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  bright: boolean;
  glow: boolean;
};

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const STARFIELD_STARS: Star[] = Array.from({ length: 360 }, (_, index) => {
  const sizeSeed = seededValue(index + 3.1);
  const brightness = seededValue(index + 19.7);
  const verticalSeed = seededValue(index + 73.9);
  const edgeSeed = seededValue(index + 86.1);
  const isTopSky = verticalSeed < 0.3;
  const isBottomSky = verticalSeed > 0.7;
  const isExposedSky = isTopSky || isBottomSky;
  const y = isTopSky
    ? 3 + edgeSeed * 25
    : isBottomSky
      ? 72 + edgeSeed * 25
      : 8 + verticalSeed * 84;
  const isBright = brightness > (isExposedSky ? 0.72 : 0.78);
  const size = sizeSeed > (isExposedSky ? 0.84 : 0.88) ? 2 : 1;

  return {
    x: seededValue(index + 41.3) * 100,
    y,
    size,
    opacity: isBright
      ? (isExposedSky ? 0.88 : 0.84) + seededValue(index + 101.2) * 0.14
      : (isExposedSky ? 0.54 : 0.46) + brightness * 0.3,
    bright: isBright,
    glow: isBright && size === 2,
  };
});

const StarField = memo(function StarField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {STARFIELD_STARS.map((star, index) => (
        <span
          key={index}
          className={`absolute block ${
            star.bright ? "bg-[#dce9ff]" : "bg-[#8bb6ff]"
          }${star.glow ? "shadow-[0_0_5px_#b9d5ff]" : ""}`}
          style={{
            height: `${star.size}px`,
            left: `${star.x.toFixed(4)}%`,
            opacity: star.opacity.toFixed(6),
            top: `${star.y.toFixed(4)}%`,
            width: `${star.size}px`,
          }}
        />
      ))}
    </div>
  );
});

const CANVAS_GL = { antialias: true, alpha: true };
const CANVAS_STYLE = {
  width: "100%",
  height: "100%",
  display: "block",
  background: "transparent",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
};
const CAMERA = { position: [0, 0, 6] as const };

export default function Background({ isHome }: { isHome: boolean }) {
  const disableAnimation = useMotionPreference();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetIsHome, setTargetIsHome] = useState(isHome);
  const [isSettledHidden, setIsSettledHidden] = useState(!isHome);
  const targetIsHomeRef = useRef(isHome);
  const { markReady } = useBackgroundReady();

  const startRouteTransition = useCallback((nextIsHome: boolean) => {
    if (targetIsHomeRef.current === nextIsHome) {
      return;
    }

    targetIsHomeRef.current = nextIsHome;
    setIsSettledHidden(false);
    setTargetIsHome(nextIsHome);
  }, []);

  useEffect(() => {
    startRouteTransition(isHome);
  }, [isHome, startRouteTransition]);

  useEffect(() => {
    const handleRouteIntent = (event: Event) => {
      const routeEvent = event as CustomEvent<BackgroundRouteIntentDetail>;
      startRouteTransition(routeEvent.detail.isHome);
    };
    const handlePopState = () => {
      startRouteTransition(window.location.pathname === "/");
    };

    window.addEventListener(BACKGROUND_ROUTE_INTENT_EVENT, handleRouteIntent);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(
        BACKGROUND_ROUTE_INTENT_EVENT,
        handleRouteIntent,
      );
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startRouteTransition]);

  const handleTransitionChange = useCallback((active: boolean) => {
    setIsTransitioning(active);
    if (active) {
      setIsSettledHidden(false);
    } else if (!targetIsHomeRef.current) {
      setIsSettledHidden(true);
    }
  }, []);

  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="pointer-events-none absolute inset-0">
        <Canvas
          dpr={1}
          frameloop={
            isTransitioning || (!isSettledHidden && !disableAnimation)
              ? "always"
              : "demand"
          }
          gl={CANVAS_GL}
          camera={CAMERA}
          style={CANVAS_STYLE}
        >
          <WaveLayer
            disableAnimation={disableAnimation}
            isHome={targetIsHome}
            onReady={markReady}
            onTransitionChange={handleTransitionChange}
          />
        </Canvas>
      </div>
      <StarField />
    </div>
  );
}
