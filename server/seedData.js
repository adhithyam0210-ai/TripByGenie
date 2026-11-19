const bcrypt = require('bcryptjs');

const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

const defaultPassword = hashPassword('Password@123');
const adminPassword = hashPassword('Admin@123');
const staffPassword = hashPassword('Staff@123');
const agentPassword = hashPassword('Agent@123');
const customerPassword = hashPassword('Customer@123');
const voyagePassword = hashPassword('Voyage@123');

const seedData = {
  agencies: [
    {
      id: 'agency_travel_genie',
      name: 'Travel Genie Holidays & Tours',
      slug: 'travel-genie',
      tagline: 'Your Trusted Travel Partner for Extraordinary Journeys',
      email: 'info@tripbygenie.in',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      address: 'Travel Genie Heights, 4th Floor, MG Road, Bengaluru, Karnataka 560001, India',
      currency: 'INR',
      currency_symbol: '₹',
      logo: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'agency_voyage_bliss',
      name: 'Voyage Bliss Luxury Travels',
      slug: 'voyage-bliss',
      tagline: 'Ultra-Luxury Bespoke Curated Expeditions',
      email: 'contact@voyagebliss.com',
      phone: '+91 91234 56789',
      whatsapp: '+91 91234 56789',
      address: 'Voyage House, 12th Floor, Nariman Point, Mumbai, Maharashtra 400021, India',
      currency: 'INR',
      currency_symbol: '₹',
      logo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80',
      status: 'active',
      created_at: '2026-01-10T00:00:00.000Z'
    }
  ],

  agency_settings: [
    {
      id: 'as_travel_genie',
      agency_id: 'agency_travel_genie',
      default_wholesale_discount_pct: 12,
      lead_auto_assign: true,
      advance_payment_pct: 30,
      support_email: 'support@tripbygenie.in',
      terms_conditions: 'Standard cancellation policy applies. 25% charge for cancellations within 14 days of travel.',
      theme: {
        primary_navy: '#082C43',
        ocean_blue: '#17648A',
        warm_cream: '#F8F1E7',
        coral: '#FF795C',
        turquoise: '#55C9BD'
      }
    },
    {
      id: 'as_voyage_bliss',
      agency_id: 'agency_voyage_bliss',
      default_wholesale_discount_pct: 15,
      lead_auto_assign: false,
      advance_payment_pct: 40,
      support_email: 'concierge@voyagebliss.com',
      terms_conditions: 'Luxury bespoke bookings require non-refundable deposits.',
      theme: {
        primary_navy: '#082C43',
        ocean_blue: '#17648A',
        warm_cream: '#F8F1E7',
        coral: '#FF795C',
        turquoise: '#55C9BD'
      }
    }
  ],

  users: [
    {
      id: 'usr_admin_genie',
      agency_id: 'agency_travel_genie',
      role: 'admin',
      name: 'Aditya Sharma',
      email: 'admin@travelgenie.com',
      phone: '+91 98765 00001',
      password_hash: adminPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-01T10:00:00.000Z'
    },
    {
      id: 'usr_staff_priya',
      agency_id: 'agency_travel_genie',
      role: 'staff',
      name: 'Priya Nair',
      email: 'priya.staff@travelgenie.com',
      phone: '+91 98765 00002',
      password_hash: staffPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-05T10:00:00.000Z'
    },
    {
      id: 'usr_staff_rahul',
      agency_id: 'agency_travel_genie',
      role: 'staff',
      name: 'Rahul Verma',
      email: 'rahul.staff@travelgenie.com',
      phone: '+91 98765 00003',
      password_hash: staffPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-06T10:00:00.000Z'
    },
    {
      id: 'usr_agent_vikram',
      agency_id: 'agency_travel_genie',
      role: 'agent',
      name: 'Vikram Singhania',
      email: 'vikram.agent@globetrotters.com',
      phone: '+91 98765 00004',
      password_hash: agentPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'usr_agent_sunita',
      agency_id: 'agency_travel_genie',
      role: 'agent',
      name: 'Sunita Mehra',
      email: 'sunita.agent@wanderexpress.com',
      phone: '+91 98765 00005',
      password_hash: agentPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-12T10:00:00.000Z'
    },
    {
      id: 'usr_cust_ananya',
      agency_id: 'agency_travel_genie',
      role: 'customer',
      name: 'Ananya Rao',
      email: 'ananya.customer@gmail.com',
      phone: '+91 98765 00006',
      password_hash: customerPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-15T10:00:00.000Z'
    },
    {
      id: 'usr_cust_rohit',
      agency_id: 'agency_travel_genie',
      role: 'customer',
      name: 'Rohit Kulkarni',
      email: 'rohit.customer@gmail.com',
      phone: '+91 98765 00007',
      password_hash: customerPassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-18T10:00:00.000Z'
    },
    {
      id: 'usr_admin_voyage',
      agency_id: 'agency_voyage_bliss',
      role: 'admin',
      name: 'Devraj Kapur',
      email: 'admin@voyagebliss.com',
      phone: '+91 91234 00001',
      password_hash: voyagePassword,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      created_at: '2026-01-10T10:00:00.000Z'
    }
  ],

  staff_profiles: [
    {
      id: 'sp_priya',
      user_id: 'usr_staff_priya',
      agency_id: 'agency_travel_genie',
      employee_id: 'TG-EMP-101',
      department: 'Holidays & International',
      designation: 'Senior Travel Consultant',
      assigned_leads_count: 14,
      converted_leads_count: 8,
      rating: 4.9
    },
    {
      id: 'sp_rahul',
      user_id: 'usr_staff_rahul',
      agency_id: 'agency_travel_genie',
      employee_id: 'TG-EMP-102',
      department: 'Domestic & Group Tours',
      designation: 'Tour Operations Lead',
      assigned_leads_count: 12,
      converted_leads_count: 6,
      rating: 4.8
    }
  ],

  agent_profiles: [
    {
      id: 'ap_vikram',
      user_id: 'usr_agent_vikram',
      agency_id: 'agency_travel_genie',
      company_name: 'GlobeTrotters B2B Partner Ltd',
      agent_id: 'AGT-9042',
      wholesale_discount_pct: 12,
      credit_limit: 500000,
      total_purchases: 380000,
      total_sales: 475000,
      total_margin: 95000,
      status: 'approved'
    },
    {
      id: 'ap_sunita',
      user_id: 'usr_agent_sunita',
      agency_id: 'agency_travel_genie',
      company_name: 'WanderExpress Holidays',
      agent_id: 'AGT-8811',
      wholesale_discount_pct: 10,
      credit_limit: 300000,
      total_purchases: 195000,
      total_sales: 245000,
      total_margin: 50000,
      status: 'approved'
    }
  ],

  customer_profiles: [
    {
      id: 'cp_ananya',
      user_id: 'usr_cust_ananya',
      agency_id: 'agency_travel_genie',
      passport_number: 'N7821940',
      emergency_contact: '+91 98765 11111',
      preferred_destinations: ['Switzerland', 'Maldives', 'Kashmir'],
      total_trips: 2
    },
    {
      id: 'cp_rohit',
      user_id: 'usr_cust_rohit',
      agency_id: 'agency_travel_genie',
      passport_number: 'Z9182374',
      emergency_contact: '+91 98765 22222',
      preferred_destinations: ['Bali', 'Dubai', 'Kerala'],
      total_trips: 1
    }
  ],

  hero_banners: [
    {
      id: 'banner_1',
      agency_id: 'agency_travel_genie',
      title: 'Experience Unforgettable Journeys Across The Globe',
      subtitle: 'Handcrafted domestic & international holiday experiences tailored exclusively for discerning travelers.',
      image_desktop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
      image_mobile: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      cta_text: 'Explore Packages',
      cta_link: '/packages',
      secondary_cta_text: 'Plan Your Trip',
      secondary_cta_link: '/#custom-trip',
      display_order: 1,
      is_active: true
    },
    {
      id: 'banner_2',
      agency_id: 'agency_travel_genie',
      title: 'Pure Romance in Secluded Tropical Paradises',
      subtitle: 'Discover private overwater villas, romantic sunset dhow cruises, and intimate candlelight dinners in Maldives & Bali.',
      image_desktop: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=85',
      image_mobile: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
      cta_text: 'Honeymoon Specials',
      cta_link: '/honeymoon',
      secondary_cta_text: 'Tailor Itinerary',
      secondary_cta_link: '/#custom-trip',
      display_order: 2,
      is_active: true
    },
    {
      id: 'banner_3',
      agency_id: 'agency_travel_genie',
      title: 'Curated Group Tours With Guaranteed Departures',
      subtitle: 'Connect with fellow explorers with expert local guides, 4-star handpicked hotels, and hassle-free transfers.',
      image_desktop: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=85',
      image_mobile: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
      cta_text: 'Upcoming Group Tours',
      cta_link: '/group-tours',
      secondary_cta_text: 'Contact Expert',
      secondary_cta_link: '/contact',
      display_order: 3,
      is_active: true
    }
  ],

  destinations: [
    {
      id: 'dest_kerala',
      agency_id: 'agency_travel_genie',
      name: 'Kerala',
      slug: 'kerala',
      country: 'India',
      region: 'India',
      description: 'God’s Own Country with emerald palm-fringed backwaters, misty tea gardens of Munnar, and tranquil Ayurvedic retreats.',
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
      package_count: 5,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_goa',
      agency_id: 'agency_travel_genie',
      name: 'Goa',
      slug: 'goa',
      country: 'India',
      region: 'India',
      description: 'Sun-kissed Arabian Sea beaches, vibrant coastal nightlife, Portuguese colonial architecture, and fresh seafood shacks.',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      package_count: 4,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_kashmir',
      agency_id: 'agency_travel_genie',
      name: 'Kashmir',
      slug: 'kashmir',
      country: 'India',
      region: 'India',
      description: 'Paradise on Earth featuring iconic Dal Lake shikara rides, snow-covered Gulmarg slopes, and scenic Betaab Valley.',
      image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
      package_count: 6,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_manali',
      agency_id: 'agency_travel_genie',
      name: 'Manali & Himachal',
      slug: 'manali',
      country: 'India',
      region: 'India',
      description: 'Crisp alpine air, Rohtang Pass glaciers, Solang Valley adventure sports, and charming pine-lined cedar cottages.',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
      package_count: 4,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_andaman',
      agency_id: 'agency_travel_genie',
      name: 'Andaman & Nicobar',
      slug: 'andaman',
      country: 'India',
      region: 'India',
      description: 'Pristine Radhanagar beaches, turquoise coral reefs for scuba diving, and historic Cellular Jail memorials.',
      image: 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&w=800&q=80',
      package_count: 3,
      is_featured: false,
      is_published: true
    },
    {
      id: 'dest_maldives',
      agency_id: 'agency_travel_genie',
      name: 'Maldives',
      slug: 'maldives',
      country: 'Maldives',
      region: 'Island Destinations',
      description: 'Exclusive five-star private atoll resorts, glass-bottom overwater bungalows, manta ray snorkelling, and infinite blue horizons.',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
      package_count: 5,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_bali',
      agency_id: 'agency_travel_genie',
      name: 'Bali',
      slug: 'bali',
      country: 'Indonesia',
      region: 'Asia',
      description: 'Sacred water temples, dramatic cascading rice terraces of Tegalalang, artistic Ubud soul, and cliffside Uluwatu sunsets.',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      package_count: 6,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_dubai',
      agency_id: 'agency_travel_genie',
      name: 'Dubai',
      slug: 'dubai',
      country: 'United Arab Emirates',
      region: 'Middle East',
      description: 'Sky-piercing Burj Khalifa, thrilling 4x4 desert dune safaris, luxury marina yacht cruises, and world-class shopping.',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
      package_count: 4,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_switzerland',
      agency_id: 'agency_travel_genie',
      name: 'Switzerland',
      slug: 'switzerland',
      country: 'Switzerland',
      region: 'Europe',
      description: 'Snow-crowned Alps, Jungfraujoch Top of Europe, pristine Lake Lucerne cruises, and legendary scenic Glacier Express train routes.',
      image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      package_count: 4,
      is_featured: true,
      is_published: true
    },
    {
      id: 'dest_singapore',
      agency_id: 'agency_travel_genie',
      name: 'Singapore',
      slug: 'singapore',
      country: 'Singapore',
      region: 'Asia',
      description: 'Futuristic Gardens by the Bay Supertrees, Marina Bay Sands rooftop vistas, Universal Studios, and Michelin-star street hawkers.',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
      package_count: 3,
      is_featured: false,
      is_published: true
    },
    {
      id: 'dest_paris',
      agency_id: 'agency_travel_genie',
      name: 'France & Paris',
      slug: 'france-paris',
      country: 'France',
      region: 'Europe',
      description: 'The City of Light, shimmering Eiffel Tower, romantic Seine river dining, Louvre masterpieces, and quaint Parisian sidewalk bistros.',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      package_count: 3,
      is_featured: false,
      is_published: true
    },
    {
      id: 'dest_vietnam',
      agency_id: 'agency_travel_genie',
      name: 'Vietnam',
      slug: 'vietnam',
      country: 'Vietnam',
      region: 'Asia',
      description: 'Emerald waters of Ha Long Bay limestone islands, lantern-lit streets of Hoi An, and vibrant street food culture in Hanoi.',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      package_count: 3,
      is_featured: false,
      is_published: true
    }
  ],

  packages: [
    {
      id: 'pkg_kashmir_paradise',
      agency_id: 'agency_travel_genie',
      title: 'Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam',
      slug: 'enchanting-kashmir-srinagar-gulmarg-pahalgam',
      destination_id: 'dest_kashmir',
      category: 'Domestic Holiday Packages',
      duration_days: 6,
      duration_nights: 5,
      public_price: 32500,
      wholesale_price: 26000,
      cover_image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Experience heaven on earth with traditional Kashmiri houseboat stays, shikara rides on Dal Lake, snow cable cars in Gulmarg, and lush pine valleys of Pahalgam.',
      highlights: [
        'Deluxe Houseboat Stay on serene Nigeen Lake',
        'Complimentary 1-Hour Shikara Sunset Ride',
        'Gulmarg Gondola Ride Phase 1 tickets included',
        'Pahalgam Betaab Valley & Aru Valley excursion',
        'Traditional Wazwan dinner experience'
      ],
      inclusions: [
        '5 Nights premium 4-star hotel & luxury houseboat accommodation',
        'Daily buffet breakfast and dinners',
        'All transfers & sightseeing by private AC Innova/Crysta',
        'Gondola Phase-1 passes and toll taxes',
        'Dedicated 24/7 on-tour concierge support'
      ],
      exclusions: [
        'Airfare / Train tickets to and from Srinagar',
        'Pony rides or snow sledging activities',
        'Expenses of personal nature and laundry',
        'Travel insurance (available upon request)'
      ],
      accommodation: '4-Star Pine Retreat Srinagar / Luxury Heritage Houseboat / Grand Mumtaz Gulmarg',
      transportation: 'Private chauffeur-driven AC Toyota Innova Crysta for all 6 days',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 18,
      upcoming_date: '2026-12-15'
    },
    {
      id: 'pkg_maldives_luxury',
      agency_id: 'agency_travel_genie',
      title: 'Romantic Maldives: 5-Star Overwater Villa Retreat',
      slug: 'romantic-maldives-overwater-villa-retreat',
      destination_id: 'dest_maldives',
      category: 'Honeymoon Packages',
      duration_days: 5,
      duration_nights: 4,
      public_price: 115000,
      wholesale_price: 92000,
      cover_image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'An idyllic romantic escape featuring an ultra-luxury water villa with private sundeck, direct lagoon access, all-inclusive gourmet dining, and couple spa sessions.',
      highlights: [
        '2 Nights Beach Villa + 2 Nights Water Villa with Plunge Pool',
        'Complimentary Scenic Seaplane Roundtrip Transfers',
        'All-Inclusive Meals: Unlimited Premium Cocktails & Fine Dining',
        'Sunset Dolphin Cruise on traditional Maldivian Dhoni',
        'Honeymoon Bed Decoration & Sparkling Wine Bottle'
      ],
      inclusions: [
        '4 Nights luxury 5-star island resort stay',
        'Full Board All-Inclusive meal plan (Breakfast, Lunch, Dinner, Drinks)',
        'Speedboat / Seaplane transfers from Velana Airport',
        'Complimentary non-motorized watersports & snorkeling equipment',
        'Green Tax and all island resort service charges'
      ],
      exclusions: [
        'International air tickets',
        'Motorized watersports (jet-ski, parasailing)',
        'Personal gratuities'
      ],
      accommodation: 'Centara Grand Island Resort & Spa / Villa Nautica Paradise Island',
      transportation: 'Scenic Seaplane / Luxury Speedboat transfers',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 10,
      upcoming_date: '2026-12-20'
    },
    {
      id: 'pkg_bali_bliss',
      agency_id: 'agency_travel_genie',
      title: 'Bali Wonders: Ubud Rainforest & Seminyak Beaches',
      slug: 'bali-wonders-ubud-rainforest-seminyak-beaches',
      destination_id: 'dest_bali',
      category: 'International Holiday Packages',
      duration_days: 7,
      duration_nights: 6,
      public_price: 48000,
      wholesale_price: 39000,
      cover_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Immerse yourself in Balinese culture, sacred monkey forests, jungle swings over Tegalalang rice terraces, and dramatic sunsets at Tanah Lot & Uluwatu cliff temples.',
      highlights: [
        '3 Nights in Ubud Jungle Villa + 3 Nights in Seminyak Coastal Resort',
        'Famous Bali Swing & Tegenungan Waterfall Tour',
        'Nusa Penida Island day excursion with Kelingking T-Rex Beach',
        'Sunset Seafood Dinner on the sands of Jimbaran Bay',
        'Kecak Fire Dance Performance at cliffside Uluwatu'
      ],
      inclusions: [
        '6 Nights 4-star boutique villa with private pool options',
        'Daily Indonesian & Continental breakfast',
        'Nusa Penida speed boat transfers & island transport',
        'Private AC vehicle for all transfers with English-speaking driver',
        'All temple entrance tickets & parking fees'
      ],
      exclusions: [
        'International flights',
        'Indonesian Visa on Arrival ($35 USD)',
        'Personal drinks and shopping'
      ],
      accommodation: 'The Kayon Jungle Resort Ubud / Courtyard by Marriott Seminyak',
      transportation: 'Private chauffeur-driven air-conditioned minivan',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 14,
      upcoming_date: '2027-01-10'
    },
    {
      id: 'pkg_dubai_extravaganza',
      agency_id: 'agency_travel_genie',
      title: 'Dazzling Dubai & Desert Odyssey',
      slug: 'dazzling-dubai-desert-odyssey',
      destination_id: 'dest_dubai',
      category: 'Family Holiday Packages',
      duration_days: 5,
      duration_nights: 4,
      public_price: 42000,
      wholesale_price: 34000,
      cover_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'The ultimate family holiday combining Burj Khalifa observation decks, thrilling 4x4 desert safari with belly dancing dinner, luxury Dhow Marina cruise, and Dubai Mall.',
      highlights: [
        'Burj Khalifa 124th & 125th Floor Observation Deck Tickets',
        'Desert Safari with Dune Bashing, Camel Rides, Tanoura & BBQ Dinner',
        'Dubai Marina 5-Star Luxury Dhow Dinner Cruise',
        'Dubai Frame & Miracle Garden entry tickets',
        'Dubai Mall Aquarium & Underwater Zoo'
      ],
      inclusions: [
        '4 Nights 4-star city hotel stay with daily breakfast',
        'Round-trip Dubai International Airport transfers',
        'All entry tickets as per itinerary',
        'Tourism Dirham Tax included',
        'Dedicated tour coordinator in Dubai'
      ],
      exclusions: [
        'Air tickets and UAE Tourist Visa',
        'Lunch and personal expenses',
        'Tips for drivers and safari guides'
      ],
      accommodation: 'Citymax Hotel Al Barsha / Millennium Place Dubai Marina',
      transportation: 'AC coach / 4x4 Land Cruiser for safari',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 20,
      upcoming_date: '2026-12-25'
    },
    {
      id: 'pkg_swiss_dream',
      agency_id: 'agency_travel_genie',
      title: 'Grand Swiss Alpine Odyssey: Zurich, Lucerne & Interlaken',
      slug: 'grand-swiss-alpine-odyssey',
      destination_id: 'dest_switzerland',
      category: 'International Holiday Packages',
      duration_days: 7,
      duration_nights: 6,
      public_price: 165000,
      wholesale_price: 135000,
      cover_image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Snow-clad peaks, glistening glacial lakes, world-famous mountain cogwheel railways, and iconic excursions to Jungfraujoch and Mount Titlis.',
      highlights: [
        'Swiss Travel Pass First Class (unlimited trains & steamers)',
        'Excursion to Jungfraujoch - Top of Europe (3,454m)',
        'Mount Titlis with Rotair 360 Revolving Cable Car and Ice Flyer',
        'Lake Lucerne scenic paddle-steamer cruise',
        'Chocolate tasting at Lindt Home of Chocolate Zurich'
      ],
      inclusions: [
        '6 Nights 4-star central hotels near railway stations',
        'Daily Swiss buffet breakfast',
        'Swiss Travel Pass 8 Days consecutive',
        'Mountain excursion vouchers (Titlis & Jungfrau)',
        'Schengen Visa assistance paperwork'
      ],
      exclusions: [
        'International flights and Schengen Visa fee',
        'City tourist taxes payable directly at hotels',
        'Lunches and dinners'
      ],
      accommodation: 'Hotel Bristol Zurich / Hotel Astoria Lucerne / Hotel Interlaken',
      transportation: 'Swiss Federal Railways (SBB) First Class & Alpine Cable Cars',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 12,
      upcoming_date: '2027-02-05'
    },
    {
      id: 'pkg_kerala_backwaters',
      agency_id: 'agency_travel_genie',
      title: 'Kerala Serenity: Munnar Hills, Thekkady & Alleppey Houseboat',
      slug: 'kerala-serenity-munnar-thekkady-alleppey',
      destination_id: 'dest_kerala',
      category: 'Domestic Holiday Packages',
      duration_days: 5,
      duration_nights: 4,
      public_price: 24500,
      wholesale_price: 19500,
      cover_image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Unwind amidst Munnar tea estates, Eravikulam National Park wildlife, spice plantations of Thekkady, and a private overnight traditional houseboat cruise on Alleppey backwaters.',
      highlights: [
        '2 Nights in Munnar + 1 Night Thekkady + 1 Night Private Alleppey Houseboat',
        'Authentic Kerala Ayurvedic Full Body Massage session',
        'Spice plantation walking tour with herbal expert',
        'Houseboat cruise with all meals prepared live by personal chef',
        'Cheeyappara and Valara waterfalls photo stops'
      ],
      inclusions: [
        '4 Nights premium accommodation including AC luxury houseboat',
        'Breakfast at all hotels + All meals on Houseboat (Lunch, Dinner, Breakfast)',
        'Private AC sedan/SUV for entire itinerary from Kochi to Kochi',
        'Toll, parking, and driver allowances'
      ],
      exclusions: [
        'Flights/Trains to Kochi',
        'Boating tickets at Periyar Lake (Thekkady)',
        'Personal expenses and tips'
      ],
      accommodation: 'Tea County Munnar / Spice Village Thekkady / Rainbow Cruises Alleppey',
      transportation: 'Dedicated AC Toyota Etios/Innova',
      is_featured: true,
      is_published: true,
      is_group_tour: false,
      available_seats: 25,
      upcoming_date: '2026-12-10'
    },
    {
      id: 'pkg_group_himachal',
      agency_id: 'agency_travel_genie',
      title: 'Shimla & Manali Snowy Escapade (Guaranteed Group Departure)',
      slug: 'shimla-manali-snowy-escapade-group',
      destination_id: 'dest_manali',
      category: 'Group Tours',
      duration_days: 6,
      duration_nights: 5,
      public_price: 18500,
      wholesale_price: 14800,
      cover_image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'A fun-filled group tour for families, solo travelers, and friends exploring Mall Road Shimla, Kufri snow viewpoint, Solang Valley adventures, and Atal Tunnel.',
      highlights: [
        'Guaranteed group departure with professional tour manager',
        'Evening DJ party & bonfire in Manali resort',
        'Solang Valley & Atal Tunnel excursion',
        'Shimla Ridge & historic Viceregal Lodge visit',
        'Comfortable Volvo luxury coach travel from Delhi'
      ],
      inclusions: [
        '5 Nights hotel stay on twin/triple sharing',
        'Breakfast and dinner included daily',
        'Delhi to Shimla to Manali to Delhi transfers by AC Volvo coach',
        'Local sightseeing by individual cabs on sharing basis'
      ],
      exclusions: [
        'Adventure sports costs (paragliding, skiing)',
        'Heater charges at hotels'
      ],
      accommodation: 'Hotel Snow Valley Shimla / Sterling Manali',
      transportation: 'Volvo AC semi-sleeper coach & local cabs',
      is_featured: false,
      is_published: true,
      is_group_tour: true,
      available_seats: 8,
      total_seats: 24,
      upcoming_date: '2026-12-22'
    },
    {
      id: 'pkg_group_vietnam',
      agency_id: 'agency_travel_genie',
      title: 'Vietnam Discovery: Hanoi, Halong Bay & Da Nang (Fixed Group Tour)',
      slug: 'vietnam-discovery-group-tour',
      destination_id: 'dest_vietnam',
      category: 'Group Tours',
      duration_days: 7,
      duration_nights: 6,
      public_price: 68500,
      wholesale_price: 55000,
      cover_image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Explore Vietnam with an energetic small group: overnight luxury cruise in mystical Halong Bay, Golden Hands Bridge in Ba Na Hills, and ancient Hoi An lanterns.',
      highlights: [
        'Overnight 5-Star Cruise on Halong Bay with kayaking & squid fishing',
        'Golden Hands Bridge cable car ride in Sun World Ba Na Hills',
        'Hoi An lantern boat release experience',
        'Water Puppet Show in historic Hanoi',
        'English-speaking Vietnamese guide throughout'
      ],
      inclusions: [
        '6 Nights 4 & 5-star hotel and cruise stays',
        'All breakfasts, 4 lunches, and Halong Bay gala dinners',
        'Domestic flight Hanoi to Da Nang included',
        'All sightseeing entrance fees and boat rides'
      ],
      exclusions: [
        'International flights (Delhi/Mumbai to Hanoi)',
        'Vietnam E-Visa ($25 USD)'
      ],
      accommodation: 'Silk Path Hotel Hanoi / Mon Cheri Cruise Halong / Belle Maison Da Nang',
      transportation: 'Luxury AC tourist bus and domestic airline',
      is_featured: false,
      is_published: true,
      is_group_tour: true,
      available_seats: 6,
      total_seats: 20,
      upcoming_date: '2027-01-18'
    },
    {
      id: 'pkg_honeymoon_paris',
      agency_id: 'agency_travel_genie',
      title: 'Parisian Romance & French Riviera Magic',
      slug: 'parisian-romance-french-riviera-magic',
      destination_id: 'dest_paris',
      category: 'Honeymoon Packages',
      duration_days: 8,
      duration_nights: 7,
      public_price: 189000,
      wholesale_price: 154000,
      cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'Indulge in the world’s most romantic city with champagne at the Eiffel Tower, Seine river dinner cruise, and sun-soaked Mediterranean days in Nice & Monaco.',
      highlights: [
        'VIP Priority Eiffel Tower 2nd Floor & Summit access',
        'Bateaux Parisiens 3-Course Gourmet Dinner Cruise',
        'High-speed TGV train journey to the French Riviera',
        'Day trip to glamorous Monaco & Eze medieval perfume village',
        'Professional couple photoshoot in front of the Eiffel Tower'
      ],
      inclusions: [
        '7 Nights in boutique 4-star romantic hotels',
        'Daily French breakfast with freshly baked croissants',
        'First class TGV rail tickets Paris to Nice',
        'All museum and cruise passes mentioned'
      ],
      exclusions: [
        'International flights',
        'Schengen Visa charges',
        'Personal dining and wine tastings'
      ],
      accommodation: 'Hotel Regina Louvre Paris / Hotel Suisse Nice Promenade',
      transportation: 'TGV Inoui high speed train & private airport transfers',
      is_featured: false,
      is_published: true,
      is_group_tour: false,
      available_seats: 8,
      upcoming_date: '2027-02-14'
    },
    {
      id: 'pkg_goa_getaway',
      agency_id: 'agency_travel_genie',
      title: 'Vibrant Goa: Beachfront Luxury & Heritage Mansions',
      slug: 'vibrant-goa-beachfront-luxury-heritage',
      destination_id: 'dest_goa',
      category: 'Weekend Getaways',
      duration_days: 4,
      duration_nights: 3,
      public_price: 16500,
      wholesale_price: 13200,
      cover_image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80'
      ],
      description: 'The ultimate coastal refresher: stay at a beach resort in Candolim, explore Latin Quarter Fontainhas, sail on a Mandovi river cruise, and relax by the sea.',
      highlights: [
        'Direct beach access resort in North Goa',
        'Guided heritage walking tour of Fontainhas Latin Quarter',
        'Sunset catamaran cruise with live Goan music',
        'Watersports combo (parasailing, jet ski, banana ride)'
      ],
      inclusions: [
        '3 Nights resort stay with breakfast',
        'Goa Airport / Thivim railway station AC transfers',
        '1 Day South Goa heritage tour in private car'
      ],
      exclusions: [
        'Flights to Goa',
        'Personal drinks and beach shack bills'
      ],
      accommodation: 'Taj Holiday Village Resort & Spa / Santana Beach Resort',
      transportation: 'Private AC car for transfers and tour',
      is_featured: false,
      is_published: true,
      is_group_tour: false,
      available_seats: 30,
      upcoming_date: '2026-12-08'
    }
  ],

  package_itineraries: [
    {
      id: 'it_kashmir_1',
      package_id: 'pkg_kashmir_paradise',
      day_number: 1,
      title: 'Arrival in Srinagar & Sunset Shikara on Dal Lake',
      description: 'Meet and greet at Srinagar Airport by our representative. Transfer to your luxury houseboat. Evening relaxing 1-hour shikara ride on Dal Lake passing floating gardens and lotus blossoms.',
      meals: 'Dinner',
      activities: 'Airport pickup, Houseboat check-in, Dal Lake Shikara ride'
    },
    {
      id: 'it_kashmir_2',
      package_id: 'pkg_kashmir_paradise',
      day_number: 2,
      title: 'Mughal Gardens & Historic Srinagar Sightseeing',
      description: 'Visit the world-renowned Mughal terraced gardens: Nishat Bagh (Garden of Pleasure) and Shalimar Bagh (Abode of Love), followed by Chashme Shahi and Shankaracharya Hill temple.',
      meals: 'Breakfast & Dinner',
      activities: 'Sightseeing of Mughal Gardens, Old Srinagar heritage walk'
    },
    {
      id: 'it_kashmir_3',
      package_id: 'pkg_kashmir_paradise',
      day_number: 3,
      title: 'Gulmarg Meadow of Flowers & Gondola Ride',
      description: 'Scenic drive to Gulmarg. Board the famous Gulmarg Gondola up to Kongdoori Phase 1 (elev. 10,000 ft). Enjoy snow views and optional skiing or snowmobiling.',
      meals: 'Breakfast & Dinner',
      activities: 'Gondola ride, snow play, alpine photography'
    },
    {
      id: 'it_kashmir_4',
      package_id: 'pkg_kashmir_paradise',
      day_number: 4,
      title: 'Pahalgam Valley of Shepherds & Lidder River',
      description: 'Drive along saffron fields of Pampore to reach Pahalgam. Visit scenic Betaab Valley where Bollywood movies were filmed, and stroll beside the turquoise Lidder river.',
      meals: 'Breakfast & Dinner',
      activities: 'Saffron field stop, Betaab Valley, Lidder river walk'
    },
    {
      id: 'it_kashmir_5',
      package_id: 'pkg_kashmir_paradise',
      day_number: 5,
      title: 'Aru Valley & Kashmiri Handicrafts Shopping',
      description: 'Explore the unspoiled alpine meadows of Aru Valley. Return to Srinagar for an afternoon visiting authentic Pashmina shawl looms and walnut woodcarving workshops.',
      meals: 'Breakfast & Dinner',
      activities: 'Aru Valley exploration, artisan craft workshops, Wazwan feast'
    },
    {
      id: 'it_kashmir_6',
      package_id: 'pkg_kashmir_paradise',
      day_number: 6,
      title: 'Departure with Cherished Himalayan Memories',
      description: 'After a leisurely breakfast overlooking the water, transfer to Srinagar International Airport for your flight home with unforgettable memories.',
      meals: 'Breakfast',
      activities: 'Souvenir shopping, airport drop'
    },
    {
      id: 'it_maldives_1',
      package_id: 'pkg_maldives_luxury',
      day_number: 1,
      title: 'Arrival in Male & Seaplane Transfer to Paradise Island',
      description: 'Land at Velana International Airport and board your scenic seaplane flight over sparkling atolls. Check in to your luxury Beach Villa. Welcome tropical cocktail & dinner.',
      meals: 'Dinner',
      activities: 'Seaplane transfer, resort welcome, beach sunset walk'
    },
    {
      id: 'it_maldives_2',
      package_id: 'pkg_maldives_luxury',
      day_number: 2,
      title: 'House Reef Snorkeling & Sunset Dolphin Cruise',
      description: 'Swim in warm crystal waters alongside sea turtles and colorful reef fish. In the late afternoon, embark on a traditional Maldivian Dhoni cruise to spot playful spinner dolphins.',
      meals: 'All Inclusive (Breakfast, Lunch, Dinner & Drinks)',
      activities: 'Guided reef snorkeling, sunset dolphin cruise'
    },
    {
      id: 'it_maldives_3',
      package_id: 'pkg_maldives_luxury',
      day_number: 3,
      title: 'Water Villa Check-In & Overwater Spa Therapy',
      description: 'Transfer to your iconic Overwater Villa with glass floor panels and direct sea stairs. Enjoy an afternoon couple signature aromatherapeutic massage at the overwater spa.',
      meals: 'All Inclusive',
      activities: 'Water villa transition, couple spa ritual, private sundeck relaxing'
    },
    {
      id: 'it_maldives_4',
      package_id: 'pkg_maldives_luxury',
      day_number: 4,
      title: 'Kayak Safari & Candlelight Beach Dinner',
      description: 'Paddle transparent kayaks across calm lagoons. In the evening, enjoy a private 5-course romantic candlelight dinner on the secluded beach under starlit skies.',
      meals: 'All Inclusive + Special Beach Dinner',
      activities: 'Clear kayak safari, private candlelight dinner'
    },
    {
      id: 'it_maldives_5',
      package_id: 'pkg_maldives_luxury',
      day_number: 5,
      title: 'Farewell Maldives & Seaplane Return',
      description: 'Enjoy a leisurely breakfast over the lagoon before your seaplane return transfer to Male for your flight home.',
      meals: 'Breakfast',
      activities: 'Seaplane flight to Male, departure'
    }
  ],

  leads: [
    {
      id: 'lead_1001',
      agency_id: 'agency_travel_genie',
      customer_id: 'usr_cust_ananya',
      customer_name: 'Ananya Rao',
      customer_email: 'ananya.customer@gmail.com',
      customer_phone: '+91 98765 00006',
      interested_destination: 'Maldives',
      interested_package_id: 'pkg_maldives_luxury',
      travel_date: '2026-12-20',
      travelers_count: 2,
      budget: '₹2,00,000 - ₹2,50,000',
      lead_source: 'Package Booking',
      status: 'Quotation Sent',
      assigned_staff_id: 'usr_staff_priya',
      assigned_staff_name: 'Priya Nair',
      follow_up_date: '2026-11-20',
      notes: 'Honeymoon couple looking for all-inclusive overwater villa with private pool. Sent customized quote with seaplane included.',
      created_at: '2026-11-16T14:30:00.000Z',
      updated_at: '2026-11-18T10:15:00.000Z'
    },
    {
      id: 'lead_1002',
      agency_id: 'agency_travel_genie',
      customer_id: 'usr_cust_rohit',
      customer_name: 'Rohit Kulkarni',
      customer_email: 'rohit.customer@gmail.com',
      customer_phone: '+91 98765 00007',
      interested_destination: 'Bali',
      interested_package_id: 'pkg_bali_bliss',
      travel_date: '2027-01-10',
      travelers_count: 4,
      budget: '₹1,50,000 - ₹2,00,000',
      lead_source: 'Website Enquiry',
      status: 'Converted',
      assigned_staff_id: 'usr_staff_rahul',
      assigned_staff_name: 'Rahul Verma',
      follow_up_date: null,
      notes: 'Family of 4 requested private villa in Ubud with day trip to Nusa Penida. Advance paid and booking confirmed!',
      created_at: '2026-11-14T09:20:00.000Z',
      updated_at: '2026-11-17T16:00:00.000Z'
    },
    {
      id: 'lead_1003',
      agency_id: 'agency_travel_genie',
      customer_id: null,
      customer_name: 'Dr. Sameer Joshi',
      customer_email: 'sameer.joshi@apollohospitals.org',
      customer_phone: '+91 98451 98765',
      interested_destination: 'Switzerland',
      interested_package_id: 'pkg_swiss_dream',
      travel_date: '2027-02-05',
      travelers_count: 2,
      budget: '₹3,50,000+',
      lead_source: 'Custom Trip Form',
      status: 'Contacted',
      assigned_staff_id: 'usr_staff_priya',
      assigned_staff_name: 'Priya Nair',
      follow_up_date: '2026-11-21',
      notes: 'Wants First Class Swiss pass and Jungfraujoch. Follow up requested on Friday afternoon.',
      created_at: '2026-11-17T11:45:00.000Z',
      updated_at: '2026-11-18T12:00:00.000Z'
    },
    {
      id: 'lead_1004',
      agency_id: 'agency_travel_genie',
      customer_id: null,
      customer_name: 'Meenakshi Iyer',
      customer_email: 'meenakshi.iyer@tcs.com',
      customer_phone: '+91 97401 23456',
      interested_destination: 'Kashmir',
      interested_package_id: 'pkg_kashmir_paradise',
      travel_date: '2026-12-15',
      travelers_count: 6,
      budget: '₹1,80,000 - ₹2,20,000',
      lead_source: 'Website Enquiry',
      status: 'Follow-up Required',
      assigned_staff_id: 'usr_staff_rahul',
      assigned_staff_name: 'Rahul Verma',
      follow_up_date: '2026-11-19',
      notes: 'Group of 6 colleagues. Comparing rates with another vendor. Re-sent updated package with complimentary Shikara & Wazwan.',
      created_at: '2026-11-15T15:10:00.000Z',
      updated_at: '2026-11-18T14:30:00.000Z'
    },
    {
      id: 'lead_1005',
      agency_id: 'agency_travel_genie',
      customer_id: null,
      customer_name: 'Karan Malhotra',
      customer_email: 'karan.m@gmail.com',
      customer_phone: '+91 99887 66554',
      interested_destination: 'Dubai',
      interested_package_id: 'pkg_dubai_extravaganza',
      travel_date: '2026-12-25',
      travelers_count: 3,
      budget: '₹1,20,000 - ₹1,50,000',
      lead_source: 'Contact Form',
      status: 'New',
      assigned_staff_id: null,
      assigned_staff_name: 'Unassigned',
      follow_up_date: null,
      notes: 'Family with 7-year old child. Wants Dubai Parks and Burj Khalifa. Needs assignment.',
      created_at: '2026-11-19T08:15:00.000Z',
      updated_at: '2026-11-19T08:15:00.000Z'
    },
    {
      id: 'lead_1006',
      agency_id: 'agency_travel_genie',
      customer_id: null,
      customer_name: 'Rajesh & Kavita Bansal',
      customer_email: 'bansal.exports@gmail.com',
      customer_phone: '+91 94140 11223',
      interested_destination: 'Kerala',
      interested_package_id: 'pkg_kerala_backwaters',
      travel_date: '2026-12-10',
      travelers_count: 2,
      budget: '₹50,000 - ₹60,000',
      lead_source: 'Agent Referral',
      status: 'Assigned',
      assigned_staff_id: 'usr_staff_rahul',
      assigned_staff_name: 'Rahul Verma',
      follow_up_date: '2026-11-20',
      notes: 'Referred by Agent Vikram Singhania. Looking for peaceful Ayurvedic luxury houseboat.',
      created_at: '2026-11-18T16:20:00.000Z',
      updated_at: '2026-11-18T17:00:00.000Z'
    }
  ],

  lead_activities: [
    {
      id: 'act_1',
      lead_id: 'lead_1001',
      user_id: 'usr_admin_genie',
      activity_type: 'assignment',
      description: 'Lead auto-assigned to Senior Consultant Priya Nair',
      created_at: '2026-11-16T14:35:00.000Z'
    },
    {
      id: 'act_2',
      lead_id: 'lead_1001',
      user_id: 'usr_staff_priya',
      activity_type: 'contact',
      description: 'Spoke with Ananya Rao via phone. Discussed romantic villa options in Maldives.',
      created_at: '2026-11-17T11:00:00.000Z'
    },
    {
      id: 'act_3',
      lead_id: 'lead_1001',
      user_id: 'usr_staff_priya',
      activity_type: 'quotation',
      description: 'Generated & dispatched formal quotation #QT-2026-8801 for ₹2,30,000.',
      created_at: '2026-11-18T10:15:00.000Z'
    },
    {
      id: 'act_4',
      lead_id: 'lead_1002',
      user_id: 'usr_staff_rahul',
      activity_type: 'status_change',
      description: 'Lead converted to confirmed Booking #BK-2026-4011 upon advance payment.',
      created_at: '2026-11-17T16:00:00.000Z'
    }
  ],

  quotations: [
    {
      id: 'qt_8801',
      agency_id: 'agency_travel_genie',
      lead_id: 'lead_1001',
      package_id: 'pkg_maldives_luxury',
      staff_id: 'usr_staff_priya',
      quotation_number: 'QT-2026-8801',
      customer_name: 'Ananya Rao',
      total_amount: 245000,
      discount: 15000,
      final_amount: 230000,
      status: 'Sent',
      valid_until: '2026-11-25',
      items: [
        { description: 'Romantic Maldives 5-Star Resort (2 Beach + 2 Water Villa)', amount: 210000 },
        { description: 'Roundtrip Seaplane Transfers for 2 Guests', amount: 25000 },
        { description: 'Private Beach Candlelight 5-Course Dinner', amount: 10000 }
      ],
      notes: 'Includes all island taxes, green taxes, and complimentary dolphin cruise.',
      created_at: '2026-11-18T10:15:00.000Z'
    }
  ],

  bookings: [
    {
      id: 'bk_4011',
      agency_id: 'agency_travel_genie',
      booking_number: 'BK-2026-4011',
      customer_id: 'usr_cust_rohit',
      customer_name: 'Rohit Kulkarni',
      customer_email: 'rohit.customer@gmail.com',
      agent_id: null,
      package_id: 'pkg_bali_bliss',
      package_title: 'Bali Wonders: Ubud Rainforest & Seminyak Beaches',
      travel_start_date: '2027-01-10',
      travel_end_date: '2027-01-16',
      travelers_count: 4,
      total_amount: 192000,
      advance_amount: 60000,
      balance_amount: 132000,
      payment_status: 'Partial',
      booking_status: 'Confirmed',
      special_requests: 'Adjoining rooms in Seminyak, vegetarian meal preference on flights.',
      created_at: '2026-11-17T16:00:00.000Z'
    },
    {
      id: 'bk_4012',
      agency_id: 'agency_travel_genie',
      booking_number: 'BK-2026-4012',
      customer_id: null,
      customer_name: 'Client of GlobeTrotters (Mr. Akash Verma)',
      customer_email: 'akash.verma.client@gmail.com',
      agent_id: 'usr_agent_vikram',
      package_id: 'pkg_kashmir_paradise',
      package_title: 'Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam',
      travel_start_date: '2026-12-15',
      travel_end_date: '2026-12-20',
      travelers_count: 2,
      total_amount: 65000,
      advance_amount: 52000,
      balance_amount: 0,
      payment_status: 'Paid',
      booking_status: 'Confirmed',
      special_requests: 'B2B Wholesale resale by Agent Vikram Singhania.',
      created_at: '2026-11-16T12:00:00.000Z'
    }
  ],

  booking_travellers: [
    {
      id: 'bt_1',
      booking_id: 'bk_4011',
      full_name: 'Rohit Kulkarni',
      age: 38,
      gender: 'Male',
      passport_or_id: 'Z9182374'
    },
    {
      id: 'bt_2',
      booking_id: 'bk_4011',
      full_name: 'Sneha Kulkarni',
      age: 35,
      gender: 'Female',
      passport_or_id: 'Z9182375'
    },
    {
      id: 'bt_3',
      booking_id: 'bk_4011',
      full_name: 'Aarav Kulkarni',
      age: 10,
      gender: 'Male',
      passport_or_id: 'Z9182376'
    },
    {
      id: 'bt_4',
      booking_id: 'bk_4011',
      full_name: 'Myra Kulkarni',
      age: 6,
      gender: 'Female',
      passport_or_id: 'Z9182377'
    }
  ],

  payments: [
    {
      id: 'pay_701',
      agency_id: 'agency_travel_genie',
      booking_id: 'bk_4011',
      amount: 60000,
      payment_type: 'Advance',
      payment_method: 'UPI',
      transaction_reference: 'UPI/20261117/998124801',
      payment_date: '2026-11-17T16:05:00.000Z',
      notes: 'Initial 30% booking advance received.',
      status: 'Completed'
    },
    {
      id: 'pay_702',
      agency_id: 'agency_travel_genie',
      booking_id: 'bk_4012',
      amount: 52000,
      payment_type: 'Full',
      payment_method: 'Bank Transfer',
      transaction_reference: 'NEFT/HDFC/20261116/102948',
      payment_date: '2026-11-16T12:30:00.000Z',
      notes: 'Wholesale B2B payment received from GlobeTrotters Ltd.',
      status: 'Completed'
    }
  ],

  agent_purchases: [
    {
      id: 'pur_501',
      agency_id: 'agency_travel_genie',
      agent_id: 'usr_agent_vikram',
      package_id: 'pkg_kashmir_paradise',
      package_title: 'Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam',
      travelers_count: 2,
      travel_date: '2026-12-15',
      wholesale_price: 26000,
      total_cost: 52000,
      client_name: 'Mr. Akash Verma & Spouse',
      client_selling_price: 65000,
      projected_margin: 13000,
      status: 'Confirmed',
      created_at: '2026-11-16T11:30:00.000Z'
    },
    {
      id: 'pur_502',
      agency_id: 'agency_travel_genie',
      agent_id: 'usr_agent_vikram',
      package_id: 'pkg_dubai_extravaganza',
      package_title: 'Dazzling Dubai & Desert Odyssey',
      travelers_count: 4,
      travel_date: '2027-01-05',
      wholesale_price: 34000,
      total_cost: 136000,
      client_name: 'Pooja Enterprises Executives',
      client_selling_price: 168000,
      projected_margin: 32000,
      status: 'Pending',
      created_at: '2026-11-18T15:00:00.000Z'
    }
  ],

  agent_transactions: [
    {
      id: 'tx_301',
      agency_id: 'agency_travel_genie',
      agent_id: 'usr_agent_vikram',
      type: 'Purchase',
      amount: 52000,
      balance_after: 52000,
      reference_id: 'pur_501',
      description: 'Package purchase: Enchanting Kashmir (2 pax)',
      created_at: '2026-11-16T11:30:00.000Z'
    },
    {
      id: 'tx_302',
      agency_id: 'agency_travel_genie',
      agent_id: 'usr_agent_vikram',
      type: 'Payment',
      amount: 52000,
      balance_after: 0,
      reference_id: 'pay_702',
      description: 'NEFT settlement for Purchase #pur_501',
      created_at: '2026-11-16T12:30:00.000Z'
    }
  ],

  testimonials: [
    {
      id: 'test_1',
      agency_id: 'agency_travel_genie',
      customer_name: 'Tanvi & Siddharth Mehta',
      customer_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      destination: 'Maldives Honeymoon',
      rating: 5,
      comment: 'Travel Genie curated the dream honeymoon for us! From the private seaplane ride to our overwater bungalow and romantic starlit beach dinner, every detail was flawlessly executed. 10/10 recommendation!',
      is_published: true,
      created_at: '2026-10-15T00:00:00.000Z'
    },
    {
      id: 'test_2',
      agency_id: 'agency_travel_genie',
      customer_name: 'Rajiv Nambiar & Family',
      customer_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      destination: 'Kashmir Paradise Tour',
      rating: 5,
      comment: 'Our family trip to Kashmir was pure magic. The houseboat was sparkling clean and the shikara ride at sunset was unforgettable. Senior Consultant Priya was available on WhatsApp round the clock.',
      is_published: true,
      created_at: '2026-10-28T00:00:00.000Z'
    },
    {
      id: 'test_3',
      agency_id: 'agency_travel_genie',
      customer_name: 'Capt. Rakesh Verma',
      customer_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      destination: 'Switzerland Grand Alpine',
      rating: 5,
      comment: 'The Swiss Travel Pass and hotel vouchers worked like clockwork. Jungfraujoch was spectacular. True professional travel curators who genuinely care about client comfort!',
      is_published: true,
      created_at: '2026-11-05T00:00:00.000Z'
    }
  ],

  notifications: [
    {
      id: 'notif_1',
      agency_id: 'agency_travel_genie',
      user_id: 'usr_admin_genie',
      title: 'New Customer Enquiry',
      message: 'Karan Malhotra submitted an enquiry for Dazzling Dubai package.',
      type: 'info',
      link: '/admin/leads',
      is_read: false,
      created_at: '2026-11-19T08:15:00.000Z'
    },
    {
      id: 'notif_2',
      agency_id: 'agency_travel_genie',
      user_id: 'usr_staff_priya',
      title: 'Quotation Viewed by Client',
      message: 'Ananya Rao opened Quotation QT-2026-8801 for Maldives.',
      type: 'success',
      link: '/staff/leads',
      is_read: false,
      created_at: '2026-11-18T14:00:00.000Z'
    },
    {
      id: 'notif_3',
      agency_id: 'agency_travel_genie',
      user_id: 'usr_agent_vikram',
      title: 'Purchase Order Confirmed',
      message: 'Your purchase order #pur_501 for Kashmir has been confirmed by Admin.',
      type: 'success',
      link: '/agent/purchases',
      is_read: false,
      created_at: '2026-11-16T12:00:00.000Z'
    },
    {
      id: 'notif_4',
      agency_id: 'agency_travel_genie',
      user_id: 'usr_cust_ananya',
      title: 'Customized Quotation Ready',
      message: 'Priya Nair has sent your personalized Maldives quotation. View details and confirm.',
      type: 'info',
      link: '/customer/enquiries',
      is_read: false,
      created_at: '2026-11-18T10:15:00.000Z'
    }
  ],

  travel_services: [
    {
      id: 'srv_flight',
      agency_id: 'agency_travel_genie',
      title: 'Flight Ticket Booking',
      icon: 'Plane',
      short_desc: 'Domestic & international flights with exclusive corporate and group fares.',
      details: 'Instant ticketing across all major international and domestic airlines with flexible rescheduling, extra baggage allowance assistance, and 24/7 flight delay monitoring.'
    },
    {
      id: 'srv_bus',
      agency_id: 'agency_travel_genie',
      title: 'Bus Ticket Booking',
      icon: 'Bus',
      short_desc: 'Comfortable sleeper & semi-sleeper Volvo buses across India.',
      details: 'Curated intercity luxury coach bookings with guaranteed seat selection, verified operator safety ratings, and contactless digital boarding passes.'
    },
    {
      id: 'srv_car',
      agency_id: 'agency_travel_genie',
      title: 'Car Rental & Chauffeur Services',
      icon: 'Car',
      short_desc: 'Clean, sanitized sedans, luxury SUVs, and tempo travelers with polite drivers.',
      details: 'From airport drop-offs to multi-day hill station tours, choose from Toyota Crysta, Fortuner, Mercedes E-Class, and spacious luxury vans.'
    },
    {
      id: 'srv_cruise',
      agency_id: 'agency_travel_genie',
      title: 'Luxury Cruise Booking',
      icon: 'Ship',
      short_desc: 'Royal Caribbean, Cordelia, and European river cruise reservations.',
      details: 'Sail through Southeast Asia, the Mediterranean, or the Indian coastline with ocean-view balconies, Broadway shows, and all-inclusive gourmet dining.'
    },
    {
      id: 'srv_hotel',
      agency_id: 'agency_travel_genie',
      title: 'Hotel Reservations',
      icon: 'Building2',
      short_desc: 'Verified 3-star, 4-star, and 5-star luxury heritage resorts worldwide.',
      details: 'Special negotiated travel agency rates, complimentary room upgrades, early check-in requests, and free daily breakfast packages.'
    },
    {
      id: 'srv_visa',
      agency_id: 'agency_travel_genie',
      title: 'Visa Assistance Services',
      icon: 'FileCheck',
      short_desc: 'Hassle-free Schengen, USA, UK, UAE, and Singapore visa documentation.',
      details: 'Expert end-to-end guidance on application preparation, cover letter drafting, appointment scheduling, and biometrics interview readiness.'
    },
    {
      id: 'srv_insurance',
      agency_id: 'agency_travel_genie',
      title: 'Travel Insurance Assistance',
      icon: 'ShieldCheck',
      short_desc: 'Comprehensive medical, flight delay, baggage loss, and trip cancellation cover.',
      details: 'Zero-deductible overseas medical emergency cover accepted by Schengen consulates, with 24/7 cashless hospitalization assistance.'
    },
    {
      id: 'srv_transfer',
      agency_id: 'agency_travel_genie',
      title: 'Airport Transfers',
      icon: 'MapPin',
      short_desc: 'Punctual meet & greet transfers at over 350 airports globally.',
      details: 'Professional English-speaking chauffeurs waiting at arrival gates with name boards, flight tracking for delays, and fixed transparent pricing.'
    },
    {
      id: 'srv_webcheckin',
      agency_id: 'agency_travel_genie',
      title: 'Web Check-In Assistance',
      icon: 'CheckCircle',
      short_desc: 'Automatic seat allocation, baggage tagging, and digital boarding pass delivery.',
      details: 'Skip airport queues: our operations team automatically completes web check-in as soon as airline windows open and WhatsApps boarding passes to you.'
    },
    {
      id: 'srv_custom_itinerary',
      agency_id: 'agency_travel_genie',
      title: 'Customized Travel Itineraries',
      icon: 'Compass',
      short_desc: 'Bespoke holiday planning tailored to your exact budget, pace, and interests.',
      details: 'Personal travel designer creates hour-by-hour itineraries with secret photo spots, offbeat culinary stops, and private guides.'
    }
  ],

  contact_enquiries: [
    {
      id: 'cnt_1',
      agency_id: 'agency_travel_genie',
      name: 'Pooja Hegde',
      email: 'pooja.h@yahoo.com',
      phone: '+91 99001 22334',
      subject: 'Corporate Annual Offsite in Goa',
      message: 'We are looking for a 3-night offsite for 45 team members with conference room facilities and team building beach events.',
      status: 'New',
      created_at: '2026-11-19T09:30:00.000Z'
    }
  ]
};

module.exports = { seedData };
