import React from 'react';
import './ChatMessage.css';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-container ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <p>{message.content}</p>
      </div>
    </div>
  );
}

export default ChatMessage;