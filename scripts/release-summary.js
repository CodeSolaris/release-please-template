import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SUMMARY_START = '<!-- ai-release-summary:start -->';
const SUMMARY_END = '<!-- ai-release-summary:end -->';
const MAX_TECHNICAL_NOTES_LENGTH = 20_000;

export function stripGeneratedSummary(body) {
  const start = body.indexOf(SUMMARY_START);
  const end = body.indexOf(SUMMARY_END);

  if (start === -1 || end === -1 || end < start) {
    return body.trim();
  }

  const remainingBody = `${body.slice(0, start)}${body.slice(end + SUMMARY_END.length)}`.trim();
  return remainingBody.replace(/^## Technical release notes\s+/i, '').trim();
}

export function serializePromptInput(value) {
  return JSON.stringify(value);
}

function normalizeText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw new TypeError(`${field} must be a string.`);
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > maxLength) {
    throw new RangeError(`${field} must contain between 1 and ${maxLength} characters.`);
  }

  return normalized;
}

export function validateSummary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('AI response must be a JSON object.');
  }

  if (!Array.isArray(value.userImpact) || value.userImpact.length > 5) {
    throw new TypeError('userImpact must be an array with at most five items.');
  }

  const risk = String(value.risk).toLowerCase();
  if (!['low', 'medium', 'high', 'unknown'].includes(risk)) {
    throw new TypeError('risk must be low, medium, high, or unknown.');
  }

  if (typeof value.breakingChanges !== 'boolean') {
    throw new TypeError('breakingChanges must be a boolean.');
  }

  return {
    businessSummary: normalizeText(value.businessSummary, 'businessSummary', 1_000),
    userImpact: value.userImpact.map((item, index) =>
      normalizeText(item, `userImpact[${index}]`, 300),
    ),
    risk,
    breakingChanges: value.breakingChanges,
  };
}

export function buildPullRequestBody(summary, technicalNotes) {
  const impact = summary.userImpact.length
    ? summary.userImpact.map((item) => `- ${item}`).join('\n')
    : '- No direct user impact was identified.';

  return `${SUMMARY_START}
## Business summary

${summary.businessSummary}

## User impact

${impact}

## Release assessment

- Risk: ${summary.risk[0].toUpperCase()}${summary.risk.slice(1)}
- Breaking changes: ${summary.breakingChanges ? 'Yes' : 'No'}
${SUMMARY_END}

## Technical release notes

${technicalNotes.trim()}
`;
}

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function parseReleasePullRequest(value) {
  const pullRequest = JSON.parse(value);
  if (!Number.isInteger(pullRequest.number) || pullRequest.number <= 0) {
    throw new TypeError('Release pull request number is invalid.');
  }
  if (typeof pullRequest.title !== 'string' || typeof pullRequest.body !== 'string') {
    throw new TypeError('Release pull request title and body are required.');
  }
  return pullRequest;
}

async function githubRequest(pathname, options = {}) {
  const token = requireEnvironment('GH_TOKEN');
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function prepare() {
  const pullRequest = parseReleasePullRequest(requireEnvironment('RELEASE_PR_JSON'));
  const outputDirectory = requireEnvironment('RUNNER_TEMP');
  const technicalNotes = stripGeneratedSummary(pullRequest.body);

  if (!technicalNotes) {
    throw new Error('The release pull request has no technical notes to summarize.');
  }

  await Promise.all([
    writeFile(
      path.join(outputDirectory, 'release-title.json'),
      serializePromptInput(pullRequest.title),
      'utf8',
    ),
    writeFile(
      path.join(outputDirectory, 'release-notes.json'),
      serializePromptInput(technicalNotes.slice(0, MAX_TECHNICAL_NOTES_LENGTH)),
      'utf8',
    ),
  ]);

  console.log(`Prepared AI input for release pull request #${pullRequest.number}.`);
}

async function apply() {
  const repository = requireEnvironment('GITHUB_REPOSITORY');
  const pullRequest = parseReleasePullRequest(requireEnvironment('RELEASE_PR_JSON'));
  const responsePath = requireEnvironment('AI_RESPONSE_FILE');
  const technicalNotes = stripGeneratedSummary(pullRequest.body);
  const response = validateSummary(JSON.parse(await readFile(responsePath, 'utf8')));
  const body = buildPullRequestBody(response, technicalNotes);

  await githubRequest(`/repos/${repository}/pulls/${pullRequest.number}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });

  console.log(`Updated release pull request #${pullRequest.number} with an AI-generated summary.`);
}

export async function main(command = process.argv[2]) {
  if (command === 'prepare') return prepare();
  if (command === 'apply') return apply();
  throw new Error('Expected command: prepare or apply.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Release summary failed: ${error.message}`);
    process.exitCode = 1;
  });
}
