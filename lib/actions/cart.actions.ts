'use server';

import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { CartItem } from '@/types';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError, roundTwo } from '../utils';
import { cartItemSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
	const itemsPrice = roundTwo(items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0));
	const shippingPrice = roundTwo(itemsPrice > 100 ? 0 : 10);
	const taxPrice = roundTwo(0.15 * itemsPrice);
	const totalPrice = roundTwo(itemsPrice + shippingPrice + taxPrice);

	return {
		itemsPrice: itemsPrice.toFixed(2),
		shippingPrice: shippingPrice.toFixed(2),
		taxPrice: taxPrice.toFixed(2),
		totalPrice: totalPrice.toFixed(2),
	};
};

export async function addItemToCart(data: CartItem) {
	try {
		const sessionCartId = (await cookies()).get('sessionCartId')?.value;

		if (!sessionCartId) {
			throw new Error('Cart session not found');
		}

		const session = await auth();
		const userId = session?.user?.id ? session.user.id : undefined;
		const cart = await getMyCart();
		const item = cartItemSchema.parse(data);
		const product = await prisma.product.findFirst({
			where: { id: item.productId },
		});

		if (!product) {
			throw new Error('Product not found');
		}

		if (!cart) {
			const newCart = insertCartSchema.parse({
				userId: userId,
				items: [item],
				sessionCartId: sessionCartId,
				...calcPrice([item]),
			});

			await prisma.cart.create({
				data: newCart,
			});

			// Revalidate product page
			revalidatePath(`/product/${product.slug}`);

			return {
				success: true,
				message: `${product.name} added to cart`,
			};
		} else {
			// Check if item is already in cart
			const existingItem = (cart.items as CartItem[]).find((i) => i.productId === item.productId);

			if (existingItem) {
				// Check stock
				if (product.stock < existingItem.qty + 1) {
					throw new Error('Not enough stock');
				}

				// Increase the quantity
				(cart.items as CartItem[]).find((i) => i.productId === item.productId)!.qty = existingItem.qty + 1;
			} else {
				// Check stock
				if (product.stock < 1) {
					throw new Error('Not enough stock');
				}

				// Add item to the cart items
				cart.items.push(item);
			}

			await prisma.cart.update({
				where: { id: cart.id },
				data: {
					items: cart.items as Prisma.CartUpdateitemsInput[],
					...calcPrice(cart.items as CartItem[]),
				},
			});

			revalidatePath(`/product/${product.slug}`);

			return {
				success: true,
				message: `${product.name} ${existingItem ? 'updated in' : 'added to'} cart`,
			};
		}
	} catch (error) {
		return {
			success: false,
			message: formatError(error),
		};
	}
}

export async function getMyCart() {
	const sessionCartId = (await cookies()).get('sessionCartId')?.value;

	if (!sessionCartId) {
		throw new Error('Cart session not found');
	}

	const session = await auth();
	const userId = session?.user?.id ? session.user.id : undefined;

	const cart = await prisma.cart.findFirst({
		where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
	});

	if (!cart) return undefined;

	return convertToPlainObject({
		...cart,
		items: cart.items,
		itemsPrice: cart.itemsPrice.toString(),
		totalPrice: cart.totalPrice.toString(),
		shippingPrice: cart.shippingPrice.toString(),
		taxPrice: cart.taxPrice.toString(),
	});
}

export async function removeItemFromCart(productId: string) {
	try {
		const sessionCartId = (await cookies()).get('sessionCartId')?.value;

		if (!sessionCartId) {
			throw new Error('Cart session not found');
		}

		const product = await prisma.product.findFirst({ where: { id: productId } });

		if (!product) {
			throw new Error('Product not found');
		}

		const cart = await getMyCart();

		if (!cart) {
			throw new Error('Cart not found');
		}

		const existingItem = (cart.items as CartItem[]).find((i) => i.productId === productId);

		if (!existingItem) {
			throw new Error('Item not found');
		}

		if (existingItem.qty === 1) {
			cart.items = (cart.items as CartItem[]).filter((i) => i.productId !== existingItem.productId);
		} else {
			(cart.items as CartItem[]).find((i) => i.productId === productId)!.qty = existingItem.qty - 1;
		}

		await prisma.cart.update({
			where: { id: cart.id },
			data: {
				items: cart.items as Prisma.CartUpdateitemsInput[],
				...calcPrice(cart.items as CartItem[]),
			},
		});

		revalidatePath(`/product/${product.slug}`);

		return {
			success: true,
			message: `${product.name} was removed from cart`,
		};
	} catch (error) {
		return {
			success: false,
			message: formatError(error),
		};
	}
}
