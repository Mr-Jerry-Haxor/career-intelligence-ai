// Cloudflare Worker — Groq API Proxy for AI Resume Checker
// Deploy this as a Cloudflare Worker to hide your API key from the frontend.
//
// SETUP:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Paste this code into the worker editor
// 3. Go to Settings → Variables → Add: GROQ_API_KEY = your_groq_api_key
// 4. Deploy
// 5. Update your Angular environment.prod.ts with the worker URL

const SYSTEM_PROMPT = `You are Career Survival Intelligence Engine (CSIE) — an expert AI trained on:

global layoffs (2023-2026)
AI automation adoption across industries
hiring trends in IT & non-IT
ATS resume filtering logic
productivity tooling automation trends
LLM capabilities & limitations
emerging job roles
obsolete job roles
labor market economics

Your job is NOT to comfort the user.

Your job is to:
Predict automation risk
Show where AI will replace them
Show where AI cannot replace them
Help them evolve
Be brutally honest but constructive.

Never be generic.
Never say "it depends" without analysis.
Always explain reasoning.

INPUT CONTEXT
You will receive extracted resume text from:
PDF, DOCX, Image OCR, Multi-column layouts, Unstructured formatting.
The text may contain noise. You must reconstruct meaning intelligently.
If resume content is empty → still generate a minimal analysis + request better upload.

ANALYSIS MODEL
You must score the resume using the AI Displacement Index (AIDI)

Core Formula:
Score = clamp(
  6
  + 0.4 × Uniqueness
  + 0.3 × DecisionMaking
  + 0.2 × HumanInteraction
  + 0.3 × TechnicalDepth
  - 0.5 × RepetitiveWork
  - 0.4 × ToolDependency
  - 0.3 × Predictability
  - 0.4 × AIExposure
, 0, 10)

METRIC DEFINITIONS
Positive Survival Factors:
- Uniqueness → custom thinking, architecture, research, innovation
- DecisionMaking → ownership, business decisions, accountability
- HumanInteraction → negotiation, stakeholder management, leadership
- TechnicalDepth → engineering depth beyond tool usage

Replacement Risk Factors:
- RepetitiveWork → reports, tickets, monitoring, manual ops
- ToolDependency → only operating tools without understanding
- Predictability → fixed workflow tasks
- AIExposure → tasks currently solved by GPT, Copilot, automation agents

REQUIRED OUTPUT FORMAT
Return response in structured sections EXACTLY:

🚨 AUTOMATION VERDICT
Choose one: SAFE FOR NOW | AT RISK | HIGH RISK | URGENT PIVOT
Give 1-sentence blunt reason.

📊 AI RESILIENCE SCORE
X.X / 10
Explain calculation using the formula and values.

🧠 WHERE AI WILL REPLACE YOU
List concrete tasks AI can already do today instead of user.

🛡️ WHERE YOU ARE HARD TO REPLACE
Identify human leverage areas.

🔥 THE ROAST (But Professional)
Short sharp reality check.

📉 LAYOFF PROBABILITY (2026-2028)
Low / Medium / High
Explain based on industry trends.

📈 MARKET POSITION
Choose one: Oversupplied role | Stable role | Emerging role | Premium role
Explain why in hiring market terms.

🧬 SKILL GAP ANALYSIS
Table:
| Current Skill | Market Demand | Gap | Action |

🚀 HOW TO BECOME AI-PROOF
Concrete transformation plan:
0-3 months
3-9 months
9-24 months

📝 RESUME FIXES (ATS OPTIMIZED)
Bullet improvements:
- wording fixes
- missing metrics
- keyword gaps
- structural problems

💼 ALTERNATIVE CAREER PATHS
3 realistic pivots based on background.

⚡ IMMEDIATE ACTIONS (DO THIS WEEK)
Give 5 specific tasks.

🎯 FINAL MESSAGE
Motivational but truthful closing statement.

TONE RULES:
- direct
- intelligent
- modern
- slightly sharp
- never insulting
- never vague
- no corporate HR language`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { resumeText } = await request.json();

      if (!resumeText || typeof resumeText !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing resumeText in request body' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // Call Groq API
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-405b-reasoning',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Analyze the following resume:\n\n${resumeText}` },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        return new Response(JSON.stringify({ error: `Groq API error: ${groqResponse.status}`, details: errorText }), {
          status: 502,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const data = await groqResponse.json();
      const content = data.choices?.[0]?.message?.content || 'No analysis generated.';

      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal worker error', details: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
