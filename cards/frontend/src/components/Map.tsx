import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { buildPath } from './Path';
import { storeToken, retrieveToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function doLogout(event:any) : void
{
event.preventDefault();
localStorage.removeItem("user_data")
window.location.href = '/';
};

// Extend Window interface for Leaflet
declare global {
  interface Window {
    L: typeof L;
  }
}

// Type definitions
interface Location {
  lat: number;
  lng: number;
}

interface WaterFountain {
  _id: string;
  name: string;
  description: string;
  xCoord: number;
  yCoord: number;
  filterLevel: number;
  rating: number;
}

interface FormData {
  name: string;
  description: string;
  filterLevel: number;
  rating: number;
}

interface Status {
  message: string;
  type: 'success' | 'error' | '';
}

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userLocation] = useState<Location | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    filterLevel: 1,
    rating: 5
  });
  const [status, setStatus] = useState<Status>({ message: '', type: '' });
  const [loading, setLoading] = useState<boolean>(false);

  // Add this helper function to show status messages
  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Check if Leaflet is already loaded
        if (window.L) {
          setLeafletLoaded(true);
          return;
        }

        // Load Leaflet CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        cssLink.integrity = 'sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==';
        cssLink.crossOrigin = 'anonymous';
        document.head.appendChild(cssLink);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.integrity = 'sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==';
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          setTimeout(() => {
            if (window.L) {
              setLeafletLoaded(true);
            } else {
              showStatus('Failed to load map library', 'error');
            }
          }, 100);
        };
        
        script.onerror = () => {
          showStatus('Failed to load map library', 'error');
        };
        
        document.head.appendChild(script);

        // Add custom marker styles
        const style = document.createElement('style');
        style.textContent = `
          .user-location-marker {
            background: none !important;
            border: none !important;
            font-size: 24px;
          }
          .leaflet-control-zoom {
            border-radius: 8px !important;
          }
          .leaflet-control-attribution {
            border-radius: 8px !important;
            font-size: 11px !important;
          }
          .leaflet-tile-container {
            border-radius: 20px;
          }
          .leaflet-layer {
            border-radius: 20px;
          }
        `;
        document.head.appendChild(style);

      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        showStatus('Failed to load map library', 'error');
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (leafletLoaded && mapRef.current && !map && window.L) {
      try {
        // Clear any existing content
        mapRef.current.innerHTML = '';
        
        // Initialize map with proper configuration
        const mapInstance = window.L.map(mapRef.current, {
          center: [28.6023, -81.2005],
          zoom: 17,
          zoomControl: true,
          attributionControl: true
        });
        
        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        // Add click event to map
        mapInstance.on('click', (e: L.LeafletMouseEvent) => {
          setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
          setShowModal(true);
        });

        // Force map to resize properly
        setTimeout(() => {
          mapInstance.invalidateSize();
        }, 100);


        setMap(mapInstance);
        showStatus('Map loaded successfully!', 'success');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        showStatus('Failed to initialize map', 'error');
      }
    }
  }, [leafletLoaded, map]);

  const getJwtToken = (): string => {
    const tokenData = retrieveToken();
    
    if (!tokenData) {
      console.log('No token data found');
      return '';
    }
    
    // Handle both cases: token as string or token as object with accessToken property
    if (typeof tokenData === 'string') {
      console.log('Token is string format');
      return tokenData;
    } else if (tokenData && typeof tokenData === 'object' && 'accessToken' in tokenData) {
      console.log('Token is object format with accessToken');
      return tokenData.accessToken;
    }
    
    console.log('Token format not recognized:', typeof tokenData);
    return '';
  };

  const setJwtToken = (token: string): void => {
    storeToken({ accessToken: token });
  };



  interface ApiResponse {
    error?: string;
    success?: string;
    message?: string;
    jwtToken?: string;
    fountains?: WaterFountain[];
    found?: WaterFountain[];
  }

  interface DecodedToken {
    exp?: number;
    [key: string]: any;
  }

  

 
  const addWaterFountain = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedLocation) {
        throw new Error('Please select a location on the map');
      }

      // Validate form data
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Fountain name is required');
      }

      if (!formData.description || formData.description.trim() === '') {
        throw new Error('Fountain description is required');
      }

      if (formData.filterLevel < 1 || formData.filterLevel > 3) {
        throw new Error('Filter level must be between 1 and 3');
      }

      if (formData.rating < 1 || formData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const token = getJwtToken();
      if (!token) {
        showStatus('Please log in to add fountains', 'error');
        setLoading(false);
        return;
      }

      // Verify token is valid before sending
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        
        // Check if token is expired
        if (decodedToken.exp && decodedToken.exp < Date.now() / 1000) {
          showStatus('Session expired. Please log in again.', 'error');
          setLoading(false);
          return;
        }
      } catch (tokenError) {
        showStatus('Invalid session. Please log in again.', 'error');
        setLoading(false);
        return;
      }

      const fountainData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        filterLevel: Number(formData.filterLevel),
        rating: Number(formData.rating),
        xCoord: Number(selectedLocation.lng),
        yCoord: Number(selectedLocation.lat),
        jwtToken: token
      };

      const response = await axios.post<ApiResponse>(buildPath('api/addWaterFountain'), fountainData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const result: ApiResponse = response.data;
      
      // Handle JWT token refresh
      if (result.jwtToken) {
        setJwtToken(result.jwtToken);
      }

      // Check for errors from backend
      if (result.error) {
        if (result.error.toLowerCase().includes('jwt') || 
            result.error.toLowerCase().includes('token') || 
            result.error.toLowerCase().includes('expired')) {
          showStatus('Session expired. Please log in again.', 'error');
          setLoading(false);
          return;
        }
        throw new Error(result.error);
      }
      
      // Check for success indicators
      if (result.success || result.message) {
        const successMessage = result.success || result.message || 'Fountain added successfully!';
        showStatus(successMessage, 'success');
        
        // Add marker to map immediately
        if (selectedLocation && map && window.L) {
          const fountainIcon = (window.L as any).divIcon({
            html: '💧',
            iconSize: [25, 25],
            className: 'fountain-marker'
          });
          
          (window.L as any).marker([selectedLocation.lat, selectedLocation.lng], { 
            icon: fountainIcon 
          })
            .addTo(map)
            .bindPopup(`
              <div>
                <h3>${formData.name}</h3>
                <p>${formData.description}</p>
                <p>Filter Level: ${formData.filterLevel}/3</p>
                <p>Rating: ${formData.rating}/5 💧</p>
                <p><small>Just added!</small></p>
              </div>
            `);
        }

        // Reset form and close modal
        setFormData({ name: '', description: '', filterLevel: 1, rating: 5 });
        setShowModal(false);
        setSelectedLocation(null);
        
      } else {
        // Handle case where no explicit success message is returned
        showStatus('Fountain submitted - checking if it was saved...', 'success');
        
        // Add marker to map anyway
        if (selectedLocation && map && window.L) {
          const fountainIcon = (window.L as any).divIcon({
            html: '💧',
            iconSize: [25, 25],
            className: 'fountain-marker'
          });
          
          (window.L as any).marker([selectedLocation.lat, selectedLocation.lng], { 
            icon: fountainIcon 
          })
            .addTo(map)
            .bindPopup(`
              <div>
                <h3>${formData.name}</h3>
                <p>${formData.description}</p>
                <p>Filter Level: ${formData.filterLevel}/3</p>
                <p>Rating: ${formData.rating}/5 💧</p>
                <p><small>Pending verification...</small></p>
              </div>
            `);
        }

        // Reset form and close modal
        setFormData({ name: '', description: '', filterLevel: 1, rating: 5 });
        setShowModal(false);
        setSelectedLocation(null);
      }
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          showStatus('Session expired. Please log in again.', 'error');
        } else if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.error || 'Invalid request data';
          showStatus('Error: ' + errorMessage, 'error');
        } else if (error.response?.status === 500) {
          showStatus('Server error. Please try again later.', 'error');
        } else {
          const errorMessage = error.response?.data?.error || error.message;
          showStatus('Error adding fountain: ' + errorMessage, 'error');
        }
      } else {
        showStatus('Error adding fountain: ' + (error as Error).message, 'error');
      }
    } finally {
      setLoading(false);
    }
};

// Handle form input changes function 
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: name === 'filterLevel' || name === 'rating' ? parseInt(value) : value
  }));
};

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-header">
        <div className="button-container">
          <button
            //onClick={searchFountains}
            disabled={loading || !leafletLoaded}
            className="buttons"
          >
            Search Fountains
          </button>
        </div>
        {userLocation && (
          <div className="location-display">
            📍 Current Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        )}
        {!leafletLoaded && (
          <div className="loading-indicator">
            Loading map...
          </div>
        )}
      </div>

      

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Add Water Fountain</h2>
            <div>
              <div className="form-group">
                <label className="form-label">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter fountain name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Describe the fountain..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Filter Level (1-3)
                </label>
                <input
                  type="number"
                  name="filterLevel"
                  value={formData.filterLevel}
                  onChange={handleInputChange}
                  min={1}
                  max={3}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min={1}
                  max={5}
                  className="form-input"
                />
              </div>

              <p className="location-info-last">
                📍 Location: {selectedLocation?.lat.toFixed(4)}, {selectedLocation?.lng.toFixed(4)}
              </p>

              <div className="button-group">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedLocation(null);
                    setFormData({ name: '', description: '', filterLevel: 1, rating: 5 });
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={addWaterFountain}
                  className="button-secondary"
                >
                  {loading ? 'Adding...' : 'Add Fountain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Map Container */}
      <div className="map-container">
        <div ref={mapRef} style={{ height: '500px', width: '1000px' }} />
        <div className="map-instructions">
          💧 Click anywhere on the map to add a water fountain
        </div>
        <button type="button" id="logoutButton" className="buttons"
            onClick={doLogout} style={{float: 'right'}}> Log Out </button>
      </div>

      {/* Status Messages */}
      {status.message && (
        <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
          {status.message}
        </div>
      )}
    </div>
  );



};

export default Map;