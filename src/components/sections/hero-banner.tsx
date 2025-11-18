"use client";

import Image from 'next/image';
import Link from 'next/link';

const HeroBanner = () => {
  const bannerImageUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Group-33704-1.jpg";
  const paanCategoryPath = `/category/${encodeURIComponent("Paan Corner")}`;

  return (
    <section className="mb-6">
      <Link href={paanCategoryPath} passHref legacyBehavior>
        <a className="block cursor-pointer">
          <div className="relative flex items-center h-[235px] rounded-2xl overflow-hidden">
            <Image
              src={bannerImageUrl}
              alt="Paan corner banner"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1200px, 1280px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2F7A3E] to-transparent opacity-95"></div>
            <div className="relative z-10 pl-12 pr-4 w-full md:w-3/5 lg:w-1/2">
              <h1 className="text-white text-[48px] font-bold leading-[56px] tracking-[-0.5px]">
                Paan corner
              </h1>
              <p className="mt-2 text-xl font-normal text-white">
                Your favourite paan shop is now online
              </p>
              {/* This is a div styled as a button to avoid nested links */}
              <div className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors">
                Shop Now
              </div>
            </div>
          </div>
        </a>
      </Link>
    </section>
  );
};

export default HeroBanner;