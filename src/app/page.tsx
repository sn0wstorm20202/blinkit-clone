"use client";

import { useState } from "react";
import Header from "@/components/sections/header";
import HeroBanner from "@/components/sections/hero-banner";
import ServiceCards from "@/components/sections/service-cards";
import CategoryGrid from "@/components/sections/category-grid";
import ProductCarousel from "@/components/sections/product-carousel";
import Footer from "@/components/sections/footer";
import LocationModal from "@/components/modals/location-modal";
import CartSidebar from "@/components/modals/cart-sidebar";

export default function Home() {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />
      
      <main className="container mx-auto px-4 lg:px-10 py-6">
        <HeroBanner />
        
        <div className="mb-8">
          <ServiceCards />
        </div>
        
        <CategoryGrid />
        
        <div className="space-y-8 mt-8">
          <ProductCarousel categoryId={2} title="Dairy, Bread & Eggs" />
          <ProductCarousel categoryId={4} title="Cold Drinks & Juices" />
          <ProductCarousel categoryId={5} title="Snacks & Munchies" />
          <ProductCarousel categoryId={3} title="Fruits & Vegetables" />
          <ProductCarousel categoryId={6} title="Breakfast & Instant Food" />
          <ProductCarousel categoryId={7} title="Sweet Tooth" />
        </div>
      </main>
      
      <Footer />
      
      {isLocationModalOpen && (
        <LocationModal onClose={() => setIsLocationModalOpen(false)} />
      )}
      
      <CartSidebar 
        isOpen={isCartSidebarOpen} 
        onClose={() => setIsCartSidebarOpen(false)} 
      />
    </div>
  );
}