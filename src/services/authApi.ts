import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const register = async (username: string, password: string, walletAddress?: string, nickname?: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/auth/register`,
    { username, password, walletAddress, nickname },
    { withCredentials: true }
  );
  return res.data;
};

export const login = async (username: string, password: string, walletAddress?: string) => {
  const res = await axios.post(
    `${API_BASE_URL}/auth/login`,
    { username, password, walletAddress },
    { withCredentials: true }
  );
  return res.data;
};
