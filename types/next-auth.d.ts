// types/next-auth.d.ts or just next-auth.d.ts

// import NextAuth from 'next-auth';

// declare module 'next-auth' {
//   interface Session {
//     user: {
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       role?: string | null; // or: 'admin' | 'user' if you want fixed types
//     };
//   }

//   interface JWT {
//     role?: string | null;
//   }
// }

// next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    sub?: string; // user ID
  }
}

