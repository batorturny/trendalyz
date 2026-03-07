import type { Metadata } from 'next';
import { TrendalyzLogo } from '@/components/TrendalyzLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy | Trendalyz',
  description: 'Trendalyz adatvédelmi irányelvek és felhasználási feltételek.',
};

const sections = [
  {
    number: '01',
    title: 'Introduction',
    color: 'from-violet-500 to-indigo-500',
    bg: 'bg-violet-50 border-violet-100',
    content: (
      <>
        <p className="text-gray-600 leading-relaxed">
          Trendalyz operates a social media analytics platform that allows businesses to connect
          their social media accounts and view performance metrics. This Privacy Policy explains
          how we collect, use, store, and protect information when you use our service at{' '}
          <span className="font-semibold text-gray-800">trendalyz.hu</span>.
        </p>
        <p className="text-gray-600 leading-relaxed mt-3">
          By using Trendalyz, you agree to the collection and use of information in accordance
          with this policy.
        </p>
      </>
    ),
  },
  {
    number: '02',
    title: 'Data We Collect',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 border-blue-100',
    content: (
      <>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
            <ul className="space-y-1">
              {['Name and email address', 'Encrypted password (bcrypt hashed)', 'Company name and contact details'].map(i => (
                <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Social Media Platform Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { platform: 'Facebook', color: 'bg-blue-100 text-blue-700', data: 'Page impressions, reach, follower count, post metrics' },
                { platform: 'Instagram', color: 'bg-pink-100 text-pink-700', data: 'Impressions, reach, profile views, media metrics' },
                { platform: 'TikTok', color: 'bg-red-100 text-red-700', data: 'Video views, likes, comments, shares' },
                { platform: 'YouTube', color: 'bg-red-100 text-red-700', data: 'Views, likes, comments, watch time' },
              ].map(item => (
                <div key={item.platform} className="bg-white rounded-xl p-3 border border-gray-100">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.color}`}>{item.platform}</span>
                  <p className="text-gray-500 text-xs mt-1.5">{item.data}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Authentication Tokens</h3>
            <p className="text-gray-600 text-sm">
              OAuth access tokens are stored encrypted using <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">AES-256-GCM</span> encryption.
              Used solely to fetch analytics data on your behalf.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    number: '03',
    title: 'How We Use Your Data',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 border-emerald-100',
    content: (
      <>
        <ul className="space-y-2">
          {[
            'Display social media analytics and performance metrics',
            'Generate automated reports and send them via email',
            'Authenticate and maintain your session securely',
            'Send transactional emails (report delivery, notifications)',
            'Improve our service and troubleshoot technical issues',
          ].map(item => (
            <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-200">
          <p className="text-emerald-700 text-sm font-semibold">
            We do not sell your data to third parties and we do not use your data for advertising.
          </p>
        </div>
      </>
    ),
  },
  {
    number: '04',
    title: 'Facebook & Instagram Data',
    color: 'from-blue-600 to-purple-500',
    bg: 'bg-indigo-50 border-indigo-100',
    content: (
      <>
        <p className="text-gray-600 text-sm mb-4">
          Trendalyz uses the Facebook Graph API and Instagram Graph API. By connecting your account,
          you authorize the following permissions:
        </p>
        <div className="space-y-2">
          {[
            { perm: 'pages_show_list', desc: 'List Facebook Pages you manage' },
            { perm: 'pages_read_engagement', desc: 'Read post engagement data' },
            { perm: 'read_insights', desc: 'Read page-level analytics & demographics' },
            { perm: 'instagram_basic', desc: 'Access basic Instagram account info' },
            { perm: 'instagram_manage_insights', desc: 'Read Instagram analytics' },
            { perm: 'ads_read', desc: 'Read Facebook Ads performance data (optional)' },
          ].map(item => (
            <div key={item.perm} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100">
              <code className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono flex-shrink-0">{item.perm}</code>
              <span className="text-gray-500 text-xs">{item.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-4">
          You can revoke access at any time via Facebook Settings → Apps and Websites.
        </p>
      </>
    ),
  },
  {
    number: '05',
    title: 'Data Storage & Security',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 border-amber-100',
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: '🇪🇺', title: 'EU Servers', desc: 'Hetzner, Germany — GDPR compliant' },
          { icon: '🔐', title: 'AES-256-GCM', desc: 'OAuth tokens encrypted at rest' },
          { icon: '🔒', title: 'HTTPS / TLS', desc: 'All data in transit encrypted' },
          { icon: '🛡️', title: 'Bcrypt passwords', desc: 'Never stored in plain text' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl p-3 border border-amber-100 flex items-start gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: '06',
    title: 'Your Rights (GDPR)',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50 border-rose-100',
    content: (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { right: 'Access', desc: 'Request a copy of your personal data' },
            { right: 'Rectification', desc: 'Correct inaccurate personal data' },
            { right: 'Erasure', desc: 'Right to be forgotten' },
            { right: 'Restriction', desc: 'Restrict processing of your data' },
            { right: 'Portability', desc: 'Receive data in machine-readable format' },
            { right: 'Object', desc: 'Object to processing of your data' },
          ].map(item => (
            <div key={item.right} className="bg-white rounded-xl p-3 border border-rose-100">
              <p className="font-semibold text-rose-600 text-sm">Right to {item.right}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-4">
          To exercise any right, email{' '}
          <a href="mailto:bator.turny@gmail.com" className="text-rose-500 hover:underline font-medium">
            bator.turny@gmail.com
          </a>
          . We respond within 30 days.
        </p>
      </>
    ),
  },
  {
    number: '07',
    title: 'Data Deletion',
    color: 'from-slate-600 to-slate-800',
    bg: 'bg-slate-50 border-slate-100',
    content: (
      <>
        <p className="text-gray-600 text-sm mb-3">You can request deletion of your data at any time:</p>
        <ul className="space-y-2">
          {[
            'Email us at bator.turny@gmail.com',
            'Disconnect social accounts from within the Trendalyz dashboard',
            'Revoke app access through Facebook / Instagram / TikTok settings',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-gray-600 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-500 text-xs mt-4">
          All personal data permanently deleted within 30 days of request.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f4f4f6]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <TrendalyzLogo size="md" />
          <span className="text-xs text-gray-400">Last updated: 2026-03-06</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            GDPR Compliant
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            We take your privacy seriously. Here&apos;s exactly what data we collect,
            how we use it, and how we protect it.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {sections.map((section) => (
          <div key={section.number} className={`bg-white rounded-2xl border ${section.bg} overflow-hidden shadow-sm`}>
            {/* Section header */}
            <div className={`bg-gradient-to-r ${section.color} px-6 py-4 flex items-center gap-4`}>
              <span className="text-white/60 font-mono text-sm font-bold">{section.number}</span>
              <h2 className="text-white font-bold text-lg">{section.title}</h2>
            </div>
            {/* Section body */}
            <div className="px-6 py-5">
              {section.content}
            </div>
          </div>
        ))}

        {/* Contact card */}
        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-8 text-center text-white shadow-lg">
          <TrendalyzLogo size="md" showText={true} className="justify-center mb-4 [&_span]:text-white" />
          <p className="text-white/80 text-sm mb-4">Questions about this Privacy Policy?</p>
          <a
            href="mailto:bator.turny@gmail.com"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            bator.turny@gmail.com
          </a>
          <p className="text-white/50 text-xs mt-6">
            © {new Date().getFullYear()} Trendalyz · trendalyz.hu
          </p>
        </div>
      </div>

    </div>
  );
}
