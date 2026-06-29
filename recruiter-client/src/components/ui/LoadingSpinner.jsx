import PropTypes from 'prop-types';

export default function LoadingSpinner({ size = 'md', label = 'Loading...', center = false }) {
  const sizes = {
    sm:  { box: 16, border: 2 },
    md:  { box: 32, border: 3 },
    lg:  { box: 48, border: 4 },
    xl:  { box: 64, border: 4 },
  };
  const { box, border } = sizes[size] || sizes.md;

  const spinner = (
    <span
      className="spinner"
      role="status"
      aria-label={label}
      style={{ width: box, height: box, borderWidth: border }}
    />
  );

  if (center) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        {spinner}
        {label && <p className="loading-text">{label}</p>}
      </div>
    );
  }

  return spinner;
}

LoadingSpinner.propTypes = {
  size:   PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  label:  PropTypes.string,
  center: PropTypes.bool,
};
