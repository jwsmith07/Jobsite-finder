import { Link } from 'react-router-dom'

export default function AccessibilityPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 sm:p-10">
        <p className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-300">
          Accessibility
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Accessibility Commitment
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
          Jobsite Finder is committed to making our platform accessible to everyone, including people with disabilities. We work continuously to improve accessibility across all features.
        </p>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Our Accessibility Commitment</h2>
          <p className="mt-4 text-slate-300">
            We believe technology should work for everyone. Jobsite Finder is designed and maintained with accessibility in mind, following web accessibility standards and best practices. We are committed to:
          </p>
          <ul className="mt-4 ml-4 space-y-2 list-disc text-slate-300">
            <li>Compliance with WCAG 2.1 Level AA standards where feasible</li>
            <li>Keyboard navigation support throughout the platform</li>
            <li>Screen reader compatibility</li>
            <li>Clear, readable text with sufficient contrast ratios</li>
            <li>Responsive design that works on all devices</li>
            <li>Ongoing accessibility testing and improvement</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Mobile-Friendly Access</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Jobsite Finder is fully responsive and works on:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Desktop computers (Mac, Windows, Linux)</li>
              <li>Tablets (iPad, Android tablets)</li>
              <li>Mobile phones (iOS, Android)</li>
              <li>All modern web browsers (Chrome, Firefox, Safari, Edge)</li>
            </ul>
            <p className="mt-3">
              The platform is optimized for both touch and keyboard/mouse input.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Navigation &amp; Usability</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              We design for clarity and ease of use:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li>Clear, intuitive navigation menus</li>
              <li>Descriptive page titles and headings</li>
              <li>Form labels and instructions</li>
              <li>Consistent layout across pages</li>
              <li>Skip links to jump to main content</li>
              <li>Logical tab order for keyboard navigation</li>
              <li>Clear visual focus indicators</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Keyboard Accessibility</h2>
          <p className="mt-4 text-slate-300">
            All features can be accessed using keyboard alone:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Navigate using Tab and Shift+Tab</li>
            <li>Activate buttons and links with Enter or Space</li>
            <li>Close modals with Escape</li>
            <li>Access menus and dropdowns with arrow keys</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Screen Reader Compatibility</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder uses semantic HTML and ARIA labels to support screen readers:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Alternative text for all images and icons</li>
            <li>Proper heading hierarchy</li>
            <li>Form field labels and error messages</li>
            <li>Live region announcements for dynamic content</li>
            <li>Compatible with popular screen readers (NVDA, JAWS, VoiceOver)</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Visual Design</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            <p>
              Our design prioritizes readability and clarity:
            </p>
            <ul className="ml-4 space-y-2 list-disc text-slate-400">
              <li><strong>Color Contrast:</strong> Text meets WCAG AA standards (4.5:1 minimum)</li>
              <li><strong>Font Size:</strong> Readable text, resizable up to 200%</li>
              <li><strong>Line Spacing:</strong> Generous line height for readability</li>
              <li><strong>Color Independence:</strong> Information not conveyed by color alone</li>
              <li><strong>Animations:</strong> Respectful of prefers-reduced-motion setting</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Accessibility Issues or Feedback</h2>
          <p className="mt-4 text-slate-300">
            If you encounter accessibility barriers on Jobsite Finder:
          </p>
          <ol className="mt-3 ml-4 space-y-2 list-decimal text-slate-300">
            <li>Describe the issue and which page it's on</li>
            <li>Include your browser, device, and assistive technology (if applicable)</li>
            <li><Link to="/contact" className="text-yellow-400 hover:text-yellow-300">Contact us</Link> with details about the issue</li>
            <li>We will investigate and work to resolve the issue promptly</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Assistive Technology Support</h2>
          <p className="mt-4 text-slate-300">
            Jobsite Finder is designed to work with:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Screen readers (NVDA, JAWS, VoiceOver, Narrator)</li>
            <li>Voice control and speech recognition</li>
            <li>Text magnification tools</li>
            <li>High contrast display modes</li>
            <li>Captions and transcripts (where applicable)</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <h2 className="text-xl font-bold text-white">Continuous Improvement</h2>
          <p className="mt-4 text-slate-300">
            We are committed to ongoing accessibility improvements:
          </p>
          <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-300">
            <li>Regular accessibility audits and testing</li>
            <li>User feedback integration</li>
            <li>Staying current with web accessibility standards</li>
            <li>Training our team on accessible design practices</li>
            <li>Prioritizing accessibility in new feature development</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <h2 className="text-lg font-bold text-yellow-300 mb-3">Accessibility Statement</h2>
          <p className="text-slate-300">
            Jobsite Finder strives to ensure that all users, including those with disabilities, can access and use our platform. While we work continuously to improve accessibility, if you have difficulty accessing any feature or content, please <a href="/contact" className="text-yellow-400 hover:text-yellow-300">contact us</a>. Your feedback helps us serve you better.
          </p>
        </div>
      </section>
    </div>
  )
}
