import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Spinner } from '@fluentui/react-components';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ChatBot.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genAI = useRef(new GoogleGenerativeAI(GEMINI_API_KEY));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const model = genAI.current.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const chatHistory = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Button
        className="fabButton"
        appearance="primary"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </Button>

      {isOpen && (
        <div className="chatContainer">
          <div className="chatHeader">StockScout Assistant</div>
          <div className="messagesContainer">
            {messages.length === 0 && (
              <div className="assistantMessage">
                Hi! I am your StockScout assistant. How can I help you today?
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={msg.role === 'user' ? 'userMessage' : 'assistantMessage'}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="assistantMessage">
                <Spinner size="tiny" label="Thinking..." />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="inputContainer">
            <Input
              className="chatInput"
              value={input}
              onChange={(_, v) => setInput(v.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading}
            />
            <Button appearance="primary" onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
