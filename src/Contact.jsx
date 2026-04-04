import { useState } from "react";
import Navbar from "./Navbar";
import "./Pages.css";

export default function Contact() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Contact Us</h1>
          <p>Have questions or feedback? We're here to help.</p>
        </div>

        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <div className="contact-items">
              {[
                { label: "Email Support",    value: "support@insureguard.in" },
                { label: "Helpline",         value: "1800-XXX-XXXX (Toll Free)" },
                { label: "Support Hours",    value: "Mon–Sat, 9 AM – 6 PM IST" },
                { label: "Registered Office", value: "Coimbatore, Tamil Nadu, India" },
              ].map((c) => (
                <div className="contact-item" key={c.label}>
                  <div>
                    <div className="contact-label">{c.label}</div>
                    <div className="contact-value">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="faq-section">
              <h3>Quick Help</h3>
              {[
                { q: "When does my coverage start?",       a: "After 6 consecutive weekly premium payments." },
                { q: "How are claims processed?",          a: "Automatically when environmental thresholds are crossed." },
                { q: "What if my payment fails?",          a: "A 2-day grace period is given with notifications." },
                { q: "How do I update my UPI ID?",         a: "Contact support with your registered mobile number." },
              ].map((f) => (
                <div className="faq-item" key={f.q}>
                  <strong>{f.q}</strong>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Form */}
          <div className="contact-form-card">
            <h2>Send Feedback</h2>
            {submitted ? (
              <div className="success-msg">
                <p>Thank you! We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {[
                  { name: "name",    label: "Your Name",    type: "text",  placeholder: "Full name" },
                  { name: "email",   label: "Email",        type: "email", placeholder: "your@email.com" },
                  { name: "subject", label: "Subject",      type: "text",  placeholder: "How can we help?" },
                ].map((f) => (
                  <div className="form-group" key={f.name}>
                    <label>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue or feedback..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">Send Message →</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
