import { ProductList } from '@/components/shared/product/product-list';
import sampleData from '@/db/sample-data';

const Homepage = () => {
	return (
		<div>
			<ProductList data={sampleData.products} title='Newest Arrivals' limit={4} />
		</div>
	);
};

export default Homepage;
