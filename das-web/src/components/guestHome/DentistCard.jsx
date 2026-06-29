export default function DentistCard({ dentist }) {
  const yearsOfExperience = Number(dentist.yearsOfExperience || dentist.experienceYears || 0);
  const experienceText = yearsOfExperience ? `${yearsOfExperience} năm kinh nghiệm` : "Kinh nghiệm đang cập nhật";
  const description = dentist.description || dentist.bio || "Thông tin bác sĩ đang được cập nhật từ hệ thống.";

  return (
    <article className="smile-dentist-card" key={dentist._id}>
      {dentist.avatarUrl ? (
        <img
          className="smile-dentist-photo"
          src={dentist.avatarUrl}
          alt={dentist.fullName}
          decoding="async"
          loading="eager"
        />
      ) : (
        <span className="smile-dentist-initial">{dentist.fullName?.trim()?.[0]?.toUpperCase() || "B"}</span>
      )}
      <h3>{dentist.fullName}</h3>
      <strong>{experienceText}</strong>
      <p>{description}</p>
    </article>
  );
}
