import { useState } from 'react';
import './ChatInput.css';

function ChatInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje aquí... (Enter para enviar, Shift+Enter para nueva línea)"
          disabled={disabled}
          rows="1"
        />
        <button type="submit" className="send-btn" disabled={disabled}>
          {disabled ? '⏳' : '📤'}
        </button>
      </div>
    </form>
  );
}

export default ChatInput;
