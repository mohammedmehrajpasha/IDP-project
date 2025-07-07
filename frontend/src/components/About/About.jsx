import React from "react";
import "./About.css";
import Header from "../Header/Header";

const About = () => {
  return (
    <>
    <Header />
    <div className="about-container">
      <section className="about-header">
        <h1>About GreenDrive Motors</h1>
        <p>
          At GreenDrive Motors, we are committed to revolutionizing transportation 
          with cutting-edge electric vehicles.We strive to build a 
          sustainable future by offering high-performance, eco-friendly solutions.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision">
        <div className="box">
          <h2>Our Mission</h2>
          <p>
            To accelerate the world's transition to sustainable energy by creating 
            innovative, high-performance electric vehicles that redefine mobility.
          </p>
        </div>
        </section>
        <section>
        <div className="box1">
          <h2>Our Vision</h2>
          <p>
            A world where every journey is powered by clean energy, reducing carbon 
            footprints and making transportation more efficient and accessible.
          </p>
        </div>
      </section>

    
    </div>
    </>
  );
};

export default About;
