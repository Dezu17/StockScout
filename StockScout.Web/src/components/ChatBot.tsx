import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@fluentui/react-components';
import {
  Send24Regular,
  Dismiss24Regular,
  Chat24Filled,
  Bot24Regular,
  Person24Regular,
} from '@fluentui/react-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '../styles/ChatBot.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
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

      setMessages((prev) => [...prev, { role: 'assistant', content: text, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
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
      <button
        className={`fabButton ${isOpen ? 'fabOpen' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Open chat'}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="fabIcon">{isOpen ? <Dismiss24Regular /> : <Chat24Filled />}</span>
      </button>

      <div className={`chatContainer ${isOpen ? 'chatOpen' : ''}`}>
        <div className="chatHeader">
          <div className="chatHeaderContent">
            <div className="chatHeaderIcon">
              <Bot24Regular />
            </div>
            <div className="chatHeaderText">
              <span className="chatHeaderTitle">StockScout Assistant</span>
              <span className="chatHeaderSubtitle">Powered by Gemini AI</span>
            </div>
          </div>
          <button
            className="chatCloseButton"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <Dismiss24Regular />
          </button>
        </div>

        <div className="messagesContainer">
          {messages.length === 0 && (
            <div className="welcomeContainer">
              <div className="welcomeIcon">
                <Bot24Regular />
              </div>
              <h3 className="welcomeTitle">Welcome to StockScout!</h3>
              <p className="welcomeText">
                I&apos;m your AI assistant. Ask me anything about stocks, market trends, or your
                portfolio.
              </p>
              <div className="suggestedQuestions">
                <button
                  className="suggestionChip"
                  onClick={() => setInput('What stocks are trending today?')}
                >
                  Trending stocks
                </button>
                <button
                  className="suggestionChip"
                  onClick={() => setInput('How do I analyze a stock?')}
                >
                  How to analyze
                </button>
                <button className="suggestionChip" onClick={() => setInput('Explain market cap')}>
                  What is market cap?
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`messageWrapper ${msg.role === 'user' ? 'userWrapper' : 'assistantWrapper'}`}
            >
              <div
                className={`messageAvatar ${msg.role === 'user' ? 'userAvatar' : 'assistantAvatar'}`}
              >
                {msg.role === 'user' ? <Person24Regular /> : <Bot24Regular />}
              </div>
              <div
                className={`messageBubble ${msg.role === 'user' ? 'userMessage' : 'assistantMessage'}`}
              >
                <div className="messageContent">{msg.content}</div>
                <div className="messageTime">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="messageWrapper assistantWrapper">
              <div className="messageAvatar assistantAvatar">
                <Bot24Regular />
              </div>
              <div className="messageBubble assistantMessage">
                <div className="typingIndicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
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
            placeholder="Ask me anything..."
            disabled={loading}
          />
          <button
            className={`sendButton ${!loading && input.trim() ? 'sendButtonActive' : ''}`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <Send24Regular />
          </button>
        </div>
      </div>
    </>
  );
};
