"use client";

import dynamic from "next/dynamic";

const Background = dynamic(() => import("./background"), {
  ssr: false,
});

export default function BackgroundLoader() {
  return <Background />;
}
