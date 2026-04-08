import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { 
  FaBirthdayCake, 
  FaHeart, 
  FaBriefcase, 
  FaUsers, 
  FaMusic, 
  FaGraduationCap,
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "services", "about", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  const eventTypes = [
    {
      icon: <FaBirthdayCake className="text-4xl" />,
      title: "Birthday Celebrations",
      description: "Make every birthday memorable with our expert event planning. From intimate gatherings to grand celebrations.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: <FaHeart className="text-4xl" />,
      title: "Wedding Events",
      description: "Your dream wedding, perfectly executed. We handle every detail so you can enjoy your special day.",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <FaBriefcase className="text-4xl" />,
      title: "Corporate Events",
      description: "Professional corporate gatherings, conferences, and team-building events that leave a lasting impression.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <FaUsers className="text-4xl" />,
      title: "Social Functions",
      description: "Anniversaries, reunions, and social gatherings crafted with care and attention to detail.",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: <FaMusic className="text-4xl" />,
      title: "Festivals & Concerts",
      description: "Large-scale festivals and concerts with professional sound, lighting, and crowd management.",
      image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
      color: "from-orange-400 to-red-500"
    },
    {
      icon: <FaGraduationCap className="text-4xl" />,
      title: "Workshops & Seminars",
      description: "Educational events, workshops, and seminars with state-of-the-art facilities and equipment.",
      image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop",
      color: "from-green-400 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <Navbar activeSection={activeSection} scrollToSection={scrollToSection} />
      
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-pink-600/10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&h=1080&fit=crop')] opacity-5 bg-cover bg-center"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 mb-6">
              EventFlex
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
              Where Events Meet Excellence
            </p>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with professional event organizers, skilled gig workers, and reliable hosts. 
              Your one-stop platform for seamless event management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-purple-700 hover:to-indigo-700"
              >
                Get Started
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-purple-600"
              >
                Explore Services
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-purple-600 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From intimate gatherings to grand celebrations, we handle events of all sizes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventTypes.map((event, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${event.color} opacity-60`}></div>
                  <div className={`absolute top-4 right-4 bg-gradient-to-r ${event.color} rounded-full p-3 shadow-lg border-2 border-white`}>
                    <div className="text-white">
                      {event.icon}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <button className="flex items-center text-purple-600 font-semibold hover:text-indigo-600 transition-colors">
                    Learn More <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About EventFlex
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Revolutionizing the event management industry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                EventFlex is dedicated to creating seamless connections between event hosts, 
                professional organizers, and skilled gig workers. We believe every event deserves 
                perfection, and we're here to make that happen.
              </p>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                To become the leading platform for event management, where trust, quality, and 
                innovation come together to create unforgettable experiences.
              </p>

              <div className="space-y-4">
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 text-2xl mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Secure Escrow System</h4>
                    <p className="text-gray-600">Your payments are protected until event completion</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 text-2xl mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Verified Professionals</h4>
                    <p className="text-gray-600">All organizers and gig workers are KYC verified</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 text-2xl mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Real-time Tracking</h4>
                    <p className="text-gray-600">Monitor your event progress in real-time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaCheckCircle className="text-green-500 text-2xl mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Reputation System</h4>
                    <p className="text-gray-600">Build trust through ratings and reviews</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
                <h3 className="text-3xl font-bold mb-6">Why Choose EventFlex?</h3>
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <span className="bg-white/20 rounded-full p-2 mr-4">✓</span>
                    <span className="text-lg">Transparent pricing with no hidden costs</span>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/20 rounded-full p-2 mr-4">✓</span>
                    <span className="text-lg">24/7 customer support</span>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/20 rounded-full p-2 mr-4">✓</span>
                    <span className="text-lg">Easy-to-use platform for all skill levels</span>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/20 rounded-full p-2 mr-4">✓</span>
                    <span className="text-lg">Secure payment processing</span>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/20 rounded-full p-2 mr-4">✓</span>
                    <span className="text-lg">Comprehensive event management tools</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white rounded-full p-3 mr-4">
                      <FaEnvelope className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <p className="text-gray-600">team.aditya.invincible@gmail.com</p>
                      <p className="text-gray-600">info@eventflex.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-indigo-600 text-white rounded-full p-3 mr-4">
                      <FaPhone className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                      <p className="text-gray-600">+91 6263332934</p>
                      <p className="text-gray-600">+91 7803997106</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-pink-600 text-white rounded-full p-3 mr-4">
                      <FaMapMarkerAlt className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                      <p className="text-gray-600">123 Event Management Street</p>
                      <p className="text-gray-600">Bhopal, Madhya Pradesh 462044</p>
                      <p className="text-gray-600">India</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                <form className="space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <textarea
                      rows="5"
                      placeholder="Your Message"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
