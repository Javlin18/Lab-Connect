import Link from "next/link";

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

export function Section({ number, title, children }: SectionProps) {
  return (
    <div className="border-l-4 border-[#C41E3A] pl-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {number}. {title}
      </h2>
      <div className="text-gray-600 leading-relaxed text-[15px] space-y-3">
        {children}
      </div>
    </div>
  );
}

export function PolicyLayout({ title, lastUpdated, children }: PolicyLayoutProps) {
  return (
    <div>
      {/* Hero */}
      <div className="bg-[#F8F9FA] py-10 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#C41E3A] transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{title}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}
