import { LegalPage, CONTACT_EMAIL } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy · Share and Plan' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Share and Plan (tripshare.org) is a place to share the details of your trips and plan new ones from other travelers’ itineraries.
          This policy explains what information we collect, how we use it, who we share it with, and the choices you have.
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      }
    >
      <section>
        <h2>1. What we collect</h2>
        <ul>
          <li><b>Your account:</b> your name, email address and password. Passwords are stored scrambled (hashed), so we can’t read them.</li>
          <li><b>About you (optional):</b> the region and country you’re from and your age bracket, if you choose to give them.</li>
          <li><b>What you add:</b> your trips (countries, cities, month and year, number of days, flights, hotels, restaurants, activities, ratings, reviews, notes and links), your Sandbox (planned trips and saved places), and comments you post in Help me plan.</li>
          <li><b>What you type into AI features:</b> for example a description in “Describe it”, a question to the trip finder, a request to Fill with AI, or notes you import.</li>
          <li><b>Technical information:</b> a sign-in cookie that keeps you signed in, small settings saved in your browser (such as tour progress or a closed announcement), and standard server logs (such as IP address, browser type and time of a request) used for security and fixing problems.</li>
        </ul>
        <p>We don’t use advertising trackers, and we don’t sell your information.</p>
      </section>

      <section>
        <h2>2. How we use it</h2>
        <ul>
          <li>To run the site: create your account, keep you signed in, save and show your trips and plans.</li>
          <li>To power features you use, such as place search and photos, AI suggestions, and Help me plan.</li>
          <li>To email you about your account and about the site (for example, important changes or new features). Every non-essential email has an unsubscribe link.</li>
          <li>To keep the site safe: preventing spam and abuse, and suspending accounts that break our Terms of Use.</li>
          <li>To understand how the site is used, through totals and summaries (for example, how many members joined this month). Small groups are combined so individuals can’t be singled out.</li>
          <li>Your optional region, country and age may be used to suggest trips from travelers like you. They are never shown to other members.</li>
        </ul>
      </section>

      <section>
        <h2>3. What other people can see</h2>
        <ul>
          <li><b>Shared trips</b> can be seen by anyone, including people without an account, and can be shared as links. Your name is not shown on them.</li>
          <li><b>Drafts and private trips</b> are visible only to you.</li>
          <li><b>Your Sandbox</b> is private, unless you choose “Ask for feedback” on a planned trip. Then members who are signed in can see that planned trip and comment on it.</li>
          <li><b>Comments</b> in Help me plan show your first name only.</li>
          <li>Your <b>email address</b> is never shown to other members.</li>
        </ul>
      </section>

      <section>
        <h2>4. Services we use</h2>
        <p>We rely on a few trusted companies to run the site. They process information only to provide their service to us:</p>
        <ul>
          <li><b>Our hosting provider</b> runs the server and database where the site and your information are stored.</li>
          <li><b>Google (Places)</b> provides place search, photos, and Google ratings and reviews when you ask for them. Searches you make are sent to Google. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s Privacy Policy</a> applies to its services.</li>
          <li><b>Anthropic (Claude AI)</b> processes the text you enter into AI features, together with relevant trip information from the site, to produce suggestions.</li>
          <li><b>Resend</b> sends our emails.</li>
          <li><b>Backblaze</b> stores private nightly backups of our database.</li>
          <li><b>Netlify</b> manages our domain name.</li>
        </ul>
        <p>These providers may process information in the United States or other countries.</p>
        <p>We may also disclose information if required by law, or to protect the safety of our members or the site.</p>
      </section>

      <section>
        <h2>5. How long we keep it</h2>
        <p>
          We keep your information for as long as you have an account. When you delete something, or we delete your account at your request, it is
          removed from the site straight away and from our backups within about 30 days. Server logs are kept only for a short time.
        </p>
      </section>

      <section>
        <h2>6. Your choices and rights</h2>
        <ul>
          <li>You can edit or delete your trips and Sandbox at any time.</li>
          <li>You can unsubscribe from our emails using the link in any of them.</li>
          <li>You can ask us for a copy of your information, to correct it, or to delete your account and everything in it, by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
          <li>Depending on where you live (for example the EU, the UK or California), you may have further rights, such as objecting to certain uses of your information or complaining to your local data protection authority. We will respect them.</li>
        </ul>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We protect your information with encrypted connections (HTTPS), scrambled passwords, signed sign-in cookies that can’t be forged, and
          limits that guard against misuse. No website can be perfectly secure, so please use a password you don’t use elsewhere.
        </p>
      </section>

      <section>
        <h2>8. Age</h2>
        <p>Share and Plan is for people aged 18 and over. We don’t knowingly collect information from anyone younger.</p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>If we make significant changes, we’ll update the date above and let members know by email or with a notice on the site.</p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with any questions or requests about your information.</p>
      </section>
    </LegalPage>
  );
}
