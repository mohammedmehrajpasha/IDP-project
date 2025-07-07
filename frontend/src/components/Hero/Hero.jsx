import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const images = [
  "../../../public/images/ev4.jpg",
  "../../../public/images/ev1.jpg",
  "../../../public/images/ev3.jpg"
];

const carData = [
  {
    id: 1,
    image: "/images/ev1.jpg",
    title: "EV Model X",
    description: "A powerful electric SUV with long-range capabilities.",
    price: "Rs. 7,50,000",
    manual: "#",
    features: ["Long Range", "Autopilot", "Fast Charging"]
  },
  {
    id: 2,
    image: "/images/ev2.jpg",
    title: "EV Model S",
    description: "A sleek and efficient sedan with cutting-edge technology.",
    price: "Rs. 9,45,000",
    manual: "#",
    features: ["Luxury Interior", "AI Assistance", "Wireless Charging"]
  },
  {
    id: 3,
    image: "/images/ev3.jpg",
    title: "EV Model Y",
    description: "Compact electric crossover with premium features.",
    price: "Rs. 8,50,000",
    manual: "#",
    features: ["Compact Design", "Panoramic Roof", "All-Wheel Drive"]
  },
  {
    id: 4,
    image: "/images/ev4.jpg",
    title: "EV Model Z",
    description: "An affordable yet high-performance electric vehicle.",
    price: "Rs. 5,60,000",
    manual: "#",
    features: ["Affordable Price", "High Speed", "Regenerative Braking"]
  }
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-overlay"></div>
        <img src={carData[currentIndex].image} alt="EV Vehicle" className="hero-image" />
        
      </section>

      <section className="cars">
      <h1>Experience the Future of Mobility</h1>
      <p>Discover sustainable and innovative electric vehicles.</p>
        <h2>Our Latest EV Models</h2>
        <div className="car-list">
          {carData.map((car) => (
            <div key={car.id} className="car-item">
              <img src={car.image} alt={car.title} className="car-image" />
              <h3>{car.title}</h3>
              <p>{car.description}</p>
              <span className="car-price">{car.price}</span>
              
              {/* Use navigate to pass car details */}
              <button 
                className="car-button"
                onClick={() => navigate(`/car/${car.id}`, { state: { car } })}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}