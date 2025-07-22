import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { generateTags, generateSummary } from '@/lib/gemini';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isPublished: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  console.log('Fetching articles...');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('published') === 'true';

    const db = await getDatabase();
    
    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (isPublished !== undefined) {
      filter.isPublished = isPublished;
    }

    const articles = await db
      .collection('articles')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('articles').countDocuments(filter);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('Creating article...');
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);
    // Generate AI tags and summary
    const tags = await generateTags(validatedData.content);
    const summary = await generateSummary(validatedData.content);

    const db = await getDatabase();
    const article = {
      ...validatedData,
      tags,
      summary,
      authorId: session.user.id,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('articles').insertOne(article);

    return NextResponse.json({
      message: 'Article created successfully',
      articleId: result.insertedId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   console.log('Creating article...');
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user || session.user.role !== 'admin') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const validatedData = createArticleSchema.parse(body);

//     // Generate AI tags and summary (with error handling)
//     let tags: string[] = [];
//     let summary = '';

//     try {
//       tags = await generateTags(validatedData.content);
//       summary = await generateSummary(validatedData.content);
//     } catch (aiError) {
//       console.error('⚠️ Gemini API failed:', aiError);
//       // Use fallback values
//       tags = [];
//       summary = 'Summary could not be generated.';
//     }

//     const db = await getDatabase();
//     const article = {
//       ...validatedData,
//       tags,
//       summary,
//       authorId: session.user.id,
//       viewCount: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     const result = await db.collection('articles').insertOne(article);

//     return NextResponse.json({
//       message: 'Article created successfully',
//       articleId: result.insertedId,
//     });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Validation error', details: error.errors },
//         { status: 400 }
//       );
//     }
//     console.error('❌ Error creating article:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
