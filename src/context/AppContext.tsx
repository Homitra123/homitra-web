import { createContext, useContext, useState, ReactNode } from 'react';
import { User, Booking, BookingFormData } from '../types';
import { mockUser, mockBookings } from '../data/mockData';

interface AppContextType {
  user: User;
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'userId' | 'createdAt' | 'status'>) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<User>(mockUser);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `BK${String(bookings.length + 1).padStart(3, '0')}`,
      userId: user.id,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    setBookings([newBooking, ...bookings]);
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status } : booking
    ));
  };

  return (
    <AppContext.Provider value={{ user, bookings, addBooking, updateBookingStatus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
