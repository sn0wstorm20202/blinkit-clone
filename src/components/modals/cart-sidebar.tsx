"use client";

import { X, Timer, Info, Minus, Plus, ChevronRight } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CartItem {
  id: string;
  cartId: number;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    quantity: string;
    price: number;
    deliveryTime: string;
  };
}

interface CartData {
  cartId: number;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchCart();
    }
  }, [isOpen, session]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (isOpen) {
        fetchCart();
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isOpen]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bearer_token');
      if (!token) return;

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to remove item');

      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleCheckout = () => {
    if (!session?.user) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }

    if (!cartData || cartData.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    router.push('/checkout');
    onClose();
  };

  if (!session?.user) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full md:w-[400px] p-0 flex flex-col bg-background">
          <SheetHeader className="p-4 border-b border-border space-y-0">
            <div className="flex justify-between items-center">
              <SheetTitle className="text-xl font-bold text-text-primary">My Cart</SheetTitle>
              <SheetClose asChild>
                <button className="text-text-secondary hover:text-text-primary">
                  <X size={24} />
                </button>
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="flex-grow flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-text-secondary mb-4">Please login to view your cart</p>
              <button
                onClick={() => {
                  router.push('/login');
                  onClose();
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const itemsTotal = cartData?.totalAmount || 0;
  const deliveryCharge = 15;
  const handlingCharge = 5;
  const subtotal = itemsTotal + deliveryCharge + handlingCharge;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full md:w-[400px] p-0 flex flex-col bg-background">
        <SheetHeader className="p-4 border-b border-border space-y-0">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold text-text-primary">My Cart</SheetTitle>
            <SheetClose asChild>
              <button className="text-text-secondary hover:text-text-primary">
                <X size={24} />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto">
          <div className="bg-secondary p-3 flex items-center gap-2">
            <Timer size={20} className="text-text-primary" />
            <span className="text-sm font-medium text-text-primary">Delivery in 8 minutes</span>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 py-3 border-b border-border">
                  <div className="w-20 h-20 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartData && cartData.items.length > 0 ? (
            <div className="p-4">
              {cartData.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 border-b border-border last:border-b-0">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-contain" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary leading-tight">{item.product.name}</p>
                      <p className="text-xs text-text-secondary mt-1">{item.product.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mt-2">
                      ₹{item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center justify-center border border-primary rounded-md w-24 h-9">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingItems.has(item.id)}
                        className="px-2 text-primary disabled:text-text-tertiary disabled:opacity-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-2 text-primary font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id)}
                        className="px-2 text-primary disabled:text-text-tertiary disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mt-2">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-text-secondary">Your cart is empty</p>
              </div>
            </div>
          )}
        </div>

        {cartData && cartData.items.length > 0 && (
          <div className="mt-auto border-t border-border bg-secondary">
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-md text-text-primary">Bill Details</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Item Total</span>
                <span className="text-text-primary">₹{itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-text-secondary">
                  Delivery Charge
                  <Info size={14} className="text-text-tertiary" />
                </span>
                <span className="text-text-primary">₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-text-secondary">
                  Handling Charge
                  <Info size={14} className="text-text-tertiary" />
                </span>
                <span className="text-text-primary">₹{handlingCharge.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-border pt-2 my-2"></div>
              <div className="flex justify-between items-center font-bold text-sm">
                <span className="text-text-primary">To Pay</span>
                <span className="text-text-primary">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-background border-t-8 border-secondary">
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-primary-foreground rounded-lg p-3 flex justify-between items-center shadow-md hover:bg-primary-hover transition-colors"
              >
                <div className="text-left">
                  <p className="font-semibold text-md">₹{subtotal.toFixed(2)}</p>
                  <p className="text-xs uppercase">Total</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-md">Proceed to Checkout</span>
                  <ChevronRight size={20} />
                </div>
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;