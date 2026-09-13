import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import { APP_CONFIG } from "../../config/config";

const PrivacyPage: React.FC = () => {
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: August 2026</p>
          </div>

          <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
            <p>
              At {APP_CONFIG.appName}, accessible from our application, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by {APP_CONFIG.appName} and how we use it.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <p>
              The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
            </p>
            <p>
              If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
            </p>
            <p>
              When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and maintain our application</li>
              <li>Improve, personalize, and expand our application</li>
              <li>Understand and analyze how you use our application</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the application, and for marketing and promotional purposes</li>
              <li>Send you emails</li>
              <li>Find and prevent fraud</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Log Files</h2>
            <p>
              {APP_CONFIG.appName} follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p>
              We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately, after they are posted on this page.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
