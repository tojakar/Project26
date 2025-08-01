import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { buildPath } from './Path';
import { storeToken, retrieveToken } from '../tokenStorage';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchFountain from './SearchFountain';
import ReactDOM from 'react-dom/client';
import StarRating from './StarRating';
import FountainMarker from '../assets/Icon.png'
import FilterLevelRating from './FilterLevelRating'; // Adjust path as needed

function doLogout(event: any): void {
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
  createdBy: string;
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

interface ApiResponse {
  error?: string;
  success?: string;
  message?: string;
  jwtToken?: string | { accessToken: string };
  allWaterFountains?: WaterFountain[];
  addedWaterFountain?: WaterFountain;
  found?: WaterFountain[];
}

const StarSelector: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
}> = ({ rating, onRatingChange }) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onRatingChange(star)}
          style={{
            cursor: 'pointer',
            color: star <= rating ? '#FFD700' : '#CCCCCC',
            fontSize: '24px',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};



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
  const [allFountainMarkers, setAllFountainMarkers] = useState<L.Marker[]>([]);
  const [searchResults, setSearchResults] = useState<WaterFountain[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingFountain, setEditingFountain] = useState<WaterFountain | null>(null);
  const [editFormData, setEditFormData] = useState<FormData>({
    name: '',
    description: '',
    filterLevel: 1,
    rating: 5
  });

  // show status messages
  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  // Clear search and show all fountains
  const clearSearch = () => {
    setSearchResults([]);
    setIsSearchActive(false);
    // Show all fountain markers
    allFountainMarkers.forEach(marker => {
      if (map && map.hasLayer && !map.hasLayer(marker)) {
        marker.addTo(map);
      }
    });
  };

  const deleteWaterFountain = async (
    fountainId: string,
    markerToRemove?: any, // optional Leaflet marker
    setAllFountainMarkers?: React.Dispatch<React.SetStateAction<any[]>>
  ): Promise<void> => {
    try {
      const token = getJwtToken();
      if (!token) {
        showStatus('Please log in to delete fountains', 'error');
        return;
      }

      const apiUrl = buildPath('api/deleteWaterFountain');
      console.log('Calling DELETE URL:', apiUrl);

      const response = await axios.post<ApiResponse>(apiUrl, {
        id: fountainId,
        jwtToken: token
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const result: ApiResponse = response.data;

      // Refresh token if returned
      if (result.jwtToken) {
        setJwtToken(result.jwtToken);
        console.log('Token refreshed during delete');
      }

      // Handle backend error
      if (result.error) {
        if (result.error.toLowerCase().includes('jwt') ||
          result.error.toLowerCase().includes('token') ||
          result.error.toLowerCase().includes('expired')) {
          showStatus('Session expired. Please log in again.', 'error');
          return;
        }
        throw new Error(result.error);
      }

      // Handle success
      if (result.success) {
        showStatus(result.success, 'success');
      } else {
        showStatus('Fountain deleted', 'success');
      }

      // 🗑️ Remove marker from map
      if (markerToRemove && map) {
        map.removeLayer(markerToRemove);
      }

      // Optionally update local state marker array
      if (setAllFountainMarkers && markerToRemove) {
        setAllFountainMarkers(prev => prev.filter(m => m !== markerToRemove));
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
          showStatus('Error deleting fountain: ' + errorMessage, 'error');
        }
      } else {
        showStatus('Error deleting fountain: ' + (error as Error).message, 'error');
      }
    }
  };

  const addFountainMarker = (fountain: WaterFountain) => {
    if (!map || !window.L) return null;
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    const fountainIcon = (window.L as any).divIcon({
      html: `<img src="${FountainMarker}" alt="Water fountain" style="width: 100%; height: 100%;">`,
      iconSize: [25, 25],
      className: 'fountain-marker'
    });

    const marker = (window.L as any).marker([fountain.yCoord, fountain.xCoord], {
      icon: fountainIcon
    }).addTo(map)
      .bindPopup(`
        <div style="width: 190px; text-align: center;">
          <div hidden>${fountain.createdBy}</div>
          <div hidden>${fountain._id}</div>
          <h3 style="margin: 4px 0;">${fountain.name}</h3>
          <p style="margin: 2px 0;">${fountain.description}</p>
          <p id="filter-static-${fountain._id}" style="margin: 2px 0;">Filter Level: ${fountain.filterLevel.toFixed(2)}/3</p>
          <div id="filter-rating-${fountain._id}" style="margin-top: 2px; "></div>
          <p id="rating-static-${fountain._id}" style="margin-top: 10px;">Rating: ${fountain.rating.toFixed(2)}/5 💧</p>
          <div id="rating-${fountain._id}" style="margin-top: -22px;"></div>
          <div id="button-container-${fountain._id}" style="display: flex; justify-content: center; gap: 8px; margin-top: 8px;"></div>
        </div>
      `);

      

    marker.on('popupopen', () => {
      //Recenter map on popup
      map.setView(marker.getLatLng(), map.getZoom(), { animate: true });

      const token = retrieveToken();
      const filterRatingContainer = document.getElementById(`filter-rating-${fountain._id}`);
      const ratingContainer = document.getElementById(`rating-${fountain._id}`);
      const buttonContainer = document.getElementById(`button-container-${fountain._id}`);

      // 🧪 Filter Level Rating
      if (filterRatingContainer && userData?.userId && token) {
        const root = ReactDOM.createRoot(filterRatingContainer);
        root.render(
          <FilterLevelRating
            userId={userData.userId}
            fountainId={fountain._id}
            jwtToken={token}
          />
        );
      }

      // ⭐ React Star Rating
      if (ratingContainer && userData?.userId && token) {
        const root = ReactDOM.createRoot(ratingContainer);
        root.render(
          <StarRating
            userId={userData.userId}
            fountainId={fountain._id}
            jwtToken={token}
          />
        );
      }

        const onFilterRated = (e: any) => {
          if (e.detail.fountainId === fountain._id) {
            const el = document.getElementById(`filter-static-${fountain._id}`);
            if (el) el.innerText = `Filter Level: ${e.detail.newLevel.toFixed(2)}/3`;
          }
          };
          const onStarRated = (e: any) => {
            if (e.detail.fountainId === fountain._id) {
              const el = document.getElementById(`rating-static-${fountain._id}`);
              if (el) el.innerText = `Rating: ${e.detail.newRating.toFixed(2)}/5 💧`;
            }
          };
          window.addEventListener('filterRated', onFilterRated);
          window.addEventListener('starRated',   onStarRated);



      // ✏️ 🗑️ Buttons
      if (
        buttonContainer &&
        userData?.userId &&
        fountain.createdBy === userData.userId
      ) {
      buttonContainer.innerHTML = `
        <button id="edit-${fountain._id}" style="
          background: #4a6fa5;
          color: white;
          border: none;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          min-width: 80px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          line-height: 1;
        " title="Edit">
          ✏️ <span>Edit</span>
        </button>

        <button id="delete-${fountain._id}" style="
          background: #c0392b;
          color: white;
          border: none;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          min-width: 80px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          line-height: 1;
        " title="Delete">
          🗑️ <span>Delete</span>
        </button>
      `;

        document.getElementById(`edit-${fountain._id}`)?.addEventListener('click', () => {
          openEditModal(fountain);
        });

        document.getElementById(`delete-${fountain._id}`)?.addEventListener('click', async () => {
          const confirmDelete = window.confirm('Are you sure you want to delete this fountain?');
          if (!confirmDelete) return;
          await deleteWaterFountain(fountain._id, marker, setAllFountainMarkers);
        });
        
    

       

    }
     marker.on('popupclose', () => {
          window.removeEventListener('filterRated', onFilterRated);
          window.removeEventListener('starRated',   onStarRated);
        });
  });

  return marker;
};


  const openEditModal = (fountain: WaterFountain) => {
    setEditingFountain(fountain);
    setEditFormData({
      name: fountain.name,
      description: fountain.description,
      filterLevel: fountain.filterLevel,
      rating: fountain.rating
    });
    setShowEditModal(true);
  };

   const updateWaterFountain = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!editingFountain) throw new Error('No fountain selected');

      const token = getJwtToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const updateData = {
        id: editingFountain._id,
        editedFields: {
          name: editFormData.name.trim(),
          description: editFormData.description.trim()
        },
        jwtToken: token
      };

      const response = await axios.post<ApiResponse>(
        buildPath('api/editWaterFountain'),
        updateData,
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const result = response.data;
      if (result.jwtToken) setJwtToken(result.jwtToken as string);

      if (result.error) throw new Error(result.error);

      showStatus('Fountain updated successfully!', 'success');
      setShowEditModal(false);
      setEditingFountain(null);
      // optionally refresh markers/data here instead of full reload
      window.location.reload();
    } catch (error) {
      console.error(error);
      showStatus('Error updating fountain: ' + (error as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search results
  const handleSearchResults = (foundFountains: WaterFountain[]) => {
    if (!foundFountains || foundFountains.length === 0) {
      // Clear search - show all fountains
      clearSearch();
      return;
    }

    setSearchResults(foundFountains);
    setIsSearchActive(true);

    // Hide all fountain markers first
    allFountainMarkers.forEach(marker => {
      if (map && map.hasLayer && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Show only the search result markers
    foundFountains.forEach(fountain => {
      // Find the existing marker for this fountain
      const existingMarker = allFountainMarkers.find(marker => {
        const markerLatLng = marker.getLatLng();
        return markerLatLng.lat === fountain.yCoord && markerLatLng.lng === fountain.xCoord;
      });

      if (existingMarker) {
        // Add the existing marker back to the map
        existingMarker.addTo(map);
      } else {
        // Create a new marker if it doesn't exist (shouldn't happen with normal flow)
        const newMarker = addFountainMarker(fountain);
        if (newMarker) {
          setAllFountainMarkers(prev => [...prev, newMarker]);
        }
      }
    });

    // Zoom to fit search results
    if (foundFountains.length > 0) {
      const bounds = new (window.L as any).LatLngBounds();
      foundFountains.forEach(fountain => {
        bounds.extend([fountain.yCoord, fountain.xCoord]);
      });
      map.fitBounds(bounds.pad(0.1));
    }
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


  useEffect(() => {
    const fetchFountains = async () => {
      const token = getJwtToken();

      if (!token) {
        showStatus('Please log in to load fountains.', 'error');
        return;
      }

      try {
        const response = await axios.post<ApiResponse>(
          buildPath('api/getAllWaterFountains'),
          { jwtToken: token },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        // Save refreshed token if present - IMPORTANT: Always update token
        if (response.data.jwtToken) {
          const tok = typeof response.data.jwtToken === 'string'
            ? response.data.jwtToken
            : response.data.jwtToken.accessToken;
          storeToken({ accessToken: tok });
        }

        const fountains = response.data.allWaterFountains;
        if (!fountains || fountains.length === 0) {
          showStatus('No fountains found.', 'error');
          return;
        }

        // Create markers and store them
        const markers: L.Marker[] = [];
        fountains.forEach(fountain => {
          const marker = addFountainMarker(fountain);
          if (marker) {
            markers.push(marker);
          }
        });

        setAllFountainMarkers(markers);
        showStatus('Fountains loaded successfully!', 'success');

      } catch (error) {
        console.error('Fetch fountains error:', error);
        console.log('API URL was:', buildPath('api/getAllWaterFountains'));

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          console.log('Error status:', status);
          console.log('Error response:', error.response?.data);

          if (status === 401) {
            showStatus('Session expired. Please log in again.', 'error');
          } else if (status === 404) {
            showStatus('API endpoint not found. Server may not be updated.', 'error');
          } else {
            const message = error.response?.data?.error || error.message;
            showStatus('Error: ' + message, 'error');
          }
        } else {
          showStatus('Unexpected error: ' + (error as Error).message, 'error');
        }
      }
    };

    if (map && leafletLoaded) {
      fetchFountains();
    }
  }, [map, leafletLoaded]);



  // Simple JWT functions using your existing tokenStorage
  const getJwtToken = (): string => {
    return retrieveToken() || '';
  };

  const setJwtToken = (newToken: string | any): void => {
    // Handle both string tokens and objects with accessToken
    if (typeof newToken === 'string') {
      storeToken({ accessToken: newToken });
    } else if (newToken && newToken.accessToken) {
      storeToken({ accessToken: newToken.accessToken });
    } else {
      storeToken({ accessToken: newToken });
    }
  };




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

      const fountainData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        filterLevel: Number(formData.filterLevel),
        rating: Number(formData.rating),
        xCoord: Number(selectedLocation.lng),
        yCoord: Number(selectedLocation.lat),
        jwtToken: token
      };

      const apiUrl = buildPath('api/addWaterFountain');
      console.log('Calling API URL:', apiUrl);
      console.log('Sending data:', fountainData);

      const response = await axios.post<ApiResponse>(apiUrl, fountainData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const result: ApiResponse = response.data;

      // Handle JWT token refresh - IMPORTANT: Always update token
      if (result.jwtToken) {
        setJwtToken(result.jwtToken);
        console.log('Token refreshed during add fountain');
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

        
      // Add marker to map immediately, but override the default 0/0
      if (result.addedWaterFountain && map) {
        // Copy the fountain object and inject the form values
        const fountainWithInitialRatings = {
          ...result.addedWaterFountain,
          filterLevel: Number(formData.filterLevel),
          rating:     Number(formData.rating)
        };

        // Create the marker
        const newMarker = addFountainMarker(fountainWithInitialRatings);
        if (newMarker) {
          setAllFountainMarkers(prev => [...prev, newMarker]);
          // Center and open popup so they see the values immediately
          map.setView(
            [fountainWithInitialRatings.yCoord, fountainWithInitialRatings.xCoord],
            map.getZoom(),
            { animate: true }
          );
          newMarker.openPopup();
        }
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
            className: 'fountain-marker',
          });

          const marker = (window.L as any).marker([selectedLocation.lat, selectedLocation.lng], {
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

          setAllFountainMarkers(prev => [...prev, marker]);
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
        <button type="button" id="logoutButton" className="buttons"
          onClick={doLogout} style={{ position: 'absolute', top: '40px', right: '40px'}}> Log Out </button>
        <div className="button-container">
          <SearchFountain
            onResults={handleSearchResults}
            showStatus={showStatus}
            onClear={clearSearch}
            isSearchActive={isSearchActive}
            searchResultsCount={searchResults.length}
          />
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
                  Rating ({formData.rating}/5)
                </label>
                <StarSelector
                  rating={formData.rating}
                  onRatingChange={(newRating) => setFormData(prev => ({ ...prev, rating: newRating }))}
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

   
     {/* Edit Modal */}
      {showEditModal && editingFountain && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Edit Water Fountain</h2>
            <div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="form-input"
                  placeholder="Enter fountain name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="form-textarea"
                  placeholder="Describe the fountain..."
                  rows={3}
                />
              </div>

              <div className="button-group">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFountain(null);
                    setEditFormData({
                      name: '',
                      description: '',
                      filterLevel: 1,  // kept for reset consistency
                      rating: 5
                    });
                  }}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={updateWaterFountain}
                  className="button-secondary"
                >
                  {loading ? 'Updating...' : 'Update Fountain'}
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
          Click anywhere on the map to add a water fountain
          {isSearchActive && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#63ccca' }}>
               Showing {searchResults.length} search result(s)
            </div>
          )}
        </div>
        
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