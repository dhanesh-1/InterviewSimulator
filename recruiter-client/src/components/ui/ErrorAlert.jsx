import PropTypes from 'prop-types';
import { FiAlertCircle, FiX } from 'react-icons/fi';

export default function ErrorAlert({ message, onDismiss, style }) {
  if (!message) return null;
  return (
    <div
      className="auth-error error-alert"
      role="alert"
      aria-live="polite"
      style={style}
    >
      <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
      <span>{message}</span>
      {onDismiss && (
        <button
          className="error-alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
          type="button"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

ErrorAlert.propTypes = {
  message:   PropTypes.string,
  onDismiss: PropTypes.func,
  style:     PropTypes.object,
};
