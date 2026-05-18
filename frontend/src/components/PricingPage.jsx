import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Users, Building2, ArrowLeft } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Forever',
    cta: 'Get started',
    ctaVariant: 'outline',
    color: '#6366f1',
    icon: <Zap size={18} />,
    features: [
      '3 boards',
      'Unlimited visitors',
      'Basic shapes',
      'Export as PNG',
      'Version history (3 days)',
    ],
    missing: ['Template library', 'Advanced permissions', 'Priority support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 8, yearly: 6 },
    description: 'per user / month',
    cta: 'Start free trial',
    ctaVariant: 'primary',
    color: '#6366f1',
    icon: <Zap size={18} />,
    popular: true,
    features: [
      'Unlimited boards',
      'Template library',
      'Upload files',
      'Export as PNG',
      'Advanced permissions',
      'Version history (30 days)',
    ],
    missing: ['Priority support'],
  },
  {
    id: 'team',
    name: 'Team',
    price: { monthly: 16, yearly: 12 },
    description: 'per user / month',
    cta: 'Start free trial',
    ctaVariant: 'primary',
    color: '#06b6d4',
    icon: <Users size={18} />,
    features: [
      'Everything in Pro',
      'Unlimited boards',
      'Template library',
      'Upload files',
      'Export as PNG',
      'Advanced permissions',
      'Version history (90 days)',
      'Priority support',
    ],
    missing: [],
  },
];

const FAQS = [
  { q: 'Can I change plans later?', a: 'Yes — upgrade or downgrade any time. Changes apply immediately and are prorated.' },
  { q: 'Is there a free trial?', a: 'Pro and Team both include a 14-day free trial, no credit card required.' },
  { q: 'How does per-user pricing work?', a: 'You\'re billed for each seat on your workspace. Guests with view-only access are always free.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes — contact our sales team for nonprofit, education, and startup pricing.' },
];

export default function PricingPage({ currentUser }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pricing-root">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="lp-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </div>
            <span className="lp-logo-text">Boardly</span>
          </div>
          <div className="lp-nav-links">
            {['Product', 'Solutions', 'Resources', 'Pricing'].map(l => (
              <button key={l} className={`lp-nav-link${l === 'Pricing' ? ' active' : ''}`}
                onClick={() => l === 'Pricing' ? null : navigate('/')}>
                {l}
              </button>
            ))}
          </div>
          <div className="lp-nav-actions">
            {currentUser ? (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
                <button className="lp-btn-primary" onClick={() => navigate('/register')}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pricing-hero">
        <h1 className="pricing-title">Simple, transparent pricing</h1>
        <p className="pricing-sub">Choose the plan that works for your team.</p>

        {/* Billing toggle */}
        <div className="pricing-toggle">
          <button
            className={`ptoggle-btn${billing === 'monthly' ? ' active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`ptoggle-btn${billing === 'yearly' ? ' active' : ''}`}
            onClick={() => setBilling('yearly')}
          >
            Yearly
            <span className="ptoggle-badge">Save 25%</span>
          </button>
        </div>
      </section>

      {/* Cards */}
      <section className="pricing-cards-wrap">
        <div className="pricing-cards">
          {PLANS.map(plan => (
            <div key={plan.id} className={`pricing-card${plan.popular ? ' pricing-card--popular' : ''}`}>
              {plan.popular && <div className="pricing-popular-badge">Most popular</div>}

              <div className="pricing-card-header">
                <div className="pricing-plan-icon" style={{ background: `${plan.color}18`, color: plan.color }}>
                  {plan.icon}
                </div>
                <div className="pricing-plan-name">{plan.name}</div>
              </div>

              <div className="pricing-price-row">
                <span className="pricing-currency">$</span>
                <span className="pricing-amount">
                  {billing === 'yearly' ? plan.price.yearly : plan.price.monthly}
                </span>
                {plan.price.monthly > 0 && (
                  <span className="pricing-period">/ user / month</span>
                )}
              </div>
              {plan.price.monthly === 0 && (
                <div className="pricing-desc">Forever</div>
              )}
              {plan.price.monthly > 0 && billing === 'yearly' && (
                <div className="pricing-desc">Billed annually</div>
              )}

              <button
                className={`pricing-cta-btn${plan.ctaVariant === 'primary' ? ' pricing-cta-btn--primary' : ''}`}
                onClick={() => navigate(currentUser ? '/dashboard' : '/register')}
              >
                {plan.cta}
              </button>

              <div className="pricing-divider" />

              <ul className="pricing-features">
                {plan.features.map(f => (
                  <li key={f} className="pricing-feature">
                    <Check size={14} className="pricing-check" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="pricing-feature pricing-feature--missing">
                    <span className="pricing-dash">—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section className="pricing-enterprise">
        <div className="pricing-enterprise-inner">
          <div className="pricing-enterprise-icon">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="pricing-enterprise-title">Need a custom plan for your organization?</h3>
            <p className="pricing-enterprise-sub">SSO, audit logs, advanced security, and dedicated support — let's talk.</p>
          </div>
          <button className="pricing-contact-btn">Contact sales →</button>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq">
        <h2 className="pricing-faq-title">Frequently asked questions</h2>
        <div className="pricing-faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`pricing-faq-item${openFaq === i ? ' open' : ''}`}>
              <button className="pricing-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {faq.q}
                <span className="pricing-faq-icon">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <div className="pricing-faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo-icon" style={{ width: 24, height: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Boardly</span>
          </div>
          <div className="lp-footer-links">
            {['Privacy', 'Terms', 'Security', 'Status', 'Blog'].map(l => (
              <span key={l} className="lp-footer-link">{l}</span>
            ))}
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Boardly, Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}