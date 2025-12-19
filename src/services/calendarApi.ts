import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get calendar status
export const getCalendarStatus = async (walletAddress?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/calendar/status`, {
      params: { walletAddress },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get calendar status error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get calendar status');
  }
};

// Unlock calendar day
export const unlockCalendarDay = async (day: number, walletAddress?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/calendar/unlock`,
      {
        day,
        walletAddress,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Unlock calendar error:', error);
    throw new Error(error.response?.data?.error || 'Failed to unlock calendar day');
  }
};

// Claim calendar reward
export const claimCalendarReward = async (day: number, walletAddress?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/calendar/claim`,
      {
        day,
        walletAddress,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Claim calendar error:', error);
    throw new Error(error.response?.data?.error || 'Failed to claim reward');
  }
};

