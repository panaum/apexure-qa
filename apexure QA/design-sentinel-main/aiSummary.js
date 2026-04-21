require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

/**
 * Generates an AI-powered summary of accessibility scan results
 * using OpenRouter API (Llama 3.3 70B Instruct).
 *
 * @param {Object} accessibilityResult
 * @param {string} accessibilityResult.url
 * @param {string} accessibilityResult.checkedAt
 * @param {Object} accessibilityResult.summary
 * @param {number} accessibilityResult.summary.total
 * @param {number} accessibilityResult.summary.passed
 * @param {number} accessibilityResult.summary.failed
 * @param {number} accessibilityResult.summary.warned
 * @param {Array} accessibilityResult.issues
 * @returns {Promise<string>} AI-generated summary text
 */
async function generateAccessibilitySummary(accessibilityResult) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return 'AI summary unavailable — check your OpenRouter API key.';
  }

  const { url, summary, issues } = accessibilityResult;
  const { total, passed, failed, warned } = summary;

  // Build the issues list string
  const issuesList = issues
    .map((issue) => `${issue.type} - ${issue.impact} - ${issue.description}`)
    .join('\n');

  const userContent =
    `Summarise the accessibility scan results for ${url}.\n` +
    `Total checks: ${total}. Passed: ${passed}. Failed: ${failed}. Warnings: ${warned}.\n` +
    `Issues found:\n${issuesList}\n` +
    `Write a professional QA summary paragraph for this report.`;

  const requestBody = JSON.stringify({
    model: 'openrouter/auto',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content:
          'You are a QA engineer assistant. Write clear, concise accessibility audit summaries. Be direct and professional. Focus on what failed and how serious it is. Keep it to 3-5 sentences maximum.',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Apexure QA',
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (
            parsed.choices &&
            parsed.choices.length > 0 &&
            parsed.choices[0].message &&
            parsed.choices[0].message.content
          ) {
            resolve(parsed.choices[0].message.content.trim());
          } else {
            console.error('[AI Summary] Unexpected response:', data);
            resolve('AI summary unavailable — check your OpenRouter API key.');
          }
        } catch (parseErr) {
          console.error('[AI Summary] JSON parse error:', parseErr.message);
          resolve('AI summary unavailable — check your OpenRouter API key.');
        }
      });
    });

    req.on('error', (err) => {
      console.error('[AI Summary] Request error:', err.message);
      resolve('AI summary unavailable — check your OpenRouter API key.');
    });

    req.write(requestBody);
    req.end();
  });
}

module.exports = { generateAccessibilitySummary };
