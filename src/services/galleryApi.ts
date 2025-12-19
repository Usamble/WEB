import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get gallery images
export const getGallery = async (page: number = 1, style?: string, limit: number = 20) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/snowy/gallery/list`, {
      params: { page, style, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Get gallery error:', error);
    throw new Error(error.response?.data?.error || 'Failed to get gallery');
  }
};

