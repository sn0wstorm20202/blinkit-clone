import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Paan Corner',
            imageUrl: 'https://via.placeholder.com/200x200?text=Paan+Corner',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Dairy, Bread & Eggs',
            imageUrl: 'https://via.placeholder.com/200x200?text=Dairy+Bread+Eggs',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Fruits & Vegetables',
            imageUrl: 'https://via.placeholder.com/200x200?text=Fruits+Vegetables',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Cold Drinks & Juices',
            imageUrl: 'https://via.placeholder.com/200x200?text=Cold+Drinks+Juices',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Snacks & Munchies',
            imageUrl: 'https://via.placeholder.com/200x200?text=Snacks+Munchies',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Breakfast & Instant Food',
            imageUrl: 'https://via.placeholder.com/200x200?text=Breakfast+Instant+Food',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Sweet Tooth',
            imageUrl: 'https://via.placeholder.com/200x200?text=Sweet+Tooth',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Atta, Rice & Dal',
            imageUrl: 'https://via.placeholder.com/200x200?text=Atta+Rice+Dal',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Chicken, Meat & Fish',
            imageUrl: 'https://via.placeholder.com/200x200?text=Chicken+Meat+Fish',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Masala, Oil & More',
            imageUrl: 'https://via.placeholder.com/200x200?text=Masala+Oil+More',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Sauces & Spreads',
            imageUrl: 'https://via.placeholder.com/200x200?text=Sauces+Spreads',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Baby Care',
            imageUrl: 'https://via.placeholder.com/200x200?text=Baby+Care',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Pharma & Wellness',
            imageUrl: 'https://via.placeholder.com/200x200?text=Pharma+Wellness',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Cleaning Essentials',
            imageUrl: 'https://via.placeholder.com/200x200?text=Cleaning+Essentials',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Home & Office',
            imageUrl: 'https://via.placeholder.com/200x200?text=Home+Office',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Personal Care',
            imageUrl: 'https://via.placeholder.com/200x200?text=Personal+Care',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Pet Care',
            imageUrl: 'https://via.placeholder.com/200x200?text=Pet+Care',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Organic & Premium',
            imageUrl: 'https://via.placeholder.com/200x200?text=Organic+Premium',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Ice Creams',
            imageUrl: 'https://via.placeholder.com/200x200?text=Ice+Creams',
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Tea, Coffee & More',
            imageUrl: 'https://via.placeholder.com/200x200?text=Tea+Coffee+More',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});