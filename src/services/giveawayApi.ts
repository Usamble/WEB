import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Enter giveaway
export const enterGiveaway = async (entryMethod: string, referralCode?: string, walletAddress?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/giveaway/enter`,
      {
        entryMethod,
        referralCode,
        walletAddress,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Enter giveaway error:', error);
    throw new Error(error.response?.data?.error || 'Failed to enter giveaway');
  }
};

// Get giveaway stats
export const getGiveawayStats = async (walletAddress?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/giveaway/stats`, {
      params: { walletAddress },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get giveaway stats error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get giveaway stats');
  }
};

// Get referral code
export const getReferralCode = async (walletAddress?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/giveaway/referral-code`, {
      params: { walletAddress },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get referral code error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get referral code');
  }
};

