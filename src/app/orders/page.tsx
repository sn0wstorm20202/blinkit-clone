"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { Package } from "lucide-react";
import { toast } from "sonner";
import CartSidebar from "@/components/modals/cart-sidebar";

interface Order {
  id: string;
  totalAmount: number;
  deliveryCharge: number;
  handlingCharge: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/orders");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/orders?limit=50", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50";
      case "confirmed":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
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

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartClick={() => setIsCartSidebarOpen(true)} />

      <main className="container mx-auto px-4 lg:px-10 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Orders</h1>
          <p className="text-text-secondary">View and track your orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-text-primary">Order #{order.id}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">Total Amount</p>
                    <p className="text-xl font-bold text-text-primary">
                      ₹{(order.totalAmount + order.deliveryCharge + order.handlingCharge).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-sm text-text-secondary">{order.itemCount} item(s)</p>
                  <button className="text-primary hover:underline text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-text-secondary mb-4">No orders yet</p>
            <button
              onClick={() => router.push("/")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Start Shopping
            </button>
          </div>
        )}
      </main>

      <Footer />
      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </div>
  );
}
