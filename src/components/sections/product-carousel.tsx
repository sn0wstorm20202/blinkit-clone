"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  imageUrl: string;
  quantity: string;
  price: number;
  deliveryTime: string;
  categoryId: number;
  categoryName: string;
}

interface ProductCarouselProps {
  categoryId?: number;
  title?: string;
}

const ProductCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (productId: number) => Promise<void> }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-[179px] bg-card border border-border rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ease-linear hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <div className="relative">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={140}
          height={140}
          className="mx-auto"
        />
      </div>
      
      <div className="mt-2.5 flex flex-col h-[125px]">
         <div className="inline-flex items-center bg-secondary rounded py-0.5 px-1 text-[11px] font-medium text-[#282C3F]">
            <Image 
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/icons/15-mins-1.png" 
                alt="delivery time" 
                width={12} 
                height={12} 
                className="mr-1"
            />
            {product.deliveryTime}
        </div>
        
        <h3 className="text-sm font-medium text-[#282C3F] leading-5 h-10 mt-[5px] line-clamp-2">
            {product.name}
        </h3>
        
        <p className="text-[13px] text-muted-foreground mt-1">
            {product.quantity}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
            <p className="text-sm font-semibold text-[#282C3F]">
                ₹{product.price}
            </p>
            <button 
              onClick={handleAdd}
              disabled={isAdding}
              className="text-primary font-bold text-[13px] border border-primary rounded-lg w-[88px] h-9 bg-white bg-opacity-50 hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
                {isAdding ? "..." : "ADD"}
            </button>
        </div>
      </div>
    </div>
  );
};

const ProductCarousel = ({ categoryId, title }: ProductCarouselProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
      fetchProducts();
    }, [categoryId]);

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const url = categoryId 
          ? `/api/products?category_id=${categoryId}&limit=20`
          : '/api/products?limit=20';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    const handleAddToCart = async (productId: number) => {
      if (!session?.user) {
        toast.error('Please login to add items to cart');
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      try {
        const token = localStorage.getItem('bearer_token');
        const response = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: productId,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        toast.success('Added to cart!');
        
        // Trigger cart refresh event
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (error) {
        console.error('Error adding to cart:', error);
        toast.error('Failed to add to cart');
      }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.offsetWidth * 0.8;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (isLoading) {
      return (
        <section className="mb-8">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-[179px] h-[280px] bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (products.length === 0) {
      return null;
    }

    const displayTitle = title || products[0]?.categoryName || 'Products';

    return (
        <section className="mb-8">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[28px] font-bold text-[#282C3F] leading-[36px] tracking-[-0.01875em]">
                        {displayTitle}
                    </h2>
                    <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover">
                        see all
                    </a>
                </div>

                <div className="relative group">
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                        className="absolute top-[82px] -translate-y-1/2 left-0 -translate-x-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-md items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 hidden lg:flex"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto pb-2 gap-4 scrollbar-hide"
                    >
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                        ))}
                    </div>

                    <button
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                        className="absolute top-[82px] -translate-y-1/2 right-0 translate-x-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-md items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 hidden lg:flex"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ProductCarousel;