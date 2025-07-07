import React, { useState } from "react";
import "./Contact.css";
import Header from "../Header/Header";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Your message has been sent!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <>
    <Header />
    <div className="contact-container">
      {/* Contact Info Section */}
      <div className="contact-info">
        <h1>Contact Us</h1>
        <p>Have questions? We'd love to hear from you!</p>
        <div className="info-box">
          <h3>📍 Our Location</h3>
          <p>RV College of Engineering</p>
          <p>RV Vidyaniketan post, Mysore Road</p>
        </div>
        <div className="info-box">
          <h3>📞 Call Us</h3>
          <p>+91 98765 43210</p>
        </div>
        <div className="info-box">
          <h3>✉️ Email</h3>
          <p>support@evhub.com</p>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="contact-form">
        <h2>Send Us a Message</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit">Send Message</button>
        </form>
      </div>

      {/* Social Media Section */}
      <div className="social-media">
        <h3>Follow Us</h3>
        <div className="social-icons">
          <a href="#" className="social-icon">🌍 Website</a>
          <a href="#" className="social-icon">📘 Facebook</a>
          <a href="#" className="social-icon">🐦 Twitter</a>
          <a href="#" className="social-icon">📷 Instagram</a>
        </div>
      </div>
    </div>
    </>
  );
};

export default Contact;
