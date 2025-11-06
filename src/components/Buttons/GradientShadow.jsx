import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// GradientShadow component with real glow
export const GradientShadow = ({ colors = ["#3b82f6", "#8b5cf6", "#ec4899"], children }) => {
  const glowRef = useRef(null);

  useEffect(() => {
    if (!glowRef.current) return;
    // Animate background gradient
    gsap.to(glowRef.current, {
      backgroundPosition: "200% 0%",
      duration: 6,
      ease: "linear",
      repeat: -1,
    });
  }, []);

  const gradient = `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`;

  return (
    <div className="group relative inline-block">
      {/* Glow div */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-2 -z-10 rounded-xl opacity-50 transition-all duration-300 group-hover:opacity-90"
        style={{
          backgroundImage: gradient,
          backgroundSize: "300% 300%",
          filter: "blur(40px)", // true glow
          transform: "scale(1.05)",
          willChange: "background-position, opacity",
        }}
      />
      {/* Button content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Example usage in Icons Gallery
export const IconsGallery = () => {
  const icons = [
    "/icons/icon1.png",
    "/icons/icon2.png",
    "/icons/icon3.png",
    "/icons/icon4.png",
  ];

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {icons.map((icon, index) => (
        <GradientShadow key={index} colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
          <button className="flex flex-col items-center justify-center bg-black rounded-xl p-4 text-white hover:scale-105 transition-transform duration-300">
            <img src={icon} alt={`icon-${index}`} className="w-16 h-16 mb-2" />
            <span className="text-sm">Icon {index + 1}</span>
          </button>
        </GradientShadow>
      ))}
    </div>
  );
};
