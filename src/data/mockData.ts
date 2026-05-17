import { Service, User, Booking } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 90089 35455',
};

export const services: Service[] = [
  {
    id: 'home-cooking',
    name: 'Home Cooking',
    description: 'Fresh, healthy home-cooked meals prepared by experienced chefs in your kitchen',
    icon: 'ChefHat',
    basePrice: 199,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
    pricingTiers: [
      {
        id: 'basic-cooking',
        name: 'Basic',
        price: 199,
        duration: '2 hours',
        features: [],
        included: [
          'Prepare home-style dishes for 3-4 members',
          'Basic cooking with everyday meal recipes',
          'Cleaning utensils and cooking area'
        ],
        notIncluded: [
          'Grocery shopping or ingredient procurement',
          'Speciality cuisine',
          'Deep cleaning of kitchen, serving or table arrangements'
        ]
      },
      {
        id: 'premium-cooking',
        name: 'Premium',
        price: 299,
        duration: '3 hours',
        features: [],
        included: [
          'Prepare dishes for more than 4 members',
          'Custom meal planning with diverse menu options',
          'Cleaning utensils and cooking area'
        ],
        notIncluded: [
          'Grocery shopping or ingredient procurement',
          'Deep cleaning of kitchen, serving or table arrangements',
          'Baking or elaborated dessert preparations'
        ]
      }
    ]
  },
  {
    id: 'premier-housekeep',
    name: 'Premier House-keep Services',
    description: 'Expert household cleaning, kitchen support, and laundry care — keeping every corner of your home fresh and tidy.',
    icon: 'Sparkles',
    basePrice: 249,
    image: '/House_Keep_Pic_new.jpg',
    pricingTiers: [
      {
        id: 'premier-housekeep-standard',
        name: 'Premier House-keep',
        price: 249,
        duration: 'Starting at 2 hours',
        features: [],
        includedGroups: [
          {
            heading: 'Household Cleaning Support',
            items: [
              'Thoroughly sweep and mop all accessible flooring.',
              'Carefully dust and wipe furniture, wardrobes, fans, and ceilings.',
              'Refresh the living space by changing or rearranging existing bedding.',
            ]
          },
          {
            heading: 'Kitchen Support',
            items: [
              'Systematically wash all household utensils and deep-clean the kitchen sink.',
              'Degrease burners and wipe down the stovetop for a clean cooking area.',
              'Ensure hygiene by disposing of all wet and dry kitchen waste.',
            ]
          },
          {
            heading: 'Laundry Support',
            items: [
              'Manage the full cycle of clothes machine washing.',
              'Provide neat organization by arranging clothes in cupboards.',
              'Offer professional finish by ironing regular daily wear.',
            ]
          }
        ],
        notIncluded: [
          'Deep cleaning of bathrooms or kitchen appliances',
          'Grocery shopping or ingredient procurement',
          'Cooking or meal preparation',
          'Pest control or disinfection treatments',
          'Window or external glass cleaning',
          'Repairs or maintenance work of any kind'
        ]
      }
    ]
  },
  {
    id: 'car-cleaning',
    name: 'Car Cleaning',
    description: 'Professional car cleaning and detailing service at your doorstep',
    icon: 'Car',
    basePrice: 149,
    image: '/Car_Cleaning_service_image.jpg',
    pricingTiers: [
      {
        id: 'express-exterior',
        name: 'Express Exterior Wash',
        price: 1,
        duration: '45 minutes',
        description: 'A quick, effective refresh for your vehicle\'s exterior, perfect for regular maintenance.',
        features: [],
        included: [
          'High-Foam Exterior Wash',
          'Tire & Rim Dressing'
        ]
      },
      {
        id: 'standard-wash',
        name: 'Standard Wash',
        price: 299,
        duration: '90 minutes',
        description: 'Our most popular package, providing a thorough clean for both the inside and outside of your car.',
        features: [],
        included: [
          'High-Foam Exterior Wash',
          'Tire & Rim Dressing',
          'Deep Interior Vacuuming',
          'Dashboard & Console Conditioning',
          'Floor and Boot Mat Extraction'
        ]
      },
      {
        id: 'premium-wash',
        name: 'Premium Wash',
        price: 499,
        duration: '120 minutes',
        description: 'A deep restorative cleaning and protection package to bring back that showroom feel.',
        features: [],
        included: [
          'Advanced Exterior Wash & Wax',
          'Premium Tire Dressing',
          'Deep Interior Vacuuming',
          'Dashboard & Console Conditioning',
          'Floor and Boot Mat Extraction',
          'Deep-Stain Interior Chemical Clean',
          'Interior Headliner (Roof) Cleaning'
        ]
      }
    ]
  },
  {
    id: 'deep-bathroom-cleaning',
    name: 'Deep Bathroom Cleaning',
    description: 'Professional deep cleaning of your bathrooms — tiles, fixtures, drains, and surfaces scrubbed spotless.',
    icon: 'ShowerHead',
    basePrice: 499,
    image: '/Bathroom_Cleaning_PicNew.jpg',
    pricingTiers: [
      {
        id: 'deep-bathroom-standard',
        name: 'Deep Bathroom Clean',
        price: 499,
        duration: 'Approx. 45 mins',
        features: [],
        included: [
          'Floor and wall tile scrubbing and descaling',
          'Toilet bowl, seat, and tank deep cleaning and sanitization',
          'Bathtub and shower area scrubbing and stain removal',
          'Washbasin, Tap, Showerhead and mirror cleaning',
          'Exhaust fan exterior cleaning',
          'Complete surface disinfection and deodorizing'
        ],
        notIncluded: [
          'Plumbing repairs, pipe work, Electrical fixture repairs or tile replacement',
          'Pest control treatment',
          'Washing or laundering of towels and bath mats',
          'Painting or waterproofing work'
        ]
      }
    ]
  },
  {
    id: 'pest-control',
    name: 'Pest Control Service',
    description: 'Safe and effective pest control treatments to keep your home free from cockroaches, ants, mosquitoes, and common household pests.',
    icon: 'Bug',
    basePrice: 999,
    image: '/Pest_Control_Pic.jpg',
    pricingTiers: [
      {
        id: 'pest-control-standard',
        name: 'Targeted Treatment Plan',
        price: 999,
        duration: '',
        features: [],
        included: [
          'Cockroach Control: 2-visit spray and gel treatment to break the breeding cycle and kill new hatchlings.',
          'Ant Control: 2-visit Strategic bait gel application in cracks and trails to eliminate colonies from the source.',
          'Bed Bugs Control: High-potency spray for mattresses and furniture joints to reach deep hiding spots.',
          'Rodent Control: Industrial glue boards and baiting in high-activity zones with entry-point checks.',
          'Mosquito Control: Wall-surface residual sprays treatment to halt indoor breeding as an Add-on Service.',
          'Crawling Insects: Barrier spray to corners and boards to neutralize spiders & crawlers as an Add-on Service.'
        ],
        notIncluded: [
          'Specialized Care: Excludes termite, wood borer, and beehive treatments.',
          'Repairs & Cleaning: No sealing of holes, grease removal, or rodent disposal.',
          'Post-Service: Technicians will not wash surfaces or handle utensils/laundry/bedding.'
        ]
      }
    ]
  },
  {
    id: 'home-assistant',
    name: 'On-Demand Home Assistant',
    description: 'Professional household help for cleaning, events, and parties. Perfect for everyday tasks and special occasions.',
    icon: 'Home',
    basePrice: 199,
    image: '/Home_Assiatnt_Pic.jpg',
    pricingTiers: [
      {
        id: 'home-assistant-hourly',
        name: 'Hourly Service',
        price: 199,
        duration: 'Per hour',
        features: [],
        included: [
          'House help cleaning services and Utensils Cleaning',
          'Party helper and event assistant for general tasks',
          'Preparing snacks, managing buffet, and clearing plates',
          'On-demand waitstaff for serving appetizers and dining area',
          'Post-party cleanup crew for morning-after mess handling'
        ],
        notIncluded: [
          'Preparing Stove dishes or full meal cooking',
          'Laundry and washing cloths',
          'Grocery shopping and material procurement'
        ]
      }
    ]
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'BK001',
    userId: '1',
    serviceId: 'home-cooking',
    serviceName: 'Home Cooking',
    tier: 'Premium',
    date: '2026-03-26',
    timeSlot: '10:00 AM - 12:00 PM',
    location: 'Koramangala',
    address: '123, 5th Block, Koramangala, Bangalore - 560095',
    price: 599,
    status: 'partner_assigned',
    partnerName: 'Chef Rajesh Kumar',
    createdAt: '2026-03-24T10:30:00Z'
  },
  {
    id: 'BK002',
    userId: '1',
    serviceId: 'car-cleaning',
    serviceName: 'Car Cleaning',
    tier: 'Basic Wash',
    date: '2026-03-25',
    timeSlot: '4:00 PM - 6:00 PM',
    location: 'Whitefield',
    address: 'Brigade Meadows, Whitefield, Bangalore - 560066',
    price: 499,
    status: 'in_progress',
    partnerName: 'Manoj Reddy',
    createdAt: '2026-03-23T14:20:00Z'
  },
  {
    id: 'BK003',
    userId: '1',
    serviceId: 'home-assistant',
    serviceName: 'On-Demand Home Assistant',
    tier: 'Basic',
    date: '2026-03-20',
    timeSlot: '8:00 AM - 10:00 AM',
    location: 'HSR Layout',
    address: 'Sector 2, HSR Layout, Bangalore - 560102',
    price: 399,
    status: 'completed',
    partnerName: 'Lakshmi Devi',
    createdAt: '2026-03-19T16:45:00Z'
  }
];
