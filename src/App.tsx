import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import ServiceBooking from './pages/ServiceBooking';
import CookingBooking from './pages/CookingBooking';
import Checkout from './pages/Checkout';
import Bookings from './pages/Bookings';
import Profile from './pages/Profile';
import BookingSuccess from './pages/BookingSuccess';
import ResetPassword from './pages/ResetPassword';
import AuthEventHandler from './components/AuthEventHandler';
import CloudKitchen from './pages/CloudKitchen';
import FoodCheckout from './pages/FoodCheckout';
import FoodOrderSuccess from './pages/FoodOrderSuccess';
import FoodOrders from './pages/FoodOrders';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <Router>
              <AuthEventHandler />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <Layout>
                      <Home />
                    </Layout>
                  }
                />
                <Route
                  path="/service/home-cooking"
                  element={
                    <Layout>
                      <CookingBooking />
                    </Layout>
                  }
                />
                <Route
                  path="/service/:serviceId"
                  element={
                    <Layout>
                      <ServiceBooking />
                    </Layout>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Checkout />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Bookings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-success"
                  element={
                    <ProtectedRoute>
                      <BookingSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cloud-kitchen"
                  element={
                    <Layout>
                      <CloudKitchen />
                    </Layout>
                  }
                />
                <Route
                  path="/food-checkout"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FoodCheckout />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/food-order-success"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FoodOrderSuccess />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/food-orders"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FoodOrders />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
