import * as publicRepository from "../repository/publicRepository.js";
import { findAvailableSlots } from "./schedulingService.js";
import { availabilityQuerySchema, consultationSchema } from "../validations/publicValidation.js";

export function getHealth() {
  return { status: "ok", service: "DAS API" };
}

export function getServices() {
  return publicRepository.findActiveServices();
}

export function getBootstrap() {
  return publicRepository.getPublicBootstrapData();
}

export function getReviews() {
  return publicRepository.findPublicReviews(25);
}

export function getDentists() {
  return publicRepository.findActiveDentists();
}

export async function getDentistById(id) {
  const dentist = await publicRepository.findActiveDentistById(id);

  if (!dentist) {
    const err = new Error("Không tìm thấy bác sĩ.");
    err.statusCode = 404;
    throw err;
  }

  const reviews = await publicRepository.findReviewsByDentist(dentist._id, 10);
  return { dentist, reviews };
}

export function getDentistReviews(id) {
  return publicRepository.findReviewsByDentist(id, 25);
}

export function getRooms() {
  return publicRepository.findActiveRooms();
}

export function getAvailability(query) {
  const data = availabilityQuerySchema.parse(query);
  return findAvailableSlots(data);
}

export function createConsultation(body) {
  const data = consultationSchema.parse(body);

  return publicRepository.createConsultationRequest({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || undefined,
    service: data.service || undefined,
    preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
    preferredTime: data.preferredTime,
    message: data.message
  });
}
