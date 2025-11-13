import "../CSS/Auth.css";

export default function OtpVerification() {
  return (
    <div className="auth-container">
      <div className="auth-card zoom-in">
        <h2>OTP Verification</h2>
        <p className="otp-text">Enter the 6-digit OTP sent to your email/phone</p>
        <input className="otp-input" type="text" maxLength="6" placeholder="______" />
        <button className="auth-btn">Verify</button>
      </div>
    </div>
  );
}
