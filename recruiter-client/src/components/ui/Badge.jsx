import PropTypes from 'prop-types';

/**
 * Reusable Badge component.
 * variant maps to CSS class: badge-{variant}
 */
export default function Badge({ variant, children, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  variant:   PropTypes.string.isRequired,
  children:  PropTypes.node.isRequired,
  className: PropTypes.string,
};
