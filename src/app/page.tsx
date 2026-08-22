import Background from "@/components/background";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Background />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[10vh] z-10 h-[30vh] bg-linear-to-t from-[#0A0C0D] via-[#0A0C0D]/80 to-transparent"
      />
    </main>
  );
}
