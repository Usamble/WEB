import { useState } from 'react';
import { FaCopy, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '9QUVB18AoyP5wNNuY3jrHXeVeS3ek9ucNuM9MoDzpump';
const NETWORK = import.meta.env.VITE_NETWORK || 'mainnet-beta';
const EXPLORER_URL = NETWORK.includes('solana') 
  ? `https://solscan.io/token/${CONTRACT_ADDRESS}`
  : `https://etherscan.io/token/${CONTRACT_ADDRESS}`;

const ContractAddress = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      toast.success('Copied!', {
        style: {
          background: '#fff',
          color: '#3b82f6',
          border: '1px solid #3b82f6',
        },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <section className="py-16 px-4 relative bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-6 md:p-8 rounded-2xl shadow-xl border-2 border-blue-200 max-w-4xl mx-auto"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-100/30 rounded-full blur-2xl -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold text-gray-900 flex items-center gap-3"
              >
                <motion.span 
                  className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"
                  animate={{ height: [32, 40, 32] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Contract Address
              </motion.h3>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-xs font-semibold text-blue-600 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-full border border-blue-200 shadow-sm"
              >
                {NETWORK}
              </motion.span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm md:text-base font-mono text-gray-800 shadow-inner min-w-0">
                <span className="truncate flex-1">{CONTRACT_ADDRESS}</span>
                <button
                  onClick={copyToClipboard}
                  className="ml-3 p-2 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-700 transition-all duration-200 flex-shrink-0"
                  aria-label="Copy contract address"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-button text-white font-bold px-6 py-3 rounded-xl text-base md:text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                <FaExternalLinkAlt />
                View on Explorer
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContractAddress;
