import PropTypes from 'prop-types';

/**
 * Standard Card Component
 * Provides consistent styling for all card elements across the application
 */
export default function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${padding} ${className}`}>
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.string,
};
