import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  MessageSquare,
  Shield,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Answers',
      description: 'Get intelligent, context-aware responses powered by advanced AI technology.',
    },
    {
      icon: MessageSquare,
      title: 'Interactive Chat',
      description: 'Natural conversation interface with chat history and favorites.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure authentication with admin and user roles for different access levels.',
    },
    {
      icon: Zap,
      title: 'Real-time Feedback',
      description: 'Rate responses and provide feedback to continuously improve the system.',
    },
    {
      icon: Users,
      title: 'Admin Dashboard',
      description: 'Comprehensive admin panel for managing articles, users, and analytics.',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track usage patterns, popular questions, and system performance.',
    },
  ];

  const benefits = [
    'Instant answers to frequently asked questions',
    'Reduced support ticket volume',
    'AI-generated tags and summaries',
    'Multi-device responsive design',
    'Advanced security and rate limiting',
    'Comprehensive feedback system',
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Knowledge Base
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Intelligent FAQ Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your knowledge base with AI-powered responses, intelligent search, 
            and comprehensive admin tools for modern support teams.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/chat">
            <Button size="lg" className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Start Chatting</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build and manage an intelligent knowledge base system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 rounded-lg p-8 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose Our Platform?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for modern teams who need intelligent, scalable knowledge management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of teams using our AI-powered knowledge base to improve 
            customer support and team productivity.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg" className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Get Started Free</span>
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline" size="lg">
              Try Demo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}