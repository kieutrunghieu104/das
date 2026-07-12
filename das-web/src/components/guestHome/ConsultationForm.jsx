import { CalendarDays, Send } from "lucide-react";
import { useState } from "react";
import { api, getErrorMessage } from "../../utils/api.js";
import { firstError, validateName, validatePhone } from "../../utils/validation.js";

const salutationOptions = [
  { label: "Anh", gender: "male" },
  { label: "Chị", gender: "female" },
  { label: "Khác", gender: "other" }
];

export default function ConsultationForm({ onError, onMessage, services }) {
  const [form, setForm] = useState({
    gender: "male",
    fullName: "",
    phone: "",
    service: ""
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitConsultation(event) {
    event.preventDefault();
    onMessage("");
    onError("");

    const validationError = firstError(validateName(form.fullName), validatePhone(form.phone));
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      await api.post("/consultations", {
        fullName: form.fullName,
        phone: form.phone,
        gender: form.gender,
        service: form.service || undefined
      });

      setForm({
        gender: "male",
        fullName: "",
        phone: "",
        service: ""
      });
      onMessage("Đã ghi nhận yêu cầu tư vấn. Lễ tân sẽ liên hệ để xác nhận lịch.");
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <section className="smile-section smile-contact" id="consultation">
      <div className="smile-section-heading centered">
        <span className="smile-pill compact">
          <CalendarDays size={15} />
          Đặt lịch tư vấn
        </span>
        <h2>Đăng Ký Nhận Tư Vấn Miễn Phí Từ Chuyên Gia</h2>
        <p>Để lại thông tin, đội ngũ bác sĩ SmileCare sẽ liên hệ tư vấn trong vòng 24h.</p>
      </div>

      <form className="smile-consult-form" onSubmit={submitConsultation}>
        <div className="smile-segmented" role="radiogroup" aria-label="Danh xưng">
          {salutationOptions.map((option) => (
            <label key={option.gender}>
              <input
                type="radio"
                name="gender"
                value={option.gender}
                checked={form.gender === option.gender}
                onChange={(event) => updateForm("gender", event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <label>
          <span>Họ và tên *</span>
          <input
            value={form.fullName}
            onChange={(event) => updateForm("fullName", event.target.value)}
            placeholder="Nguyễn Văn A"
            required
            maxLength={120}
          />
        </label>
        <label>
          <span>Số điện thoại *</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateForm("phone", event.target.value)}
            placeholder="0912 345 678"
            required
            maxLength={13}
          />
        </label>
        <label>
          <span>Dịch vụ quan tâm</span>
          <select value={form.service} onChange={(event) => updateForm("service", event.target.value)}>
            <option value="">-- Chọn dịch vụ --</option>
            {services.map((service) => (
              <option value={service._id} key={service._id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <button className="smile-submit" type="submit">
          <Send size={18} />
          Gửi đăng ký tư vấn miễn phí
        </button>
      </form>
    </section>
  );
}
