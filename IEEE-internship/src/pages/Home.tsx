import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// --- ICONS ---
// Using functional components for SVG icons for better reusability and clarity.

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 0118-8.944c0-2.236-1.024-4.274-2.618-5.618z" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 4.5v.01m0 16.99v.01M21.945 11H19a2 2 0 00-2 2v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1a2 2 0 00-2-2H2.055M12 18.5v-13" />
  </svg>
);

// --- ANIMATION VARIANTS ---
// Centralized animation variants for consistency across components.

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

// --- HERO SECTION VISUAL ---
// A dedicated component for the complex SVG graphic in the hero section.
const HeroVisual: React.FC = () => (
    <motion.div 
        className="relative w-full h-full flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 1, delay: 0.5, ease: 'easeOut' } }}
    >
        <div className="absolute w-full h-full bg-purple-500/10 rounded-full blur-3xl"></div>
        <svg viewBox="0 0 400 400" className="w-full h-auto max-w-lg relative z-10">
            {/* Abstract Shapes and Grids */}
            <motion.path
                d="M 100 100 L 300 100 L 300 300 L 100 300 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, transition: { duration: 2, delay: 1 } }}
            />
            <motion.circle cx="200" cy="200" r="150" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
                <motion.circle cx="200" cy="200" r="120" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeDasharray="4 8" strokeWidth="1.5" />
                <motion.circle cx="200" cy="200" r="90" fill="none" stroke="rgba(34, 211, 238, 0.3)" strokeDasharray="10 5" strokeWidth="1" />
            </motion.g>
            {/* Central Glowing Orb */}
            <defs>
                <radialGradient id="glow">
                    <stop offset="0%" stopColor="rgba(167, 139, 250, 0.8)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                </radialGradient>
            </defs>
            <motion.circle 
                cx="200" 
                cy="200" 
                r="40" 
                fill="url(#glow)" 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle cx="200" cy="200" r="30" fill="rgba(255,255,255,0.9)" />
        </svg>
    </motion.div>
);


// --- HERO SECTION ---
const HeroSection: React.FC = () => {
  // Mock navigation for demonstration purposes.
  const handleNavigate = (path: string) => {
    console.log(`Navigating to ${path}`);
    // In a real app, this would be handled by a router.
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <motion.div
          className="text-center lg:text-left"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-4">
              🚀 Next-Gen Document Management
            </span>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Web3
            </span>
            <br />
            <span className="text-white">Document Lab</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Revolutionize document storage with <strong>blockchain technology</strong>. Secure, verify, and manage your important files with military-grade encryption and IPFS decentralization.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={() => handleNavigate('/upload')}
                className="group w-full sm:w-auto relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>📁 Upload Documents</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex px-8 py-4 border-2 border-gray-600 rounded-xl font-semibold text-lg hover:border-gray-400 transition-all duration-300 hover:bg-gray-800/50 backdrop-blur-sm items-center gap-2 justify-center"
              >
                🎯 Explore Features
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-800"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">256-bit</div>
              <div className="text-sm text-gray-400">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">99.9%</div>
              <div className="text-sm text-gray-400">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">Zero</div>
              <div className="text-sm text-gray-400">Downtime</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Visual */}
        <div className="hidden lg:flex items-center justify-center h-full">
            <HeroVisual />
        </div>
      </div>
    </section>
  );
};

// --- FEATURES SECTION ---
// Interface for FeatureCard props for type safety
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, children, index }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    React.useEffect(() => {
        if (inView) {
            controls.start('show');
        }
    }, [controls, inView]);

    return (
        <motion.div
            ref={ref}
            className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl text-center flex flex-col items-center"
            variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: index * 0.2 } }
            }}
            initial="hidden"
            animate={controls}
        >
            <div className="mb-6">{icon}</div>
            <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{children}</p>
        </motion.div>
    );
};

const FeaturesSection: React.FC = () => (
  <section id="features" className="py-24 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer} className="text-center mb-16">
        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-4">Core Features</motion.h2>
        <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-3xl mx-auto">
          Built on a foundation of security, decentralization, and user control.
        </motion.p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard icon={<ShieldIcon />} title="Unbreakable Security" index={0}>
          Your files are encrypted with AES-256 before they ever leave your device. Only you hold the key.
        </FeatureCard>
        <FeatureCard icon={<GlobeIcon />} title="IPFS Decentralization" index={1}>
          Documents are stored on the InterPlanetary File System (IPFS), ensuring they are always available and censorship-resistant.
        </FeatureCard>
        <FeatureCard icon={<UploadIcon />} title="Verifiable History" index={2}>
          Every version of your document is hashed on the blockchain, creating an immutable and auditable trail of changes.
        </FeatureCard>
      </div>
    </div>
  </section>
);


// --- HOW IT WORKS SECTION ---
const HowItWorksSection: React.FC = () => (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={staggerContainer} className="text-center mb-16">
                <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-4">Simple & Secure Process</motion.h2>
                <motion.p variants={fadeInUp} className="text-lg text-gray-400 max-w-3xl mx-auto">
                    Three steps to secure your digital assets on the decentralized web.
                </motion.p>
            </motion.div>

            <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-8">
                {/* Dashed line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-gray-700 -translate-y-1/2"></div>
                
                {/* Step 1 */}
                <motion.div initial={{opacity: 0, scale: 0.8}} whileInView={{opacity: 1, scale: 1}} viewport={{ once: true }} transition={{duration: 0.5, delay: 0.2}} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 flex items-center justify-center bg-blue-900/50 border-2 border-blue-500 rounded-full text-blue-300 text-3xl font-bold mb-4">1</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Upload & Encrypt</h3>
                    <p className="text-gray-400 max-w-xs">Select your document. It's instantly encrypted in your browser.</p>
                </motion.div>

                {/* Step 2 */}
                <motion.div initial={{opacity: 0, scale: 0.8}} whileInView={{opacity: 1, scale: 1}} viewport={{ once: true }} transition={{duration: 0.5, delay: 0.4}} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 flex items-center justify-center bg-purple-900/50 border-2 border-purple-500 rounded-full text-purple-300 text-3xl font-bold mb-4">2</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Distribute to IPFS</h3>
                    <p className="text-gray-400 max-w-xs">Your encrypted file is uploaded to the decentralized IPFS network.</p>
                </motion.div>
                
                {/* Step 3 */}
                <motion.div initial={{opacity: 0, scale: 0.8}} whileInView={{opacity: 1, scale: 1}} viewport={{ once: true }} transition={{duration: 0.5, delay: 0.6}} className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 flex items-center justify-center bg-cyan-900/50 border-2 border-cyan-500 rounded-full text-cyan-300 text-3xl font-bold mb-4">3</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Record on-chain</h3>
                    <p className="text-gray-400 max-w-xs">A unique hash (CID) of your file is recorded on the blockchain as proof.</p>
                </motion.div>
            </div>
        </div>
    </section>
);


// --- CTA SECTION ---
const CTASection: React.FC = () => (
  <section className="py-24 px-4 sm:px-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} variants={staggerContainer}>
        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            Take Control of Your Data
          </span>
        </motion.h2>
        <motion.p variants={fadeInUp} className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Ready to experience the future of document management? Secure your first document on the decentralized web today. No sign-up required to get started.
        </motion.p>
        <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-xl transition-all duration-300 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-2xl">
            Get Started Now
          </button>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

// --- FOOTER ---
const Footer: React.FC = () => (
    <footer className="border-t border-gray-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Web3 Document Lab. All Rights Reserved.</p>
            <p className="text-sm mt-2">A demonstration of secure, decentralized file storage.</p>
        </div>
    </footer>
);


// --- MAIN APP COMPONENT ---
// This component assembles the entire page.
const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_25%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.1),transparent_25%)] pointer-events-none" />
      
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
