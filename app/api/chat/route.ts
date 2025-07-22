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
    console.log('Parsed question:', question);

    const db = await getDatabase();
console.log('DB name:', db.databaseName); // should be faqAI

const collections = await db.listCollections().toArray();
console.log('Collections:', collections.map(c => c.name));

const test = await db.collection('articles').findOne();
console.log('Sample article:', test);

    // console.log('Database connected:',db, collections.map(c => c.name));

    // Search for relevant articles
    // const relevantArticles = await db
    //   .collection('articles')
    //   .find({
    //     isPublished: true,
    //     $or: [
    //       { title: { $regex: question, $options: 'i' } },
    //       { content: { $regex: question, $options: 'i' } },
    //       { tags: { $elemMatch: { $regex: question, $options: 'i' } } },
    //     ],
    //   })
    //   .limit(3)
    //   .toArray();

    const keywords = question.split(/\s+/).filter(Boolean);
const regexes = keywords.map((word) => new RegExp(word, 'i'));

const relevantArticles = await db
  .collection('articles')
  .find({
    isPublished: true,
    $or: [
      { title: { $in: regexes } },
      { content: { $in: regexes } },
      { tags: { $elemMatch: { $in: regexes } } },
    ],
  })
  .limit(3)
  .toArray();


      console.log('Relevant articles found:', relevantArticles.length);

    // Prepare context for AI
    const context = relevantArticles.map(
      (article) => `${article.title}\n${article.content}`
    );
    console.log('Context for AI:', context);

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