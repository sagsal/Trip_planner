import Link from 'next/link';
import type { ReactNode } from 'react';

export const CONTACT_EMAIL = 'hello@tripshare.org';
export const POLICY_DATE = 'November 18, 2026';

export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <article className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-[#5B6A73] mb-6">Last updated {POLICY_DATE}</p>
        <div className="text-[#2A3A44] leading-relaxed mb-8">{intro}</div>
        <div className="flex flex-col gap-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#13212B] [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#1F6F78] [&_a]:underline">
          {children}
        </div>
        <p className="mt-10 text-sm text-[#5B6A73]">
          See also: <Link href="/privacy" className="text-[#1F6F78] underline">Privacy Policy</Link> · <Link href="/terms" className="text-[#1F6F78] underline">Terms of Use</Link>
        </p>
      </article>
    </div>
  );
}
