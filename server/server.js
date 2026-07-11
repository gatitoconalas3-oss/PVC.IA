import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HfInference } from '@huggingface/inference';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Hugging Face
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Conversation history stored in memory
const conversations = new Map();

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty',
      });
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API key not configured',
        details: 'HUGGINGFACE_API_KEY is not set in .env file',
      });
    }

    const newConversationId = conversationId || Date.now().toString();

    // Get or create conversation history
    if (!conversations.has(newConversationId)) {
      conversations.set(newConversationId, []);
    }

    const history = conversations.get(newConversationId);

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Build conversation context
    let conversationText = '';
    for (const msg of history) {
      conversationText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }
    conversationText += 'Assistant: ';

    // Call Hugging Face API
    const response = await hf.textGeneration({
      model: 'gpt2',
      inputs: conversationText,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    const assistantMessage = response.generated_text
      .slice(conversationText.length)
      .trim();

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });

    // Limit conversation history to last 10 exchanges
    if (history.length > 20) {
      history.splice(0, 2);
    }

    res.json({
      success: true,
      response: assistantMessage,
      conversationId: newConversationId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing your request',
      details: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PVC.IA API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat`);
});