import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInterceptor from "@/hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function ClearanceUploadModal({
  item,
  onClose,
}) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      // First upload the file to get the key
      const uploadRes = await axiosInterceptor.post("/api/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileKey = uploadRes.data.files[0].key;

      // Then update the resignation record
      return mutationHandler(
        axiosInterceptor.post(`/api/employees/resignations/${item.id}/clearance`, {
          clearance_file_key: fileKey,
        })
      );
    },
    onSuccess: () => {
      showToast("Clearance form uploaded successfully!", "success");
      queryClient.invalidateQueries(["dashboardSummary"]);
      queryClient.invalidateQueries(["resignations"]);
      setTimeout(onClose, 1500);
    },
    onError: (error) => {
      showToast(error.message || "Failed to upload clearance form", "error");
      setIsUploading(false);
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "error");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("requiredFiles", file); 
    
    uploadMutation.mutate(formData);
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Upload Exit Clearance
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold">Resignation ID: #{item.id}</p>
            <p className="mt-1">Please upload your completed and signed Exit Clearance Form.</p>
          </div>

          <div 
            className={`relative mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              file 
                ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10" 
                : "border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500"
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              accept=".pdf,.doc,.docx,image/*"
            />
            
            {file ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600"
                >
                  Remove File
                </button>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Click or drag to upload</p>
                <p className="mt-1 text-xs text-gray-500">PDF, Word, or Images (Max 5MB)</p>
              </>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all active:scale-95"
            >
              {isUploading ? "Uploading..." : "Submit Clearance"}
            </button>
          </div>
        </div>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
