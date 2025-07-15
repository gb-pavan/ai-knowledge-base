import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { generateAnswer } from '@/lib/gemini';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const chatSchema = z.object({
  question: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log('Processing chat request...');
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, sessionId } = chatSchema.parse(body);

    const db = await getDatabase();

    // Search for relevant articles
    const relevantArticles = await db
      .collection('articles')
      .find({
        isPublished: true,
        $or: [
          { title: { $regex: question, $options: 'i' } },
          { content: { $regex: question, $options: 'i' } },
          { tags: { $elemMatch: { $regex: question, $options: 'i' } } },
        ],
      })
      .limit(3)
      .toArray();

    // Prepare context for AI
    // const context = relevantArticles.map(
    //   (article) => `${article.title}\n${article.content}`
    // );

    const context = [
  `Article: Password Reset
If you forgot your password, go to the login page and click "Forgot Password".
An email will be sent to your registered address with a reset link.`,

  `Article: Update Profile
To update your profile information, navigate to your account settings.
From there, you can edit your name, profile picture, and contact details.`,

  `Article: Subscription Plans
We offer Free, Pro, and Enterprise plans.
Pro users get access to advanced analytics, while Enterprise users receive dedicated support.`,

  `Article: Cancel Subscription
To cancel your subscription, go to Billing → Manage Plan → Cancel.
You'll retain access until the end of your billing cycle.`,
];

    // Generate AI answer
    const answer = await generateAnswer(question, context);

    // Save chat message
    // Use session.user.email as unique identifier (adjust if you use another field)
    const chatMessage = {
      userId: session.user.email,
      question,
      answer,
      articleIds: relevantArticles.map((a) => a._id.toString()),
      isFavorite: false,
      createdAt: new Date(),
    };

    const messageResult = await db.collection('chat_messages').insertOne(chatMessage);

    // Update or create chat session
    if (sessionId) {
      let sessionObjectId: ObjectId;
      try {
        sessionObjectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
      }
      await db.collection('chat_sessions').updateOne(
        { _id: sessionObjectId, userId: session.user.email },
        {
          $addToSet: { messages: messageResult.insertedId },
          $set: { updatedAt: new Date() },
        }
      );
    } else {
      const newSession = {
        userId: session.user.email,
        title: question.slice(0, 50) + (question.length > 50 ? '...' : ''),
        messages: [messageResult.insertedId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('chat_sessions').insertOne(newSession);
    }

    return NextResponse.json({
      messageId: messageResult.insertedId.toString(),
      answer,
      relevantArticles: relevantArticles.map((a) => ({
        id: a._id.toString(),
        title: a.title,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}