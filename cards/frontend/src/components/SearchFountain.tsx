// src/components/SearchFountain.tsx
import React, { useState } from "react";
import axios from "axios";
import { buildPath } from "./Path";
import { retrieveToken, storeToken } from "../tokenStorage";

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

interface ApiResponse {
  found?: WaterFountain[];
  jwtToken?: string | { accessToken: string };
  error?: string;
  success?: string;
}

interface Props {
  onResults: (fountains: WaterFountain[]) => void;
  showStatus: (message: string, type: "success" | "error") => void;
  onClear: () => void;
  isSearchActive: boolean;
  searchResultsCount: number;
}

const SearchFountain: React.FC<Props> = ({
  onResults,
  showStatus,
  onClear,
  isSearchActive,
  searchResultsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showStatus("Please enter a search term.", "error");
      return;
    }

    setLoading(true);
    const token = retrieveToken();

    if (!token) {
      showStatus("Please log in to search fountains.", "error");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post<ApiResponse>(
        buildPath("api/searchWaterFountainByName"),
        { name: searchQuery.trim(), jwtToken: token },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );

      // Handle token refresh - IMPORTANT: Always update token if provided
      if (response.data.jwtToken) {
        const tok =
          typeof response.data.jwtToken === "string"
            ? response.data.jwtToken
            : response.data.jwtToken.accessToken;
        storeToken({ accessToken: tok });
      }

      // Check for errors
      if (response.data.error) {
        if (
          response.data.error.toLowerCase().includes("jwt") ||
          response.data.error.toLowerCase().includes("token") ||
          response.data.error.toLowerCase().includes("expired")
        ) {
          showStatus("Session expired. Please log in again.", "error");
        } else {
          showStatus("Search error: " + response.data.error, "error");
        }
        setLoading(false);
        return;
      }

      // Handle results
      if (response.data.found && response.data.found.length > 0) {
        onResults(response.data.found);
        showStatus(
          `Found ${response.data.found.length} fountain(s) matching "${searchQuery}"`,
          "success"
        );
      } else {
        showStatus(`No fountains found matching "${searchQuery}".`, "error");
        onResults([]); // Clear results if nothing found
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          showStatus("Session expired. Please log in again.", "error");
        } else if (error.response?.status === 404) {
          // This case handles when the search endpoint itself is not found,
          // which is different from finding no results.
          showStatus("Search service not available.", "error");
        } else {
          // For other errors, display the message from the backend if available
          const errorMessage = error.response?.data?.error || 'An unknown error occurred.';
          showStatus(errorMessage, "error");
        }
      } else {
        showStatus("An unexpected error occurred during search.", "error");
      }
      console.error("Search error:", error);
      onResults([]); // Ensure results are cleared on error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    onClear(); // Use the parent's clear function
  };

  return (
    <div className="search-box" >
      <input
        type="text"
        placeholder="Search fountains by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="form-input"
        disabled={loading}
      />
      <button
        onClick={handleSearch}
        disabled={loading || !searchQuery.trim()}
        className="buttons"
      >
        {loading ? "Searching..." : "Search"}
      </button>
      {/* Single clear button that shows appropriate text based on search state */}
      {(searchQuery || isSearchActive) && (
        <button 
          onClick={handleClear}
          className="buttons"
          style={{ marginLeft: "8px" }}
        >
          {isSearchActive
            ? `Show All Fountains (${searchResultsCount} found)`
            : "Clear"}
        </button>
      )}
    </div>
  );
};

export default SearchFountain;
