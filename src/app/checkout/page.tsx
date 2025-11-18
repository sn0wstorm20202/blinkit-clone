"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { MapPin, Plus, CheckCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CartSidebar from "@/components/modals/cart-sidebar";
import Image from "next/image";

interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    quantity: string;
    price: number;
  };
}

interface CartData {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/checkout");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
      fetchCart();
    }
  }, [session]);

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        
        // Auto-select default address
        const defaultAddress = data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchCart = async () => {
    try {
      setIsLoadingCart(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data);
        
        if (data.items.length === 0) {
          toast.error("Your cart is empty");
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setIsLoadingCart(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!cartData || cartData.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: selectedAddressId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to place order");
      }

      const order = await response.json();
      toast.success("Order placed successfully!");
      
      // Trigger cart update
      window.dispatchEvent(new Event("cartUpdated"));
      
      // Redirect to order details page
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isPending || isLoadingAddresses || isLoadingCart) {
    return (
      <div className="min-h-screen bg-background">
        <Header onCartClick={() => setIsCartSidebarOpen(true)} />
        <div className="container mx-auto px-4 lg:px-10 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session?.user || !cartData) {
    return null;
  }

  const deliveryCharge = 15;
  const handlingCharge = 5;
  const totalAmount = cartData.totalAmount + deliveryCharge + handlingCharge;

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />

      <main className="container mx-auto px-4 lg:px-10 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Checkout</h1>
          <p className="text-text-secondary">Review your order and select delivery address</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <MapPin className="text-primary" size={24} />
                  Delivery Address
                </h2>
                <button
                  onClick={() => router.push("/profile?tab=addresses")}
                  className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add New
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedAddressId === address.id ? (
                            <CheckCircle className="text-primary" size={20} />
                          ) : (
                            <div className="w-5 h-5 border-2 border-border rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-text-primary">{address.fullName}</h3>
                            {address.isDefault && (
                              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mb-1">{address.phoneNumber}</p>
                          <p className="text-sm text-text-secondary">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {address.city}, {address.state} - {address.postalCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-text-secondary mb-4">No delivery addresses saved</p>
                  <button
                    onClick={() => router.push("/profile?tab=addresses")}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Add Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* Order Items Section */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Order Items ({cartData.itemCount})</h2>
              <div className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-b-0">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-text-primary">{item.product.name}</h3>
                      <p className="text-sm text-text-secondary">{item.product.quantity}</p>
                      <p className="text-sm text-text-secondary mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-text-primary mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Item Total</span>
                  <span className="text-text-primary font-medium">₹{cartData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Delivery Charge</span>
                  <span className="text-text-primary font-medium">₹{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Handling Charge</span>
                  <span className="text-text-primary font-medium">₹{handlingCharge.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-text-primary">Total Amount</span>
                    <span className="font-bold text-primary text-xl">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Delivery in 8 minutes</strong>
                  <br />
                  Your order will be delivered quickly
                </p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddressId || isPlacingOrder || addresses.length === 0}
                className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {addresses.length === 0 && (
                <p className="text-xs text-red-600 text-center mt-2">
                  Please add a delivery address to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </div>
  );
}
