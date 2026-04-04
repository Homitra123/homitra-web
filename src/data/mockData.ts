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
    id: 'car-cleaning',
    name: 'Car Cleaning',
    description: 'Professional car cleaning and detailing service at your doorstep',
    icon: 'Car',
    basePrice: 149,
    image: 'https://images.pexels.com/photos/13065690/pexels-photo-13065690.jpeg?auto=compress&cs=tinysrgb&w=1200',
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
    id: 'home-assistant',
    name: 'On-Demand Home Assistant',
    description: 'Professional household help for cleaning, events, and parties. Perfect for everyday tasks and special occasions.',
    icon: 'Home',
    basePrice: 199,
    image: '/Home_Assiatnt_Pic.png',
    pricingTiers: [
      {
        id: 'home-assistant-hourly',
        name: 'Hourly Service',
        price: 199,
        duration: 'Per hour',
        features: [],
        included: [
          'House help cleaning services',
          'Party helper and event assistant for general tasks',
          'Preparing snacks, managing buffet, and clearing plates',
          'On-demand waitstaff for serving appetizers and dining area',
          'Private bartender for bar setup, mixing drinks, and guest serving',
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
