export interface Hospital {
  id: number;
  hospital_name: string;
  city: string;
  address: string;
  icu_beds: number;
  total_icu: number;
  oxygen_beds: number;
  total_oxygen: number;
  normal_beds: number;
  total_normal: number;
}

export interface Booking {
  id: string;
  patient_name: string;
  guardian_name: string;
  relationship: string;
  email: string;
  phone: string;
  hospital_id: number;
  bed_type: 'ICU' | 'Oxygen' | 'Normal';
  priority: 'Critical' | 'Moderate' | 'Normal';
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Discharged';
  payment_amount: string;
  payment_method?: string;
  transaction_id?: string;
  createdAt: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  assigned_hospital_id: number | null;
  status: 'Active' | 'Pending';
}

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'logout'
  | 'admin_dashboard'
  | 'staff_dashboard'
  | 'patient_dashboard'
  | 'hospitals'
  | 'book_bed'
  | 'payment'
  | 'success_receipt'
  | 'view_bookings';

export type UserRole = 'patient' | 'staff' | 'admin';

export type AppTheme = 'teal-light' | 'slate-dark';
