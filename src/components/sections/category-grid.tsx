import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { name: 'Paan Corner', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/paan-corner_web-5.png' },
  { name: 'Dairy, Bread & Eggs', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-2_10-6.png' },
  { name: 'Fruits & Vegetables', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-3_9-7.png' },
  { name: 'Cold Drinks & Juices', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-4_9-8.png' },
  { name: 'Snacks & Munchies', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-5_4-9.png' },
  { name: 'Breakfast & Instant Food', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-6_5-10.png' },
  { name: 'Sweet Tooth', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-7_3-11.png' },
  { name: 'Bakery & Biscuits', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-8_4-12.png' },
  { name: 'Tea, Coffee & Health Drink', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-9_3-13.png' },
  { name: 'Atta, Rice & Dal', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-10-14.png' },
  { name: 'Masala, Oil & More', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-11-15.png' },
  { name: 'Sauces & Spreads', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-12-16.png' },
  { name: 'Chicken, Meat & Fish', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-13-17.png' },
  { name: 'Organic & Healthy Living', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-14-18.png' },
  { name: 'Baby Care', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-15-19.png' },
  { name: 'Pharma & Wellness', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-16-20.png' },
  { name: 'Cleaning Essentials', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-17-21.png' },
  { name: 'Home & Office', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-18-22.png' },
  { name: 'Personal Care', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-19-23.png' },
  { name: 'Pet Care', imageSrc: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Slice-20-24.png' },
];

const CategoryGrid = () => {
  return (
    <section className="mt-3 mb-6">
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 sm:gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${encodeURIComponent(category.name)}`}
              className="block transition-transform duration-200 ease-in-out hover:scale-[1.02]"
            >
              <Image
                src={category.imageSrc}
                alt={category.name}
                width={128}
                height={188}
                className="w-full h-auto"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;