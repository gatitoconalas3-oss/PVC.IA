import './ChatMessage.css';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-content ${isUser ? 'user-content' : 'assistant-content'}`}>
        {!isUser && <span className="assistant-avatar">🤖</span>}
        <div className="message-text">{message.content}</div>
        {isUser && <span className="user-avatar">👤</span>}
      </div>
    </div>
  );
}

export default ChatMessage;
