require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');

/**
 * Generates AI-powered SEO recommendations from audit results
 * using OpenRouter API.
 *
 * @param {Object} seoResult - Full SEO audit result object
 * @returns {Promise<string>} AI-generated recommendations text
 */
async function generateSEORecommendations(seoResult) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return 'SEO recommendations unavailable — please try again.';
  }

  const {
    url = '',
    score = 0,
    errors = 0,
    warnings = 0,
    passes = 0,
    title = '',
    description = '',
    keywords = '',
    canonical = '',
    robots = '',
    author = '',
    issues = [],
    og = {},
  } = seoResult;

  // Build failed/warning checks list
  const failedChecks = issues
    .filter((issue) => issue.type === 'warning' || issue.type === 'error')
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join('\n');

  // Determine social image status from issues
  const socialImageCheck = issues.find(
    (issue) => issue.field && issue.field.toLowerCase().includes('social')
  );
  const socialImageStatus = socialImageCheck
    ? `${socialImageCheck.type}: ${socialImageCheck.message}`
    : og && og.image
      ? 'Present'
      : 'Missing';

  const userContent =
    `SEO Audit for: ${url}\n` +
    `Score: ${score}/100 — ${errors} errors, ${warnings} warnings, ${passes} passed\n\n` +
    `Meta Information:\n` +
    `- Title: ${title || 'Missing'} (${title ? title.length : 0} chars)\n` +
    `- Description: ${description || 'Missing'} (${description ? description.length : 0} chars)\n` +
    `- Keywords: ${keywords || 'Missing'}\n` +
    `- Canonical: ${canonical || 'Not defined'}\n` +
    `- Robots Tag: ${robots || 'Not defined'}\n` +
    `- Author: ${author || 'Missing'}\n` +
    `- Social Image: ${socialImageStatus}\n\n` +
    `Failed/Warning checks:\n${failedChecks || 'None'}\n\n` +
    `Provide specific SEO recommendations prioritised by impact.`;

  const requestBody = JSON.stringify({
    model: 'openrouter/auto',
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior SEO specialist and QA engineer. Analyse SEO audit results and provide exactly 3-5 specific, actionable recommendations prioritised by impact. Format your response as a short paragraph followed by a numbered list. Be specific about character limits, missing tags, and what to add. Keep total response under 150 words.',
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
            console.error('[SEO AI] Unexpected response:', data);
            resolve('SEO recommendations unavailable — please try again.');
          }
        } catch (parseErr) {
          console.error('[SEO AI] JSON parse error:', parseErr.message);
          resolve('SEO recommendations unavailable — please try again.');
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SEO AI] Request error:', err.message);
      resolve('SEO recommendations unavailable — please try again.');
    });

    req.write(requestBody);
    req.end();
  });
}

module.exports = { generateSEORecommendations };
