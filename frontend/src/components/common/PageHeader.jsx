import PropTypes from 'prop-types';

/**
 * Page Header Component
 * Provides consistent header styling with icon badge
 *
 * Colors:
 * - blue, green, orange, purple, red, gray, indigo, pink
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  actions,
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`${colorClasses[iconColor]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  iconColor: PropTypes.oneOf([
    'blue',
    'green',
    'orange',
    'purple',
    'red',
    'gray',
    'indigo',
    'pink',
  ]),
  actions: PropTypes.node,
};
