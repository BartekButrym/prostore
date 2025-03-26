import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compareSync } from 'bcrypt-ts-edge';
import { prisma } from './db/prisma';
import { authConfig } from './auth.config';

export const config = {
	pages: {
		signIn: '/sign-in',
		error: '/sign-in',
	},
	session: {
		strategy: 'jwt' as const,
		maxAge: 30 * 24 * 60 * 60,
	},
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			credentials: {
				email: { type: 'email' },
				password: { type: 'password' },
			},
			async authorize(credentials) {
				if (credentials === null) return null;

				const user = await prisma.user.findFirst({
					where: {
						email: credentials.email as string,
					},
				});

				if (user && user.password) {
					const isMatch = compareSync(credentials.password as string, user.password);

					if (isMatch) {
						return {
							id: user.id,
							name: user.name,
							email: user.email,
							role: user.role,
						};
					}
				}

				return null;
			},
		}),
	],
	callbacks: {
		async session({ session, trigger, token }: any) {
			session.user.id = token.sub;
			session.user.role = token.role;
			session.user.name = token.name;

			if (trigger === 'update') {
				session.user.name = token.name;
			}

			return session;
		},
		async jwt({ token, user, trigger, session }: any) {
			if (user) {
				token.id = user.id;
				token.role = user.role;

				if (user.name === 'NO_NAME') {
					token.name = user.email!.split('@')[0];

					await prisma.user.update({
						where: { id: user.id },
						data: {
							name: token.name,
						},
					});
				}

				if (trigger === 'signIn' || trigger === 'signUp') {
					const cookiesObject = await cookies();
					const sessionCartId = cookiesObject.get('sessionCartId')?.value;

					if (sessionCartId) {
						const sessionCart = await prisma.cart.findFirst({ where: { sessionCartId } });

						if (sessionCart) {
							await prisma.cart.deleteMany({ where: { userId: user.id } });

							await prisma.cart.update({
								where: { id: sessionCart.id },
								data: { userId: user.id },
							});
						}
					}
				}

				if (session?.user.name && trigger === 'update') {
					token.name = session.user.name;
				}
			}
			return token;
		},
		...authConfig.callbacks,
	},
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
