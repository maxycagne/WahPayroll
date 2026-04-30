import React from "react";
import Toast from "@/components/Toast";
import { useFileManagement } from "../hooks/useFileManagement";
import { FileManagementHeader } from "./FileManagementHeader";
import { EmployeeCard } from "./EmployeeCard";
import { FileTable } from "./FileTable";
import { EmployeeFilesModal } from "./EmployeeFilesModal";
import { TemplateModal } from "./TemplateModal";

const roleLabels = {
  Admin: "Admin Portal",
  HR: "HR Portal",
  Supervisor: "Supervisor Portal",
  RankAndFile: "Employee Portal",
};

export const FileManagement: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    designationFilter,
    setDesignationFilter,
    isTemplatesOpen,
    setIsTemplatesOpen,
    isReplacing,
    isUploadingTemplate,
    isReplacingTemplate,
    isRemoving,
    selectedEmployee,
    modalSourceFilter,
    setModalSourceFilter,
    templateTitle,
    setTemplateTitle,
    templateCategory,
    setTemplateCategory,
    toast,
    setToast,
    fileInputRef,
    templateInputRef,
    templateReplaceInputRef,
    role,
    isCardLayout,
    canManageTemplates,
    canArchive,
    isLoading,
    isError,
    refetch,
    uploadedTemplates,
    isLoadingTemplates,
    designationOptions,
    employeeCards,
    filteredFiles,
    modalSourceCounts,
    modalFileGroups,
    handlePreview,
    handleDownload,
    openReplacePicker,
    openEmployeeModal,
    closeEmployeeModal,
    downloadUploadedTemplate,
    handleDeleteTemplate,
    openTemplateReplacePicker,
    handleTemplateReplaceChange,
    handleTemplateUpload,
    handleReplaceChange,
    handleRemove,
    isArchiving,
    handleArchive,
    handlePermanentDelete,
    isArchivingTemplate,
    handleArchiveTemplate,
    showArchived,
    setShowArchived,
    counts,
  } = useFileManagement();

  const stats = [
    { label: "Active Files", value: counts.active },
    { label: "Archived Files", value: counts.archived },
    { label: "Templates", value: uploadedTemplates.length },
  ];

  if (isLoading) {
    return <div className="p-6 font-bold text-gray-800">Loading file inventory...</div>;
  }

  if (isError) {
    return <div className="p-6 font-bold text-red-600">Failed to load file inventory.</div>;
  }

  return (
    <div className="max-w-full space-y-6">
      <FileManagementHeader
        role={role}
        roleLabels={roleLabels}
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        designationFilter={designationFilter}
        setDesignationFilter={setDesignationFilter}
        designationOptions={designationOptions}
        onRefresh={() => refetch()}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        counts={counts}
        canArchive={canArchive}
      />

      {isCardLayout && employeeCards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center text-slate-600 dark:text-gray-400 shadow-sm">
          <p className="m-0 text-lg font-semibold text-slate-800 dark:text-gray-200">
            No employees are available in this scope.
          </p>
        </div>
      ) : !isCardLayout && filteredFiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center text-slate-600 dark:text-gray-400 shadow-sm">
          <p className="m-0 text-lg font-semibold text-slate-800 dark:text-gray-200">
            No files match your filters.
          </p>
        </div>
      ) : isCardLayout ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {employeeCards.map(({ employee, files }) => (
            <EmployeeCard
              key={employee.emp_id}
              employee={employee}
              employeeFiles={files}
              onClick={openEmployeeModal}
            />
          ))}
        </div>
      ) : (
        <FileTable
          files={filteredFiles}
          onDownload={handleDownload}
          onReplace={openReplacePicker}
          onRemove={handleRemove}
          onArchive={handleArchive}
          onDelete={handlePermanentDelete}
          canArchive={canArchive}
          showArchived={showArchived}
          role={role}
        />
      )}

      <EmployeeFilesModal
        employee={selectedEmployee}
        onClose={closeEmployeeModal}
        modalSourceFilter={modalSourceFilter}
        setModalSourceFilter={setModalSourceFilter}
        modalSourceCounts={modalSourceCounts}
        modalFileGroups={modalFileGroups}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onReplace={openReplacePicker}
        onRemove={handleRemove}
        onArchive={handleArchive}
        onDelete={handlePermanentDelete}
        showArchived={showArchived}
        canArchive={canArchive}
      />

      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        canManageTemplates={canManageTemplates}
        templateTitle={templateTitle}
        setTemplateTitle={setTemplateTitle}
        templateCategory={templateCategory}
        setTemplateCategory={setTemplateCategory}
        isUploadingTemplate={isUploadingTemplate}
        onUploadClick={() => templateInputRef.current?.click()}
        isLoadingTemplates={isLoadingTemplates}
        uploadedTemplates={uploadedTemplates}
        onDownload={downloadUploadedTemplate}
        onReplace={openTemplateReplacePicker}
        onDelete={handleDeleteTemplate}
        isReplacingTemplate={isReplacingTemplate}
        onArchive={handleArchiveTemplate}
        isArchivingTemplate={isArchivingTemplate}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleReplaceChange}
      />
      <input
        ref={templateInputRef}
        type="file"
        className="hidden"
        onChange={handleTemplateUpload}
      />
      <input
        ref={templateReplaceInputRef}
        type="file"
        className="hidden"
        onChange={handleTemplateReplaceChange}
      />

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      {(isReplacing || isRemoving || isArchiving || isArchivingTemplate) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
          <div className="rounded-2xl bg-white dark:bg-gray-800 px-5 py-4 text-sm font-semibold text-slate-700 dark:text-gray-200 shadow-lg border dark:border-gray-700">
            {isReplacing
              ? "Replacing file..."
              : isRemoving
              ? "Removing file..."
              : isArchiving || isArchivingTemplate
              ? "Archiving..."
              : "Processing..."}
          </div>
        </div>
      )}
    </div>
  );
};
