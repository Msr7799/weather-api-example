import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "../../lib/utils";
import { applyTheme, getCurrentTheme } from "../../styles/colors";

export function AnimatedThemeToggler({ className, duration = 400, setSelected, ...props }) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Initialize with current theme
    const updateTheme = () => {
      const currentTheme = getCurrentTheme();
      setIsDark(currentTheme === "dark");
    };

    updateTheme();

    // Observe changes to the body class list so the toggler stays in sync
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDark ? "light" : "dark";

    const transition = document.startViewTransition
      ? document.startViewTransition(() => {
          flushSync(() => {
            // Apply theme using colors.js (saves to localStorage automatically)
            applyTheme(newTheme);
            setIsDark(newTheme === "dark");

            // If parent passed a setter (App passes setSelected), call it
            if (typeof setSelected === "function") {
              try {
                setSelected(newTheme);
              } catch {
                /* ignore */
              }
            }
          });
        })
      : { ready: Promise.resolve() };

    await transition.ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    // Animate the documentElement for a circular reveal effect
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [isDark, duration, setSelected]);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h4 className="text-md font-semibold">
        Mode
      </h4> 
      
      <button 
        ref={buttonRef} 
        onClick={toggleTheme} 
        className={cn(className)} 
        {...props}
      >
        {/* using cloudy-day.svg as icon for light theme and using cloudy-night.svg as icon for dark theme */}
        <img
          src={isDark ? "/cloudy-night.svg" : "/cloudy-day.svg"}
          alt=""
          className="relative bottom-5 h-20 w-20"
        />
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  );
}