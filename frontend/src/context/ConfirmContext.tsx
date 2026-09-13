import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  details?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof opts === "string") {
        setOptions({
          title: "Confirmation Required",
          message: opts,
          confirmText: "Confirm",
          cancelText: "Cancel",
          type: "warning",
        });
      } else {
        setOptions({
          title: opts.title || "Confirmation Required",
          message: opts.message,
          confirmText: opts.confirmText || "Confirm",
          cancelText: opts.cancelText || "Cancel",
          type: opts.type || "warning",
          details: opts.details,
        });
      }
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            className="bg-gradient-to-b from-gray-950 via-zinc-900 to-black text-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                options.type === "danger"
                  ? "bg-rose-500/20"
                  : options.type === "success"
                  ? "bg-emerald-500/20"
                  : options.type === "info"
                  ? "bg-blue-500/20"
                  : "bg-amber-500/20"
              }`}
            />

            {/* Header Icon + Close */}
            <div className="flex items-start justify-between gap-3 relative z-10 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                  options.type === "danger"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    : options.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : options.type === "info"
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                }`}
              >
                {options.type === "danger" ? (
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                ) : options.type === "success" ? (
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                ) : options.type === "info" ? (
                  <Info className="w-6 h-6 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                )}
              </div>

              <button
                onClick={handleCancel}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Message */}
            <div className="relative z-10 space-y-2 mb-6">
              <h3 className="text-lg font-black text-white tracking-tight">
                {options.title}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {options.message}
              </p>
              {options.details && (
                <p className="text-xs text-zinc-500 bg-white/5 p-3 rounded-xl border border-white/5 font-mono">
                  {options.details}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 relative z-10">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-zinc-300 transition-colors"
              >
                {options.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md ${
                  options.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                    : options.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                    : options.type === "info"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                    : "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[#F97316]/30"
                }`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};
