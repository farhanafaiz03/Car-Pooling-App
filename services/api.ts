import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Function to get the API base URL dynamically
const getApiBaseUrl = () => {
  // Check if we're in development mode
  const isDevelopment = __DEV__;
  
  if (!isDevelopment) {
    // Production URL - replace with your production API URL
    return 'https://your-production-api.com/api';
  }
  
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }
  
  // For mobile development - get the development server IP
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  
  if (debuggerHost) {
    return `http://${debuggerHost}:8000/api`;
  }
  
  // Fallbacks for different platforms
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'; // Android emulator localhost
  }
  
  return 'http://localhost:8000/api'; // iOS simulator
};

const API_BASE_URL = getApiBaseUrl();

// Debug log to see what URL is being used
console.log('🌐 API Base URL:', API_BASE_URL);

// Token management
export const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('access_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('access_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }
};

// API request helper with better error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await tokenManager.getToken();
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    console.log(`📡 API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      console.error('❌ API Error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ API Success:', endpoint);
    return data;
  } catch (error) {
    console.error('🚨 API Request Failed:', error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  async register(userData: {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    is_driver?: boolean;
    is_rider?: boolean;
    preferences?: any;
    password: string;
  }) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.access_token) {
      await tokenManager.setToken(response.access_token);
    }
    
    return response;
  },

  async login(email: string, password: string) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      await tokenManager.setToken(response.access_token);
    }
    
    return response;
  },

  async sendOTP(email: string) {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOTP(email: string, otp: string) {
    const response = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    
    if (response.access_token) {
      await tokenManager.setToken(response.access_token);
    }
    
    return response;
  },

  async getCurrentUser() {
    return apiRequest('/auth/me');
  },

  async logout() {
    await tokenManager.removeToken();
  }
};

// Users API
export const usersAPI = {
  async getProfile() {
    return apiRequest('/users/profile');
  },

  async updateProfile(userData: {
    name?: string;
    phone?: string;
    bio?: string;
    is_driver?: boolean;
    is_rider?: boolean;
    preferences?: any;
    photo_url?: string;
  }) {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async getPreferenceOptions() {
    return apiRequest('/users/preferences/options');
  },

  async getSchedule() {
    return apiRequest('/users/schedule');
  },

  async createSchedule(scheduleData: {
    day_of_week: number;
    start_time?: string;
    end_time?: string;
  }) {
    return apiRequest('/users/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }
};

// Rides API
export const ridesAPI = {
  async searchRides(limit: number = 50) {
    return apiRequest(`/rides/?limit=${limit}`);
  },

  async createRide(rideData: {
    car_id: number;
    start_location_id: number;
    end_location_id: number;
    start_time: string;
    seats_available: number;
  }) {
    return apiRequest('/rides/', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  },

  async getMyRides() {
    return apiRequest('/rides/my-rides');
  },

  async getRideDetails(rideId: number) {
    return apiRequest(`/rides/${rideId}`);
  },

  async updateRide(rideId: number, updateData: {
    start_time?: string;
    seats_available?: number;
    status?: string;
  }) {
    return apiRequest(`/rides/${rideId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  async requestRide(rideId: number, message?: string) {
    return apiRequest('/rides/request', {
      method: 'POST',
      body: JSON.stringify({ ride_id: rideId, message }),
    });
  },

  async getRideRequests(rideId: number) {
    return apiRequest(`/rides/${rideId}/requests`);
  },

  async updateRideRequest(requestId: number, status: 'accepted' | 'rejected') {
    return apiRequest(`/rides/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getMyRideRequests() {
    return apiRequest('/rides/my-requests');
  },

  async getRideHistory() {
    return apiRequest('/rides/history');
  },

  async createRideHistory(rideId: number, role: 'driver' | 'rider') {
    return apiRequest('/rides/history', {
      method: 'POST',
      body: JSON.stringify({ ride_id: rideId, role }),
    });
  }
};

// Cars API
export const carsAPI = {
  async getCars() {
    return apiRequest('/cars/');
  },

  async createCar(carData: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    license_plate: string;
    seats: number;
    photo_url?: string;
  }) {
    return apiRequest('/cars/', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },

  async updateCar(carId: number, carData: {
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    license_plate?: string;
    seats?: number;
    photo_url?: string;
  }) {
    return apiRequest(`/cars/${carId}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    });
  },

  async deleteCar(carId: number) {
    return apiRequest(`/cars/${carId}`, {
      method: 'DELETE',
    });
  }
};

// Messages API
export const messagesAPI = {
  async sendMessage(receiverId: number, content: string, rideId?: number) {
    return apiRequest('/messages/', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
        ride_id: rideId,
      }),
    });
  },

  async getConversations() {
    return apiRequest('/messages/conversations');
  },

  async getConversationWithUser(userId: number) {
    return apiRequest(`/messages/${userId}`);
  }
};

// Locations API
export const locationsAPI = {
  async getLocations() {
    return apiRequest('/locations/');
  },

  async createLocation(locationData: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) {
    return apiRequest('/locations/', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }
};

// Health check
export const healthAPI = {
  async checkHealth() {
    return apiRequest('/health');
  }
};

// AI Chat API
export const aiChatAPI = {
  async sendMessage(message: string, conversationHistory?: any[], context: string = 'rideshare') {
    return apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        context
      }),
    });
  },

  async getStatus() {
    return apiRequest('/ai/chat/status');
  },

  async saveConversation(userMessage: string, aiResponse: string) {
    return apiRequest('/ai/chat/save-conversation', {
      method: 'POST',
      body: JSON.stringify({
        user_message: userMessage,
        ai_response: aiResponse,
      }),
    });
  }
};
// Export a test function to verify connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    const data = await response.json();
    console.log('🔗 Backend connection test:', data);
    return data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    throw error;
  }
};