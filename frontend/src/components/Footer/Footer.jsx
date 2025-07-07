import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>We are committed to providing sustainable and innovative EV solutions.</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>Email: support@evhub.com</p>
          <p>Phone: +91 98765 43210</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} EV Hub. All Rights Reserved.</p>
      </div>
    </footer>
  );
}