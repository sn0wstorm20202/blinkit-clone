"use client";

import { useState, Suspense } from "react";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import CartSidebar from "@/components/modals/cart-sidebar";
import SearchContent from "@/components/search-content";

export default function SearchPage() {
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />
      
      <Suspense fallback={
        <main className="container mx-auto px-4 lg:px-10 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-border">
                  <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse mb-3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </main>
      }>
        <SearchContent />
      </Suspense>
      
      <Footer />
      
      <CartSidebar 
        isOpen={isCartSidebarOpen} 
        onClose={() => setIsCartSidebarOpen(false)} 
      />
    </div>
  );
}
