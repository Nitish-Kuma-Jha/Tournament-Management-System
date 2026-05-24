import { Link } from 'react-router-dom'
import { Trophy, Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-dark-700/50 bg-dark-900/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-glow">
                <Trophy size={16} className="text-dark-950" />
              </div>
              <span className="font-display font-bold text-lg text-dark-50">Tournament<span className="text-primary-500">.</span></span>
            </div>
            <p className="text-dark-500 text-sm leading-relaxed max-w-sm">
              The most powerful tournament management platform for sports organizations. 
              Organize, manage, and track tournaments with enterprise-grade tools.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Twitter, href: '#' },
                { icon: Github, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Mail, href: 'mailto:support@tournamentsystem.com' },
              ].map(({ icon: Icon, href }, i) => (
                <a key={i} href={href} className="w-9 h-9 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-400 hover:text-primary-400 hover:border-primary-500/40 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-dark-200 text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {['Tournaments', 'Teams', 'Leaderboard', 'Live Scores'].map(link => (
                <li key={link}><Link to="#" className="text-dark-500 text-sm hover:text-dark-300 transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-dark-200 text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                <li key={link}><Link to="#" className="text-dark-500 text-sm hover:text-dark-300 transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-dark-600 text-xs">© {new Date().getFullYear()} Tournament System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-dark-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
