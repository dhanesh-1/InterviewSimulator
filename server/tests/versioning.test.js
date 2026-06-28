const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldCreateRevision, getNextVersionNumber } = require('../utils/answerVersioning');

test('completed sessions with existing answers create a revision entry', () => {
  const question = {
    userAnswer: 'first answer',
    answerVersions: [{ versionNumber: 1, answer: 'first answer' }]
  };

  assert.equal(shouldCreateRevision({ sessionStatus: 'completed', question, hasExistingAnswer: true }), true);
  assert.equal(getNextVersionNumber(question), 2);
});

test('new answers on an in-progress session start from version 1', () => {
  const question = { userAnswer: '' };

  assert.equal(shouldCreateRevision({ sessionStatus: 'in-progress', question, hasExistingAnswer: false }), false);
  assert.equal(getNextVersionNumber(question), 1);
});
