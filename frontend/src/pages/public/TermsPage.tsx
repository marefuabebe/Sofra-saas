import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import { APP_CONFIG } from "../../config/config";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans antialiased flex flex-col relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-50">
        <Navbar />
      </div>

      <div className="flex-1 relative z-10 px-4 pt-12 pb-24 w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-4">
          <Link to="/" className="inline-flex items-center text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-16">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-500">Last updated: August 2026</p>
          </div>

          <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
            <p>
              Welcome to {APP_CONFIG.appName}. By accessing our website or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on {APP_CONFIG.appName}'s website for personal, non-commercial transitory viewing only.
            </p>
            <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on our website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Disclaimer</h2>
            <p>
              The materials on {APP_CONFIG.appName}'s website are provided on an 'as is' basis. {APP_CONFIG.appName} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Limitations</h2>
            <p>
              In no event shall {APP_CONFIG.appName} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Revisions and Errata</h2>
            <p>
              The materials appearing on {APP_CONFIG.appName}'s website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete or current. We may make changes to the materials contained on its website at any time without notice.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
