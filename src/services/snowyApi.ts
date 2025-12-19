import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get session ID from cookie or generate
const getSessionId = (): string => {
  // Session ID is set by backend via cookie
  // For API calls, we'll let the backend handle it via cookies
  return '';
};

// Save Snowy generation
export const saveSnowyGeneration = async (
  imageUrl: string,
  style: string,
  walletAddress?: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/snowy/save`,
      {
        imageUrl,
        style,
        walletAddress,
      },
      {
        withCredentials: true, // Include cookies for session
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Save Snowy error:', error);
    throw new Error(error.response?.data?.error || 'Failed to save Snowy');
  }
};

// Get user's Snowys
export const getMySnowys = async (walletAddress?: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/snowy/my-snowys`, {
      params: { walletAddress },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get Snowys error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get Snowys');
  }
};

// Get Snowy by ID
export const getSnowyById = async (snowyId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/snowy/${snowyId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get Snowy error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get Snowy');
  }
};

