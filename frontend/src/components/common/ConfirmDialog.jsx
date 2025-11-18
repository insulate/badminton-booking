import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

/**
 * ConfirmDialog Component
 * Dialog สวยๆ สำหรับยืนยันการทำงาน
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    const styles = {
      warning: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        buttonText: 'text-white',
      },
      danger: {
        icon: XCircle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        buttonText: 'text-white',
      },
      info: {
        icon: Info,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
        buttonText: 'text-white',
      },
      success: {
        icon: CheckCircle,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonBg: 'bg-green-600 hover:bg-green-700',
        buttonText: 'text-white',
      },
    };
    return styles[type] || styles.warning;
  };

  const typeStyles = getTypeStyles();
  const Icon = typeStyles.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-start">
            {/* Icon */}
            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${typeStyles.iconBg}`}>
              <Icon className={typeStyles.iconColor} size={24} />
            </div>

            {/* Content */}
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${typeStyles.buttonBg} ${typeStyles.buttonText}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
