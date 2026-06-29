import AdminProfile from "./AdminProfile.js";
import Appointment from "./Appointment.js";
import AppointmentSlot from "./AppointmentSlot.js";
import ClinicRoom from "./ClinicRoom.js";
import ClinicSetting from "./ClinicSetting.js";
import ClinicWorkingHour from "./ClinicWorkingHour.js";
import ConsultationRequest from "./ConsultationRequest.js";
import DentalService from "./DentalService.js";
import Dentist from "./Dentist.js";
import DentistService from "./DentistService.js";
import Invoice from "./Invoice.js";
import Notification from "./Notification.js";
import Nurse from "./Nurse.js";
import Patient from "./Patient.js";
import Payment from "./Payment.js";
import Receptionist from "./Receptionist.js";
import Review from "./Review.js";
import Role from "./Role.js";
import RoomStatus from "./RoomStatus.js";
import StaffSchedule from "./StaffSchedule.js";
import TimeSlot from "./TimeSlot.js";
import TreatmentRecord from "./TreatmentRecord.js";
import User from "./User.js";

export {
  AdminProfile,
  Appointment,
  AppointmentSlot,
  ClinicRoom,
  ClinicSetting,
  ClinicWorkingHour,
  ConsultationRequest,
  DentalService,
  Dentist,
  DentistService,
  Invoice,
  Notification,
  Nurse,
  Patient,
  Payment,
  Receptionist,
  Review,
  Role,
  RoomStatus,
  StaffSchedule,
  TimeSlot,
  TreatmentRecord,
  User
};

export const COLLECTIONS = Object.freeze({
  adminProfiles: "adminprofiles",
  appointments: "appointments",
  appointmentSlots: "appointmentslots",
  clinicSettings: "clinicsettings",
  clinicRooms: "clinicrooms",
  clinicWorkingHours: "clinicworkinghours",
  consultationRequests: "consultationrequests",
  dentalServices: "dentalservices",
  dentists: "dentists",
  dentistServices: "dentistservices",
  invoices: "invoices",
  notifications: "notifications",
  nurses: "nurses",
  patients: "patients",
  payments: "payments",
  receptionists: "receptionists",
  reviews: "reviews",
  roles: "roles",
  roomStatuses: "roomstatuses",
  staffSchedules: "staffschedules",
  timeSlots: "timeslots",
  treatmentRecords: "treatmentrecords",
  users: "users"
});

export const MODELS = Object.freeze({
  [COLLECTIONS.adminProfiles]: AdminProfile,
  [COLLECTIONS.appointments]: Appointment,
  [COLLECTIONS.appointmentSlots]: AppointmentSlot,
  [COLLECTIONS.clinicSettings]: ClinicSetting,
  [COLLECTIONS.clinicRooms]: ClinicRoom,
  [COLLECTIONS.clinicWorkingHours]: ClinicWorkingHour,
  [COLLECTIONS.consultationRequests]: ConsultationRequest,
  [COLLECTIONS.dentalServices]: DentalService,
  [COLLECTIONS.dentists]: Dentist,
  [COLLECTIONS.dentistServices]: DentistService,
  [COLLECTIONS.invoices]: Invoice,
  [COLLECTIONS.notifications]: Notification,
  [COLLECTIONS.nurses]: Nurse,
  [COLLECTIONS.patients]: Patient,
  [COLLECTIONS.payments]: Payment,
  [COLLECTIONS.receptionists]: Receptionist,
  [COLLECTIONS.reviews]: Review,
  [COLLECTIONS.roles]: Role,
  [COLLECTIONS.roomStatuses]: RoomStatus,
  [COLLECTIONS.staffSchedules]: StaffSchedule,
  [COLLECTIONS.timeSlots]: TimeSlot,
  [COLLECTIONS.treatmentRecords]: TreatmentRecord,
  [COLLECTIONS.users]: User
});

export const COLLECTION_INDEXES = Object.freeze({
  [COLLECTIONS.users]: [
    { key: { email: 1 }, options: { unique: true, sparse: true } },
    { key: { phone: 1 }, options: { unique: true } },
    { key: { role: 1, status: 1 } }
  ],
  [COLLECTIONS.roles]: [{ key: { roleName: 1 }, options: { unique: true } }],
  [COLLECTIONS.clinicSettings]: [{ key: { key: 1 }, options: { unique: true } }],
  [COLLECTIONS.adminProfiles]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.patients]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.receptionists]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.dentists]: [
    { key: { user: 1 }, options: { unique: true } },
    { key: { status: 1 } }
  ],
  [COLLECTIONS.nurses]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.dentistServices]: [{ key: { dentist: 1, service: 1 }, options: { unique: true } }],
  [COLLECTIONS.clinicRooms]: [
    { key: { name: 1 }, options: { unique: true } },
    {
      key: { assignedDentist: 1 },
      options: { unique: true, partialFilterExpression: { assignedDentist: { $type: "objectId" } } }
    },
    {
      key: { assignedNurse: 1 },
      options: { unique: true, partialFilterExpression: { assignedNurse: { $type: "objectId" } } }
    }
  ],
  [COLLECTIONS.clinicWorkingHours]: [
    { key: { dayOfWeek: 1, shiftName: 1 }, options: { unique: true } }
  ],
  [COLLECTIONS.timeSlots]: [
    { key: { slotName: 1, startTime: 1, endTime: 1 }, options: { unique: true } }
  ],
  [COLLECTIONS.staffSchedules]: [
    { key: { user: 1, workDate: 1, timeSlot: 1 }, options: { unique: true } },
    { key: { user: 1, workDate: 1, startTime: 1, endTime: 1 } },
    { key: { room: 1, workDate: 1, startTime: 1, endTime: 1 } }
  ],
  [COLLECTIONS.appointmentSlots]: [
    { key: { dentist: 1, startAt: 1 } },
    { key: { room: 1, startAt: 1 } },
    { key: { status: 1, slotDate: 1 } }
  ],
  [COLLECTIONS.appointments]: [
    { key: { room: 1, startAt: 1, endAt: 1 } },
    { key: { patient: 1, startAt: -1 } },
    { key: { patient: 1, status: 1, startAt: 1, endAt: 1 } },
    { key: { dentist: 1, startAt: -1 } },
    { key: { status: 1, startAt: 1 } }
  ],
  [COLLECTIONS.invoices]: [{ key: { patient: 1, createdAt: -1 } }],
  [COLLECTIONS.notifications]: [{ key: { user: 1, isRead: 1, createdAt: -1 } }],
  [COLLECTIONS.payments]: [{ key: { invoice: 1, paymentDate: -1 } }],
  [COLLECTIONS.reviews]: [{ key: { dentist: 1, createdAt: -1 } }],
  [COLLECTIONS.roomStatuses]: [{ key: { room: 1, updatedAt: -1 } }],
  [COLLECTIONS.treatmentRecords]: [{ key: { appointment: 1 }, options: { unique: true } }]
});

export const RELATION_COLLECTIONS = Object.freeze({
  appointment: COLLECTIONS.appointments,
  appointmentSlot: COLLECTIONS.appointmentSlots,
  assignedDentist: COLLECTIONS.users,
  assignedNurse: COLLECTIONS.users,
  cancelledBy: COLLECTIONS.users,
  confirmationBy: COLLECTIONS.users,
  createdBy: COLLECTIONS.users,
  dentist: COLLECTIONS.users,
  handledBy: COLLECTIONS.users,
  invoice: COLLECTIONS.invoices,
  nurse: COLLECTIONS.users,
  patient: COLLECTIONS.users,
  receptionist: COLLECTIONS.users,
  roleRef: COLLECTIONS.roles,
  room: COLLECTIONS.clinicRooms,
  service: COLLECTIONS.dentalServices,
  timeSlot: COLLECTIONS.timeSlots,
  user: COLLECTIONS.users,
  workingHour: COLLECTIONS.clinicWorkingHours
});
