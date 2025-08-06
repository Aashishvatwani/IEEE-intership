import { motion } from 'framer-motion';
function Features() {
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
  return (
    <div> <section id="features" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Experience next-generation document management with cutting-edge blockchain technology.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                { 
                  icon: "🔒", 
                  title: "Military-Grade Encryption", 
                  desc: "Your documents are protected with AES-256 encryption before being stored on IPFS, ensuring maximum security.", 
                  color: "from-blue-500 to-blue-600",
                  borderColor: "border-blue-500/30"
                },
                { 
                  icon: "⛓️", 
                  title: "Blockchain Verification", 
                  desc: "Document integrity is immutably recorded on the blockchain, preventing tampering and ensuring authenticity.", 
                  color: "from-purple-500 to-purple-600",
                  borderColor: "border-purple-500/30"
                },
                { 
                  icon: "🌐", 
                  title: "Decentralized Storage", 
                  desc: "Files are distributed across IPFS nodes worldwide, ensuring permanent availability and resistance to censorship.", 
                  color: "from-cyan-500 to-cyan-600",
                  borderColor: "border-cyan-500/30"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={`group p-8 border ${feature.borderColor} rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm hover:from-gray-800/60 hover:to-gray-700/60 transition-all duration-500 hover:scale-105`}
                  variants={fadeInUp}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
</div>
  )
}
export default Features