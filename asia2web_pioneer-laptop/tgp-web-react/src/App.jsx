// src/App.jsx
import Navbar   from './components/Navbar'
import Hero     from './components/Hero'
import About    from './components/About'
import History  from './components/History'
import Projects from './components/Projects'
import OrgChart from './components/OrgChart'
import Members  from './components/Members'
import Contact  from './components/Contact'
import Footer   from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <History />
        <Projects />
        <OrgChart />
        <Members />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
