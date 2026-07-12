// API utility class for making HTTP requests

class API {
    /**
     * Make a GET request to the specified endpoint
     * @param {string} endpoint - The API endpoint to request
     * @param {Object} params - Optional query parameters
     * @returns {Promise<any>} - Promise resolving to the response data
     */
    static async get(endpoint, params = {}) {
        try {
            // Build URL with query parameters if provided
            const url = new URL(endpoint, window.location.origin);
            
            // Add query parameters if any
            if (Object.keys(params).length > 0) {
                Object.keys(params).forEach(key => {
                    url.searchParams.append(key, params[key]);
                });
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }
    
    /**
     * Make a POST request to the specified endpoint
     * @param {string} endpoint - The API endpoint to request
     * @param {Object} data - The data to send in the request body
     * @returns {Promise<any>} - Promise resolving to the response data
     */
    static async post(endpoint, data = {}) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }
}

// Initialize API when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('API utility initialized');
});