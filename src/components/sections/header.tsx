"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, ShoppingCart, User, LogOut } from "lucide-react";
import Image from "next/image";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { safeProductImageUrl } from "@/lib/utils";

const BlinkitLogo = () => (
  <svg
    width="120"
    height="32"
    viewBox="0 0 120 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-[32px] w-auto"
  >
    <text x="0" y="26" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" letterSpacing="-0.5">
      <tspan fill="#F8CB46">blink</tspan>
      <tspan fill="#0C831F">it</tspan>
    </text>
  </svg>
);

interface HeaderProps {
  onCartClick?: () => void;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  quantity: string;
  price: number;
  categoryName: string;
}

export default function Header({ onCartClick }: HeaderProps) {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchPlaceholders = [ "milk", "bread", "sugar", "butter", "paneer", "chocolate", "curd", "rice", "egg", "chips" ];
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % searchPlaceholders.length);
    }, 2000); 
    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [session]);

  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [session]);

  // Live search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) return;

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItemCount(data.itemCount || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/s?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleSearchClick = () => {
    router.push("/s");
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Failed to sign out");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Signed out successfully");
      router.push("/");
    }
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 h-[86px] w-full border-b border-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="container mx-auto flex h-full items-center justify-between px-4 lg:px-10">
        <div className="flex h-full items-center">
          <Link href="/" aria-label="Blinkit homepage">
            <BlinkitLogo />
          </Link>
          <div className="ml-8 hidden h-9 w-px bg-[#E5E5E5] lg:block"></div>
          <div className="ml-8 hidden cursor-pointer lg:block">
            <div className="flex flex-col">
              <span className="font-bold text-base leading-[19px] text-[#1F1F1F]">
                Delivery in 8 minutes
              </span>
              <div className="flex items-center">
                <span className="text-[13px] leading-[15px] text-text-primary">
                  Select Location
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center px-8 lg:flex">
          <div ref={searchRef} className="relative w-full max-w-[630px]">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex h-12 w-full flex-row items-center rounded-xl bg-surface-gray px-4"
            >
              <Search className="h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchDropdown(true)}
                placeholder={`Search "${searchPlaceholders[currentPlaceholderIndex]}"`}
                className="ml-3 h-6 w-full flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </form>
            
            {/* Search Dropdown */}
            {showSearchDropdown && searchQuery && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-border max-h-[480px] overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/category/${encodeURIComponent(product.categoryName)}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-gray transition-colors cursor-pointer"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={safeProductImageUrl(product.imageUrl, product.name)}
                            alt={product.name}
                            fill
                            className="object-contain rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {product.quantity}
                          </p>
                          <p className="text-sm font-semibold text-text-primary mt-1">
                            ₹{product.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/s?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-surface-gray border-t border-border"
                    >
                      View all results
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-text-secondary">No products found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-8">
          {!isPending && (
            <>
              {session?.user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="hidden lg:flex items-center gap-2 text-base font-normal text-text-primary hover:text-primary transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>{session.user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-50">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-3 hover:bg-surface-gray transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 px-4 py-3 hover:bg-surface-gray transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span className="text-sm">Orders</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-3 hover:bg-surface-gray transition-colors text-left border-t border-border"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden text-base font-normal text-text-primary hover:text-primary transition-colors lg:block">
                  Login
                </Link>
              )}
            </>
          )}
          <button 
            onClick={onCartClick}
            className="flex h-[52px] items-center justify-center gap-2 rounded-lg border border-[#E8E8E8] bg-[#F8F8F8] px-4 py-3 font-semibold text-primary lg:px-5 relative"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="hidden text-base lg:inline">My Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}