import React from "react"
import { useParams } from "react-router-dom";
import "./Cardetails.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import FinalChatbot from "../finalchatbot";

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
    price: "Rs. 9,50,000",
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

export default function Cardetails() {
  const { id } = useParams();
  console.log(useParams())
  const car = carData.find((car) => car.id === parseInt(id));
  

  if (!car) return <h2>Car not found</h2>;

  return (
    <div>
      <Header />
    <section className="car-details">
      <div className="car-image-container">
        <img src={car.image} alt={car.title} className="car-detail-image" />
      </div>
      <div className="car-info">
        <h2>{car.title}</h2>
        <p>{car.description}</p>
        <ul>
          {car.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <span className="car-price">{car.price}</span>
        <a href={car.manual} target="_blank" rel="noopener noreferrer" className="manual-button">
          Download User Manual
        </a>
      </div>
    </section>
    <Footer />
    </div>
  );
}