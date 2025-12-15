import { useState, useRef, useCallback } from 'react';
import { X, Upload, Image, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SlipUploadModal({ isOpen, onClose, booking, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ (jpeg, jpg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !booking?._id) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('slip', selectedFile);

      const response = await customerBookingsAPI.uploadSlip(booking._id, formData);

      if (response.success) {
        onSuccess?.(response.data);
        handleClose();
      } else {
        toast.error(response.message || 'ไม่สามารถอัพโหลดสลิปได้');
      }
    } catch (error) {
      console.error('Upload slip error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose?.();
  };

  if (!isOpen) return null;

  // Show existing slip if any
  const existingSlip = booking?.paymentSlip?.image;
  const slipStatus = booking?.paymentSlip?.status;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-800 mb-2">อัพโหลดสลิปการโอนเงิน</h2>
        <p className="text-sm text-gray-500 mb-6">
          รหัสการจอง: <span className="font-semibold text-blue-600">{booking?.bookingCode}</span>
        </p>

        {/* Existing Slip Status */}
        {existingSlip && slipStatus && slipStatus !== 'none' && (
          <div className={`mb-4 p-3 rounded-lg ${
            slipStatus === 'pending_verification' ? 'bg-yellow-50 border border-yellow-200' :
            slipStatus === 'verified' ? 'bg-green-50 border border-green-200' :
            slipStatus === 'rejected' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <p className={`text-sm font-medium ${
              slipStatus === 'pending_verification' ? 'text-yellow-700' :
              slipStatus === 'verified' ? 'text-green-700' :
              slipStatus === 'rejected' ? 'text-red-700' :
              'text-gray-700'
            }`}>
              {slipStatus === 'pending_verification' && 'สลิปอยู่ระหว่างการตรวจสอบ'}
              {slipStatus === 'verified' && 'สลิปได้รับการยืนยันแล้ว'}
              {slipStatus === 'rejected' && `สลิปถูกปฏิเสธ: ${booking?.paymentSlip?.rejectReason || 'ไม่ระบุเหตุผล'}`}
            </p>
            {existingSlip && (
              <div className="mt-2">
                <img
                  src={`${API_URL}${existingSlip}`}
                  alt="Current slip"
                  className="max-h-40 rounded-lg mx-auto"
                />
              </div>
            )}
          </div>
        )}

        {/* Upload Area */}
        {slipStatus !== 'verified' && (
          <>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {preview ? (
                <div className="text-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg mb-4"
                  />
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    เปลี่ยนรูป
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">ลากไฟล์มาวางที่นี่</p>
                  <p className="text-sm text-gray-400">หรือคลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-gray-400 mt-2">
                    รองรับ: jpeg, jpg, png, gif, webp (ไม่เกิน 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังอัพโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    อัพโหลดสลิป
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Close button for verified slip */}
        {slipStatus === 'verified' && (
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors mt-4"
          >
            ปิด
          </button>
        )}
      </div>
    </div>
  );
}
