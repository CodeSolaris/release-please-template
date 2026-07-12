import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPullRequestBody,
  parseReleasePullRequest,
  serializePromptInput,
  stripGeneratedSummary,
  validateSummary,
} from './release-summary.js';

const summary = {
  businessSummary: 'Customers can complete payments more reliably.',
  userImpact: ['Failed payments can be retried without contacting support.'],
  risk: 'low',
  breakingChanges: false,
};

test('buildPullRequestBody preserves technical release notes', () => {
  const body = buildPullRequestBody(summary, '### Features\n\n- Add payment retries.');

  assert.match(body, /## Business summary/);
  assert.match(body, /## Technical release notes/);
  assert.match(body, /- Add payment retries\./);
});

test('stripGeneratedSummary makes updates idempotent', () => {
  const technicalNotes = '### Features\n\n- Add payment retries.';
  const body = buildPullRequestBody(summary, technicalNotes);

  assert.equal(stripGeneratedSummary(body), technicalNotes);
});

test('serializePromptInput keeps multiline Markdown on one YAML-safe line', () => {
  const value = '### Features\n\n* Add retries.\n* Handle: failures.';
  const serialized = serializePromptInput(value);

  assert.equal(serialized.split('\n').length, 1);
  assert.equal(JSON.parse(serialized), value);
});

test('validateSummary normalizes valid structured output', () => {
  assert.deepEqual(
    validateSummary({
      businessSummary: '  A useful release.  ',
      userImpact: ['  Faster checkout.  '],
      risk: 'LOW',
      breakingChanges: false,
    }),
    {
      businessSummary: 'A useful release.',
      userImpact: ['Faster checkout.'],
      risk: 'low',
      breakingChanges: false,
    },
  );
});

test('validateSummary rejects unsupported risk values', () => {
  assert.throws(
    () => validateSummary({ ...summary, risk: 'critical' }),
    /risk must be/,
  );
});

test('parseReleasePullRequest validates release-please output', () => {
  assert.deepEqual(
    parseReleasePullRequest('{"number":42,"title":"chore(main): release 1.0.0","body":"Notes"}'),
    {
      number: 42,
      title: 'chore(main): release 1.0.0',
      body: 'Notes',
    },
  );
});
