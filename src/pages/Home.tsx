import Header from '../components/Header'
import Hero from '../components/Hero'
import Method from '../components/Method'
import FeaturedStory from '../components/FeaturedStory'
import VideoSection from '../components/VideoSection'
import CompositionsGrid from '../components/CompositionsGrid'
import CommentsSection from '../components/CommentsSection'
import FanUploadSection from '../components/FanUploadSection'
import About from '../components/About'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <Method />
      <FeaturedStory />
      <VideoSection />
      <CompositionsGrid />
      <CommentsSection />
      <FanUploadSection />
      <About />
      <ContactSection />
      <Footer />
    </div>
  )
}
