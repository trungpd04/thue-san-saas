import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icon issues with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    value?: { lat: number; lng: number };
    onChange?: (value: { lat: number; lng: number }) => void;
    height?: string;
}

function LocationMarker({ value, onChange }: MapPickerProps) {
    const map = useMap();
    
    useEffect(() => {
        if (value) {
            map.flyTo([value.lat, value.lng], map.getZoom());
        }
    }, [value]);

    useMapEvents({
        click(e) {
            if (onChange) {
                onChange({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                });
            }
        },
    });

    return value ? (
        <Marker position={[value.lat, value.lng]} />
    ) : null;
}

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, height = '300px' }) => {
    const defaultCenter: [number, number] = [10.762622, 106.660172]; // TP.HCM

    return (
        <div style={{ height, width: '100%', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
            <MapContainer 
                center={value ? [value.lat, value.lng] : defaultCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker value={value} onChange={onChange} />
            </MapContainer>
        </div>
    );
};

export default MapPicker;
