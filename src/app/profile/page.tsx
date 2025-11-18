"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Header from "@/components/sections/header";
import Footer from "@/components/sections/footer";
import { MapPin, Package, Plus, Edit2, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import CartSidebar from "@/components/modals/cart-sidebar";

interface Address {
  id: number;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface Order {
  id: number;
  totalAmount: number;
  deliveryCharge: number;
  handlingCharge: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<"addresses" | "orders">("addresses");
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/profile");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
      fetchOrders();
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
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/orders?limit=20", {
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
      setIsLoadingOrders(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: addressForm.fullName,
          phone_number: addressForm.phoneNumber,
          address_line1: addressForm.addressLine1,
          address_line2: addressForm.addressLine2 || null,
          city: addressForm.city,
          state: addressForm.state,
          postal_code: addressForm.postalCode,
          is_default: addressForm.isDefault,
        }),
      });

      if (!response.ok) throw new Error("Failed to add address");

      toast.success("Address added successfully");
      setShowAddAddressForm(false);
      setAddressForm({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        isDefault: false,
      });
      fetchAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: addressForm.fullName,
          phone_number: addressForm.phoneNumber,
          address_line1: addressForm.addressLine1,
          address_line2: addressForm.addressLine2 || null,
          city: addressForm.city,
          state: addressForm.state,
          postal_code: addressForm.postalCode,
          is_default: addressForm.isDefault,
        }),
      });

      if (!response.ok) throw new Error("Failed to update address");

      toast.success("Address updated successfully");
      setEditingAddress(null);
      setAddressForm({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        isDefault: false,
      });
      fetchAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete address");

      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/addresses/${addressId}/set-default`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to set default address");

      toast.success("Default address updated");
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const startEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setShowAddAddressForm(true);
  };

  const cancelAddressForm = () => {
    setShowAddAddressForm(false);
    setEditingAddress(null);
    setAddressForm({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      isDefault: false,
    });
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

  if (isPending) {
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Account</h1>
          <p className="text-text-secondary">Welcome back, {session.user.name}!</p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "addresses"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <MapPin className="inline-block mr-2 h-5 w-5" />
            My Addresses
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === "orders"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Package className="inline-block mr-2 h-5 w-5" />
            My Orders
          </button>
        </div>

        {activeTab === "addresses" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Saved Addresses</h2>
              {!showAddAddressForm && (
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <Plus size={20} />
                  Add New Address
                </button>
              )}
            </div>

            {showAddAddressForm && (
              <div className="bg-white border border-border rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h3>
                <form onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phoneNumber}
                        onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                        className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                      className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      placeholder="House No., Building Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                      className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      placeholder="Road Name, Area, Colony"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                        className="w-full h-12 px-4 text-base border-2 border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="h-4 w-4 text-primary border-border rounded focus:ring-2 focus:ring-primary/50"
                    />
                    <label htmlFor="isDefault" className="ml-2 text-sm text-text-secondary">
                      Set as default address
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      {editingAddress ? "Update Address" : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAddressForm}
                      className="bg-gray-200 text-text-primary px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isLoadingAddresses ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white border border-border rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-text-primary">{address.fullName}</h3>
                          {address.isDefault && (
                            <span className="bg-primary text-white text-xs px-2 py-1 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-text-secondary text-sm mb-1">{address.phoneNumber}</p>
                        <p className="text-text-secondary text-sm">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-text-secondary text-sm">
                          {address.city}, {address.state} - {address.postalCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditAddress(address)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(address.id)}
                        className="mt-4 text-sm text-primary hover:underline"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-text-secondary mb-4">No addresses saved yet</p>
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Order History</h2>

            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-border rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
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
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
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
          </div>
        )}
      </main>

      <Footer />
      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </div>
  );
}
