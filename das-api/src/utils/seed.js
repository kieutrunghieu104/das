import {
  closeMongoDB,
  connectMongoDB,
  getCollection
} from "../config/mongodb.js";
import { COLLECTIONS } from "../models/index.js";
import { insertDocuments } from "../repository/mongoRepository.js";
import { hashPassword } from "./password.js";
import { combineDateAndTime, isWorkingDate, toDateInputValue } from "./time.js";

function nextWorkingDates(count, offsetDays = 1) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  while (dates.length < count) {
    const dateText = toDateInputValue(date);
    if (isWorkingDate(dateText)) dates.push(dateText);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

function previousWorkingDates(count) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() - 1);

  while (dates.length < count) {
    const dateText = toDateInputValue(date);
    if (isWorkingDate(dateText)) dates.push(dateText);
    date.setDate(date.getDate() - 1);
  }
  return dates;
}

async function clearDatabase() {
  await Promise.all(
    Object.values(COLLECTIONS).map((collectionName) =>
      getCollection(collectionName).deleteMany({})
    )
  );
}

const ROLE_NAMES = ["admin", "receptionist", "dentist", "nurse", "patient"];

const DEFAULT_APPOINTMENT_SLOTS = [
  { slotName: "Slot 1", startTime: "08:00", endTime: "10:30", order: 1 },
  { slotName: "Slot 2", startTime: "10:30", endTime: "12:00", order: 2 },
  { slotName: "Slot 3", startTime: "14:00", endTime: "16:00", order: 3 },
  { slotName: "Slot 4", startTime: "16:00", endTime: "17:30", order: 4 }
];

async function createRoles() {
  const createdRoles = await insertDocuments(COLLECTIONS.roles, ROLE_NAMES.map((roleName) => ({ roleName })));
  return Object.fromEntries(createdRoles.map((role) => [role.roleName, role]));
}

function createAppointmentSlots() {
  return insertDocuments(COLLECTIONS.appointmentSlots, DEFAULT_APPOINTMENT_SLOTS);
}

async function createClinicSettings() {
  await insertDocuments(COLLECTIONS.clinicSettings, {
    key: "public",
    clinicName: "SmileCare",
    hotline: "1900 8888",
    address: "150 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh",
    faqs: [
      {
        question: "Tôi có thể thay đổi lịch hẹn sau khi đặt không?",
        answer: "Bạn có thể thay đổi bác sĩ, ngày hoặc khung giờ khám. Lịch thay đổi sẽ được gửi lại cho lễ tân xác nhận."
      },
      {
        question: "Nếu tôi không chọn bác sĩ thì sao?",
        answer: "Lễ tân sẽ sắp xếp bác sĩ và gửi thời gian khám đã xác nhận cho bạn."
      },
      {
        question: "Tôi cần làm gì khi quên mật khẩu?",
        answer: "Vui lòng sử dụng mục Quên mật khẩu để xem số điện thoại lễ tân và liên hệ hỗ trợ."
      }
    ]
  });
}

const dentistProfiles = [
  {
    fullName: "BS. Nguyễn Minh Anh",
    email: "dentist1@das.local",
    phone: "0902000001",
    yearsOfExperience: 9,
    bio: "Có kinh nghiệm thăm khám, tư vấn kế hoạch điều trị và theo dõi tiến trình chăm sóc răng miệng cho bệnh nhân.",
    avatarUrl: "/assets/doctors/doctor-minh-anh.png"
  },
  {
    fullName: "BS. Trần Hoàng Nam",
    email: "dentist2@das.local",
    phone: "0902000002",
    yearsOfExperience: 12,
    bio: "Phụ trách thăm khám, tư vấn phương án điều trị phù hợp và phối hợp cùng đội ngũ lâm sàng trong từng ca khám.",
    avatarUrl: "/assets/doctors/doctor-hoang-nam.png"
  },
  {
    fullName: "BS. Lê Thanh Vy",
    email: "dentist3@das.local",
    phone: "0902000003",
    yearsOfExperience: 7,
    bio: "Tập trung vào trải nghiệm thăm khám nhẹ nhàng, giải thích rõ kế hoạch điều trị và hướng dẫn chăm sóc sau khám.",
    avatarUrl: "/assets/doctors/doctor-thanh-vy.png"
  }
];

async function seedUsers(roles, passwordHash) {
  const admin = await insertDocuments(COLLECTIONS.users, {
    fullName: "Quản trị SmileCare",
    email: "admin@das.local",
    phone: "0900000000",
    roleRef: roles.admin._id,
    status: "active",
    passwordHash
  });
  await insertDocuments(COLLECTIONS.adminProfiles, {
    user: admin._id,
    position: "Quản trị hệ thống phòng khám",
    permissionLevel: "super_admin",
    address: "150 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh"
  });

  const receptionists = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 2 }, (_, index) => ({
      fullName: `Lễ tân ${index + 1}`,
      email: `receptionist${index + 1}@das.local`,
      phone: `090100000${index + 1}`,
      roleRef: roles.receptionist._id,
      status: "active",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.receptionists,
    receptionists.map((user, index) => ({
      user: user._id,
      address: `Quầy lễ tân ${index + 1}, SmileCare Quận 1`
    }))
  );

  const dentists = await insertDocuments(
    COLLECTIONS.users,
    dentistProfiles.map((dentist) => ({
      fullName: dentist.fullName,
      email: dentist.email,
      phone: dentist.phone,
      roleRef: roles.dentist._id,
      status: "active",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.dentists,
    dentists.map((user, index) => ({
      user: user._id,
      qualification: "Bác sĩ Răng Hàm Mặt",
      experienceYears: dentistProfiles[index].yearsOfExperience,
      description: dentistProfiles[index].bio,
      address: "SmileCare Quận 1",
      avatarUrl: dentistProfiles[index].avatarUrl
    }))
  );

  const nurses = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 3 }, (_, index) => ({
      fullName: `Y tá ${index + 1}`,
      email: `nurse${index + 1}@das.local`,
      phone: `090300000${index + 1}`,
      roleRef: roles.nurse._id,
      status: "active",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.nurses,
    nurses.map((user) => ({
      user: user._id,
      qualification: "Y tá đã đăng ký",
      address: "SmileCare Quận 1"
    }))
  );

  const patientSamples = [
    { fullName: "Nguyễn Văn An", phone: "0911000001", gender: "male", address: "Quận 1", medicalNote: "Chưa ghi nhận dị ứng." },
    { fullName: "Trần Thị Bình", phone: "0911000002", gender: "female", address: "Quận 3", medicalNote: "Ưu tiên lịch buổi chiều." },
    { fullName: "Lê Minh Châu", phone: "0911000003", gender: "female", address: "Quận Bình Thạnh", medicalNote: "Dị ứng Penicillin." },
    { fullName: "Phạm Quốc Dũng", phone: "0911000004", gender: "male", address: "Thành phố Thủ Đức", medicalNote: "Có tiền sử cao huyết áp." },
    { fullName: "Hoàng Gia Hân", phone: "0911000005", gender: "female", address: "Quận 7", medicalNote: "Chưa ghi nhận bệnh nền." }
  ];
  const patients = await insertDocuments(
    COLLECTIONS.users,
    patientSamples.map((patient, index) => ({
      fullName: patient.fullName,
      email: `patient${index + 1}@das.local`,
      phone: patient.phone,
      roleRef: roles.patient._id,
      status: "active",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.patients,
    patients.map((user, index) => ({
      user: user._id,
      gender: patientSamples[index].gender,
      address: patientSamples[index].address,
      medicalNote: patientSamples[index].medicalNote
    }))
  );

  return { admin, receptionists, dentists, nurses, patients };
}

async function seedClinic(dentists, nurses) {
  const services = await insertDocuments(COLLECTIONS.dentalServices, [
    {
      name: "Trám răng",
      description: "Phục hồi vùng răng tổn thương và hướng dẫn chăm sóc sau điều trị.",
      price: "300000"
    },
    {
      name: "Nhổ răng khôn",
      description: "Thăm khám, chẩn đoán và thực hiện nhổ răng theo chỉ định của bác sĩ.",
      price: "1500000"
    },
    {
      name: "Tư vấn nha khoa",
      description: "Tư vấn cho bệnh nhân chưa xác định rõ tình trạng răng miệng.",
      price: "500000"
    },
    {
      name: "Niềng răng",
      description: "Chỉnh nha bằng mắc cài kim loại hoặc sứ.",
      price: "30000000-90000000"
    },
    {
      name: "Cạo vôi răng",
      description: "Làm sạch mảng bám, vôi răng và hướng dẫn vệ sinh răng miệng.",
      price: "500000"
    },
    {
      name: "Tẩy trắng răng",
      description: "Cải thiện màu răng theo tình trạng thực tế và chỉ định chuyên môn.",
      price: "2500000"
    }
  ]);

  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Trám răng", "Trám răng"] } },
    { $set: { name: "Trám răng", price: "800000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Nhổ răng khôn", "Nhổ răng khôn"] } },
    { $set: { name: "Nhổ răng", price: "1500000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Tư vấn nha khoa", "Tư vấn nha khoa"] } },
    { $set: { name: "Tư vấn niềng răng", price: "500000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Cạo vôi răng", "Cạo vôi răng"] } },
    { $set: { name: "Cạo vôi răng", price: "500000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Tẩy trắng răng", "Tẩy trắng răng"] } },
    { $set: { name: "Tẩy trắng răng", price: "2500000" } }
  );
  services.forEach((service) => {
    if (["Trám răng", "Trám răng"].includes(service.name)) Object.assign(service, { name: "Trám răng", price: "800000" });
    if (["Nhổ răng khôn", "Nhổ răng khôn"].includes(service.name)) Object.assign(service, { name: "Nhổ răng", price: "1500000" });
    if (["Tư vấn nha khoa", "Tư vấn nha khoa"].includes(service.name)) Object.assign(service, { name: "Tư vấn niềng răng", price: "500000" });
    if (["Cạo vôi răng", "Cạo vôi răng"].includes(service.name)) Object.assign(service, { name: "Cạo vôi răng", price: "500000" });
    if (["Tẩy trắng răng", "Tẩy trắng răng"].includes(service.name)) Object.assign(service, { name: "Tẩy trắng răng", price: "2500000" });
  });
  services.push(
    ...(await insertDocuments(COLLECTIONS.dentalServices, [
      {
        name: "Khám nha khoa",
        description: "Thăm khám tổng quát và tư vấn tình trạng răng miệng.",
        price: "100000",
      },
      {
        name: "Điều trị tủy",
        description: "Điều trị tủy răng theo chẩn đoán chuyên môn.",
        price: "3000000",
      },
      {
        name: "Bọc răng sứ",
        description: "Phục hình răng sứ theo kế hoạch điều trị của bác sĩ.",
        price: "5000000",
      }
    ]))
  );

  const rooms = await insertDocuments(
    COLLECTIONS.clinicRooms,
    dentists.map((dentist, index) => ({
      name: `Phòng khám ${index + 1}`,
      assignedDentist: dentist._id,
      assignedNurse: nurses[index]?._id,
      status: "available"
    }))
  );

  const workingDates = nextWorkingDates(12, 0);

  return { services, rooms, workingDates };
}

async function createSampleAppointment({
  patient,
  requester,
  receptionist,
  room,
  service,
  slots,
  date,
  time,
  status,
  note,
  channel = "online",
  dentistPreference = "selected"
}) {
  const selectedSlot =
    slots.find((slot) => slot.startTime === time) ||
    slots.find((slot) => time >= slot.startTime && time < slot.endTime) ||
    slots[0];
  const startAt = combineDateAndTime(date, selectedSlot.startTime);

  return insertDocuments(COLLECTIONS.appointments, {
    patient: patient._id,
    createdBy: requester._id,
    receptionist: receptionist?._id,
    dentist: room?.assignedDentist,
    nurse: room?.assignedNurse,
    room: room?._id,
    service: service._id,
    slot: selectedSlot._id,
    channel,
    dentistPreference,
    startAt,
    checkedInAt: ["checked_in", "in_treatment", "completed"].includes(status) ? startAt : undefined,
    status,
    paymentStatus: status === "completed" ? "unpaid" : "not_required",
    patientNote: note,
    receptionistNote: status === "confirmed" ? "Lễ tân đã xác nhận lịch hẹn." : undefined
  });
}

function priceToNumber(value) {
  const normalized = String(value ?? "0").replace(/[^\d-]/g, "");
  const firstValue = normalized.split("-").find(Boolean);
  return Number(firstValue || 0);
}

async function seedInvoice(appointment, patient, service, paidAmount) {
  const total = priceToNumber(service.price);
  const normalizedPaidAmount = Math.min(priceToNumber(paidAmount), total);
  const status = normalizedPaidAmount >= total ? "paid" : normalizedPaidAmount > 0 ? "partial" : "unpaid";
  const paymentPlan = status === "partial" ? "monthly" : "one_time";
  const installmentMonths = paymentPlan === "monthly" ? 3 : 1;
  const installmentAmount = Math.ceil(total / installmentMonths);
  const invoice = await insertDocuments(COLLECTIONS.invoices, {
    appointment: appointment._id,
    patient: patient._id,
    items: [{ name: service.name, amount: total }],
    total,
    paidAmount: normalizedPaidAmount,
    paymentPlan,
    installmentMonths,
    installmentAmount,
    invoiceDate: new Date(),
    paidAt: status === "paid" ? appointment.startAt : undefined,
    status
  });

  if (normalizedPaidAmount > 0) {
    await insertDocuments(COLLECTIONS.payments, {
      invoice: invoice._id,
      paymentMethod: "cash",
      installmentNumber: 1,
      amount: normalizedPaidAmount,
      paymentDate: appointment.startAt
    });
  }
  return invoice;
}

async function seedOperationalData(users, clinic) {
  const { receptionists, patients } = users;
  const { services, rooms, slots, workingDates } = clinic;
  const pastDates = previousWorkingDates(4);
  const createAppointment = (data) => createSampleAppointment({ ...data, slots });

  const pendingRandom = await createAppointment({
    patient: patients[0],
    requester: patients[0],
    service: services[0],
    date: workingDates[0],
    time: "08:00",
    status: "pending",
    note: "Đau nhẹ răng hàm, chưa chọn bác sĩ.",
    dentistPreference: "random"
  });
  const pendingSelected = await createAppointment({
    patient: patients[2],
    requester: patients[2],
    room: rooms[1],
    service: services[1],
    date: workingDates[1],
    time: "10:00",
    status: "pending",
    note: "Muốn bác sĩ kiểm tra răng khôn.",
    dentistPreference: "selected"
  });
  const confirmed = await createAppointment({
    patient: patients[3],
    requester: patients[3],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[3],
    date: workingDates[0],
    time: "16:00",
    status: "confirmed",
    note: "Lịch đã được lễ tân xác nhận."
  });
  const confirmedForPatient = await createAppointment({
    patient: patients[0],
    requester: patients[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[3],
    date: workingDates[2],
    time: "10:00",
    status: "confirmed",
    note: "Tái khám và vệ sinh răng."
  });
  const checkedIn = await createAppointment({
    patient: patients[1],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[4],
    date: workingDates[0],
    time: "10:00",
    status: "checked_in",
    note: "Bệnh nhân đã có mặt tại phòng khám.",
    channel: "offline"
  });
  const inTreatment = await createAppointment({
    patient: patients[2],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[2],
    service: services[0],
    date: workingDates[0],
    time: "14:00",
    status: "in_treatment",
    note: "Đang thực hiện điều trị.",
    channel: "offline"
  });
  const rejected = await createAppointment({
    patient: patients[0],
    requester: patients[0],
    service: services[1],
    date: workingDates[3],
    time: "14:00",
    status: "rejected",
    note: "Lịch mẫu đã bị từ chối để kiểm tra trạng thái.",
    dentistPreference: "random"
  });
  const completedOne = await createAppointment({
    patient: patients[0],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[3],
    date: pastDates[0],
    time: "08:00",
    status: "completed",
    note: "Đã hoàn tất cạo vôi răng.",
    channel: "offline"
  });
  const completedTwo = await createAppointment({
    patient: patients[1],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[0],
    date: pastDates[1],
    time: "10:00",
    status: "completed",
    note: "Đã hoàn tất trám răng.",
    channel: "offline"
  });
  const completedThree = await createAppointment({
    patient: patients[2],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[2],
    service: services[4],
    date: pastDates[2],
    time: "14:00",
    status: "completed",
    note: "Đã hoàn tất tẩy trắng răng.",
    channel: "offline"
  });
  await createAppointment({
    patient: patients[4],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[2],
    date: pastDates[3],
    time: "16:00",
    status: "no_show",
    note: "Dữ liệu mẫu bệnh nhân vắng mặt.",
    channel: "offline"
  });

  await seedInvoice(completedOne, patients[0], services[3], 0);
  await seedInvoice(completedTwo, patients[1], services[0], 150000);
  await seedInvoice(completedThree, patients[2], services[4], services[4].price);

  await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: completedOne._id,
    patient: patients[0]._id,
    dentist: rooms[0].assignedDentist,
    nurse: rooms[0].assignedNurse,
    treatmentDate: toDateInputValue(completedOne.startAt),
    visits: [{
      visitNumber: 1,
      visitDate: toDateInputValue(completedOne.startAt),
      diagnosis: "Vôi răng mức độ trung bình.",
      treatmentResult: "Đã làm sạch vôi răng và đánh bóng.",
      treatmentNote: "Hướng dẫn dùng chỉ nha khoa hằng ngày.",
      updatedAt: completedOne.startAt
    }],
    status: "completed"
  });
  await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: completedTwo._id,
    patient: patients[1]._id,
    dentist: rooms[1].assignedDentist,
    nurse: rooms[1].assignedNurse,
    treatmentDate: toDateInputValue(completedTwo.startAt),
    visits: [{
      visitNumber: 1,
      visitDate: toDateInputValue(completedTwo.startAt),
      diagnosis: "Sâu răng hàm dưới.",
      treatmentResult: "Đã làm sạch và trám phục hồi.",
      treatmentNote: "Theo dõi ê buốt trong 48 giờ.",
      updatedAt: completedTwo.startAt
    }],
    status: "completed"
  });
  await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: inTreatment._id,
    patient: patients[2]._id,
    dentist: rooms[2].assignedDentist,
    nurse: rooms[2].assignedNurse,
    treatmentDate: toDateInputValue(inTreatment.startAt),
    visits: [{
      visitNumber: 1,
      visitDate: toDateInputValue(inTreatment.startAt),
      vitalSigns: {
        bloodPressure: "118/76",
        heartRate: "78",
        spo2: "99",
        temperature: "36.7",
        respiratoryRate: "18"
      },
      diagnosis: "Sâu răng cần phục hồi.",
      treatmentResult: "Đang điều trị.",
      updatedAt: inTreatment.startAt
    }],
    status: "active"
  });

  await insertDocuments(COLLECTIONS.reviews, [
    {
      appointment: completedOne._id,
      patient: patients[0]._id,
      dentist: rooms[0].assignedDentist,
      service: services[3]._id,
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "Bác sĩ tư vấn rõ ràng, thao tác nhẹ nhàng."
    },
    {
      appointment: completedTwo._id,
      patient: patients[1]._id,
      dentist: rooms[1].assignedDentist,
      service: services[0]._id,
      rating: 4,
      ratingDentist: 5,
      ratingService: 4,
      comment: "Quy trình nhanh và nhân viên hỗ trợ tốt."
    },
    {
      appointment: completedThree._id,
      patient: patients[2]._id,
      dentist: rooms[2].assignedDentist,
      service: services[4]._id,
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "Kết quả tốt và được hướng dẫn chăm sóc kỹ."
    }
  ]);

  await insertDocuments(COLLECTIONS.consultationRequests, [
    {
      fullName: "Đỗ Minh Khang",
      phone: "0988000001",
      service: services[2]._id,
      gender: "male",
      status: "waiting"
    },
    {
      fullName: "Võ Ngọc Lan",
      phone: "0988000002",
      service: services[1]._id,
      gender: "female",
      status: "waiting"
    },
    {
      fullName: "Bùi Thanh Mai",
      phone: "0988000003",
      service: services[4]._id,
      gender: "female",
      status: "waiting"
    }
  ]);

  await insertDocuments(COLLECTIONS.notifications, [
    {
      user: patients[0]._id,
      title: "Lịch hẹn đang chờ xác nhận",
      message: `Yêu cầu ${services[0].name} đang chờ lễ tân xác nhận.`,
      isRead: false
    },
    {
      user: patients[0]._id,
      title: "Lịch hẹn đã được xác nhận",
      message: `Lịch ${services[3].name} đã được lễ tân xác nhận.`,
      isRead: false
    },
    {
      user: patients[1]._id,
      title: "Đã ghi nhận có mặt",
      message: "Bạn đã được ghi nhận có mặt tại SmileCare.",
      isRead: false
    },
    {
      user: patients[2]._id,
      title: "Đang điều trị",
      message: "Lịch khám của bạn đã chuyển sang trạng thái đang điều trị.",
      isRead: true
    }
  ]);

  const roomStatuses = ["available", "available", "in_use"];
  await Promise.all(
    rooms.map((room, index) =>
      getCollection(COLLECTIONS.clinicRooms).updateOne(
        { _id: room._id },
        { $set: { status: roomStatuses[index], updatedAt: new Date() } }
      )
    )
  );
  await insertDocuments(
    COLLECTIONS.roomStatuses,
    rooms.map((room, index) => ({
      room: room._id,
      nurse: room.assignedNurse,
      availabilityStatus: roomStatuses[index],
      note: "Trạng thái phòng từ dữ liệu mẫu theo logic mới."
    }))
  );

  return { pendingRandom, pendingSelected, confirmed, confirmedForPatient, checkedIn, inTreatment, rejected };
}

async function run() {
  await connectMongoDB();
  await clearDatabase();
  const passwordHash = await hashPassword("nhakhoa2026");
  const roles = await createRoles();
  await createClinicSettings();
  const users = await seedUsers(roles, passwordHash);
  const slots = await createAppointmentSlots();
  const clinic = {
    ...(await seedClinic(users.dentists, users.nurses)),
    slots
  };
  await seedOperationalData(users, clinic);
  await closeMongoDB();
}

if (process.argv[1]?.endsWith("seed.js")) {
  run().catch(async (error) => {
    await closeMongoDB();
    throw error;
  });
}
