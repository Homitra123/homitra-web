import { ChefHat, Car, Home as HomeIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { services } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const iconMap = {
  ChefHat,
  Car,
  Home: HomeIcon,
};

const Home = () => {
  const { user, profile } = useAuth();

  const getGreeting = () => {
    if (!user) return 'Greetings !!';
    if (profile?.full_name) {
      return `Greetings, ${profile.full_name.split(' ')[0]} !!`;
    }
    return `Greetings, ${profile?.email.split('@')[0] || 'there'} !!`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {getGreeting()}
        </h1>
        <p className="text-gray-600 text-lg">What can we help you with today?</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            return (
              <Link
                key={service.id}
                to={`/service/${service.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Icon size={24} className="text-blue-600 group-hover:text-white transition-colors" strokeWidth={2} />
                    </div>
                    <div className="bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-blue-600 font-semibold text-sm">Starting from ₹{service.basePrice}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                    <span>Book Now</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-12 bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 md:p-12 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Premium Home Services, Delivered</h2>
        <p className="text-gray-300 text-lg mb-8">
          Trusted professionals, verified backgrounds, and guaranteed satisfaction. Experience the Homitra difference.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">About Us</h3>
            <p className="text-gray-300">
              Homitra brings professional home services right to your doorstep. We connect you with skilled professionals for all your household needs.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
            <div className="text-gray-300 space-y-2">
              <p>Email: support@homitra.co.in</p>
              <p>Phone: +91 90089 35455</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
