import { useState, useEffect } from 'react';
import { MapPin, ImageIcon } from 'lucide-react';
import { settingsAPI } from '../../lib/api';
import { API_BASE_URL } from '../../constants/api';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [floorPlanImage, setFloorPlanImage] = useState('');
  const [venueInfo, setVenueInfo] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);
      const [floorPlanRes, venueRes] = await Promise.all([
        settingsAPI.getFloorPlan(),
        settingsAPI.getVenueInfo(),
      ]);
      if (floorPlanRes.success && floorPlanRes.data.floorPlanImage) {
        setFloorPlanImage(floorPlanRes.data.floorPlanImage);
      }
      if (venueRes.success) {
        setVenueInfo(venueRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    // Remove /api from base URL for static files
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  // Placeholder component when no image
  const PlaceholderContent = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        ยังไม่มีรูปแผนผัง
      </h3>
      <p className="text-gray-500 text-sm text-center max-w-xs">
        รูปแผนผังสนามจะแสดงที่นี่เมื่อผู้ดูแลระบบอัพโหลด
      </p>
    </div>
  );

  const venueName = venueInfo?.venue?.name || 'สนามแบดมินตัน';
  const venuePhone = venueInfo?.venue?.phone || '';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-full p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            แผนผังสนาม
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          แผนผังสนาม
        </h1>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{venueName}</span>
        </div>
      </div>

      {/* Floor Plan Image */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-4xl mx-auto overflow-hidden">
        {floorPlanImage ? (
          <div className="relative">
            <img
              src={getImageUrl(floorPlanImage)}
              alt="Floor Plan"
              className="w-full h-auto"
              onError={() => {
                setError(true);
                setFloorPlanImage('');
              }}
            />
          </div>
        ) : (
          <PlaceholderContent />
        )}
      </div>

      {/* Contact Info */}
      {venuePhone && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>TEL: {venuePhone}</p>
        </div>
      )}
    </div>
  );
}
