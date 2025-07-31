import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { OpenRouterService } from '../services/aiService';
import { Block, Build } from '../types/Block';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

interface AIBuildChatProps {
  isOpen: boolean;
  onClose: () => void;
  availableBlocks: Block[];
  build: Build;
  onApplyBuild: (instructions: any[], explanation: string) => void;
  getBlockById: (id: number) => Block | undefined;
}

export const AIBuildChat: React.FC<AIBuildChatProps> = ({
  isOpen,
  onClose,
  availableBlocks,
  build,
  onApplyBuild,
  getBlockById
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: 'Welcome to AI Build Assistant! Describe what you want to build and I\'ll create it layer by layer. For example: "Build a small medieval tower" or "Create a modern house with a garden".',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = (key: string) => {
    localStorage.setItem('openrouter_api_key', key);
    setApiKey(key);
    setShowApiKeyInput(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiService = new OpenRouterService(apiKey);
      const result = await aiService.generateBuildInstructions(
        userMessage.content,
        availableBlocks,
        { 
          width: build.width,
          height: build.height,
          layers: build.layers.length
        },
        {
          width: build.width,
          height: build.height,
          layers: build.layers.map(layer => ({
            name: layer.name,
            blocks: layer.blocks,
            visible: layer.visible
          }))
        }
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.explanation,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Apply the build instructions
      if (result.instructions.length > 0) {
        onApplyBuild(result.instructions, result.explanation);
        
        const systemMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'system', 
          content: `✅ Applied ${result.instructions.length} block placements to your build!`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to generate build'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">AI Build Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="p-4 bg-yellow-900/20 border-b border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">OpenRouter API Key Required</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter your OpenRouter API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => saveApiKey(apiKey)}
                disabled={!apiKey.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">openrouter.ai</a>
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${message.type === 'user' 
                  ? 'bg-blue-600' 
                  : message.type === 'ai'
                  ? 'bg-purple-600'
                  : 'bg-gray-600'
                }
              `}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : message.type === 'ai' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className={`
                max-w-[70%] p-3 rounded-lg
                ${message.type === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : message.type === 'ai'
                  ? 'bg-purple-600/20 border border-purple-500/30'
                  : 'bg-gray-700/50 border border-gray-600/30'
                }
              `}>
                <div className="text-white text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-purple-600/20 border border-purple-500/30 p-3 rounded-lg">
                <div className="text-white text-sm">
                  AI is designing your build...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-600">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to build... (e.g., 'a small castle with towers')"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              rows={2}
              disabled={isLoading || !apiKey}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !apiKey}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Build dimensions: {build.width}×{build.height}×{build.layers.length} • Available blocks: {availableBlocks.length}
          </div>
        </div>
      </div>
    </div>
  );
};