import React, { useEffect } from 'react'
import { ScrollReveal } from './ScrollReveal'

interface PrivacyPolicyPageProps {
  setActive?: (page: string) => void
  onEnrollNow?: () => void
}

export default function PrivacyPolicyPage({ setActive, onEnrollNow }: PrivacyPolicyPageProps) {
  useEffect(() => {
    document.title = 'Privacy Policy – Abhyudaya Preschool'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden rainbow-page-bg">
      <div className="rainbow-bar h-1.5" />

      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:py-20 relative z-10">
        {/* Breadcrumb & Navigation */}
        <ScrollReveal>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#7a5a8a] mb-6">
            <button
              onClick={() => setActive?.('Home')}
              className="hover:text-[#5a3a8a] font-semibold underline cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-bold text-[#3d2a50]">Privacy Policy</span>
          </div>
        </ScrollReveal>

        {/* Hero Header */}
        <ScrollReveal className="text-center mb-10 sm:mb-12">
          <span className="text-4xl sm:text-5xl inline-block mb-3 animate-bounce-soft">🛡️</span>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#5a3a8a]/10 text-[#5a3a8a] text-xs font-black uppercase tracking-wider mb-3">
            <span>🔒</span> Transparency &amp; Trust
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-[#5a3a8a] mb-3"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#6a5a7a] max-w-2xl mx-auto font-medium">
            At <strong>Abhyudaya Preschool &amp; Daycare</strong>, we cherish the trust you place in us when sharing details about your family. This policy outlines how we responsibly collect, protect, and use your information.
          </p>
          <p className="text-xs text-[#8a7a9a] mt-2">
            Effective Date: November 2026 · Location: SS Nagar, Perumanallur
          </p>
        </ScrollReveal>

        {/* Policy Content Container */}
        <div className="space-y-6 sm:space-y-8">
          {/* Section 1: Information We Collect */}
          <ScrollReveal delay={50}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e0d0f8]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#e0d0f8] flex items-center justify-center text-xl shrink-0">
                  📝
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#3d2a50]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  1. Information We Collect
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#5a4a6a] leading-relaxed mb-4">
                When you interact with our website, book a campus visit, or submit an admission enquiry form, we collect only the necessary details required to understand your child&apos;s educational needs:
              </p>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-[#f0e8f8]">
                  <div className="font-bold text-[#5a3a8a] mb-1 flex items-center gap-1.5">
                    <span>👤</span> Parent &amp; Guardian Details
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#6a5a7a] text-xs sm:text-sm">
                    <li>Full Name of the parent or guardian</li>
                    <li>Primary Phone &amp; WhatsApp number</li>
                    <li>Email address (for confirmations &amp; brochures)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-[#f0e8f8]">
                  <div className="font-bold text-[#5a3a8a] mb-1 flex items-center gap-1.5">
                    <span>🎒</span> Child &amp; Enquiry Details
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#6a5a7a] text-xs sm:text-sm">
                    <li>Child&apos;s Name &amp; Age Group</li>
                    <li>Program of interest (Playgroup, Nursery, LKG, UKG, Daycare)</li>
                    <li>Preferred campus visit date &amp; time slot</li>
                    <li>Optional messages, notes, or specific requirements</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Section 2: How We Use Your Information */}
          <ScrollReveal delay={100}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#b8f0d8]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#b8f0d8] flex items-center justify-center text-xl shrink-0">
                  🎯
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#3d2a50]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  2. Purpose &amp; How We Use Information
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#5a4a6a] leading-relaxed mb-4">
                We use the submitted information strictly for preschool-related educational, administrative, and communicative purposes:
              </p>

              <ul className="space-y-2.5 text-sm sm:text-base text-[#5a4a6a]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#1a6a45] font-bold text-lg leading-none mt-0.5">✓</span>
                  <span><strong>Responding to Enquiries:</strong> Connecting with you via phone, WhatsApp, or email to answer questions regarding admissions and curriculum.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#1a6a45] font-bold text-lg leading-none mt-0.5">✓</span>
                  <span><strong>Campus Visit Coordination:</strong> Confirming your scheduled walkthrough appointment during school hours (9:00 AM – 4:00 PM).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#1a6a45] font-bold text-lg leading-none mt-0.5">✓</span>
                  <span><strong>Preschool Information &amp; Updates:</strong> Sharing syllabus overviews, fee structures, event announcements, and academic calendar dates.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#1a6a45] font-bold text-lg leading-none mt-0.5">✓</span>
                  <span><strong>Daycare &amp; Onboarding Care:</strong> Planning age-appropriate care, timing allocations, and safe student-teacher ratios.</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Section 3: Secure Storage & Database Protection */}
          <ScrollReveal delay={150}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#b8d8f8]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#b8d8f8] flex items-center justify-center text-xl shrink-0">
                  🗄️
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#3d2a50]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  3. Secure Storage &amp; Data Protection
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#5a4a6a] leading-relaxed mb-3">
                Your data is stored and handled with modern cybersecurity safeguards using our production backend and database architecture:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs sm:text-sm mb-4">
                <div className="p-3.5 rounded-2xl bg-[#f0f8ff] border border-[#d8e8f8]">
                  <div className="font-bold text-[#2a507a] mb-1">🔐 HTTPS &amp; TLS</div>
                  <div className="text-[#5a6a7a]">All web traffic and form submissions are encrypted in transit via secure SSL/TLS.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f0f8ff] border border-[#d8e8f8]">
                  <div className="font-bold text-[#2a507a] mb-1">🛡️ Protected Databases</div>
                  <div className="text-[#5a6a7a]">Enquiry records are stored in enterprise-grade cloud databases with encryption at rest.</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f0f8ff] border border-[#d8e8f8]">
                  <div className="font-bold text-[#2a507a] mb-1">🔑 Access Control</div>
                  <div className="text-[#5a6a7a]">Admin dashboard access is strictly restricted to verified staff via cryptographic tokens.</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#7a6a8a] italic">
                We do not collect sensitive payment card numbers, banking credentials, or Aadhaar numbers through our online enquiry forms.
              </p>
            </div>
          </ScrollReveal>

          {/* Section 4: No Sale of Personal Information */}
          <ScrollReveal delay={200}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#ffd6b0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd6b0] flex items-center justify-center text-xl shrink-0">
                  🚫
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#3d2a50]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  4. We Never Sell Your Information
                </h2>
              </div>
              <div className="p-4 rounded-2xl bg-[#fff7ef] border border-[#f5e0c8] mb-3">
                <p className="text-sm sm:text-base text-[#6a4020] font-bold">
                  Abhyudaya Preschool does NOT sell, rent, lease, trade, barter, or distribute your or your child&apos;s personal information to any third-party advertisers, data brokers, or marketing companies.
                </p>
              </div>
              <p className="text-sm sm:text-base text-[#5a4a6a] leading-relaxed">
                Information provided to us is solely used by Abhyudaya Preschool educators and administrative staff to assist you with your school admission enquiries and enrolled child care.
              </p>
            </div>
          </ScrollReveal>

          {/* Section 5: Data Retention & Parent Rights */}
          <ScrollReveal delay={250}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#e0d0f8]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#e0d0f8] flex items-center justify-center text-xl shrink-0">
                  ⚖️
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#3d2a50]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  5. Your Rights as a Parent
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#5a4a6a] leading-relaxed mb-3">
                We believe parents should have complete control over their personal information:
              </p>
              <ul className="space-y-2 text-sm text-[#5a4a6a] mb-4">
                <li>• <strong>Access &amp; Review:</strong> You may request a summary of the contact information we have on record.</li>
                <li>• <strong>Correction &amp; Update:</strong> You may update your phone number, email address, or enquiry details at any time.</li>
                <li>• <strong>Deletion / Erasure:</strong> If you choose not to proceed with admission, you may request that your enquiry record be permanently deleted from our database.</li>
              </ul>
              <p className="text-xs sm:text-sm text-[#7a5a8a]">
                To exercise any of these rights, email us directly at{' '}
                <a href="mailto:abhyudayapreschool@gmail.com" className="font-bold underline text-[#5a3a8a]">
                  abhyudayapreschool@gmail.com
                </a>
                .
              </p>
            </div>
          </ScrollReveal>

          {/* Section 6: Contact Information */}
          <ScrollReveal delay={300}>
            <div className="bg-gradient-to-br from-[#2d1a40] to-[#4a3060] text-white rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  📬
                </div>
                <h2
                  className="text-xl sm:text-2xl font-black text-[#e0d0f8]"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  6. Contact Us Regarding Privacy
                </h2>
              </div>
              <p className="text-sm sm:text-base text-[#d8c8e8] mb-6 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or your family&apos;s data, please contact our administration:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#ffd6b0] mb-1">Privacy Email</div>
                  <a
                    href="mailto:abhyudayapreschool@gmail.com"
                    className="font-bold text-white hover:text-[#e0d0f8] underline break-all text-sm sm:text-base"
                  >
                    abhyudayapreschool@gmail.com
                  </a>
                  <div className="text-xs text-[#b0a0c0] mt-1">Dedicated address for data &amp; policy queries</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#b8f0d8] mb-1">Admissions Phone</div>
                  <a
                    href="tel:+919788713822"
                    className="font-bold text-white hover:text-[#b8f0d8] text-sm sm:text-base"
                  >
                    +91 97887 13822 / 0422 2233822
                  </a>
                  <div className="text-xs text-[#b0a0c0] mt-1">Available 8:30 AM – 7:30 PM (Mon–Sat)</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-[#b0a0c0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>📍 No. 3-546, NH Road, SS Nagar, Perumanallur, Tamil Nadu</span>
                <span>Daycare &amp; Preschool Hours: 8:30 AM – 7:30 PM</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Section 7: Administrative Notice & Confirmation Items */}
          <ScrollReveal delay={350}>
            <div className="p-5 sm:p-6 rounded-2xl bg-[#fffcee] border border-[#f5e4a0] text-[#6a5410]">
              <div className="flex items-center gap-2 mb-2 font-black text-sm uppercase tracking-wide text-[#7a6010]">
                <span>📋</span> Pre-Publication Verification Checklist (For School Management)
              </div>
              <p className="text-xs sm:text-sm leading-relaxed mb-2">
                In compliance with best privacy documentation practices, please confirm the following administrative items prior to formal legal filing:
              </p>
              <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside">
                <li><strong>Entity Registration:</strong> Confirmation of exact registered trust/society name associated with Abhyudaya Preschool.</li>
                <li><strong>Data Retention Schedule:</strong> Confirmation of target retention timeline for inactive enquiry records (standard: 12 months from submission).</li>
                <li><strong>Website Analytics:</strong> If third-party visitor analytics (e.g., Google Analytics or Meta Pixel) are deployed in the future, this policy will be updated with cookie disclosure.</li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Bottom Actions */}
          <ScrollReveal delay={400} className="text-center pt-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setActive?.('Home')}
                className="px-6 py-3 rounded-full bg-white text-[#5a3a8a] border-2 border-[#5a3a8a] font-bold text-sm hover:bg-[#5a3a8a]/5 transition-all cursor-pointer"
              >
                ← Back to Home
              </button>
              <button
                onClick={onEnrollNow || (() => setActive?.('Contact'))}
                className="btn-primary px-7 py-3 rounded-full bg-gradient-to-r from-[#5a3a8a] to-[#7a4aba] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                Book a Campus Tour 🎒
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
