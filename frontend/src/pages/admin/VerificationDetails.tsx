import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, Download, FileText, CheckCircle2, ShieldCheck, Clock, CheckCircle, Briefcase, CreditCard, Store, MoreVertical } from "lucide-react";
import { api } from "../../services/api";
import { formatDateTime } from "../../utils/helpers";
import { useConfirm } from "../../context/ConfirmContext";
import toast from "react-hot-toast";

const REQUIRED_DOCUMENTS = [
  { 
    type: "BUSINESS_LICENSE", 
    label: "Business License", 
    description: "Official business registration document issued by government.",
    required: true,
    icon: FileText,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50"
  },
  { 
    type: "FOOD_SERVICE_LICENSE", 
    label: "Food Service License", 
    description: "Health and safety certification for food handling.",
    required: true,
    icon: ShieldCheck,
    iconColor: "text-green-500",
    iconBg: "bg-green-50"
  },
  { 
    type: "OWNER_ID", 
    label: "Owner ID", 
    description: "Government-issued ID of the business owner.",
    required: true,
    icon: CreditCard,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50"
  },
  { 
    type: "BUSINESS_REGISTRATION", 
    label: "Business Registration", 
    description: "Tax ID or company registration certificate.",
    required: false,
    icon: Briefcase,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50"
  }
];

const VerificationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<{ [docId: string]: string }>({});

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/verification/restaurant/${id}/documents`);
      setDocuments(data.data);
    } catch (err) {} 
    finally { setLoading(false); }
  };

  const handleDocumentAction = async (docId: string, status: string) => {
    try {
      setActionLoading(true);
      const adminComment = comments[docId] || "";
      await api.put(`/verification/document/${docId}/status`, { status, adminComment });
      await fetchDocs();
      toast.success(`Document marked as ${status.toLowerCase()}.`);
    } catch (err) {
      toast.error("Failed to update document status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestaurantAction = async (action: string) => {
    const isApprove = action === "approve";
    const confirmed = await confirm({
      title: isApprove ? "Approve Restaurant Verification?" : "Reject / Request Verification Changes?",
      message: isApprove
        ? "Are you sure you want to approve this restaurant? They will be verified and allowed to accept live orders."
        : "Are you sure you want to reject this verification submission? The restaurant will be notified.",
      confirmText: isApprove ? "Approve Restaurant" : "Confirm Rejection",
      cancelText: "Cancel",
      type: isApprove ? "success" : "danger",
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await api.put(`/verification/restaurant/${id}/verification`, {
        action,
        reason: isApprove ? "Compliance verification approved by administrator." : "Documents failed compliance criteria."
      });
      toast.success(isApprove ? "Restaurant verified and approved!" : "Verification decision submitted.");
      navigate("/admin/verification");
    } catch (err) {
      toast.error("Failed to update restaurant status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-sm">Loading documents from Cloudinary...</p>
      </div>
    );
  }

  const uploadedDocsCount = REQUIRED_DOCUMENTS.filter(reqDoc => documents.some(d => d.documentType === reqDoc.type)).length;
  const approvedDocsCount = documents.filter(d => d.status === "APPROVED").length;
  
  const requiredDocs = REQUIRED_DOCUMENTS.filter(d => d.required);
  const allRequiredApproved = requiredDocs.every(reqDoc => documents.some(d => d.documentType === reqDoc.type && d.status === "APPROVED"));
  
  // Progress goes from 25% (uploaded) to 75% (all required approved)
  const progressPercent = documents.length === 0 ? 0 : 25 + Math.floor((approvedDocsCount / requiredDocs.length) * 50);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate("/admin/verification")}
            className="flex items-center gap-2 text-xs font-bold text-[#F97316] hover:text-orange-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
          </button>
          <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Review Compliance Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Review all Cloudinary-hosted documents before final approval.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleRestaurantAction("changes_requested")}
            disabled={actionLoading}
            className="border border-[#F97316] text-[#F97316] hover:bg-orange-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Request Changes
          </button>
          <button 
            onClick={() => handleRestaurantAction("approve")}
            disabled={!allRequiredApproved || actionLoading}
            className="bg-[#F97316] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Restaurant
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 flex flex-col md:flex-row gap-8 shadow-sm">
        <div className="md:w-5/12 flex flex-col justify-center">
          <div className="flex items-start gap-4 mb-2">
            <div className="w-12 h-12 bg-orange-50 text-[#F97316] rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">Verification Status</h3>
                <span className="px-2.5 py-1 bg-orange-50 text-[#F97316] text-[10px] font-extrabold uppercase tracking-wider rounded-md">
                  PENDING REVIEW
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                All documents must be individually approved before the restaurant can go live.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-gray-100 to-transparent"></div>

        {/* Right Side: Progress */}
        <div className="md:w-7/12 flex flex-col justify-center">
          <div className="flex justify-between text-sm font-bold text-gray-900 mb-3">
            <span>Verification Progress</span>
            <span className="text-gray-500 font-medium">
              {allRequiredApproved ? requiredDocs.length : approvedDocsCount} of {requiredDocs.length} required approved
            </span>
          </div>
          
          <div className="w-full bg-gray-100 h-2.5 rounded-full mb-8 relative overflow-hidden">
            <div className="bg-[#F97316] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="flex justify-between relative px-2">
            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 25 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <FileText className="w-5 h-5" />
                {progressPercent >= 25 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5 text-white" /></div>}
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Upload Documents</div>
              <div className="text-[10px] text-green-600 font-medium">{uploadedDocsCount}/{REQUIRED_DOCUMENTS.length} completed</div>
            </div>

            <div className="absolute top-5 left-[12%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 50 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Under Review</div>
              <div className={`text-[10px] ${progressPercent >= 50 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>Pending admin review</div>
            </div>

            <div className="absolute top-5 left-[37%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 75 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Get Verified</div>
              <div className={`text-[10px] ${progressPercent >= 75 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>Approval & activation</div>
            </div>

            <div className="absolute top-5 left-[62%] w-[20%] h-px bg-gray-200 border border-dashed border-gray-300"></div>

            <div className="flex flex-col items-center text-center relative z-10 w-1/4">
              <div className={`w-10 h-10 bg-white border shadow-sm rounded-xl flex items-center justify-center mb-3 transition-colors ${progressPercent >= 100 ? 'border-[#F97316] text-[#F97316]' : 'border-gray-100 text-gray-400'}`}>
                <Store className="w-5 h-5" />
              </div>
              <div className="font-bold text-gray-900 text-[11px] mb-1">Go Live</div>
              <div className={`text-[10px] ${progressPercent >= 100 ? 'text-[#F97316] font-medium' : 'text-gray-500'}`}>Start receiving orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Required Documents Title */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Required Documents</h3>
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400 cursor-help">i</div>
          </div>
          <p className="text-xs text-gray-500">Review and verify each document carefully.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Document Guidelines
          </button>
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 pl-8 pr-8 py-1.5 hover:border-gray-300 outline-none cursor-pointer shadow-sm">
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
            </select>
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {REQUIRED_DOCUMENTS.map((reqDoc) => {
          const doc = documents.find(d => d.documentType === reqDoc.type);
          const isApproved = doc?.status === "APPROVED";
          const isRejected = doc?.status === "REJECTED";

          return (
            <div key={reqDoc.type} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors gap-6">
              
              {/* Left: Info */}
              <div className="flex items-start gap-4 w-72 shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${reqDoc.iconBg} ${reqDoc.iconColor}`}>
                  <reqDoc.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-sm">{reqDoc.label}</h4>
                    {doc ? (
                      <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                        isApproved ? "bg-green-100 text-green-700" :
                        isRejected ? "bg-red-100 text-red-700" :
                        "bg-orange-50 text-[#F97316]"
                      }`}>
                        {isApproved ? "APPROVED" : isRejected ? "REJECTED" : "UPLOADED"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-extrabold rounded uppercase tracking-wider">
                        NOT UPLOADED
                      </span>
                    )}
                  </div>
                  {doc ? (
                    <>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[200px] mb-0.5">{doc.originalName}</p>
                      <p className="text-[10px] text-gray-400">Uploaded: {formatDateTime(doc.createdAt).split(' at ')[0]} • 1.2 MB</p>
                    </>
                  ) : (
                    <p className="text-[11px] text-gray-400 leading-snug">{reqDoc.description}</p>
                  )}
                </div>
              </div>

              {/* Middle: Preview & View Btn */}
              {doc ? (
                <div className="flex items-center gap-6 flex-1 justify-center xl:justify-start pl-4 border-l border-gray-100">
                  <div className="w-16 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden relative group cursor-pointer flex items-center justify-center">
                    {doc.mimeType?.includes('image') ? (
                      <img src={doc.fileUrl} alt="preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="text-[8px] font-bold text-gray-400 uppercase">PDF</div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDownload(doc.fileUrl)}
                    className="flex items-center gap-2 text-xs font-bold text-[#F97316] hover:text-orange-600 transition-colors"
                  >
                    <Download className="w-4 h-4" /> View on Cloudinary
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex justify-center">
                  <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg px-6 py-3 flex flex-col items-center justify-center opacity-50 cursor-not-allowed w-48">
                    <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5 mb-1"><Download className="w-3 h-3 rotate-180" /> Upload Document</span>
                    <span className="text-[9px] text-gray-400">PDF, JPG, PNG (Max. 5MB)</span>
                  </div>
                </div>
              )}

              {/* Right: Actions */}
              <div className="flex items-center gap-3 w-auto xl:w-[450px] shrink-0 justify-end">
                {doc && (
                  <>
                    <input
                      placeholder="Add feedback / reason for rejection..."
                      value={comments[doc._id] || doc.adminComment || ""}
                      onChange={(e) => setComments({ ...comments, [doc._id]: e.target.value })}
                      disabled={isApproved}
                      className="flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[11px] text-gray-700 outline-none focus:border-orange-400 focus:bg-white transition-colors"
                    />
                    <button 
                      onClick={() => handleDocumentAction(doc._id, "REJECTED")}
                      disabled={actionLoading || isRejected}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                        isRejected 
                          ? 'border-red-600 text-white bg-red-500' 
                          : 'border-red-100 text-red-500 hover:bg-red-50 bg-white'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" /> {isRejected ? "Rejected" : "Reject"}
                    </button>
                    <button 
                      onClick={() => handleDocumentAction(doc._id, "APPROVED")}
                      disabled={actionLoading || isApproved}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                        isApproved 
                          ? 'border-green-600 text-white bg-green-500' 
                          : 'border-green-100 text-green-600 hover:bg-green-50 bg-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> {isApproved ? "Approved" : "Approve"}
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </>
                )}
                {!doc && (
                  <div className="w-6 h-6 flex justify-end items-center">
                    <button className="text-gray-300 cursor-not-allowed p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Pagination placeholder matching mockup */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-400">
          <div>Showing 1 to {REQUIRED_DOCUMENTS.length} of {REQUIRED_DOCUMENTS.length} documents</div>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ArrowLeft className="w-3 h-3" /></button>
            <button className="w-7 h-7 rounded bg-[#F97316] text-white flex items-center justify-center font-bold">1</button>
            <button className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ArrowLeft className="w-3 h-3 rotate-180" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetails;
