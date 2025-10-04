import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';

const conversation = [];

const API_KEY = 'AIzaSyBpxO0vTaiEcA-GfH_QU05b3v_uqS4dL3M';

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({model:"gemini-2.5-flash-preview-05-20"});

const initialPrompt = "You are a helpful assistant that summarizes emails. Please provide concise and clear summaries of the emails provided to you. Do not say phrases such as 'certainly', 'of course', or 'as an AI language model', output a welcome message, and then wait for the user to input an email to summarize.";

conversation.push({role: "user", parts: {text: initialPrompt}})


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function chat() {

  const result = await model.generateContent({
    contents: conversation
  });

  const summarizedText = result.response.text();

  conversation.push({role: "model", parts: {text: summarizedText}})

  console.log("Gemini: ", summarizedText);
 
  rl.question('User: ', async (newText) => {

    conversation.push({role: "user", parts: {text: newText}})
    
    chat();

 });
}

console.log("Summarize your email with Gemini! Type something below:\n");
await chat();

