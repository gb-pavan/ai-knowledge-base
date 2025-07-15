import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const feedbackSchema = z.object({
  messageId: z.string(),
  rating: z.enum(['positive', 'negative']),
  comment: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, rating, comment } = feedbackSchema.parse(body);

    const db = await getDatabase();

    // Check if message exists and belongs to user
    const message = await db.collection('chat_messages').findOne({
      _id: new ObjectId(messageId),
      userId: session.user.id,
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if feedback already exists
    const existingFeedback = await db.collection('feedback').findOne({
      messageId: new ObjectId(messageId),
      userId: session.user.id,
    });

    if (existingFeedback) {
      // Update existing feedback
      await db.collection('feedback').updateOne(
        { _id: existingFeedback._id },
        {
          $set: {
            rating,
            comment,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new feedback
      const feedback = {
        messageId: new ObjectId(messageId),
        userId: session.user.id,
        rating,
        comment,
        createdAt: new Date(),
      };

      await db.collection('feedback').insertOne(feedback);
    }

    return NextResponse.json({ message: 'Feedback saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}