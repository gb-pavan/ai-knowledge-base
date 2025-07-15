"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Bot,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  question: string;
  answer: string;
  isUser: boolean;
  timestamp: Date;
  relevantArticles?: Array<{ id: string; title: string }>;
}

interface FeedbackDialogProps {
  messageId: string;
  onFeedbackSubmit: (messageId: string, rating: 'positive' | 'negative', comment?: string) => void;
}

function FeedbackDialog({ messageId, onFeedbackSubmit }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    
    setIsSubmitting(true);
    try {
      await onFeedbackSubmit(messageId, rating, comment);
      setIsOpen(false);
      setRating(null);
      setComment('');
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate this response</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={rating === 'positive' ? 'default' : 'outline'}
              onClick={() => setRating('positive')}
              className="flex-1"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Helpful
            </Button>
            <Button
              variant={rating === 'negative' ? 'default' : 'outline'}
              onClick={() => setRating('negative')}
              className="flex-1"
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Not helpful
            </Button>
          </div>
          
          <Textarea
            placeholder="Tell us more about your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!rating || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ChatInterface() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      question: inputValue,
      answer: '',
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const botMessage: Message = {
        id: data.messageId,
        question: inputValue,
        answer: data.answer,
        isUser: false,
        timestamp: new Date(),
        relevantArticles: data.relevantArticles,
      };

      setMessages(prev => [...prev, botMessage]);
      const answerText = data.answer;
    let currentText = '';
    let index = 0;

    const typingInterval = setInterval(() => {
      if (index < answerText.length) {
        currentText += answerText[index++];
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessage.id ? { ...msg, answer: currentText } : msg
          )
        );
      } else {
        clearInterval(typingInterval);
      }
    }, 20); // Speed of typing (milliseconds per character)
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      throw error;
    }
  };

  const toggleFavorite = (messageId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(messageId)) {
        newFavorites.delete(messageId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(messageId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-6 text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to chat</h3>
          <p className="text-muted-foreground">
            Please sign in to start chatting with our AI assistant.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <Badge variant="secondary">Online</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ask me anything about our knowledge base
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Chat</h3>
                <p className="text-muted-foreground">
                  Start by asking a question about our knowledge base.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!message.isUser && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div className={`flex-1 max-w-[80%] ${message.isUser ? 'order-2' : ''}`}>
                  <Card className={`${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <CardContent className="p-3">
                      {message.isUser ? (
                        <p className="text-sm">{message.question}</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>
                              {message.answer}
                            </ReactMarkdown>
                          </div>
                          
                          {message.relevantArticles && message.relevantArticles.length > 0 && (
                            <div className="space-y-2">
                              <Separator />
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Related articles:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {message.relevantArticles.map((article) => (
                                    <Badge key={article.id} variant="outline" className="text-xs">
                                      {article.title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {!message.isUser && (
                    <div className="flex items-center space-x-2 mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(message.id)}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  favorites.has(message.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : ''
                                }`} 
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {favorites.has(message.id) ? 'Remove from favorites' : 'Add to favorites'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <FeedbackDialog
                        messageId={message.id}
                        onFeedbackSubmit={handleFeedback}
                      />

                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {message.isUser && (
                  <div className="flex-shrink-0 order-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        AI is thinking...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}