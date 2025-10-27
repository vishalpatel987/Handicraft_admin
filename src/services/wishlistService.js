import apiService from './api';

const wishlistService = {
  getAllWishlists: async () => {
    try {
      const response = await apiService.getAllWishlists();
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlists:', error);
      throw error;
    }
  },
  getWishlistAnalytics: async () => {
    try {
      const response = await apiService.getWishlistAnalytics();
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist analytics:', error);
      throw error;
    }
  }
};

export default wishlistService;
