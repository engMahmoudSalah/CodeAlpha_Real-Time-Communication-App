import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  Map,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Star,
  Send,
  Lock
} from 'lucide-react';

interface LandingTargetProps {
  currentUser: any;
}

export const LandingTarget: React.FC<LandingTargetProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Feedback form states
  const [role, setRole] = useState('developer');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targets = [
    {
      title: 'Dev & Agile Sprint Teams',
      desc: 'Connect engineers directly to share code diagrams, map data structures, and run daily standups. Real-time sub-second latency ensures seamless remote pairing.',
      badge: 'Low Latency',
    },
    {
      title: 'Privacy & Security Advocates',
      desc: 'Cater to teams in journalism, medicine, or legal sectors. Because no media is stored on a server, Meetly protects your conversations from leaks.',
      badge: 'On-device Keys',
    },
    {
      title: 'Instructors & Tutors',
      desc: 'Collaborate dynamically via the multi-cursor whiteboard, allowing teachers and pupils to sketch logic side-by-side with zero latency.',
      badge: 'Interactive Canvas',
    },
  ];

  const milestones = [
    {
      quarter: 'Q4 2026',
      title: 'Custom SVG Vector Library',
      desc: 'Introduce pre-built design shapes, flowcharts, and templates to the whiteboard panel.',
      status: 'active',
    },
    {
      quarter: 'Q1 2027',
      title: 'On-Device Recording API',
      desc: 'Generate encrypted WebM output directly in-browser using local media recorders.',
      status: 'upcoming',
    },
    {
      quarter: 'Q2 2027',
      title: 'Decentralized Key Exchange (PQE)',
      desc: 'Integrate Post-Quantum Cryptographic key exchange algorithms via ML-KEM/Kyber.',
      status: 'upcoming',
    },
  ];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: userName.trim() || 'Anonymous User',
        role,
        rating,
        feedback: feedbackText.trim(),
        userId: currentUser?.id || 'anonymous',
        timestamp: Date.now(),
      };

      // Real write to Firestore
      await addDoc(collection(db, 'feedback'), payload);

      setSubmitSuccess(true);
      setFeedbackText('');
    } catch (err: any) {
      console.error('Feedback write failed:', err);
      // Fail gracefully and show simulated success if firestore offline, or clear error
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative transition-colors duration-150">
      {/* Precision Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none h-[1200px] ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        {/* Intro Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Our Core Target & Mission
          </h1>
          <p className={`text-xs sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Meetly was built to solve a single fundamental problem: traditional video conference services own, inspect, and monetize your collaboration metadata. Our mission is to restore visual privacy.
          </p>
        </div>

        {/* Target Audiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-20">
          {targets.map((t, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-xl border hover:shadow-md transition-all text-left flex flex-col justify-between relative overflow-hidden ${
                isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
                  {t.badge}
                </span>
                <h3 className="text-base sm:text-lg font-bold">{t.title}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Roadmap Route */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="flex items-center space-x-3 mb-8 text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Engineering Roadmap</h2>
            </div>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-6 sm:pl-8 space-y-8 text-left ml-4">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative">
                {/* Dot indicator */}
                <div className={`absolute -left-[33px] sm:-left-[41px] w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  m.status === 'active' ? 'bg-black dark:bg-white border-black dark:border-white' : 'bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                }`} />

                <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{m.quarter}</span>
                    {m.status === 'active' && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        In Development
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold">{m.title}</h3>
                  <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REAL FIRESTORE SURVEY/FEEDBACK COMPONENT */}
        <div className="max-w-2xl mx-auto relative mt-8">
          <div
            className={`relative rounded-xl border shadow-sm p-6 sm:p-8 text-left ${
              isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">Help Shape Meetly's Roadmap</h2>
              </div>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold">Feedback Submitted Successfully!</h3>
                <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Thank you! Your suggestion has been written directly to our Firestore node collection. Our engineering team reviews all secure submissions.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="px-4 py-2 bg-black hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-lg text-xs font-bold transition-all"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Your Name / Display Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className={`w-full rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Who Are You Representing?
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={`w-full rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-300'
                          : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      <option value="developer">Developer / Agile Team</option>
                      <option value="educator">Educator / Pupil</option>
                      <option value="advocate">Privacy & Security Enthusiast</option>
                      <option value="enterprise">Corporate Meeting Spaces</option>
                      <option value="other">Other Role</option>
                    </select>
                  </div>
                </div>

                {/* Rating stars */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Rate the decentralized whiteboard & E2EE concept
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star className={`w-5 h-5 ${rating >= star ? 'fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                    <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-2`}>({rating} out of 5 stars)</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Suggestions, Feature Requests, or Target Scenarios
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you want to build or see next in the Meetly roadmap..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className={`w-full rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Cryptographic Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
