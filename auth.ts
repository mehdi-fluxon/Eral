import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT instead of database sessions for Edge compatibility
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create or link TeamMember after the user is created
      if (user.email) {
        const existingTeamMember = await prisma.teamMember.findUnique({
          where: { email: user.email },
        })

        if (existingTeamMember && !existingTeamMember.userId) {
          // Link existing team member to the user
          await prisma.teamMember.update({
            where: { id: existingTeamMember.id },
            data: { userId: user.id },
          })
        } else if (!existingTeamMember) {
          // Create a new team member for this user
          await prisma.teamMember.create({
            data: {
              name: user.name || user.email,
              email: user.email,
              userId: user.id,
            },
          })
        }
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
