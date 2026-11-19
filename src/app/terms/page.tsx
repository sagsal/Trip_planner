import Link from 'next/link';
import { LegalPage, CONTACT_EMAIL } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Use · Share and Plan' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <p>
          Welcome to Share and Plan (tripshare.org). By creating an account or using the site, you agree to these terms and to our{' '}
          <Link href="/privacy">Privacy Policy</Link>. Please read them. If you don’t agree, please don’t use the site.
        </p>
      }
    >
      <section>
        <h2>1. Who can use Share and Plan</h2>
        <p>You must be at least 18 years old. Please give accurate information when you sign up, keep your password private, and use one account per person. You’re responsible for what happens under your account.</p>
      </section>

      <section>
        <h2>2. Your content</h2>
        <ul>
          <li>You own the trips, reviews, notes, photos links and comments you add.</li>
          <li>So that the site can work, you give us permission to store, display and share your content on Share and Plan and in links people share from it, and to let other members use it on the site, for example by saving your places to their Sandbox or receiving AI suggestions based on shared trips. This permission ends when you delete the content, except for copies others have already saved to their own plans and our backups for about 30 days.</li>
          <li>Shared trips are public. Only share what you’re happy for anyone to see.</li>
          <li>Only post content you have the right to share, and don’t post other people’s private information.</li>
        </ul>
      </section>

      <section>
        <h2>3. Be a good member</h2>
        <p>Please don’t:</p>
        <ul>
          <li>post anything illegal, hateful, harassing, sexually explicit or threatening;</li>
          <li>post spam, advertising, or fake or paid-for reviews;</li>
          <li>pretend to be someone else;</li>
          <li>copy the site’s content in bulk, scrape it, or get around limits or security;</li>
          <li>upload anything harmful, or try to disrupt the site.</li>
        </ul>
        <p>In Advice, keep advice friendly and constructive. A trip’s planner can set aside or delete comments on their trip.</p>
      </section>

      <section>
        <h2>4. Travel information and AI suggestions</h2>
        <p>
          Trips on Share and Plan are shared by members, and some information (such as places, photos and Google reviews) comes from other services.
          AI suggestions can be wrong or out of date. Share and Plan is not a travel agent and doesn’t book anything. Always check opening times,
          prices, safety and entry requirements yourself before you travel or book. Links to other websites are provided for convenience; we’re not
          responsible for their content.
        </p>
      </section>

      <section>
        <h2>5. Our rights</h2>
        <p>
          We may remove content, or suspend or delete accounts, that break these terms or put other members or the site at risk. We may change,
          add or remove features at any time.
        </p>
      </section>

      <section>
        <h2>6. Ending your account</h2>
        <p>You can stop using the site at any time. To delete your account and everything in it, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>7. No guarantees</h2>
        <p>
          Share and Plan is provided “as is”. We work hard to keep it running and accurate, but we can’t promise it will always be available,
          error-free, or that information on it is complete or correct.
        </p>
      </section>

      <section>
        <h2>8. Limits on our responsibility</h2>
        <p>
          To the extent the law allows, Share and Plan is not responsible for indirect or unexpected losses, or for losses arising from trips,
          bookings or decisions based on information on the site. Nothing in these terms limits rights you have under the law that can’t be limited.
        </p>
      </section>

      <section>
        <h2>9. Changes to these terms</h2>
        <p>If we make significant changes, we’ll update the date above and let members know. Continuing to use the site after that means you accept the updated terms.</p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}
