import { ChatInterface } from '@/components/chat/chat-interface';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions and get intelligent answers from our knowledge base
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
}