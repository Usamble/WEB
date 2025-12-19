import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 'FVcMs7GEVWmcs9beeaSxz6VhqJUGukEfTBsNGGfKpump';
const NETWORK = import.meta.env.VITE_NETWORK || 'mainnet-beta';

export const useTokenBalance = () => {
  const { isConnected, walletAddress } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setBalance(0);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        const connection = new Connection(
          NETWORK === 'mainnet-beta'
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com'
        );

        const tokenMint = new PublicKey(CONTRACT_ADDRESS);
        const walletPubkey = new PublicKey(walletAddress);

        // Get token accounts for this wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
          mint: tokenMint,
        });

        if (tokenAccounts.value.length > 0) {
          const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setBalance(balance || 0);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isConnected, walletAddress]);

  return { balance, isLoading, hasToken: balance > 0 };
};

