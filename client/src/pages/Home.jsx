import { Link } from 'react-router-dom';
import {
  FiZap, FiMic, FiBarChart2, FiTarget, FiFileText, FiTrendingUp,
  FiArrowRight, FiCheckCircle, FiCode, FiStar, FiShield, FiUsers,
  FiGithub, FiTwitter, FiLinkedin,
} from 'react-icons/fi';

/* ── Supported technical roles shown in the landing page ── */
const SUPPORTED_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'Data Engineer', 'ML Engineer', 'AI Engineer',
  'DevOps Engineer', 'SRE', 'Cloud Engineer', 'Cybersecurity Engineer', 'QA Engineer',
  'Mobile Developer', 'iOS Developer', 'Android Developer', 'React Developer',
  'Node.js Developer', 'Python Developer', 'Java Developer', 'UI/UX Designer',
  'Product Engineer', 'Database Administrator', 'System Architect', 'Tech Lead',
  'Engineering Manager', 'CTO', 'Product Manager', 'IT Support', 'Systems Analyst',
];

const FEATURES = [
  {
    icon: <FiZap size={24} />,
    title: 'AI-Powered Questions',
    description: 'Gemini AI generates personalised technical questions tailored to your resume and target role.',
    color: 'blue',
  },
  {
    icon: <FiMic size={24} />,
    title: 'Voice or Text Answers',
    description: 'Answer questions by typing or speaking aloud — your choice, with real-time speech recognition.',
    color: 'purple',
  },
  {
    icon: <FiBarChart2 size={24} />,
    title: 'Instant AI Feedback',
    description: 'Receive detailed scores on relevance, clarity, and confidence with actionable suggestions.',
    color: 'emerald',
  },
  {
    icon: <FiTarget size={24} />,
    title: 'Adaptive Difficulty',
    description: 'The AI adjusts question difficulty based on your past performance to keep you challenged.',
    color: 'amber',
  },
  {
    icon: <FiFileText size={24} />,
    title: 'Resume-Aware',
    description: 'Upload your PDF or DOCX resume and get questions tuned to your actual experience stack.',
    color: 'cyan',
  },
  {
    icon: <FiTrendingUp size={24} />,
    title: 'Progress Dashboard',
    description: 'Track your improvement over time with score trends, category breakdowns, and session history.',
    color: 'rose',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Upload Your Resume',
    description: 'Drop your PDF or DOCX resume. Our AI parses your skills, experience, and background instantly.',
    icon: <FiFileText size={28} />,
  },
  {
    step: '02',
    title: 'Configure Your Session',
    description: 'Pick your target technical role and difficulty level. Let AI adapt as you improve.',
    icon: <FiTarget size={28} />,
  },
  {
    step: '03',
    title: 'Interview & Improve',
    description: 'Answer AI-generated questions by voice or text, get real-time feedback, and track your growth.',
    icon: <FiTrendingUp size={28} />,
  },
];

const WHY_ITEMS = [
  { icon: <FiCheckCircle size={20} />, text: 'Only for technical & software roles — no irrelevant practice' },
  { icon: <FiShield size={20} />, text: 'Private & secure — your resume and data stay with you' },
  { icon: <FiZap size={20} />, text: 'Gemini AI feedback in seconds, not days' },
  { icon: <FiUsers size={20} />, text: 'Trusted by engineers preparing for FAANG-level interviews' },
  { icon: <FiStar size={20} />, text: 'Adaptive difficulty that evolves with your progress' },
  { icon: <FiCode size={20} />, text: 'Questions tailored to your exact tech stack and experience' },
];

export default function Home() {
  return (
    <div className="home-page">
      {/* ── Animated Background Orbs ── */}
      <div className="animated-bg" />

      {/* ── Top Navigation ── */}
      <nav className="home-nav" role="navigation" aria-label="Main navigation">
        <div className="home-nav-inner">
          <Link to="/" className="navbar-brand" aria-label="InterviewAI Home">
            <div className="navbar-brand-icon">🎯</div>
            InterviewAI
          </Link>
          <div className="home-nav-links">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#how-it-works" className="home-nav-link">How It Works</a>
            <a href="#roles" className="home-nav-link">Roles</a>
          </div>
          <div className="home-nav-cta">
            <Link to="/login" className="btn btn-secondary btn-sm" id="home-login-btn">Sign In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm" id="home-signup-btn">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────── HERO ─────────────────────────────────── */}
      <section className="hero-section" aria-labelledby="hero-headline">
        <div className="hero-content">
          <div className="hero-badge" role="note">
            <FiZap size={14} />
            <span>Powered by Gemini AI</span>
          </div>

          <h1 className="hero-headline" id="hero-headline">
            Ace Your Next<br />
            <span className="hero-headline-gradient">Tech Interview</span>
          </h1>

          <p className="hero-sub">
            AI-generated questions tailored to your resume. Voice or text answers. 
            Instant expert feedback. Built exclusively for software engineers.
          </p>

          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg hero-cta-primary" id="hero-signup-btn">
              Start Practicing Free <FiArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              See How It Works
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">30+</div>
              <div className="hero-stat-label">Tech Roles</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-value">AI</div>
              <div className="hero-stat-label">Instant Feedback</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Personalized</div>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card-mockup glass-card">
            <div className="mockup-header">
              <div className="mockup-dot red" />
              <div className="mockup-dot yellow" />
              <div className="mockup-dot green" />
              <span className="mockup-title">InterviewAI — Frontend Developer</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-question">
                <div className="mockup-q-label">Question 3 of 8</div>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: '37.5%' }} />
                </div>
                <p className="mockup-q-text">
                  Explain the difference between <code>useMemo</code> and <code>useCallback</code>. 
                  When would you choose one over the other?
                </p>
                <div className="mockup-badges">
                  <span className="badge badge-technical">technical</span>
                  <span className="badge badge-medium">medium</span>
                </div>
              </div>
              <div className="mockup-answer-box">
                <div className="mockup-answer-label">Your Answer (Voice Active 🎤)</div>
                <p className="mockup-answer-text">
                  Both hooks memoize values to prevent unnecessary re-renders. 
                  useMemo returns a computed value, while useCallback returns a memoized function...
                </p>
              </div>
              <div className="mockup-scores">
                {[
                  { label: 'Relevance', score: 9, color: '#10b981' },
                  { label: 'Clarity',  score: 8, color: '#10b981' },
                  { label: 'Confidence', score: 7, color: '#f59e0b' },
                  { label: 'Overall', score: 8, color: '#10b981' },
                ].map((s) => (
                  <div key={s.label} className="mockup-score-pill">
                    <span style={{ color: s.color, fontWeight: 700 }}>{s.score}</span>
                    <span className="mockup-score-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating accent cards */}
          <div className="hero-float-card hero-float-card-1" aria-hidden="true">
            <FiCheckCircle size={16} color="#10b981" />
            <span>Strong Answer!</span>
          </div>
          <div className="hero-float-card hero-float-card-2" aria-hidden="true">
            <FiTrendingUp size={16} color="#3b82f6" />
            <span>Score: 8.3 / 10</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── FEATURES ─────────────────────────────── */}
      <section className="section features-section" id="features" aria-labelledby="features-heading">
        <div className="section-inner">
          <div className="section-label">What You Get</div>
          <h2 className="section-heading" id="features-heading">
            Everything You Need to<br />Crush Your Technical Interview
          </h2>
          <p className="section-sub">
            From resume-aware questions to instant AI scoring — every tool you need, in one place.
          </p>

          <div className="features-grid">
            {FEATURES.map((feat) => (
              <div key={feat.title} className={`feature-card glass-card feature-card-${feat.color}`}>
                <div className={`feature-icon feature-icon-${feat.color}`}>
                  {feat.icon}
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── HOW IT WORKS ─────────────────────────── */}
      <section className="section how-section" id="how-it-works" aria-labelledby="how-heading">
        <div className="section-inner">
          <div className="section-label">Simple Process</div>
          <h2 className="section-heading" id="how-heading">Get Interview-Ready in 3 Steps</h2>
          <p className="section-sub">
            No complicated setup. Start practicing in under 2 minutes.
          </p>

          <div className="steps-grid">
            {STEPS.map((step, idx) => (
              <div key={step.step} className="step-card glass-card">
                <div className="step-number">{step.step}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
                {idx < STEPS.length - 1 && (
                  <div className="step-connector" aria-hidden="true">
                    <FiArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── SUPPORTED ROLES ──────────────────────── */}
      <section className="section roles-section" id="roles" aria-labelledby="roles-heading">
        <div className="section-inner">
          <div className="section-label">Supported Roles</div>
          <h2 className="section-heading" id="roles-heading">
            Built for Software &amp; Tech Professionals
          </h2>
          <p className="section-sub">
            InterviewAI supports technical roles only — so every question is relevant to what you do.
          </p>

          <div className="roles-grid" role="list" aria-label="Supported technical roles">
            {SUPPORTED_ROLES.map((role) => (
              <div key={role} className="role-chip" role="listitem">
                <FiCode size={13} />
                {role}
              </div>
            ))}
          </div>

          <p className="roles-note">
            🚫 Non-technical roles (Chef, Doctor, Lawyer, Teacher, etc.) are intentionally not supported.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────── WHY CHOOSE US ────────────────────────── */}
      <section className="section why-section" aria-labelledby="why-heading">
        <div className="section-inner why-inner">
          <div className="why-text">
            <div className="section-label">Why InterviewAI</div>
            <h2 className="section-heading left-align" id="why-heading">
              Stop Practicing the Wrong Way
            </h2>
            <p className="section-sub left-align">
              Generic quiz apps don't know your stack. YouTube videos can't give you feedback. 
              InterviewAI is the only tool that combines your resume, AI intelligence, and real-time scoring.
            </p>
            <ul className="why-list" role="list">
              {WHY_ITEMS.map((item) => (
                <li key={item.text} className="why-item" role="listitem">
                  <span className="why-icon">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn btn-primary btn-lg why-cta" id="why-cta-btn">
              Start for Free <FiArrowRight size={18} />
            </Link>
          </div>

          <div className="why-visual" aria-hidden="true">
            <div className="why-stats-card glass-card">
              <div className="why-stat-row">
                <div className="why-stat">
                  <div className="why-stat-value gradient-text">8.4</div>
                  <div className="why-stat-label">Avg Score After 10 Sessions</div>
                </div>
                <div className="why-stat">
                  <div className="why-stat-value gradient-text">3×</div>
                  <div className="why-stat-label">Faster Preparation</div>
                </div>
              </div>
              <div className="why-progress-section">
                <div className="why-progress-label">
                  <span>Technical Knowledge</span>
                  <span style={{ color: '#10b981' }}>87%</span>
                </div>
                <div className="why-progress-bar">
                  <div className="why-progress-fill" style={{ width: '87%', background: 'var(--gradient-emerald)' }} />
                </div>
                <div className="why-progress-label">
                  <span>Communication Clarity</span>
                  <span style={{ color: '#3b82f6' }}>74%</span>
                </div>
                <div className="why-progress-bar">
                  <div className="why-progress-fill" style={{ width: '74%', background: 'var(--gradient-hero)' }} />
                </div>
                <div className="why-progress-label">
                  <span>Problem Solving</span>
                  <span style={{ color: '#8b5cf6' }}>91%</span>
                </div>
                <div className="why-progress-bar">
                  <div className="why-progress-fill" style={{ width: '91%', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }} />
                </div>
              </div>
              <div className="why-testimonial">
                <p>"InterviewAI helped me land my dream role at a Series B startup. The AI feedback was shockingly accurate."</p>
                <div className="why-testimonial-author">— Priya S., Senior Frontend Engineer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── FINAL CTA ────────────────────────────── */}
      <section className="section cta-section" aria-labelledby="final-cta-heading">
        <div className="section-inner cta-inner">
          <div className="cta-glow" aria-hidden="true" />
          <h2 className="cta-heading" id="final-cta-heading">
            Ready to Level Up<br />Your Interview Game?
          </h2>
          <p className="cta-sub">
            Join engineers who are practicing smarter with AI-powered mock interviews.
          </p>
          <div className="cta-btns">
            <Link to="/signup" className="btn btn-primary btn-lg" id="final-cta-btn">
              Get Started — It's Free <FiArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── FOOTER ──────────────────────────────── */}
      <footer className="home-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="navbar-brand footer-logo" aria-label="InterviewAI">
              <div className="navbar-brand-icon">🎯</div>
              InterviewAI
            </Link>
            <p className="footer-tagline">
              AI-powered technical interview preparation — built for engineers, by engineers.
            </p>
            <div className="footer-social" role="list" aria-label="Social links">
              <a href="#" className="footer-social-link" aria-label="GitHub" role="listitem">
                <FiGithub size={18} />
              </a>
              <a href="#" className="footer-social-link" aria-label="Twitter" role="listitem">
                <FiTwitter size={18} />
              </a>
              <a href="#" className="footer-social-link" aria-label="LinkedIn" role="listitem">
                <FiLinkedin size={18} />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#roles">Supported Roles</a>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <Link to="/signup">Sign Up</Link>
              <Link to="/login">Sign In</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
          <p>Only supporting technical &amp; software engineering roles.</p>
        </div>
      </footer>
    </div>
  );
}
