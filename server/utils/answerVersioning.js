function getNextVersionNumber(question) {
  const versions = Array.isArray(question?.answerVersions) ? question.answerVersions : [];
  if (versions.length === 0) return 1;
  return Math.max(...versions.map((version) => Number(version.versionNumber) || 0)) + 1;
}

function shouldCreateRevision({ sessionStatus, question, hasExistingAnswer }) {
  if (sessionStatus !== 'completed') return false;
  return Boolean(hasExistingAnswer && question?.userAnswer);
}

module.exports = {
  getNextVersionNumber,
  shouldCreateRevision
};
