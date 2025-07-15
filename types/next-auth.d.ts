// types/next-auth.d.ts or just next-auth.d.ts

import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // or: 'admin' | 'user' if you want fixed types
    };
  }

  interface JWT {
    role?: string | null;
  }
}
