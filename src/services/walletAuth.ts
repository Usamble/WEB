import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const getWalletChallenge = async () => {
  const res = await axios.get(`${API_BASE_URL}/auth/wallet-challenge`, { withCredentials: true });
  return res.data as { sessionId: string; nonce: string; message: string };
};

export const verifyWalletSignature = async (walletAddress: string, signatureBase64: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/auth/wallet-verify`,
    { walletAddress, signature: signatureBase64 },
    { withCredentials: true }
  );
  return res.data;
};
