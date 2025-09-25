import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // 開発環境用の簡単認証
        if (credentials.email === 'admin@example.com') {
          return {
            id: '1',
            email: 'admin@example.com',
            name: '管理者',
            role: 'admin',
          }
        }
        
        if (credentials.email === 'operator@example.com') {
          return {
            id: '2',
            email: 'operator@example.com',
            name: '運用者',
            role: 'operator',
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
