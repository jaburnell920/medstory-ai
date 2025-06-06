// src/app/dashboard/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

import Link from 'next/link';
import clsx from 'clsx';

export default function Dashboard() {
  const { status } = useSession();
  const { data: session } = useSession();

  const pathname = usePathname();

  const router = useRouter();

  const saveResult = async () => {
    try {
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });

      if (res.ok) {
        toast.success('Result saved successfully!');
      } else {
        throw new Error('Failed to save result');
      }
    } catch (err) {
      toast.error('Failed to save result. Please try again.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const [form, setForm] = useState({
    drug: '',
    disease: '',
    audience: '',
    intensity: '',
  });

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setResult('Something went wrong.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const linkClass =
    'text-gray-200 hover:text-orange-300 hover:underline transition-all duration-200';
  const selectedLinkClass = 'text-orange-400 underline font-semibold';

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div className="flex min-h-screen text-black">
      {/* Sidebar */}
      <aside className="w-72 bg-[#002F6C] text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold text-orange-400 mb-4">
          MEDSTORY<span className="text-white">AI</span>
        </h2>

        <nav className="flex flex-col space-y-6 text-sm">
          {/* Section: Scientific Investigation */}
          <div>
            <p className="font-bold text-white mb-1">🔬 Scientific Investigation</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/scientific-investigation/landmark-publications">
                  Find landmark publications
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/scientific-investigation/top-publications">
                  Top N most important publications
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/scientific-investigation/thought-leaders">
                  Top N most important thought leaders
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: Stakeholder Interviews */}
          <div>
            <p className="font-bold text-white mb-1">🎤 Stakeholder Interviews</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/questions">
                  Suggested questions for thought leader interviews
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/analyze-transcript">
                  Analyze thought leader interview transcript
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/stakeholder-interviews/simulated-interview">
                  Simulated thought leader interview
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: Core Story Concept */}
          <div>
            <p className="font-bold text-white mb-1">🎯 Core Story Concept</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link
                  href="/dashboard"
                  className={clsx(linkClass, pathname === '/dashboard' && selectedLinkClass)}
                >
                  Core Story Concept creation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/core-story-concept/optimization">
                  Core Story Concept optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/core-story-concept/evaluation">
                  Core Story Concept evaluation
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: Story Flow Map */}
          <div>
            <p className="font-bold text-white mb-1">🗺️ Story Flow Map</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/story-flow-map/tension-resolution-generation">
                  Tension-Resolution Point generation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/story-flow-map/tension-resolution-optimization">
                  Tension-Resolution Point optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/story-flow-map/generation-optimization">
                  Story Flow Map generation & optimization
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>

          {/* Section: Slide Presentation */}
          <div>
            <p className="font-bold text-white mb-1">📽️ MEDSTORY Slide Presentation</p>
            <ul className="ml-4 space-y-1 text-gray-200">
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-generation">
                  MEDSTORY deck generation
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-optimization">
                  MEDSTORY deck optimization
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/slide-presentation/deck-evaluation">
                  MEDSTORY deck evaluation
                </Link>
              </li>
              <li>
                <Link
                  className={clsx(linkClass, 'text-blue-300')}
                  href="/scientific-investigation/more"
                >
                  More...
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Sign out button */}
        <p className=" mt-auto px-3 py-1.5 rounded self-start ml-24 text-xs text-gray-400">
          Hello, {session?.user?.name || 'Guest'}!
        </p>
        <button
          onClick={() => signOut()}
          className="mt-auto bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-semibold self-start ml-24"
        >
          Sign out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-10">
          Welcome to Core Story Concept creation!
        </h1>
        <p className="text-sm text-gray-600 mb-10">
          <strong>MEDSTORYmake</strong> can generate 1 to 5 Core Story Concept candidates—the big
          idea, the moral of your story—that you want to communicate to target audiences.
        </p>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-300 shadow-md rounded-lg p-6 space-y-6 w-full lg:w-1/2"
          >
            <p className="text-sm text-gray-600">
              Please provide the following information in order to proceed:
            </p>
            <div>
              <label className="block font-bold mb-1 text-gray-800">Drug or intervention</label>
              <input
                type="text"
                name="drug"
                value={form.drug}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2 text-black"
                placeholder="Enter drug name"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-gray-800">Disease or condition</label>
              <input
                type="text"
                name="disease"
                value={form.disease}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2 text-black"
                placeholder="Enter disease or condition"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-gray-800">Audience</label>
              <input
                type="text"
                name="audience"
                value={form.audience}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2 text-black"
                placeholder="Target audience (e.g., physicians, researchers)"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-gray-800">
                Intensity of emotion/creativity
              </label>
              <select
                name="intensity"
                value={form.intensity}
                onChange={handleChange}
                className="border rounded w-full px-3 py-2 text-black"
              >
                <option value="">Select intensity</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 w-full"
            >
              Submit to AI
            </button>
          </form>

          {/* Right Column: Result */}
          <div className="flex-1 space-y-6">
            {loading && <p className="text-gray-500">Generating core story...</p>}

            {result && (
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md space-y-6">
                <h2 className="text-xl font-bold text-blue-900">Core Story Concept Candidate</h2>
                {result.split('\n\n').map((block, i) => (
                  <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{block}</p>
                  </div>
                ))}
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    className="px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-50 transition"
                    onClick={saveResult}
                  >
                    Save
                  </button>
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-50 transition">
                    View Next Core Story Concept
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
