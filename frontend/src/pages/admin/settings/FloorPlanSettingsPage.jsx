import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Upload, Trash2, Save, ImageIcon } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import { API_BASE_URL } from '../../../constants/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';
import { PageContainer, Card, PageHeader, Button } from '../../../components/common';

const FloorPlanSettingsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchFloorPlan();
  }, []);

  const fetchFloorPlan = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getFloorPlan();
      if (response.success && response.data.floorPlanImage) {
        setCurrentImage(response.data.floorPlanImage);
      }
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await settingsAPI.uploadFloorPlan(formData);

      if (response.success) {
        toast.success('อัพโหลดรูปแผนผังสำเร็จ');
        setCurrentImage(response.data.floorPlanImage);
        setSelectedFile(null);
        setPreviewUrl('');
      }
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบรูปแผนผัง?')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await settingsAPI.deleteFloorPlan();

      if (response.success) {
        toast.success('ลบรูปแผนผังสำเร็จ');
        setCurrentImage('');
      }
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelSelect = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    // Remove /api from base URL for static files
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PageContainer variant="form">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="รูปแผนผังสนาม"
          subtitle="จัดการรูปแผนผังที่แสดงในหน้าแรกของลูกค้า"
          icon={Map}
          iconColor="green"
        />

        {/* Current Image Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              รูปแผนผังปัจจุบัน
            </h3>

            {currentImage ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={getImageUrl(currentImage)}
                    alt="Floor Plan"
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    icon={deleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  >
                    {deleting ? 'กำลังลบ...' : 'ลบรูปแผนผัง'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  ยังไม่มีรูปแผนผัง
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  อัพโหลดรูปแผนผังด้านล่าง
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Upload Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              อัพโหลดรูปใหม่
            </h3>

            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />

              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </p>
              <p className="text-gray-400 text-sm">
                รองรับ: JPG, PNG, WebP (สูงสุด 5MB)
              </p>
            </div>

            {/* Preview Selected File */}
            {previewUrl && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  ตัวอย่างรูปที่เลือก
                </h4>
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  ไฟล์: {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
            >
              กลับ
            </Button>

            <div className="flex gap-2">
              {selectedFile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelSelect}
                >
                  ยกเลิก
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || saving}
                icon={saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              >
                {saving ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปใหม่'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default FloorPlanSettingsPage;
