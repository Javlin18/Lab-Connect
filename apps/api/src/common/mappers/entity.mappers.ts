import type {
  Appointment as SharedAppointment,
  AppointmentParty,
  Employee as SharedEmployee,
  Notification as SharedNotification,
  TestResult as SharedTestResult,
  User as SharedUser
} from "@lab-app/shared";

function asIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toAppointmentParty(user: {
  id: string;
  name: string;
  phone: string;
}): AppointmentParty {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone
  };
}

export function toSharedUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "employee" | "patient";
  createdAt: Date | string;
}): SharedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: asIso(user.createdAt)
  };
}

export function toSharedAppointment(appointment: {
  id: string;
  patientId: string;
  employeeId: string | null;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  employee?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  admin?: {
    id: string;
    name: string;
    phone: string;
  };
  testResult?: {
    id: string;
    appointmentId: string;
    reportUrl: string;
    uploadedAt: Date | string;
    uploadedBy: string;
  } | null;
}): SharedAppointment {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    employeeId: appointment.employeeId ?? "",
    adminId: appointment.adminId,
    testTypes: appointment.testTypes,
    address: appointment.address,
    slot: appointment.slot,
    status: appointment.status,
    notes: appointment.notes,
    createdAt: asIso(appointment.createdAt),
    updatedAt: asIso(appointment.updatedAt),
    patient: appointment.patient ? toAppointmentParty(appointment.patient) : undefined,
    employee: appointment.employee ? toAppointmentParty(appointment.employee) : null,
    admin: appointment.admin ? toAppointmentParty(appointment.admin) : undefined,
    report: appointment.testResult ? toSharedTestResult(appointment.testResult) : null
  };
}

export function toSharedTestResult(result: {
  id: string;
  appointmentId: string;
  reportUrl: string;
  uploadedAt: Date | string;
  uploadedBy: string;
}): SharedTestResult {
  return {
    id: result.id,
    appointmentId: result.appointmentId,
    reportUrl: result.reportUrl,
    uploadedAt: asIso(result.uploadedAt),
    uploadedBy: result.uploadedBy
  };
}

export function toSharedEmployee(employee: {
  id: string;
  userId: string;
  zone: string;
  isAvailable: boolean;
  currentLocation: string;
}): SharedEmployee {
  return {
    id: employee.id,
    userId: employee.userId,
    zone: employee.zone,
    isAvailable: employee.isAvailable,
    currentLocation: employee.currentLocation
  };
}

export function toSharedNotification(notification: {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
}): SharedNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    read: notification.read,
    createdAt: asIso(notification.createdAt)
  };
}
