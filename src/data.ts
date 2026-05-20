import { Hospital, Booking, Staff } from './types';

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 1,
    hospital_name: 'Fortis Hospital & Cardiac Centre',
    city: 'Bangalore',
    address: 'Bannerghatta Road, Opposite IIMB, Bangalore - 560076',
    icu_beds: 12,
    total_icu: 20,
    oxygen_beds: 24,
    total_oxygen: 40,
    normal_beds: 18,
    total_normal: 50
  },
  {
    id: 2,
    hospital_name: 'Manipal Hospital (Super Specialty)',
    city: 'Bangalore',
    address: 'HAL Old Airport Road, Kodihalli, Bangalore - 560017',
    icu_beds: 8,
    total_icu: 15,
    oxygen_beds: 32,
    total_oxygen: 50,
    normal_beds: 45,
    total_normal: 80
  },
  {
    id: 3,
    hospital_name: 'Apollo Hospitals Jayanagar',
    city: 'Bangalore',
    address: '21st Main Rd, 2nd Phase, J. P. Nagar, Bangalore - 560078',
    icu_beds: 4,
    total_icu: 10,
    oxygen_beds: 15,
    total_oxygen: 30,
    normal_beds: 22,
    total_normal: 40
  },
  {
    id: 4,
    hospital_name: 'Narayana Health City',
    city: 'Bangalore',
    address: 'Hosur Road, Bommasandra Industrial Area, Bangalore - 560099',
    icu_beds: 25,
    total_icu: 40,
    oxygen_beds: 61,
    total_oxygen: 100,
    normal_beds: 88,
    total_normal: 150
  },
  {
    id: 5,
    hospital_name: 'Aster CMI Hospital',
    city: 'Bangalore',
    address: 'Bellary Rd, Sahakar Nagar, Hebbal, Bangalore - 560092',
    icu_beds: 14,
    total_icu: 25,
    oxygen_beds: 28,
    total_oxygen: 45,
    normal_beds: 35,
    total_normal: 60
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 101,
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@medtrack.org',
    phone: '+91 98765 43210',
    assigned_hospital_id: 3,
    status: 'Active'
  },
  {
    id: 102,
    name: 'Dr. Rohan Das',
    email: 'rohan.das@medtrack.org',
    phone: '+91 98765 43211',
    assigned_hospital_id: 2,
    status: 'Active'
  },
  {
    id: 103,
    name: 'Nurse Priya Patel',
    email: 'priya.patel@medtrack.org',
    phone: '+91 98765 43212',
    assigned_hospital_id: null,
    status: 'Pending'
  },
  {
    id: 104,
    name: 'Nurse Amit Verma',
    email: 'amit.verma@medtrack.org',
    phone: '+91 98765 43213',
    assigned_hospital_id: null,
    status: 'Pending'
  },
  {
    id: 105,
    name: 'Dr. Cynthia Alva',
    email: 'cynthia.alva@medtrack.org',
    phone: '+91 98765 11122',
    assigned_hospital_id: 1,
    status: 'Active'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-5920',
    patient_name: 'Suresh Kumar',
    guardian_name: 'Ramesh Kumar',
    relationship: 'Brother',
    email: 'ramesh.k@gmail.com',
    phone: '+91 95555 12345',
    hospital_id: 1,
    bed_type: 'ICU',
    priority: 'Critical',
    status: 'Confirmed',
    payment_amount: '₹15,000',
    payment_method: 'Card',
    transaction_id: 'TXN-90204122',
    createdAt: '2026-05-18T10:30:00Z'
  },
  {
    id: 'BK-1811',
    patient_name: 'Meena Murthy',
    guardian_name: 'Kushal Murthy',
    relationship: 'Son',
    email: 'kushal.m@gmail.com',
    phone: '+91 94444 87654',
    hospital_id: 2,
    bed_type: 'Oxygen',
    priority: 'Moderate',
    status: 'Pending',
    payment_amount: '₹7,500',
    payment_method: 'UPI',
    transaction_id: 'TXN-5529104',
    createdAt: '2026-05-19T14:20:00Z'
  },
  {
    id: 'BK-3392',
    patient_name: 'Devanand Rao',
    guardian_name: 'Surekha Rao',
    relationship: 'Wife',
    email: 'surekha@gmail.com',
    phone: '+91 92222 45454',
    hospital_id: 4,
    bed_type: 'Normal',
    priority: 'Normal',
    status: 'Discharged',
    payment_amount: '₹3,000',
    payment_method: 'NetBanking',
    transaction_id: 'TXN-3122144',
    createdAt: '2026-05-15T08:15:00Z'
  }
];

export const RELATIONSHIP_OPTIONS = [
  'Father', 'Mother', 'Brother', 'Sister', 'Husband', 'Wife', 'Son', 'Daughter', 'Friend', 'Other'
];
