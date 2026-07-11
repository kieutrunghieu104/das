import { UsersRound } from "lucide-react";
import Carousel from "react-bootstrap/Carousel";
import EmptyState from "../EmptyState.jsx";
import DentistCard from "./DentistCard.jsx";

export default function DentistProfile({ dentistSlides }) {
  return (
    <section className="smile-section smile-dentists">
      <div className="smile-section-heading">
        <span className="smile-pill compact">
          <UsersRound size={15} />
          Đội ngũ bác sĩ
        </span>
        <h2>Bác sĩ đồng hành theo từng kế hoạch điều trị</h2>
      </div>

      {dentistSlides.length ? (
        <Carousel className="smile-dentist-carousel" interval={5000}>
          {dentistSlides.map((slide, slideIndex) => (
            <Carousel.Item key={`dentist-slide-${slideIndex}`}>
              <div className="smile-dentist-grid">
                {slide.map((dentist) => (
                  <DentistCard dentist={dentist} key={dentist._id} />
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <EmptyState title="Đang cập nhật đội ngũ bác sĩ" text="Danh sách bác sĩ sẽ hiển thị sau khi có dữ liệu trong hệ thống." />
      )}
    </section>
  );
}
