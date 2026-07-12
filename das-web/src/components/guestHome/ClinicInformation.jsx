import { CalendarDays, CheckCircle2, Clock, MapPin, UsersRound } from "lucide-react";

export default function ClinicInformation({ address, dentistCount, roomCount }) {
  return (
    <section className="smile-section smile-about" id="about">
      <div className="smile-about-copy">
        <span className="smile-pill compact">
          <CheckCircle2 size={15} />
          Về SmileCare
        </span>
        <h2>Không gian điều trị hiện đại, lịch hẹn rõ ràng</h2>
        <div className="smile-feature-list">
          <span>
            <Clock size={18} />
            Hằng tuần, 8h-11h30 và 14h-17h30
          </span>
          <span>
            <UsersRound size={18} />
            {dentistCount} bác sĩ giàu kinh nghiệm
          </span>
        </div>
      </div>

      <div className="smile-clinic-panel">
        <article>
          <MapPin size={20} />
          <div>
            <strong>SmileCare</strong>
            <span>{address || "Địa chỉ phòng khám đang được cập nhật."}</span>
          </div>
        </article>
        <article>
          <CalendarDays size={20} />
          <div>
            <strong>{roomCount ? `${roomCount} phòng điều trị` : "Chưa có phòng điều trị"}</strong>
            <span>Danh sách phòng được lấy trực tiếp từ hệ thống quản trị.</span>
          </div>
        </article>
      </div>
    </section>
  );
}
