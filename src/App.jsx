import React, { useState, useEffect } from 'react';
import AccessibilityBar from './components/accessibility/AccessibilityBar';
import Navbar from './components/navbar/Navbar';
import HeroSection from './components/hero/HeroSection';
import TourList from './components/tours/TourList';
import CareServices from './components/care-services/CareServices';
import Footer from './components/footer/Footer';

// Pages
import TourDetailPage from './components/tours/TourDetailPage';
import BookingPage from './components/booking/BookingPage';
import TicketPage from './components/tickets/TicketPage';
import BookingLookupModal from './components/tickets/BookingLookupModal';
import AdminDashboard from './components/admin/AdminDashboard';

// Auth Modals
import LoginModal from './components/auth/LoginModal';
import ProfileModal from './components/auth/ProfileModal';

import { getUserProfile, getStoredTours, clearUserProfile, initAutoCloudSync } from './utils/storage';
import './styles/index.css';

export default function App() {
  // Accessibility states
  const [fontSize, setFontSize] = useState('normal');

  // Tours Dynamic State
  const [tours, setTours] = useState(() => getStoredTours());

  // User Profile / Auth State
  const [currentUser, setCurrentUser] = useState(() => getUserProfile());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // View Routing State: 'home', 'detail', 'booking', 'ticket', 'admin'
  const [currentView, setCurrentView] = useState(() => {
    const user = getUserProfile();
    return user?.role === 'admin' ? 'admin' : 'home';
  });
  
  // Data States for routing
  const [selectedTour, setSelectedTour] = useState(null);
  const [bookedTicket, setBookedTicket] = useState(null);
  const [pendingBookTour, setPendingBookTour] = useState(null);
  const [isBookingPrompt, setIsBookingPrompt] = useState(false);

  // Other Modals
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Update HTML data attributes for senior accessibility font size
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  // Safety fallback: if currentView is 'detail' or 'booking' but selectedTour is null, redirect to 'home'
  useEffect(() => {
    if ((currentView === 'detail' || currentView === 'booking') && !selectedTour) {
      setCurrentView('home');
    }
  }, [currentView, selectedTour]);

  // ซิงค์ข้อมูลกับคลาวด์อัตโนมัติเมื่อเปิดแอป และรับฟังการอัปเดตทัวร์แบบเรียลไทม์
  useEffect(() => {
    initAutoCloudSync((cloudTours) => {
      setTours(cloudTours);
    });

    const handleToursUpdated = (e) => {
      if (e.detail?.tours) {
        setTours(e.detail.tours);
      }
    };

    window.addEventListener('sukjai_tours_updated', handleToursUpdated);
    return () => {
      window.removeEventListener('sukjai_tours_updated', handleToursUpdated);
    };
  }, []);

  // Navigation Handlers
  const handleViewTour = (tour) => {
    setSelectedTour(tour);
    setCurrentView('detail');
    window.scrollTo(0, 0);
  };

  const handleBookTour = (tour) => {
    if (!currentUser) {
      setPendingBookTour(tour);
      setIsBookingPrompt(true);
      setIsLoginOpen(true);
      return;
    }
    setSelectedTour(tour);
    setCurrentView('booking');
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (profile) => {
    setCurrentUser(profile);
    setIsLoginOpen(false);
    setIsBookingPrompt(false);

    if (profile?.role === 'admin') {
      setCurrentView('admin');
      window.scrollTo(0, 0);
      return;
    }

    if (pendingBookTour) {
      setSelectedTour(pendingBookTour);
      setCurrentView('booking');
      setPendingBookTour(null);
      window.scrollTo(0, 0);
    }
  };

  const handleOpenLookup = () => {
    if (!currentUser) {
      setIsBookingPrompt(false);
      setIsLoginOpen(true);
      return;
    }
    setIsLookupOpen(true);
  };

  const handleBookingSuccess = (ticket) => {
    setBookedTicket(ticket);
    setCurrentView('ticket');
    const saved = getUserProfile();
    if (saved) setCurrentUser(saved);
    window.scrollTo(0, 0);
  };

  const handleBackHome = () => {
    setSelectedTour(null);
    setBookedTicket(null);
    setCurrentView('home');
    window.scrollTo(0, 0);
  };

  const handleAdminLogout = () => {
    clearUserProfile();
    setCurrentUser(null);
    setCurrentView('home');
    window.scrollTo(0, 0);
  };

  return (
    <>
      <AccessibilityBar 
        fontSize={fontSize} 
        setFontSize={setFontSize} 
      />
      <Navbar 
        currentUser={currentUser}
        onOpenLogin={() => {
          setIsBookingPrompt(false);
          setIsLoginOpen(true);
        }}
        onOpenProfile={() => {
          if (currentUser?.role !== 'admin') {
            setIsProfileOpen(true);
          }
        }}
        onOpenLookup={handleOpenLookup} 
        onOpenAdmin={() => {
          setCurrentView('admin');
          window.scrollTo(0, 0);
        }}
        onLogout={handleAdminLogout}
      />
      
      <main>
        {currentView === 'home' && (
          <>
            <HeroSection />
            <TourList 
              tours={tours}
              onViewDetails={handleViewTour}
              onBook={handleBookTour}
            />
            <CareServices />
          </>
        )}

        {currentView === 'admin' && (
          <AdminDashboard 
            onBackToHome={handleBackHome}
            onLogout={handleAdminLogout}
            onToursUpdated={(updatedTours) => setTours(updatedTours)}
            tours={tours}
          />
        )}

        {currentView === 'detail' && (
          <TourDetailPage 
            tour={selectedTour} 
            onBack={handleBackHome} 
            onBook={handleBookTour}
          />
        )}

        {currentView === 'booking' && (
          <BookingPage 
            tour={selectedTour} 
            currentUser={currentUser}
            onCancel={handleBackHome}
            onBookingSuccess={handleBookingSuccess}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}

        {currentView === 'ticket' && (
          <TicketPage 
            booking={bookedTicket} 
            onBackHome={handleBackHome}
          />
        )}
      </main>

      {currentView !== 'booking' && currentView !== 'admin' && (
        <Footer onOpenLookup={handleOpenLookup} />
      )}

      {/* Booking Lookup Modal */}
      {isLookupOpen && currentUser && (
        <BookingLookupModal 
          currentUser={currentUser}
          onClose={() => setIsLookupOpen(false)} 
          onSelectBooking={(booking) => {
            setBookedTicket(booking);
            setCurrentView('ticket');
            setIsLookupOpen(false);
            window.scrollTo(0, 0);
          }}
        />
      )}

      {/* Login & Register Modal */}
      {isLoginOpen && (
        <LoginModal
          bookingPrompt={isBookingPrompt}
          onClose={() => {
            setIsLoginOpen(false);
            setIsBookingPrompt(false);
            setPendingBookTour(null);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onLogout={() => {
            clearUserProfile();
            setCurrentUser(null);
            if (currentView === 'booking' || currentView === 'admin') {
              setCurrentView('home');
            }
          }}
        />
      )}
    </>
  );
}
