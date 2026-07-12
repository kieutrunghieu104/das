import { env } from "../config/environment.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { sendPasswordResetOtp } from "../utils/mailer.js";
import { signToken } from "../utils/tokens.js";
import * as userRepository from "../repository/userRepository.js";
import * as profileRepository from "../repository/profileRepository.js";

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function serializeUser(user) {
  const object = await profileRepository.attachProfileToUser({ ...user });
  delete object.passwordHash;
  delete object.resetPasswordCodeHash;
  delete object.resetPasswordExpiresAt;
  return object;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function ensurePatientRole() {
  return userRepository.upsertRole(
    { roleName: "patient" },
    { roleName: "patient" }
  );
}

export async function registerPatient(data) {
  const existing = await userRepository.findUserByPhone(data.phone);

  if (existing) {
    throw httpError("Số điện thoại đã được đăng ký.", 409);
  }

  if (data.email) {
    const emailOwner = await userRepository.findUserByEmail(data.email);
    if (emailOwner) {
      throw httpError("Email đã được đăng ký.", 409);
    }
  }

  const patientRole = await ensurePatientRole();
  const user = await userRepository.createUser({
    fullName: data.fullName || `Bệnh nhân ${data.phone}`,
    email: data.email || undefined,
    phone: data.phone,
    passwordHash: await hashPassword(data.password),
    roleRef: patientRole._id,
    role: "patient"
  });
  await userRepository.createPatientProfile({
    user: user._id,
    gender: data.gender,
    address: data.address || undefined
  });

  return {
    message: "Đăng ký tài khoản thành công. Vui lòng đăng nhập bằng số điện thoại."
  };
}

export async function login(data) {
  const user = await userRepository.findUserByPhone(data.phone);

  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw httpError("Số điện thoại hoặc mật khẩu không đúng.", 401);
  }

  if (user.status !== "active") {
    throw httpError("Tài khoản đang không hoạt động.", 403);
  }

  return {
    user: await serializeUser(user),
    token: signToken(user)
  };
}

export async function requestPasswordReset(data) {
  const user = await userRepository.findUserByEmailWithResetFields(data.email);
  const genericMessage = "Nếu email tồn tại, hệ thống sẽ gửi mã OTP đặt lại mật khẩu.";

  if (!user) {
    return { message: genericMessage };
  }

  const verificationCode = generateVerificationCode();
  const ttlMinutes = env.PASSWORD_RESET_OTP_TTL_MINUTES || 10;
  await userRepository.saveUser({
    ...user,
    resetPasswordCodeHash: await hashPassword(verificationCode),
    resetPasswordExpiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
  });

  const mailResult = await sendPasswordResetOtp({
    to: user.email,
    fullName: user.fullName,
    otp: verificationCode,
    ttlMinutes
  });

  return {
    message: genericMessage,
    verificationCode: !mailResult.sent && env.MAIL_DEV_RETURN_OTP ? verificationCode : undefined
  };
}

export async function resetPassword(data) {
  const user = await userRepository.findUserByEmailWithResetFields(data.email);

  if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    throw httpError("Mã xác minh không hợp lệ hoặc đã hết hạn.", 400);
  }

  const isValidCode = await comparePassword(data.verificationCode, user.resetPasswordCodeHash);
  if (!isValidCode) {
    throw httpError("Mã xác minh không hợp lệ hoặc đã hết hạn.", 400);
  }

  await userRepository.saveUser({
    ...user,
    passwordHash: await hashPassword(data.newPassword),
    resetPasswordCodeHash: null,
    resetPasswordExpiresAt: null
  });

  return { message: "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới." };
}

export async function getCurrentUser(user) {
  return { user: await serializeUser(user) };
}

export async function updateProfile(user, data) {
  if (data.phone && data.phone !== user.phone) {
    const duplicate = await userRepository.findDuplicatePhone(data.phone, user._id);
    if (duplicate) {
      throw httpError("Số điện thoại đã tồn tại.", 409);
    }
  }

  if (data.email && data.email !== user.email) {
    const duplicate = await userRepository.findDuplicateEmail(data.email, user._id);
    if (duplicate) {
      throw httpError("Email đã tồn tại.", 409);
    }
  }

  const userUpdate = profileRepository.pickUserFields(data);
  const updatedUser = Object.keys(userUpdate).length
    ? await userRepository.updateUserById(user._id, userUpdate)
    : user;

  await profileRepository.upsertProfileForUser(updatedUser, data);

  return { user: await serializeUser(updatedUser) };
}

export async function getNotifications(user) {
  const notifications = await userRepository.findNotificationsByUser(user._id);
  return { notifications };
}

export async function markAllNotificationsRead(user) {
  await userRepository.markAllNotificationsRead(user._id);
  return getNotifications(user);
}

export async function markNotificationRead(user, notificationId) {
  const notification = await userRepository.markNotificationRead(user._id, notificationId);

  if (!notification) {
    throw httpError("Không tìm thấy thông báo.", 404);
  }

  return { notification };
}

export async function deleteNotification(user, notificationId) {
  const notification = await userRepository.deleteNotification(user._id, notificationId);

  if (!notification) {
    throw httpError("Không tìm thấy thông báo.", 404);
  }

  return getNotifications(user);
}

export async function deleteAllNotifications(user) {
  await userRepository.deleteAllNotifications(user._id);
  return { notifications: [] };
}

export async function changePassword(user, data) {
  const storedUser = await userRepository.findUserByIdWithPassword(user._id);

  if (!(await comparePassword(data.currentPassword, storedUser.passwordHash))) {
    throw httpError("Mật khẩu hiện tại không đúng.", 400);
  }

  await userRepository.saveUser({
    ...storedUser,
    passwordHash: await hashPassword(data.newPassword)
  });

  return { message: "Đã đổi mật khẩu." };
}

export function logout() {
  return { message: "Đã đăng xuất." };
}
