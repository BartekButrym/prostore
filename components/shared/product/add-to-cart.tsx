'use client';

import { toast } from 'sonner';
import { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export const AddToCart = ({ item }: { item: CartItem }) => {
	const router = useRouter();

	const handleAddToCart = async () => {
		const res = await addItemToCart(item);

		if (!res.success) {
			toast.error('aaa', {
				description: res.message,
			});

			return;
		}

		toast(`${item.name} added to cart`, {
			action: {
				label: <span className='bg-primary text-white hover:bg-gray-800'>Go to cart</span>,
				onClick: () => router.push('/cart'),
			},
		});
	};

	return (
		<Button className='w-full' type='button' onClick={handleAddToCart}>
			<Plus />
			Add to cart
		</Button>
	);
};
