import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import Stats from '../components/Stats.jsx'
import Features from '../components/Features.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import FeaturedCourses from '../components/FeaturedCourses.jsx'
import Testimonials from '../components/Testimonials.jsx'
import CTA from '../components/CTA.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <FeaturedCourses />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
