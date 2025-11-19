"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { safeProductImageUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  quantity: string;
  price: number;
  deliveryTime: string;
}

export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=100`);
      
      if (!response.ok) throw new Error("Failed to search products");
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/s?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setProducts([]);
    setHasSearched(false);
    router.push("/s");
  };

  const handleAddToCart = async (productId: string) => {
    if (!session?.user) {
      toast.error("Please login to add items to cart");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      toast.success("Added to cart!");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <main className="container mx-auto px-4 lg:px-10 py-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full h-14 pl-12 pr-12 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-colors bg-white"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 text-text-tertiary hover:text-text-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-border">
                <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse mb-3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        ) : hasSearched && products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">No products found</h2>
            <p className="text-text-secondary">
              Try searching with different keywords
            </p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-text-secondary">
                Found <span className="font-semibold text-text-primary">{products.length}</span> products
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-border rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative w-full aspect-square mb-3">
                    <Image
                      src={safeProductImageUrl(product.imageUrl, product.name)}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  <div className="space-y-2">
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
                    
                    <h3 className="text-sm font-medium text-[#282C3F] leading-5 line-clamp-2 min-h-[40px]">
                      {product.name}
                    </h3>
                    
                    <p className="text-[13px] text-muted-foreground">
                      {product.quantity}
                    </p>
                    
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-sm font-semibold text-[#282C3F]">
                        ₹{product.price}
                      </p>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="text-primary font-bold text-[13px] border border-primary rounded-lg px-4 h-9 bg-white hover:bg-primary/10 transition-colors"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔎</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Start searching</h2>
            <p className="text-text-secondary">
              Search for your favorite products
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
