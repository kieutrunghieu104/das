import * as appointmentRepository from "../repository/appointmentRepository.js";
import {
  createAppointmentFromSlot,
  rescheduleAppointmentFromSlot
} from "./schedulingService.js";
import { endOfLocalDay, startOfLocalDay, toDateInputValue } from "../utils/time.js";
import {
  appointmentNoteSchema,
  appointmentPaymentSchema,
  cancelAppointmentSchema,
  checkInAppointmentSchema,
  createAppointmentInvoiceSchema,
  createAppointmentSchema,
  receptionScheduleSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema
} from "../validations/appointmentValidation.js";

const STAFF_ROLES = new Set(["receptionist", "admin", "nurse"]);
const LOCKED_APPOINTMENT_STATUSES = new Set(["cancelled", "rejected"]);
const CHANGEABLE_APPOINTMENT_STATUSES = new Set(["pending", "scheduled"]);
const INSTALLMENT_MONTH_OPTIONS = new Set([3, 6, 9]);

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function appointmentQueryForUser(user) {
  if (user.role === "patient") return { patient: user._id };
  if (user.role === "dentist") return { dentist: user._id };
  if (user.role === "nurse") return { nurse: user._id };
  return {};
}

function normalizeId(value) {
  return value?._id || value;
}

function sameId(left, right) {
  return normalizeId(left)?.toString() === normalizeId(right)?.toString();
}

function patientNotificationUser(appointment) {
  const patient = normalizeId(appointment.patient);
  return patient && !appointment.patient?.isGuest ? patient : null;
}

async function createAppointmentPatientNotification(appointment, data) {
  const user = patientNotificationUser(appointment);
  if (!user) return null;
  return appointmentRepository.createPatientNotification({
    ...data,
    user
  });
}

function assertBookingWindow(user, dateText) {
  if (!["patient", "receptionist", "admin"].includes(user.role)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const maxDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    Math.min(today.getDate(), nextMonth.getDate())
  );
  const requestedDate = new Date(`${dateText}T00:00:00`);

  if (requestedDate > maxDate) {
    throw createError("Chỉ được đặt, đổi hoặc xếp lịch trong vòng 1 tháng tính từ hôm nay.", 400);
  }
}

function canAccessAppointment(user, appointment) {
  if (["admin", "receptionist"].includes(user.role)) return true;
  if (user.role === "patient") return sameId(appointment.patient, user._id);
  if (user.role === "dentist") return sameId(appointment.dentist, user._id);
  if (user.role === "nurse") return sameId(appointment.nurse, user._id);
  return false;
}

function isPatientCancelled(appointment) {
  return appointment.status === "cancelled" && sameId(appointment.cancelledBy, appointment.patient);
}

function assertAppointmentCanChange(appointment, user) {
  if (isPatientCancelled(appointment)) {
    throw createError("Lịch hẹn đã do bệnh nhân hủy nên lễ tân không thể cập nhật trạng thái.", 409);
  }

  if (appointment.status === "cancelled" && !STAFF_ROLES.has(user.role)) {
    throw createError("Lịch hẹn đã hủy nên không thể cập nhật thêm.", 409);
  }

  if (LOCKED_APPOINTMENT_STATUSES.has(appointment.status)) {
    throw createError("Lịch hẹn đã hủy hoặc bị từ chối nên không thể cập nhật thêm.", 409);
  }
}

function assertAppointmentCanRescheduleOrCancel(appointment) {
  if (!CHANGEABLE_APPOINTMENT_STATUSES.has(appointment.status)) {
    throw createError("Chỉ lịch chờ xác nhận hoặc chưa diễn ra mới được đổi hoặc hủy.", 409);
  }
}

function formatClinicDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(value));
}

function resolveInvoicePaymentPlan(data) {
  const paymentPlan = data.paymentPlan === "monthly" ? "monthly" : "one_time";
  const installmentMonths = paymentPlan === "monthly" ? Number(data.installmentMonths) : 1;

  if (paymentPlan === "monthly" && !INSTALLMENT_MONTH_OPTIONS.has(installmentMonths)) {
    throw createError("Chọn kỳ hạn trả theo tháng 3, 6 hoặc 9 tháng.", 400);
  }

  return { paymentPlan, installmentMonths };
}

function calculateInstallmentAmount(total, installmentMonths) {
  return Math.ceil(Number(total || 0) / Math.max(Number(installmentMonths || 1), 1));
}

function getNextInvoicePayment(invoice, total, paidAmount) {
  const remaining = Math.max(total - paidAmount, 0);
  const installmentMonths = invoice.paymentPlan === "monthly" ? Number(invoice.installmentMonths || 1) : 1;
  const installmentNumber = (invoice.payments || []).length + 1;
  const installmentAmount = Number(invoice.installmentAmount || calculateInstallmentAmount(total, installmentMonths));
  const shouldPayRemaining =
    invoice.paymentPlan !== "monthly" ||
    installmentNumber >= installmentMonths ||
    remaining <= installmentAmount;

  return {
    installmentNumber,
    amount: shouldPayRemaining ? remaining : Math.min(installmentAmount, remaining)
  };
}

async function notifyPatientOfReceptionDecision(appointment, status) {
  const messages = {
    confirmed: {
      title: "Lịch hẹn đã được xác nhận",
      message: "Lễ tân đã xác nhận lịch hẹn của bạn. Vui lòng đến đúng thời gian đã được xếp."
    },
    waitlisted: {
      title: "Lịch hẹn đang chờ xếp lịch",
      message: "Lễ tân đã đưa lịch hẹn của bạn vào danh sách chờ và sẽ liên hệ khi có khung giờ phù hợp."
    },
    rejected: {
      title: "Lịch hẹn đã bị từ chối",
      message: "Lễ tân đã từ chối lịch hẹn này. Bạn có thể chọn khung giờ khác và gửi lại yêu cầu."
    }
  };
  const content = messages[status];
  if (!content) return;

  await createAppointmentPatientNotification(appointment, {
    title: content.title,
    message: content.message,
    isRead: false
  });
}

function buildAppointmentQuery(user, query) {
  const appointmentQuery = appointmentQueryForUser(user);

  if (query.status) {
    appointmentQuery.status = query.status;
  }

  if (query.date) {
    appointmentQuery.startAt = {
      $gte: startOfLocalDay(query.date),
      $lte: endOfLocalDay(query.date)
    };
  }

  return appointmentQuery;
}

async function requireAccessibleAppointment(appointmentId, user, populated = false) {
  const appointment = populated
    ? await appointmentRepository.findAppointmentByIdPopulated(appointmentId)
    : await appointmentRepository.findAppointmentById(appointmentId);

  if (!appointment || !canAccessAppointment(user, appointment)) {
    throw createError("Không tìm thấy lịch hẹn.", 404);
  }

  return appointment;
}

export function getAppointments(user, query) {
  return appointmentRepository.findAppointments(buildAppointmentQuery(user, query));
}

export function getAppointmentById(appointmentId, user) {
  return requireAccessibleAppointment(appointmentId, user, true);
}

export async function createAppointment(user, body) {
  const data = createAppointmentSchema.parse(body);
  assertBookingWindow(user, data.date);

  if (!["patient", "receptionist", "admin"].includes(user.role)) {
    throw createError("Chỉ bệnh nhân, lễ tân hoặc quản trị viên được tạo lịch hẹn.", 403);
  }

  const patientId = user.role === "patient" ? user._id : data.patientId;
  const guestPatient = user.role === "patient" ? undefined : data.guestPatient;
  if (!patientId && !guestPatient) {
    throw createError("Cần chọn bệnh nhân hoặc nhập thông tin bệnh nhân chưa có tài khoản.", 400);
  }

  const appointment = await createAppointmentFromSlot({
    requester: user,
    patientId,
    guestPatient,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId,
    channel: user.role === "patient" ? "online" : data.channel || "offline",
    dentistPreference: data.dentistPreference,
    note: data.note
  });

  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function rescheduleAppointment(appointmentId, user, body) {
  const data = rescheduleAppointmentSchema.parse(body);
  assertBookingWindow(user, data.date);
  const appointment = await requireAccessibleAppointment(appointmentId, user);

  assertAppointmentCanChange(appointment, user);
  assertAppointmentCanRescheduleOrCancel(appointment);
  const previousStatus = appointment.status;
  const updated = await rescheduleAppointmentFromSlot({
    appointment,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId
  });

  updated.status = user.role === "patient" ? "pending" : previousStatus === "pending" ? "pending" : "confirmed";
  if (user.role === "patient") {
    updated.receptionistNote = "Bệnh nhân đã thay đổi lịch và đang chờ lễ tân xác nhận lại.";
  }
  await appointmentRepository.saveAppointment(updated);

  await appointmentRepository.populateAppointment(updated);
  return updated;
}

export async function scheduleByReception(appointmentId, user, body) {
  const data = receptionScheduleSchema.parse(body);
  assertBookingWindow(user, data.date);
  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  assertAppointmentCanRescheduleOrCancel(appointment);
  const updated = await rescheduleAppointmentFromSlot({
    appointment,
    serviceId: data.serviceId,
    date: data.date,
    startAt: data.startAt,
    roomId: data.roomId
  });

  updated.status = "scheduled";
  updated.receptionist = user._id;
  updated.receptionistNote = data.note || "Lễ tân đã xếp lịch khám cho bệnh nhân.";
  await appointmentRepository.saveAppointment(updated);
  await appointmentRepository.populateAppointment(updated);

  await createAppointmentPatientNotification(updated, {
    title: "Lễ tân đã xếp lịch khám",
    message: `Lịch khám ${updated.service?.name || "nha khoa"} của bạn được xếp lúc ${formatClinicDateTime(updated.startAt)} với ${updated.dentist?.fullName || "bác sĩ do lễ tân sắp xếp"}.`,
    isRead: false
  });

  return updated;
}

export async function cancelAppointment(appointmentId, user, body) {
  const data = cancelAppointmentSchema.parse(body);
  const appointment = await requireAccessibleAppointment(appointmentId, user);

  assertAppointmentCanChange(appointment, user);
  assertAppointmentCanRescheduleOrCancel(appointment);
  appointment.status = "cancelled";
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = user._id;
  appointment.cancellationReason = data.reason;
  await appointmentRepository.updateAppointmentRoomStatus(normalizeId(appointment.room), "available");
  await appointmentRepository.saveAppointment(appointment);
  await createAppointmentPatientNotification(appointment, {
    title: "Lịch hẹn đã hủy",
    message: `Lịch hẹn đã được hủy. Lý do: ${data.reason}`,
    isRead: false
  });
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function updateAppointmentStatus(appointmentId, user, body) {
  const data = updateAppointmentStatusSchema.parse(body);
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  if (user.role === "nurse") {
    if (!sameId(appointment.nurse, user._id)) {
      throw createError("Y tá chỉ được cập nhật lịch khám được phân công.", 403);
    }
    if (!["in_treatment", "completed"].includes(data.status)) {
      throw createError("Y tá chỉ được chuyển trạng thái đang khám hoặc hoàn tất.", 403);
    }
  }
  if (user.role === "receptionist" && ["in_treatment", "completed"].includes(data.status)) {
    throw createError("Lễ tân chỉ được ghi nhận có mặt hoặc vắng mặt, không hoàn tất lịch khám.", 403);
  }
  if (data.status === "in_treatment" && appointment.status !== "checked_in") {
    throw createError("Cần ghi nhận bệnh nhân có mặt trước khi chuyển sang trạng thái đang khám.", 409);
  }
  if (data.status === "in_treatment") {
    const activeTreatment = await appointmentRepository.findActiveTreatmentConflict(appointment);
    if (activeTreatment) {
      const patientName = activeTreatment.patient?.fullName || activeTreatment.guestPatient?.fullName || "bệnh nhân hiện tại";
      throw createError(`Đang có ${patientName} trong trạng thái đang khám. Cần hoàn tất lịch khám đó trước khi chuyển bệnh nhân khác sang đang khám.`, 409);
    }
  }
  if (data.status === "completed") {
    if (appointment.status !== "in_treatment") {
      throw createError("Chỉ có thể hoàn tất lịch đang khám.", 409);
    }
  }
  if (
    ["checked_in", "in_treatment", "completed"].includes(data.status) &&
    ["pending", "waitlisted", "rejected"].includes(appointment.status)
  ) {
    throw createError("Cần xác nhận lịch hẹn trước khi cập nhật trạng thái khám.", 409);
  }

  if (
    appointment.status === "waitlisted" &&
    ["scheduled", "confirmed", "checked_in", "in_treatment", "completed"].includes(data.status)
  ) {
    throw createError("Cần đổi lịch sang khung giờ còn trống trước khi xác nhận lịch đang chờ.", 409);
  }

  const previousStatus = appointment.status;
  appointment.status = data.status;
  appointment.receptionistNote = data.note ?? appointment.receptionistNote;
  if (
    ["confirmed", "waitlisted", "rejected", "scheduled", "checked_in", "in_treatment", "completed", "cancelled", "no_show"].includes(data.status) &&
    ["receptionist", "admin"].includes(user.role)
  ) {
    appointment.receptionist = user._id;
  }
  if (data.status === "checked_in" && !appointment.checkedInAt) {
    appointment.checkedInAt = new Date();
  }
  if (data.status === "cancelled" || data.status === "rejected") {
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = user._id;
    appointment.cancellationReason =
      data.note || (data.status === "rejected" ? "Lễ tân từ chối lịch hẹn." : appointment.cancellationReason);
  } else if (["cancelled", "rejected"].includes(previousStatus)) {
    appointment.cancelledAt = undefined;
    appointment.cancelledBy = undefined;
    appointment.cancellationReason = undefined;
  }

  await appointmentRepository.saveAppointment(appointment);

  if (data.status === "in_treatment") {
    await appointmentRepository.updateAppointmentRoomStatus(normalizeId(appointment.room), "in_use");
  }
  if (["completed", "no_show", "cancelled", "rejected"].includes(data.status)) {
    await appointmentRepository.updateAppointmentRoomStatus(normalizeId(appointment.room), "available");
  }
  if (data.status === "completed") {
    const receptionists = await appointmentRepository.findActiveReceptionists();
    await Promise.all(receptionists.map((receptionist) =>
      appointmentRepository.createPatientNotification({
        user: receptionist._id,
        title: "Lịch khám đã hoàn tất",
        message: `Lịch khám của ${appointment.patient?.fullName || "bệnh nhân"} đã hoàn tất. Lễ tân có thể kiểm tra dịch vụ phát sinh và tạo hóa đơn.`,
        type: "invoice_ready",
        isRead: false
      })
    ));
  }
  await notifyPatientOfReceptionDecision(appointment, data.status);
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function recordConfirmationCall(appointmentId, user, body) {
  const data = appointmentNoteSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentWithServiceName(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  if (["completed", "waitlisted"].includes(appointment.status)) {
    throw createError("Lịch hẹn này không còn cần gọi xác nhận.", 409);
  }

  appointment.confirmationBy = user._id;
  appointment.receptionistNote = data.note || "Lễ tân đã gọi xác nhận lịch hẹn.";
  appointment.receptionist = user._id;
  if (["pending", "scheduled"].includes(appointment.status)) {
    appointment.status = "confirmed";
  }

  await appointmentRepository.saveAppointment(appointment);
  await createAppointmentPatientNotification(appointment, {
    title: "Lịch hẹn đã được xác nhận",
    message: `Lễ tân đã gọi xác nhận lịch ${appointment.service?.name || "khám"} của bạn. Vui lòng đến đúng giờ hẹn.`,
    isRead: false
  });
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function checkInAppointment(appointmentId, user, body) {
  checkInAppointmentSchema.parse(body);
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  if (toDateInputValue(new Date()) < toDateInputValue(appointment.startAt)) {
    throw createError("Chỉ được ghi nhận có mặt trong ngày diễn ra lịch khám.", 409);
  }
  appointment.status = "checked_in";
  appointment.checkedInAt = new Date();

  appointment.paymentStatus = "not_required";

  await appointmentRepository.saveAppointment(appointment);
  await createAppointmentPatientNotification(appointment, {
    title: "Đã ghi nhận có mặt",
    message: "Lễ tân đã ghi nhận bạn có mặt tại quầy. Vui lòng chờ điều phối vào phòng khám.",
    isRead: false
  });
  await appointmentRepository.populateAppointment(appointment);
  return { appointment, invoice: null };
}

export async function markNoShow(appointmentId, user, body) {
  const data = appointmentNoteSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  assertAppointmentCanChange(appointment, user);
  if (appointment.status === "checked_in") {
    throw createError("Lịch khám đã ghi nhận có mặt nên không thể chuyển sang vắng mặt.", 409);
  }
  if (appointment.startAt > new Date()) {
    throw createError("Chỉ có thể cập nhật vắng mặt sau giờ hẹn.", 409);
  }

  appointment.status = "no_show";
  appointment.receptionist = user._id;
  appointment.receptionistNote = data.note || "Lễ tân đánh dấu bệnh nhân vắng mặt.";
  await appointmentRepository.updateAppointmentRoomStatus(normalizeId(appointment.room), "available");
  await appointmentRepository.saveAppointment(appointment);
  await appointmentRepository.populateAppointment(appointment);
  return appointment;
}

export async function createInvoiceForAppointment(appointmentId, body) {
  const data = createAppointmentInvoiceSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);
  if (appointment.status !== "completed") {
    throw createError("Chỉ có thể tạo hóa đơn sau khi lịch khám hoàn tất.", 409);
  }

  const existingInvoice = await appointmentRepository.findInvoiceByAppointment(appointment._id);
  if (existingInvoice) {
    throw createError("Lịch khám này đã có hóa đơn.", 409);
  }

  const performedItems = [
    ...(appointment.performedServices || []),
    ...(appointment.extraCosts || [])
  ].map((item) => ({
    name: item.name || "Dịch vụ nha khoa",
    amount: Number(item.amount || 0)
  }));
  const invoiceItems = data.items?.length
    ? data.items
    : performedItems.length
      ? performedItems
      : [{ name: appointment.service?.name || "Dịch vụ nha khoa", amount: Number(data.amount || 0) }];
  const subtotal = invoiceItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) || Number(data.amount || 0);
  const discountPercent = Number(data.discountPercent || 0);
  const discountAmount = Math.round(subtotal * discountPercent / 100);
  const total = Math.max(subtotal - discountAmount, 0);

  if (total <= 0) {
    throw createError("Số tiền hóa đơn phải lớn hơn 0.", 400);
  }

  const { paymentPlan, installmentMonths } = resolveInvoicePaymentPlan(data);
  const installmentAmount = calculateInstallmentAmount(total, installmentMonths);

  const invoice = await appointmentRepository.createInvoice({
    appointment: appointment._id,
    patient: appointment.patient?.isGuest ? undefined : appointment.patient,
    items: invoiceItems,
    subtotal,
    discountPercent,
    discountAmount,
    total,
    paidAmount: 0,
    paymentPlan,
    installmentMonths,
    installmentAmount,
    invoiceDate: new Date(),
    status: "unpaid"
  });

  appointment.paymentStatus = "unpaid";
  await appointmentRepository.saveAppointment(appointment);
  await createAppointmentPatientNotification(appointment, {
    title: "Bạn có hóa đơn mới",
    message: `Lễ tân đã tạo hóa đơn ${total.toLocaleString("vi-VN")} VND cho lịch khám của bạn. Vui lòng kiểm tra trong mục Hóa đơn.`,
    isRead: false
  });

  return invoice;
}

export async function processAppointmentPayment(appointmentId, body) {
  const data = appointmentPaymentSchema.parse(body || {});
  const appointment = await appointmentRepository.findAppointmentWithService(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  const invoice = await appointmentRepository.findInvoiceByAppointment(appointment._id);
  if (!invoice) {
    throw createError("Cần tạo hóa đơn trước khi ghi nhận thanh toán.", 409);
  }
  const total = Number(invoice.total || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const remaining = Math.max(total - paidAmount, 0);

  if (remaining <= 0) {
    throw createError("Hóa đơn đã được thanh toán đủ.", 409);
  }
  const { installmentNumber, amount } = getNextInvoicePayment(invoice, total, paidAmount);

  if (amount > remaining) {
    throw createError(`Số tiền thanh toán không được vượt quá ${remaining.toLocaleString("vi-VN")} VND.`, 400);
  }

  invoice.paidAmount = paidAmount + amount;
  invoice.status = invoice.paidAmount >= total ? "paid" : "partial";
  invoice.paidAt = invoice.status === "paid" ? new Date() : undefined;
  await appointmentRepository.saveInvoice(invoice);

  appointment.paymentStatus = invoice.status === "paid" ? "paid" : "partial";
  await appointmentRepository.saveAppointment(appointment);

  const payment = await appointmentRepository.createPayment({
    invoice: invoice._id,
    installmentNumber,
    amount,
    paymentMethod: data.paymentMethod
  });

  return { invoice, payment };
}

export async function getAppointmentInvoice(appointmentId, user) {
  const appointment = await requireAccessibleAppointment(appointmentId, user);
  return appointmentRepository.findInvoiceByAppointment(appointment._id);
}

export async function deleteEmptyInvoiceAppointment(appointmentId, user) {
  if (!["receptionist", "admin"].includes(user.role)) {
    throw createError("Chỉ lễ tân hoặc quản trị viên được xóa dòng hóa đơn rỗng.", 403);
  }

  const appointment = await appointmentRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch khám.", 404);
  if (appointment.status !== "completed") {
    throw createError("Chỉ xóa được dòng hóa đơn của lịch đã hoàn tất.", 409);
  }

  const invoice = await appointmentRepository.findInvoiceByAppointment(appointment._id);
  if (invoice) {
    throw createError("Lịch khám này đã có hóa đơn nên không thể xóa bằng thao tác này.", 409);
  }

  const total = Number(appointment.performedTotal || 0);
  const hasCharges = total > 0 || (appointment.performedServices || []).length > 0 || (appointment.extraCosts || []).length > 0;
  if (hasCharges) {
    throw createError("Chỉ xóa được dòng chưa có dịch vụ phát sinh.", 409);
  }

  const deletedAppointment = await appointmentRepository.deleteAppointment(appointment._id);
  if (!deletedAppointment) throw createError("Không tìm thấy lịch khám.", 404);
  return deletedAppointment;
}

export function getServicesForPayment() {
  return appointmentRepository.findActivePaymentServices();
}
