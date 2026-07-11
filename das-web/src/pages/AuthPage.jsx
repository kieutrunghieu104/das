import ForgotPasswordForm from "../components/auth/ForgotPasswordForm.jsx";
import LoginForm from "../components/auth/LoginForm.jsx";
import RegisterForm from "../components/auth/RegisterForm.jsx";

export default function AuthPage({ mode }) {
  return (
    <section className="auth-grid">
      <div className="panel auth-panel">
        {mode === "register" ? <RegisterForm /> : mode === "forgot" ? <ForgotPasswordForm /> : <LoginForm />}
      </div>
    </section>
  );
}
