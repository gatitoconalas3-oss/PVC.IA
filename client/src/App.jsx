import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message,
        conversationId,
      });

      if (response.data.success) {
        setConversationId(response.data.conversationId);
        const assistantMessage = {
          role: 'assistant',
          content: response.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.details ||
        err.message ||
        'Error al conectar con el servidor. ¿Está corriendo en http://localhost:5000?';
      setError(errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError('');
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h1>🤖 PVC.IA</h1>
            <p>Tu asistente inteligente con tecnología Hugging Face</p>
          </div>
          <button className="new-chat-btn" onClick={handleNewChat}>
            ✨ Nuevo Chat
          </button>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
              <p style={{ fontSize: '48px' }}>👋</p>
              <p>¡Bienvenido! Comienza a escribir tu pregunta...</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>La IA está pensando...</span>
            </div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}

export default App;
