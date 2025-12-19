import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const saveProfile = async (nickname: string, walletAddress: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/profile`,
    { nickname, walletAddress },
    { withCredentials: true }
  );
  return response.data;
};
