"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

interface GrabMapProps {
  orderId: number;
  destination: string;
  apiKey?: string;
}

export default function GrabMap({ orderId, destination, apiKey }: GrabMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState<string | null>(apiKey ?? null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [traveledPath, setTraveledPath] = useState<google.maps.Polyline | null>(null);
  const [remainingPath, setRemainingPath] = useState<google.maps.Polyline | null>(null);
  const [route, setRoute] = useState<google.maps.LatLng[]>([]);
  const isInitialized = useRef(false);

  // Load Google Maps script
  const loadGoogleMapsScript = (apiKey: string) => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.google !== "undefined" && window.google.maps) {
        resolve();
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject("Failed to load Google Maps script");
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (!key) {
      api.getGoogleMapsApiKey()
        .then(res => setKey(res.key))
        .catch(err => console.error("Không thể lấy API key", err));
    }
  }, [key]);

  useEffect(() => {
    if (key) {
      loadGoogleMapsScript(key)
        .then(() => setGoogleLoaded(true))
        .catch(console.error);
    }
  }, [key]);

  useEffect(() => {
    return () => {
      isInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!googleLoaded || isInitialized.current || !mapRef.current) return;

    // ⚠️ Kiểm tra kỹ hơn
    if (
      typeof window === "undefined" ||
      typeof window.google === "undefined" ||
      typeof window.google.maps === "undefined"
    ) {
      console.warn("Google Maps chưa sẵn sàng");
      return;
    }

    isInitialized.current = true;

    const gMap = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: { lat: 10.762622, lng: 106.660172 },
    });
    setMap(gMap);

    api.getDriverLocation(orderId)
      .then(driver => {
        const origin = { lat: driver.latitude, lng: driver.longitude };

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (
              status === window.google.maps.DirectionsStatus.OK &&
              result?.routes.length
            ) {
              const fullRoute = result.routes[0].overview_path;
              setRoute(fullRoute);

              const bounds = new window.google.maps.LatLngBounds();
              fullRoute.forEach(p => bounds.extend(p));
              gMap.fitBounds(bounds);

              const tPath = new window.google.maps.Polyline({
                path: [],
                strokeColor: "#AAAAAA",
                strokeOpacity: 0.5,
                strokeWeight: 5,
                map: gMap,
              });
              setTraveledPath(tPath);

              const rPath = new window.google.maps.Polyline({
                path: fullRoute,
                strokeColor: "#4285F4",
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: gMap,
              });
              setRemainingPath(rPath);

              const m = new window.google.maps.Marker({
                position: origin,
                map: gMap,
                icon: "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png",
              });
              setMarker(m);
            }
          }
        );
      })
      .catch(err => console.error("Không thể lấy vị trí tài xế", err));
  }, [googleLoaded, destination, orderId]);

  useEffect(() => {
    if (!map || !route.length || !marker || !traveledPath || !remainingPath) return;

    const interval = setInterval(() => {
      api.getDriverLocation(orderId)
        .then(driver => {
          const current = new window.google.maps.LatLng(driver.latitude, driver.longitude);
          marker.setPosition(current);
          traveledPath.getPath().push(current);

          const index = route.findIndex(p =>
            window.google.maps.geometry.spherical.computeDistanceBetween(p, current) < 50
          );
          if (index !== -1) {
            const remaining = route.slice(index);
            remainingPath.setPath(remaining);
          }
        })
        .catch(err => console.error("Không thể cập nhật vị trí", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [map, route, marker, traveledPath, remainingPath, orderId]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
