import PropTypes from 'prop-types';

/**
 * Page Container Component
 * Provides consistent page layout with proper max-width and padding
 *
 * Variants:
 * - form: max-w-4xl (for settings/forms)
 * - list: max-w-7xl (for tables/lists)
 * - full: no max-width (for dashboard/complex layouts)
 */
export default function PageContainer({
  children,
  variant = 'list',
  className = ''
}) {
  const maxWidthClasses = {
    form: 'max-w-4xl mx-auto',
    list: 'max-w-7xl mx-auto',
    full: '',
  };

  return (
    <div className="min-h-screen bg-bg-cream p-4 lg:p-6">
      <div className={`${maxWidthClasses[variant]} ${className}`}>
        {children}
      </div>
    </div>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['form', 'list', 'full']),
  className: PropTypes.string,
};
