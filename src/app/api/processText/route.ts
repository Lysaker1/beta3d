import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import dotenv from 'dotenv';


dotenv.config();

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the prompt template for generating Rhino Python scripts
const SYSTEM_PROMPT = `You are an expert in Rhino3D and Python scripting. Generate ONLY a valid Python script (no explanations) that uses rhinoscriptsyntax to create 3D geometry. The script should:
1. Start with 'import rhinoscriptsyntax as rs'
2. Contain only valid Python code
3. Not include any comments or explanations
4. Focus on creating geometric objects and transformations`;

function extractPythonScript(response: string): string {
  // Look for code between triple backticks
  const matches = response.match(/```python\n([\s\S]*?)```/);
  if (matches && matches[1]) {
    return matches[1].trim();
  }
  // If no backticks, assume the whole response is code
  return response.trim();
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    console.log("Received text:", text);

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Generate Python script using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    console.log("OpenAI Response:", completion.choices[0].message.content);
    // Extract and clean up the Python script
    const rawResponse = completion.choices[0].message.content;
    const pythonScript = extractPythonScript(rawResponse || '');
    console.log("Raw OpenAI Response:", rawResponse);
    console.log("Cleaned Python Script:", pythonScript);

    
    console.log("Cleaned Python Script:", pythonScript);

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}