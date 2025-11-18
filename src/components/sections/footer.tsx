import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Apple } from 'lucide-react';

const PlayStoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
    <path d="M399.22 233.52L131 3.52a25.46 25.46 0 00-25.79 1.19 25.86 25.86 0 00-12.22 22v459.66a25.86 25.86 0 0012.22 22 25.46 25.46 0 0025.79 1.19l268.22-230a25.89 25.89 0 000-41.04z" />
    <path d="M112.56 492.38L394.8 256.12 112.56 19.74z" fill="#ffc107" />
    <path d="M394.8 256.12L112.56 19.74l208.53 145.45z" fill="#f44336" />
    <path d="M112.56 19.74l63.53 236.38-63.53-70.93z" className="fill-blue-500" />
    <path d="M112.56 492.38l208.53-145.45-282.25-90.81z"fill="#4caf50" />
    <path d="M112.56 492.38l63.53-236.26-63.53 70.93z" className="fill-blue-500" />
  </svg>
);


const usefulLinksCol1 = [
  { name: "Blog", href: "#" },
  { name: "Privacy", href: "#" },
  { name: "Terms", href: "#" },
  { name: "FAQs", href: "#" },
  { name: "Security", href: "#" },
  { name: "Contact", href: "#" },
];

const usefulLinksCol2 = [
  { name: "Partner", href: "#" },
  { name: "Franchise", href: "#" },
  { name: "Seller", href: "#" },
  { name: "Warehouse", href: "#" },
  { name: "Deliver", href: "#" },
  { name: "Resources", href: "#" },
];

const usefulLinksCol3 = [
    { name: "Recipes", href: "#" },
    { name: "Bistro", href: "#" },
    { name: "District", href: "#" },
]

const categoriesCol1 = [
  { name: "Vegetables & Fruits", href: "#" },
  { name: "Cold Drinks & Juices", href: "#" },
  { name: "Bakery & Biscuits", href: "#" },
  { name: "Dry Fruits, Masala & Oil", href: "#" },
  { name: "Paan Corner", href: "#" },
  { name: "Pharma & Wellness", href: "#" },
  { name: "Pet Care", href: "#" },
  { name: "Kitchen & Dining", href: "#" },
  { name: "Home Furnishing & Decor", href: "#" },
  { name: "Beauty & Cosmetics", href: "#" },
];

const categoriesCol2 = [
  { name: "Dairy & Breakfast", href: "#" },
  { name: "Instant & Frozen Food", href: "#" },
  { name: "Sweet Tooth", href: "#" },
  { name: "Sauces & Spreads", href: "#" },
  { name: "Organic & Premium", href: "#" },
  { name: "Cleaning Essentials", href: "#" },
  { name: "Personal Care", href: "#" },
  { name: "Stationery Needs", href: "#" },
  { name: "Fashion & Accessories", href: "#" },
  { name: "Books", href: "#" },
];

const categoriesCol3 = [
  { name: "Munchies", href: "#" },
  { name: "Tea, Coffee & Milk Drinks", href: "#" },
  { name: "Atta, Rice & Dal", href: "#" },
  { name: "Chicken, Meat & Fish", href: "#" },
  { name: "Baby Care", href: "#" },
  { name: "Home & Office", href: "#" },
  { name: "Print Store", href: "#" },
  { name: "E-Gift Cards", href: "#" },
];

const socialLinks = [
  { icon: Facebook, href: "#", name: "Facebook" },
  { icon: Twitter, href: "#", name: "Twitter" },
  { icon: Instagram, href: "#", name: "Instagram" },
  { icon: Linkedin, href: "#", name: "LinkedIn" },
];

const Footer = () => {
  return (
    <footer className="bg-secondary text-muted-foreground pt-12 font-sans">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:justify-between">
          <div className="w-full lg:w-[33%] mb-8 lg:mb-0">
            <h4 className="text-base font-semibold text-foreground mb-4">Useful Links</h4>
            <div className="flex text-sm">
              <ul className="space-y-3 w-1/3">
                {usefulLinksCol1.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3 w-1/3">
                {usefulLinksCol2.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3 w-1/3">
                {usefulLinksCol3.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="hover:text-primary">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="w-full lg:w-[63%]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-semibold text-foreground">Categories</h4>
              <Link href="#" className="text-primary font-semibold text-sm">
                see all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 text-sm">
              <ul className="space-y-3">
                {categoriesCol1.map((cat) => (
                  <li key={cat.name}>
                    <Link href={cat.href} className="hover:text-primary">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {categoriesCol2.map((cat) => (
                  <li key={cat.name}>
                    <Link href={cat.href} className="hover:text-primary">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-3">
                {categoriesCol3.map((cat) => (
                  <li key={cat.name}>
                    <Link href={cat.href} className="hover:text-primary">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-y-6">
            <div className="hidden lg:block lg:order-1">
              <p className="text-sm text-foreground font-medium">© Blink Commerce Private Limited, 2016-2023</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 lg:order-2">
              <span className="font-semibold text-sm text-foreground">Download App</span>
              <div className="flex gap-4">
                <Link href="#">
                  <img src="https://blinkit.com/d61019073fd5f02f.png" alt="App Store" className="h-10 w-auto" />
                </Link>
                <Link href="#">
                  <img src="https://blinkit.com/8ed02322a385d8da.png" alt="Google Play" className="h-10 w-auto" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 order-2 lg:order-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-full transition-opacity hover:opacity-80"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
               <a
                  href="#"
                  className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-full transition-opacity hover:opacity-80"
                  aria-label="Threads"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09998 8.0001C9.09998 8.0001 8.5 8.3001 8.5 10.0001C8.5 11.5001 9.5 12.0001 10.5 12.0001H13.5C14.5 12.0001 15.5 12.5001 15.5 14.0001C15.5 15.7001 14.9 16.0001 14.9 16.0001M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"></path></svg>
                </a>
            </div>
          </div>
          <div className="lg:hidden mt-8 text-center order-3">
              <p className="text-sm text-foreground font-medium">© Blink Commerce Private Limited, 2016-2023</p>
            </div>
        </div>

        <div className="mt-8 pb-12">
          <p className="text-xs text-center lg:text-left text-muted-foreground leading-relaxed">
            "Blinkit" is owned & managed by "Blink Commerce Private Limited" and is not related, linked or interconnected in whatsoever manner or nature, to "GROFFR.COM" which is a real estate services business operated by "Redstone Consultancy Services Private Limited".
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;