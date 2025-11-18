import Image from 'next/image';

const serviceCardsData = [
  {
    href: '#',
    src: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/pharmacy-WEB-2.jpg',
    alt: 'masthead_web_pharma',
    width: 335.4,
    height: 195,
  },
  {
    href: '#',
    src: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/Pet-Care_WEB-3.jpg',
    alt: 'masthead_web_pet_care',
    width: 335.4,
    height: 195,
  },
  {
    href: '#',
    src: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/46beb3bf-c706-4916-ad59-8d1e7a2aeb9c-blinkit-com/assets/images/babycare-WEB-4.jpg',
    alt: 'masthead_web_baby_care',
    width: 335.4,
    height: 195,
  },
];

const ServiceCards = () => {
  return (
    <div className="flex flex-col items-center md:flex-row md:justify-center gap-4">
      {serviceCardsData.map((card, index) => (
        <a
          key={index}
          href={card.href}
          className="block flex-shrink-0"
        >
          <div className="overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <Image
              src={card.src}
              alt={card.alt}
              width={Math.round(card.width)}
              height={Math.round(card.height)}
              className="object-cover"
            />
          </div>
        </a>
      ))}
    </div>
  );
};

export default ServiceCards;