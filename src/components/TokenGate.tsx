import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaUnlock } from 'react-icons/fa';
import { useWallet } from '../hooks/useWallet';

interface TokenGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireToken?: boolean;
  tokenBalance?: number;
  minBalance?: number;
}

const TokenGate = ({ 
  children, 
  fallback, 
  requireToken = false,
  tokenBalance = 0,
  minBalance = 0 
}: TokenGateProps) => {
  const { isConnected } = useWallet();
  const hasToken = isConnected && tokenBalance >= minBalance;
  
  if (requireToken && !hasToken) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200"
      >
        {fallback || (
          <div className="text-center">
            <FaLock className="text-3xl text-yellow-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Token Holder Exclusive</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hold SNOWY tokens to unlock this feature
            </p>
            <p className="text-xs text-gray-500">
              Connect your wallet and hold at least {minBalance} SNOWY tokens
            </p>
          </div>
        )}
      </motion.div>
    );
  }
  
  return <>{children}</>;
};

export default TokenGate;

