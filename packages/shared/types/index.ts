export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "employee" | "patient";
  createdAt: string;
}

export interface AppointmentParty {
  id: string;
  name: string;
  phone: string;
}

export interface AppointmentPayment {
  orderId: string;
  totalAmount: number;
  paymentStatus: string;
  paymentType: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  paymentMethod?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  employeeId: string;
  adminId: string;
  testTypes: string[];
  address: string;
  slot: string;
  status:
    | "pending"
    | "assigned"
    | "accepted"
    | "en_route"
    | "collected"
    | "processing"
    | "completed";
  notes: string;
  createdAt: string;
  updatedAt: string;
  patient?: AppointmentParty;
  employee?: AppointmentParty | null;
  admin?: AppointmentParty | null;
  report?: TestResult | null;
  payment?: AppointmentPayment | null;
}

export interface TestResult {
  id: string;
  appointmentId: string;
  reportUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Employee {
  id: string;
  userId: string;
  zone: string;
  isAvailable: boolean;
  currentLocation: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Test {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  category: string;
  sampleType: string;
  preparationInstructions: string;
  parameters: string[];
  turnaroundHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  tests?: Test[];
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  testId: string | null;
  packageId: string | null;
  test?: Test | null;
  package?: Package | null;
}

export interface Cart {
  id: string;
  patientId: string;
  items: CartItem[];
  createdAt: string;
}

export interface Order {
  id: string;
  patientId: string;
  items: any;
  totalAmount: number;
  paymentId: string | null;
  paymentStatus: string;
  appointmentId: string | null;
  createdAt: string;
  appointment?: Appointment | null;
  patient?: User | null;
}
