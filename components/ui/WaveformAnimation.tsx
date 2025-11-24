type WaveformAnimationProps = {
  isActive?: boolean;
};

export default function WaveformAnimation({
  isActive = true,
}: WaveformAnimationProps) {
  const bars = Array.from({ length: 12 });

  return (
    <div className="flex items-end gap-1 h-14">
      {bars.map((_, index) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={`w-1 rounded-full bg-slate-300/80 transition-all duration-500 ${
            isActive ? "animate-waveform" : "opacity-40"
          }`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
