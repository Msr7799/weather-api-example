import { useRef, useState } from "react";
import { gsap } from "gsap";

export const IconsPreviewButton = ({ icons, children }) => {
  const previewRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const handleMouseEnter = () => {
    setVisible(true);
    if (previewRef.current) {
      gsap.fromTo(
        previewRef.current.children,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: "power2.out" }
      );
    }
  };

  const handleMouseLeave = () => {
    if (previewRef.current) {
      gsap.to(previewRef.current.children, {
        y: 10,
        opacity: 0,
        stagger: 0.03,
        duration: 0.2,
        ease: "power2.in",
      });
    }
    setTimeout(() => setVisible(false), 200); // إخفاء الديف بعد الأنيميشن
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="px-6 py-3 rounded-xl bg-black text-white relative z-10"
      >
        {children}
      </button>

      {visible && (
        <div
          ref={previewRef}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-3 bg-white rounded-xl shadow-lg flex gap-2 z-20"
        >
          {icons.slice(0, 5).map((icon) => (
            <img
              key={icon}
              src={`/animated_icons/production/fill/all/${icon}.svg`}
              alt={icon}
              className="w-10 h-10"
            />
          ))}
        </div>
      )}
    </div>
  );
};
