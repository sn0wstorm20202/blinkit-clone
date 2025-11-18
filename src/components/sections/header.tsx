"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, ShoppingCart, User, LogOut } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";

const BlinkitLogo = () => (
  <svg
    width="134"
    height="30"
    viewBox="0 0 134 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-[27px] w-auto lg:h-[30px]"
  >
    <path
      d="M12.9416 19.1416C12.9416 19.3491 12.7741 19.5166 12.5666 19.5166H10.1509C9.94338 19.5166 9.77588 19.3491 9.77588 19.1416V10.2335C9.77588 10.026 9.94338 9.85852 10.1509 9.85852H12.5666C12.7741 9.85852 12.9416 10.026 12.9416 10.2335V19.1416Z"
      fill="#F8CB46"
    />
    <path
      d="M22.0993 22.3164C22.0993 22.5239 21.9318 22.6914 21.7243 22.6914H19.3086C19.1011 22.6914 18.9336 22.5239 18.9336 22.3164V7.05859C18.9336 6.85109 19.1011 6.68359 19.3086 6.68359H21.7243C21.9318 6.68359 22.0993 6.85109 22.0993 7.05859V22.3164Z"
      fill="#0C831F"
    />
    <path
      d="M7.7417 14.6914C7.7417 14.8989 7.5742 15.0664 7.3667 15.0664H2.4334C2.2259 15.0664 2.0584 14.8989 2.0584 14.6914V0.508301H7.7417V14.6914Z"
      fill="#F8CB46"
    />
    <path
      d="M28.0993 15.0664H32.7836V22.3164C32.7836 22.5239 32.6161 22.6914 32.4086 22.6914H28.4743C28.2668 22.6914 28.0993 22.5239 28.0993 22.3164V15.0664Z"
      fill="#0C831F"
    />
    <path
      d="M112.549 21.6917C112.934 22.0767 113.564 22.0767 113.949 21.6917L119.349 16.2917C119.734 15.9067 119.734 15.2767 119.349 14.8917C118.964 14.5067 118.334 14.5067 117.949 14.8917L113.249 19.5917L109.949 16.2917C109.564 15.9067 108.934 15.9067 108.549 16.2917C108.164 16.6767 108.164 17.3067 108.549 17.6917L112.549 21.6917Z"
      fill="#0C831F"
    />
    <path
      d="M125.86 16.03C126.16 16.03 126.4 15.79 126.4 15.49L126.4 10.36C126.4 10.06 126.16 9.82001 125.86 9.82001H123.55C123.25 9.82001 123.01 10.06 123.01 10.36L123.01 19.06C123.01 19.36 123.25 19.6 123.55 19.6H125.86C126.16 19.6 126.4 19.36 126.4 19.06L126.4 16.57H128.05C129.76 16.57 131.02 15.31 131.02 13.57C131.02 11.83 129.76 10.57 128.05 10.57H126.4V12.16H128.05C128.74 12.16 129.31 12.73 129.31 13.57C129.31 14.41 128.74 14.98 128.05 14.98H126.4V16.03H125.86Z"
      fill="#0C831F"
    />
    <path
      d="M133.4 13.06C133.4 10.95 131.89 9.31001 129.81 9.31001L129.7 9.31001C127.62 9.31001 126.11 10.95 126.11 13.06C126.11 15.2 127.62 16.81 129.7 16.81L129.81 16.81C131.89 16.81 133.4 15.2 133.4 13.06ZM131.69 13.06C131.69 14.28 130.84 15.25 129.7 15.25C128.56 15.25 127.82 14.28 127.82 13.06C127.82 11.87 128.56 10.87 129.7 10.87C130.84 10.87 131.69 11.87 131.69 13.06Z"
      fill="#0C831F"
    />
    <path
      d="M41.7651 22.4585C40.6751 22.4585 39.7951 22.1085 39.1151 21.4285C38.4351 20.7485 38.0951 19.8385 38.0951 18.7185V7.0585C38.0951 6.851 38.2626 6.6835 38.4701 6.6835H40.8858C41.0933 6.6835 41.2608 6.851 41.2608 7.0585V18.3785C41.2608 18.9185 41.4451 19.3485 41.8151 19.6585C42.1851 19.9685 42.6651 20.1285 43.2551 20.1285C43.8451 20.1285 44.3251 19.9685 44.6951 19.6585C45.0651 19.3485 45.2501 18.9185 45.2501 18.3785V7.0585C45.2501 6.851 45.4176 6.6835 45.6251 6.6835H48.0408C48.2483 6.6835 48.4158 6.851 48.4158 7.0585V18.7185C48.4158 19.8385 48.0758 20.7485 47.3958 21.4285C46.7158 22.1085 45.8358 22.4585 44.7458 22.4585H41.7651Z"
      fill="#0C831F"
    />
    <path
      d="M57.653 19.2832C57.653 19.4907 57.4855 19.6582 57.278 19.6582H51.053C50.8455 19.6582 50.678 19.4907 50.678 19.2832V7.0582C50.678 6.8507 50.8455 6.6832 51.053 6.6832H57.278C57.4855 6.6832 57.653 6.8507 57.653 7.0582V9.8932H53.053V12.7882H56.553V15.0132H53.053V19.2832Z"
      fill="#0C831F"
    />
    <path
      d="M68.8164 13.166C68.8164 10.906 67.4364 9.31602 65.4264 9.31602C63.4164 9.31602 62.0364 10.906 62.0364 13.166C62.0364 15.426 63.4164 17.016 65.4264 17.016C67.4364 17.016 68.8164 15.426 68.8164 13.166ZM66.4164 13.166C66.4164 14.396 66.0164 15.116 65.4264 15.116C64.8364 15.116 64.4364 14.396 64.4364 13.166C64.4364 11.936 64.8364 11.216 65.4264 11.216C66.0164 11.216 66.4164 11.936 66.4164 13.166Z"
      fill="#0C831F"
    />
    <path
      d="M78.6943 19.2832C78.6943 19.4907 78.5268 19.6582 78.3193 19.6582H76.0743C75.8668 19.6582 75.6993 19.4907 75.6993 19.2832V7.0582C75.6993 6.8507 75.8668 6.6832 76.0743 6.6832H78.3193C78.5268 6.6832 78.6943 6.8507 78.6943 7.0582V19.2832Z"
      fill="#0C831F"
    />
    <path
      d="M91.8021 7.05859C91.8021 6.85109 91.6346 6.68359 91.4271 6.68359H89.0114C88.8039 6.68359 88.6364 6.85109 88.6364 7.05859V22.3164C88.6364 22.5239 88.8039 22.6914 89.0114 22.6914H91.4271C91.6346 22.6914 91.8021 22.5239 91.8021 22.3164V7.05859Z"
      fill="#0C831F"
    />
    <path
      d="M102.731 16.5236L98.6611 9.94359C98.5011 9.68359 98.1911 9.55359 97.8911 9.66359L95.5311 10.4536C95.2711 10.5436 95.1011 10.7936 95.1011 11.0736V19.2836C95.1011 19.4911 95.2686 19.6586 95.4761 19.6586H97.6911C97.9011 19.6586 98.0711 19.4911 98.0711 19.2836V13.8136L100.241 17.5136C100.821 18.5036 101.991 18.7336 102.821 18.0636L104.221 16.9636C104.911 16.4236 104.751 15.3536 103.921 14.9036L102.731 16.5236Z"
      fill="#0C831F"
    />
  </svg>
);

interface HeaderProps {
  onCartClick?: () => void;
}

export default function Header({ onCartClick }: HeaderProps) {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
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
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex h-12 w-full max-w-[630px] flex-row items-center rounded-xl bg-surface-gray px-4 cursor-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleSearchClick();
              }
            }}
          >
            <Search className="h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchClick}
              placeholder={`Search "${searchPlaceholders[currentPlaceholderIndex]}"`}
              className="ml-3 h-6 w-full flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </form>
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