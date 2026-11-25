const seedData = {
  "agencies": [
    {
      "id": "agency_travel_genie",
      "name": "Travel Genie Holidays & Tours",
      "slug": "travel-genie",
      "tagline": "Your Trusted Travel Partner for Extraordinary Journeys",
      "email": "info@tripbygenie.in",
      "phone": "+91 98765 43210",
      "whatsapp": "+91 98765 43210",
      "address": "Travel Genie Heights, 4th Floor, MG Road, Bengaluru, Karnataka 560001, India",
      "currency": "INR",
      "currency_symbol": "₹",
      "logo": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80",
      "status": "active",
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "agency_voyage_bliss",
      "name": "Voyage Bliss Luxury Travels",
      "slug": "voyage-bliss",
      "tagline": "Ultra-Luxury Bespoke Curated Expeditions",
      "email": "contact@voyagebliss.com",
      "phone": "+91 91234 56789",
      "whatsapp": "+91 91234 56789",
      "address": "Voyage House, 12th Floor, Nariman Point, Mumbai, Maharashtra 400021, India",
      "currency": "INR",
      "currency_symbol": "₹",
      "logo": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80",
      "status": "active",
      "created_at": "2026-01-10T00:00:00.000Z"
    }
  ],
  "agency_settings": [
    {
      "id": "as_travel_genie",
      "agency_id": "agency_travel_genie",
      "default_wholesale_discount_pct": 12,
      "lead_auto_assign": true,
      "advance_payment_pct": 30,
      "support_email": "support@tripbygenie.in",
      "terms_conditions": "Standard cancellation policy applies. 25% charge for cancellations within 14 days of travel.",
      "theme": {
        "primary_navy": "#082C43",
        "ocean_blue": "#17648A",
        "warm_cream": "#F8F1E7",
        "coral": "#FF795C",
        "turquoise": "#55C9BD"
      }
    },
    {
      "id": "as_voyage_bliss",
      "agency_id": "agency_voyage_bliss",
      "default_wholesale_discount_pct": 15,
      "lead_auto_assign": false,
      "advance_payment_pct": 40,
      "support_email": "concierge@voyagebliss.com",
      "terms_conditions": "Luxury bespoke bookings require non-refundable deposits.",
      "theme": {
        "primary_navy": "#082C43",
        "ocean_blue": "#17648A",
        "warm_cream": "#F8F1E7",
        "coral": "#FF795C",
        "turquoise": "#55C9BD"
      }
    }
  ],
  "users": [
    {
      "id": "usr_admin_genie",
      "agency_id": "agency_travel_genie",
      "role": "admin",
      "name": "Aditya Sharma",
      "email": "admin@travelgenie.com",
      "phone": "+91 98765 00001",
      "password_hash": "$2b$10$x6ZyU8w.XhGd43pQbAf9yuG.kt1TzuSS3GATZGkXq.kYQa4jsIT5O",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-01T10:00:00.000Z"
    },
    {
      "id": "usr_staff_priya",
      "agency_id": "agency_travel_genie",
      "role": "staff",
      "name": "Priya Nair",
      "email": "priya.staff@travelgenie.com",
      "phone": "+91 98765 00002",
      "password_hash": "$2b$10$YQOBcC7gRk9iDuZ9FcXdgeoo856PZZCS3U2FJKcYQBNzvn8XhdHZW",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-05T10:00:00.000Z"
    },
    {
      "id": "usr_staff_rahul",
      "agency_id": "agency_travel_genie",
      "role": "staff",
      "name": "Rahul Verma",
      "email": "rahul.staff@travelgenie.com",
      "phone": "+91 98765 00003",
      "password_hash": "$2b$10$YQOBcC7gRk9iDuZ9FcXdgeoo856PZZCS3U2FJKcYQBNzvn8XhdHZW",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-06T10:00:00.000Z"
    },
    {
      "id": "usr_agent_vikram",
      "agency_id": "agency_travel_genie",
      "role": "agent",
      "name": "Vikram Singhania",
      "email": "vikram.agent@globetrotters.com",
      "phone": "+91 98765 00004",
      "password_hash": "$2b$10$vURePlXjRFcZJ8giMQ8VOuRFZLa34Q4lrrHNXgWqq57YUinCCj9r.",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-10T10:00:00.000Z"
    },
    {
      "id": "usr_agent_sunita",
      "agency_id": "agency_travel_genie",
      "role": "agent",
      "name": "Sunita Mehra",
      "email": "sunita.agent@wanderexpress.com",
      "phone": "+91 98765 00005",
      "password_hash": "$2b$10$vURePlXjRFcZJ8giMQ8VOuRFZLa34Q4lrrHNXgWqq57YUinCCj9r.",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-12T10:00:00.000Z"
    },
    {
      "id": "usr_cust_ananya",
      "agency_id": "agency_travel_genie",
      "role": "customer",
      "name": "Ananya Rao",
      "email": "ananya.customer@gmail.com",
      "phone": "+91 98765 00006",
      "password_hash": "$2b$10$0KC1ZZ.6QHwD5T/JEnfPueAF7HZLb8OkskuketpqCkSkxRMlFJIdS",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-15T10:00:00.000Z"
    },
    {
      "id": "usr_cust_rohit",
      "agency_id": "agency_travel_genie",
      "role": "customer",
      "name": "Rohit Kulkarni",
      "email": "rohit.customer@gmail.com",
      "phone": "+91 98765 00007",
      "password_hash": "$2b$10$0KC1ZZ.6QHwD5T/JEnfPueAF7HZLb8OkskuketpqCkSkxRMlFJIdS",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "id": "usr_admin_voyage",
      "agency_id": "agency_voyage_bliss",
      "role": "admin",
      "name": "Devraj Kapur",
      "email": "admin@voyagebliss.com",
      "phone": "+91 91234 00001",
      "password_hash": "$2b$10$g.Djn1W8X/XrXp8JImNQguf2hBvqksrd2nDY5hlhvZK19uTyQuCqq",
      "status": "active",
      "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      "created_at": "2026-01-10T10:00:00.000Z"
    }
  ],
  "staff_profiles": [
    {
      "id": "sp_priya",
      "user_id": "usr_staff_priya",
      "agency_id": "agency_travel_genie",
      "employee_id": "TG-EMP-101",
      "department": "Holidays & International",
      "designation": "Senior Travel Consultant",
      "assigned_leads_count": 14,
      "converted_leads_count": 8,
      "rating": 4.9
    },
    {
      "id": "sp_rahul",
      "user_id": "usr_staff_rahul",
      "agency_id": "agency_travel_genie",
      "employee_id": "TG-EMP-102",
      "department": "Domestic & Group Tours",
      "designation": "Tour Operations Lead",
      "assigned_leads_count": 12,
      "converted_leads_count": 6,
      "rating": 4.8
    }
  ],
  "agent_profiles": [
    {
      "id": "ap_vikram",
      "user_id": "usr_agent_vikram",
      "agency_id": "agency_travel_genie",
      "company_name": "GlobeTrotters B2B Partner Ltd",
      "agent_id": "AGT-9042",
      "wholesale_discount_pct": 12,
      "credit_limit": 500000,
      "total_purchases": 380000,
      "total_sales": 475000,
      "total_margin": 95000,
      "status": "approved"
    },
    {
      "id": "ap_sunita",
      "user_id": "usr_agent_sunita",
      "agency_id": "agency_travel_genie",
      "company_name": "WanderExpress Holidays",
      "agent_id": "AGT-8811",
      "wholesale_discount_pct": 10,
      "credit_limit": 300000,
      "total_purchases": 195000,
      "total_sales": 245000,
      "total_margin": 50000,
      "status": "approved"
    }
  ],
  "customer_profiles": [
    {
      "id": "cp_ananya",
      "user_id": "usr_cust_ananya",
      "agency_id": "agency_travel_genie",
      "passport_number": "N7821940",
      "emergency_contact": "+91 98765 11111",
      "preferred_destinations": [
        "Switzerland",
        "Maldives",
        "Kashmir"
      ],
      "total_trips": 2
    },
    {
      "id": "cp_rohit",
      "user_id": "usr_cust_rohit",
      "agency_id": "agency_travel_genie",
      "passport_number": "Z9182374",
      "emergency_contact": "+91 98765 22222",
      "preferred_destinations": [
        "Bali",
        "Dubai",
        "Kerala"
      ],
      "total_trips": 1
    }
  ],
  "hero_banners": [
    {
      "id": "banner_1",
      "agency_id": "agency_travel_genie",
      "title": "Experience Unforgettable Journeys Across The Globe",
      "subtitle": "Handcrafted domestic & international holiday experiences tailored exclusively for discerning travelers.",
      "image_desktop": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85",
      "image_mobile": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "cta_text": "Explore Packages",
      "cta_link": "/packages",
      "secondary_cta_text": "Plan Your Trip",
      "secondary_cta_link": "/#custom-trip",
      "display_order": 1,
      "is_active": true
    },
    {
      "id": "banner_2",
      "agency_id": "agency_travel_genie",
      "title": "Pure Romance in Secluded Tropical Paradises",
      "subtitle": "Discover private overwater villas, romantic sunset dhow cruises, and intimate candlelight dinners in Maldives & Bali.",
      "image_desktop": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=85",
      "image_mobile": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
      "cta_text": "Honeymoon Specials",
      "cta_link": "/honeymoon",
      "secondary_cta_text": "Tailor Itinerary",
      "secondary_cta_link": "/#custom-trip",
      "display_order": 2,
      "is_active": true
    },
    {
      "id": "banner_3",
      "agency_id": "agency_travel_genie",
      "title": "Curated Group Tours With Guaranteed Departures",
      "subtitle": "Connect with fellow explorers with expert local guides, 4-star handpicked hotels, and hassle-free transfers.",
      "image_desktop": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=85",
      "image_mobile": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      "cta_text": "Upcoming Group Tours",
      "cta_link": "/group-tours",
      "secondary_cta_text": "Contact Expert",
      "secondary_cta_link": "/contact",
      "display_order": 3,
      "is_active": true
    }
  ],
  "destinations": [
    {
      "id": "dest_kerala",
      "agency_id": "agency_travel_genie",
      "name": "Kerala",
      "slug": "kerala",
      "country": "India",
      "region": "India",
      "description": "God’s Own Country with emerald palm-fringed backwaters, misty tea gardens of Munnar, and tranquil Ayurvedic retreats.",
      "image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_goa",
      "agency_id": "agency_travel_genie",
      "name": "Goa",
      "slug": "goa",
      "country": "India",
      "region": "India",
      "description": "Sun-kissed Arabian Sea beaches, vibrant coastal nightlife, Portuguese colonial architecture, and fresh seafood shacks.",
      "image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_kashmir",
      "agency_id": "agency_travel_genie",
      "name": "Kashmir",
      "slug": "kashmir",
      "country": "India",
      "region": "India",
      "description": "Paradise on Earth featuring iconic Dal Lake shikara rides, snow-covered Gulmarg slopes, and scenic Betaab Valley.",
      "image": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_manali",
      "agency_id": "agency_travel_genie",
      "name": "Manali & Himachal",
      "slug": "manali",
      "country": "India",
      "region": "India",
      "description": "Crisp alpine air, Rohtang Pass glaciers, Solang Valley adventure sports, and charming pine-lined cedar cottages.",
      "image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_andaman",
      "agency_id": "agency_travel_genie",
      "name": "Andaman & Nicobar",
      "slug": "andaman",
      "country": "India",
      "region": "India",
      "description": "Pristine Radhanagar beaches, turquoise coral reefs for scuba diving, and historic Cellular Jail memorials.",
      "image": "https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&w=800&q=80",
      "package_count": 3,
      "is_featured": false,
      "is_published": true
    },
    {
      "id": "dest_maldives",
      "agency_id": "agency_travel_genie",
      "name": "Maldives",
      "slug": "maldives",
      "country": "Maldives",
      "region": "Island Destinations",
      "description": "Exclusive five-star private atoll resorts, glass-bottom overwater bungalows, manta ray snorkelling, and infinite blue horizons.",
      "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_bali",
      "agency_id": "agency_travel_genie",
      "name": "Bali",
      "slug": "bali",
      "country": "Indonesia",
      "region": "Asia",
      "description": "Sacred water temples, dramatic cascading rice terraces of Tegalalang, artistic Ubud soul, and cliffside Uluwatu sunsets.",
      "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_dubai",
      "agency_id": "agency_travel_genie",
      "name": "Dubai",
      "slug": "dubai",
      "country": "United Arab Emirates",
      "region": "Middle East",
      "description": "Sky-piercing Burj Khalifa, thrilling 4x4 desert dune safaris, luxury marina yacht cruises, and world-class shopping.",
      "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_switzerland",
      "agency_id": "agency_travel_genie",
      "name": "Switzerland",
      "slug": "switzerland",
      "country": "Switzerland",
      "region": "Europe",
      "description": "Snow-crowned Alps, Jungfraujoch Top of Europe, pristine Lake Lucerne cruises, and legendary scenic Glacier Express train routes.",
      "image": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": true,
      "is_published": true
    },
    {
      "id": "dest_singapore",
      "agency_id": "agency_travel_genie",
      "name": "Singapore",
      "slug": "singapore",
      "country": "Singapore",
      "region": "Asia",
      "description": "Futuristic Gardens by the Bay Supertrees, Marina Bay Sands rooftop vistas, Universal Studios, and Michelin-star street hawkers.",
      "image": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
      "package_count": 0,
      "is_featured": false,
      "is_published": true
    },
    {
      "id": "dest_paris",
      "agency_id": "agency_travel_genie",
      "name": "France & Paris",
      "slug": "france-paris",
      "country": "France",
      "region": "Europe",
      "description": "The City of Light, shimmering Eiffel Tower, romantic Seine river dining, Louvre masterpieces, and quaint Parisian sidewalk bistros.",
      "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": false,
      "is_published": true
    },
    {
      "id": "dest_vietnam",
      "agency_id": "agency_travel_genie",
      "name": "Vietnam",
      "slug": "vietnam",
      "country": "Vietnam",
      "region": "Asia",
      "description": "Emerald waters of Ha Long Bay limestone islands, lantern-lit streets of Hoi An, and vibrant street food culture in Hanoi.",
      "image": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      "package_count": 1,
      "is_featured": false,
      "is_published": true
    }
  ],
  "packages": [
    {
      "id": "pkg_kashmir_paradise",
      "agency_id": "agency_travel_genie",
      "title": "Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam",
      "slug": "enchanting-kashmir-srinagar-gulmarg-pahalgam",
      "destination_id": "dest_kashmir",
      "category": "Domestic Holiday Packages",
      "duration_days": 6,
      "duration_nights": 5,
      "public_price": 32500,
      "wholesale_price": 26000,
      "cover_image": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Experience heaven on earth with traditional Kashmiri houseboat stays, shikara rides on Dal Lake, snow cable cars in Gulmarg, and lush pine valleys of Pahalgam.",
      "highlights": [
        "Deluxe Houseboat Stay on serene Nigeen Lake",
        "Complimentary 1-Hour Shikara Sunset Ride",
        "Gulmarg Gondola Ride Phase 1 tickets included",
        "Pahalgam Betaab Valley & Aru Valley excursion",
        "Traditional Wazwan dinner experience"
      ],
      "inclusions": [
        "5 Nights premium 4-star hotel & luxury houseboat accommodation",
        "Daily buffet breakfast and dinners",
        "All transfers & sightseeing by private AC Innova/Crysta",
        "Gondola Phase-1 passes and toll taxes",
        "Dedicated 24/7 on-tour concierge support"
      ],
      "exclusions": [
        "Airfare / Train tickets to and from Srinagar",
        "Pony rides or snow sledging activities",
        "Expenses of personal nature and laundry",
        "Travel insurance (available upon request)"
      ],
      "accommodation": "4-Star Pine Retreat Srinagar / Luxury Heritage Houseboat / Grand Mumtaz Gulmarg",
      "transportation": "Private chauffeur-driven AC Toyota Innova Crysta for all 6 days",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 18,
      "upcoming_date": "2026-12-15"
    },
    {
      "id": "pkg_maldives_luxury",
      "agency_id": "agency_travel_genie",
      "title": "Romantic Maldives: 5-Star Overwater Villa Retreat",
      "slug": "romantic-maldives-overwater-villa-retreat",
      "destination_id": "dest_maldives",
      "category": "Honeymoon Packages",
      "duration_days": 5,
      "duration_nights": 4,
      "public_price": 115000,
      "wholesale_price": 92000,
      "cover_image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "An idyllic romantic escape featuring an ultra-luxury water villa with private sundeck, direct lagoon access, all-inclusive gourmet dining, and couple spa sessions.",
      "highlights": [
        "2 Nights Beach Villa + 2 Nights Water Villa with Plunge Pool",
        "Complimentary Scenic Seaplane Roundtrip Transfers",
        "All-Inclusive Meals: Unlimited Premium Cocktails & Fine Dining",
        "Sunset Dolphin Cruise on traditional Maldivian Dhoni",
        "Honeymoon Bed Decoration & Sparkling Wine Bottle"
      ],
      "inclusions": [
        "4 Nights luxury 5-star island resort stay",
        "Full Board All-Inclusive meal plan (Breakfast, Lunch, Dinner, Drinks)",
        "Speedboat / Seaplane transfers from Velana Airport",
        "Complimentary non-motorized watersports & snorkeling equipment",
        "Green Tax and all island resort service charges"
      ],
      "exclusions": [
        "International air tickets",
        "Motorized watersports (jet-ski, parasailing)",
        "Personal gratuities"
      ],
      "accommodation": "Centara Grand Island Resort & Spa / Villa Nautica Paradise Island",
      "transportation": "Scenic Seaplane / Luxury Speedboat transfers",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 10,
      "upcoming_date": "2026-12-20"
    },
    {
      "id": "pkg_bali_bliss",
      "agency_id": "agency_travel_genie",
      "title": "Bali Wonders: Ubud Rainforest & Seminyak Beaches",
      "slug": "bali-wonders-ubud-rainforest-seminyak-beaches",
      "destination_id": "dest_bali",
      "category": "International Holiday Packages",
      "duration_days": 7,
      "duration_nights": 6,
      "public_price": 48000,
      "wholesale_price": 39000,
      "cover_image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Immerse yourself in Balinese culture, sacred monkey forests, jungle swings over Tegalalang rice terraces, and dramatic sunsets at Tanah Lot & Uluwatu cliff temples.",
      "highlights": [
        "3 Nights in Ubud Jungle Villa + 3 Nights in Seminyak Coastal Resort",
        "Famous Bali Swing & Tegenungan Waterfall Tour",
        "Nusa Penida Island day excursion with Kelingking T-Rex Beach",
        "Sunset Seafood Dinner on the sands of Jimbaran Bay",
        "Kecak Fire Dance Performance at cliffside Uluwatu"
      ],
      "inclusions": [
        "6 Nights 4-star boutique villa with private pool options",
        "Daily Indonesian & Continental breakfast",
        "Nusa Penida speed boat transfers & island transport",
        "Private AC vehicle for all transfers with English-speaking driver",
        "All temple entrance tickets & parking fees"
      ],
      "exclusions": [
        "International flights",
        "Indonesian Visa on Arrival ($35 USD)",
        "Personal drinks and shopping"
      ],
      "accommodation": "The Kayon Jungle Resort Ubud / Courtyard by Marriott Seminyak",
      "transportation": "Private chauffeur-driven air-conditioned minivan",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 14,
      "upcoming_date": "2027-01-10"
    },
    {
      "id": "pkg_dubai_extravaganza",
      "agency_id": "agency_travel_genie",
      "title": "Dazzling Dubai & Desert Odyssey",
      "slug": "dazzling-dubai-desert-odyssey",
      "destination_id": "dest_dubai",
      "category": "Family Holiday Packages",
      "duration_days": 5,
      "duration_nights": 4,
      "public_price": 42000,
      "wholesale_price": 34000,
      "cover_image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "The ultimate family holiday combining Burj Khalifa observation decks, thrilling 4x4 desert safari with belly dancing dinner, luxury Dhow Marina cruise, and Dubai Mall.",
      "highlights": [
        "Burj Khalifa 124th & 125th Floor Observation Deck Tickets",
        "Desert Safari with Dune Bashing, Camel Rides, Tanoura & BBQ Dinner",
        "Dubai Marina 5-Star Luxury Dhow Dinner Cruise",
        "Dubai Frame & Miracle Garden entry tickets",
        "Dubai Mall Aquarium & Underwater Zoo"
      ],
      "inclusions": [
        "4 Nights 4-star city hotel stay with daily breakfast",
        "Round-trip Dubai International Airport transfers",
        "All entry tickets as per itinerary",
        "Tourism Dirham Tax included",
        "Dedicated tour coordinator in Dubai"
      ],
      "exclusions": [
        "Air tickets and UAE Tourist Visa",
        "Lunch and personal expenses",
        "Tips for drivers and safari guides"
      ],
      "accommodation": "Citymax Hotel Al Barsha / Millennium Place Dubai Marina",
      "transportation": "AC coach / 4x4 Land Cruiser for safari",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 20,
      "upcoming_date": "2026-12-25"
    },
    {
      "id": "pkg_swiss_dream",
      "agency_id": "agency_travel_genie",
      "title": "Grand Swiss Alpine Odyssey: Zurich, Lucerne & Interlaken",
      "slug": "grand-swiss-alpine-odyssey",
      "destination_id": "dest_switzerland",
      "category": "International Holiday Packages",
      "duration_days": 7,
      "duration_nights": 6,
      "public_price": 165000,
      "wholesale_price": 135000,
      "cover_image": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Snow-clad peaks, glistening glacial lakes, world-famous mountain cogwheel railways, and iconic excursions to Jungfraujoch and Mount Titlis.",
      "highlights": [
        "Swiss Travel Pass First Class (unlimited trains & steamers)",
        "Excursion to Jungfraujoch - Top of Europe (3,454m)",
        "Mount Titlis with Rotair 360 Revolving Cable Car and Ice Flyer",
        "Lake Lucerne scenic paddle-steamer cruise",
        "Chocolate tasting at Lindt Home of Chocolate Zurich"
      ],
      "inclusions": [
        "6 Nights 4-star central hotels near railway stations",
        "Daily Swiss buffet breakfast",
        "Swiss Travel Pass 8 Days consecutive",
        "Mountain excursion vouchers (Titlis & Jungfrau)",
        "Schengen Visa assistance paperwork"
      ],
      "exclusions": [
        "International flights and Schengen Visa fee",
        "City tourist taxes payable directly at hotels",
        "Lunches and dinners"
      ],
      "accommodation": "Hotel Bristol Zurich / Hotel Astoria Lucerne / Hotel Interlaken",
      "transportation": "Swiss Federal Railways (SBB) First Class & Alpine Cable Cars",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 12,
      "upcoming_date": "2027-02-05"
    },
    {
      "id": "pkg_kerala_backwaters",
      "agency_id": "agency_travel_genie",
      "title": "Kerala Serenity: Munnar Hills, Thekkady & Alleppey Houseboat",
      "slug": "kerala-serenity-munnar-thekkady-alleppey",
      "destination_id": "dest_kerala",
      "category": "Domestic Holiday Packages",
      "duration_days": 5,
      "duration_nights": 4,
      "public_price": 24500,
      "wholesale_price": 19500,
      "cover_image": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Unwind amidst Munnar tea estates, Eravikulam National Park wildlife, spice plantations of Thekkady, and a private overnight traditional houseboat cruise on Alleppey backwaters.",
      "highlights": [
        "2 Nights in Munnar + 1 Night Thekkady + 1 Night Private Alleppey Houseboat",
        "Authentic Kerala Ayurvedic Full Body Massage session",
        "Spice plantation walking tour with herbal expert",
        "Houseboat cruise with all meals prepared live by personal chef",
        "Cheeyappara and Valara waterfalls photo stops"
      ],
      "inclusions": [
        "4 Nights premium accommodation including AC luxury houseboat",
        "Breakfast at all hotels + All meals on Houseboat (Lunch, Dinner, Breakfast)",
        "Private AC sedan/SUV for entire itinerary from Kochi to Kochi",
        "Toll, parking, and driver allowances"
      ],
      "exclusions": [
        "Flights/Trains to Kochi",
        "Boating tickets at Periyar Lake (Thekkady)",
        "Personal expenses and tips"
      ],
      "accommodation": "Tea County Munnar / Spice Village Thekkady / Rainbow Cruises Alleppey",
      "transportation": "Dedicated AC Toyota Etios/Innova",
      "is_featured": true,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 25,
      "upcoming_date": "2026-12-10"
    },
    {
      "id": "pkg_group_himachal",
      "agency_id": "agency_travel_genie",
      "title": "Shimla & Manali Snowy Escapade (Guaranteed Group Departure)",
      "slug": "shimla-manali-snowy-escapade-group",
      "destination_id": "dest_manali",
      "category": "Group Tours",
      "duration_days": 6,
      "duration_nights": 5,
      "public_price": 18500,
      "wholesale_price": 14800,
      "cover_image": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "A fun-filled group tour for families, solo travelers, and friends exploring Mall Road Shimla, Kufri snow viewpoint, Solang Valley adventures, and Atal Tunnel.",
      "highlights": [
        "Guaranteed group departure with professional tour manager",
        "Evening DJ party & bonfire in Manali resort",
        "Solang Valley & Atal Tunnel excursion",
        "Shimla Ridge & historic Viceregal Lodge visit",
        "Comfortable Volvo luxury coach travel from Delhi"
      ],
      "inclusions": [
        "5 Nights hotel stay on twin/triple sharing",
        "Breakfast and dinner included daily",
        "Delhi to Shimla to Manali to Delhi transfers by AC Volvo coach",
        "Local sightseeing by individual cabs on sharing basis"
      ],
      "exclusions": [
        "Adventure sports costs (paragliding, skiing)",
        "Heater charges at hotels"
      ],
      "accommodation": "Hotel Snow Valley Shimla / Sterling Manali",
      "transportation": "Volvo AC semi-sleeper coach & local cabs",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": true,
      "available_seats": 8,
      "total_seats": 24,
      "upcoming_date": "2026-12-22"
    },
    {
      "id": "pkg_group_vietnam",
      "agency_id": "agency_travel_genie",
      "title": "Vietnam Discovery: Hanoi, Halong Bay & Da Nang (Fixed Group Tour)",
      "slug": "vietnam-discovery-group-tour",
      "destination_id": "dest_vietnam",
      "category": "Group Tours",
      "duration_days": 7,
      "duration_nights": 6,
      "public_price": 68500,
      "wholesale_price": 55000,
      "cover_image": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Explore Vietnam with an energetic small group: overnight luxury cruise in mystical Halong Bay, Golden Hands Bridge in Ba Na Hills, and ancient Hoi An lanterns.",
      "highlights": [
        "Overnight 5-Star Cruise on Halong Bay with kayaking & squid fishing",
        "Golden Hands Bridge cable car ride in Sun World Ba Na Hills",
        "Hoi An lantern boat release experience",
        "Water Puppet Show in historic Hanoi",
        "English-speaking Vietnamese guide throughout"
      ],
      "inclusions": [
        "6 Nights 4 & 5-star hotel and cruise stays",
        "All breakfasts, 4 lunches, and Halong Bay gala dinners",
        "Domestic flight Hanoi to Da Nang included",
        "All sightseeing entrance fees and boat rides"
      ],
      "exclusions": [
        "International flights (Delhi/Mumbai to Hanoi)",
        "Vietnam E-Visa ($25 USD)"
      ],
      "accommodation": "Silk Path Hotel Hanoi / Mon Cheri Cruise Halong / Belle Maison Da Nang",
      "transportation": "Luxury AC tourist bus and domestic airline",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": true,
      "available_seats": 6,
      "total_seats": 20,
      "upcoming_date": "2027-01-18"
    },
    {
      "id": "pkg_honeymoon_paris",
      "agency_id": "agency_travel_genie",
      "title": "Parisian Romance & French Riviera Magic",
      "slug": "parisian-romance-french-riviera-magic",
      "destination_id": "dest_paris",
      "category": "Honeymoon Packages",
      "duration_days": 8,
      "duration_nights": 7,
      "public_price": 189000,
      "wholesale_price": 154000,
      "cover_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "Indulge in the world’s most romantic city with champagne at the Eiffel Tower, Seine river dinner cruise, and sun-soaked Mediterranean days in Nice & Monaco.",
      "highlights": [
        "VIP Priority Eiffel Tower 2nd Floor & Summit access",
        "Bateaux Parisiens 3-Course Gourmet Dinner Cruise",
        "High-speed TGV train journey to the French Riviera",
        "Day trip to glamorous Monaco & Eze medieval perfume village",
        "Professional couple photoshoot in front of the Eiffel Tower"
      ],
      "inclusions": [
        "7 Nights in boutique 4-star romantic hotels",
        "Daily French breakfast with freshly baked croissants",
        "First class TGV rail tickets Paris to Nice",
        "All museum and cruise passes mentioned"
      ],
      "exclusions": [
        "International flights",
        "Schengen Visa charges",
        "Personal dining and wine tastings"
      ],
      "accommodation": "Hotel Regina Louvre Paris / Hotel Suisse Nice Promenade",
      "transportation": "TGV Inoui high speed train & private airport transfers",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 8,
      "upcoming_date": "2027-02-14"
    },
    {
      "id": "pkg_goa_getaway",
      "agency_id": "agency_travel_genie",
      "title": "Vibrant Goa: Beachfront Luxury & Heritage Mansions",
      "slug": "vibrant-goa-beachfront-luxury-heritage",
      "destination_id": "dest_goa",
      "category": "Weekend Getaways",
      "duration_days": 4,
      "duration_nights": 3,
      "public_price": 16500,
      "wholesale_price": 13200,
      "cover_image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
      "gallery": [
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80"
      ],
      "description": "The ultimate coastal refresher: stay at a beach resort in Candolim, explore Latin Quarter Fontainhas, sail on a Mandovi river cruise, and relax by the sea.",
      "highlights": [
        "Direct beach access resort in North Goa",
        "Guided heritage walking tour of Fontainhas Latin Quarter",
        "Sunset catamaran cruise with live Goan music",
        "Watersports combo (parasailing, jet ski, banana ride)"
      ],
      "inclusions": [
        "3 Nights resort stay with breakfast",
        "Goa Airport / Thivim railway station AC transfers",
        "1 Day South Goa heritage tour in private car"
      ],
      "exclusions": [
        "Flights to Goa",
        "Personal drinks and beach shack bills"
      ],
      "accommodation": "Taj Holiday Village Resort & Spa / Santana Beach Resort",
      "transportation": "Private AC car for transfers and tour",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 30,
      "upcoming_date": "2026-12-08"
    },
    {
      "id": "pkg_andaman_coral_escape",
      "agency_id": "agency_travel_genie",
      "title": "Exotic Andaman: Havelock & Radhanagar Beach Coral Escape",
      "slug": "exotic-andaman-havelock-radhanagar-beach-coral-escape",
      "destination_id": "dest_andaman",
      "destination": "Andaman & Nicobar",
      "category": "Domestic Holiday Packages",
      "duration_days": 5,
      "duration_nights": 4,
      "public_price": 28500,
      "wholesale_price": 22800,
      "cover_image": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
      "description": "White sand shores of Radhanagar Beach, crystal-clear waters at Elephant Beach, and historic Cellular Jail in Port Blair.",
      "highlights": [
        "Radhanagar Beach Sunset Walk",
        "Makruzz Catamaran Cruise to Havelock",
        "Snorkelling at Elephant Beach",
        "Cellular Jail Sound & Light Show"
      ],
      "inclusions": [
        "4 Nights premium hotel stay",
        "Daily breakfast & dinner",
        "Private AC transfers",
        "Ferry cruise tickets"
      ],
      "exclusions": [
        "Airfare to Port Blair",
        "Personal expenses",
        "Scuba diving photography"
      ],
      "accommodation": "4-Star Symphony Palms Havelock / SeaShell Port Blair",
      "transportation": "Private AC vehicle throughout",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 16,
      "upcoming_date": "2026-12-18",
      "starting_location": "",
      "ending_location": "",
      "destinations_covered": [],
      "updated_at": "2026-11-23T11:10:26.589Z"
    },
    {
      "id": "pkg_andaman_honeymoon_paradise",
      "agency_id": "agency_travel_genie",
      "title": "Romantic Andaman: Private Pool Villa & Island Hopping Getaway",
      "slug": "romantic-andaman-private-pool-villa-island-hopping",
      "destination_id": "dest_andaman",
      "destination": "Andaman & Nicobar",
      "category": "Honeymoon Packages",
      "duration_days": 6,
      "duration_nights": 5,
      "public_price": 42000,
      "wholesale_price": 33600,
      "cover_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
      "description": "Candlelight beach dining, private luxury beachfront cabanas on Neil & Havelock Islands, and romantic photography.",
      "highlights": [
        "Private Candlelight Beach Dinner",
        "Neil Island Coral Bridge & Sunset",
        "Honeymoon Cake & Floral Bed Decor",
        "Private Speedboat Excursion"
      ],
      "inclusions": [
        "5 Nights luxury resort accommodation",
        "Daily breakfast & candlelight dinner",
        "Private AC luxury car",
        "Complimentary watersports"
      ],
      "exclusions": [
        "Flights",
        "Personal shopping"
      ],
      "accommodation": "Barefoot at Havelock / TSG Blue Resort Neil",
      "transportation": "Private AC chauffeur vehicle",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": false,
      "available_seats": 10,
      "upcoming_date": "2026-12-20",
      "starting_location": "",
      "ending_location": "",
      "destinations_covered": [],
      "updated_at": "2026-11-23T11:10:16.853Z"
    },
    {
      "id": "pkg_andaman_group_explorer",
      "agency_id": "agency_travel_genie",
      "title": "Andaman Island Explorer (Guaranteed Group Departure)",
      "slug": "andaman-island-explorer-guaranteed-group-departure",
      "destination_id": "dest_andaman",
      "destination": "Andaman & Nicobar",
      "category": "Group Tours",
      "duration_days": 5,
      "duration_nights": 4,
      "public_price": 26000,
      "wholesale_price": 20800,
      "cover_image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
      "description": "Fixed departure group tour with dedicated South Indian tour escort, comfortable AC buses, all meals, and Havelock cruise.",
      "highlights": [
        "100% Guaranteed Group Departure",
        "Pure South Indian & Jain Meals",
        "Havelock Island AC Ferry",
        "Dedicated Tour Manager"
      ],
      "inclusions": [
        "4 Nights 4-star stays",
        "All meals (Breakfast",
        "Lunch",
        "Dinner)",
        "Sightseeing & Ferry tickets",
        "Tour escort"
      ],
      "exclusions": [
        "Airfare",
        "Personal watersports"
      ],
      "accommodation": "Handpicked 4-star group hotels",
      "transportation": "Luxury AC Coach / Tempo Traveller",
      "is_featured": false,
      "is_published": true,
      "is_group_tour": true,
      "available_seats": 12,
      "total_seats": 24,
      "upcoming_date": "2026-12-28",
      "starting_location": "",
      "ending_location": "",
      "destinations_covered": [],
      "updated_at": "2026-11-23T11:10:09.365Z"
    }
  ],
  "package_itineraries": [
    {
      "id": "it_kashmir_1",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 1,
      "title": "Arrival in Srinagar & Sunset Shikara on Dal Lake",
      "description": "Meet and greet at Srinagar Airport by our representative. Transfer to your luxury houseboat. Evening relaxing 1-hour shikara ride on Dal Lake passing floating gardens and lotus blossoms.",
      "meals": "Dinner",
      "activities": "Airport pickup, Houseboat check-in, Dal Lake Shikara ride"
    },
    {
      "id": "it_kashmir_2",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 2,
      "title": "Mughal Gardens & Historic Srinagar Sightseeing",
      "description": "Visit the world-renowned Mughal terraced gardens: Nishat Bagh (Garden of Pleasure) and Shalimar Bagh (Abode of Love), followed by Chashme Shahi and Shankaracharya Hill temple.",
      "meals": "Breakfast & Dinner",
      "activities": "Sightseeing of Mughal Gardens, Old Srinagar heritage walk"
    },
    {
      "id": "it_kashmir_3",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 3,
      "title": "Gulmarg Meadow of Flowers & Gondola Ride",
      "description": "Scenic drive to Gulmarg. Board the famous Gulmarg Gondola up to Kongdoori Phase 1 (elev. 10,000 ft). Enjoy snow views and optional skiing or snowmobiling.",
      "meals": "Breakfast & Dinner",
      "activities": "Gondola ride, snow play, alpine photography"
    },
    {
      "id": "it_kashmir_4",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 4,
      "title": "Pahalgam Valley of Shepherds & Lidder River",
      "description": "Drive along saffron fields of Pampore to reach Pahalgam. Visit scenic Betaab Valley where Bollywood movies were filmed, and stroll beside the turquoise Lidder river.",
      "meals": "Breakfast & Dinner",
      "activities": "Saffron field stop, Betaab Valley, Lidder river walk"
    },
    {
      "id": "it_kashmir_5",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 5,
      "title": "Aru Valley & Kashmiri Handicrafts Shopping",
      "description": "Explore the unspoiled alpine meadows of Aru Valley. Return to Srinagar for an afternoon visiting authentic Pashmina shawl looms and walnut woodcarving workshops.",
      "meals": "Breakfast & Dinner",
      "activities": "Aru Valley exploration, artisan craft workshops, Wazwan feast"
    },
    {
      "id": "it_kashmir_6",
      "package_id": "pkg_kashmir_paradise",
      "day_number": 6,
      "title": "Departure with Cherished Himalayan Memories",
      "description": "After a leisurely breakfast overlooking the water, transfer to Srinagar International Airport for your flight home with unforgettable memories.",
      "meals": "Breakfast",
      "activities": "Souvenir shopping, airport drop"
    },
    {
      "id": "it_maldives_1",
      "package_id": "pkg_maldives_luxury",
      "day_number": 1,
      "title": "Arrival in Male & Seaplane Transfer to Paradise Island",
      "description": "Land at Velana International Airport and board your scenic seaplane flight over sparkling atolls. Check in to your luxury Beach Villa. Welcome tropical cocktail & dinner.",
      "meals": "Dinner",
      "activities": "Seaplane transfer, resort welcome, beach sunset walk"
    },
    {
      "id": "it_maldives_2",
      "package_id": "pkg_maldives_luxury",
      "day_number": 2,
      "title": "House Reef Snorkeling & Sunset Dolphin Cruise",
      "description": "Swim in warm crystal waters alongside sea turtles and colorful reef fish. In the late afternoon, embark on a traditional Maldivian Dhoni cruise to spot playful spinner dolphins.",
      "meals": "All Inclusive (Breakfast, Lunch, Dinner & Drinks)",
      "activities": "Guided reef snorkeling, sunset dolphin cruise"
    },
    {
      "id": "it_maldives_3",
      "package_id": "pkg_maldives_luxury",
      "day_number": 3,
      "title": "Water Villa Check-In & Overwater Spa Therapy",
      "description": "Transfer to your iconic Overwater Villa with glass floor panels and direct sea stairs. Enjoy an afternoon couple signature aromatherapeutic massage at the overwater spa.",
      "meals": "All Inclusive",
      "activities": "Water villa transition, couple spa ritual, private sundeck relaxing"
    },
    {
      "id": "it_maldives_4",
      "package_id": "pkg_maldives_luxury",
      "day_number": 4,
      "title": "Kayak Safari & Candlelight Beach Dinner",
      "description": "Paddle transparent kayaks across calm lagoons. In the evening, enjoy a private 5-course romantic candlelight dinner on the secluded beach under starlit skies.",
      "meals": "All Inclusive + Special Beach Dinner",
      "activities": "Clear kayak safari, private candlelight dinner"
    },
    {
      "id": "it_maldives_5",
      "package_id": "pkg_maldives_luxury",
      "day_number": 5,
      "title": "Farewell Maldives & Seaplane Return",
      "description": "Enjoy a leisurely breakfast over the lagoon before your seaplane return transfer to Male for your flight home.",
      "meals": "Breakfast",
      "activities": "Seaplane flight to Male, departure"
    },
    {
      "package_id": "pkg_andaman_group_explorer",
      "day_number": 1,
      "title": "Day 1: Itinerary Day",
      "description": "Activities and itinerary details for Day 1.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_8475a42e97",
      "created_at": "2026-11-23T11:10:09.589Z",
      "updated_at": "2026-11-23T11:10:09.589Z"
    },
    {
      "package_id": "pkg_andaman_group_explorer",
      "day_number": 2,
      "title": "Day 2: Itinerary Day",
      "description": "Activities and itinerary details for Day 2.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_efb6204cea",
      "created_at": "2026-11-23T11:10:09.764Z",
      "updated_at": "2026-11-23T11:10:09.764Z"
    },
    {
      "package_id": "pkg_andaman_group_explorer",
      "day_number": 3,
      "title": "Day 3: Itinerary Day",
      "description": "Activities and itinerary details for Day 3.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_e61b7ef179",
      "created_at": "2026-11-23T11:10:10.046Z",
      "updated_at": "2026-11-23T11:10:10.046Z"
    },
    {
      "package_id": "pkg_andaman_group_explorer",
      "day_number": 4,
      "title": "Day 4: Itinerary Day",
      "description": "Activities and itinerary details for Day 4.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_c6439b434a",
      "created_at": "2026-11-23T11:10:10.221Z",
      "updated_at": "2026-11-23T11:10:10.221Z"
    },
    {
      "package_id": "pkg_andaman_group_explorer",
      "day_number": 5,
      "title": "Day 5: Itinerary Day",
      "description": "Activities and itinerary details for Day 5.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_2dd10e48bb",
      "created_at": "2026-11-23T11:10:10.428Z",
      "updated_at": "2026-11-23T11:10:10.428Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 1,
      "title": "Day 1: Itinerary Day",
      "description": "Activities and itinerary details for Day 1.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_05ca258933",
      "created_at": "2026-11-23T11:10:17.096Z",
      "updated_at": "2026-11-23T11:10:17.096Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 2,
      "title": "Day 2: Itinerary Day",
      "description": "Activities and itinerary details for Day 2.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_ccc9589d4d",
      "created_at": "2026-11-23T11:10:17.287Z",
      "updated_at": "2026-11-23T11:10:17.287Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 3,
      "title": "Day 3: Itinerary Day",
      "description": "Activities and itinerary details for Day 3.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_7eac04e0b3",
      "created_at": "2026-11-23T11:10:17.464Z",
      "updated_at": "2026-11-23T11:10:17.464Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 4,
      "title": "Day 4: Itinerary Day",
      "description": "Activities and itinerary details for Day 4.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_12d64e97f6",
      "created_at": "2026-11-23T11:10:17.653Z",
      "updated_at": "2026-11-23T11:10:17.653Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 5,
      "title": "Day 5: Itinerary Day",
      "description": "Activities and itinerary details for Day 5.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_25553062c8",
      "created_at": "2026-11-23T11:10:17.814Z",
      "updated_at": "2026-11-23T11:10:17.814Z"
    },
    {
      "package_id": "pkg_andaman_honeymoon_paradise",
      "day_number": 6,
      "title": "Day 6: Itinerary Day",
      "description": "Activities and itinerary details for Day 6.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_f046f83383",
      "created_at": "2026-11-23T11:10:18.007Z",
      "updated_at": "2026-11-23T11:10:18.007Z"
    },
    {
      "package_id": "pkg_andaman_coral_escape",
      "day_number": 1,
      "title": "Day 1: Itinerary Day",
      "description": "Activities and itinerary details for Day 1.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_b797d2157b",
      "created_at": "2026-11-23T11:10:26.837Z",
      "updated_at": "2026-11-23T11:10:26.837Z"
    },
    {
      "package_id": "pkg_andaman_coral_escape",
      "day_number": 2,
      "title": "Day 2: Itinerary Day",
      "description": "Activities and itinerary details for Day 2.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_1960d89611",
      "created_at": "2026-11-23T11:10:27.018Z",
      "updated_at": "2026-11-23T11:10:27.018Z"
    },
    {
      "package_id": "pkg_andaman_coral_escape",
      "day_number": 3,
      "title": "Day 3: Itinerary Day",
      "description": "Activities and itinerary details for Day 3.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_104c4db83b",
      "created_at": "2026-11-23T11:10:27.256Z",
      "updated_at": "2026-11-23T11:10:27.256Z"
    },
    {
      "package_id": "pkg_andaman_coral_escape",
      "day_number": 4,
      "title": "Day 4: Itinerary Day",
      "description": "Activities and itinerary details for Day 4.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_3fcfd7c178",
      "created_at": "2026-11-23T11:10:27.465Z",
      "updated_at": "2026-11-23T11:10:27.465Z"
    },
    {
      "package_id": "pkg_andaman_coral_escape",
      "day_number": 5,
      "title": "Day 5: Itinerary Day",
      "description": "Activities and itinerary details for Day 5.",
      "meals": "Breakfast Included",
      "activities": "Sightseeing",
      "id": "pac_75b586c75a",
      "created_at": "2026-11-23T11:10:27.702Z",
      "updated_at": "2026-11-23T11:10:27.702Z"
    }
  ],
  "leads": [
    {
      "id": "lead_1001",
      "agency_id": "agency_travel_genie",
      "customer_id": "usr_cust_ananya",
      "customer_name": "Ananya Rao",
      "customer_email": "ananya.customer@gmail.com",
      "customer_phone": "+91 98765 00006",
      "interested_destination": "Maldives",
      "interested_package_id": "pkg_maldives_luxury",
      "travel_date": "2026-12-20",
      "travelers_count": 2,
      "budget": "₹2,00,000 - ₹2,50,000",
      "lead_source": "Package Booking",
      "status": "Quotation Sent",
      "assigned_staff_id": "usr_staff_priya",
      "assigned_staff_name": "Priya Nair",
      "follow_up_date": "2026-11-20",
      "notes": "Honeymoon couple looking for all-inclusive overwater villa with private pool. Sent customized quote with seaplane included.",
      "created_at": "2026-11-16T14:30:00.000Z",
      "updated_at": "2026-11-18T10:15:00.000Z"
    },
    {
      "id": "lead_1002",
      "agency_id": "agency_travel_genie",
      "customer_id": "usr_cust_rohit",
      "customer_name": "Rohit Kulkarni",
      "customer_email": "rohit.customer@gmail.com",
      "customer_phone": "+91 98765 00007",
      "interested_destination": "Bali",
      "interested_package_id": "pkg_bali_bliss",
      "travel_date": "2027-01-10",
      "travelers_count": 4,
      "budget": "₹1,50,000 - ₹2,00,000",
      "lead_source": "Website Enquiry",
      "status": "Converted",
      "assigned_staff_id": "usr_staff_rahul",
      "assigned_staff_name": "Rahul Verma",
      "follow_up_date": null,
      "notes": "Family of 4 requested private villa in Ubud with day trip to Nusa Penida. Advance paid and booking confirmed!",
      "created_at": "2026-11-14T09:20:00.000Z",
      "updated_at": "2026-11-17T16:00:00.000Z"
    },
    {
      "id": "lead_1003",
      "agency_id": "agency_travel_genie",
      "customer_id": null,
      "customer_name": "Dr. Sameer Joshi",
      "customer_email": "sameer.joshi@apollohospitals.org",
      "customer_phone": "+91 98451 98765",
      "interested_destination": "Switzerland",
      "interested_package_id": "pkg_swiss_dream",
      "travel_date": "2027-02-05",
      "travelers_count": 2,
      "budget": "₹3,50,000+",
      "lead_source": "Custom Trip Form",
      "status": "Contacted",
      "assigned_staff_id": "usr_staff_priya",
      "assigned_staff_name": "Priya Nair",
      "follow_up_date": "2026-11-21",
      "notes": "Wants First Class Swiss pass and Jungfraujoch. Follow up requested on Friday afternoon.",
      "created_at": "2026-11-17T11:45:00.000Z",
      "updated_at": "2026-11-18T12:00:00.000Z"
    },
    {
      "id": "lead_1004",
      "agency_id": "agency_travel_genie",
      "customer_id": null,
      "customer_name": "Meenakshi Iyer",
      "customer_email": "meenakshi.iyer@tcs.com",
      "customer_phone": "+91 97401 23456",
      "interested_destination": "Kashmir",
      "interested_package_id": "pkg_kashmir_paradise",
      "travel_date": "2026-12-15",
      "travelers_count": 6,
      "budget": "₹1,80,000 - ₹2,20,000",
      "lead_source": "Website Enquiry",
      "status": "Follow-up Required",
      "assigned_staff_id": "usr_staff_rahul",
      "assigned_staff_name": "Rahul Verma",
      "follow_up_date": "2026-11-19",
      "notes": "Group of 6 colleagues. Comparing rates with another vendor. Re-sent updated package with complimentary Shikara & Wazwan.",
      "created_at": "2026-11-15T15:10:00.000Z",
      "updated_at": "2026-11-18T14:30:00.000Z"
    },
    {
      "id": "lead_1005",
      "agency_id": "agency_travel_genie",
      "customer_id": null,
      "customer_name": "Karan Malhotra",
      "customer_email": "karan.m@gmail.com",
      "customer_phone": "+91 99887 66554",
      "interested_destination": "Dubai",
      "interested_package_id": "pkg_dubai_extravaganza",
      "travel_date": "2026-12-25",
      "travelers_count": 3,
      "budget": "₹1,20,000 - ₹1,50,000",
      "lead_source": "Contact Form",
      "status": "New",
      "assigned_staff_id": null,
      "assigned_staff_name": "Unassigned",
      "follow_up_date": null,
      "notes": "Family with 7-year old child. Wants Dubai Parks and Burj Khalifa. Needs assignment.",
      "created_at": "2026-11-19T08:15:00.000Z",
      "updated_at": "2026-11-19T08:15:00.000Z"
    },
    {
      "id": "lead_1006",
      "agency_id": "agency_travel_genie",
      "customer_id": null,
      "customer_name": "Rajesh & Kavita Bansal",
      "customer_email": "bansal.exports@gmail.com",
      "customer_phone": "+91 94140 11223",
      "interested_destination": "Kerala",
      "interested_package_id": "pkg_kerala_backwaters",
      "travel_date": "2026-12-10",
      "travelers_count": 2,
      "budget": "₹50,000 - ₹60,000",
      "lead_source": "Agent Referral",
      "status": "Assigned",
      "assigned_staff_id": "usr_staff_rahul",
      "assigned_staff_name": "Rahul Verma",
      "follow_up_date": "2026-11-20",
      "notes": "Referred by Agent Vikram Singhania. Looking for peaceful Ayurvedic luxury houseboat.",
      "created_at": "2026-11-18T16:20:00.000Z",
      "updated_at": "2026-11-18T17:00:00.000Z"
    }
  ],
  "lead_activities": [
    {
      "id": "act_1",
      "lead_id": "lead_1001",
      "user_id": "usr_admin_genie",
      "activity_type": "assignment",
      "description": "Lead auto-assigned to Senior Consultant Priya Nair",
      "created_at": "2026-11-16T14:35:00.000Z"
    },
    {
      "id": "act_2",
      "lead_id": "lead_1001",
      "user_id": "usr_staff_priya",
      "activity_type": "contact",
      "description": "Spoke with Ananya Rao via phone. Discussed romantic villa options in Maldives.",
      "created_at": "2026-11-17T11:00:00.000Z"
    },
    {
      "id": "act_3",
      "lead_id": "lead_1001",
      "user_id": "usr_staff_priya",
      "activity_type": "quotation",
      "description": "Generated & dispatched formal quotation #QT-2026-8801 for ₹2,30,000.",
      "created_at": "2026-11-18T10:15:00.000Z"
    },
    {
      "id": "act_4",
      "lead_id": "lead_1002",
      "user_id": "usr_staff_rahul",
      "activity_type": "status_change",
      "description": "Lead converted to confirmed Booking #BK-2026-4011 upon advance payment.",
      "created_at": "2026-11-17T16:00:00.000Z"
    }
  ],
  "quotations": [
    {
      "id": "qt_8801",
      "agency_id": "agency_travel_genie",
      "lead_id": "lead_1001",
      "package_id": "pkg_maldives_luxury",
      "staff_id": "usr_staff_priya",
      "quotation_number": "QT-2026-8801",
      "customer_name": "Ananya Rao",
      "total_amount": 245000,
      "discount": 15000,
      "final_amount": 230000,
      "status": "Sent",
      "valid_until": "2026-11-25",
      "items": [
        {
          "description": "Romantic Maldives 5-Star Resort (2 Beach + 2 Water Villa)",
          "amount": 210000
        },
        {
          "description": "Roundtrip Seaplane Transfers for 2 Guests",
          "amount": 25000
        },
        {
          "description": "Private Beach Candlelight 5-Course Dinner",
          "amount": 10000
        }
      ],
      "notes": "Includes all island taxes, green taxes, and complimentary dolphin cruise.",
      "created_at": "2026-11-18T10:15:00.000Z"
    }
  ],
  "bookings": [
    {
      "id": "bk_4011",
      "agency_id": "agency_travel_genie",
      "booking_number": "BK-2026-4011",
      "customer_id": "usr_cust_rohit",
      "customer_name": "Rohit Kulkarni",
      "customer_email": "rohit.customer@gmail.com",
      "agent_id": null,
      "package_id": "pkg_bali_bliss",
      "package_title": "Bali Wonders: Ubud Rainforest & Seminyak Beaches",
      "travel_start_date": "2027-01-10",
      "travel_end_date": "2027-01-16",
      "travelers_count": 4,
      "total_amount": 192000,
      "advance_amount": 60000,
      "balance_amount": 132000,
      "payment_status": "Partial",
      "booking_status": "Confirmed",
      "special_requests": "Adjoining rooms in Seminyak, vegetarian meal preference on flights.",
      "created_at": "2026-11-17T16:00:00.000Z"
    },
    {
      "id": "bk_4012",
      "agency_id": "agency_travel_genie",
      "booking_number": "BK-2026-4012",
      "customer_id": null,
      "customer_name": "Client of GlobeTrotters (Mr. Akash Verma)",
      "customer_email": "akash.verma.client@gmail.com",
      "agent_id": "usr_agent_vikram",
      "package_id": "pkg_kashmir_paradise",
      "package_title": "Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam",
      "travel_start_date": "2026-12-15",
      "travel_end_date": "2026-12-20",
      "travelers_count": 2,
      "total_amount": 65000,
      "advance_amount": 52000,
      "balance_amount": 0,
      "payment_status": "Paid",
      "booking_status": "Confirmed",
      "special_requests": "B2B Wholesale resale by Agent Vikram Singhania.",
      "created_at": "2026-11-16T12:00:00.000Z"
    }
  ],
  "booking_travellers": [
    {
      "id": "bt_1",
      "booking_id": "bk_4011",
      "full_name": "Rohit Kulkarni",
      "age": 38,
      "gender": "Male",
      "passport_or_id": "Z9182374"
    },
    {
      "id": "bt_2",
      "booking_id": "bk_4011",
      "full_name": "Sneha Kulkarni",
      "age": 35,
      "gender": "Female",
      "passport_or_id": "Z9182375"
    },
    {
      "id": "bt_3",
      "booking_id": "bk_4011",
      "full_name": "Aarav Kulkarni",
      "age": 10,
      "gender": "Male",
      "passport_or_id": "Z9182376"
    },
    {
      "id": "bt_4",
      "booking_id": "bk_4011",
      "full_name": "Myra Kulkarni",
      "age": 6,
      "gender": "Female",
      "passport_or_id": "Z9182377"
    }
  ],
  "payments": [
    {
      "id": "pay_701",
      "agency_id": "agency_travel_genie",
      "booking_id": "bk_4011",
      "amount": 60000,
      "payment_type": "Advance",
      "payment_method": "UPI",
      "transaction_reference": "UPI/20261117/998124801",
      "payment_date": "2026-11-17T16:05:00.000Z",
      "notes": "Initial 30% booking advance received.",
      "status": "Completed"
    },
    {
      "id": "pay_702",
      "agency_id": "agency_travel_genie",
      "booking_id": "bk_4012",
      "amount": 52000,
      "payment_type": "Full",
      "payment_method": "Bank Transfer",
      "transaction_reference": "NEFT/HDFC/20261116/102948",
      "payment_date": "2026-11-16T12:30:00.000Z",
      "notes": "Wholesale B2B payment received from GlobeTrotters Ltd.",
      "status": "Completed"
    }
  ],
  "agent_purchases": [
    {
      "id": "pur_501",
      "agency_id": "agency_travel_genie",
      "agent_id": "usr_agent_vikram",
      "package_id": "pkg_kashmir_paradise",
      "package_title": "Enchanting Kashmir: Srinagar, Gulmarg & Pahalgam",
      "travelers_count": 2,
      "travel_date": "2026-12-15",
      "wholesale_price": 26000,
      "total_cost": 52000,
      "client_name": "Mr. Akash Verma & Spouse",
      "client_selling_price": 65000,
      "projected_margin": 13000,
      "status": "Confirmed",
      "created_at": "2026-11-16T11:30:00.000Z"
    },
    {
      "id": "pur_502",
      "agency_id": "agency_travel_genie",
      "agent_id": "usr_agent_vikram",
      "package_id": "pkg_dubai_extravaganza",
      "package_title": "Dazzling Dubai & Desert Odyssey",
      "travelers_count": 4,
      "travel_date": "2027-01-05",
      "wholesale_price": 34000,
      "total_cost": 136000,
      "client_name": "Pooja Enterprises Executives",
      "client_selling_price": 168000,
      "projected_margin": 32000,
      "status": "Pending",
      "created_at": "2026-11-18T15:00:00.000Z"
    }
  ],
  "agent_transactions": [
    {
      "id": "tx_301",
      "agency_id": "agency_travel_genie",
      "agent_id": "usr_agent_vikram",
      "type": "Purchase",
      "amount": 52000,
      "balance_after": 52000,
      "reference_id": "pur_501",
      "description": "Package purchase: Enchanting Kashmir (2 pax)",
      "created_at": "2026-11-16T11:30:00.000Z"
    },
    {
      "id": "tx_302",
      "agency_id": "agency_travel_genie",
      "agent_id": "usr_agent_vikram",
      "type": "Payment",
      "amount": 52000,
      "balance_after": 0,
      "reference_id": "pay_702",
      "description": "NEFT settlement for Purchase #pur_501",
      "created_at": "2026-11-16T12:30:00.000Z"
    }
  ],
  "testimonials": [
    {
      "id": "test_1",
      "agency_id": "agency_travel_genie",
      "customer_name": "Joe Ram",
      "customer_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      "destination": "Bangkok & Pattaya, Thailand",
      "rating": 5,
      "comment": "Our trip to Bangkok and Pattaya was beautifully arranged by the agency. From airport pickup to hotel stays and sightseeing, everything was well planned and smooth. The team was very supportive and quick to respond to our needs.\nWe truly enjoyed the experience - thank you for the great service!",
      "review_text": "Our trip to Bangkok and Pattaya was beautifully arranged by the agency. From airport pickup to hotel stays and sightseeing, everything was well planned and smooth. The team was very supportive and quick to respond to our needs.\nWe truly enjoyed the experience - thank you for the great service!",
      "is_published": true,
      "created_at": "2026-11-23T06:06:20.684Z"
    },
    {
      "id": "test_2",
      "agency_id": "agency_travel_genie",
      "customer_name": "Jasheena E",
      "customer_image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      "destination": "Bali, Indonesia",
      "rating": 5,
      "comment": "I recently booked my Bali trip with Trip by Genie, and it was an amazing experience! The entire trip was well-organized and truly worth it.\nA special thanks to Mr. Satish, who carefully planned the itinerary based on my preferences, ensuring a perfect balance of sightseeing, relaxation, and adventure. Everything, from the accommodations to the transport arrangements, was smooth and hassle-free.\nI highly recommend Trip by Genie for anyone looking for a well-planned and memorable vacation.",
      "review_text": "I recently booked my Bali trip with Trip by Genie, and it was an amazing experience! The entire trip was well-organized and truly worth it.\nA special thanks to Mr. Satish, who carefully planned the itinerary based on my preferences, ensuring a perfect balance of sightseeing, relaxation, and adventure. Everything, from the accommodations to the transport arrangements, was smooth and hassle-free.\nI highly recommend Trip by Genie for anyone looking for a well-planned and memorable vacation.",
      "is_published": true,
      "created_at": "2026-11-20T06:06:20.686Z"
    },
    {
      "id": "test_3",
      "agency_id": "agency_travel_genie",
      "customer_name": "Ramkumar R A N",
      "customer_image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "destination": "Andaman & Nicobar Islands",
      "rating": 5,
      "comment": "We had been to Andaman trip through Trip by Genie. The experience was really commendable and the itinerary was planned so perfectly to suit our taste. We thoroughly enjoyed the trip. Every details were taken care and they were patient throughout when we made several changes. A premium experience within our budget. We thank Trip by Genie for such a memorable trip. We strongly recommend them for any travel plans. Do try once to get a similar experience....",
      "review_text": "We had been to Andaman trip through Trip by Genie. The experience was really commendable and the itinerary was planned so perfectly to suit our taste. We thoroughly enjoyed the trip. Every details were taken care and they were patient throughout when we made several changes. A premium experience within our budget. We thank Trip by Genie for such a memorable trip. We strongly recommend them for any travel plans. Do try once to get a similar experience....",
      "is_published": true,
      "created_at": "2026-11-17T06:06:20.686Z"
    },
    {
      "id": "test_4",
      "agency_id": "agency_travel_genie",
      "customer_name": "Sulthanovic Pes",
      "customer_image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      "destination": "Maldives Island Resort",
      "rating": 5,
      "comment": "We went to Maldivies through Trip by Genie, they helped me with the scheduling, booking, and follow-ups from the beginning to the end. We got the beach bungalow in the Maldives thanks to Vidhya's fantastic work. I suggest Vidhya if you're organizing your trip because of his extensive knowledge of travel and ability to customize it to fit our budget in the best possible way.",
      "review_text": "We went to Maldivies through Trip by Genie, they helped me with the scheduling, booking, and follow-ups from the beginning to the end. We got the beach bungalow in the Maldives thanks to Vidhya's fantastic work. I suggest Vidhya if you're organizing your trip because of his extensive knowledge of travel and ability to customize it to fit our budget in the best possible way.",
      "is_published": true,
      "created_at": "2026-11-14T06:06:20.686Z"
    },
    {
      "id": "test_5",
      "agency_id": "agency_travel_genie",
      "customer_name": "Athira Aathi",
      "customer_image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      "destination": "Malaysia (KL & Langkawi)",
      "rating": 5,
      "comment": "This week, we went on a family tour of Malaysia, visiting Kuala Lumpur and Langkawi for a week.\nTrip by Genie created an excellent schedule, and their agent managed the daily itinerary effectively, providing good services in both KL and Langkawi. They provided assistance and guidance regarding local food and needs. Excellent services, just as I anticipated",
      "review_text": "This week, we went on a family tour of Malaysia, visiting Kuala Lumpur and Langkawi for a week.\nTrip by Genie created an excellent schedule, and their agent managed the daily itinerary effectively, providing good services in both KL and Langkawi. They provided assistance and guidance regarding local food and needs. Excellent services, just as I anticipated",
      "is_published": true,
      "created_at": "2026-11-11T06:06:20.686Z"
    },
    {
      "id": "test_6",
      "agency_id": "agency_travel_genie",
      "customer_name": "Avinash",
      "customer_image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      "destination": "South India Holiday",
      "rating": 5,
      "comment": "We truly enjoyed every moment of this trip, and it has given us so many wonderful memories. We are very happy with the service provided by TBG and would definitely recommend them to anyone planning their holidays. Looking forward to our next trip with them! Thanks to Sathish.",
      "review_text": "We truly enjoyed every moment of this trip, and it has given us so many wonderful memories. We are very happy with the service provided by TBG and would definitely recommend them to anyone planning their holidays. Looking forward to our next trip with them! Thanks to Sathish.",
      "is_published": true,
      "created_at": "2026-11-08T06:06:20.686Z"
    },
    {
      "id": "test_7",
      "agency_id": "agency_travel_genie",
      "customer_name": "Muhammed Rafi",
      "customer_image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      "destination": "Kashmir Paradise Tour",
      "rating": 5,
      "comment": "We had a wonderful time in Kashmir, and Trip by Genie provided outstanding service from the time of booking to the end of our trip, with a great driver. Overall, TBG holiday service was excellent",
      "review_text": "We had a wonderful time in Kashmir, and Trip by Genie provided outstanding service from the time of booking to the end of our trip, with a great driver. Overall, TBG holiday service was excellent",
      "is_published": true,
      "created_at": "2026-11-05T06:06:20.686Z"
    },
    {
      "id": "test_8",
      "agency_id": "agency_travel_genie",
      "customer_name": "Ninaivellam Nithya",
      "customer_image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      "destination": "Kullu Manali Vacation",
      "rating": 5,
      "comment": "I went kulumanali for a family trip through this company and the service was so nice and the relationship with them was friendly though. I've recommended this company to my fellow mates for a wonderful experience and I'm also planning for a foreign trip with them.",
      "review_text": "I went kulumanali for a family trip through this company and the service was so nice and the relationship with them was friendly though. I've recommended this company to my fellow mates for a wonderful experience and I'm also planning for a foreign trip with them.",
      "is_published": true,
      "created_at": "2026-11-02T06:06:20.686Z"
    },
    {
      "id": "test_9",
      "agency_id": "agency_travel_genie",
      "customer_name": "Srinivas Sriram",
      "customer_image": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80",
      "destination": "Thailand Getaway",
      "rating": 5,
      "comment": "I recently booked a trip to Thailand for a few day the staff were amazing and very skilled in handling situations and we were very pleased with the trip got amazing price deals I would greatly recommend this company if you are planning to go anywhere",
      "review_text": "I recently booked a trip to Thailand for a few day the staff were amazing and very skilled in handling situations and we were very pleased with the trip got amazing price deals I would greatly recommend this company if you are planning to go anywhere",
      "is_published": true,
      "created_at": "2026-10-30T06:06:20.686Z"
    },
    {
      "id": "test_10",
      "agency_id": "agency_travel_genie",
      "customer_name": "Shannu Ps",
      "customer_image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      "destination": "Goa Beach Holiday",
      "rating": 5,
      "comment": "Last month I went Goa.it's a such a beautiful place we doens't know about this place .this travel agency helped in all ways.an particular spl thanx to mrs. vidya ram ..an we got good experience.an i refered to my friends circle I future we will follow this travel agency marvellous 👍 thank you all",
      "review_text": "Last month I went Goa.it's a such a beautiful place we doens't know about this place .this travel agency helped in all ways.an particular spl thanx to mrs. vidya ram ..an we got good experience.an i refered to my friends circle I future we will follow this travel agency marvellous 👍 thank you all",
      "is_published": true,
      "created_at": "2026-10-27T06:06:20.686Z"
    },
    {
      "id": "test_11",
      "agency_id": "agency_travel_genie",
      "customer_name": "Sharon Preethi",
      "customer_image": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80",
      "destination": "Vietnam Honeymoon & Da Nang",
      "rating": 5,
      "comment": "We had an amazing experience with Trip by Genie for our Vietnam trip! From start to finish, their team made everything smooth, even with our chaotic start of missed and delayed flights. Despite the hiccups, they ensured every detail was taken care of, from airport pickups to accommodations.\n\nThe itinerary was thoughtfully planned. Every place we visited, from the bustling streets of Da Nang to the breathtaking Bana Hills with its alpine coasters, sculptures, and hilltop castles, felt magical. I was especially impressed by how attentive they were to our needs, making our honeymoon truly stress-free and memorable.\n\nHighly recommend Trip by Genie if you want a hassle-free, personalized travel experience in Vietnam.",
      "review_text": "We had an amazing experience with Trip by Genie for our Vietnam trip! From start to finish, their team made everything smooth, even with our chaotic start of missed and delayed flights. Despite the hiccups, they ensured every detail was taken care of, from airport pickups to accommodations.\n\nThe itinerary was thoughtfully planned. Every place we visited, from the bustling streets of Da Nang to the breathtaking Bana Hills with its alpine coasters, sculptures, and hilltop castles, felt magical. I was especially impressed by how attentive they were to our needs, making our honeymoon truly stress-free and memorable.\n\nHighly recommend Trip by Genie if you want a hassle-free, personalized travel experience in Vietnam.",
      "is_published": true,
      "created_at": "2026-10-24T06:06:20.686Z"
    },
    {
      "id": "test_12",
      "agency_id": "agency_travel_genie",
      "customer_name": "N Ajay Bharath",
      "customer_image": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      "destination": "Thailand & Malaysia Tour",
      "rating": 5,
      "comment": "It’s best to book your trips with trip by genie.Thank you Vidya mam for helping me throughout my trip to Thailand and Malaysia.",
      "review_text": "It’s best to book your trips with trip by genie.Thank you Vidya mam for helping me throughout my trip to Thailand and Malaysia.",
      "is_published": true,
      "created_at": "2026-10-21T06:06:20.686Z"
    },
    {
      "id": "test_13",
      "agency_id": "agency_travel_genie",
      "customer_name": "Arun Govind K",
      "customer_image": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=80",
      "destination": "Family Holiday Tour",
      "rating": 5,
      "comment": "Thank you all for your support and coordination. We had a wonderful time, and the trip was well-organized. I appreciate the efforts of everyone involved. We'll definitely consider 'Trip by Genie' for our future travels.",
      "review_text": "Thank you all for your support and coordination. We had a wonderful time, and the trip was well-organized. I appreciate the efforts of everyone involved. We'll definitely consider 'Trip by Genie' for our future travels.",
      "is_published": true,
      "created_at": "2026-10-18T06:06:20.686Z"
    },
    {
      "id": "test_14",
      "agency_id": "agency_travel_genie",
      "customer_name": "Prasath Srinivas",
      "customer_image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      "destination": "Vietnam Adventure & Da Nang",
      "rating": 5,
      "comment": "We had an amazing experience booking our Vietnam trip through Trip by Genie. Everything was handled with so much care and attention to detail, from visa arrangements and hotel bookings to daily planning. Even when our travel schedule got delayed, they went out of their way to adjust our hotel reservations and ensure everything went smoothly.\n\nThey also helped us with currency exchange, which made things so much easier once we arrived. The Indian and Local Vietnam team were always responsive, kind, and genuinely invested in making sure we had the best possible experience.\n\nThank you Ms. Vidhya Ram and Team for your constant support and for turning what could have been a stressful trip into a beautiful and memorable one. Highly recommend them to anyone planning a hassle-free vacation.",
      "review_text": "We had an amazing experience booking our Vietnam trip through Trip by Genie. Everything was handled with so much care and attention to detail, from visa arrangements and hotel bookings to daily planning. Even when our travel schedule got delayed, they went out of their way to adjust our hotel reservations and ensure everything went smoothly.\n\nThey also helped us with currency exchange, which made things so much easier once we arrived. The Indian and Local Vietnam team were always responsive, kind, and genuinely invested in making sure we had the best possible experience.\n\nThank you Ms. Vidhya Ram and Team for your constant support and for turning what could have been a stressful trip into a beautiful and memorable one. Highly recommend them to anyone planning a hassle-free vacation.",
      "is_published": true,
      "created_at": "2026-10-15T06:06:20.686Z"
    },
    {
      "id": "test_15",
      "agency_id": "agency_travel_genie",
      "customer_name": "Prasath",
      "customer_image": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      "destination": "Vietnam Group Tour",
      "rating": 5,
      "comment": "We booked our Vietnam trip through Trip by Genie, and I couldn’t be happier with how seamless everything was! From the visa process to hotel bookings and daily itineraries, every detail was handled perfectly. The team was always reachable, patient with our endless questions, and quick to assist whenever we needed support during the trip.\n\nIf you’re looking for a travel agency that genuinely cares about your experience rather than just booking tickets, Trip by Genie is the one. Thank you for making our trip so smooth and memorable! 🌏✈️",
      "review_text": "We booked our Vietnam trip through Trip by Genie, and I couldn’t be happier with how seamless everything was! From the visa process to hotel bookings and daily itineraries, every detail was handled perfectly. The team was always reachable, patient with our endless questions, and quick to assist whenever we needed support during the trip.\n\nIf you’re looking for a travel agency that genuinely cares about your experience rather than just booking tickets, Trip by Genie is the one. Thank you for making our trip so smooth and memorable! 🌏✈️",
      "is_published": true,
      "created_at": "2026-10-12T06:06:20.686Z"
    },
    {
      "id": "test_16",
      "agency_id": "agency_travel_genie",
      "customer_name": "Mani Kandan 96",
      "customer_image": "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
      "destination": "South India Customized Trip",
      "rating": 5,
      "comment": "It was a beautiful experience. From the start of the trip plan till the end Vidhya ma’am was very friendly and informative. My trip went peacefully. Driver was so nice person his driving was good, punctual, room arrangements were so good, even if had any problems they sorted out immediately. Overall I prefer this travel agency.",
      "review_text": "It was a beautiful experience. From the start of the trip plan till the end Vidhya ma’am was very friendly and informative. My trip went peacefully. Driver was so nice person his driving was good, punctual, room arrangements were so good, even if had any problems they sorted out immediately. Overall I prefer this travel agency.",
      "is_published": true,
      "created_at": "2026-10-09T06:06:20.686Z"
    },
    {
      "id": "test_17",
      "agency_id": "agency_travel_genie",
      "customer_name": "Ram Sathish",
      "customer_image": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      "destination": "Singapore Family Holiday",
      "rating": 5,
      "comment": "Excellent service and great planning! Our Singapore family trip was seamless, with well-chosen hotels, clear guidance, and timely support. Truly appreciate the professionalism and commitment shown by Vidhya from Trip Genie. 👍👏",
      "review_text": "Excellent service and great planning! Our Singapore family trip was seamless, with well-chosen hotels, clear guidance, and timely support. Truly appreciate the professionalism and commitment shown by Vidhya from Trip Genie. 👍👏",
      "is_published": true,
      "created_at": "2026-10-06T06:06:20.686Z"
    },
    {
      "id": "test_18",
      "agency_id": "agency_travel_genie",
      "customer_name": "Hethi Sandy",
      "customer_image": "https://tripbygenie.in/wp-content/uploads/2025/06/Website-images-20.png",
      "destination": "Thailand Special Holiday",
      "rating": 5,
      "comment": "We recently went THAILAND TRIP it was so \"Safe travels!\" \"Enjoy!\" Sweet memories for us Trip by genies provided a great service, smooth logistics, or memorable experiences we got a Indian food, friendly guides, all well organised no flow i strongly recommend to all my friends and family in future also i definitely go with them 200% vidhya mam is so helpful for us throughout THANK YOU SO MUCH 😊\nBY\nHEMALATHA CHANDRAN\nSATHISH",
      "review_text": "We recently went THAILAND TRIP it was so \"Safe travels!\" \"Enjoy!\" Sweet memories for us Trip by genies provided a great service, smooth logistics, or memorable experiences we got a Indian food, friendly guides, all well organised no flow i strongly recommend to all my friends and family in future also i definitely go with them 200% vidhya mam is so helpful for us throughout THANK YOU SO MUCH 😊\nBY\nHEMALATHA CHANDRAN\nSATHISH",
      "is_published": true,
      "created_at": "2026-10-03T06:06:20.686Z"
    }
  ],
  "notifications": [
    {
      "id": "notif_1",
      "agency_id": "agency_travel_genie",
      "user_id": "usr_admin_genie",
      "title": "New Customer Enquiry",
      "message": "Karan Malhotra submitted an enquiry for Dazzling Dubai package.",
      "type": "info",
      "link": "/admin/leads",
      "is_read": false,
      "created_at": "2026-11-19T08:15:00.000Z"
    },
    {
      "id": "notif_2",
      "agency_id": "agency_travel_genie",
      "user_id": "usr_staff_priya",
      "title": "Quotation Viewed by Client",
      "message": "Ananya Rao opened Quotation QT-2026-8801 for Maldives.",
      "type": "success",
      "link": "/staff/leads",
      "is_read": false,
      "created_at": "2026-11-18T14:00:00.000Z"
    },
    {
      "id": "notif_3",
      "agency_id": "agency_travel_genie",
      "user_id": "usr_agent_vikram",
      "title": "Purchase Order Confirmed",
      "message": "Your purchase order #pur_501 for Kashmir has been confirmed by Admin.",
      "type": "success",
      "link": "/agent/purchases",
      "is_read": false,
      "created_at": "2026-11-16T12:00:00.000Z"
    },
    {
      "id": "notif_4",
      "agency_id": "agency_travel_genie",
      "user_id": "usr_cust_ananya",
      "title": "Customized Quotation Ready",
      "message": "Priya Nair has sent your personalized Maldives quotation. View details and confirm.",
      "type": "info",
      "link": "/customer/enquiries",
      "is_read": false,
      "created_at": "2026-11-18T10:15:00.000Z"
    }
  ],
  "travel_services": [
    {
      "id": "srv_flight",
      "agency_id": "agency_travel_genie",
      "title": "Flight Ticket Booking",
      "icon": "Plane",
      "short_desc": "Domestic & international flights with exclusive corporate and group fares.",
      "details": "Instant ticketing across all major international and domestic airlines with flexible rescheduling, extra baggage allowance assistance, and 24/7 flight delay monitoring."
    },
    {
      "id": "srv_bus",
      "agency_id": "agency_travel_genie",
      "title": "Bus Ticket Booking",
      "icon": "Bus",
      "short_desc": "Comfortable sleeper & semi-sleeper Volvo buses across India.",
      "details": "Curated intercity luxury coach bookings with guaranteed seat selection, verified operator safety ratings, and contactless digital boarding passes."
    },
    {
      "id": "srv_car",
      "agency_id": "agency_travel_genie",
      "title": "Car Rental & Chauffeur Services",
      "icon": "Car",
      "short_desc": "Clean, sanitized sedans, luxury SUVs, and tempo travelers with polite drivers.",
      "details": "From airport drop-offs to multi-day hill station tours, choose from Toyota Crysta, Fortuner, Mercedes E-Class, and spacious luxury vans."
    },
    {
      "id": "srv_cruise",
      "agency_id": "agency_travel_genie",
      "title": "Luxury Cruise Booking",
      "icon": "Ship",
      "short_desc": "Royal Caribbean, Cordelia, and European river cruise reservations.",
      "details": "Sail through Southeast Asia, the Mediterranean, or the Indian coastline with ocean-view balconies, Broadway shows, and all-inclusive gourmet dining."
    },
    {
      "id": "srv_hotel",
      "agency_id": "agency_travel_genie",
      "title": "Hotel Reservations",
      "icon": "Building2",
      "short_desc": "Verified 3-star, 4-star, and 5-star luxury heritage resorts worldwide.",
      "details": "Special negotiated travel agency rates, complimentary room upgrades, early check-in requests, and free daily breakfast packages."
    },
    {
      "id": "srv_visa",
      "agency_id": "agency_travel_genie",
      "title": "Visa Assistance Services",
      "icon": "FileCheck",
      "short_desc": "Hassle-free Schengen, USA, UK, UAE, and Singapore visa documentation.",
      "details": "Expert end-to-end guidance on application preparation, cover letter drafting, appointment scheduling, and biometrics interview readiness."
    },
    {
      "id": "srv_insurance",
      "agency_id": "agency_travel_genie",
      "title": "Travel Insurance Assistance",
      "icon": "ShieldCheck",
      "short_desc": "Comprehensive medical, flight delay, baggage loss, and trip cancellation cover.",
      "details": "Zero-deductible overseas medical emergency cover accepted by Schengen consulates, with 24/7 cashless hospitalization assistance."
    },
    {
      "id": "srv_transfer",
      "agency_id": "agency_travel_genie",
      "title": "Airport Transfers",
      "icon": "MapPin",
      "short_desc": "Punctual meet & greet transfers at over 350 airports globally.",
      "details": "Professional English-speaking chauffeurs waiting at arrival gates with name boards, flight tracking for delays, and fixed transparent pricing."
    },
    {
      "id": "srv_webcheckin",
      "agency_id": "agency_travel_genie",
      "title": "Web Check-In Assistance",
      "icon": "CheckCircle",
      "short_desc": "Automatic seat allocation, baggage tagging, and digital boarding pass delivery.",
      "details": "Skip airport queues: our operations team automatically completes web check-in as soon as airline windows open and WhatsApps boarding passes to you."
    },
    {
      "id": "srv_custom_itinerary",
      "agency_id": "agency_travel_genie",
      "title": "Customized Travel Itineraries",
      "icon": "Compass",
      "short_desc": "Bespoke holiday planning tailored to your exact budget, pace, and interests.",
      "details": "Personal travel designer creates hour-by-hour itineraries with secret photo spots, offbeat culinary stops, and private guides."
    }
  ],
  "contact_enquiries": [
    {
      "id": "cnt_1",
      "agency_id": "agency_travel_genie",
      "name": "Pooja Hegde",
      "email": "pooja.h@yahoo.com",
      "phone": "+91 99001 22334",
      "subject": "Corporate Annual Offsite in Goa",
      "message": "We are looking for a 3-night offsite for 45 team members with conference room facilities and team building beach events.",
      "status": "New",
      "created_at": "2026-11-19T09:30:00.000Z"
    }
  ]
};

module.exports = { seedData };
