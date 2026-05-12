import { motion } from 'motion/react';

export function Background() {
  return (
    <div className="atmosphere-bg">
      {/* Design blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }} />
      
      <div className="grid-pattern pointer-events-none" />
      <div className="stars" />
      
      <motion.div 
        className="fog pointer-events-none"
        animate={{
          x: [-1000, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {/* Subtle glowing particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-accent-blue/20 blur-xl pointer-events-none"
          style={{
            width: Math.random() * 200 + 50,
            height: Math.random() * 200 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}
