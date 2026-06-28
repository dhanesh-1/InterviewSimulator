import PropTypes from 'prop-types';
import { getScoreClass, getScoreColor } from '../../utils/speechUtils';

/**
 * Circular score display — used in Dashboard session cards and SessionReview.
 */
export default function ScoreCircle({ score, size = 'md' }) {
  const sizeMap = {
    sm: { width: 40, height: 40, fontSize: '0.75rem' },
    md: { width: 48, height: 48, fontSize: '0.875rem' },
    lg: { width: 64, height: 64, fontSize: '1.125rem' },
    xl: { width: 80, height: 80, fontSize: '1.5rem' },
  };
  const { width, height, fontSize } = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`score-circle ${getScoreClass(score)}`}
      style={{ width, height, fontSize }}
      aria-label={`Score: ${score?.toFixed(1)} out of 10`}
      role="img"
    >
      {score?.toFixed(1)}
    </div>
  );
}

ScoreCircle.propTypes = {
  score: PropTypes.number,
  size:  PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};
