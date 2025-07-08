// Authentication Utility Functions
// Include this file in your HTML pages: <script src="js/auth.js"></script>

class AuthManager {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000/api";
    this.TOKEN_KEY = "userToken";
    this.USER_DATA_KEY = "userData";
  }

  // Get current user token
  getToken() {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  // Get current user data
  getUserData() {
    const userData =
      localStorage.getItem(this.USER_DATA_KEY) ||
      sessionStorage.getItem(this.USER_DATA_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        this.logout();
        return null;
      }
    }
    return null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!(this.getToken() && this.getUserData());
  }

  // Check if user is admin
  isAdmin() {
    const userData = this.getUserData();
    return userData && userData.role === "admin";
  }

  // Store user data and token
  storeUserData(userData, token, remember = false) {
    if (remember) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    }
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  // Logout user
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_DATA_KEY);

    // Clear cart data as well
    localStorage.removeItem("cartItems");
    sessionStorage.removeItem("cartItems");

    // Redirect to login page
    window.location.href = "login.html";
  }

  // Make authenticated API requests
  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, config);

      // If token is invalid, logout user
      if (response.status === 401 || response.status === 403) {
        this.logout();
        return null;
      }

      return response;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await this.makeAuthenticatedRequest("/users/profile");
      if (response && response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await this.makeAuthenticatedRequest("/users/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (response && response.ok) {
        const data = await response.json();
        // Update stored user data
        const currentUser = this.getUserData();
        const updatedUser = { ...currentUser, ...data.user };
        this.storeUserData(
          updatedUser,
          this.getToken(),
          !!localStorage.getItem(this.TOKEN_KEY)
        );
        return data;
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
    return null;
  }

  // Get user's cart
  async getUserCart() {
    try {
      const response = await this.makeAuthenticatedRequest("/users/cart");
      if (response && response.ok) {
        const data = await response.json();
        return data.cart;
      }
    } catch (error) {
      console.error("Error fetching user cart:", error);
    }
    return [];
  }

  // Add item to cart
  async addToCart(book) {
    try {
      const response = await this.makeAuthenticatedRequest("/users/cart/add", {
        method: "POST",
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          price: book.price,
          description: book.description,
        }),
      });

      if (response && response.ok) {
        const data = await response.json();
        return data.cart;
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
    return null;
  }

  // Update cart item quantity
  async updateCartItem(title, quantity) {
    try {
      const response = await this.makeAuthenticatedRequest(
        "/users/cart/update",
        {
          method: "PUT",
          body: JSON.stringify({ title, quantity }),
        }
      );

      if (response && response.ok) {
        const data = await response.json();
        return data.cart;
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
    }
    return null;
  }

  // Remove item from cart
  async removeFromCart(title) {
    try {
      const response = await this.makeAuthenticatedRequest(
        "/users/cart/remove",
        {
          method: "DELETE",
          body: JSON.stringify({ title }),
        }
      );

      if (response && response.ok) {
        const data = await response.json();
        return data.cart;
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
    return null;
  }

  // Clear cart
  async clearCart() {
    try {
      const response = await this.makeAuthenticatedRequest(
        "/users/cart/clear",
        {
          method: "POST",
        }
      );

      if (response && response.ok) {
        return true;
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
    return false;
  }

  // Create order from cart
  async createOrderFromCart(orderData) {
    try {
      const response = await this.makeAuthenticatedRequest(
        "/orders/from-cart",
        {
          method: "POST",
          body: JSON.stringify(orderData),
        }
      );

      if (response && response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
    return null;
  }

  // Get user's orders
  async getUserOrders(page = 1, limit = 10) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/orders?page=${page}&limit=${limit}`
      );
      if (response && response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
    return null;
  }

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/orders/${orderId}`
      );
      if (response && response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    }
    return null;
  }

  // Update order status (for users to cancel orders)
  async updateOrderStatus(orderId, status, notes = "") {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/orders/${orderId}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status, notes }),
        }
      );

      if (response && response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
    return null;
  }

  // Initialize authentication state on page load
  init() {
    // Check if user is logged in and update UI accordingly
    const userData = this.getUserData();
    if (userData) {
      this.updateUIForLoggedInUser(userData);
    } else {
      this.updateUIForLoggedOutUser();
    }
  }

  // Update UI for logged in user
  updateUIForLoggedInUser(userData) {
    // Update navigation
    const loginLink = document.querySelector('a[href="login.html"]');
    const registerLink = document.querySelector('a[href="register.html"]');

    if (loginLink && registerLink) {
      const parent = loginLink.parentElement;
      parent.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700">Welcome, ${userData.name}</span>
                    <button onclick="authManager.logout()" class="px-4 py-2 text-red-600 hover:text-red-800 transition-colors">
                        Logout
                    </button>
                </div>
            `;
    }
  }

  // Update UI for logged out user
  updateUIForLoggedOutUser() {
    // Default UI is already set up for logged out users
  }

  // Redirect if not authenticated
  requireAuth(redirectTo = "login.html") {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  // Redirect if not admin
  requireAdmin(redirectTo = "courses.html") {
    if (!this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
}

// Create global instance
const authManager = new AuthManager();

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", function () {
  authManager.init();
});

// Utility functions for backward compatibility
function isLoggedIn() {
  return authManager.isLoggedIn();
}

function isAdmin() {
  return authManager.isAdmin();
}

function logout() {
  authManager.logout();
}

function getUserData() {
  return authManager.getUserData();
}

function getToken() {
  return authManager.getToken();
}
