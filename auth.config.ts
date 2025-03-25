import type { NextAuthConfig, Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const authConfig = {
	providers: [],
	callbacks: {
		authorized({ request, auth }: { request: NextRequest; auth: Session | null }) {
			const protectedPaths = [
				/\/shipping-address/,
				/\/payment-method/,
				/\/place-order/,
				/\/profile/,
				/\/user\/(.*)/,
				/\/order\/(.*)/,
				/\/admin/,
			];

			const { pathname } = request.nextUrl;

			// Check if user is not authenticated and accessing a protected path
			if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

			// Check for session cart cookie
			if (!request.cookies.get('sessionCartId')) {
				// Generate new session cart id cookie
				const sessionCartId = crypto.randomUUID();

				// Create new response and add the new headers
				const response = NextResponse.next({
					request: {
						headers: new Headers(request.headers),
					},
				});

				// Set newly generated sessionCartId in the response cookies
				response.cookies.set('sessionCartId', sessionCartId);

				return response;
			}

			return true;
		},
	},
} satisfies NextAuthConfig;
