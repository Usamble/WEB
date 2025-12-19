import { useState } from 'react';
import toast from 'react-hot-toast';
import { getWalletChallenge, verifyWalletSignature } from '../services/walletAuth';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const connectWallet = async () => {
    try {
      // Check if Phantom wallet is installed
      if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
        const provider = (window as any).solana;
        const response = await provider.connect();
        const pubkey = response.publicKey.toString();
        // Challenge/verify to avoid scammy feel
        setIsAuthenticating(true);
        try {
          const challenge = await getWalletChallenge();
          const encodedMsg = new TextEncoder().encode(challenge.message);
          const signed = await provider.signMessage(encodedMsg, 'utf8');
          const signatureBase64 = btoa(String.fromCharCode(...signed.signature));
          await verifyWalletSignature(pubkey, signatureBase64);
          setIsConnected(true);
          setWalletAddress(pubkey);
          toast.success('Wallet verified & connected!');
        } catch (authError: any) {
          console.warn('Wallet auth failed, continuing with basic connect:', authError);
          setIsConnected(true);
          setWalletAddress(pubkey);
          toast.error('Signature/auth failed. Connected without verification.');
        }
      } else {
        toast.error('Please install Phantom wallet');
        // Open wallet download page
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        toast.error('Wallet connection rejected');
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    toast.success('Wallet disconnected');
  };

  return {
    isConnected,
    walletAddress,
    isAuthenticating,
    connectWallet,
    disconnectWallet,
  };
};

