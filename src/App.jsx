import './App.css'
import ShaderSplash from './components/ShaderSplash.jsx'

function App() {
  const ownerName = import.meta.env.VITE_OWNER_NAME ?? 'CapC0'
  const githubUrl = import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/your-username'
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL ?? 'https://www.linkedin.com/in/your-handle/'
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL ?? ''

  return (
    <div className="site-root">
      <section className="splash" aria-label="Visual splash">
        <ShaderSplash seedStr={ownerName} />
        <a className="scroll-indicator" href="#content" aria-label="Scroll to content">
          <span>Scroll</span>
          <svg width="16" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </section>

      <main id="content" className="content">
        <section className="section">
          <h2>About</h2>
          <p>
          I figured I ought to have a website 
          </p>
        </section>
        <section className="section">
          <h2>Some Things I like</h2>
          <ul className="projects">
            <li>
              <strong>Rust:</strong> Its type safe!
            </li> 
          </ul>
        </section>
        <section className="section">
          <h2>Contact</h2>
          <p>
            Say hi on GitHub or drop a message. I’m always open to
            interesting collaborations.
          </p>
        </section>
      </main>
      <footer className="footer" aria-label="Site footer">
        <div className="social">
          <a className="icon" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.174 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.342-3.369-1.342-.454-1.156-1.11-1.465-1.11-1.465-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.087 2.91.832.092-.647.35-1.087.636-1.337-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.03-2.688-.104-.253-.447-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.852.004 1.71.115 2.511.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.36.31.679.92.679 1.855 0 1.338-.012 2.417-.012 2.744 0 .268.18.58.688.481A10.019 10.019 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"/>
            </svg>
          </a>
          <a className="icon" href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><title>LinkedIn icon</title>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a className="icon" href={contactEmail ? `mailto:${contactEmail}` : '#'} aria-label="Email">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
              <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Zm2.75-.25a.25.25 0 0 0-.25.25v.383l7.293 4.557a.75.75 0 0 0 .414.12h.086a.75.75 0 0 0 .414-.12L21.5 7.133V6.75a.25.25 0 0 0-.25-.25H4.75Zm16 3.346-6.992 4.369a2.25 2.25 0 0 1-1.516.285 2.25 2.25 0 0 1-1.516-.285L3.75 9.846v7.404c0 .138.112.25.25.25h14.5a.25.25 0 0 0 .25-.25V9.846Z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
