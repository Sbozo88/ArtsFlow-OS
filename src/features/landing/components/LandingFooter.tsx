import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Shield, Heart } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-primary-500 to-amber-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-extrabold text-xl text-white tracking-tight">
                ArtsFlow <span className="text-primary-400 font-semibold text-lg">OS</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Purpose-built arts programme and academy administration software for schools, music academies, and dance studios.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for performing arts educators</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#capabilities" className="hover:text-white transition-colors">
                  Capabilities
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Compare Plans
                </Link>
              </li>
              <li>
                <Link to="/start-trial" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                  Start 14-Day Trial
                </Link>
              </li>
            </ul>
          </div>

          {/* Access & Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Access & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/portal/login" className="hover:text-white transition-colors">
                  Parent / Guardian Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Contact & Support
            </h4>
            <div className="space-y-2.5 text-sm">
              <a
                href="mailto:support@artsflow.co.za"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <span>support@artsflow.co.za</span>
              </a>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Multi-tenant data isolation & secure cloud hosting.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ArtsFlow OS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <span>v1.1 Release</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
