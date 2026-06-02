import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

// Fallback simulator for offline/sandbox mode when API key is not configured
const getSimulatedResponse = (prompt: string) => {
  const query = prompt.toLowerCase();
  
  if (query.includes('javascript') || query.includes('js') || query.includes('web')) {
    return `### 💡 JavaScript Web Servers & Async Concepts

**Explanation:**
JavaScript is a single-threaded language, meaning it executes one command at a time. However, it manages concurrent operations (like fetching data or running web servers) using an **Event Loop**. This lets it handle thousands of connection requests asynchronously without blocking.

**Code Example:**
\`\`\`javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from StudentFlow Local Server!\\n');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
\`\`\`

**Study Tips:**
*   **Key Concept:** Master the difference between **Promises**, **Async/Await**, and older callbacks.
*   **Resource:** Read "Eloquent JavaScript" Chapter 11 on asynchronous programming.
*   **Practice:** Try adding query parameter parsing to the server above using the \`url\` module.`;
  }

  if (query.includes('calculus') || query.includes('limit') || query.includes('derivative') || query.includes('integral') || query.includes('math')) {
    return `### 📐 Calculus - Integration by Parts

**Explanation:**
Integration by parts is a key method in calculus to integrate the product of two functions. It is derived directly from the **Product Rule** of differentiation:
$$\\int u \\, dv = uv - \\int v \\, du$$

To choose which function is $u$ and which is $dv$, use the **LIATE** rule:
1.  **L**ogarithmic functions
2.  **I**nverse trigonometric functions
3.  **A**lgebraic functions
4.  **T**rigonometric functions
5.  **E**xponential functions

**Example Solution:**
Integrate $\\int x e^x \\, dx$:
*   Let $u = x$ (algebraic) $\\implies du = dx$
*   Let $dv = e^x \\, dx$ (exponential) $\\implies v = e^x$
*   Applying the formula:
    $$\\int x e^x \\, dx = x e^x - \\int e^x \\, dx = x e^x - e^x + C$$

**Study Tips:**
*   **Common Trap:** Forgetting the constant of integration ($+ C$) for indefinite integrals.
*   **Practice:** Try integrating $\\int x \\ln(x) \\, dx$ using LIATE, choosing $u = \\ln(x)$.`;
  }

  if (query.includes('database') || query.includes('sql') || query.includes('schema') || query.includes('db')) {
    return `### 🗄️ Relational Database Management & SQL Keys

**Explanation:**
Relational databases organize data into rows and columns within tables. Key concepts include:
*   **Primary Key (PK):** A column that uniquely identifies each row in a table.
*   **Foreign Key (FK):** A column that references the PK of another table, enforcing relationships.

**SQL Schema Example:**
\`\`\`sql
-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(15) UNIQUE
);

-- Create assignments referencing subjects
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE
);
\`\`\`

**Study Tips:**
*   **Referential Integrity:** Always configure your foreign keys with delete cascades if deleting a parent subject should clean up child assignments.
*   **Performance:** Index foreign keys for faster join queries when datasets scale.`;
  }

  // General Academic Assistant answer fallback
  return `### 🎓 StudentFlow Study Support Assistant

**Explanation:**
This is the StudentFlow Academic Assistant. I can help explain complex topics, provide programming/mathematical code examples, and compile study cards.

*Note: The Gemini API Key is not set in environmental variables, so you are currently interacting with the Simulated Local Assistant.*

**Generic Study Guidelines:**
1.  **Active Recall:** Rather than re-reading notes, test yourself by summarizing topics from memory.
2.  **Feynman Technique:** Try explaining the concept in the simplest terms possible as if teaching a child. If you get stuck, look at your notes to patch the gaps.
3.  **Spaced Repetition:** Review the material 1 day, 3 days, 7 days, and 14 days after learning it to lock it in long-term memory.

**Study Tips:**
*   Ask me about **JavaScript Web Servers**, **Calculus limits**, or **Database schemas** to view customized interactive explanations!`;
};

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!apiKey) {
      // Simulate slow network response for realism
      await new Promise((resolve) => setTimeout(resolve, 800));
      const simulatedText = getSimulatedResponse(prompt);
      return NextResponse.json({ text: simulatedText });
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash which is standard and fast
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are the StudentFlow Academic AI Assistant. Your goal is to help college students with academic topics.
    Structure your answer clearly, including:
    1. A simple explanation of the concept.
    2. Realistic examples (with code snippets or math formulas where applicable).
    3. Custom study tips or common pitfalls to watch out for.
    Always format your response using clean Markdown with clear headings.`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
