
import { motion } from 'framer-motion';
function MainCard() {
    const slideInRight = {
      hidden: { opacity: 0, x: 50 },
      show: { opacity: 1, x: 0, transition: { duration: 0.8 } },
    };
    
  return (
    <div> <motion.div
              className="relative hidden lg:block"
              initial="hidden"
              animate="show"
              variants={slideInRight}
            >
              <div className="relative">
                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="ml-auto text-gray-400 text-sm">secure-docs.web3</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">📄</div>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-300">contract.pdf</div>
                        <div className="text-xs text-gray-400">Encrypted • Verified ✓</div>
                      </div>
                      <div className="text-green-400 text-sm">✓ Uploaded</div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">🖼️</div>
                      <div className="flex-1">
                        <div className="font-semibold text-purple-300">identity.jpg</div>
                        <div className="text-xs text-gray-400">Encrypted • Verified ✓</div>
                      </div>
                      <div className="text-green-400 text-sm">✓ Uploaded</div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-lg">
                      <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">📊</div>
                      <div className="flex-1">
                        <div className="font-semibold text-cyan-300">report.xlsx</div>
                        <div className="text-xs text-gray-400">Encrypted • Verified ✓</div>
                      </div>
                      <div className="text-yellow-400 text-sm animate-pulse">⏳ Uploading...</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-300 mb-2">IPFS Hash:</div>
                    <div className="font-mono text-xs text-blue-400 break-all">QmX7Zx9Kx8Y9Z2A3B4C5D6E7F8G9H...</div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-16 h-16 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl flex items-center justify-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🔒
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  ⛓️
                </motion.div>
              </div>
            </motion.div>
            </div>
  )
}
export default MainCard