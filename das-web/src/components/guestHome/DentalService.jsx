import { Sparkles } from "lucide-react";
import DentalServiceCard from "./DentalServiceCard.jsx";

export default function DentalService({ services }) {
  return (
    <section className="smile-section smile-services" id="services">
      <div className="smile-section-heading centered">
        <span className="smile-pill compact">
          <Sparkles size={15} />
          Dịch vụ của chúng tôi
        </span>
        <h2>Chăm Sóc Toàn Diện Cho Nụ Cười Của Bạn</h2>
        <p>Từ kiểm tra định kỳ đến các giải pháp thẩm mỹ nha khoa, SmileCare đồng hành cùng bạn trong từng bước điều trị.</p>
      </div>

      <div className="smile-service-grid">
        {services.map((service) => (
          <DentalServiceCard service={service} key={service._id || service.name} />
        ))}
      </div>
    </section>
  );
}
