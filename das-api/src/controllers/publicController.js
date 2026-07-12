import * as publicService from "../services/publicService.js";

export function getHealth(_req, res) {
  res.json(publicService.getHealth());
}

export async function getServices(_req, res) {
  const services = await publicService.getServices();
  res.json({ services });
}

export async function getBootstrap(_req, res) {
  const data = await publicService.getBootstrap();
  res.json(data);
}

export async function getReviews(_req, res) {
  const reviews = await publicService.getReviews();
  res.json({ reviews });
}

export async function getDentists(_req, res) {
  const dentists = await publicService.getDentists();
  res.json({ dentists });
}

export async function getDentistById(req, res) {
  const data = await publicService.getDentistById(req.params.id);
  res.json(data);
}

export async function getDentistReviews(req, res) {
  const reviews = await publicService.getDentistReviews(req.params.id);
  res.json({ reviews });
}

export async function getRooms(_req, res) {
  const rooms = await publicService.getRooms();
  res.json({ rooms });
}

export async function getAvailability(req, res) {
  const slots = await publicService.getAvailability(req.query);
  res.json({ slots });
}

export async function createConsultation(req, res) {
  const request = await publicService.createConsultation(req.body);
  res.status(201).json({ request });
}
