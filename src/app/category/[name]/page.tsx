"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import CartSidebar from "@/components/modals/cart-sidebar";
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.name as string);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [categoryName]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/products?category_name=${encodeURIComponent(categoryName)}&limit=100`
      );

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />

      <main className="container mx-auto px-4 lg:px-10 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">{categoryName}</h1>
          <p className="text-text-secondary mt-1">
            {products.length} products available
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-border">
                <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse mb-3" />
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              No products found
            </h2>
            <p className="text-text-secondary">
              Check back later for products in this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        )}
      </main>

      <Footer />

      <CartSidebar
        isOpen={isCartSidebarOpen}
        onClose={() => setIsCartSidebarOpen(false)}
      />
    </div>
  );
}
