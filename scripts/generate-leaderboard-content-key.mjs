import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(repoRoot, 'content.json');
const configPath = path.join(repoRoot, 'config.js');
const outputPath = path.join(
  repoRoot,
  'leaderboard-worker',
  'src',
  'content-key.js'
);

function readContentVersion(configSource) {
  const match = configSource.match(/contentVersion:\s*"([^"]+)"/);
  if (!match || !match[1]) {
    throw new Error('Could not find leaderboard.contentVersion in config.js');
  }
  return String(match[1]).trim();
}

const configSource = fs.readFileSync(configPath, 'utf8');
const contentVersion = readContentVersion(configSource);
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

if (!Array.isArray(content.items)) {
  throw new Error('content.json is missing items[]');
}

const answerEntries = content.items
  .map((item) => [Number(item?.id), item?.correctAnswer === true])
  .filter((row) => Number.isFinite(row[0]) && row[0] > 0);

const file = `export const LEADERBOARD_CONTENT_VERSION = ${JSON.stringify(
  contentVersion
)};\n\nexport const ANSWER_KEY_ENTRIES = ${JSON.stringify(answerEntries)};\n`;

fs.writeFileSync(outputPath, file, 'utf8');
process.stdout.write(
  `Wrote ${path.relative(repoRoot, outputPath)} for contentVersion ${contentVersion}\n`
);
