"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { Package, MapPin, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import CartSidebar from "@/components/modals/cart-sidebar";
import Image from "next/image";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    quantity: string;
    deliveryTime: string;
  };
}

interface Order {
  id: number;
  userId: string;
  address: {
    id: number;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  handlingCharge: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { data: session, isPending } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/orders");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user && orderId) {
      fetchOrderDetails();
    }
  }, [session, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
      router.push("/profile?tab=orders");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200";
      case "confirmed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (isPending || isLoading) {
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

  if (!session?.user || !order) {
    return null;
  }

  const totalAmount = order.totalAmount + order.deliveryCharge + order.handlingCharge;

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />

      <main className="container mx-auto px-4 lg:px-10 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ChevronLeft size={20} />
          Back to Orders
        </button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-text-primary">Order #{order.id}</h1>
            <span
              className={`px-4 py-2 rounded-full font-semibold border-2 ${getStatusColor(order.status)}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <p className="text-text-secondary">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Package size={24} className="text-primary" />
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
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
                      <p className="text-sm text-text-secondary mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-text-secondary">Price: ₹{item.priceAtPurchase.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">
                        ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-primary" />
                Delivery Address
              </h2>
              <div>
                <p className="font-bold text-text-primary mb-1">{order.address.fullName}</p>
                <p className="text-sm text-text-secondary mb-1">{order.address.phoneNumber}</p>
                <p className="text-sm text-text-secondary">
                  {order.address.addressLine1}
                  {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                </p>
                <p className="text-sm text-text-secondary">
                  {order.address.city}, {order.address.state} - {order.address.postalCode}
                </p>
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
                  <span className="text-text-primary font-medium">₹{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Delivery Charge</span>
                  <span className="text-text-primary font-medium">₹{order.deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Handling Charge</span>
                  <span className="text-text-primary font-medium">₹{order.handlingCharge.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-text-primary">Total Paid</span>
                    <span className="font-bold text-primary text-xl">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {order.status === "delivered" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">✓ Order Delivered Successfully</p>
                </div>
              )}

              {order.status === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium">⏱ Order is being processed</p>
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">📦 Order confirmed and on the way</p>
                </div>
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
