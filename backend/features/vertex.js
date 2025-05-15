const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI
} = require('@google-cloud/vertexai');
const path = require('path');

// Configure these based on your environment
const project = process.env.GOOGLE_CLOUD_PROJECT || 'genai-demo-442319';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const textModel = 'gemini-1.5-flash-002';

// Authentication setup
let vertexAI;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Using explicit credentials file path from environment variable
    console.log(`Using credentials from: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    vertexAI = new VertexAI({project: project, location: location});
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Try to parse as JSON string first
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      vertexAI = new VertexAI({
        project: project, 
        location: location,
        credentials: credentials
      });
      console.log('Using credentials from environment variable JSON content');
    } catch (jsonError) {
      // If parsing fails, try to read it as a file path
      const fs = require('fs');
      try {
        const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        console.log(`Trying to read credentials from file: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const credentials = JSON.parse(fileContent);
        vertexAI = new VertexAI({
          project: project,
          location: location,
          credentials: credentials
        });
        console.log('Using credentials from file referenced in GOOGLE_APPLICATION_CREDENTIALS_JSON');
      } catch (fileError) {
        console.error('Error reading credentials file:', fileError.message);
        throw new Error(`Could not parse JSON or read credential file: ${jsonError.message}, ${fileError.message}`);
      }
    }
  } else {
    // Default authentication - will use ADC (Application Default Credentials)
    // Useful when running on Google Cloud or using gcloud CLI authentication
    console.log('Using default authentication');
    vertexAI = new VertexAI({project: project, location: location});
  }
} catch (error) {
  console.error('Error initializing Vertex AI:', error);
  throw new Error(`Failed to initialize Google Cloud authentication: ${error.message}`);
}

const generativeModel = vertexAI.getGenerativeModel({
    model: textModel,
    safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
    generationConfig: {maxOutputTokens: 256},
    systemInstruction: {
      role: 'system',
      parts: [{"text": `You are a helpful agent that need to categorize the user input into one of the following phases of the menstrual cycle:
        1. Mestruation
        2. Follicular
        3. Ovulation
        4. Luteal
        The user input is a task description. You need to categorize the task into one of the above phases based on when it's better to do it.
        You need to return the category number only. Do not add any other text.
        For example, if the user input is "Go to the gym", you need to categorize it into one of the above phases based on when it's better to do it.`
      }]
    },
});

async function categorize(task) {
  try {
    const user_text = 'The user input is: ' + task;

    const request = {
      contents: [{role: 'user', parts: [{text: user_text}]}],
    };

    const result = await generativeModel.generateContent(request);
    const response = result.response;
    console.log('Response: ', JSON.stringify(response));
    
    // Extract and return the actual response text
    const responseText = response.candidates[0].content.parts[0].text.trim();
    console.log('Categorized response: ', responseText);
    return responseText;
  } catch (error) {
    console.error('Error during categorization:', error);
    throw new Error('Failed to categorize task');
  }
}

module.exports = {
  categorize
};