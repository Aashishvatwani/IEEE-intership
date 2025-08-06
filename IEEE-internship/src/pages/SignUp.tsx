import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SignUp, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

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

const SignUpPage: React.FC = () => {
  const { isSignedIn } = useUser();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.7, 0.3, 0.7],
        }}
        transition={{ duration: 8, repeat: Infinity }}
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
          {/* Left Side - SignUp Form */}
          <motion.div variants={itemVariants} className="flex justify-center lg:order-1">
            <motion.div
              className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl w-full max-w-md"
              whileHover={{
                boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.25)",
                borderColor: "rgba(147, 51, 234, 0.3)",
              }}
            >
              {/* Glowing Border Effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/20 via-pink-500/20 to-blue-500/20 blur-xl"
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
                    Join Us
                  </h2>
                  <p className="text-gray-300">
                    Start your Web3 journey today
                  </p>
                </motion.div>

                {/* Clerk Sign Up Component with Custom Styling */}
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="w-full">
                    <SignUp
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
                          formFieldInput: "bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20",
                          formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 border-0 shadow-lg hover:shadow-purple-500/25 transition-all duration-300",
                          footerActionLink: "text-purple-400 hover:text-purple-300",
                          identityPreviewText: "text-white",
                          identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
                        },
                      }}
                      redirectUrl="/home"
                      signInUrl="/login"
                    />
                  </div>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                  className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-60"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-60"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Welcome Content */}
          <motion.div variants={itemVariants} className="text-center lg:text-right space-y-8 lg:order-2">
            <motion.div
              className="inline-block"
              animate={{
                rotate: [0, -10, 10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <h1 className="text-6xl md:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                  Create
                </span>
                <br />
                <span className="text-white">Account</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:ml-auto lg:mr-0"
              variants={itemVariants}
            >
              Join thousands of users who trust our platform for secure, decentralized document management. 
              Experience the future of Web3 technology! ✨
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4 justify-center lg:justify-end"
              variants={itemVariants}
            >
              {['🛡️ Privacy First', '🚀 Innovation', '💎 Premium', '🌟 Trusted'].map((feature, index) => (
                <motion.div
                  key={index}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  <span className="text-white font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-1/4 right-10 w-20 h-20 border-2 border-purple-400/30 rounded-full"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-1/4 right-20 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-lg rotate-45"
              animate={{
                rotate: [45, 225, 45],
                y: [0, -10, 0],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/50 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      />
    </div>
  );
};

export default SignUpPage;
