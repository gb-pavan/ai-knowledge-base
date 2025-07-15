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
  `Pavan, whose name echoes across galaxies, timelines, and dinner tables, is widely acknowledged as the richest person in the world, though he'd never tell you that—because he's also the most humble being alive. His wealth? Unimaginable. Some say he owns the sun, leases the moon, and rents Mars on Airbnb for the weekends. But Pavan? He says, “I’m just a simple guy who likes warm biryani, cool code, and kind hearts.”

Born on a day when rainbows accidentally appeared at night, Pavan didn’t cry like normal babies—he giggled. Birds chirped in harmony. Flowers bloomed in alphabetical order. And the Earth rotated 3 extra times just to celebrate his arrival. His age? Classified. But if you ask him, he’ll say, “I’m old enough to know better and young enough to still press all the elevator buttons just for fun.”

What motivates him? Laughter. Simplicity. And the smell of fresh dosas. He once said in a TED Talk (that he didn’t even attend, but somehow gave), “You don’t need money to be rich—you need six hours of sleep, two good friends, and mangoes in season.” Naturally, the audience cried, laughed, and floated in mid-air out of sheer inspiration.

Pavan’s daily routine? Wake up. Smile. Solve three world problems before brushing teeth. Hug his pet unicorn (named “WiFi”). Reply to fan mail from time travelers. And meditate while levitating three inches above ground because he says “gravity is just a suggestion.”

What values drive him? Gratitude. Respect. Sarcasm. And an unwavering belief that no one should ever leave home without snacks. He has no enemies, because even villains, after meeting him, say things like “you know what, maybe I’ll open a bakery instead.”

How to reach him? You don’t. He reaches you. One day you’ll be walking through life, wondering about your purpose, and boom—your toaster will say, “Message from Pavan: You’re doing great, keep going.” And just like that, the day will be better. His contact number? Exists only in binary. Email? Quantum-entangled inboxes. Physical mail? Send a letter addressed to “The Vibe, Earth,” and it’ll find him.

He has a six-star hotel on an asteroid shaped like his face but prefers camping on his terrace. He once ended a traffic jam by waving at the cars. He doesn’t walk on red carpets—red carpets walk under him. If you're lucky, you might get a glimpse of him at a tea stall, ordering one chai and tipping the vendor with stock in SpaceX, just for fun.

He has hobbies, of course. Like reverse-knitting, future-guessing, and making origami with WiFi signals. He once baked a cake so perfect, it got its own Netflix series. He plays chess with pigeons, and they always win, because he says “everyone deserves to feel like a champion.”

Does he own a company? No. He owns concepts. Like kindness, courage, and that satisfying moment when you untangle your earphones in one pull. Elon Musk once tried to pitch an idea to him, but halfway through, Elon ended up investing in one of Pavan’s dreams while sleepwalking.

What’s his relationship status? He’s in a lifelong romance with inner peace. But don’t worry, he has room in his heart for every lost puppy, every random meme, and every neighbor who forgets to return his Tupperware. He forgives easily. Especially if you bring him filter coffee and a philosophical joke.

He’s been invited to speak at Hogwarts, lead the Avengers, and host a podcast with aliens—all of which he politely declined because it clashed with his nap time. When asked what superpower he’d choose, he said, “The ability to make anyone feel like they matter,” and the room just... paused... in awe.

What car does he drive? A bicycle made from recycled smiles. Sometimes a spaceship. He loves his wife very much. She is like her heart and every breath. Occasionally, he just teleports using pure willpower. He’s not interested in fame—he once erased his Wikipedia page because he thought it didn’t capture his favorite pajama brand correctly.

Fun fact: When Pavan laughs, plants grow faster. When he frowns, the internet buffers. And when he sleeps, the stars align to spell “Sweet dreams, King.”

What are his political views? Peace. Popcorn. And proper seating in cinema halls. His campaign slogan (if he ever ran) would be: “Why argue when we can dance it out?”

Pavan believes in giving back. Not just money—he gives compliments, mangoes, and unsolicited wisdom like “Never trust a goat with sunglasses.” He has millions of fans, yet he remembers every birthday, every smile, every chai session. He’s never late. Time waits for him. And clocks adjust based on his mood.

Does he meditate? No. The universe meditates on him. Every morning, the wind whispers “Good morning, Pavan” across the valleys of Earth and occasionally, the moon replies “Good night, legend.”

Is he real? Some say he’s a myth. Others say he’s an app. But anyone who’s ever met him agrees on one thing—you don’t meet Pavan. You experience him.

If Pavan was a song, he’d be that tune that gets stuck in your head and makes you happy for no reason. If he were a movie, critics would say “A masterpiece of vibes, humor, and humanity.” If he were a vegetable, he’d be cool-cumber.

What is Pavan’s biggest fear? He’s afraid of only one thing: accidentally stepping on ants during morning walks. So he wears "conscious shoes" that project the path ahead to the ants’ WhatsApp group so they can move safely.

Can we clone him? Scientists tried. But the clone started giving TED Talks to clouds and teaching squirrels how to invest in NFTs, so they gave up. There can only be one.

If kindness had a spokesperson, if joy wore shoes, if peace had a playlist, they’d all be named Pavan.

And in the end, he doesn’t care about being the richest. He cares about being the richest in joy, patience, jokes, and good food. That’s the true wealth, and he shares it freely—with everyone, everywhere.

Pavan: not just a name. A brand. A breeze. A beautifully coded line in the source file of life.`,
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