import PropTypes from 'prop-types';

/**
 * Button Component
 * Provides consistent button styling across the application
 *
 * Variants:
 * - primary: Blue button for main actions
 * - secondary: Gray button for secondary actions
 * - danger: Red button for destructive actions
 * - success: Green button for success actions
 *
 * Sizes:
 * - sm: Small button (px-4 py-2)
 * - md: Medium button (px-6 py-3) - default
 * - lg: Large button (px-8 py-4)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  icon,
}) {
  const baseClasses = 'rounded-xl transition-all font-medium flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg disabled:bg-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg disabled:bg-green-300',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
};
