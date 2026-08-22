import BackgroundLoader from "@/components/background-loader";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050608] px-6 py-16 sm:px-8">
      <div className="absolute inset-0">
        <BackgroundLoader />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[min(20rem,48vh)] w-[min(76vw,36rem)] -translate-x-1/2 -translate-y-1/2 scale-110 bg-[radial-gradient(ellipse_at_center,rgba(5,7,11,0.66)_0%,rgba(5,7,11,0.44)_34%,rgba(5,7,11,0.18)_62%,rgba(5,7,11,0.04)_78%,transparent_100%)] blur-[18px]"
      />
      <section
        aria-labelledby="intro-title"
        className="relative z-10 w-full max-w-md px-8 py-12 sm:px-12 sm:py-16"
      >
        <div className="space-y-2">
          <h1
            id="intro-title"
            className="font-signifier text-[28px] text-balance text-[#ededed]"
          >
            Hugh Fabre
          </h1>
          <p className="font-sans text-sm leading-snug text-[#ededed]/80">
            Web Engineer / Designer
          </p>
        </div>
      </section>
    </main>
  );
}
