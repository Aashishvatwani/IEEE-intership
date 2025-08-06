import { motion } from 'framer-motion';
function HowitWorks() {
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
    <div>       <section className="px-6 py-20 bg-gradient-to-b from-gray-900/50 to-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">How It Works</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Simple, secure, and seamless document management in four easy steps.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                { step: 1, title: "Upload", desc: "Drag & drop or capture documents directly in your browser.", color: "bg-gradient-to-r from-blue-500 to-blue-600", icon: "📁" },
                { step: 2, title: "Encrypt", desc: "Automatic encryption with your personal security key.", color: "bg-gradient-to-r from-purple-500 to-purple-600", icon: "🔐" },
                { step: 3, title: "Store", desc: "Distributed storage across IPFS nodes worldwide.", color: "bg-gradient-to-r from-cyan-500 to-cyan-600", icon: "🌐" },
                { step: 4, title: "Verify", desc: "Blockchain verification ensures document authenticity.", color: "bg-gradient-to-r from-green-500 to-green-600", icon: "✅" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="relative text-center group"
                  variants={fadeInUp}
                >
                  <div className={`w-20 h-20 ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 right-[-2.5rem] w-12 h-0.5 bg-gradient-to-r from-gray-600 to-transparent"></div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        </div>
  )
}
export default HowitWorks