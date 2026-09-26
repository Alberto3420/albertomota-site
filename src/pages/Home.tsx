import Header from '../components/Header'
import Hero from '../components/Hero'
import VideoSection from '../components/VideoSection'
import FeaturedStory from '../components/FeaturedStory'
import CompositionsGrid from '../components/CompositionsGrid'
import CommentsSection from '../components/CommentsSection'
import About from '../components/About'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <VideoSection />
      <FeaturedStory />
      <CompositionsGrid />
      <CommentsSection />
      <About />
      <ContactSection />
      <Footer />
    </div>
  )
}
