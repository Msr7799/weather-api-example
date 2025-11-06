import { motion as Motion } from "framer-motion";

/**
 * Example component - Demo wrapper for BarLoader
 * @returns {JSX.Element} Example usage of BarLoader
 */
const Loader = () => {
  return (
    <div className="grid place-content-center px-4 py-24">
      <BarLoader />
    </div>
  );
};

/**
 * Animation variants for bar loader animation
 */
const variants = {
  initial: {
    scaleY: 0.5,
    opacity: 0,
  },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 1,
      ease: "circIn",
    },
  },
};

/**
 * BarLoader component - Animated loading indicator with vertical bars
 * @returns {JSX.Element} Animated bar loader
 */
const BarLoader = () => {
  return (
    <Motion.div
      transition={{
        staggerChildren: 0.2,
      }}
      initial="initial"
      animate="animate"
      className="flex gap-3"
    >
      <Motion.div variants={variants} className="h-24 w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-full" />
      <Motion.div variants={variants} className="h-24 w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-full" />
      <Motion.div variants={variants} className="h-24 w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-full" />
      <Motion.div variants={variants} className="h-24 w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-full" />
      <Motion.div variants={variants} className="h-24 w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-full" />
    </Motion.div>
  );
};

export default BarLoader;