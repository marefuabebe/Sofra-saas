import React, { useState, useEffect } from "react";
import {
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Eye,
  MoreVertical,
  Headphones,
  Info,
  ArrowRight,
  Lock,
  Search,
  Bell,
  Calendar,
  Check,
  ArrowUp
} from "lucide-react";
import { Card, Button, Loading, Alert } from "../../components/ui";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface VerificationDocument {
  _id: string;
  documentType: string;
  fileUrl: string;
  originalName: string;
  status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  adminComment?: string;
}

const REQUIRED_DOCUMENTS = [
  { 
    type: "BUSINESS_LICENSE", 
    label: "Business License", 
    description: "Official business registration document issued by government.",
    required: true,
    icon: FileText,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-100"
  },
  { 
    type: "FOOD_SERVICE_LICENSE", 
    label: "Food Service License", 
    description: "Health and safety certification for food handling and preparation.",
    required: true,
    icon: ShieldCheck,
    iconColor: "text-green-500",
    iconBg: "bg-green-100"
  },
  { 
    type: "OWNER_ID", 
    label: "Owner Identification", 
    description: "Government-issued ID of the business owner.",
    required: true,
    icon: CreditCard,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100"
  },
  { 
    type: "BUSINESS_REGISTRATION", 
    label: "Business Registration", 
    description: "Tax ID or company registration certificate.",
    required: false,
    icon: Briefcase,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-100"
  },
];

interface VerificationCenterProps {
  isHomeMode?: boolean;
}

const VerificationCenter: React.FC<VerificationCenterProps> = ({ isHomeMode = false }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const meRes = await api.get("/auth/me");
      const docsRes = await api.get("/verification/documents");
      
      setRestaurant(meRes.data.data);
      setDocuments(docsRes.data.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load verification data.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingType(type);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", type);

      await api.post("/verification/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully!");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload document");
      toast.error("Failed to upload document");
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      setSubmitLoading(true);
      setError(null);
      await api.post("/verification/submit");
      toast.success("Successfully sent for verification!");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit verification");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <Loading text="Loading Verification Center..." />;

  const isReadyToSubmit = REQUIRED_DOCUMENTS.filter(doc => doc.required).every((reqDoc) => 
    documents.some((d) => d.documentType === reqDoc.type && (d.status === "UPLOADED" || d.status === "APPROVED" || d.status === "UNDER_REVIEW"))
  );

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const globalStatus = restaurant?.verificationStatus || "PENDING";
  
  const uploadedCount = REQUIRED_DOCUMENTS.filter(reqDoc => documents.some(d => d.documentType === reqDoc.type)).length;
  const totalDocs = REQUIRED_DOCUMENTS.length;
  
  let progressPercent = 5;
  if (globalStatus === 'APPROVED') {
    progressPercent = 100;
  } else if (globalStatus === 'PENDING' || globalStatus === 'PENDING_VERIFICATION' || globalStatus === 'UNDER_REVIEW') {
    progressPercent = 50;
  } else {
    progressPercent = 5 + (uploadedCount / totalDocs) * 20;
  }

  const isPending = ['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(globalStatus);

  return (
    <div className={`space-y-6 pb-20 ${isHomeMode ? '' : 'max-w-7xl mx-auto'}`}>
      {/* Top Header */}
      {!isHomeMode && (
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
              Verification Center <div className="w-5 h-5 bg-[#F97316] rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>
            </h2>
            <p className="text-gray-500 text-sm">
              Upload required documents to verify and activate your restaurant on SOFRA.
            </p>
          </div>
        </div>
      )}

      {error && <Alert type="error" message={error} />}

      {/* Top Status & Progress Card */}
      <div className="bg-[#fffcf9] border border-[#ffedd5] rounded-2xl shadow-sm flex flex-col md:flex-row p-6 md:p-8 gap-8">
        {/* Left Side: Status */}
        <div className="md:w-5/12 flex flex-col justify-center">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 border border-orange-200">
              <ShieldCheck className="w-6 h-6 text-[#F97316]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {isHomeMode ? (isPending ? "Verification Under Review" : "Your Restaurant is Unverified") : "Verification Status"}
                </h3>
                {!isHomeMode && (
                  <span className="px-2.5 py-1 bg-orange-100 text-[#F97316] text-[10px] font-extrabold uppercase tracking-wider rounded-md">
                    {globalStatus.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                {isPending 
                  ? "Your verification documents have been submitted and are currently under review by our team."
                  : isHomeMode 
                    ? "You're almost there! Complete your verification to make your restaurant live on SOFRA." 
                    : "Complete the checklist below and submit for review. Our team will verify your documents within 1-2 business days."}
              </p>
              {isHomeMode && !isPending && (
                <button 
                  onClick={() => navigate('/dashboard/verification')}
                  className="px-5 py-2 rounded-xl font-bold text-sm text-[#F97316] border border-[#F97316] hover:bg-orange-50 transition-colors"
                >
                  Start Verification
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-[#ffedd5] to-transparent"></div>

        {/* Right Side: Progress */}
        <div className="md:w-7/12 flex flex-col justify-center">
          <div className="flex justify-between text-sm font-bold text-gray-900 mb-3">
            <span>Verification Progress</span>
            <span className={isHomeMode ? "text-[#F97316]" : "text-gray-500 font-medium"}>
              {isHomeMode ? `${Math.round(progressPercent)}%` : `${uploadedCount} of ${totalDocs} completed`}
            </span>
          </div>
          
          <div className="w-full bg-gray-100 h-2.5 rounded-full mb-8 relative overflow-hidden">
            <div className="bg-[#F97316] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="flex justify-between relative px-2">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 ${progressPercent >= 25 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Upload Documents</div>
              <div className={`text-[10px] ${isHomeMode ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>
                {isHomeMode ? `${uploadedCount} of ${totalDocs} completed` : "Submit all required docs"}
              </div>
            </div>

            <div className="absolute top-5 left-[12%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 50 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Under Review</div>
              <div className={`text-[10px] ${isHomeMode && progressPercent >= 50 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>{isHomeMode ? "Pending admin review" : "Our team is reviewing"}</div>
            </div>

            <div className="absolute top-5 left-[37%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 75 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Get Verified</div>
              <div className={`text-[10px] ${isHomeMode && progressPercent >= 75 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>{isHomeMode ? "Approval & activation" : "Your restaurant goes live"}</div>
            </div>

            <div className="absolute top-5 left-[62%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 100 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Go Live</div>
              <div className={`text-[10px] ${isHomeMode && progressPercent >= 100 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>{isHomeMode ? "Start receiving orders" : "Grow your business"}</div>
            </div>
          </div>
        </div>
      </div>

      <div id="documents-section" className="flex flex-col lg:flex-row gap-6">
        {/* Main Left Column */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-900">{isHomeMode ? "Verification Requirements" : "Required Documents"}</h3>
              {isHomeMode && <p className="text-sm text-gray-500 mt-1">Please upload all the required documents below.</p>}
            </div>
            <button 
              onClick={() => toast("Guidelines: Ensure all uploaded documents are clear, readable, and legally valid. Formats accepted: PDF, JPG, PNG.", { icon: "📋" })}
              className="flex items-center text-gray-700 text-sm font-bold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Info className="w-4 h-4 mr-1.5 text-gray-400" />
              View Guidelines
            </button>
          </div>

          <Card className="p-1 border border-gray-100 shadow-sm bg-white divide-y divide-gray-50">
            {REQUIRED_DOCUMENTS.map((reqDoc) => {
              const existingDoc = documents.find((d) => d.documentType === reqDoc.type);
              
              return (
                <div key={reqDoc.type} className="flex flex-col xl:flex-row xl:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${reqDoc.iconBg}`}>
                      <reqDoc.icon className={`w-6 h-6 ${reqDoc.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{reqDoc.label}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${reqDoc.required ? 'bg-orange-50 text-[#F97316]' : 'bg-gray-100 text-gray-500'}`}>
                          {reqDoc.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{reqDoc.description}</p>
                      
                      {existingDoc ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold text-red-600">PDF</span>
                          </div>
                          <span className="text-xs text-gray-700 font-medium truncate max-w-[200px]">{existingDoc.originalName}</span>
                          <span className="text-xs text-gray-400 ml-1">1.2 MB</span>
                        </div>
                      ) : (
                        <div className="relative border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors inline-flex items-center px-4 py-2 mt-1">
                          {isHomeMode ? (
                            <div onClick={() => navigate('/dashboard/verification')} className="cursor-pointer absolute inset-0 w-full h-full z-10"></div>
                          ) : (
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => handleFileUpload(e, reqDoc.type)}
                              disabled={uploadingType === reqDoc.type}
                            />
                          )}
                          <Upload className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-600 font-medium">Upload file <span className="font-normal text-gray-400">(PDF, JPG, PNG)</span></span>
                        </div>
                      )}

                      {existingDoc?.adminComment && (
                        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg flex items-start border border-red-100">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          <span>{existingDoc.adminComment}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex items-center justify-between xl:justify-end gap-4 shrink-0 pl-16 xl:pl-0">
                    {existingDoc ? (
                      <>
                        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                          Uploaded
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.open(existingDoc.fileUrl, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button 
                            onClick={() => toast("Document removal is locked while under compliance review. Contact support for updates.", { icon: "🔒" })}
                            className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-400 font-medium">Not uploaded</span>
                        <div className="flex items-center gap-2 relative">
                          {isHomeMode ? (
                            <div onClick={() => navigate('/dashboard/verification')} className="cursor-pointer absolute inset-0 w-full h-full z-10"></div>
                          ) : (
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => handleFileUpload(e, reqDoc.type)}
                              disabled={uploadingType === reqDoc.type}
                            />
                          )}
                          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                            <ArrowUp className="w-3.5 h-3.5" /> Upload
                          </button>
                          <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Bottom Lock & Submit */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center text-gray-500 text-sm font-medium">
              <Lock className="w-4 h-4 mr-2" />
              Your documents are secure and encrypted
            </div>
            {isHomeMode ? (
              <button 
                onClick={() => navigate('/dashboard/verification')}
                className="flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all bg-[#0f172a] hover:bg-gray-800 text-white shadow-md shadow-gray-900/10"
              >
                Go to Verification Center
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button 
                onClick={handleSubmitVerification}
                disabled={!isReadyToSubmit || submitLoading}
                className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  isReadyToSubmit && !submitLoading 
                    ? "bg-[#0f172a] hover:bg-gray-800 text-white shadow-md shadow-gray-900/10" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {submitLoading ? "Submitting..." : "Submit for Verification"}
                {!submitLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="w-full lg:w-80 space-y-6">
          <Card className="p-6 border border-gray-100 shadow-sm bg-white">
            <h3 className="font-bold text-gray-900 mb-6">What happens next?</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:w-px before:bg-gray-100 before:-z-10">
              
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center shrink-0 border border-white">
                  <ArrowUp className="w-4 h-4 text-[#F97316]" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Upload Documents</h4>
                  <p className="text-xs text-gray-500">Submit all required documents</p>
                </div>
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-white">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Under Review</h4>
                  <p className="text-xs text-gray-500">Our verification team reviews</p>
                </div>
                <div className="w-5 h-5 border-2 border-gray-200 rounded-full shrink-0 mt-0.5"></div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center shrink-0 border border-white">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 mt-0.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Get Verified</h4>
                  <p className="text-xs text-gray-500">Access all features and go live</p>
                </div>
                <div className="w-5 h-5 border-2 border-gray-200 rounded-full shrink-0 mt-0.5"></div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-gray-100 shadow-sm bg-white">
            <h3 className="font-bold text-gray-900 mb-2">Need help?</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Our support team is here to help you through the verification process.
            </p>
            <button 
              onClick={() => window.location.href = 'mailto:support@sofra.com'}
              className="flex items-center justify-between w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 mb-6 group"
            >
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                Contact Support
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Average verification time</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">1-2</span>
                  <span className="text-xs font-semibold text-gray-500">business days</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerificationCenter;
