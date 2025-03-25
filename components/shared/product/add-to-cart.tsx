'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Cart, CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { useRouter } from 'next/navigation';
import { Loader, Minus, Plus } from 'lucide-react';

export const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleAddToCart = async () => {
		startTransition(async () => {
			const res = await addItemToCart(item);

			if (!res.success) {
				toast.error(res.message);

				return;
			}

			toast(res.message, {
				action: {
					label: <span className='bg-primary text-white hover:bg-gray-800'>Go to cart</span>,
					onClick: () => router.push('/cart'),
				},
			});
		});
	};

	const handleRemoveFromCart = async () => {
		startTransition(async () => {
			const res = await removeItemFromCart(item.productId);
			toast(res.message);

			return;
		});
	};

	const existingItem = cart && cart.items.find((i) => i.productId === item.productId);

	return existingItem ? (
		<div>
			<Button type='button' variant='outline' onClick={handleRemoveFromCart}>
				{isPending ? <Loader className='w-4 h-4 animate-spin' /> : <Minus className='h-4 w-4' />}
			</Button>
			<span className='px-2'>{existingItem.qty}</span>
			<Button type='button' variant='outline' onClick={handleAddToCart}>
				{isPending ? <Loader className='w-4 h-4 animate-spin' /> : <Plus className='h-4 w-4' />}
			</Button>
		</div>
	) : (
		<Button className='w-full' type='button' onClick={handleAddToCart}>
			{isPending ? <Loader className='w-4 h-4 animate-spin' /> : <Plus className='h-4 w-4' />}
			Add to cart
		</Button>
	);
};
