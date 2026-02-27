import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Input,
  makeStyles,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const useStyles = makeStyles({
  fabButton: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    fontSize: '24px',
    zIndex: 1000,
    boxShadow: tokens.shadow16,
  },
  chatContainer: {
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    width: '360px',
    height: '480px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow28,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusMedium,
    maxWidth: '80%',
    wordBreak: 'break-word',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    padding: '8px 12px',
    borderRadius: tokens.borderRadiusMedium,
    maxWidth: '80%',
    wordBreak: 'break-word',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  input: {
    flex: 1,
  },
});

export const Chatbot: React.FC = () => {
  const styles = useStyles();
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
        className={styles.fabButton}
        appearance="primary"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </Button>

      {isOpen && (
        <div className={styles.chatContainer}>
          <div className={styles.header}>StockScout Assistant</div>
          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.assistantMessage}>
                Hi! I am your StockScout assistant. How can I help you today?
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className={styles.assistantMessage}>
                <Spinner size="tiny" label="Thinking..." />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputContainer}>
            <Input
              className={styles.input}
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
