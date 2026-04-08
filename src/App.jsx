import { useState } from "react";
import "./app.css";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/login.jsx";
import ForgotPassword from "./pages/ForgotPaassword.jsx";
import HostDashboard from "./pages/host/HostDashboard.jsx";
import HostProfileView from "./pages/host/HostProfileView.jsx";
import HostProfileEdit from "./pages/host/HostProfileEdit.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Razorpay from "./pages/razorpay.jsx";
import HostEventCreate from "./pages/host/HostEventCreate.jsx";
import HostEventsList from "./pages/host/HostEventsList.jsx";
import HostEventDetail from "./pages/host/HostEventDetail.jsx";
import HostEventEdit from "./pages/host/HostEventEdit.jsx";
import HostMyEvents from "./pages/host/HostMyEvents.jsx";
import HostOrganizers from "./pages/host/HostOrganizers.jsx";
import HostPayments from "./pages/host/HostPayments.jsx";
import HostChat from "./pages/host/HostChat.jsx";
import HostInvites from "./pages/host/HostInvites.jsx";
import HostOrganizerStatus from "./pages/host/HostOrganizerStatus.jsx";
import HostRequests from "./pages/host/HostRequests.jsx";
import HostOrganizerPools from "./pages/host/HostOrganizerPools.jsx";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard.jsx";
import OrganizerProfileView from "./pages/organizer/OrganizerProfileView.jsx";
import OrganizerProfileEdit from "./pages/organizer/OrganizerProfileEdit.jsx";
import OrganizerEvents from "./pages/organizer/OrganizerEvents.jsx";
import OrganizerHostStatus from "./pages/organizer/OrganizerHostStatus.jsx";
import OrganizerWallet from "./pages/organizer/OrganizerWallet.jsx";
import OrganizerPools from "./pages/organizer/OrganizerPools.jsx";
import OrganizerPoolApplications from "./pages/organizer/OrganizerPoolApplications.jsx";
import OrganizerManageGigs from "./pages/organizer/OrganizerManageGigs.jsx";
import OrganizerFeedbacks from "./pages/organizer/OrganizerFeedbacks.jsx";
import OrganizerChat from "./pages/organizer/OrganizerChat.jsx";
import OrganizerGigChat from "./pages/organizer/OrganizerGigChat.jsx";
import GigDashboard from "./pages/gig/GigDashboard.jsx";
import GigProfileView from "./pages/gig/GigProfileview.jsx";
import GigProfileEdit from "./pages/gig/GigProfileEdit.jsx";
import GigWallet from "./pages/gig/GigWallet.jsx";
import GigPools from "./pages/gig/GigPools.jsx";
import GigAttendance from "./pages/gig/GigAttendance.jsx";
import GigChat from "./pages/gig/GigChat.jsx";
import GigApplications from "./pages/gig/GigApplications.jsx";
import GigDisputes from "./pages/gig/GigDisputes.jsx";
import GigBadges from "./pages/gig/GigBadges.jsx";
import GigFeedbacks from "./pages/gig/GigFeedbacks.jsx";
import GigMyEvents from "./pages/gig/GigMyEvents.jsx";
import GigEventDetails from "./pages/gig/GigEventDetails.jsx";

// For separate development, point to server on port 8080
export const serverURL = `${import.meta.env.VITE_SERVER_URL}:${import.meta.env.VITE_PORT}/api/v1`;
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/register', '/login', '/forgot-password'].includes(location.pathname);

  return (
    <div className="relative">
      {/* Always render Home, but blur it when auth pages are open */}
      <div className={isAuthPage ? "blur-sm pointer-events-none select-none" : ""}>
        <Home />
      </div>
      
      {/* Render auth pages as modals on top */}
      {isAuthPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => navigate("/")}></div>
          <div className="relative z-10 w-full max-w-lg">
            {location.pathname === '/register' && <Register />}
            {location.pathname === '/login' && <Login />}
            {location.pathname === '/forgot-password' && <ForgotPassword />}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/register' element={<AppContent/>} />
      <Route path='/login' element={<AppContent/>} />
      <Route path='/forgot-password' element={<AppContent/>} />
      <Route path='/razorpay' element={<Razorpay/>} />
      
      {/* Protected Host Routes */}
      <Route 
        path='/host/dashboard' 
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected Organizer Routes */}
      <Route 
        path='/organizer/dashboard'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/events'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerEvents />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/host-status'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerHostStatus />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/wallet'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerWallet />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/pools'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerPools />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/pool-applications'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerPoolApplications />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/chat'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerChat />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/chat/:conversationId'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerChat />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/gig-chat'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerGigChat />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/gig-chat/:conversationId'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerGigChat />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/manage-gigs'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerManageGigs />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/feedbacks'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerFeedbacks />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/profile'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerProfileView />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/organizer/profile/edit'
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerProfileEdit />
          </ProtectedRoute>
        }
      />

      {/* Protected Gig Routes */}
      <Route 
        path='/gig/dashboard'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigDashboard />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/profile'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigProfileView />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/profile/edit'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigProfileEdit />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/wallet'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigWallet />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/pools'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigPools />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/applications'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigApplications />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/my-events'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigMyEvents />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/event/:poolId'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigEventDetails />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/attendance'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigAttendance />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/badges'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigBadges />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/feedbacks'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigFeedbacks />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/disputes'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigDisputes />
          </ProtectedRoute>
        }
      />
      <Route 
        path='/gig/chat'
        element={
          <ProtectedRoute allowedRoles={['gig']}>
            <GigChat />
          </ProtectedRoute>
        }
      />
      {/* Host Profile View Route */}
      <Route
        path='/host/profile'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostProfileView />
          </ProtectedRoute>
        }
      />
      {/* Host Profile Edit Route */}
      <Route
        path='/host/profile/edit'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostProfileEdit />
          </ProtectedRoute>
        }
      />

      {/* Host Event Routes */}
      <Route
        path='/host/chat'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostChat />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/chat/:conversationId'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostChat />
          </ProtectedRoute>
        }
      />

      {/* Host Event Routes */}
      <Route
        path='/host/my-events'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostMyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/events/create'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostEventCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/events'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostEventsList />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/events/:id'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/events/:id/edit'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostEventEdit />
          </ProtectedRoute>
        }
      />

      {/* Host Organizers & Payments */}
      <Route
        path='/host/organizers'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostOrganizers />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/invites'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostInvites />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/status'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostOrganizerStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/requests'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/pools'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostOrganizerPools />
          </ProtectedRoute>
        }
      />
      <Route
        path='/host/payments'
        element={
          <ProtectedRoute allowedRoles={['host']}>
            <HostPayments />
          </ProtectedRoute>
        }
      />
     
    </Routes>
  );
}

export default App;
