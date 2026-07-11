import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (puedes cambiar por DB later)
const conversations = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// POST /api/chat - Enviar mensaje a la IA
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'API key de Hugging Face no configurada' });
    }

    const currentConvId = conversationId || uuidv4();

    // Obtener historial o crear uno nuevo
    if (!conversations.has(currentConvId)) {
      conversations.set(currentConvId, []);
    }

    const history = conversations.get(currentConvId);
    history.push({ role: 'user', content: message });

    // Llamar a Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        inputs: message,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
        },
      }
    );

    let aiResponse = '';

    if (Array.isArray(response.data) && response.data.length > 0) {
      aiResponse = response.data[0].generated_text || 'No se pudo generar respuesta';
    } else if (response.data && response.data.generated_text) {
      aiResponse = response.data.generated_text;
    } else {
      aiResponse = 'Error procesando la respuesta de la IA';
    }

    // Guardar respuesta en historial
    history.push({ role: 'assistant', content: aiResponse });

    res.json({
      success: true,
      response: aiResponse,
      conversationId: currentConvId,
      messageCount: history.length,
    });
  } catch (error) {
    console.error('Error en /api/chat:', error.message);
    res.status(500).json({
      error: 'Error al procesar el mensaje',
      details: error.message,
    });
  }
});

// GET /api/conversations/:id - Obtener historial de conversación
app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;

  if (!conversations.has(id)) {
    return res.status(404).json({ error: 'Conversación no encontrada' });
  }

  const history = conversations.get(id);
  res.json({
    conversationId: id,
    messages: history,
    messageCount: history.length,
  });
});

// DELETE /api/conversations/:id - Eliminar conversación
app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;

  if (!conversations.has(id)) {
    return res.status(404).json({ error: 'Conversación no encontrada' });
  }

  conversations.delete(id);
  res.json({ success: true, message: 'Conversación eliminada' });
});

// GET /api/conversations - Listar todas las conversaciones (solo IDs)
app.get('/api/conversations', (req, res) => {
  const conversationIds = Array.from(conversations.keys());
  res.json({
    total: conversationIds.length,
    conversations: conversationIds,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor running en http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});
