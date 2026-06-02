import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import VerificationCode from "@/models/VerificationCode";

const MAX_CODE_ATTEMPTS = 5;

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }
    }),
    CredentialsProvider({
      id: "email-code",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials): Promise<AuthUser | null> {
        const email = credentials?.email?.trim().toLowerCase();
        const code = credentials?.code?.trim();
        if (!email || !code) {
          throw new Error("Missing email or code");
        }
        if (!/^\d{6}$/.test(code)) {
          throw new Error("Invalid code format");
        }

        await connectToDatabase();

        const record = await VerificationCode.findOne({
          email,
          consumed: false,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!record) {
          throw new Error("Code expired or not requested");
        }

        if (record.attempts >= MAX_CODE_ATTEMPTS) {
          await VerificationCode.updateOne(
            { _id: record._id },
            { $set: { consumed: true } }
          );
          throw new Error("Too many attempts");
        }

        const matches = await bcrypt.compare(code, record.codeHash);
        if (!matches) {
          await VerificationCode.updateOne(
            { _id: record._id },
            { $inc: { attempts: 1 } }
          );
          throw new Error("Invalid code");
        }

        await VerificationCode.updateOne(
          { _id: record._id },
          { $set: { consumed: true } }
        );

        const userDoc = await User.findOne({ email }).lean<
          { _id: Types.ObjectId; email: string; name?: string } | null
        >();
        const ensured =
          userDoc ??
          (await User.create({ email })).toObject();

        return {
          id: ensured._id.toString(),
          email: ensured.email,
          name: ensured.name ?? null,
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthUser).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only_change_me_in_prod",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
