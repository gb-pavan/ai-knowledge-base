import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('ai-knowledge-base');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);
    
    // Create test users
    const users = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user@example.com',
        name: 'Regular User',
        password: userPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    // Check if users already exist
    for (const user of users) {
      const existingUser = await db.collection('users').findOne({ email: user.email });
      
      if (!existingUser) {
        await db.collection('users').insertOne(user);
        console.log(`✅ Created ${user.role} user: ${user.email}`);
      } else {
        console.log(`⚠️  User already exists: ${user.email}`);
      }
    }
    
    // Create sample articles
    const articles = [
      {
        title: 'Getting Started with AI Knowledge Base',
        content: `# Getting Started

Welcome to our AI-powered knowledge base! This guide will help you understand how to use the system effectively.

## For Users
- Ask questions in natural language
- Rate responses to help improve the system
- View your chat history and favorites

## For Administrators
- Create and manage knowledge articles
- View analytics and user feedback
- Monitor system performance

## Features
- **AI-Powered Responses**: Get intelligent answers based on our knowledge base
- **Real-time Chat**: Interactive conversation interface
- **Feedback System**: Help us improve by rating responses
- **Role-Based Access**: Different features for users and administrators`,
        summary: 'A comprehensive guide to using the AI knowledge base system for both users and administrators.',
        tags: ['getting-started', 'guide', 'tutorial', 'basics'],
        authorId: 'system',
        isPublished: true,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'How to Reset Your Password',
        content: `# Password Reset Guide

If you've forgotten your password, follow these simple steps to reset it:

## Steps to Reset Password

1. **Go to Sign In Page**: Navigate to the sign-in page
2. **Click "Forgot Password"**: Look for the forgot password link
3. **Enter Your Email**: Provide the email address associated with your account
4. **Check Your Email**: Look for a password reset email in your inbox
5. **Follow the Link**: Click the reset link in the email
6. **Create New Password**: Enter and confirm your new password

## Security Tips
- Use a strong password with at least 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Don't reuse passwords from other accounts
- Consider using a password manager

## Still Having Issues?
If you continue to have problems resetting your password, please contact our support team.`,
        summary: 'Step-by-step instructions for resetting your account password securely.',
        tags: ['password', 'reset', 'security', 'account', 'help'],
        authorId: 'system',
        isPublished: true,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Understanding AI Responses',
        content: `# How Our AI System Works

Our AI assistant uses advanced language models to provide accurate, contextual responses to your questions.

## How It Works

### 1. Question Processing
When you ask a question, our system:
- Analyzes your query for intent and context
- Searches our knowledge base for relevant articles
- Identifies the most appropriate information sources

### 2. Response Generation
The AI then:
- Combines relevant information from multiple sources
- Generates a coherent, helpful response
- Provides references to source articles when applicable

### 3. Continuous Learning
Our system improves through:
- User feedback and ratings
- Regular updates to the knowledge base
- Machine learning optimization

## Best Practices for Questions
- Be specific and clear in your questions
- Use natural language - no need for special formatting
- Ask follow-up questions if you need clarification
- Rate responses to help improve the system

## Limitations
- Responses are based on our current knowledge base
- The AI may not have information on very recent topics
- For complex issues, consider contacting human support`,
        summary: 'Explanation of how the AI system processes questions and generates intelligent responses.',
        tags: ['ai', 'how-it-works', 'responses', 'technology', 'explanation'],
        authorId: 'system',
        isPublished: true,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    // Insert sample articles
    for (const article of articles) {
      const existingArticle = await db.collection('articles').findOne({ title: article.title });
      
      if (!existingArticle) {
        await db.collection('articles').insertOne(article);
        console.log(`✅ Created article: ${article.title}`);
      } else {
        console.log(`⚠️  Article already exists: ${article.title}`);
      }
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('👨‍💼 Admin User:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n👤 Regular User:');
    console.log('   Email: user@example.com');
    console.log('   Password: user123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase().catch(console.error);