const SPINNER_BARS = Array.from({ length: 12 }, (_, index) => ({
  animationDelay: `${-1.2 + index * 0.1}s`,
  rotation: `${index * 30}deg`,
}));

export default function Spinner() {
  return (
    <div aria-hidden="true" className="relative block size-6 text-white">
      {SPINNER_BARS.map(({ animationDelay, rotation }, index) => (
        <span
          key={index}
          className="absolute top-1/2 left-1/2 h-[8%] w-[24%] animate-[bars-spinner_1.2s_linear_infinite] rounded-full bg-current motion-reduce:animate-none"
          style={{
            animationDelay,
            transform: `translate(-50%, -50%) rotate(${rotation}) translateX(146%)`,
          }}
        />
      ))}
    </div>
  );
}
