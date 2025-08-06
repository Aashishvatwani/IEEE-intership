import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

// Animated Background Particles Component
const AnimatedParticles: React.FC = () => {
  const particles = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          animate={{
            x: [0, Math.random() * 1000, 0],
            y: [0, Math.random() * 800, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
          }}
        />
      ))}
    </div>
  );
};

// Floating Geometric Shapes
const FloatingShapes: React.FC = () => {
  const shapes = [
    { type: 'circle', size: 60, color: 'cyan' },
    { type: 'square', size: 40, color: 'purple' },
    { type: 'triangle', size: 50, color: 'blue' },
    { type: 'hexagon', size: 45, color: 'indigo' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute opacity-10`}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 15 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: 20 + index * 25 + '%',
            top: 20 + index * 15 + '%',
            width: shape.size,
            height: shape.size,
          }}
        >
          {shape.type === 'circle' && (
            <div className={`w-full h-full rounded-full bg-${shape.color}-400/20 border-2 border-${shape.color}-400/40`} />
          )}
          {shape.type === 'square' && (
            <div className={`w-full h-full bg-${shape.color}-400/20 border-2 border-${shape.color}-400/40 rotate-45`} />
          )}
          {shape.type === 'triangle' && (
            <div className={`w-0 h-0 border-l-[${shape.size/2}px] border-r-[${shape.size/2}px] border-b-[${shape.size}px] border-l-transparent border-r-transparent border-b-${shape.color}-400/20`} />
          )}
          {shape.type === 'hexagon' && (
            <div className={`w-full h-full bg-${shape.color}-400/20 border-2 border-${shape.color}-400/40`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// 3D Interactive Card Component
const Interactive3DCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), {
    stiffness: 400,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), {
    stiffness: 400,
    damping: 30,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative
      mt-1.5
      "
    >
      {children}
    </motion.div>
  );
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
    },
  },
};

const Login: React.FC = () => {
  const { isSignedIn } = useUser();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedParticles />
      <FloatingShapes />
      
      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Main Content */}
      <motion.div
        ref={ref}
        className="relative z-10 flex items-center justify-center min-h-screen p-4"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <motion.div variants={itemVariants} className="text-center lg:text-left space-y-8">
            <motion.div
              className="inline-block"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <h1 className="text-6xl md:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Welcome
                </span>
                <br />
                <span className="text-white">Back!</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-gray-300 leading-relaxed max-w-2xl"
              variants={itemVariants}
            >
              Enter the future of document management with our revolutionary Web3 platform. 
              Secure, decentralized, and absolutely mind-blowing! 🚀
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
              variants={itemVariants}
            >
              {['🔐 Secure', '🌐 Decentralized', '⚡ Lightning Fast', '🎨 Beautiful'].map((feature, index) => (
                <motion.div
                  key={index}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                >
                  <span className="text-white font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <Interactive3DCard>
              <motion.div
                className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
                whileHover={{
                  boxShadow: "0 25px 50px -12px rgba(0, 255, 255, 0.25)",
                  borderColor: "rgba(0, 255, 255, 0.3)",
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Glowing Border Effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 blur-xl"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Sign In
                    </h2>
                    <p className="text-gray-300">
                      Continue your journey in Web3
                    </p>
                  </motion.div>

                  {/* Clerk Sign In Component with Custom Styling */}
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="w-full max-w-sm">
                      <SignIn
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "bg-transparent shadow-none border-0",
                            headerTitle: "text-white text-2xl font-bold",
                            headerSubtitle: "text-gray-300",
                            socialButtonsBlockButton: "bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300",
                            socialButtonsBlockButtonText: "text-white font-medium",
                            dividerLine: "bg-white/20",
                            dividerText: "text-gray-300",
                            formFieldLabel: "text-white font-medium",
                            formFieldInput: "bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20",
                            formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300",
                            footerActionLink: "text-cyan-400 hover:text-cyan-300",
                            identityPreviewText: "text-white",
                            identityPreviewEditButton: "text-cyan-400 hover:text-cyan-300",
                          },
                        }}
                        redirectUrl="/home"
                        signUpUrl="/sign-up"
                      />
                    </div>
                  </motion.div>

                  {/* Decorative Elements */}
                  <motion.div
                    className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-60"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-60"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
              </motion.div>
            </Interactive3DCard>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900/50 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      />
    </div>
  );
};

export default Login;
