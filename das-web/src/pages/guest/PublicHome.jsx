import {
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Feedback from "../../components/Feedback.jsx";
import ClinicInformation from "../../components/guestHome/ClinicInformation.jsx";
import ConsultationForm from "../../components/guestHome/ConsultationForm.jsx";
import DentalService from "../../components/guestHome/DentalService.jsx";
import DentistProfile from "../../components/guestHome/DentistProfile.jsx";
import ReviewList from "../../components/guestHome/ReviewList.jsx";
import { formatPriceText } from "../../utils/format.js";
import { usePublicBootstrap } from "../../utils/usePublicBootstrap.js";

const serviceToneCycle = ["implant", "cosmetic", "ortho", "general"];

function stripServiceDurationText(description) {
  return (description ?? "")
    .replace(/,?\s*thời lượng(?: dự kiến)?\s*\d+\s*phút\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function newestFirst(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function getServiceCards(services) {
  return newestFirst(services).map((service, index) => ({
    _id: service._id,
    name: service.name,
    price: service.price,
    priceText: formatPriceText(service.price),
    description: stripServiceDurationText(service.description) || "Thông tin dịch vụ đang được cập nhật.",
    accent: serviceToneCycle[index % serviceToneCycle.length]
  }));
}

function getReviewCards(reviews) {
  return newestFirst(reviews)
    .filter((review) => review.comment)
    .slice(0, 8)
    .map((review) => ({
      _id: review._id,
      name: review.patient?.fullName || "Khách hàng SmileCare",
      service: review.service?.name || "Dịch vụ nha khoa",
      text: review.comment,
      rating: Math.min(Math.max(Number(review.rating || 5), 1), 5)
    }));
}

export default function PublicHome() {
  const { services, dentists, rooms, reviews, clinic } = usePublicBootstrap();
  const faqs = clinic.faqs || [];
  const hotline = clinic.hotline || clinic.receptionist?.phone || "";
  const hotlineHref = hotline ? `tel:${hotline.replace(/\s/g, "")}` : "#consultation";
  const dentistCards = useMemo(() => newestFirst(dentists), [dentists]);
  const dentistSlides = useMemo(() => dentistCards.map((dentist) => [dentist]), [dentistCards]);
  const reviewCards = useMemo(() => getReviewCards(reviews), [reviews]);
  const serviceCards = useMemo(() => getServiceCards(services), [services]);
  const roomCount = rooms.length;
  const [openFaq, setOpenFaq] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="smile-guest-page">
      <Feedback error={error} message={message} onClear={() => { setError(""); setMessage(""); }} />

      <header className="smile-header sticky-top">
        <a className="smile-brand" href="#home" aria-label="SmileCare">
          SmileCare
        </a>

        <nav className="smile-nav" aria-label="Điều hướng khách">
          <a href="#home">Trang chủ</a>
          <a href="#services">Dịch vụ</a>
          <a href="#about">Giới thiệu</a>
        </nav>

        <div className="smile-header-actions">
          <a className="smile-phone" href={hotlineHref}>
            <PhoneCall size={18} />
            <span>{hotline || "Liên hệ lễ tân"}</span>
          </a>
          <Link className="smile-primary-link" to="/login">
            Đăng nhập
          </Link>
        </div>
      </header>

      <main>
        <section className="smile-hero" id="home">
          <div className="smile-hero-copy">
            <span className="smile-pill">
              <ShieldCheck size={16} />
              Nha khoa uy tín hàng đầu
            </span>
            <h1>
              <span>Nụ Cười Rạng Rỡ,</span>
              <span>Tự Tin Tỏa Sáng</span>
            </h1>
            <p>
              SmileCare mang đến giải pháp chăm sóc răng miệng toàn diện với công nghệ hiện đại và đội ngũ bác sĩ giàu kinh nghiệm.
            </p>
            <div className="smile-hero-actions">
              <a className="smile-primary-link hero-action" href="#consultation">
                Đăng ký tư vấn miễn phí
                <ChevronRight size={18} />
              </a>
              <a className="smile-secondary-link" href="#services">
                Khám phá dịch vụ
                <ChevronRight size={18} />
              </a>
            </div>
          </div>

          <div className="smile-hero-visual" aria-label="Hình ảnh phòng khám SmileCare">
            <div className="smile-hero-image">
              <span>
                <CheckCircle2 size={18} />
                Thăm khám nhẹ nhàng
              </span>
            </div>
          </div>

        </section>

        <DentalService services={serviceCards} />

        <ClinicInformation address={clinic.address} dentistCount={dentistCards.length} roomCount={roomCount} />

        <DentistProfile dentistSlides={dentistSlides} />

        {faqs.length > 0 && <section className="smile-section smile-faq">
          <div className="smile-section-heading">
            <span className="smile-pill compact gold">
              <Sparkles size={15} />
              Tư vấn nhanh
            </span>
            <h2>Giải Đáp Thắc Mắc Về Sức Khỏe Răng Miệng</h2>
          </div>

          <div className="smile-faq-layout">
            <div className="smile-faq-photo" />
            <div className="smile-faq-list">
              {faqs.map((item, index) => (
                <article className={openFaq === index ? "open" : ""} key={item.question}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    <span>{item.question}</span>
                    <strong>{openFaq === index ? "×" : "+"}</strong>
                  </button>
                  {openFaq === index && <p>{item.answer}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>}

        <ReviewList reviews={reviewCards} />

        <ConsultationForm
          onError={setError}
          onMessage={setMessage}
          services={services}
        />
      </main>

      <footer className="smile-footer">
        <div className="smile-footer-grid">
          <div>
            <strong className="smile-footer-brand">Smile<span>Care</span></strong>
            <p>Nha khoa SmileCare - Đồng hành cùng nụ cười Việt với dịch vụ chăm sóc răng miệng chất lượng cao.</p>
          </div>
          <div>
            <h3>Dịch vụ</h3>
            {serviceCards.map((item) => (
              <a href="#services" key={item._id || item.name}>{item.name}</a>
            ))}
          </div>
          <div>
            <h3>Về SmileCare</h3>
            <a href="#about">Giới thiệu</a>
            <a href="#about">Đội ngũ bác sĩ</a>
            <a href="#about">Cơ sở vật chất</a>
            <Link to="/login">Đăng nhập</Link>
          </div>
          <div>
            <h3>Hỗ trợ</h3>
            <a href="#consultation">Câu hỏi thường gặp</a>
            <Link to="/register">Tạo tài khoản</Link>
            <Link to="/booking">Hướng dẫn đặt lịch</Link>
            <a href={hotlineHref}>{hotline || "Liên hệ lễ tân"}</a>
          </div>
        </div>
        <div className="smile-footer-bottom">
          <span>© 2026 SmileCare. Tất cả quyền được bảo lưu.</span>
          <span>Chính sách bảo mật · Điều khoản sử dụng</span>
        </div>
      </footer>
    </div>
  );
}
