"use client";

import { memo, useEffect, useRef } from "react";

type Star = {
  bright: boolean;
  glow: boolean;
  opacity: number;
  size: number;
  x: number;
  y: number;
};

function seededValue(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const STARS: Star[] = Array.from({ length: 360 }, (_, index) => {
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
    bright: isBright,
    glow: isBright && size === 2,
    opacity: isBright
      ? (isExposedSky ? 0.88 : 0.84) + seededValue(index + 101.2) * 0.14
      : (isExposedSky ? 0.54 : 0.46) + brightness * 0.3,
    size,
    x: seededValue(index + 41.3) * 100,
    y,
  };
});

function drawStars(canvas: HTMLCanvasElement) {
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;

  for (const star of STARS) {
    if (star.glow) {
      continue;
    }

    context.globalAlpha = star.opacity;
    context.fillStyle = star.bright ? "#dce9ff" : "#8bb6ff";
    context.fillRect(
      (star.x / 100) * width,
      (star.y / 100) * height,
      star.size,
      star.size,
    );
  }

  context.globalAlpha = 1;
}

const StarField = memo(function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => drawStars(canvas));
    resizeObserver.observe(canvas);
    drawStars(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 size-full [image-rendering:pixelated]"
    />
  );
});

export default StarField;
