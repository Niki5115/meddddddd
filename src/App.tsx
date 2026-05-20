import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  MapPin,
  CreditCard,
  Download,
  User,
  UserCheck,
  LogOut,
  Lock,
  Mail,
  Phone,
  Shield,
  Clock,
  Menu,
  X,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { Hospital, Booking, Staff, AppView, UserRole, AppTheme } from './types';
import {
  INITIAL_HOSPITALS,
  INITIAL_STAFF,
  INITIAL_BOOKINGS,
  RELATIONSHIP_OPTIONS
} from './data';

export default function App() {
  // UI & Design State
  const [theme, setTheme] = useState<AppTheme>('teal-light');
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Interactive Live Simulated Database States
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);

  // Workflow state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [tempBookingData, setTempBookingData] = useState<Partial<Booking>>({});

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Switch Portal in Sandbox HUD
  const triggerSandboxPortal = (role: UserRole, targetView: AppView) => {
    setUserRole(role);
    setUserName(role === 'admin' ? 'Administrator' : role === 'staff' ? 'Dr. Rohan Das' : 'Nikitha J');
    setUserEmail(role === 'admin' ? 'admin@medtrack.gov' : role === 'staff' ? 'rohan.das@medtrack.org' : 'nikitha@gmail.com');
    setCurrentView(targetView);
    showToast(`Switched to active ${role.toUpperCase()} mode!`);
  };

  // Reset demo simulation state
  const resetSimulation = () => {
    setHospitals(INITIAL_HOSPITALS);
    setBookings(INITIAL_BOOKINGS);
    setStaffList(INITIAL_STAFF);
    setCurrentView('landing');
    setUserRole(null);
    setSelectedHospital(null);
    setSelectedBooking(null);
    showToast('Simulation state refilled to pristine default!');
  };

  // Calculations for dashboard counters
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'Pending').length;
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;
    const discharged = bookings.filter((b) => b.status === 'Discharged').length;

    // Bed totals
    let occupiedIcu = 0, totalIcu = 0;
    let occupiedOxygen = 0, totalOxygen = 0;
    let occupiedNormal = 0, totalNormal = 0;

    hospitals.forEach((h) => {
      totalIcu += h.total_icu;
      occupiedIcu += h.total_icu - h.icu_beds;
      totalOxygen += h.total_oxygen;
      occupiedOxygen += h.total_oxygen - h.oxygen_beds;
      totalNormal += h.total_normal;
      occupiedNormal += h.total_normal - h.normal_beds;
    });

    return {
      total,
      pending,
      confirmed,
      cancelled,
      discharged,
      icuAvailable: totalIcu - occupiedIcu,
      icuTotal: totalIcu,
      oxygenAvailable: totalOxygen - occupiedOxygen,
      oxygenTotal: totalOxygen,
      normalAvailable: totalNormal - occupiedNormal,
      normalTotal: totalNormal
    };
  }, [bookings, hospitals]);

  // Handle hospital filter search
  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return hospitals;
    const query = searchQuery.toLowerCase();
    return hospitals.filter(
      (h) =>
        h.hospital_name.toLowerCase().includes(query) ||
        h.city.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query)
    );
  }, [hospitals, searchQuery]);

  // Handle booking action inputs
  const initiateBooking = (hospital: Hospital) => {
    if (userRole !== 'patient') {
      // Auto assign standard patient credential for the sandbox feel
      setUserRole('patient');
      setUserName('Nikitha J');
      setUserEmail('nikitha@gmail.com');
    }
    setSelectedHospital(hospital);
    setTempBookingData({
      hospital_id: hospital.id,
      bed_type: 'ICU',
      priority: 'Normal'
    });
    setCurrentView('book_bed');
  };

  // Save partial book bed details, move to Payment
  const stepToPayment = (formData: any) => {
    setTempBookingData({ ...tempBookingData, ...formData });
    setCurrentView('payment');
  };

  // Process Mock Checkout
  const handleCheckoutPayment = (payMethod: string) => {
    if (!selectedHospital) return;

    // Check inventory
    const bType = tempBookingData.bed_type || 'Normal';
    let available = 0;
    if (bType === 'ICU') available = selectedHospital.icu_beds;
    if (bType === 'Oxygen') available = selectedHospital.oxygen_beds;
    if (bType === 'Normal') available = selectedHospital.normal_beds;

    if (available <= 0) {
      showToast(`Error: No ${bType} beds available in ${selectedHospital.hospital_name}!`);
      return;
    }

    // Deduct inventory
    setHospitals((prevHospitals) =>
      prevHospitals.map((h) => {
        if (h.id === selectedHospital.id) {
          return {
            ...h,
            icu_beds: bType === 'ICU' ? h.icu_beds - 1 : h.icu_beds,
            oxygen_beds: bType === 'Oxygen' ? h.oxygen_beds - 1 : h.oxygen_beds,
            normal_beds: bType === 'Normal' ? h.normal_beds - 1 : h.normal_beds
          };
        }
        return h;
      })
    );

    // Calculate billing fee based on bed type
    const pricing = bType === 'ICU' ? '₹15,000' : bType === 'Oxygen' ? '₹7,500' : '₹3,000';

    // Create Booking
    const newBooking: Booking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: tempBookingData.patient_name || 'Anonymous Patient',
      guardian_name: tempBookingData.guardian_name || 'Guardian One',
      relationship: tempBookingData.relationship || 'Relative',
      email: tempBookingData.email || 'guardian@email.com',
      phone: tempBookingData.phone || '+91 99999 88888',
      hospital_id: selectedHospital.id,
      bed_type: bType as 'ICU' | 'Oxygen' | 'Normal',
      priority: (tempBookingData.priority || 'Normal') as 'Critical' | 'Moderate' | 'Normal',
      status: 'Confirmed',
      payment_amount: pricing,
      payment_method: payMethod,
      transaction_id: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date().toISOString()
    };

    setBookings([newBooking, ...bookings]);
    setSelectedBooking(newBooking);
    setCurrentView('success_receipt');
    showToast('Secure payment finalized! Hospital bed secured instantly.');
  };

  // Admin approves pending staff into the selected hospital
  const handleApproveStaff = (staffId: number, hospitalId: number) => {
    const hName = hospitals.find((h) => h.id === hospitalId)?.hospital_name || 'Hospital';
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          return { ...s, assigned_hospital_id: hospitalId, status: 'Active' };
        }
        return s;
      })
    );
    showToast(`Approved registration for clinician into ${hName}!`);
  };

  // Admin rejects clinicians joining request
  const handleRejectStaff = (staffId: number) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    showToast(' clinique request successfully declined.');
  };

  // Admin removes active clinician assignment
  const handleRemoveStaff = (staffId: number) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          return { ...s, assigned_hospital_id: null, status: 'Pending' };
        }
        return s;
      })
    );
    showToast('Staff removed from assignment roster.');
  };

  // clinician processes patient discharge
  const handleDischargePatient = (bookingId: string) => {
    const bookingToDischarge = bookings.find((b) => b.id === bookingId);
    if (!bookingToDischarge) return;

    // Refund/Release inventory count
    setHospitals((prevHospitals) =>
      prevHospitals.map((h) => {
        if (h.id === bookingToDischarge.hospital_id) {
          const type = bookingToDischarge.bed_type;
          return {
            ...h,
            icu_beds: type === 'ICU' ? Math.min(h.icu_beds + 1, h.total_icu) : h.icu_beds,
            oxygen_beds: type === 'Oxygen' ? Math.min(h.oxygen_beds + 1, h.total_oxygen) : h.oxygen_beds,
            normal_beds: type === 'Normal' ? Math.min(h.normal_beds + 1, h.total_normal) : h.normal_beds
          };
        }
        return h;
      })
    );

    // Update booking status
    setBookings((prevBookings) =>
      prevBookings.map((b) => (b.id === bookingId ? { ...b, status: 'Discharged' } : b))
    );

    showToast(`Patient on ticket ${bookingId} holds discharged status successfully!`);
  };

  // clinician modifications - changes bed type
  const handleChangeBedType = (bookingId: string, newBedType: 'ICU' | 'Oxygen' | 'Normal') => {
    setBookings((prevBookings) =>
      prevBookings.map((b) => (b.id === bookingId ? { ...b, bed_type: newBedType } : b))
    );
    showToast(`Booking ${bookingId} transferred to ${newBedType} bed category.`);
  };

  // clinician/Patient cancels booking
  const handleCancelBooking = (bookingId: string) => {
    const bookingToCancel = bookings.find((b) => b.id === bookingId);
    if (!bookingToCancel) return;

    // Refund/Release inventory counts only if not already Cancelled or Discharged
    if (bookingToCancel.status !== 'Cancelled' && bookingToCancel.status !== 'Discharged') {
      setHospitals((prevHospitals) =>
        prevHospitals.map((h) => {
          if (h.id === bookingToCancel.hospital_id) {
            const type = bookingToCancel.bed_type;
            return {
              ...h,
              icu_beds: type === 'ICU' ? Math.min(h.icu_beds + 1, h.total_icu) : h.icu_beds,
              oxygen_beds: type === 'Oxygen' ? Math.min(h.oxygen_beds + 1, h.total_oxygen) : h.oxygen_beds,
              normal_beds: type === 'Normal' ? Math.min(h.normal_beds + 1, h.total_normal) : h.normal_beds
            };
          }
          return h;
        })
      );
    }

    setBookings((prevBookings) =>
      prevBookings.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
    showToast(`Booking ${bookingId} cancelled. Active credit refund initialized.`);
  };

  // Authenticate user form simulation
  const handleLoginSubmit = (role: UserRole, emailInput: string) => {
    setUserRole(role);
    setUserEmail(emailInput);
    setUserName(role === 'admin' ? 'System Administrator' : role === 'staff' ? 'Dr. Rohan Das' : 'Patient Account');
    if (role === 'admin') setCurrentView('admin_dashboard');
    if (role === 'staff') setCurrentView('staff_dashboard');
    if (role === 'patient') setCurrentView('patient_dashboard');
    showToast(`Authenticated successfully as ${role.toUpperCase()}!`);
  };

  // Clear session
  const logoutUser = () => {
    setUserRole(null);
    setUserEmail('');
    setUserName('');
    setCurrentView('landing');
    showToast('Logged out of workspace session.');
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === 'slate-dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Dynamic Toast Feedback Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-teal-600 text-white font-medium px-4 py-3 rounded-xl shadow-lg shadow-teal-900/10 flex items-center gap-2 border border-teal-500"
          >
            <Sparkles className="w-5 h-5 text-teal-200 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSISTENT PORTAL switcher - SANDBOX HUD */}
      <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-3 shadow-md z-40 border-b border-teal-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-teal-500 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide animate-pulse">
            LIVE PREVIEW
          </span>
          <p className="font-semibold text-teal-100">
            MedTrack UI Interactive Sandbox: Test standard workspace dashboards instantly!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme customizer */}
          <button
            onClick={() => setTheme(theme === 'teal-light' ? 'slate-dark' : 'teal-light')}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer"
          >
            Design Presets: <span className="text-teal-400 capitalize">{theme.replace('-', ' ')}</span>
          </button>

          {/* Preset Buttons for Quick role verification */}
          <span className="text-slate-400">| Preview Portals:</span>
          <button
            onClick={() => triggerSandboxPortal('patient', 'patient_dashboard')}
            className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
              userRole === 'patient'
                ? 'bg-teal-500 text-white shadow shadow-teal-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => triggerSandboxPortal('staff', 'staff_dashboard')}
            className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
              userRole === 'staff'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow shadow-amber-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            Clinician / Staff
          </button>
          <button
            onClick={() => triggerSandboxPortal('admin', 'admin_dashboard')}
            className={`px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer ${
              userRole === 'admin'
                ? 'bg-rose-500 text-white shadow shadow-rose-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            Govt / Admin
          </button>

          <button
            onClick={resetSimulation}
            title="Refill values & data list settings"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 hover:text-teal-100 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header
        className={`sticky top-0 z-30 transition-all border-b ${
          theme === 'slate-dark'
            ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md'
            : 'bg-white/90 border-slate-200 backdrop-blur-md'
        }`}
      >
        <div className="max-width max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="bg-teal-600 group-hover:bg-teal-500 text-white p-2 rounded-xl transition-all shadow-md shadow-teal-600/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-teal-600">
                Med<span className="text-teal-500">Track</span>
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Smart Healthcare
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('landing')}
              className={`font-semibold text-sm transition-all cursor-pointer ${
                currentView === 'landing' ? 'text-teal-500' : 'text-slate-500 hover:text-teal-500'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('hospitals')}
              className={`font-semibold text-sm transition-all cursor-pointer ${
                currentView === 'hospitals' ? 'text-teal-500' : 'text-slate-500 hover:text-teal-500'
              }`}
            >
              Hospitals & Map
            </button>

            {/* Render dynamic portal links */}
            {userRole === 'admin' && (
              <button
                onClick={() => setCurrentView('admin_dashboard')}
                className="font-semibold text-sm text-rose-500 hover:text-rose-400 flex items-center gap-1"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}

            {userRole === 'staff' && (
              <button
                onClick={() => setCurrentView('staff_dashboard')}
                className="font-semibold text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                <UserCheck className="w-4 h-4" />
                Staff Desk
              </button>
            )}

            {userRole === 'patient' && (
              <button
                onClick={() => setCurrentView('patient_dashboard')}
                className="font-semibold text-sm text-teal-500 flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                Patient Dashboard
              </button>
            )}

            {userRole ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-300 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-xs font-bold">{userName}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{userRole} view</p>
                </div>
                <button
                  onClick={logoutUser}
                  title="Logout current workspace"
                  className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setUserRole('patient');
                  setCurrentView('login');
                }}
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/10"
              >
                Sign In Portal
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content View Portals */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* VIEW 1: LANDING PAGE */}
            {currentView === 'landing' && (
              <section className="space-y-12">
                {/* Hero introduction section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto py-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Verified Real-time Emergency Logistics</span>
                  </div>
                  <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-tight">
                    Smart Hospital Bed Logistics with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400">MedTrack</span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                    MedTrack matches families to critical emergency bed inventories instantly. Find, book, secure payments, and acquire instant QR receipts transparently.
                  </p>
                  <div className="pt-4 flex justify-center gap-4">
                    <button
                      onClick={() => setCurrentView('hospitals')}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2 group cursor-pointer shadow-lg shadow-teal-600/25"
                    >
                      Browse Beds Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() => triggerSandboxPortal('admin', 'admin_dashboard')}
                      className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-6 py-3 rounded-xl transition-all text-sm cursor-pointer"
                    >
                      Government Board Stats
                    </button>
                  </div>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl text-center space-y-1 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                      Hospitals Online
                    </p>
                    <p className="text-3xl font-extrabold text-teal-600 font-display">
                      {hospitals.length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl text-center space-y-1 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                      ICU Available
                    </p>
                    <p className="text-3xl font-extrabold text-rose-500 font-display">
                      {stats.icuAvailable} <span className="text-xs text-slate-400">/ {stats.icuTotal}</span>
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl text-center space-y-1 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                      Oxygen Supported
                    </p>
                    <p className="text-3xl font-extrabold text-amber-500 font-display">
                      {stats.oxygenAvailable} <span className="text-xs text-slate-400">/ {stats.oxygenTotal}</span>
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl text-center space-y-1 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                      Bookings Safe
                    </p>
                    <p className="text-3xl font-extrabold text-emerald-500 font-display">
                      {stats.total}
                    </p>
                  </div>
                </div>

                {/* Showcase Interactive Map teaser */}
                <div className="bg-slate-100 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                      Search by Location & Active Bed Inventory
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Enter your residential city (like <b>Bangalore</b>) to filter medical sites with real-time operational beds. No outdated phone lines or waitlists.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          placeholder="Search 'fortis' or 'manipal'..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <button
                        onClick={() => setCurrentView('hospitals')}
                        className="bg-slate-900 dark:bg-slate-800 text-white font-bold px-4 rounded-xl text-sm"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                    {filteredHospitals.slice(0, 4).map((hospital) => (
                      <div
                        key={hospital.id}
                        className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-900 hover:border-teal-500/50 bg-slate-50/50 dark:bg-slate-900/30 transition-all space-y-2"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs truncate max-w-[140px]">
                            {hospital.hospital_name}
                          </h4>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono px-1.5 py-0.5 rounded">
                            {hospital.city}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                          <div className="bg-rose-50 dark:bg-rose-950/25 p-1 rounded font-bold text-rose-600">
                            ICU {hospital.icu_beds}
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-950/25 p-1 rounded font-bold text-amber-600">
                            O2 {hospital.oxygen_beds}
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-950/25 p-1 rounded font-bold text-emerald-600">
                            Gen {hospital.normal_beds}
                          </div>
                        </div>
                        <button
                          onClick={() => initiateBooking(hospital)}
                          className="w-full text-center bg-teal-600 hover:bg-teal-500 text-white text-[10px] py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Secure Admission Bed
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Clinician portals feature selector */}
                <div id="features" className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-display font-extrabold text-xl">
                      Multi-portal Clinically Coordinated Management
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold">
                      Click below or use our dynamic Floating HUD above to preview roles
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Patient Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-teal-500 transition-all">
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg">Patient & Guardian Desk</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Securely browse local list coordinates, generate emergency rankings, complete payment deposits, and tracking ticket lists.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerSandboxPortal('patient', 'patient_dashboard')}
                        className="w-full bg-teal-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 group cursor-pointer"
                      >
                        Enter Patient Space
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                    {/* Clinician Staff Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-amber-500 transition-all">
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg">Hospital Clinician Panel</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Discharge active patient files dynamically, update bed structures on immediate release, and manage transfers.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerSandboxPortal('staff', 'staff_dashboard')}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 group cursor-pointer"
                      >
                        Enter Clinician Space
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                    {/* Government Board Admin Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-indigo-500 transition-all">
                      <div className="space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-100 flex items-center justify-center">
                          <Shield className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg">Govt Registry Office</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Monitor macro city counters, handle clinicians approvals and rejections directly, check booking audits and metrics.
                        </p>
                      </div>
                      <button
                        onClick={() => triggerSandboxPortal('admin', 'admin_dashboard')}
                        className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 group cursor-pointer"
                      >
                        Enter Admin Space
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* VIEW 2: SIGN IN / AUTH SIMULATION */}
            {currentView === 'login' && (
              <div className="max-w-md mx-auto py-12">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                      MedTrack Authenticate
                    </h2>
                    <p className="text-xs text-slate-400">
                      Standard sandbox login. Select role type to test and continue!
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Step 1: Choose Role Portal
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl">
                        {(['patient', 'staff', 'admin'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setUserRole(r)}
                            className={`py-2 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                              userRole === r
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get('email') as string;
                        handleLoginSubmit(userRole || 'patient', email || 'demo@medtrack.org');
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                          <input
                            type="email"
                            name="email"
                            required
                            defaultValue={
                              userRole === 'admin'
                                ? 'admin@medtrack.gov'
                                : userRole === 'staff'
                                ? 'rohan.das@medtrack.org'
                                : 'nikitha@gmail.com'
                            }
                            placeholder="username@domain.com"
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 w-full text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                          <input
                            type="password"
                            required
                            defaultValue="password123"
                            placeholder="••••••••"
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-2.5 w-full text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer"
                      >
                        Enter MedTrack Portal
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: HOSPITAL DIRECTORY SEARCH & SELECTION */}
            {currentView === 'hospitals' && (
              <section className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div className="space-y-1">
                    <h2 className="font-display font-extrabold text-3xl">Active Bangalore Hospital Sites</h2>
                    <p className="text-sm text-slate-400">
                      Live counters directly monitored by state healthcare authorities.
                    </p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      placeholder="Filter by name / address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {filteredHospitals.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <AlertCircle className="w-12 h-12 text-slate-450 mx-auto mb-3" />
                    <h3 className="font-bold text-lg">No hospitals match your search</h3>
                    <p className="text-slate-450 text-xs">Try searching &apos;Fortis&apos;, &apos;Aster&apos;, or &apos;Apollo&apos;.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredHospitals.map((hospital) => {
                      const clin = staffList.find((s) => s.assigned_hospital_id === hospital.id);
                      return (
                        <div
                          key={hospital.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-teal-500/65 transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
                                  {hospital.city} Facility
                                </span>
                                <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white leading-snug">
                                  {hospital.hospital_name}
                                </h3>
                              </div>
                              <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                <Building2 className="w-5 h-5 text-teal-500" />
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                              <span>{hospital.address}</span>
                            </p>

                            <div className="py-2 border-y border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-center space-y-1">
                                <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest block font-mono">
                                  ICU Bed Slots
                                </span>
                                <p className="text-lg font-black text-rose-600">
                                  {hospital.icu_beds} <span className="text-xs font-normal text-slate-400">/ {hospital.total_icu}</span>
                                </p>
                              </div>

                              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-center space-y-1">
                                <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest block font-mono">
                                  Oxygen Bed
                                </span>
                                <p className="text-lg font-black text-amber-655">
                                  {hospital.oxygen_beds} <span className="text-xs font-normal text-slate-400">/ {hospital.total_oxygen}</span>
                                </p>
                              </div>

                              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-center space-y-1">
                                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest block font-mono">
                                  General Bed
                                </span>
                                <p className="text-lg font-black text-emerald-600">
                                  {hospital.normal_beds} <span className="text-xs font-normal text-slate-400">/ {hospital.total_normal}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-600">
                                MD
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  On-Call Clinician
                                </p>
                                <p className="text-xs font-bold text-slate-750 dark:text-slate-200">
                                  {clin ? clin.name : 'Duty Officer'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => initiateBooking(hospital)}
                              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all uppercase tracking-wider cursor-pointer shadow-md shadow-teal-600/10"
                            >
                              Secure Reservation
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* VIEW 4: ADMIN DASHBOARD */}
            {currentView === 'admin_dashboard' && (
              <section className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                  <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                    Government Central Ledger Board
                  </span>
                  <h2 className="font-display font-black text-3xl">System Analytics Dashboard</h2>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Bookings Logged</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white font-display mt-1">
                      {stats.total}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl shadow-sm text-amber-600 dark:text-amber-400">
                    <p className="text-[11px] font-bold uppercase">Pending Review</p>
                    <p className="text-2xl font-black font-display mt-1">{stats.pending}</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl shadow-sm text-emerald-600 dark:text-emerald-400">
                    <p className="text-[11px] font-bold uppercase">Confirmed Admissions</p>
                    <p className="text-2xl font-black font-display mt-1">{stats.confirmed}</p>
                  </div>
                  <div className="bg-slate-500/10 border border-slate-500/20 p-4 rounded-2xl shadow-sm text-slate-600 dark:text-slate-400">
                    <p className="text-[11px] font-bold uppercase">Discharged Cases</p>
                    <p className="text-2xl font-black font-display mt-1">{stats.discharged}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl shadow-sm text-red-600 dark:text-red-400">
                    <p className="text-[11px] font-bold uppercase">Cancelled Slots</p>
                    <p className="text-2xl font-black font-display mt-1">{stats.cancelled}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Staff Registration Requests */}
                  <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-indigo-100 dark:border-indigo-950 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-teal-500" />
                        <div>
                          <h3 className="font-bold text-base">Security Clinicians & Roster Review</h3>
                          <p className="text-xs text-slate-400">
                            Govt validation of incoming clinicians credentials.
                          </p>
                        </div>
                      </div>
                      <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded text-[10px]">
                        {staffList.filter((s) => s.status === 'Pending').length} Pending Requests
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-950 text-slate-400 font-bold">
                            <th className="p-3 rounded-l-lg">Clinician Candidate</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Mobile Contact</th>
                            <th className="p-3">Current Assignment Status</th>
                            <th className="p-3 rounded-r-lg text-right">Emergency Clearance Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {staffList.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="p-3 font-bold flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                  {st.name[0]}
                                </div>
                                <span>{st.name}</span>
                              </td>
                              <td className="p-3 font-mono">{st.email}</td>
                              <td className="p-3 font-mono">{st.phone}</td>
                              <td className="p-3">
                                {st.status === 'Pending' ? (
                                  <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Awaiting Govt Authorization
                                  </span>
                                ) : (
                                  <span className="bg-emerald-100 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Active Facility (ID: {st.assigned_hospital_id})
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {st.status === 'Pending' ? (
                                  <div className="inline-flex items-center gap-1.5 justify-end">
                                    <select
                                      onChange={(e) => {
                                        const hId = Number(e.target.value);
                                        if (hId) handleApproveStaff(st.id, hId);
                                      }}
                                      defaultValue=""
                                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none"
                                    >
                                      <option value="" disabled>
                                        Deploy to Hospital...
                                      </option>
                                      {hospitals.map((h) => (
                                        <option key={h.id} value={h.id}>
                                          {h.hospital_name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleRejectStaff(st.id)}
                                      className="text-slate-400 hover:text-rose-500 font-bold px-1 py-1 rounded cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleRemoveStaff(st.id)}
                                    className="text-rose-500 hover:text-rose-400 font-bold hover:underline py-1 rounded cursor-pointer"
                                  >
                                    De-allocate Duty
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* VIEW 5: PATIENT PORTAL INTERACTION */}
            {currentView === 'patient_dashboard' && (
              <section className="space-y-6">
                <div className="bg-gradient-to-r from-teal-850 to-teal-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-teal-800">
                  <div className="space-y-1 z-10">
                    <div className="bg-teal-500 font-bold text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wider inline-block">
                      Authenticated Patient File
                    </div>
                    <h2 className="font-display font-bold text-2xl">Patient Dashboard Desk</h2>
                    <p className="text-teal-200 text-xs">
                      Registered name: <b>{userName}</b> ({userEmail})
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentView('hospitals')}
                    className="bg-white hover:bg-teal-50 text-teal-800 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow shadow-teal-950/20 z-10"
                  >
                    <Search className="w-4 h-4" />
                    Secure An emergency Bed Slot
                  </button>
                </div>

                {/* Sub-section: Bed Bookings history */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Calendar className="w-5 h-5 text-teal-500" />
                    <div>
                      <h3 className="font-bold text-base">Current Active & Past Admission Registry</h3>
                      <p className="text-xs text-slate-400">
                        Manage your family&apos;s active bed tickets list.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-150 dark:bg-slate-950 text-slate-400 font-bold">
                          <th className="p-3 rounded-l-lg">Patient Ticket ID</th>
                          <th className="p-3">Hospital Provider</th>
                          <th className="p-3">Bed Classification</th>
                          <th className="p-3">Clinical Priority</th>
                          <th className="p-3">Financial Receipt Amount</th>
                          <th className="p-3">Ticket Status</th>
                          <th className="p-3 rounded-r-lg text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bookings.map((booking) => {
                          const hosp = hospitals.find((h) => h.id === booking.hospital_id);
                          return (
                            <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="p-3 font-bold font-mono text-teal-600">
                                {booking.id}
                              </td>
                              <td className="p-3 font-semibold">
                                {hosp ? hosp.hospital_name : 'Primary Care Hospital'}
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 dark:bg-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {booking.bed_type} Bed
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                    booking.priority === 'Critical'
                                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                      : booking.priority === 'Moderate'
                                      ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                      : 'bg-emerald-100 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {booking.priority}
                                </span>
                              </td>
                              <td className="p-3 font-bold font-mono text-slate-700 dark:text-slate-300">
                                {booking.payment_amount}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                    booking.status === 'Confirmed'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : booking.status === 'Pending'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : booking.status === 'Discharged'
                                      ? 'bg-indigo-500/10 text-indigo-400'
                                      : 'bg-slate-500/10 text-slate-400'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setCurrentView('success_receipt');
                                    }}
                                    className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/45 dark:hover:bg-teal-950/70 text-teal-600 dark:text-teal-300 font-bold px-2.5 py-1 rounded text-[11px] cursor-pointer"
                                  >
                                    Ticket Receipt
                                  </button>
                                  {booking.status === 'Confirmed' && (
                                    <button
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1 rounded text-[11px] cursor-pointer"
                                    >
                                      Cancel Ticket
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* VIEW 6: BOOK BED FORM */}
            {currentView === 'book_bed' && selectedHospital && (
              <div className="max-w-2xl mx-auto py-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-1">
                      <span className="bg-teal-600 text-white font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                        E-Reservation Ledger
                      </span>
                      <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                        Book Bed Form
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentView('hospitals')}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Selected Hospital Teaser row */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-100">
                        {selectedHospital.hospital_name}
                      </p>
                      <p className="text-[10px] text-slate-400">{selectedHospital.address}</p>
                    </div>
                    <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded font-bold">
                      {selectedHospital.city}
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      stepToPayment({
                        patient_name: fd.get('pName'),
                        guardian_name: fd.get('gName'),
                        relationship: fd.get('gRelation'),
                        email: fd.get('gEmail'),
                        phone: fd.get('gPhone'),
                        bed_type: fd.get('bType'),
                        priority: fd.get('bPriority')
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Patient Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Patient Name</label>
                        <input
                          type="text"
                          name="pName"
                          required
                          placeholder="e.g. Suresh Kumar"
                          className="bg-slate-5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>

                      {/* Guardian Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Guardian Name</label>
                        <input
                          type="text"
                          name="gName"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          className="bg-slate-5 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>

                      {/* Guardian Relation */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Guardian Relationship</label>
                        <select
                          name="gRelation"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        >
                          {RELATIONSHIP_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Guardian Mobile Contact</label>
                        <input
                          type="text"
                          name="gPhone"
                          required
                          placeholder="e.g. +91 95555 12345"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-400">Guardian Email Address</label>
                        <input
                          type="email"
                          name="gEmail"
                          required
                          placeholder="guardian@domain.com"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>

                      {/* Bed type selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Bed Category Selection</label>
                        <select
                          name="bType"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        >
                          <option value="ICU">ICU (₹15,000 / day)</option>
                          <option value="Oxygen">Oxygen Support (₹7,500 / day)</option>
                          <option value="Normal">General / Normal Ward (₹3,000 / day)</option>
                        </select>
                      </div>

                      {/* Priority category selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Emergency Priority Status</label>
                        <select
                          name="bPriority"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        >
                          <option value="Critical">Critical (Immediate dispatch)</option>
                          <option value="Moderate">Moderate (Urgent setup)</option>
                          <option value="Normal">Normal (Stabilized standard intake)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md mt-6 cursor-pointer"
                    >
                      Process Payment deposit
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 7: SECURE PAYMENT GATEWAY SIMULATOR */}
            {currentView === 'payment' && selectedHospital && (
              <div className="max-w-md mx-auto py-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="text-center space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                      Instant Operational Escrow
                    </span>
                    <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                      Escrow Deposit Checkout
                    </h2>
                    <p className="text-xs text-slate-400">
                      Amount Calculated:{' '}
                      <span className="font-bold text-teal-600">
                        {tempBookingData.bed_type === 'ICU'
                          ? '₹15,000'
                          : tempBookingData.bed_type === 'Oxygen'
                          ? '₹7,500'
                          : '₹3,000'}
                      </span>
                    </p>
                  </div>

                  {/* Card selector, Net Banking, QR */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-teal-600" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-100">
                          Secure Bed Reservation Fee
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-teal-600">
                        {tempBookingData.bed_type || 'Normal'} Bed
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Option 1: Scan UPI QR Code
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-850 text-center space-y-2">
                        {/* Simulation QR block */}
                        <div className="w-36 h-36 bg-white mx-auto p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                          {/* Simulated QR boxes */}
                          <div className="relative w-full h-full bg-gradient-to-tr from-slate-900 via-teal-900 to-indigo-900 rounded-lg flex items-center justify-center p-2 text-[10px] font-bold text-white uppercase text-center">
                            Scan to Pay
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                          Pay directly with GPay, PhonePe or Paytm
                        </p>
                        <button
                          onClick={() => handleCheckoutPayment('UPI')}
                          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-teal-600/10"
                        >
                          Simulate QR Scan success
                        </button>
                      </div>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-3 text-slate-450 font-bold">Or</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Option 2: Credit / Debit Card Info Layout
                      </p>
                      <div className="space-y-2 text-xs">
                        <input
                          type="text"
                          placeholder="Card Number: 4111 •••• •••• 1234"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-3 py-2 focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleCheckoutPayment('Card')}
                          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Confirm Card Deposit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 8: BOOKING/PAYMENT SUCCESS RECEIPT SLIP */}
            {currentView === 'success_receipt' && selectedBooking && (
              <div className="max-w-xl mx-auto py-6 text-xs">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                  {/* Decorative circle header checkmark */}
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/20 text-xl font-bold">
                      ✓
                    </div>
                    <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                      Reservation Deposit Secure
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Your clinical admission bed category is secured in MedTrack ledger.
                    </p>
                  </div>

                  {/* Ticket Details summary */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-201 dark:border-slate-850 space-y-3 text-[11px] divide-y divide-slate-200/40">
                    <div className="pb-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">
                        Booking Ticket ID
                      </span>
                      <span className="font-mono font-bold text-teal-600 text-xs">
                        {selectedBooking.id}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Patient Name</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedBooking.patient_name}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">
                        Admitted Provider Hospital
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {hospitals.find((h) => h.id === selectedBooking.hospital_id)?.hospital_name ||
                          'Assigned Facility'}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Bed Category</span>
                      <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-black">
                        {selectedBooking.bed_type} Bed Slot
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Priority ranking</span>
                      <span className="bg-rose-500/10 text-rose-600 dark:text-rose-450 px-2 py-0.5 rounded font-black">
                        {selectedBooking.priority} Status
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">
                        Transaction Escrow Deposit
                      </span>
                      <span className="text-emerald-600 font-black text-xs">
                        {selectedBooking.payment_amount} Paid
                      </span>
                    </div>

                    <div className="pt-2.5 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">
                        SECURE TRANSACTION ID
                      </span>
                      <span className="font-mono text-slate-450 dark:text-slate-400">
                        {selectedBooking.transaction_id || 'LOCAL-SIM-GATEWAY'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom voucher actionable guides */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Print Receipt Document
                    </button>
                    <button
                      onClick={() => setCurrentView('patient_dashboard')}
                      className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl text-center cursor-pointer shadow-md shadow-teal-600/10"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 9: CLINICIAN STAFF DASHBOARD */}
            {currentView === 'staff_dashboard' && (
              <section className="space-y-6">
                <div className="bg-gradient-to-r from-teal-900 to-amber-950 text-white rounded-3xl p-6 shadow-md border border-teal-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                      Facility Duty Officer active ID: 102
                    </span>
                    <h2 className="font-display font-black text-2xl">Clinician Desk</h2>
                    <p className="text-slate-300 text-xs">
                      Assigned Base Location:{' '}
                      <b className="text-teal-300">
                        {
                          hospitals.find(
                            (h) => h.id === (staffList.find((s) => s.id === 102)?.assigned_hospital_id || 2)
                          )?.hospital_name
                        }
                      </b>
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800 text-right text-[11px]">
                    <p className="text-slate-400 font-bold">Facility Active Clinicians</p>
                    <p className="font-bold text-teal-300">
                      {staffList.filter((s) => s.assigned_hospital_id === 2 && s.status === 'Active').length}{' '}
                      Duty Doctors
                    </p>
                  </div>
                </div>

                {/* Patient Roster Checklist */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3 border-indigo-50 dark:border-indigo-950">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <h3 className="font-bold text-base">Clinique Admissions & Releases</h3>
                        <p className="text-xs text-slate-400">
                          Active emergency admissions deployed in your department.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950 text-slate-400 font-bold">
                          <th className="p-3 rounded-l-lg">Patient Ticket ID</th>
                          <th className="p-3">Full Patient Name</th>
                          <th className="p-3">Guardian Name / Relationship</th>
                          <th className="p-3">Active Category Assigned</th>
                          <th className="p-3">Emergency Ranking</th>
                          <th className="p-3">Admissions Status</th>
                          <th className="p-3 rounded-r-lg text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bookings
                          .filter((b) => b.hospital_id === 2) // Dr. Rohan is clinical provider to Manipal Hospital (id: 2)
                          .map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <td className="p-3 font-mono font-bold text-teal-600">{booking.id}</td>
                              <td className="p-3 font-bold">{booking.patient_name}</td>
                              <td className="p-3 text-slate-500">
                                {booking.guardian_name} ({booking.relationship})
                              </td>
                              <td className="p-3">
                                <div className="inline-flex items-center gap-1">
                                  <span className="font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                                    {booking.bed_type}
                                  </span>
                                  {booking.status === 'Confirmed' && (
                                    <select
                                      onChange={(e) =>
                                        handleChangeBedType(
                                          booking.id,
                                          e.target.value as 'ICU' | 'Oxygen' | 'Normal'
                                        )
                                      }
                                      defaultValue={booking.bed_type}
                                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[10px] px-1 focus:outline-none"
                                    >
                                      <option value="ICU">Transfer to ICU</option>
                                      <option value="Oxygen">Transfer to O2</option>
                                      <option value="Normal">Transfer to Gen</option>
                                    </select>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                    booking.priority === 'Critical'
                                      ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                      : booking.priority === 'Moderate'
                                      ? 'bg-amber-100 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400'
                                      : 'bg-emerald-100 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {booking.priority}
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                    booking.status === 'Confirmed'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : booking.status === 'Pending'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : booking.status === 'Discharged'
                                      ? 'bg-indigo-500/10 text-indigo-400'
                                      : 'bg-slate-500/10 text-slate-400'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {booking.status === 'Confirmed' ? (
                                  <button
                                    onClick={() => handleDischargePatient(booking.id)}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Execute Discharge
                                  </button>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">--</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Elegant visual mock footer */}
      <footer
        className={`w-full py-8 text-center border-t mt-12 ${
          theme === 'slate-dark'
            ? 'bg-slate-950/70 border-slate-900 text-slate-500'
            : 'bg-white border-slate-200 text-slate-400'
        } text-xs`}
      >
        <div className="max-width max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-teal-600 font-display">
            MedTrack - High Fidelity Smart Logistics Portal Mockup
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            All data simulations run locally inside React memory without external API constraints. State,
            clinique assignments, and checkout logic are persistent during sandbox interaction runtime.
          </p>
          <p className="pt-2 text-[10px] font-mono">
            Created in compliance with design guidelines (Inter Typeface & Lucide Icons).
          </p>
        </div>
      </footer>
    </div>
  );
}
