import { useEffect, useRef, useState } from "react";
import mapsApi from "../api/mapsApi";

/**
 * Component hiển thị map với pickup và return location
 * Sử dụng Leaflet (miễn phí, open source)
 * 
 * @param {Object} props
 * @param {string} props.pickupLocation - Địa điểm nhận xe
 * @param {string} props.returnLocation - Địa điểm trả xe
 * @param {string} props.className - CSS classes
 */
const MapView = ({ pickupLocation, returnLocation, className = "" }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    // Chỉ load map khi có cả 2 địa điểm
    if (!pickupLocation || !returnLocation) {
      setLoading(false);
      return;
    }

    // Dynamic import Leaflet để giảm bundle size
    const loadMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import Leaflet CSS và JS
        if (!window.L) {
          // Load CSS
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          link.crossOrigin = "";
          document.head.appendChild(link);

          // Load JS
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
            script.crossOrigin = "";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Đợi một chút để Leaflet load xong
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Tính khoảng cách và lấy tọa độ
        const routeData = await mapsApi.calculateDistanceFromAddresses(
          pickupLocation,
          returnLocation
        );

        setDistance({
          km: routeData.distance,
          duration: Math.round(routeData.duration / 60), // Convert sang phút
        });

        // Khởi tạo map
        if (!mapInstanceRef.current && mapRef.current) {
          // Tính center point giữa 2 địa điểm
          const centerLat = (routeData.coords1.lat + routeData.coords2.lat) / 2;
          const centerLng = (routeData.coords1.lng + routeData.coords2.lng) / 2;

          // Bounds Việt Nam: [min_lat, min_lng, max_lat, max_lng]
          const vietnamBounds = [
            [8.559, 102.144],  // Southwest corner
            [23.393, 109.465]  // Northeast corner
          ];

          mapInstanceRef.current = window.L.map(mapRef.current, {
            center: [centerLat, centerLng],
            zoom: 10,
            zoomControl: true,
            maxBounds: vietnamBounds,  // Giới hạn map trong khu vực Việt Nam
            maxBoundsViscosity: 1.0,  // Không cho phép pan ra ngoài bounds
          });

          // Thêm tile layer (OpenStreetMap) - Sử dụng tile server phù hợp với Việt Nam
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            bounds: vietnamBounds,  // Giới hạn tile trong khu vực Việt Nam
          }).addTo(mapInstanceRef.current);

          // Thêm marker cho pickup location
          const pickupMarker = window.L.marker([routeData.coords1.lat, routeData.coords1.lng], {
            icon: window.L.icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>Pick-Up</b><br>${routeData.address1}`);

          // Thêm marker cho return location
          const returnMarker = window.L.marker([routeData.coords2.lat, routeData.coords2.lng], {
            icon: window.L.icon({
              iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>Drop-Off</b><br>${routeData.address2}`);

          markersRef.current = [pickupMarker, returnMarker];

          // Vẽ route nếu có geometry
          if (routeData.geometry) {
            try {
              let coordinates = [];
              
              // OSRM trả về GeoJSON format: {type: "LineString", coordinates: [[lng, lat], ...]}
              if (routeData.geometry.type === "LineString" && routeData.geometry.coordinates) {
                // OSRM format: coordinates là array of [lng, lat]
                coordinates = routeData.geometry.coordinates.map((coord) => [coord[1], coord[0]]); // Swap để Leaflet dùng [lat, lng]
              } else if (Array.isArray(routeData.geometry.coordinates)) {
                // Fallback: nếu là array trực tiếp
                coordinates = routeData.geometry.coordinates.map((coord) => {
                  if (Array.isArray(coord) && coord.length >= 2) {
                    return [coord[1] || coord[1], coord[0] || coord[0]]; // Swap lat/lng
                  }
                  return coord;
                });
              }
              
              if (coordinates.length > 0) {
                const polyline = window.L.polyline(coordinates, {
                  color: "#3B82F6",
                  weight: 5,
                  opacity: 0.8,
                  smoothFactor: 1,
                }).addTo(mapInstanceRef.current);

                // Fit map để hiển thị cả route
                mapInstanceRef.current.fitBounds(polyline.getBounds(), {
                  padding: [50, 50],
                });
              } else {
                throw new Error("Invalid geometry coordinates");
              }
            } catch (err) {
              console.warn("Could not draw route:", err);
              // Fallback: vẽ đường thẳng giữa 2 điểm
              const straightLine = window.L.polyline(
                [
                  [routeData.coords1.lat, routeData.coords1.lng],
                  [routeData.coords2.lat, routeData.coords2.lng]
                ],
                {
                  color: "#3B82F6",
                  weight: 3,
                  opacity: 0.5,
                  dashArray: "5, 10"
                }
              ).addTo(mapInstanceRef.current);
              
              const group = new window.L.featureGroup([...markersRef.current, straightLine]);
              mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
            }
          } else {
            // Không có route geometry: vẽ đường thẳng giữa 2 điểm
            const straightLine = window.L.polyline(
              [
                [routeData.coords1.lat, routeData.coords1.lng],
                [routeData.coords2.lat, routeData.coords2.lng]
              ],
              {
                color: "#3B82F6",
                weight: 3,
                opacity: 0.5,
                dashArray: "5, 10"
              }
            ).addTo(mapInstanceRef.current);
            
            const group = new window.L.featureGroup([...markersRef.current, straightLine]);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Map loading error:", err);
        setError(err.message || "Không thể tải bản đồ");
        setLoading(false);
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, [pickupLocation, returnLocation]);

  if (!pickupLocation || !returnLocation) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center h-64 ${className}`}
      >
        <p className="text-gray-500 dark:text-gray-400">
          Chưa có thông tin địa điểm
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center h-64 ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải bản đồ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 ${className}`}
      >
        <p className="text-red-600 dark:text-red-400 text-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Distance Info */}
      {distance && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Khoảng cách:
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {distance.km} km
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Thời gian di chuyển:
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              ~{distance.duration} phút
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ zIndex: 0 }}
      />
    </div>
  );
};

export default MapView;

